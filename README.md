# 🤖 RAG PDF Assistant

An AI-powered **PDF Question Answering Assistant** that allows users to upload PDF documents and ask questions about their content using **Retrieval-Augmented Generation (RAG)**.

The application processes uploaded PDFs, converts their content into searchable vector embeddings, retrieves the most relevant document chunks for a user's question, and generates context-aware answers using an LLM.

---

## 🚀 Features

### 📄 PDF Management

* Upload PDF documents
* Extract text from PDFs
* Split documents into manageable chunks
* Generate embeddings for document chunks
* Store and search document vectors
* Display uploaded PDFs
* Show document chunk count
* Select an active document
* Delete uploaded documents

### 💬 AI Chat

* Ask questions about uploaded PDFs
* Context-aware AI responses
* Retrieval-Augmented Generation (RAG)
* Markdown response rendering
* GitHub-Flavored Markdown support
* Table rendering in AI responses
* AI response source references
* Loading state while generating answers

### 🗂️ Persistent Chat History

* Create new conversations
* Automatically create a chat session for the first question
* Save user messages in MongoDB
* Save AI responses in MongoDB
* Restore previous conversations
* Continue an existing conversation
* Delete chat sessions
* Chat history persists after page refresh

### 🔐 Authentication & Security

* User authentication
* User-specific documents
* User-specific chat sessions
* Protected API routes
* Session ownership validation
* Users can only access their own chats and documents

### 📱 Responsive UI

* Responsive dashboard
* Mobile-friendly layout
* Scrollable chat section
* Responsive PDF sidebar
* Modern chat interface
* Clean and minimal UI

---

## 🧠 How RAG Works

The application follows a Retrieval-Augmented Generation pipeline.

```text
                    📄 PDF Upload
                         │
                         ▼
                  Extract PDF Text
                         │
                         ▼
                    Text Splitting
                         │
                         ▼
                Generate Embeddings
                         │
                         ▼
                  Qdrant Vector DB
                         │
                         │
             ┌──────────┴──────────┐
             │                     │
             ▼                     │
        User Question              │
             │                     │
             ▼                     │
       Question Embedding          │
             │                     │
             ▼                     │
      Similarity Search ───────────┘
             │
             ▼
       Relevant Chunks
             │
             ▼
          LLM / RAG
             │
             ▼
       Generated Answer
             │
             ▼
       Display to User
```

Instead of sending the entire PDF to the LLM for every question, the system retrieves only the most relevant chunks and provides them as context to the language model.

---

## 🏗️ System Architecture

```text
┌──────────────────────────────────────────────────────┐
│                    React Frontend                    │
│                                                      │
│  Authentication │ PDF Sidebar │ Chat │ History       │
└─────────────────────────┬────────────────────────────┘
                          │
                          │ REST API
                          ▼
┌──────────────────────────────────────────────────────┐
│                Node.js + Express Backend              │
│                                                      │
│  Auth │ PDF Processing │ Chat │ RAG │ Documents      │
└───────────────┬──────────────────┬───────────────────┘
                │                  │
                ▼                  ▼
        ┌──────────────┐    ┌──────────────┐
        │   MongoDB    │    │    Qdrant    │
        │              │    │              │
        │ Users        │    │ PDF Vectors  │
        │ Documents    │    │ Embeddings   │
        │ Sessions     │    │ Metadata     │
        │ Messages     │    │              │
        └──────────────┘    └──────┬───────┘
                                   │
                                   ▼
                           Google Embeddings
                                   │
                                   ▼
                              LLM Provider
                         ┌─────────┴─────────┐
                         │                   │
                      ChatGroq           Gemini
```

---

## 🛠️ Tech Stack

### Frontend

* React.js
* Vite
* Tailwind CSS
* React Markdown
* Remark GFM
* Lucide React

### Backend

* Node.js
* Express.js
* MongoDB
* Mongoose
* JWT Authentication
* Multer
* PDF Processing

