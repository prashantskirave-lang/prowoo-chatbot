# How to Deploy ProWoo Chatbot

To get a **permanent link** that works 24/7, you need to deploy your chatbot to a hosting service. **Render** is a great free option for this type of application.

## Step 1: Push to GitHub
1. Create a new repository on [GitHub](https://github.com/new).
2. Run these commands in your terminal to push your code:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   # Replace <YOUR_REPO_URL> with the one from GitHub (e.g., https://github.com/username/prowoo-bot.git)
   git remote add origin <YOUR_REPO_URL>
   git push -u origin main
   ```

## Step 2: Deploy on Render
1. Go to [Render.com](https://render.com/) and sign up/login.
2. Click **"New +"** and select **"Web Service"**.
3. Connect your GitHub account and select the **prowoo-bot** repository.
4. Render will automatically detect the settings:
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
5. **Important**: Scroll down to **"Environment Variables"** and add your API Key:
   - Key: `GEMINI_API_KEY`
   - Value: `(Your Gemini API Key from .env)`
6. Click **"Create Web Service"**.

## Step 3: Done!
Once the deployment finishes (1-2 minutes), Render will give you a permanent URL like `https://prowoo-bot.onrender.com`. You can share this link with your client.
