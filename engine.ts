import { executeInSandbox, type SandboxResult } from "./sandbox";
import { runBuilderAgent, runAuditorAgent } from "./swarm";

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.error("❌ Error: OPENAI_API_KEY is not set!");
  process.exit(1);
}

/**
 * Universal HTTP helper to call OpenAI securely.
 */
async function callLLM(
  systemPrompt: string,
  userPrompt: string
): Promise<any> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST", 
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.1,
      response_format: { type: "json_object" }
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Header LLM call failed (HTTP ${response.status}): ${errText}`)
  }

  const result: any = await response.json();
  return JSON.parse(result.choices[0].message.content);
}

/**
 * Agent 3: The Healer.
 * Takes failing code, assertions, and the sandbox crash payload, 
 * and writes a precise mathematical bug fix.
 */
async function runHealerAgent(
  requirement: string,
  failingCode: string,
  assertions: string,
  errorResult: SandboxResult
): Promise<string> {
  const systemPrompt = `
    You are an elite Systems Debugger and Compiler Engineer.
    A JavaScript function has failed execution inside our isolated V8 sandbox.
    Your task is to analyze the code, the unit test assertions, and the exact V8 runtime error trace, and rewrite the code to fix the bug.
    
    RULES:
    1. Fix the bug causing the crash, ensuring it passes the failing assertions.
    2. Maintain all original functionality for already successful test cases.
    3. Return a JSON object with a single key "code" containing the raw corrected JavaScript function string.
    
    Example Output:
    {
      "code": "function reverseString(str) {\\n  if (str === null) return 'null';\\n  // ... rest of logic\\n}"
    }
  `;
  const userPrompt = `
    Requirement: "${requirement}"
    
    Failing Code:
    \`\`\`javascript
    ${failingCode}
    \`\`\`
    
    Test Assertions:
    \`\`\`javascript
    ${assertions}
    \`\`\`
    
    Sandbox Execution Error Details:
    - Error Type:    [${errorResult.errorType}]
    - Error Message: "${errorResult.error}"
    - Stack Trace:
    ${errorResult.stackTrace}
    
    Logs Captured:
    ${errorResult.logs.join("\n")}
  `;
  console.log("🛠️ [Engine] Dispatching Healer Agent to analyze stack trace and patch code...");
  const result = await callLLM(systemPrompt, userPrompt);
  return result.code;
}

interface WorkflowResult {
  success: boolean;
  code: string;
  assertions: string;
  attempts: number;
  logs: string[];
}

/**
 * Main Self-Healing Orchestration Engine.
 * Runs the swarm, executes tests inside the V8 sandbox, 
 * and automatically triggers recursive healing loops on failure.
 */
export async function executeSelfHealingWorkflow(
  requirement: string,
  maxAttempts: number = 4,
  onLog?: (msg: string) => void
): Promise<WorkflowResult> {
  const logs: string[] = [];

  const log = (msg: string) => {
    console.log(msg);
    logs.push(msg);
    if (onLog) {
      onLog(msg);
    }
  }

  log(`\n▶️ Starting QuantumSandbox Engine for requirement: "${requirement}"`);

  let code = await runBuilderAgent(requirement);
  let assertions = await runAuditorAgent(requirement, code);

  let attempt = 0;
  let success = false;

  while (attempt < maxAttempts) {
    attempt++;
    log(`\n=========================================`);
    log(`⏳ EXECUTION ATTEMPT ${attempt}/${maxAttempts}`);
    log(`=========================================`);

    const script = `
    ${code}

    ${assertions}
    `;

    const result = executeInSandbox(script);
    
    if (result.success) {
      log(`🏆 SUCCESS! Sandbox execution passed 100% of unit tests on attempt ${attempt}.`);
      success = true;
      break;
    }

    log(`❌ FAILED on attempt ${attempt}!`);
    log(`   Error Type:    [${result.errorType}]`);
    log(`   Error Message: "${result.error}"`);    

    if (attempt >= maxAttempts) {
      log(`\n☠️ HEALING EXHAUSTED: Reached max limit of ${maxAttempts} attempts. Giving up.`);
      break;
    }

    log(`🧬 Initiating Genetic Self-Healing...`);
    try {
      code = await runHealerAgent(requirement, code, assertions, result);
      log(`✅ Applied code patch for attempt ${attempt + 1}. Re-running compilation...`);
    } catch (healErr: any) {
      log(`❌ Healer Agent failed to compile patch: ${healErr.message}`);
      break;
    }
  }

  return {
    success, 
    code,
    assertions,
    attempts: attempt,
    logs
  };
}