# 📡 API Documentation

Complete API reference for the Agentic RAG Chatbot backend.

**Base URL**: `http://localhost:5000`

---

## 🔐 Authentication Endpoints

### Register User
Create a new user account.

**Endpoint**: `POST /register`

**Request Body**:
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "secure_password"
}
```

**Success Response** (200):
```json
{
  "message": "Register successful",
  "user_id": 1
}
```

**Error Response** (400):
```json
{
  "error": "User already exists"
}
```

---

### Login User
Authenticate an existing user.

**Endpoint**: `POST /login`

**Request Body**:
```json
{
  "email": "john@example.com",
  "password": "secure_password"
}
```

**Success Response** (200):
```json
{
  "message": "Login successful",
  "user_id": 1
}
```

**Error Response** (400):
```json
{
  "error": "Invalid email or password"
}
```

---

### Logout User
Logout user and cleanup their vectors.

**Endpoint**: `POST /logout`

**Request Headers**:
```
Content-Type: application/json
Authorization: Bearer <token>
```

**Request Body**:
```json
{
  "email": "john@example.com"
}
```

**Success Response** (200):
```json
{
  "message": "Logged out successfully"
}
```

**Note**: This endpoint deletes all user's vectors from Pinecone.

---

## 📄 Document Management Endpoints

### Upload Document
Upload and process a PDF document.

**Endpoint**: `POST /upload_file`

**Request Headers**:
```
Authorization: Bearer <token>
email: john@example.com
```

**Request Body** (multipart/form-data):
```
file: <PDF file>
title: document.pdf
```

**Success Response** (200):
```json
{
  "doc_id": "doc_1704614400",
  "job_id": "job_1704614400",
  "message": "File uploaded successfully"
}
```

**Error Responses**:

400 - No file uploaded:
```json
{
  "error": "No file uploaded"
}
```

401 - Authentication required:
```json
{
  "error": "User authentication required"
}
```

**Processing Steps**:
1. File saved to temporary location
2. PDF chunked into semantic segments
3. Chunks embedded using HuggingFace
4. Vectors stored in Pinecone with metadata
5. Temporary file deleted

---

### Delete Document
Delete a document and its vector embeddings.

**Endpoint**: `DELETE /delete_document`

**Request Headers**:
```
Content-Type: application/json
Authorization: Bearer <token>
email: john@example.com
```

**Request Body**:
```json
{
  "filename": "document.pdf"
}
```

**Success Response** (200):
```json
{
  "message": "Successfully deleted all vectors for document.pdf",
  "filename": "document.pdf"
}
```

**Error Responses**:

400 - Missing filename:
```json
{
  "error": "Filename is required"
}
```

401 - Authentication required:
```json
{
  "error": "User authentication required"
}
```

500 - Server error:
```json
{
  "error": "Failed to delete document: <error_message>"
}
```

**Note**: Deletes only vectors belonging to the authenticated user.

---

## 💬 Chat Endpoint

### Send Chat Query
Send a query and get AI-generated response.

**Endpoint**: `POST /chat`

**Request Headers**:
```
Content-Type: application/json
Authorization: Bearer <token>
email: john@example.com
```

**Request Body**:
```json
{
  "query": "What is the main topic of the document?",
  "scope": "auto"
}
```

**Success Response** (200):
```json
{
  "answer": "Based on the uploaded document, the main topic is..."
}
```

**Error Response** (400):
```json
{
  "error": "No query provided"
}
```

**How It Works**:
1. Query sent to LangGraph agent
2. Agent decides which tool to use:
   - `search_pdfs`: Search uploaded documents
   - `search_ddgo`: Search the web
3. Relevant information retrieved
4. LLM generates answer using context
5. Response returned to user

---

## 🔧 Request Examples

### Using cURL

**Register**:
```bash
curl -X POST http://localhost:5000/register \
  -H "Content-Type: application/json" \
  -d '{"username":"john","email":"john@example.com","password":"pass123"}'
```

**Login**:
```bash
curl -X POST http://localhost:5000/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"pass123"}'
```

**Upload File**:
```bash
curl -X POST http://localhost:5000/upload_file \
  -H "Authorization: Bearer <token>" \
  -H "email: john@example.com" \
  -F "file=@document.pdf" \
  -F "title=document.pdf"
```

**Chat**:
```bash
curl -X POST http://localhost:5000/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -H "email: john@example.com" \
  -d '{"query":"What is this document about?"}'
```

**Delete Document**:
```bash
curl -X DELETE http://localhost:5000/delete_document \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -H "email: john@example.com" \
  -d '{"filename":"document.pdf"}'
```

---

## 🔑 Authentication Flow

1. **Register** → Get user_id
2. **Login** → Get session token
3. **Use token** in Authorization header for all requests
4. **Include email** in header for document operations
5. **Logout** → Clear session and vectors

---

## 📊 Response Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad Request (missing parameters) |
| 401 | Unauthorized (authentication required) |
| 404 | Not Found |
| 500 | Internal Server Error |

---

## 🛡️ Security Notes

- All document operations require authentication
- User email used for data isolation
- Vectors filtered by `session_id` (user email)
- Logout automatically cleans up user vectors
- **Production**: Use HTTPS and proper token management

---

## 🧪 Testing with Postman

1. Import the endpoints
2. Set base URL: `http://localhost:5000`
3. Create environment variables:
   - `token`: Your auth token
   - `email`: Your user email
4. Test each endpoint sequentially

---

## 📝 Notes

- Maximum file size depends on server configuration
- PDF processing time varies with document size
- Vector search returns top 20 most relevant chunks
- Agent automatically selects appropriate tool
- All timestamps in Unix format

---

For more information, see the main [README.md](README.md).
