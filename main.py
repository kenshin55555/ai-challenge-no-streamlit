import os
import json
import asyncio
import warnings

from pathlib import Path
from dotenv import load_dotenv

# MODIFICATION: Removed 'ToolCall' from this import list.
from google.genai.types import (
    Part,
    Content,
)

from google.adk.runners import InMemoryRunner
from google.adk.agents import LiveRequestQueue
from google.adk.agents.run_config import RunConfig

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from stocks_agent.agent import root_agent

warnings.filterwarnings("ignore", category=UserWarning, module="pydantic")

# Load Gemini API Key
load_dotenv()

APP_NAME = "ADK Tool-Aware Chat Example"


async def start_agent_session(user_id):
    runner = InMemoryRunner(app_name=APP_NAME, agent=root_agent)
    session = await runner.session_service.create_session(app_name=APP_NAME, user_id=user_id)
    run_config = RunConfig(response_modalities=["TEXT"])
    live_request_queue = LiveRequestQueue()
    loop = asyncio.get_running_loop()
    live_events_iterator = await loop.run_in_executor(
        None,
        lambda: runner.run_live(
            session=session,
            live_request_queue=live_request_queue,
            run_config=run_config,
        )
    )
    return live_events_iterator, live_request_queue

async def agent_to_client_messaging(websocket: WebSocket, live_events, live_request_queue: LiveRequestQueue):
    """
    Agent to client communication.
    DEFINITIVE FIX 3: This version correctly processes ONLY partial streaming events
    to prevent the final "summary" event from causing duplication.
    """
    try:
        async for event in live_events:
            # --- THE FINAL, CORRECT LOGIC ---

            # We only care about events that are explicitly marked as partial.
            # This gives us the "live typing" effect and, crucially,
            # IGNORES the final summary event that was causing the duplication.
            if event.partial and event.content and event.content.parts:
                for part in event.content.parts:
                    if part.text:
                        message = {"mime_type": "text/plain", "data": part.text}
                        await websocket.send_text(json.dumps(message))
                        # Optional: print for clean logs
                        # print(f"[AGENT TO CLIENT]: Sent chunk: '{part.text}'")

            # Separately, we check if the turn is over to update the UI.
            if event.turn_complete:
                print("[SERVER]: Turn complete signal received.")

                # The tool call logic remains the same, as it's independent.
                pending_tool_call = None
                if event.content and event.content.parts:
                    for part in event.content.parts:
                        if part.function_call:
                            pending_tool_call = part.function_call
                            break
                
                if pending_tool_call:
                    print(f"[SERVER]: Tool call detected: {pending_tool_call.name}. ADK will execute it.")
                else:
                    print("[SERVER]: No tool call. Sending turn_complete signal to UI.")
                    await websocket.send_text(json.dumps({"turn_complete": True}))

            elif event.interrupted:
                await websocket.send_text(json.dumps({"interrupted": True}))
                print(f"[AGENT TO CLIENT]: Interrupted")

    except WebSocketDisconnect:
        print("Client closed the connection.")
    except Exception as e:
        print(f"Error in agent-to-client messaging: {e}")
    finally:
        print("Agent to client messaging task finished.")

async def client_to_agent_messaging(websocket: WebSocket, live_request_queue: LiveRequestQueue):
    """Client to agent communication, text-only."""
    try:
        while True:
            message_json = await websocket.receive_text()
            message = json.loads(message_json)
            if message["mime_type"] == "text/plain":
                content = Content(role="user", parts=[Part.from_text(text=message["data"])])
                live_request_queue.send_content(content=content)
                print(f"[CLIENT TO AGENT]: {message['data']}")
    except WebSocketDisconnect:
        print("Client disconnected.")
    except Exception as e:
        print(f"Error in client-to-agent messaging: {e}")
    finally:
        live_request_queue.close()
        print("Client to agent messaging task finished.")


app = FastAPI()
STATIC_DIR = Path(__file__).parent / "static"
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

@app.get("/")
async def root():
    return FileResponse(os.path.join(STATIC_DIR, "index.html"))


@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: int):
    await websocket.accept()
    print(f"Client #{user_id} connected (Tool-Aware Mode)")
    try:
        user_id_str = str(user_id)
        live_events, live_request_queue = await start_agent_session(user_id_str)
        agent_to_client_task = asyncio.create_task(
            agent_to_client_messaging(websocket, live_events, live_request_queue)
        )
        client_to_agent_task = asyncio.create_task(
            client_to_agent_messaging(websocket, live_request_queue)
        )
        done, pending = await asyncio.wait(
            [client_to_agent_task, agent_to_client_task],
            return_when=asyncio.FIRST_COMPLETED,
        )
        for task in pending:
            task.cancel()
    except Exception as e:
        print(f"An error occurred in the websocket endpoint: {e}")
    finally:
        print(f"Client #{user_id} disconnected")
