from google.adk import Agent
from google.adk.tools import google_search
from .prompt import STOCK_PROMPT

stock_agent = Agent(
        model="gemini-2.0-flash-001",
        name='stock_agent',
        description= "Agent dedicated to retrieve stock information",
        instruction=STOCK_PROMPT,
        tools=[google_search],
    )
    