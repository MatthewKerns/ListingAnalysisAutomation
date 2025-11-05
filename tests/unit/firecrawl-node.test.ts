/**
 * Unit tests for Firecrawl workflow node
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { scrapeListings } from '../../src/nodes/firecrawl.js';
import { sampleFirecrawlResponse } from '../fixtures/amazon-sample.js';

// Mock the firecrawl-amazon module
vi.mock('../../src/lib/firecrawl-amazon.js', () => ({
  scrapeAndParseAmazon: vi.fn(),
}));

describe('scrapeListings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should scrape all ASINs in state', async () => {
    const { scrapeAndParseAmazon } = await import('../../src/lib/firecrawl-amazon.js');
    (scrapeAndParseAmazon as any).mockResolvedValue({
      success: true,
      data: {
        asin: 'B0TEST',
        title: 'Test Product',
        price: 10.99,
        rating: 4.5,
        reviewCount: 100,
        bullets: ['Bullet 1'],
        description: 'Test description',
        images: [],
        parsedAt: '2024-01-01T00:00:00.000Z',
      },
    });

    const state = {
      asins: ['B0TEST1', 'B0TEST2'],
      scrapedListings: new Map(),
      imageAnalysis: new Map(),
      errors: [],
    };

    const promise = scrapeListings(state, 'test-api-key');

    // Fast-forward through the rate limiting delays
    await vi.runAllTimersAsync();

    const result = await promise;

    expect(scrapeAndParseAmazon).toHaveBeenCalledTimes(2);
    expect(result.scrapedListings?.size).toBe(2);
  });

  it('should handle scraping errors gracefully', async () => {
    const { scrapeAndParseAmazon } = await import('../../src/lib/firecrawl-amazon.js');
    (scrapeAndParseAmazon as any)
      .mockResolvedValueOnce({ success: true, data: { asin: 'B0TEST1', title: 'Product 1' } })
      .mockResolvedValueOnce({ success: false, error: 'Scraping failed' });

    const state = {
      asins: ['B0TEST1', 'B0TEST2'],
      scrapedListings: new Map(),
      imageAnalysis: new Map(),
      errors: [],
    };

    const promise = scrapeListings(state, 'test-api-key');
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result.scrapedListings?.size).toBe(1);
    expect(result.errors?.length).toBeGreaterThan(0);
    expect(result.errors?.[0].step).toBe('firecrawl');
  });

  it('should implement rate limiting between requests', async () => {
    const { scrapeAndParseAmazon } = await import('../../src/lib/firecrawl-amazon.js');
    (scrapeAndParseAmazon as any).mockResolvedValue({ success: true, data: { asin: 'B0TEST' } });

    const state = {
      asins: ['B0TEST1', 'B0TEST2', 'B0TEST3'],
      scrapedListings: new Map(),
      imageAnalysis: new Map(),
      errors: [],
    };

    const promise = scrapeListings(state, 'test-api-key');

    // Verify timers are being used
    expect(vi.getTimerCount()).toBeGreaterThan(0);

    await vi.runAllTimersAsync();
    await promise;
  });

  it('should track errors with ASIN information', async () => {
    const { scrapeAndParseAmazon } = await import('../../src/lib/firecrawl-amazon.js');
    (scrapeAndParseAmazon as any).mockResolvedValue({ success: false, error: 'API error' });

    const state = {
      asins: ['B0BADSKU'],
      scrapedListings: new Map(),
      imageAnalysis: new Map(),
      errors: [],
    };

    const promise = scrapeListings(state, 'test-api-key');
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result.errors?.[0].asin).toBe('B0BADSKU');
    expect(result.errors?.[0].message).toContain('API error');
  });

  it('should handle exceptions during scraping', async () => {
    const { scrapeAndParseAmazon } = await import('../../src/lib/firecrawl-amazon.js');
    (scrapeAndParseAmazon as any).mockRejectedValue(new Error('Network error'));

    const state = {
      asins: ['B0TEST'],
      scrapedListings: new Map(),
      imageAnalysis: new Map(),
      errors: [],
    };

    const promise = scrapeListings(state, 'test-api-key');
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result.errors?.length).toBeGreaterThan(0);
    expect(result.errors?.[0].message).toContain('Network error');
  });
});
