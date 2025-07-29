import os
from google.adk.agents import SequentialAgent, Agent
from .root_prompt import ROOT_PROMPT
from .sub_agents.stock import stock_agent
from .sub_agents.news import news_agent
from .sub_agents.risk_analysis import analyst_agent
from google.adk.tools.agent_tool import AgentTool
from dotenv import load_dotenv

# ### MODIFICATION: Removed the SequentialAgent 'gatherer_agent'.
# It was causing the data flow to break.

# ### MODIFICATION: The root_agent is now the central orchestrator.
# It has access to all sub-agents to manage the workflow.
root_agent = Agent(
    name="root_agent",
    model="gemini-2.0-flash-live-001", # Using Flash for speed in orchestration
    description="A master orchestrator that first chats with a user to gather requirements, then executes a financial analysis workflow.",
    instruction=ROOT_PROMPT, # The prompt for this agent is now much more important.
    sub_agents=[
        stock_agent,
        news_agent,
        analyst_agent
    ],
    # The root agent itself does not need tools; it delegates tasks.
)