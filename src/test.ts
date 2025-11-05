/**
 * Test script for quick validation
 */

import { scrapeAndParseAmazon } from './lib/firecrawl-amazon.js';
import dotenv from 'dotenv';

dotenv.config();

async function testFirecrawl() {
  console.log('🧪 Testing Firecrawl Amazon Scraper\n');
  console.log('=' .repeat(60));

  const testAsin = 'B0CJBN849W'; // Example ASIN
  const apiKey = process.env.FIRECRAWL_API_KEY;

  if (!apiKey) {
    console.error('❌ FIRECRAWL_API_KEY not found in .env');
    console.log('\nTo test:');
    console.log('1. Copy .env.example to .env');
    console.log('2. Add your Firecrawl API key');
    console.log('3. Run: npm run test');
    return;
  }

  console.log(`📦 Testing with ASIN: ${testAsin}`);
  console.log(`🔑 API Key: ${apiKey.substring(0, 10)}...`);
  console.log();

  try {
    const result = await scrapeAndParseAmazon(testAsin, apiKey);

    if (result.success && result.data) {
      console.log('✅ SUCCESS!\n');
      console.log('📊 Scraped Data:');
      console.log(`  Title: ${result.data.title}`);
      console.log(`  Price: $${result.data.price}`);
      console.log(`  Rating: ${result.data.rating} stars`);
      console.log(`  Reviews: ${result.data.reviewCount.toLocaleString()}`);
      console.log(`  Bullets: ${result.data.bullets.length} items`);
      console.log(`  Images: ${result.data.images.length} found`);
      console.log();

      console.log('🔹 First 3 Bullet Points:');
      result.data.bullets.slice(0, 3).forEach((bullet, i) => {
        console.log(`  ${i + 1}. ${bullet.substring(0, 80)}...`);
      });
      console.log();

      console.log('🖼️  Image URLs:');
      result.data.images.slice(0, 3).forEach((img, i) => {
        console.log(`  ${i + 1}. ${img.url.substring(0, 80)}...`);
      });
      console.log();

      console.log('=' .repeat(60));
      console.log('✅ Firecrawl test passed!');
      console.log('\n📝 Full data saved to test-output.json');

      // Save to file for inspection
      const fs = await import('fs');
      fs.writeFileSync(
        'test-output.json',
        JSON.stringify(result.data, null, 2)
      );

    } else {
      console.log('❌ FAILED\n');
      console.log('Error:', result.error);
    }

  } catch (error) {
    console.error('❌ ERROR:', error);
  }
}

testFirecrawl();
