# Agentic RAG Chatbot - Frontend Documentation

## Overview
This is a Next.js frontend for the Agentic RAG Chatbot system. The frontend provides a sleek, ChatGPT-inspired interface for document upload, question answering, and chat history management.

## Pages

### 1. Login Page (`/`)
- **Route**: `http://localhost:3000/`
- **Features**:
  - Email and password authentication
  - Form validation
  - Loading states
  - Error handling
  - Link to registration page

### 2. Register Page (`/register`)
- **Route**: `http://localhost:3000/register`
- **Features**:
  - Username, email, and password fields
  - Password confirmation
  - Client-side validation (min 8 characters, password match)
  - Link back to login page

### 3. Chat Page (`/chat`)
- **Route**: `http://localhost:3000/chat`
- **Features**:
  - Collapsible sidebar with chat history and documents
  - File upload with progress tracking
  - Real-time chat interface
  - Expandable citations/provenance panel
  - Message history
  - Typing indicators
  - Logout functionality

## Flask API Endpoints to Implement

### Authentication Endpoints

#### 1. POST `/api/auth/login`
**Purpose**: Authenticate user and return token

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "userpassword123"
}
```

**Success Response** (200):
```json
{
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "username": "johndoe"
  },
  "token": "jwt_token_here"
}
```

**Error Response** (401):
```json
{
  "message": "Invalid credentials. Please try again."
}
```

---

#### 2. POST `/api/auth/register`
**Purpose**: Create new user account

**Request Body**:
```json
{
  "username": "johndoe",
  "email": "user@example.com",
  "password": "userpassword123"
}
```

**Success Response** (201):
```json
{
  "message": "Account created successfully",
  "user_id": "user_123"
}
```

**Error Response** (400):
```json
{
  "message": "Email already exists"
}
```

---

### Document Management Endpoints

#### 3. POST `/api/upload`
**Purpose**: Upload PDF/EPUB/TXT document for processing

**Headers**:
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body** (FormData):
- `file`: File object
- `title`: Document title (optional, defaults to filename)

**Success Response** (200):
```json
{
  "doc_id": "doc_456",
  "job_id": "ingest_job_789",
  "message": "Upload successful, processing started"
}
```

**Error Response** (400):
```json
{
  "message": "Invalid file format. Only PDF, EPUB, and TXT are supported."
}
```

---

#### 4. GET `/api/upload/status/<job_id>`
**Purpose**: Poll upload/processing status

**Headers**:
```
Authorization: Bearer <token>
```

**Success Response** (200):
```json
{
  "status": "processing",  // or "completed", "failed"
  "progress": 75,          // 0-100
  "message": "Extracting text from pages..."
}
```

---

#### 5. GET `/api/documents`
**Purpose**: Get all documents for logged-in user

**Headers**:
```
Authorization: Bearer <token>
```

**Success Response** (200):
```json
{
  "documents": [
    {
      "id": "doc_456",
      "title": "Machine Learning Basics.pdf",
      "status": "ready",     // "uploading", "processing", "ready", "error"
      "progress": 100,
      "upload_time": "2025-12-13T10:30:00Z",
      "num_pages": 250
    }
  ]
}
```

---

### Chat Endpoints

#### 6. POST `/api/query`
**Purpose**: Send question and get AI response

**Headers**:
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "query": "What is the main argument in chapter 3?",
  "scope": "auto",           // or "book:<id>", "chapter:<id>", "all"
  "chat_id": "chat_123"      // optional, for continuing conversation
}
```

**Success Response** (200):
```json
{
  "answer_id": "ans_999",
  "answer_text": "The main argument in chapter 3 is...",
  "confidence": 0.85,
  "citations": [
    {
      "doc_id": "doc_456",
      "page": 42,
      "chunk_id": "chunk_789",
      "snippet": "The author argues that..."
    }
  ],
  "used_strategy": "multi-stage-retrieval"
}
```

**Error Response** (400):
```json
{
  "message": "No documents found. Please upload documents first."
}
```

---

#### 7. GET `/api/chat/history`
**Purpose**: Get user's chat history

**Headers**:
```
Authorization: Bearer <token>
```

**Success Response** (200):
```json
{
  "history": [
    {
      "id": "chat_123",
      "title": "Questions about ML chapter 3",
      "last_message": "2025-12-13T11:45:00Z"
    }
  ]
}
```

---

#### 8. GET `/api/chat/<chat_id>`
**Purpose**: Load specific chat conversation

**Headers**:
```
Authorization: Bearer <token>
```

