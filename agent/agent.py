import os
from google.adk.agents import SequentialAgent, Agent
from .root_prompt import ROOT_PROMPT
from .sub_agents.stock import stock_agent
from .sub_agents.news import news_agent
from .sub_agents.risk_analysis import analyst_agent
from google.adk.tools.agent_tool import AgentTool
from dotenv import load_dotenv
load_dotenv()
model = os.environ.get("MODEL")

gatherer_agent = SequentialAgent(
    name="gatherer_agent",
    description="Agent in charge of retreiving stock and news information",
    sub_agents=[
        stock_agent,
        news_agent,
        analyst_agent
    ],
)

root_agent = Agent(
        name="root_agent", # A unique name for this specific agent.
        model=model,    # Specifies the Gemini model to power this agent's language understanding and generation.
        description="An agent that orchestrates access to stock information", # A brief, human-readable description of the agent's role.
        instruction=ROOT_PROMPT,
        sub_agents=[gatherer_agent],
    )