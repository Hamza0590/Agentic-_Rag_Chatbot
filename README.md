# 🤖 Agentic RAG Chatbot

A powerful Retrieval-Augmented Generation (RAG) chatbot built with **LangGraph**, **Pinecone**, and **Next.js**. Upload PDF documents and ask intelligent questions powered by AI agents that can search both your documents and the web.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.10+-blue.svg)
![Next.js](https://img.shields.io/badge/next.js-16.0-black.svg)

## ✨ Features

### 🎯 Core Functionality
- **📄 PDF Document Upload**: Upload and process PDF files with intelligent chunking
- **🔍 Smart Search**: AI-powered search across uploaded documents
- **🌐 Web Search Integration**: DuckDuckGo search for real-time information
- **💬 Conversational AI**: Context-aware responses using LangGraph agents
- **🗑️ Document Management**: Delete documents and their vector embeddings
- **👤 User Authentication**: Secure login/register system with session management
- **📊 Real-time Progress**: Live upload progress tracking
- **💾 Persistent Storage**: Documents persist across sessions

### 🛠️ Technical Features
- **Agentic Architecture**: LangGraph-based agent workflow
- **Vector Search**: Pinecone vector database for semantic search
- **Token-Accurate Chunking**: Smart PDF chunking with sentence boundaries
- **Multi-User Support**: Isolated document spaces per user
- **RESTful API**: Clean Flask backend with blueprints
- **Modern UI**: Responsive Next.js frontend with TypeScript

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Auth UI    │  │   Chat UI    │  │  Upload UI   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ▼ HTTP/REST
┌─────────────────────────────────────────────────────────────┐
│                      Backend (Flask)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Auth Routes │  │  Chat Routes │  │Upload Routes │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                            ▼                                 │
│                   ┌──────────────────┐                       │
│                   │ LangGraph Agent  │                       │
│                   │  ┌────┐  ┌────┐  │                       │
│                   │  │PDF │  │Web │  │                       │
│                   │  │Tool│  │Tool│  │                       │
│                   │  └────┘  └────┘  │                       │
│                   └──────────────────┘                       │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    External Services                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Pinecone   │  │     Groq     │  │  DuckDuckGo  │      │
│  │ Vector Store │  │   LLM API    │  │    Search    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 Prerequisites

- **Python**: 3.10 or higher
- **Node.js**: 18.0 or higher
- **npm**: 9.0 or higher
- **Pinecone Account**: [Sign up here](https://www.pinecone.io/)
- **Groq API Key**: [Get it here](https://console.groq.com/)

---

## 🚀 Installation

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/Hamza0590/Agentic-_Rag_Chatbot.git
cd Agentic_project
```

### 2️⃣ Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment (recommended)
python -m venv venv

# Activate virtual environment
# Windows:
.\venv\Scripts\Activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3️⃣ Frontend Setup

```bash
# Navigate to frontend directory
cd ../frontend

# Install dependencies
npm install
```

### 4️⃣ Environment Configuration

Create a `.env` file in the **backend** directory:

```env
# Pinecone Configuration
PINECONE_API_KEY=your_pinecone_api_key_here

# Groq API Configuration
GROQ_API_KEY=your_groq_api_key_here

# Flask Configuration
SECRET_KEY=your_secret_key_change_this_in_production
FLASK_ENV=development
```

**⚠️ Important**: Replace the placeholder values with your actual API keys.

---

## 🎮 Running the Application

### Option 1: Run Both Servers Together (Recommended)

```bash
# From the frontend directory
npm run dev:all
```

This command starts:
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5000

### Option 2: Run Servers Separately

**Terminal 1 - Backend:**
```bash
cd backend
flask run
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

---

## 📖 Usage Guide

### 1. **Register/Login**
- Navigate to `http://localhost:3000`
- Create a new account or login with existing credentials

### 2. **Upload Documents**
- Click the **Upload Document** button or the **+** icon in the sidebar
- Select a PDF file (supports `.pdf`, `.epub`, `.txt`)
- Watch the real-time upload progress
- Document will appear in the sidebar once ready

### 3. **Ask Questions**
- Type your question in the chat input
- The AI will automatically:
  - Search your uploaded documents for relevant information
  - Search the web if needed for current information
  - Provide a comprehensive answer with citations

### 4. **Manage Documents**
- View all uploaded documents in the sidebar
- Click the **trash icon** to delete a document
- Deletion removes both the document and its vector embeddings

### 5. **Logout**
- Click the **Logout** button
- All your document vectors are automatically cleaned up

---

## 🔧 API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register` | Register a new user |
| POST | `/login` | Login existing user |
| POST | `/logout` | Logout and cleanup vectors |

### Document Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/upload_file` | Upload and process PDF |
| DELETE | `/delete_document` | Delete document and vectors |

### Chat

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/chat` | Send query and get AI response |

---

## 🧠 How It Works

### PDF Processing Pipeline

1. **Upload**: User uploads PDF via frontend
2. **Chunking**: PDF is split into semantic chunks (500 tokens max)
3. **Embedding**: Chunks are converted to vector embeddings using HuggingFace
4. **Storage**: Vectors stored in Pinecone with metadata (source, page, user)
5. **Ready**: Document available for querying

### Query Processing Pipeline

1. **User Query**: User asks a question
2. **Agent Decision**: LangGraph agent decides which tool to use:
   - **PDF Tool**: Search uploaded documents
   - **Web Tool**: Search DuckDuckGo
3. **Retrieval**: Relevant information retrieved
4. **Generation**: LLM generates answer using retrieved context
5. **Response**: Answer sent back to user with citations

---

## 🗂️ Project Structure

```
Agentic_project/
├── backend/
│   ├── app/
│   │   ├── __init__.py              # Flask app initialization
│   │   ├── models.py                # Database models
│   │   ├── langraph_pipeline.py     # LangGraph agent setup
│   │   └── routes/
│   │       ├── auth.py              # Authentication routes
│   │       ├── chat.py              # Chat routes
│   │       └── upload.py            # Upload & delete routes
│   ├── instance/
│   │   └── chatbot.db               # SQLite database
│   ├── main.py                      # Flask entry point
│   └── requirements.txt             # Python dependencies
│
├── frontend/
│   ├── app/
│   │   ├── page.tsx                 # Landing/Auth page
│   │   ├── chat/
│   │   │   ├── page.tsx             # Chat interface
│   │   │   └── chat.css             # Chat styles
│   │   ├── globals.css              # Global styles
│   │   └── layout.tsx               # Root layout
│   ├── package.json                 # Node dependencies
│   └── tsconfig.json                # TypeScript config
│
├── .env                             # Environment variables
└── README.md                        # This file
```

---

## 🛡️ Security Considerations

- ✅ User authentication with session management
- ✅ User-isolated document storage (session_id filtering)
- ✅ API key protection via environment variables
- ✅ CORS enabled for frontend-backend communication
- ⚠️ **Note**: Current implementation uses plain text passwords (use bcrypt in production)
- ⚠️ **Note**: Change `SECRET_KEY` in production

---

## 🔑 Key Technologies

### Backend
- **Flask**: Web framework
- **LangGraph**: Agent orchestration framework
- **LangChain**: LLM integration
- **Pinecone**: Vector database
- **HuggingFace**: Embeddings model
- **Groq**: LLM API (GPT-OSS-120B)
- **pdfplumber**: PDF text extraction
- **tiktoken**: Token counting
- **SQLAlchemy**: ORM for user management

### Frontend
- **Next.js 16**: React framework
- **TypeScript**: Type safety
- **React Markdown**: Markdown rendering
- **Tailwind CSS**: Styling
- **XMLHttpRequest**: Upload progress tracking

---

## 📊 Features in Detail

### Smart PDF Chunking
- **Token-accurate**: Uses tiktoken for precise token counting
- **Sentence-based**: Respects sentence boundaries
- **Overlap**: 75-token overlap for context preservation
- **Chapter detection**: Identifies chapter boundaries
- **Metadata**: Tracks page numbers and source

### Agentic Workflow
```python
# LangGraph agent with two tools:
- search_pdfs: Searches uploaded documents
- search_ddgo: Searches the web

# Agent automatically decides which tool to use based on query
```

### Vector Search
- **Similarity search**: Finds top-k most relevant chunks
- **User filtering**: Only searches user's documents
- **Metadata filtering**: Filter by source, page, chapter

---

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check if port 5000 is available
netstat -ano | findstr :5000

# Try a different port
flask run --port 5001
```

### Frontend won't start
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Upload fails
- Check file size (large PDFs may timeout)
- Verify Pinecone API key is correct
- Check backend logs for errors

### No search results
- Verify documents are uploaded successfully
- Check if user email is being sent in headers
- Verify Pinecone index name is "books-index"

---

## 🚧 Future Enhancements

- [ ] Password hashing with bcrypt
- [ ] JWT authentication
- [ ] Multiple file upload
- [ ] Chat history persistence
- [ ] Export chat conversations
- [ ] Support for more file formats (DOCX, TXT, EPUB)
- [ ] Streaming responses
- [ ] Citation highlighting
- [ ] Dark/Light theme toggle
- [ ] Mobile responsive improvements

---

## 📝 License

This project is licensed under the MIT License.

---

## 👨‍💻 Author

**Hamza**
- GitHub: [@Hamza0590](https://github.com/Hamza0590)
- Repository: [Agentic-_Rag_Chatbot](https://github.com/Hamza0590/Agentic-_Rag_Chatbot)

---

## 🙏 Acknowledgments

- **LangChain** for the amazing LLM framework
- **Pinecone** for vector database
- **Groq** for fast LLM inference
- **Vercel** for Next.js framework

---

## 📞 Support

If you encounter any issues or have questions:
1. Check the [Troubleshooting](#-troubleshooting) section
2. Open an issue on GitHub
3. Review the code documentation

---

**⭐ If you find this project helpful, please give it a star!**