**Success Response** (200):
```json
{
  "chat_id": "chat_123",
  "messages": [
    {
      "id": "msg_001",
      "role": "user",
      "content": "What is machine learning?",
      "timestamp": "2025-12-13T11:30:00Z"
    },
    {
      "id": "msg_002",
      "role": "assistant",
      "content": "Machine learning is...",
      "citations": [...],
      "timestamp": "2025-12-13T11:30:15Z"
    }
  ]
}
```

---

### Optional Endpoints (for future features)

#### 9. POST `/api/summarize`
**Purpose**: Generate summary of document/chapter

**Request Body**:
```json
{
  "doc_ids": ["doc_456"],
  "level": "chapter",        // or "book"
  "format": "bullet"         // or "paragraph"
}
```

**Success Response** (200):
```json
{
  "summary": "Chapter 1: Introduction\n- Main point 1\n- Main point 2...",
  "summary_id": "sum_555"
}
```

---

#### 10. GET `/api/document/<doc_id>/chapters`
**Purpose**: Get chapter list and summaries

**Success Response** (200):
```json
{
  "chapters": [
    {
      "id": "ch_001",
      "title": "Introduction",
      "start_page": 1,
      "end_page": 15,
      "summary": "This chapter introduces..."
    }
  ]
}
```

---

## Frontend Data Flow

### Login Flow
1. User enters email/password
2. Frontend calls `POST /api/auth/login`
3. Backend validates credentials
4. Backend returns user object + JWT token
5. Frontend stores in `localStorage`
6. Frontend redirects to `/chat`

### Registration Flow
1. User enters username, email, password
2. Frontend validates (password length, match)
3. Frontend calls `POST /api/auth/register`
4. Backend creates user in database
5. Backend returns success
6. Frontend redirects to login with success message

### Upload Flow
1. User selects file
2. Frontend creates FormData with file
3. Frontend calls `POST /api/upload`
4. Backend returns `doc_id` and `job_id`
5. Frontend polls `GET /api/upload/status/<job_id>` every 2 seconds
6. Frontend updates progress bar
7. When status = "completed", mark document as ready

### Query Flow
1. User types question and submits
2. Frontend adds user message to chat
3. Frontend shows typing indicator
4. Frontend calls `POST /api/query`
5. Backend processes query (retrieval + LLM)
6. Backend returns answer with citations
7. Frontend displays answer with expandable citations

---

## Environment Setup

### Install Dependencies
```bash
cd frontend
npm install
```

### Run Development Server
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### Build for Production
```bash
npm run build
npm start
```

---

## File Structure

```
frontend/
├── app/
│   ├── page.tsx              # Login page
│   ├── login.css             # Login page styles
│   ├── layout.tsx            # Root layout
│   ├── globals.css           # Global styles
│   ├── register/
│   │   ├── page.tsx          # Register page
│   │   └── register.css      # Register page styles
│   └── chat/
│       ├── page.tsx          # Main chat interface
│       └── chat.css          # Chat page styles
├── package.json
└── README.md
```

---

## Authentication

The frontend uses JWT tokens stored in `localStorage`:
- `localStorage.getItem('token')` - JWT token
- `localStorage.getItem('user')` - User object (JSON string)

All authenticated API calls include:
```
Authorization: Bearer <token>
```

---

## Styling

The app uses **pure CSS** with CSS variables for theming:

**Color Scheme**:
- `--bg-primary`: #f7f7f8 (light gray background)
- `--bg-secondary`: #ffffff (white cards)
- `--text-primary`: #0d0d0d (dark text)
- `--accent-primary`: #10a37f (green accent, ChatGPT-inspired)
- `--border-color`: #d9d9e3 (subtle borders)

**Font**: Inter (Google Fonts)

---

## Key Features Implemented

✅ **Login/Register** - Full authentication flow  
✅ **File Upload** - With real-time progress tracking  
✅ **Chat Interface** - ChatGPT-inspired design  
✅ **Sidebar** - Documents and chat history  
✅ **Citations** - Expandable provenance panel  
✅ **Typing Indicators** - Loading states  
✅ **Responsive Design** - Mobile-friendly  
✅ **Error Handling** - User-friendly error messages  

---

## Next Steps for Backend Integration

1. **Set up Flask CORS** to allow requests from `http://localhost:3000`
2. **Implement authentication** endpoints with JWT
3. **Create database models** for users, documents, chats, messages
4. **Implement file upload** with background job processing
5. **Build RAG pipeline** for query processing
6. **Add citation extraction** to return source references

---

## Testing the Frontend

You can test the frontend with mock data before the backend is ready:

1. Comment out the API calls
2. Use mock data in state
3. Test UI interactions and styling

Example mock data is already structured in the TypeScript interfaces.

---

## Support

For questions or issues, refer to the project documentation or contact the development team.
