/**
 * Test the core workflow: Scrape → Rekognition → ChatGPT
 * (Skips Google Sheets/Gmail/Drive for faster testing)
 */

import dotenv from 'dotenv';
import { scrapeAndParseAmazon } from './lib/firecrawl-amazon.js';
import { analyzeImages } from './nodes/rekognition.js';
import { analyzeWithGPT } from './nodes/chatgpt.js';
import { WorkflowState } from './types/index.js';

dotenv.config();

async function testCoreWorkflow() {
  console.log('🧪 Testing Core Workflow: Scrape → Rekognition → ChatGPT\n');
  console.log('=' .repeat(60));

  // Test ASINs (your product)
  const testAsins = ['B0CJBN849W'];

  // Check required credentials
  const firecrawlKey = process.env.FIRECRAWL_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  const awsProfile = process.env.AWS_PROFILE;

  if (!firecrawlKey || !openaiKey) {
    console.error('❌ Missing required API keys in .env:');
    if (!firecrawlKey) console.error('  - FIRECRAWL_API_KEY');
    if (!openaiKey) console.error('  - OPENAI_API_KEY');
    return;
  }

  if (!awsProfile && (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY)) {
    console.error('❌ Missing AWS credentials. Set either:');
    console.error('  - AWS_PROFILE (recommended)');
    console.error('  - AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY');
    return;
  }

  console.log(`📦 Testing with ${testAsins.length} ASIN(s)`);
  console.log();

  // Initialize workflow state
  const state: WorkflowState = {
    asins: testAsins,
    scrapedListings: new Map(),
    imageAnalysis: new Map(),
    errors: [],
  };

  try {
    // ============================================================
    // STEP 1: Scrape with Firecrawl
    // ============================================================
    console.log('📡 Step 1: Scraping listings with Firecrawl...\n');

    for (const asin of testAsins) {
      console.log(`  Scraping ${asin}...`);
      const result = await scrapeAndParseAmazon(asin, firecrawlKey);

      if (result.success && result.data) {
        state.scrapedListings.set(asin, result.data);
        console.log(`  ✅ ${asin}: ${result.data.title.substring(0, 60)}...`);
        console.log(`     - Price: $${result.data.price}`);
        console.log(`     - Rating: ${result.data.rating} stars`);
        console.log(`     - Images: ${result.data.images.length} found`);
      } else {
        console.log(`  ❌ ${asin}: Failed to scrape`);
        state.errors.push({
          step: 'firecrawl',
          message: result.error || 'Unknown error',
          asin,
        });
      }
      console.log();
    }

    if (state.scrapedListings.size === 0) {
      console.error('❌ No listings scraped. Stopping.');
      return;
    }

    // ============================================================
    // STEP 2: Analyze Images with Rekognition
    // ============================================================
    console.log('🔍 Step 2: Analyzing images with AWS Rekognition...\n');

    const rekognitionResult = await analyzeImages(state, {
      region: process.env.AWS_REGION || 'us-east-1',
      profile: awsProfile,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    });

    // Merge results into state
    if (rekognitionResult.imageAnalysis) {
      state.imageAnalysis = rekognitionResult.imageAnalysis;
    }
    if (rekognitionResult.errors) {
      state.errors.push(...rekognitionResult.errors);
    }

    console.log(`✅ Analyzed ${state.imageAnalysis.size} listings`);
    console.log();

    // ============================================================
    // STEP 3: Analyze with ChatGPT
    // ============================================================
    console.log('🤖 Step 3: Generating insights with ChatGPT...\n');

    const gptResult = await analyzeWithGPT(state, openaiKey);

    if (gptResult.gptAnalysis) {
      state.gptAnalysis = gptResult.gptAnalysis;
    }
    if (gptResult.errors) {
      state.errors.push(...gptResult.errors);
    }

    // ============================================================
    // STEP 4: Display Results
    // ============================================================
    console.log('\n' + '='.repeat(60));
    console.log('✅ Workflow Test Complete!\n');

    if (state.gptAnalysis) {
      console.log('📊 ANALYSIS RESULTS:\n');
      console.log('━'.repeat(60));
      console.log(state.gptAnalysis.summary);
      console.log('━'.repeat(60));
      console.log();

      if (state.gptAnalysis.competitiveInsights.length > 0) {
        console.log('🔍 COMPETITIVE INSIGHTS:\n');
        state.gptAnalysis.competitiveInsights.forEach((insight, i) => {
          console.log(`${i + 1}. ${insight}`);
        });
        console.log();
      }

      if (state.gptAnalysis.recommendations.length > 0) {
        console.log('💡 RECOMMENDATIONS:\n');
        state.gptAnalysis.recommendations.slice(0, 5).forEach((rec, i) => {
          console.log(`${i + 1}. ${rec}`);
        });
        if (state.gptAnalysis.recommendations.length > 5) {
          console.log(`... and ${state.gptAnalysis.recommendations.length - 5} more`);
        }
        console.log();
      }

      console.log('🖼️  IMAGE QUALITY ANALYSIS:\n');
      console.log(state.gptAnalysis.imageQualityAnalysis);
      console.log();
    }

    // Save full results to file
    const fs = await import('fs');
    const outputFile = 'test-workflow-output.json';
    fs.writeFileSync(
      outputFile,
      JSON.stringify({
        scrapedListings: Array.from(state.scrapedListings.entries()),
        imageAnalysis: Array.from(state.imageAnalysis.entries()),
        gptAnalysis: state.gptAnalysis,
        errors: state.errors,
      }, null, 2)
    );

    console.log('━'.repeat(60));
    console.log(`📝 Full results saved to: ${outputFile}`);
    console.log('━'.repeat(60));

    if (state.errors.length > 0) {
      console.log(`\n⚠️  ${state.errors.length} error(s) encountered:`);
      state.errors.forEach(error => {
        console.log(`  - [${error.step}] ${error.message}${error.asin ? ` (${error.asin})` : ''}`);
      });
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    throw error;
  }
}

testCoreWorkflow();
