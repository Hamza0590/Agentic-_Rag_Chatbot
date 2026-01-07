# 🚀 Quick Start Guide

Get your Agentic RAG Chatbot running in 5 minutes!

## Prerequisites Checklist
- [ ] Python 3.10+ installed
- [ ] Node.js 18+ installed
- [ ] Pinecone account created
- [ ] Groq API key obtained

---

## Step 1: Clone & Navigate
```bash
git clone https://github.com/Hamza0590/Agentic-_Rag_Chatbot.git
cd Agentic_project
```

## Step 2: Backend Setup
```bash
cd backend
python -m venv venv
.\venv\Scripts\Activate  # Windows
# source venv/bin/activate  # macOS/Linux
pip install -r requirements.txt
```

## Step 3: Configure Environment
Create `backend/.env`:
```env
PINECONE_API_KEY=your_pinecone_key
GROQ_API_KEY=your_groq_key
SECRET_KEY=change_this_secret_key
```

## Step 4: Frontend Setup
```bash
cd ../frontend
npm install
```

## Step 5: Run Application
```bash
npm run dev:all
```

## Step 6: Access Application
Open browser: http://localhost:3000

---

## First Time Usage

1. **Register** a new account
2. **Upload** a PDF document
3. **Ask** questions about your document
4. **Enjoy** AI-powered answers!

---

## Common Issues

**Port 5000 already in use?**
```bash
# Kill the process
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

**Module not found?**
```bash
# Reinstall dependencies
pip install -r requirements.txt
```

**Upload not working?**
- Check your Pinecone API key
- Verify index name is "books-index"
- Check backend console for errors

---

## Need Help?
Check the main [README.md](README.md) for detailed documentation.
