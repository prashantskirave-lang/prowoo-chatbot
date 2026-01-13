const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const chatWindow = document.getElementById('chat-window');
const typingIndicator = document.getElementById('typing-indicator');

let chatHistory = [];

// Auto-focus input on load
window.addEventListener('load', () => {
    userInput.focus();
});

// Enable/Disable send button based on input
userInput.addEventListener('input', () => {
    sendBtn.disabled = userInput.value.trim() === '';
});

// Handle Form Submission
chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const message = userInput.value.trim();
    if (!message) return;

    // Add User Message to UI
    appendMessage('user', message);

    // Clear input
    userInput.value = '';
    sendBtn.disabled = true;

    // Show Typing Indicator
    showTyping(true);

    try {
        // Send to Backend
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message,
                history: chatHistory
            })
        });

        const data = await response.json();

        // Hide Typing Indicator
        showTyping(false);

        if (data.error) {
            appendMessage('bot', "I'm sorry, I'm having trouble connecting right now. Please try again.");
        } else {
            // Add Bot Response to UI
            const reply = data.reply;
            appendMessage('bot', reply);

            // Update History
            chatHistory.push({ role: 'user', parts: [{ text: message }] });
            chatHistory.push({ role: 'model', parts: [{ text: reply }] });

            // Limit history to last 20 turns to prevent massive payloads
            if (chatHistory.length > 20) {
                chatHistory = chatHistory.slice(chatHistory.length - 20);
            }
        }

    } catch (error) {
        console.error('Error:', error);
        showTyping(false);
        appendMessage('bot', "I'm sorry, something went wrong. Please check your connection.");
    }
});

function appendMessage(sender, text) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', sender === 'user' ? 'user-message' : 'bot-message');

    // Basic Markdown parsing for bold text (**text**)
    const formattedText = text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>');

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    messageDiv.innerHTML = `
        <div class="message-content">
            <p>${formattedText}</p>
        </div>
        <div class="message-timestamp">${timestamp}</div>
    `;

    chatWindow.appendChild(messageDiv);
    scrollToBottom();
}

function showTyping(show) {
    if (show) {
        typingIndicator.classList.add('active');
        scrollToBottom();
    } else {
        typingIndicator.classList.remove('active');
    }
}

function scrollToBottom() {
    chatWindow.scrollTop = chatWindow.scrollHeight;
}
