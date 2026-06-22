# Agentic Ticketing System

An intelligent support ticketing system integrating a local AI agent (powered by Gemma 4 via llama.cpp) to autonomously manage, read, and interact with support tickets based on user intent.

## Architecture

- **Backend:** FastAPI (Python), serving RESTful endpoints for ticket CRUD operations and agent interactions.
- **Database:** SQLite with SQLModel for rapid development and relational data management.
- **Frontend:** React (Vite) with vanilla CSS modules, offering a modern, glassmorphic UI.
- **AI Agent:** Gemma 4 served locally via llama.cpp, utilizing ReAct prompting to securely interact with the backend API endpoints.

## Local Setup

### Backend
1. Navigate to the `backend` directory.
2. Create and activate a Python virtual environment.
3. Install dependencies: `pip install -r requirements.txt`.
4. Run the development server: `uvicorn main:app --reload`.

### Frontend
1. Navigate to the `frontend` directory.
2. Install dependencies: `npm install`.
3. Start the development server: `npm run dev`.

### AI Inference
Run an OpenAI-compatible llama.cpp server hosting your preferred Gemma 4 model (e.g., `gemma-4-E4B-it-GGUF`) on port 8080:
`./server -m ./models/gemma-4-E4B-it.gguf --port 8080 --host 0.0.0.0`

## Deployment

This repository is structured for modular deployment. 
- The React frontend can be built and statically hosted on platforms like Vercel or Netlify. 
- The FastAPI backend can be containerized and deployed to cloud environments like Render, AWS, or GCP.
- The llama.cpp server can be hosted separately on GPU-accelerated instances or managed inference services.
