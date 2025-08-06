# -*- coding: utf-8 -*-
"""
agent.py

DESCRIPTION:
  This module defines the primary orchestrator for the financial analysis
  workflow, known as the `root_agent`.

  The `root_agent` is responsible for interacting with the user, gathering
  necessary inputs, and then delegating tasks to a series of specialized
  sub-agents (`stock_agent`, `news_agent`, `analyst_agent`). These sub-agents
  are wrapped as `AgentTool` instances, making them callable tools within the
  ADK framework.

  The agent's behavior is governed by the detailed instructions provided in
  the `ROOT_PROMPT`.
"""
import os

from google.adk.agents import Agent
from google.adk.tools.agent_tool import AgentTool

# Local application imports for prompts and sub-agents.
from .root_prompt import ROOT_PROMPT
from .sub_agents.news import news_agent
from .sub_agents.risk_analysis import analyst_agent
from .sub_agents.stock import stock_agent

# Note: Environment variables (like API keys or model names) are best loaded
# once in the main application entrypoint (e.g., main.py) rather than here.
# This module will read the environment variable set by the main application.


# ==============================================================================
# Agent Tool Definitions
#
# Each sub-agent is wrapped in an `AgentTool`. This allows the `root_agent`
# to treat them as callable functions, enabling a clear and modular workflow
# where the root agent can invoke other agents to perform specific tasks.
# ==============================================================================
stock_agent_tool = AgentTool(agent=stock_agent)
news_agent_tool = AgentTool(agent=news_agent)
analyst_agent_tool = AgentTool(agent=analyst_agent)


# ==============================================================================
# Root Agent Instantiation
# ==============================================================================
root_agent = Agent(
    name="root_agent",
    model="gemini-2.0-flash-live-001", # Fetches model from env, with a fallback.
    description=(
        "A master orchestrator that first chats with a user to gather "
        "requirements, then executes a financial analysis workflow."
    ),
    instruction=ROOT_PROMPT,
    tools=[
        stock_agent_tool,
        news_agent_tool,
        analyst_agent_tool,
    ],
)
