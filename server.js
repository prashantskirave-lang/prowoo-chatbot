const express = require('express');
const cors = require('cors');
const fs = require('fs');
const csv = require('csv-parser');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Quantity of history to keep can be managed by the client or limited here.
// For this demo, we trust the client to send a reasonable history.

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

let contextString = "";
const faqData = [];

// Load CSV Data
function loadData() {
    return new Promise((resolve, reject) => {
        fs.createReadStream('data/ProWoo_Chatbot_FAQ.csv')
            .pipe(csv())
            .on('data', (row) => {
                faqData.push(row);
            })
            .on('end', () => {
                // Construct the system context
                contextString = "You are 'ProBot', an intelligent and professional AI assistant for ProWoo Engineering Solutions. \n" +
                    "Your goal is to assist users by answering their questions accurately using ONLY the provided Knowledge Base below. \n" +
                    "If the answer is not explicitly in the Knowledge Base, politely apologize and state that you do not have that information, then suggest contracting contacting ProWoo at info@prowoo.in. \n" +
                    "Maintain a polite, professional, and helpful tone. \n\n" +
                    "### KNOWLEDGE BASE ###\n";

                faqData.forEach(item => {
                    contextString += `\n[Context: ${item.Context || 'General'}]\nQ: ${item.Question}\nA: ${item.Answer}\n`;
                });

                contextString += "\n### END OF KNOWLEDGE BASE ###\n\nNow, please answer the following question from the user.";
                console.log('Knowledge Base Loaded with ' + faqData.length + ' entries.');
                resolve();
            })
            .on('error', (err) => reject(err));
    });
}

// Initial load
loadData();

// Helper to normalize text
function normalize(text) {
    return text.toLowerCase().replace(/[^\w\s]/g, '');
}

app.post('/api/chat', async (req, res) => {
    try {
        const { message, history } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        const userMsgNormalized = normalize(message);

        // 1. Local Lookup / Keyword Matching
        let bestMatch = null;
        let maxScore = 0;

        // Stop words to ignore in matching
        // Stop words to ignore in matching
        const stopWords = new Set(['is', 'are', 'the', 'a', 'an', 'of', 'in', 'at', 'on', 'to', 'for', 'it', 'does', 'do', 'what', 'where', 'who', 'how', 'can', 'you', 'tell', 'me', 'i', 'please', 'we']);

        faqData.forEach(item => {
            let score = 0;
            // Check for exact question match (very high priority)
            const qNorm = item.Question ? normalize(item.Question) : '';
            if (qNorm === userMsgNormalized) {
                score += 1000;
            }

            // Check for keywords inclusion
            if (item.Keywords) {
                const keywords = item.Keywords.split(' ').map(k => normalize(k));
                keywords.forEach(k => {
                    if (k && !stopWords.has(k) && k.length > 1) {
                        const regex = new RegExp(`\\b${k}\\b`, 'i');
                        if (regex.test(userMsgNormalized)) {
                            // Rare/Longer words get more points
                            score += (5 + k.length);
                        }
                    }
                });
            }

            if (score > maxScore) {
                maxScore = score;
                bestMatch = item;
            } else if (score === maxScore && score > 0) {
                // If scores tie, pick the one with the longer question (often more specific)
                if (item.Question && bestMatch && item.Question.length > bestMatch.Question.length) {
                    bestMatch = item;
                }
            }
        });

        if (maxScore >= 10) {
            console.log(`Local match found: ${bestMatch.Question} (Score: ${maxScore})`);
            return res.json({ reply: bestMatch.Answer });
        }

        // 2. Fallback to Gemini API
        // Construct the chat history for Gemini
        // We start with the System Instruction (Context)
        // Gemini API `startChat` history format: array of { role: "user" | "model", parts: [{ text: "..." }] }

        const chatHistory = [
            {
                role: "user",
                parts: [{ text: contextString }]
            },
            {
                role: "model",
                parts: [{ text: "I understand. I am ProBot, and I am ready to assist with ProWoo Engineering Solutions inquiries based on the provided Knowledge Base." }]
            }
        ];

        // Append client-provided history if any
        if (history && Array.isArray(history)) {
            history.forEach(msg => {
                if ((msg.role === 'user' || msg.role === 'model') && msg.parts && msg.parts[0].text) {
                    chatHistory.push({
                        role: msg.role,
                        parts: [{ text: msg.parts[0].text }]
                    });
                }
            });
        }

        const chat = model.startChat({
            history: chatHistory,
            generationConfig: {
                maxOutputTokens: 500,
            },
        });

        const result = await chat.sendMessage(message);
        const response = await result.response;
        const text = response.text();

        res.json({ reply: text });

    } catch (error) {
        console.error("Error in chat endpoint:", error);
        // Log deep details if available
        if (error.response) {
            console.error("API Response Error:", JSON.stringify(error.response, null, 2));
        }
        res.status(500).json({ error: "Sorry, I'm having trouble connecting right now. Please try again later." });
    }
});

app.listen(port, () => {
    console.log(`ProWoo Chatbot Server listening at http://localhost:${port}`);
});
