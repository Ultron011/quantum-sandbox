const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
    console.error("❌ Error: OPENAI_API_KEY is not set!");
    process.exit(1);
}

/**
 * Universal, dependency-free HTTP helper to call OpenAI using Bun's native fast fetch.
 * Requests structured JSON outputs natively.
 */
async function callLLM(
    systemPrompt: string,
    userPrompt: string,
    expectJSON: boolean = true
): Promise<any> {
    const payload: any = {
        model: "gpt-4o-mini",
        messages: [
            {"role": "system", content: systemPrompt},
            {"role": "user", content: userPrompt}
        ],
        temperature: 0.2
    };

    if (expectJSON) {
        payload.response_format = { type: "json_object" };
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`LLM Call failed (HTTP ${response.status}): ${errText}`)
    }

    const result: any = await response.json();
    const textContent = result.choices[0].message.content;

    if (expectJSON) {
        return JSON.parse(textContent);
    }
    return textContent;
}


/**
 * Agent 1: The Builder.
 * Focuses purely on writing the clean, functional algorithmic solution.
 */
export async function runBuilderAgent(requirement: string): Promise<string> {
    const systemPrompt = `
        You are an elite, first-principles systems engineer.
        Your task is to write a clean, optimized JavaScript function that solves the user's requirement.
        
        CRITICAL RULES:
        1. Write ONLY vanilla JavaScript. Do not use external require or import statements.
        2. Ensure all variables are properly declared (const/let).
        3. You must return a JSON object with a single key "code" containing the raw JavaScript function as a string.
        
        Example Output:
        {
        "code": "function add(a, b) {\\n  return a + b;\\n}"
        }
    `;

    console.log("🚀 [Agent Swarm] Dispatching Builder Agent to write core code...");
    const result = await callLLM(systemPrompt, `Requirement: "${requirement}"`);
    return result.code;
}

/**
 * Agent 2: The Auditor.
 * A cynical QA engineer tasked with writing aggressive assertions to break the Builder's code.
 */
export async function runAuditorAgent(
  requirement: string,
  builderCode: string
): Promise<string> {
    const systemPrompt = `
        You are a highly critical, cynical QA Automation Architect.
        A junior developer has written code to solve a requirement. Your task is to write a comprehensive test suite of assertions to verify the code is robust.
        
        You have access to a global 'assert' helper with two methods:
        - assert.equal(actual, expected, message?)
        - assert.ok(value, message?)
        
        CRITICAL RULES:
        1. Write ONLY raw JS assertion calls using the 'assert' helper. Do not wrap in functions or describe blocks.
        2. Write at least 4-5 distinct assertions targeting extreme edge cases (e.g. empty strings, null, negative numbers, extreme inputs).
        3. Be adversarial: actively try to find boundary conditions where the junior developer's code might fail.
        4. You must return a JSON object with a single key "assertions" containing the assertions code as a string.
        
        Example Output:
        {
        "assertions": "assert.equal(add(1, 2), 3, 'Simple addition check');\\nassert.equal(add(-1, -1), -2, 'Negative numbers check');"
        }
    `;

    const userPrompt = `
        Requirement: "${requirement}"
        Junior Developer's Code:
        \`\`\`javascript
        ${builderCode}
        \`\`\`
    `;
    console.log("🕵️‍♂️ [Agent Swarm] Dispatching Auditor Agent to compile unit tests...");
    const result = await callLLM(systemPrompt, userPrompt);
    return result.assertions;
}