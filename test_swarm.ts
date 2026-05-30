import { runBuilderAgent, runAuditorAgent } from "./swarm";
import { executeInSandbox } from "./sandbox";

async function main() {
    const requirement = "Write a function named 'reverseString' that takes a string and returns it reversed.";

    console.log("=========================================");
    console.log(`🎬 STARTING SWARM SIMULATION`);
    console.log(`Requirement: "${requirement}"`);
    console.log("=========================================");

    const code = await runBuilderAgent(requirement);
    console.log("\n--- Generated Builder Code ---");
    console.log(code);

    const assertions = await runAuditorAgent(requirement, code);
    console.log("\n--- Generated Auditor Assertions ---");
    console.log(assertions);

    const combinedScript = `
    ${code}

    ${assertions}
    `

    console.log("\n=========================================");
    console.log("📦 EXECUTING COMBINED SCRIPT IN SANDBOX");
    console.log("=========================================");

    const result = executeInSandbox(combinedScript);

    console.log(`Success:          ${result.success}`);
    console.log(`Execution Time:   ${result.executionTimeMs}ms`);

    if (result.logs.length > 0) {
        console.log("--- Execution Logs ---");
        result.logs.forEach(log => console.log(`  ${log}`));
    }

    if (!result.success) {
        console.error("\n❌ Execution Failed!");
        console.error(`Error Type:  [${result.errorType}]`);
        console.error(`Message:     "${result.error}"`);
        console.error("Stack Trace:");
        console.error(result.stackTrace);
    } else {
        console.log("\n🏆 Success! Swarm passed all assertions flawlessly.");
    }
}

main().catch(console.error);