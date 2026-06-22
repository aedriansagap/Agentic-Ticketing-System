# pyrefly: ignore [missing-import]
from langchain_core.tools import tool
# pyrefly: ignore [missing-import]
from langchain.agents import create_agent
# pyrefly: ignore [missing-import]
from langchain_openai import ChatOpenAI
import httpx
import os

# Assume llama.cpp server is running on 8080
LLAMA_CPP_SERVER_URL = os.getenv("LLAMA_CPP_SERVER_URL", "http://localhost:8080/v1")

llm = ChatOpenAI(
    model="gemma-4", 
    api_key="not-needed",
    base_url=LLAMA_CPP_SERVER_URL,
    temperature=0.1
)

@tool
def get_all_tickets() -> str:
    """Fetch all tickets currently in the system. Use this to list tickets or see what is open."""
    try:
        response = httpx.get("http://localhost:8000/api/tickets/")
        return response.text
    except Exception as e:
        return f"Error: {e}"

@tool
def get_ticket(ticket_id: int) -> str:
    """Fetch details of a specific ticket by its ID."""
    try:
        response = httpx.get(f"http://localhost:8000/api/tickets/{ticket_id}")
        return response.text
    except Exception as e:
        return f"Error: {e}"

@tool
def create_new_ticket(title: str, description: str, priority: str = "medium") -> str:
    """Create a new support ticket."""
    try:
        response = httpx.post(
            "http://localhost:8000/api/tickets/",
            json={"title": title, "description": description, "priority": priority, "status": "open"}
        )
        return response.text
    except Exception as e:
        return f"Error: {e}"

@tool
def update_ticket_status(ticket_id: int, status: str) -> str:
    """Update the status of an existing ticket. Valid statuses: open, in_progress, resolved, closed"""
    try:
        res = httpx.get(f"http://localhost:8000/api/tickets/{ticket_id}")
        if res.status_code != 200:
            return "Ticket not found."
        ticket = res.json()
        ticket["status"] = status
        
        response = httpx.put(
            f"http://localhost:8000/api/tickets/{ticket_id}",
            json=ticket
        )
        return response.text
    except Exception as e:
        return f"Error: {e}"

tools = [get_all_tickets, get_ticket, create_new_ticket, update_ticket_status]

system_msg = "You are an AI support agent. You help users manage support tickets. You must ALWAYS use tools to view, create or update tickets."
agent_executor = create_agent(model=llm, tools=tools, system_prompt=system_msg)

def process_chat(message: str) -> str:
    try:
        result = agent_executor.invoke({"messages": [
            ("user", message)
        ]})
        return result["messages"][-1].content
    except Exception as e:
        print(f"Agent error: {e}")
        return f"I encountered an error connecting to the AI system: {e}"
