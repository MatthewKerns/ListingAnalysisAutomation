/**
 * Test OpenAI API only (using cached scrape data)
 */

import dotenv from 'dotenv';
import { analyzeWithGPT } from './nodes/chatgpt.js';
import { WorkflowState } from './types/index.js';

dotenv.config();

async function testOpenAI() {
  console.log('🧪 Testing OpenAI API\n');
  console.log('=' .repeat(60));

  const openaiKey = process.env.OPENAI_API_KEY;

  if (!openaiKey) {
    console.error('❌ OPENAI_API_KEY not found in .env');
    return;
  }

  console.log(`🔑 API Key: ${openaiKey.substring(0, 20)}...`);
  console.log();

  // Create minimal test data
  const state: WorkflowState = {
    asins: ['B0CJBN849W'],
    scrapedListings: new Map([
      ['B0CJBN849W', {
        asin: 'B0CJBN849W',
        title: 'Premium Top Loader Binder for 216 Cards - Non-Tenting 9 Pocket Double Sided Design',
        price: 34.99,
        rating: 4.7,
        reviewCount: 173,
        bullets: [
          'Perfect Fit Design: Pages lay flat when filled with toploader encased cards',
          'Safely Share the best non-graded cards without fear of scratches',
          'Capacity: Keep 216 of your best toploader encased cards',
        ],
        description: 'Premium toploader binder with zipper closure',
        images: [
          { url: 'https://m.media-amazon.com/images/I/51m-5fMbLHL._AC_SL1500_.jpg', type: 'main' as const, position: 1 },
          { url: 'https://m.media-amazon.com/images/I/41ypzWzyXJL._AC_SL1500_.jpg', type: 'secondary' as const, position: 2 },
        ],
        parsedAt: new Date().toISOString(),
      }]
    ]),
    imageAnalysis: new Map([
      ['B0CJBN849W', {
        asin: 'B0CJBN849W',
        images: [
          {
            url: 'https://m.media-amazon.com/images/I/51m-5fMbLHL._AC_SL1500_.jpg',
            labels: [
              { name: 'Binder', confidence: 95.5 },
              { name: 'Book', confidence: 89.2 },
              { name: 'Storage', confidence: 87.1 },
            ],
            text: [
              { detectedText: '216 CARDS', confidence: 98.5 },
              { detectedText: 'TOPLOADER BINDER', confidence: 97.2 },
            ],
            faces: 0,
            moderationLabels: [],
          }
        ]
      }]
    ]),
    errors: [],
  };

  try {
    console.log('🤖 Calling ChatGPT API...\n');

    const result = await analyzeWithGPT(state, openaiKey);

    if (result.gptAnalysis) {
      console.log('✅ SUCCESS! OpenAI API is working\n');
      console.log('━'.repeat(60));
      console.log('📊 SUMMARY:\n');
      console.log(result.gptAnalysis.summary);
      console.log('\n━'.repeat(60));

      if (result.gptAnalysis.competitiveInsights.length > 0) {
        console.log('\n🔍 COMPETITIVE INSIGHTS:\n');
        result.gptAnalysis.competitiveInsights.forEach((insight, i) => {
          console.log(`${i + 1}. ${insight}`);
        });
        console.log();
      }

      if (result.gptAnalysis.recommendations.length > 0) {
        console.log('\n💡 RECOMMENDATIONS:\n');
        result.gptAnalysis.recommendations.forEach((rec, i) => {
          console.log(`${i + 1}. ${rec}`);
        });
      }

      console.log('\n🖼️  IMAGE QUALITY ANALYSIS:\n');
      console.log(result.gptAnalysis.imageQualityAnalysis);

      console.log('\n━'.repeat(60));
      console.log('✅ OpenAI API key is valid and working!');

      // Save full output to inspect
      const fs = await import('fs');
      fs.writeFileSync('openai-test-output.json', JSON.stringify(result.gptAnalysis, null, 2));
      console.log('📝 Full response saved to: openai-test-output.json');
    } else if (result.errors && result.errors.length > 0) {
      console.error('\n❌ FAILED\n');
      console.error('Errors:', result.errors);
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error);
  }
}

testOpenAI();
