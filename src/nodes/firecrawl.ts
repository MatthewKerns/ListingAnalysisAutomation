/**
 * Firecrawl Node - Scrapes Amazon listings
 */

import { scrapeAndParseAmazon } from '../lib/firecrawl-amazon.js';
import { WorkflowState } from '../types/index.js';

export async function scrapeListings(
  state: WorkflowState,
  firecrawlApiKey: string
): Promise<Partial<WorkflowState>> {
  console.log(`🔥 Scraping ${state.asins.length} Amazon listings with Firecrawl...`);

  const scrapedListings = new Map(state.scrapedListings);
  const errors = [...state.errors];

  // Scrape each ASIN with rate limiting
  for (let i = 0; i < state.asins.length; i++) {
    const asin = state.asins[i];
    console.log(`  [${i + 1}/${state.asins.length}] Scraping ${asin}...`);

    try {
      const result = await scrapeAndParseAmazon(asin, firecrawlApiKey);

      if (result.success && result.data) {
        scrapedListings.set(asin, result.data);
        console.log(`    ✅ Success: ${result.data.title.substring(0, 60)}...`);
      } else {
        console.log(`    ❌ Failed: ${result.error}`);
        errors.push({
          step: 'firecrawl',
          asin,
          message: result.error || 'Unknown error'
        });
      }

      // Rate limiting: wait 2 seconds between requests
      if (i < state.asins.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

    } catch (error) {
      console.log(`    ❌ Error: ${error}`);
      errors.push({
        step: 'firecrawl',
        asin,
        message: error instanceof Error ? error.message : String(error)
      });
    }
  }

  console.log(`✅ Scraped ${scrapedListings.size}/${state.asins.length} listings successfully`);

  return {
    scrapedListings,
    errors,
  };
}
