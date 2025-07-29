from google.adk import Agent
from google.adk.tools import google_search
from .prompt import NEWS_PROMPT

news_agent = Agent(
        model="gemini-2.0-flash-live-001",
        name='news_agent',
        description="Agent dedicated to recollect financial news about companies, both positive and negative",
        instruction=NEWS_PROMPT,
        tools=[google_search],
    )
    