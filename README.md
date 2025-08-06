# AI Stock Trader Agent

This project implements an AI-powered stock trading agent built with the Google Agent Development Kit (ADK). It leverages a multi-agent architecture to research, analyze, and provide insights on stock trading decisions.

The system is composed of three specialized sub-agents:
*   **News Agent**: Scans financial news and market data for relevant information.
*   **Risk Analysis Agent**: Performs analysis on the data gathered by the News Agent.
*   **Stock Agent**: Synthesizes the findings from the other agents to provide a final recommendation or insight.

---

## 🏗️ Project Structure

The project is organized as follows, separating the agent logic from the deployment configuration.

```
/ai-challenge-no-streamlit
|
├── stocks_agent/
│   ├── __init__.py
│   ├── agent.py
│   ├── root_prompt.py
│   └── sub_agents/
│       ├── stock/
│       │   └── ... (stock_agent files)
│       ├── news/
│       │   └── ... (news_agent files)
│       └── risk_analysis/
│           └── ... (analyst_agent files)
|
├── static/
|   ├──inde.html 
|   └──js
|      ├──apps.js
|      └──style.css
|
├── .env                  
├── main.py               
├── Dockerfile           
├── requirements.txt    
└── .dockerignore        
```


## 🚀 Getting Started: Deploy to Cloud Run

Follow these steps to configure your environment and deploy the agent to Google Cloud Run.

### 1. Prerequisites

Before you begin, ensure you have the following:
*   [Google Cloud SDK (gcloud CLI)](https://cloud.google.com/sdk/docs/install) installed and authenticated.
*   An active Google Cloud Project with billing enabled.
*   A [Google API Key](https://developers.google.com/maps/documentation/javascript/get-api-key) with the necessary APIs enabled (e.g., Vertex AI API or AI Platform).

### 2. Environment Configuration

This application requires several environment variables to connect to Google Cloud services. Set them directly in your terminal session.

**Note:** These variables will only be set for your current terminal session. You will need to re-export them if you open a new terminal.

```
bash
export GOOGLE_GENAI_USE_VERTEXAI=FALSE
export GOOGLE_CLOUD_PROJECT="your_gcp_project_id"
export GOOGLE_CLOUD_LOCATION="us-central1"
export GOOGLE_API_KEY="your_google_api_key"
export MODEL="gemini-2.0-flash-001"
```

### 3. Variable Explanations

- GOOGLE_GENAI_USE_VERTEXAI: Set to FALSE to use the Google AI Studio (Generative Language) APIs instead of Vertex AI.
- GOOGLE_CLOUD_PROJECT: Your unique Google Cloud project ID. Replace "your_gcp_project_id".
- GOOGLE_CLOUD_LOCATION: The region where you will deploy the Cloud Run service.
- GOOGLE_API_KEY: Your API key for authenticating with Google AI services. Replace "your_google_api_key".
- MODEL: The specific Gemini model the agent will use (e.g., gemini-1.5-flash-001).

### 4. Deploy the Agent

1. Once your environment variables are set, you can deploy the agent with a single gcloud command.

2. Make sure you are in the root directory of the project (/ai-challenge-no-streamlit).

3. Run the deployment command:

```
gcloud run deploy trader-agent-service \
  --source . \
  --region "$GOOGLE_CLOUD_LOCATION" \
  --project "$GOOGLE_CLOUD_PROJECT" \
  --allow-unauthenticated \
  --set-env-vars="GOOGLE_CLOUD_PROJECT=$GOOGLE_CLOUD_PROJECT,GOOGLE_CLOUD_LOCATION=$GOOGLE_CLOUD_LOCATION,GOOGLE_GENAI_USE_VERTEXAI=$GOOGLE_GENAI_USE_VERTEXAI,MODEL=$MODEL,GOOGLE_API_KEY=$GOOGLE_API_KEY"
```

### 5. 💻 How to Use the Agent

1. After the deployment command in the previous step succeeds, look for the Service URL in the terminal output. It will look something like this: Service [trader-agent-service] deployed to: https://trader-agent-service-xxxxxxxxxx-uc.a.run.app

2. Open this URL in your web browser.

3. You will see a simple UI where you can type your questions (e.g., "Should I buy GOOGL stock today?") and submit them to the agent. The agent's response will be displayed on the page.

### 6. 📚 Helpful Resources

- ADK Deployment Docs: Deploying an ADK App to Cloud Run
- ADK FastAPI Source: ADK FastAPI CLI Implementation
- [ADK FastAPI Source: Custom Audio Streaming app (WebSocket)](https://google.github.io/adk-docs/streaming/custom-streaming-ws/)
- [Gemini Models list](https://ai.google.dev/gemini-api/docs/models#live-api)
- [Multi-agents explicit invocation documentation](https://google.github.io/adk-docs/agents/multi-agents/#c-explicit-invocation-agenttool)
- [Adk builtin-tools limitations and documentation](https://github.com/google/adk-docs/blob/main/docs/tools/built-in-tools.md)