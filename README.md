# AI Assistant Platform

> Full-stack AI development assistant built with Vue 3 and Claude API

🔗 **Live Demo:** https://ai-front-puce.vercel.app

## Screenshots
<img width="1419" height="1298" alt="image" src="https://github.com/user-attachments/assets/62a7414f-1577-4d6f-95b5-8ac5c8ab32ed" />
<img width="1416" height="1266" alt="image" src="https://github.com/user-attachments/assets/41e571cd-964f-4cc0-bd8f-fdc8ec3283cd" />
<img width="1454" height="967" alt="image" src="https://github.com/user-attachments/assets/0fdb848f-d7c4-4ede-a07c-135a0a74d638" />


## ✨ Features

- **Streaming Chat** — Real-time AI responses via SSE
- **RAG Pipeline** — Document Q&A with semantic search
- **Code Review** — Structured analysis with severity levels
- **Project Analysis** — Context-aware codebase understanding

## 🛠 Tech Stack

**Frontend**
- Vue 3 (Composition API)
- TypeScript
- Pinia (State Management)
- Vite

**Backend**
- Node.js + Express
- TypeScript
- Anthropic SDK (Claude API)
- LangChain
- OpenAI Embeddings
- HNSWlib Vector Store

## 🏗 Architecture
```
┌─────────┐    SSE     ┌─────────┐   Claude   ┌──────────┐
│ Vue 3   │ ◄────────► │ Express │ ◄────────► │ Claude   │
│ Client  │            │ Server  │            │ API      │
└─────────┘            └─────────┘            └──────────┘
                            │
                            ▼
                       ┌─────────┐
                       │ HNSW    │
                       │ Vector  │
                       │ Store   │
                       └─────────┘
```

## 🚀 Key Highlights

- **End-to-end TypeScript** for type safety
- **Streaming architecture** for real-time UX
- **Multi-model setup** (Claude + OpenAI)
- **Production deployment** on Railway + Vercel

## 🔧 Local Development
```bash
# Frontend
cd frontend
npm install
npm run dev

# Backend
cd backend
npm install
npm run dev
```

## 🌐 Environment Variables
```env
# Backend
ANTHROPIC_API_KEY=your_key
OPENAI_API_KEY=your_key
PORT=3000

# Frontend
VITE_API_URL=http://localhost:3000
```

## 📝 License

MIT

---

Built with ❤️ for exploring AI capabilities in development tools
