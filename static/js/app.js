/**
 * app.js: JS code for the adk-streaming sample app.
 * MODIFIED FOR CHAT-ONLY.
 */

// Connect the server with a WebSocket connection
const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const ws_url = `${protocol}//${window.location.host}/ws/`; // We'll add the session ID later

let websocket = null;
// MODIFICATION 1: The `is_audio` variable is no longer needed.

// Get DOM elements
const messageForm = document.getElementById("messageForm");
const messageInput = document.getElementById("message");
const messagesDiv = document.getElementById("messages");
let currentMessageId = null;

// WebSocket handlers
function connectWebsocket() {
  const sessionId = Math.random().toString().substring(10);
  websocket = new WebSocket(ws_url + sessionId);

  websocket.onopen = function () {
    console.log("WebSocket connection opened.");
    document.getElementById("messages").textContent = "Connection opened";
    document.getElementById("sendButton").disabled = false;
    addSubmitHandler();
  };

  websocket.onmessage = function (event) {
    const message_from_server = JSON.parse(event.data);
    console.log("[AGENT TO CLIENT] ", message_from_server);

    if (
      message_from_server.turn_complete &&
      message_from_server.turn_complete == true
    ) {
      currentMessageId = null;
      return;
    }

    if (message_from_server.mime_type == "text/plain") {
      if (currentMessageId == null) {
        currentMessageId = Math.random().toString(36).substring(7);
        const message = document.createElement("p");
        message.id = currentMessageId;
        message.className = "agent-message"; 
        messagesDiv.appendChild(message);
      }
      const message = document.getElementById(currentMessageId);
      message.textContent += message_from_server.data;
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }
  };

  websocket.onclose = function () {
    console.log("WebSocket connection closed.");
    document.getElementById("sendButton").disabled = true;
    document.getElementById("messages").textContent = "Connection closed";
    setTimeout(function () {
      console.log("Reconnecting...");
      connectWebsocket();
    }, 5000);
  };

  websocket.onerror = function (e) {
    console.log("WebSocket error: ", e);
  };
}
connectWebsocket();

function addSubmitHandler() {
  messageForm.onsubmit = function (e) {
    e.preventDefault();
    const message = messageInput.value;
    if (message) {
      const p = document.createElement("p");
      p.textContent = "> " + message;
      messagesDiv.appendChild(p);
      messageInput.value = "";
      // The original, working message format is preserved.
      sendMessage({
        mime_type: "text/plain",
        data: message,
      });
      console.log("[CLIENT TO AGENT] " + message);
    }
    return false;
  };
}

function sendMessage(message) {
  if (websocket && websocket.readyState == WebSocket.OPEN) {
    const messageJson = JSON.stringify(message);
    websocket.send(messageJson);
  }
}

