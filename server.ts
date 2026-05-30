import { serve } from "bun";
import { executeSelfHealingWorkflow } from "./engine";

const server = serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);

    // 1. Serve the Stunning Hacker Dashboard (HTML/CSS/JS)
    if (req.method === "GET" && url.pathname === "/") {
      return new Response(getHtmlDashboard(), {
        headers: { "Content-Type": "text/html; charset=utf-8" }
      });
    }

    // 2. Serve the Server-Sent Events (SSE) Streaming Endpoint
    if (req.method === "GET" && url.pathname === "/api/stream") {
      const requirement = url.searchParams.get("requirement");

      if (!requirement) {
        return new Response(JSON.stringify({ error: "Missing requirement parameter" }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }

      console.log(`📡 [Web Server] Opening SSE stream for requirement: "${requirement}"`);
      const encoder = new TextEncoder();

      // Return a standard readable stream with text/event-stream content type
      const stream = new ReadableStream({
        async start(controller) {
          const sendLog = (message: string) => {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "log", message })}\n\n`));
          };

          try {
            sendLog("⚡ Connecting to QuantumSandbox isolated VM runtime...");
            
            // Execute the self-healing workflow, feeding logs into our SSE controller!
            const result = await executeSelfHealingWorkflow(requirement, 4, (msg) => {
              sendLog(msg);
            });

            // Send completion packet with final code and assertions
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ 
                type: "done", 
                code: result.code, 
                assertions: result.assertions,
                success: result.success
              })}\n\n`)
            );
            
            controller.close();
          } catch (err: any) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "error", message: err.message })}\n\n`));
            controller.close();
          }
        }
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive"
        }
      });
    }

    // 404 Fallback
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" }
    });
  }
});

console.log(`🚀 QuantumSandbox Dashboard running at http://localhost:${server.port}`);

/**
 * Embedded responsive, dark-mode, glassmorphism dashboard HTML code.
 * Free of placeholders, utilizing native styling and Web EventSources.
 */
