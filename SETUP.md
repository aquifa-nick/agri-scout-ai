# 🚀 Agri-Scout AI Setup Guide

## Quick Setup (5 minutes)

### 1. **Install Dependencies**
```bash
cd /Users/nickjohnston/agri-scout-ai
npm install
```

### 2. **Configure Your Gemini API Key**

Create a `.env` file in the project root:
```bash
cp env.example .env
```

Edit the `.env` file and add your Gemini API key:
```
GEMINI_API_KEY=your_actual_gemini_api_key_here
PORT=3000
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:3000
```

### 3. **Test Locally**
```bash
npm start
```

Open your browser to `http://localhost:3000` and test the app!

### 4. **Deploy to Vercel**

#### Option A: Command Line (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow the prompts:
# - Link to existing project? No
# - Project name: agri-scout-ai
# - Directory: ./
# - Override settings? No
```

#### Option B: GitHub Integration
1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Add environment variable `GEMINI_API_KEY` in Vercel dashboard

### 5. **Add Environment Variables to Vercel**

In your Vercel dashboard:
1. Go to your project settings
2. Click "Environment Variables"
3. Add:
   - `GEMINI_API_KEY` = your_actual_api_key
   - `NODE_ENV` = production

### 6. **Test Your Live App**

Your app will be available at: `https://your-project-name.vercel.app`

## 🔧 Architecture Overview

```
agri-scout-ai/
├── index.html          # Frontend (single-page app)
├── server.js           # Backend API server
├── package.json        # Dependencies
├── vercel.json         # Deployment config
├── .env               # Your API key (not in git)
├── env.example        # Template for .env
└── README.md          # Documentation
```

## 🌟 Features Enabled

- ✅ **Real AI Analysis** via Gemini API
- ✅ **Secure API Key** stored on backend
- ✅ **Field Mapping** with GPS and satellite imagery
- ✅ **Mobile-Optimized** interface
- ✅ **Error Handling** with graceful fallbacks
- ✅ **Production Ready** deployment

## 🐛 Troubleshooting

### Local Development Issues

**"Cannot find module" errors:**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Port already in use:**
```bash
# Change PORT in .env file to 3001 or another port
PORT=3001
```

**API key not working:**
- Verify your Gemini API key is correct
- Check the `.env` file is in the project root
- Restart the server after changing `.env`

### Deployment Issues

**Vercel deployment fails:**
- Ensure `vercel.json` is in project root
- Check build logs in Vercel dashboard
- Verify environment variables are set in Vercel

**AI analysis not working on deployed app:**
- Add `GEMINI_API_KEY` environment variable in Vercel dashboard
- Check function logs in Vercel for API errors
- Verify the API key has proper permissions

### Testing the API Directly

**Health check:**
```bash
curl http://localhost:3000/api/health
```

**Test analysis (with base64 image):**
```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"imageData":"data:image/jpeg;base64,/9j/4AAQ...", "context":"Test context"}'
```

## 📞 Support

If you encounter issues:
1. Check the browser console for error messages
2. Check server logs for API errors
3. Verify environment variables are set correctly
4. Test the health endpoint to ensure backend connectivity

## 🔒 Security Notes

- API key is stored securely on the backend
- CORS is configured for your domain
- File upload limits are enforced
- Input validation is implemented
- Error messages don't expose sensitive information
