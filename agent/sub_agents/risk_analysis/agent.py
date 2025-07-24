from google.adk import Agent
from google.adk.tools import google_search
from .prompt import ANALYST_PROMPT

analyst_agent = Agent(
        model="gemini-2.0-flash-001",
        name='analyst_agent',
        description="Agent dedicated to perform risk analysis about the stock market",
        instruction=ANALYST_PROMPT,
        tools=[google_search],
    )
    