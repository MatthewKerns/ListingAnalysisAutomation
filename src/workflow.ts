/**
 * LangGraph Workflow for Listing Analysis Automation
 */

import { StateGraph, END } from '@langchain/langgraph';
import { WorkflowState } from './types/index.js';
import { readAsinsFromSheet } from './nodes/googleSheets.js';
import { scrapeListings } from './nodes/firecrawl.js';
import { analyzeImages } from './nodes/rekognition.js';
import { analyzeWithGPT } from './nodes/chatgpt.js';
import { sendEmail, saveToGoogleDrive } from './nodes/output.js';
import { loadConfig } from './utils/config.js';

/**
 * Create the LangGraph workflow
 */
export function createWorkflow() {
  const config = loadConfig();

  // Define the graph
  const workflow = new StateGraph<WorkflowState>({
    channels: {
      asins: { value: (left?: string[], right?: string[]) => right ?? left ?? [] },
      scrapedListings: { value: (left?: Map<string, any>, right?: Map<string, any>) => right ?? left ?? new Map() },
      imageAnalysis: { value: (left?: Map<string, any>, right?: Map<string, any>) => right ?? left ?? new Map() },
      gptAnalysis: { value: (left?: any, right?: any) => right ?? left },
      emailSent: { value: (left?: boolean, right?: boolean) => right ?? left },
      driveSaved: { value: (left?: boolean, right?: boolean) => right ?? left },
      errors: { value: (left?: any[], right?: any[]) => right ?? left ?? [] },
    },
  });

  // Add nodes
  workflow.addNode('readSheet', async (state: WorkflowState) => {
    return await readAsinsFromSheet(state, config.googleSheetId, config.googleCredentialsPath);
  });

  workflow.addNode('scrape', async (state: WorkflowState) => {
    return await scrapeListings(state, config.firecrawlApiKey);
  });

  workflow.addNode('analyzeImages', async (state: WorkflowState) => {
    return await analyzeImages(state, {
      region: config.awsRegion,
      accessKeyId: config.awsAccessKeyId,
      secretAccessKey: config.awsSecretAccessKey,
    });
  });

  workflow.addNode('analyzeWithGPT', async (state: WorkflowState) => {
    return await analyzeWithGPT(state, config.openaiApiKey);
  });

  workflow.addNode('sendEmail', async (state: WorkflowState) => {
    return await sendEmail(state, {
      user: config.gmailUser,
      password: config.gmailPassword,
    });
  });

  workflow.addNode('saveToDrive', async (state: WorkflowState) => {
    return await saveToGoogleDrive(state, {
      credentialsPath: config.googleCredentialsPath,
      folderId: config.driveFolderId,
    });
  });

  // Define edges (workflow flow)
  workflow.addEdge('__start__', 'readSheet');
  workflow.addEdge('readSheet', 'scrape');
  workflow.addEdge('scrape', 'analyzeImages');
  workflow.addEdge('analyzeImages', 'analyzeWithGPT');
  workflow.addEdge('analyzeWithGPT', 'sendEmail');
  workflow.addEdge('sendEmail', 'saveToDrive');
  workflow.addEdge('saveToDrive', END);

  return workflow.compile();
}

/**
 * Run the workflow
 */
export async function runWorkflow() {
  console.log('🚀 Starting Listing Analysis Automation Workflow\n');
  console.log('=' .repeat(60));

  const app = createWorkflow();

  const initialState: WorkflowState = {
    asins: [],
    scrapedListings: new Map(),
    imageAnalysis: new Map(),
    errors: [],
  };

  try {
    const result = await app.invoke(initialState);

    console.log('\n' + '='.repeat(60));
    console.log('✅ Workflow completed successfully!\n');
    console.log('📊 Final Results:');
    console.log(`  - ASINs processed: ${result.asins.length}`);
    console.log(`  - Listings scraped: ${result.scrapedListings.size}`);
    console.log(`  - Images analyzed: ${Array.from(result.imageAnalysis.values()).reduce((sum, a) => sum + a.images.length, 0)}`);
    console.log(`  - Email sent: ${result.emailSent ? '✅' : '❌'}`);
    console.log(`  - Saved to Drive: ${result.driveSaved ? '✅' : '❌'}`);

    if (result.errors.length > 0) {
      console.log(`\n⚠️  Errors encountered: ${result.errors.length}`);
      result.errors.forEach(error => {
        console.log(`  - [${error.step}] ${error.message}${error.asin ? ` (${error.asin})` : ''}`);
      });
    }

    return result;

  } catch (error) {
    console.error('\n❌ Workflow failed:', error);
    throw error;
  }
}
