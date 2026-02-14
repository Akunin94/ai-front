# AI Assistant Platform

> Full-stack AI development assistant built with Vue 3 and Claude API

🔗 **Live Demo:** https://ai-front-puce.vercel.app

![Demo Screenshot](./screenshots/demo.gif)

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

## 📸 Screenshots

[Add 2-3 screenshots showing different features]

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