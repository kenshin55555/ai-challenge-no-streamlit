/**
 * @file app.js
 * @description Core client-side logic for the Stocktrader Agent application.
 * This script manages the WebSocket connection, handles incoming and outgoing
 * messages, renders Markdown, and controls the UI for both the chat and the
 * detailed analysis view.
 */

// =============================================================================
// DOM Element References & State Variables
// =============================================================================

// --- Chat UI Elements ---
const messageForm = document.getElementById("messageForm");
const messageInput = document.getElementById("message");
const messagesDiv = document.getElementById("messages");
const sendButton = document.getElementById("sendButton");

// --- View Toggling Elements ---
const chatView = document.getElementById('main-chat-view');
const analysisView = document.getElementById('analysis-view');
const analysisBtn = document.getElementById('analysis-view-btn');
const chatBtn = document.getElementById('chat-view-btn');

// --- State Management ---
let currentMessageId = null; // Tracks the ID of the agent message bubble currently being streamed.
let websocket = null; // Holds the WebSocket connection object.


// =============================================================================
// Event Listeners
// =============================================================================

// Attach click listeners to the view-toggling buttons.
// This is safe to do at the top level because the script tag is at the end of the <body>.
if (analysisBtn) {
    analysisBtn.addEventListener('click', toggleView);
}
if (chatBtn) {
    chatBtn.addEventListener('click', toggleView);
}


// =============================================================================
// WebSocket Connection Management
// =============================================================================

const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const ws_url = `${protocol}//${window.location.host}/ws/`;

/**
 * Establishes a WebSocket connection to the backend server.
 * This function handles the entire lifecycle of the connection, including
 * opening, receiving messages, closing, and handling errors.
 */
function connectWebsocket() {
    const sessionId = Math.floor(Math.random() * 1000000000);
    websocket = new WebSocket(ws_url + sessionId);

    /**
     * Handles the successful opening of the WebSocket connection.
     * Updates UI to reflect the 'Connected' state and enables the input form.
     */
    websocket.onopen = function () {
        console.log("WebSocket connection opened.");
        document.getElementById("status-text").textContent = "Connected";
        document.getElementById("status-dot").classList.remove('animate-pulse', 'bg-yellow-400');
        document.getElementById("status-dot").classList.add('bg-green-500');
        sendButton.disabled = false;
        messagesDiv.innerHTML = ''; 
        addSubmitHandler();
    };

    /**
     * Handles incoming messages from the WebSocket server.
     * This is the primary logic for processing agent responses, including
     * text streaming, final Markdown rendering, and parsing of hidden JSON data.
     * @param {MessageEvent} event - The event object containing the server message.
     */
    websocket.onmessage = function (event) {
        const message_from_server = JSON.parse(event.data);

        // When the agent signals the turn is complete, process the final message bubble.
        if (message_from_server.turn_complete && message_from_server.turn_complete == true) {
            if (currentMessageId) {
                const finalBubble = document.getElementById(currentMessageId);
                if (finalBubble) {
                    const rawContent = finalBubble.textContent;

                    // Search for the hidden JSON data within an HTML comment.
                    const jsonRegex = /<!-- ANALYSIS_JSON_START([\s\S]*?)ANALYSIS_JSON_END -->/;
                    const jsonMatch = rawContent.match(jsonRegex);

                    if (jsonMatch && jsonMatch[1]) {
                        // If JSON is found, parse it and populate the analysis view.
                        try {
                            const jsonDataString = jsonMatch[1].trim();
                            const analysisData = JSON.parse(jsonDataString);
                            populateAnalysisView(analysisData);
                            
                            // Clean the markdown by removing the comment block before rendering.
                            const cleanMarkdown = rawContent.replace(jsonRegex, "\n\n*Analysis view has been populated.*");
                            const dirtyHtml = marked.parse(cleanMarkdown);
                            finalBubble.innerHTML = DOMPurify.sanitize(dirtyHtml);
                        } catch (e) {
                            console.error("Failed to parse JSON from HTML comment", e);
                            const dirtyHtml = marked.parse(rawContent);
                            finalBubble.innerHTML = DOMPurify.sanitize(dirtyHtml);
                        }
                    } else {
                        // If no JSON is found, just render the standard Markdown.
                        const dirtyHtml = marked.parse(rawContent);
                        finalBubble.innerHTML = DOMPurify.sanitize(dirtyHtml);
                    }
                }
            }
            // Reset state for the next turn.
            currentMessageId = null;
            sendButton.disabled = false;
            messageInput.disabled = false;
            return;
        }

        // Handle streaming text chunks from the agent.
        if (message_from_server.mime_type == "text/plain") {
            let messageElement;
            // If this is the first chunk, create a new message bubble.
            if (currentMessageId == null) {
                currentMessageId = `agent-msg-${Math.random().toString(36).substring(7)}`;
                messageElement = document.createElement("div");
                messageElement.id = currentMessageId;
                messageElement.className = "message-bubble agent-message-bubble"; 
                messagesDiv.appendChild(messageElement);
            } else {
                // Otherwise, append to the existing bubble.
                messageElement = document.getElementById(currentMessageId);
            }
            
            if(messageElement){
                messageElement.textContent += message_from_server.data;
                messagesDiv.scrollTop = messagesDiv.scrollHeight;
            }
        }
    };

    /**
     * Handles the closing of the WebSocket connection.
     * Updates the UI and attempts to reconnect after a delay.
     */
    websocket.onclose = function () {
        console.log("WebSocket connection closed.");
        sendButton.disabled = true;
        document.getElementById("status-text").textContent = "Connection closed. Reconnecting...";
        document.getElementById("status-dot").classList.add('animate-pulse', 'bg-yellow-400');
        document.getElementById("status-dot").classList.remove('bg-green-500');
        setTimeout(function () {
            console.log("Reconnecting...");
            connectWebsocket();
        }, 5000);
    };

    /**
     * Handles any errors that occur with the WebSocket connection.
     * @param {Event} e - The error event.
     */
    websocket.onerror = function (e) {
        console.log("WebSocket error: ", e);
    };
}

