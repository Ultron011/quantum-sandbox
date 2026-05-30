import { executeSelfHealingWorkflow } from "./engine";

async function main() {
  const requirement = "Write a function named 'reverseString' that takes a string and returns it reversed.";
  
  console.log("=========================================");
  console.log("🔥 LAUNCHING AGENTIC SELF-HEALING ENGINE");
  console.log("=========================================");

  const startTime = Date.now();
  const result = await executeSelfHealingWorkflow(requirement);
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log("\n=========================================");
  console.log(`🏆 ENGINE COMPLETED IN ${duration}s! (Total Attempts: ${result.attempts})`);
  console.log(`Final Success Status: ${result.success}`);
  console.log("=========================================");

  if (result.success) {
    console.log("\n🏆 Final Self-Healed Code Output:");
    console.log(result.code);
    
    console.log("\n🕵️‍♂️ Verified Assertions Run:");
    console.log(result.assertions); 
  } else {
    console.error("\n☠️ Self-healing failed to reach consensus.");
  }
}

main().catch(console.error);