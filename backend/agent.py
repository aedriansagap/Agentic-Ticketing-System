from langchain_core.tools import tool
from langchain.agents import AgentExecutor, create_react_agent
from langchain_core.prompts import PromptTemplate
from langchain_openai import ChatOpenAI
import httpx
import os

# Assume llama.cpp server is running on 8080
LLAMA_CPP_SERVER_URL = os.getenv("LLAMA_CPP_SERVER_URL", "http://localhost:8080/v1")

llm = ChatOpenAI(
    model="gemma-4", 
    openai_api_key="not-needed",
    openai_api_base=LLAMA_CPP_SERVER_URL,
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

template = '''Answer the following questions as best you can. You have access to the following tools:

{tools}

Use the following format:

Question: the input question you must answer
Thought: you should always think about what to do
Action: the action to take, should be one of [{tool_names}]
Action Input: the input to the action
Observation: the result of the action
... (this Thought/Action/Action Input/Observation can repeat N times)
Thought: I now know the final answer
Final Answer: the final answer to the original input question

Begin!

Question: {input}
Thought:{agent_scratchpad}'''

prompt = PromptTemplate.from_template(template)

agent = create_react_agent(llm, tools, prompt)
agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True, handle_parsing_errors=True)

def process_chat(message: str) -> str:
    try:
        result = agent_executor.invoke({"input": message})
        return result.get("output", "I could not generate a response.")
    except Exception as e:
        print(f"Agent error: {e}")
        return f"I encountered an error connecting to the AI system: {e}"