### AI / RAG

* LangChain
* Google Generative AI Embeddings
* Gemini Embeddings
* ChatGroq
* Large Language Models
* Retrieval-Augmented Generation

### Vector Database

* Qdrant

---

## 📂 Project Structure

```text
rag-pdf-assistant/
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── context/
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   ├── public/
│   ├── package.json
│   └── vite.config.js
│
├── server/
│   ├── controllers/
│   ├── models/
│   │   ├── User.js
│   │   ├── Document.js
│   │   ├── ChatSession.js
│   │   └── ChatMessage.js
│   │
│   ├── routes/
│   ├── middleware/
│   ├── services/
│   ├── utils/
│   ├── config/
│   ├── server.js
│   └── package.json
│
├── .gitignore
└── README.md
```

---

# 🔄 Application Workflow

## 1. User Authentication

The user first authenticates with the application.

```text
User
 ↓
Login / Register
 ↓
JWT Authentication
 ↓
Protected Dashboard
```

---

## 2. PDF Upload

The user uploads a PDF document.

```text
PDF
 ↓
Multer
 ↓
PDF Text Extraction
 ↓
Text Cleaning
 ↓
Text Chunking
```

Each document is divided into smaller chunks to make retrieval more efficient.

---

## 3. Generate Embeddings

Each text chunk is converted into a numerical vector representation.

```text
Text Chunk
    ↓
Embedding Model
    ↓
Vector Representation
    ↓
Qdrant
```

The vector is stored along with metadata such as:

```text
documentId
userId
fileName
pageNumber
chunkId
```

---

## 4. Ask a Question

The user asks a question such as:

> "What are the main objectives mentioned in this document?"

The application converts the question into an embedding.

```text
User Question
      ↓
Question Embedding
      ↓
Qdrant Similarity Search
      ↓
Relevant PDF Chunks
```

---

## 5. Generate Answer

The retrieved chunks are provided to the LLM as context.

```text
Question
   +
Relevant Context
   ↓
LLM
   ↓
Answer
```

The generated answer is returned to the user and stored in the chat history.

---

# 💾 Database Design

## User

```text
User
 ├── _id
 ├── name
 ├── email
 └── password
```

## ChatSession

```text
ChatSession
 ├── _id
 ├── employeeId
 ├── documentIds[]
 ├── title
 ├── createdAt
 └── updatedAt
```

## ChatMessage

```text
ChatMessage
 ├── _id
 ├── sessionId
 ├── role
 ├── content
 ├── sources[]
 ├── createdAt
 └── updatedAt
```

Relationship:

```text
User
 │
 └── ChatSession
       │
       ├── ChatMessage
       ├── ChatMessage
       ├── ChatMessage
       └── ChatMessage
```

---

# 🧩 Chat Session Architecture

The application uses persistent chat sessions.

When a user starts a new chat:

```text
No sessionId
     ↓
Create ChatSession
     ↓
Save sessionId
     ↓
Save user message
     ↓
Generate AI response
     ↓
Save assistant message
```

For subsequent questions:

```text
Existing sessionId
       ↓
Find ChatSession
       ↓
Verify employeeId
       ↓
Save new message
       ↓
Generate response
       ↓
Save AI response
```

This allows conversations to survive page refreshes.

---

# 🔍 RAG Components

### Document Loader

Extracts text from uploaded PDF files.

### Text Splitter

Divides large documents into smaller chunks.

### Embedding Model

Converts text into vector representations.

### Qdrant

Stores and retrieves document vectors using similarity search.

### Retriever

Finds the most relevant chunks for a user query.

### LLM

Uses the retrieved context to generate the final response.

---

# ⚙️ Environment Variables

Create a `.env` file inside the server directory.

