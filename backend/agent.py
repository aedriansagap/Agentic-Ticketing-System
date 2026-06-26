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

def get_tools(token: str):
    headers = {"Authorization": f"Bearer {token}"}
    
    @tool
    def get_all_tickets(status: str = "", category: str = "", search: str = "") -> str:
        """Fetch all tickets currently in the system. Use this to list tickets or see what is open. You can filter by status, category, or a search term."""
        try:
            params = {}
            if status: params["status"] = status
            if category: params["category"] = category
            if search: params["search"] = search
            response = httpx.get("http://localhost:8000/api/tickets/", params=params, headers=headers)
            return response.text
        except Exception as e:
            return f"Error: {e}"

    @tool
    def get_ticket(ticket_id: int) -> str:
        """Fetch details of a specific ticket by its ID."""
        try:
            response = httpx.get(f"http://localhost:8000/api/tickets/{ticket_id}", headers=headers)
            return response.text
        except Exception as e:
            return f"Error: {e}"

    @tool
    def create_new_ticket(title: str, description: str, priority: str = "medium", category: str = "general") -> str:
        """Create a new support ticket."""
        try:
            response = httpx.post(
                "http://localhost:8000/api/tickets/",
                json={"title": title, "description": description, "priority": priority, "category": category, "status": "open"},
                headers=headers
            )
            return response.text
        except Exception as e:
            return f"Error: {e}"

    @tool
    def update_ticket_status(ticket_id: int, status: str) -> str:
        """Update the status of an existing ticket. Valid statuses: open, in_progress, resolved, closed"""
        try:
            res = httpx.get(f"http://localhost:8000/api/tickets/{ticket_id}", headers=headers)
            if res.status_code != 200:
                return "Ticket not found or unauthorized."
            ticket = res.json()
            ticket["status"] = status
            
            response = httpx.put(
                f"http://localhost:8000/api/tickets/{ticket_id}",
                json=ticket,
                headers=headers
            )
            return response.text
        except Exception as e:
            return f"Error: {e}"

    @tool
    def read_ticket_comments(ticket_id: int) -> str:
        """Fetch all comments/replies for a specific ticket. Use this to understand the conversation history of a ticket."""
        try:
            response = httpx.get(f"http://localhost:8000/api/tickets/{ticket_id}/comments", headers=headers)
            return response.text
        except Exception as e:
            return f"Error: {e}"

    @tool
    def add_comment_to_ticket(ticket_id: int, content: str) -> str:
        """Add a comment/reply to an existing ticket on behalf of the user. Use this to respond to support agents or provide more details."""
        try:
            response = httpx.post(
                f"http://localhost:8000/api/tickets/{ticket_id}/comments",
                json={"content": content},
                headers=headers
            )
            return response.text
        except Exception as e:
            return f"Error: {e}"

    return [get_all_tickets, get_ticket, create_new_ticket, update_ticket_status, read_ticket_comments, add_comment_to_ticket]


system_msg = "You are an AI support agent. You help users manage support tickets. You must ALWAYS use tools to view, create, or update tickets. When discussing a specific ticket, you should use read_ticket_comments to understand the context, and add_comment_to_ticket to officially log the user's replies to the ticket thread."

def process_chat(message: str, token: str) -> str:
    tools = get_tools(token)
    agent_executor = create_agent(model=llm, tools=tools, system_prompt=system_msg)
    try:
        result = agent_executor.invoke({"messages": [
            ("user", message)
        ]})
        return result["messages"][-1].content
    except Exception as e:
        print(f"Agent error: {e}")
        return f"I encountered an error connecting to the AI system: {e}"
