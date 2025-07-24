import os
import uvicorn
from fastapi import FastAPI
from google.adk.cli.fast_api import get_fast_api_app
from agent.agent import root_agent # Import your root_agent

# Get the directory where main.py is located
AGENT_DIR = os.path.dirname(os.path.abspath(__file__))
# Example session service URI (e.g., SQLite)
SESSION_SERVICE_URI = "sqlite:///./sessions.db"
# Example allowed origins for CORS
ALLOWED_ORIGINS = ["http://localhost", "http://localhost:8080", "*"]
# Set web=True if you intend to serve a web interface, False otherwise
SERVE_WEB_INTERFACE = True

# --- Create the FastAPI Application ---
# The ADK provides a helper function `get_fast_api_app`
# which automatically creates all the necessary API endpoints
# (including WebSockets) for your agent.
app = get_fast_api_app(
    agents_dir=AGENT_DIR,
    session_service_uri=SESSION_SERVICE_URI,
    allow_origins=ALLOWED_ORIGINS,
    web=SERVE_WEB_INTERFACE,
)

# --- Add a simple root endpoint for health checks ---
@app.get("/")
def read_root():
    """A simple endpoint to confirm the server is running."""
    return {"status": "Trader Agent is running"}

# --- Run the application ---
# This block allows you to run the server locally for testing.
# Uvicorn is the ASGI server that will run your FastAPI app.
if __name__ == "__main__":
    print("Starting server locally on http://localhost:8000")
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", 8080)))