```env
PORT=5000

MONGO_URI=your_mongodb_connection_string

JWT_SECRET=your_jwt_secret

QDRANT_URL=your_qdrant_url
QDRANT_API_KEY=your_qdrant_api_key

GOOGLE_API_KEY=your_google_api_key

GROQ_API_KEY=your_groq_api_key
```

Never commit your `.env` file to GitHub.

Add:

```text
.env
node_modules/
dist/
```

to `.gitignore`.

---

# 📦 Installation

## 1. Clone the repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
```

```bash
cd rag-pdf-assistant
```

---

## 2. Install backend dependencies

```bash
cd server
npm install
```

---

## 3. Install frontend dependencies

```bash
cd ../client
npm install
```

---

## 4. Configure environment variables

Create:

```text
server/.env
```

and add the required API keys and database configuration.

---

## 5. Start backend

```bash
cd server
npm run dev
```

Backend:

```text
http://localhost:5000
```

---

## 6. Start frontend

Open another terminal:

```bash
cd client
npm run dev
```

Frontend:

```text
http://localhost:5173
```

---

# 🔌 API Endpoints

### Authentication

```http
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
```

### Documents

```http
POST   /api/documents/upload
GET    /api/documents
DELETE /api/documents/:documentId
```

### Chat

```http
POST   /api/assistant/chat
GET    /api/assistant/sessions
GET    /api/assistant/sessions/:sessionId
DELETE /api/assistant/sessions/:sessionId
```

---

# 🧪 Example RAG Request

```json
{
  "question": "What are the key points discussed in this PDF?",
  "sessionId": "SESSION_ID",
  "documentIds": [
    "DOCUMENT_ID"
  ]
}
```

Example response:

```json
{
  "success": true,
  "data": {
    "sessionId": "SESSION_ID",
    "answer": "The document discusses...",
    "sources": [
      {
        "documentId": "DOCUMENT_ID",
        "fileName": "example.pdf",
        "pageNumber": 5
      }
    ]
  }
}
```

---

# 🔐 Security

The application implements several security practices:

* JWT-based authentication
* Protected API routes
* User-specific document access
* User-specific chat sessions
* Session ownership validation
* Environment variables for secrets
* Input validation
* MongoDB schema validation

A session is always checked against the authenticated user's ID:

```js
const session = await ChatSession.findOne({
  _id: sessionId,
  employeeId: userId,
});
```

This prevents users from accessing another user's conversation.

---

# 📈 Future Improvements

* Streaming AI responses
* Voice-based questions
* Multi-PDF conversations
* Advanced source citations
* Document preview
* Conversation search
* Chat renaming
* AI-generated conversation titles
* Multiple LLM providers with automatic fallback
* Advanced document analytics
* Role-based access control
* Cloud file storage
* Production monitoring
* Rate limiting

---

# 🎯 Use Cases

This project can be useful for:

* 📚 Students studying from textbooks
* 🧑‍💼 Employees querying company documents
* 📑 Researchers analyzing papers
* ⚖️ Legal document analysis
* 🏢 Business document search
* 🎓 Educational knowledge assistants
* 📖 Personal document Q&A

---

# 🧠 What I Learned

Building this project helped me understand and implement:

* MERN stack application development
* REST API design
* JWT authentication
* MongoDB data modeling
* PDF text extraction
* Text chunking
* Vector embeddings
* Vector databases
* Qdrant similarity search
* LangChain RAG pipelines
* LLM integration
* Prompt engineering
* Persistent chat architecture
* React state management
* Markdown rendering
* Responsive UI development

---

# 👨‍💻 Author

**Aman Jaiswal**

BCA Student | MERN Stack Developer | DSA in C++

### Skills

```text
React.js
Node.js
Express.js
MongoDB
Mongoose
JavaScript
Tailwind CSS
LangChain
RAG
Qdrant
LLMs
REST APIs
JWT
DSA in C++
```

---

# ⭐ Support

If you find this project useful, consider giving the repository a ⭐ on GitHub.

---

## 📄 License

This project is created for educational and portfolio purposes.
