# GitGraph

**GitGraph** is an AI-powered codebase visualization platform that transforms any GitHub repository into an interactive dependency graph with intelligent summaries, enabling developers to understand unfamiliar codebases.

---

## Features

### Interactive Repository Graph
- Visualizes files, folders, and relationships using a dynamic node-edge graph  
- Navigate complex architectures intuitively instead of reading raw code  

### AI-Generated Code Summaries
- Automatically summarizes files, modules, and subsystems  
- Explains:
  - Purpose of each component  
  - How modules connect  
  - High-level architecture  

### GitHub OAuth Integration
- Secure login with GitHub  
- Analyze both public and private repositories  

### Fast, Scalable Backend
- Parallel graph construction for large repositories  
- Redis caching to avoid repeated LLM calls  
- Sub-second graph retrieval after initial processing  

### Real-World Use Cases
- Developer onboarding  
- Hackathon repo exploration  
- Open-source contribution  
- Technical interview preparation  


---

## 🛠️ Tech Stack

### Frontend
- Next.js  
- React  
- React Flow (graph visualization)  
- TypeScript  
- Tailwind CSS  

### Backend
- FastAPI (Python)  
- GitHub REST API  
- LangChain (chunking + LLM orchestration)  
- Redis (summary caching)  

### AI
- Gemini / OpenAI LLMs for:
  - File summaries  
  - Architecture explanations  
  - Semantic understanding  

### Infrastructure (planned / optional)
- Docker containerization  
- Vercel (frontend deployment)  
- Railway / Render / AWS (backend deployment)  

---

## 🚀 Getting Started



