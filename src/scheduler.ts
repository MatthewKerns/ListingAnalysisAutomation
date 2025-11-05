/**
 * Cron Scheduler for Monthly Automation
 */

import cron from 'node-cron';
import { runWorkflow } from './workflow.js';
import dotenv from 'dotenv';

dotenv.config();

const CRON_SCHEDULE = process.env.CRON_SCHEDULE || '0 0 1 * *';

console.log('🕐 Listing Analysis Automation Scheduler Started');
console.log(`📅 Schedule: ${CRON_SCHEDULE}`);
console.log('   Default: 0 0 1 * * (Midnight on the 1st of every month)');
console.log('\nWaiting for scheduled runs...\n');

// Validate cron expression
if (!cron.validate(CRON_SCHEDULE)) {
  console.error('❌ Invalid cron schedule expression:', CRON_SCHEDULE);
  console.log('\nCron format: minute hour day month weekday');
  console.log('Examples:');
  console.log('  0 0 1 * *     - Midnight on the 1st of every month');
  console.log('  0 9 * * 1     - Every Monday at 9 AM');
  console.log('  0 0 */7 * *   - Every 7 days at midnight');
  process.exit(1);
}

// Schedule the workflow
cron.schedule(CRON_SCHEDULE, async () => {
  console.log('\n' + '='.repeat(60));
  console.log(`🚀 Scheduled run triggered at ${new Date().toISOString()}`);
  console.log('='.repeat(60) + '\n');

  try {
    await runWorkflow();
    console.log('\n✅ Scheduled run completed successfully');
  } catch (error) {
    console.error('\n❌ Scheduled run failed:', error);
  }

  console.log('\n' + '='.repeat(60));
  console.log('⏰ Next scheduled run will occur at:',
    new Date(Date.now() + getNextRunDelay(CRON_SCHEDULE)).toISOString());
  console.log('='.repeat(60) + '\n');
});

// Helper function to estimate next run (rough approximation)
function getNextRunDelay(cronExpression: string): number {
  // For monthly runs (default), estimate 30 days
  if (cronExpression.includes('1 * *')) {
    return 30 * 24 * 60 * 60 * 1000;
  }
  // For weekly runs
  if (cronExpression.includes('* * 1')) {
    return 7 * 24 * 60 * 60 * 1000;
  }
  // Default: 1 day
  return 24 * 60 * 60 * 1000;
}

// Keep the process running
process.on('SIGINT', () => {
  console.log('\n\n🛑 Scheduler stopped by user');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n🛑 Scheduler terminated');
  process.exit(0);
});