// Initial connection attempt.
connectWebsocket();


// =============================================================================
// User Input and Message Sending
// =============================================================================

/**
 * Attaches the submit event listener to the message input form.
 */
function addSubmitHandler() {
    messageForm.onsubmit = function (e) {
        e.preventDefault();
        const message = messageInput.value;
        if (message) {
            // Create and display the user's message bubble.
            const userMessageBubble = document.createElement("div");
            userMessageBubble.className = "message-bubble user-message-bubble";
            userMessageBubble.textContent = message;
            messagesDiv.appendChild(userMessageBubble);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;

            // Reset and disable the form while the agent is processing.
            messageInput.value = "";
            sendButton.disabled = true;
            messageInput.disabled = true;

            // Send the message to the server.
            sendMessage({
                mime_type: "text/plain",
                data: message,
            });
        }
        return false;
    };
}

/**
 * Sends a message object to the WebSocket server.
 * @param {object} message - The message object to send, typically { mime_type, data }.
 */
function sendMessage(message) {
    if (websocket && websocket.readyState == WebSocket.OPEN) {
        const messageJson = JSON.stringify(message);
        websocket.send(messageJson);
    }
}


// =============================================================================
// UI Control and Data Population
// =============================================================================

/**
 * Toggles the visibility between the main chat view and the analysis view.
 */
function toggleView() {
    if (chatView && analysisView) {
        chatView.classList.toggle('hidden');
        analysisView.classList.toggle('hidden');
        analysisView.classList.toggle('flex');
    }
}

/**
 * Populates the analysis view with structured data received from the agent.
 * @param {object} data - The JSON object containing the analysis data.
 */
function populateAnalysisView(data) {
    // Populate header and summary cards.
    document.getElementById('analysis-title').textContent = data.title || "Analysis";
    document.getElementById('analysis-date').textContent = data.date || new Date().toLocaleString();
    document.getElementById('contradictions-count').textContent = data.contradictionsCount || 0;
    document.getElementById('confirmations-count').textContent = data.confirmationsCount || 0;
    document.getElementById('confidence-score').textContent = `${data.confidenceScore || 0}%`;
    document.getElementById('confidence-bar').style.width = `${data.confidenceScore || 0}%`;

    const contradictionsList = document.getElementById('contradictions-list');
    const confirmationsList = document.getElementById('confirmations-list');

    // Clear previous details.
    contradictionsList.innerHTML = `<h3 class="text-lg font-semibold text-red-800 mb-2">Contradictions (${data.contradictionsCount || 0})</h3>`;
    confirmationsList.innerHTML = `<h3 class="text-lg font-semibold text-green-800 mb-2">Confirmations (${data.confirmationsCount || 0})</h3>`;

    // Populate contradiction details.
    (data.contradictions || []).forEach(item => {
        const el = document.createElement('div');
        el.className = 'bg-white border border-red-200 p-4 rounded-lg mb-4';
        el.innerHTML = `
            <p class="text-slate-700">"${item.text}"</p>
            <p class="text-xs text-slate-500 mt-2"><strong>Analysis:</strong> ${item.analysis}</p>
            <span class="inline-block bg-red-100 text-red-800 text-xs font-semibold mt-2 px-2.5 py-0.5 rounded-full">${item.level}</span>
        `;
        contradictionsList.appendChild(el);
    });

    // Populate confirmation details.
    (data.confirmations || []).forEach(item => {
        const el = document.createElement('div');
        el.className = 'bg-white border border-green-200 p-4 rounded-lg mb-4';
        el.innerHTML = `
            <p class="text-slate-700">"${item.text}"</p>
            <p class="text-xs text-slate-500 mt-2"><strong>Analysis:</strong> ${item.analysis}</p>
            <span class="inline-block bg-green-100 text-green-800 text-xs font-semibold mt-2 px-2.5 py-0.5 rounded-full">${item.level}</span>
        `;
        confirmationsList.appendChild(el);
    });
}
