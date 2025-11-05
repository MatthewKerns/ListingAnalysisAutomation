/**
 * Main entry point for Listing Analysis Automation
 */

import { runWorkflow } from './workflow.js';

async function main() {
  try {
    await runWorkflow();
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

main();
