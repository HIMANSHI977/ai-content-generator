# AI Content Generator

A responsive AI writing workspace powered by Google's Gemini API, with Ask AI, Summarize Text, Generate Ideas, and Define a Term tools. Includes persistent Light/Dark mode.

## Requirements

- Node.js 20 or newer
- A Gemini API key from Google AI Studio

## Run locally

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create your local environment file:

   ```bash
   cp .env.example .env
   ```

3. Open `.env` and replace `your_new_gemini_api_key_here` with your new Gemini API key. Never commit `.env`.

4. Start the app:

   ```bash
   npm run dev
   ```

5. Open http://localhost:3000

## Deploy to Vercel

1. Push this project to a GitHub repository.
2. Import the repository into Vercel.
3. In Vercel Build & Development Settings, use the repository root (`./`) as Root Directory. Disable the Build Command and Output Directory overrides.
4. Add these environment variables under Project Settings → Environment Variables:
   - `GEMINI_API_KEY`: your valid Gemini API key
   - `GEMINI_MODEL`: `gemini-2.5-flash`
5. Redeploy after setting the environment variables.

The included `vercel.json` configures the Express server as a Vercel Node function. The server serves the frontend from `public/` and exposes `POST /api/generate`.

## Security

- Keep the real key in `.env` locally or in Vercel Environment Variables.
- Never put a real key in `.env.example`, browser JavaScript, or committed files.
- If a key has been exposed, revoke it and generate a replacement.