function getHtmlDashboard(): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>QuantumSandbox | Agentic Self-Healing Engine</title>
  <link href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500&family=Outfit:wght@400;600;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-dark: #09090b;
      --panel-dark: rgba(18, 18, 22, 0.6);
      --border-dark: rgba(39, 39, 42, 0.8);
      --glow-green: #10b981;
      --glow-red: #ef4444;
      --text-muted: #a1a1aa;
      --text-light: #f4f4f5;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Outfit', sans-serif;
      background-color: var(--bg-dark);
      color: var(--text-light);
      min-height: 100vh;
      overflow-x: hidden;
      background-image: 
        radial-gradient(circle at 10% 20%, rgba(16, 185, 129, 0.05) 0%, transparent 40%),
        radial-gradient(circle at 90% 80%, rgba(59, 130, 246, 0.05) 0%, transparent 40%);
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }

    header {
      margin-bottom: 2.5rem;
      text-align: center;
    }

    h1 {
      font-size: 2.5rem;
      font-weight: 800;
      letter-spacing: -1px;
      margin-bottom: 0.5rem;
      background: linear-gradient(to right, #10b981, #3b82f6);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    p.subtitle {
      color: var(--text-muted);
      font-size: 1.1rem;
    }

    .grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 2rem;
    }

    @media (min-width: 900px) {
      .grid {
        grid-template-columns: 350px 1fr;
      }
    }

    .panel {
      background: var(--panel-dark);
      backdrop-filter: blur(12px);
      border: 1px solid var(--border-dark);
      border-radius: 16px;
      padding: 1.5rem;
      box-shadow: 0 4px 30px rgba(0, 0, 0, 0.4);
    }

    label {
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--text-muted);
      margin-bottom: 0.5rem;
      display: block;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    textarea {
      width: 100%;
      height: 120px;
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid var(--border-dark);
      border-radius: 8px;
      color: var(--text-light);
      padding: 0.75rem;
      font-family: inherit;
      resize: none;
      margin-bottom: 1rem;
      transition: border-color 0.2s;
    }

    textarea:focus {
      outline: none;
      border-color: var(--glow-green);
    }

    button {
      width: 100%;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      font-family: inherit;
      font-weight: 600;
      border: none;
      border-radius: 8px;
      padding: 0.85rem;
      cursor: pointer;
      font-size: 1rem;
      transition: transform 0.1s, box-shadow 0.2s;
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 0.5rem;
    }

    button:hover {
      box-shadow: 0 0 15px rgba(16, 185, 129, 0.4);
    }

    button:active {
      transform: scale(0.98);
    }

    button:disabled {
      background: #27272a;
      color: #71717a;
      cursor: not-allowed;
      box-shadow: none;
    }

    .terminal-container {
      display: flex;
      flex-direction: column;
      height: 550px;
    }

    .terminal-header {
      background: #18181b;
      padding: 0.5rem 1rem;
      border-top-left-radius: 12px;
      border-top-right-radius: 12px;
      border-bottom: 1px solid var(--border-dark);
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
    }
    .dot.red { background: #ef4444; }
    .dot.yellow { background: #f59e0b; }
    .dot.green { background: #10b981; }

    .terminal-title {
      font-size: 0.8rem;
      color: var(--text-muted);
      font-family: 'Fira Code', monospace;
      margin-left: 0.5rem;
    }

    .terminal {
      flex: 1;
      background: #000;
      border-bottom-left-radius: 12px;
      border-bottom-right-radius: 12px;
      padding: 1rem;
      font-family: 'Fira Code', monospace;
      font-size: 0.85rem;
      line-height: 1.5;
      overflow-y: auto;
      color: #34d399;
      text-shadow: 0 0 2px rgba(16, 185, 129, 0.3);
    }

    .terminal::-webkit-scrollbar {
      width: 6px;
    }
    .terminal::-webkit-scrollbar-thumb {
      background: #27272a;
      border-radius: 3px;
    }

    .log-line {
      margin-bottom: 0.35rem;
      white-space: pre-wrap;
    }

    .code-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1.5rem;
      margin-top: 2rem;
    }

    @media (min-width: 900px) {
      .code-grid {
        grid-template-columns: 1fr 1fr;
      }
    }

    pre {
      background: #18181b;
      border: 1px solid var(--border-dark);
      border-radius: 8px;
      padding: 1rem;
      overflow-x: auto;
      font-family: 'Fira Code', monospace;
      font-size: 0.85rem;
      max-height: 350px;
    }

    code {
      color: #f4f4f5;
    }

    .spinner {
      border: 2px solid rgba(255, 255, 255, 0.1);
      width: 16px;
      height: 16px;
      border-radius: 50%;
      border-left-color: #fff;
      animation: spin 1s linear infinite;
      display: none;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>QUANTUMSANDBOX</h1>
      <p class="subtitle">Self-Healing Multi-Agent Secure Execution Engine</p>
    </header>

    <div class="grid">
      <!-- Input Panel -->
      <div class="panel">
        <label for="prompt">Coding Requirement</label>
        <textarea id="prompt" placeholder="Write a function named 'reverseString' that takes a string and returns it reversed..."></textarea>
        <button id="runBtn" onclick="triggerWorkflow()">
          <span class="spinner" id="btnSpinner"></span>
          <span id="btnText">Compile & Heal</span>
        </button>
      </div>

      <!-- Live Terminal Panel -->
      <div class="terminal-container panel" style="padding: 0;">
        <div class="terminal-header">
          <div class="dot red"></div>
          <div class="dot yellow"></div>
          <div class="dot green"></div>
          <span class="terminal-title">VM-Sandbox@V8-isolated-core:~</span>
        </div>
        <div class="terminal" id="terminal">
          <div class="log-line">⚡ Terminal ready. Enter requirement and click 'Compile & Heal'...</div>
        </div>
      </div>
    </div>

    <!-- Output Code Display -->
    <div class="code-grid" id="codePanel" style="display: none;">
      <div class="panel">
        <label>🏆 Final Self-Healed Code</label>
        <pre><code id="finalCode"></code></pre>
      </div>
      <div class="panel">
        <label>🕵️‍♂️ Verified Assertions Run</label>
        <pre><code id="finalAssertions"></code></pre>
      </div>
    </div>
  </div>

  <script>
    const terminal = document.getElementById("terminal");
    const runBtn = document.getElementById("runBtn");
    const spinner = document.getElementById("btnSpinner");
    const btnText = document.getElementById("btnText");
    const codePanel = document.getElementById("codePanel");
    const finalCode = document.getElementById("finalCode");
    const finalAssertions = document.getElementById("finalAssertions");

    function addLog(text) {
      const line = document.createElement("div");
      line.className = "log-line";
      
      // Basic syntax styling for terminal logs
      if (text.includes("SUCCESS")) {
        line.style.color = "#10b981";
        line.style.fontWeight = "bold";
      } else if (text.includes("FAILED") || text.includes("❌")) {
        line.style.color = "#f43f5e";
      } else if (text.includes("EXECUTION ATTEMPT")) {
        line.style.color = "#3b82f6";
        line.style.fontWeight = "bold";
      } else if (text.includes("🧬") || text.includes("🛠️")) {
        line.style.color = "#a78bfa";
      }

      line.textContent = text;
      terminal.appendChild(line);
      terminal.scrollTop = terminal.scrollHeight; // Lock scroll to bottom
    }

    function triggerWorkflow() {
      const promptText = document.getElementById("prompt").value.trim();
      if (!promptText) {
        alert("Please enter a coding requirement!");
        return;
      }

      // 1. Reset UI State
      terminal.innerHTML = "";
      codePanel.style.display = "none";
      runBtn.disabled = true;
      spinner.style.display = "inline-block";
      btnText.textContent = "Healing...";

      // 2. Open Server-Sent Events (SSE) Stream
      const eventSource = new EventSource(\`/api/stream?requirement=\${encodeURIComponent(promptText)}\`);

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === "log") {
          addLog(data.message);
        } else if (data.type === "error") {
          addLog("❌ Server Error: " + data.message);
          eventSource.close();
          resetButton();
        } else if (data.type === "done") {
          eventSource.close();
          resetButton();
          
          if (data.success) {
            codePanel.style.display = "grid";
            finalCode.textContent = data.code;
            finalAssertions.textContent = data.assertions;
          }
        }
      };

      eventSource.onerror = (err) => {
        addLog("❌ Connection closed or timed out.");
        eventSource.close();
        resetButton();
      };
    }

    function resetButton() {
      runBtn.disabled = false;
      spinner.style.display = "none";
      btnText.textContent = "Compile & Heal";
    }
  </script>
</body>
</html>
  `;
}
