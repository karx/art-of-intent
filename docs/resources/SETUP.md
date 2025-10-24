# Setup Guide

## Quick Start

### 1. Get a Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key

### 2. Configure the API Key

**Option A: For Development (Quick & Easy)**

Edit `config.js` and replace the placeholder:

```javascript
GEMINI_API_KEY: 'your_actual_api_key_here',
```

⚠️ **Warning**: This exposes your API key in client-side code. Only use for local development.

**Option B: For Production (Recommended)**

Create a backend proxy to hide your API key:

1. Set up a serverless function (Vercel, Netlify, or AWS Lambda)
2. Store API key as environment variable on the server
3. Update `config.js` to point to your proxy endpoint
4. Proxy forwards requests to Gemini API

Example proxy endpoint:
```javascript
// In config.js
GEMINI_API_URL: 'https://your-domain.com/api/gemini',
GEMINI_API_KEY: '', // Not needed with proxy
```

### 3. Start the Development Server

```bash
python3 -m http.server 8000
```

Open [http://localhost:8000](http://localhost:8000) in your browser.

### 4. Play the Game!

1. Read the target words you need to guide Arty to say
2. Avoid using any blacklisted words in your prompts
3. Type your prompt and click "Send Prompt"
4. Arty will respond with a haiku
5. Check if your target words appear in the response
6. Keep trying until you match all 3 words!

---

## Environment Variables (Optional)

For more advanced setups, you can use environment variables:

### Create .env file

```bash
cp .env_example .env
```

Edit `.env`:
```
GEMINI_API_KEY=your_actual_api_key_here
```

### Load Environment Variables

You'll need a build tool or server to inject environment variables into the client:

**Using Vite:**
```bash
npm install vite
```

**Using Webpack:**
```bash
npm install webpack webpack-cli dotenv-webpack
```

**Using Node.js Server:**
```javascript
// server.js
require('dotenv').config();
app.get('/config', (req, res) => {
  res.json({ GEMINI_API_KEY: process.env.GEMINI_API_KEY });
});
```

---

## Security Best Practices

### ⚠️ Never Commit API Keys

- API keys are in `.gitignore`
- Use `.env_example` as a template
- Share setup instructions, not actual keys

### 🔒 Production Deployment

For production, **always** use a backend proxy:

1. **Serverless Function Example (Vercel)**

```javascript
// api/gemini.js
export default async function handler(req, res) {
  const response = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': process.env.GEMINI_API_KEY
      },
      body: JSON.stringify(req.body)
    }
  );
  
  const data = await response.json();
  res.json(data);
}
```

2. **Update config.js**

```javascript
GEMINI_API_URL: '/api/gemini',
GEMINI_API_KEY: '', // Not needed
```

### 🛡️ Rate Limiting

Implement rate limiting to prevent abuse:

```javascript
// In your backend
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/gemini', limiter);
```

---

## Troubleshooting

### API Key Not Working

1. Check if the key is correctly set in `config.js`
2. Verify the key is valid in [Google AI Studio](https://makersuite.google.com/app/apikey)
3. Check browser console for error messages
4. Ensure you have API quota remaining

### CORS Errors

If you see CORS errors:
- Use a backend proxy (recommended)
- Or enable CORS in your development server
- Gemini API supports direct browser requests, but production should use a proxy

### Game Not Loading

1. Check browser console for errors
2. Verify `config.js` is loaded before `game.js`
3. Clear browser cache and localStorage
4. Try a different browser

### Voice Input Not Working

Voice input requires:
- HTTPS connection (or localhost)
- Browser support (Chrome, Edge, Safari)
- Microphone permissions granted

---

## Development

### File Structure

```
art-of-intent/
├── index.html          # Main game interface
├── game.js            # Game logic and API integration
├── config.js          # Configuration management
├── styles.css         # Styling
├── README.md          # Project overview
├── SETUP.md           # This file
├── TRACKING.md        # Analytics documentation
├── AGENTS.md          # Development guidelines
├── PROJECT_STATUS.md  # Current state and wishlist
├── .env_example       # Environment template
└── .gitignore         # Git ignore rules
```

### Making Changes

1. Edit files locally
2. Refresh browser to see changes
3. Check console for errors
4. Test all features before committing

### Adding Features

See [PROJECT_STATUS.md](./PROJECT_STATUS.md) for the wishlist and roadmap.

---

## Support

For issues or questions:
1. Check the documentation files
2. Review browser console errors
3. Verify API key configuration
4. Check [Gemini API documentation](https://ai.google.dev/docs)

---

## Next Steps

- [ ] Configure your API key
- [ ] Play a few rounds
- [ ] Export your session data
- [ ] Check out the wishlist in PROJECT_STATUS.md
- [ ] Contribute improvements!
