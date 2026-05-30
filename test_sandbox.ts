import { executeInSandbox } from "./sandbox";

async function runTest(title: string, code: string) {
    console.log(`\n=========================================`);
    console.log(`🧪 TEST: ${title}`);
    console.log(`=========================================`);

    const result = executeInSandbox(code);

    console.log(`Success:          ${result.success}`);
    console.log(`Execution Time:   ${result.executionTimeMs}ms`);

    if (result.logs.length > 0) {
        console.log("--- Logs Captured ---");
        result.logs.forEach(log => console.log(`  ${log}`));
    }

    if (!result.success) {
        console.log("--- Exception Caught ---");
        console.log(`  Error Type:  [${result.errorType}]`);
        console.log(`  Message:     "${result.error}"`);
    }
}

async function main() {
    // Test 1 : Harmless arithmetic
    await runTest(
        "Safe Math Execution",
        `
        console.log("Calculating compound interest...");
        const principal = 1000;
        const rate = 0.05;
        const years = 5;
        const amount = principal * Math.pow(1 + rate, years);
        console.log("Result:", amount.toFixed(2));
        `
    );

    // Test 2: Infinite Loop Threat (DEP Timeout Shield)
    await runTest(
        "CPU Infinite Loop Containment",
        `
        console.log("Initiating infinite cycle...");
        let i = 0;
        while (true) {
        i++;
        }
        console.log("This will never print.");
        `
    );  
        
    // Test 3: System Escape Threat (Filesystem Access Check)
    await runTest(
        "System Escape Blocking",
        `
        console.log("Attempting file read...");
        const fs = require('fs'); // Sandbox should block this!
        const data = fs.readFileSync('/etc/passwd');
        console.log("System breached!");
        `
    );

    // Test 4: Assertions Check
    await runTest(
        "Assertion Suite",
        `
        console.log("Running validations...");
        assert.equal(2 + 2, 4, "Basic addition check");
        console.log("First check passed.");
        assert.equal(2 + 2, 5, "Double plus good check"); // Should fail here!
        console.log("This should not be reached.");
        `
    );
}

main().catch(console.error);