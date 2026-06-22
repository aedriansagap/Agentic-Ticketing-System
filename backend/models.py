from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime

class Ticket(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str = Field(index=True)
    description: str
    status: str = Field(default="open") # open, in_progress, resolved, closed
    priority: str = Field(default="medium") # low, medium, high
    created_at: datetime = Field(default_factory=datetime.utcnow)
