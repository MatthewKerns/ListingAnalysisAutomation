/**
 * Unit tests for Firecrawl Amazon parser
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { scrapeAmazonListing, parseAmazonListing, scrapeAndParseAmazon } from '../../src/lib/firecrawl-amazon.js';
import { sampleAmazonHTML, sampleAmazonMarkdown, expectedParsedProduct, sampleFirecrawlResponse } from '../fixtures/amazon-sample.js';

describe('parseAmazonListing', () => {
  it('should extract title from HTML productTitle', async () => {
    const result = await parseAmazonListing(sampleAmazonMarkdown, sampleAmazonHTML, 'B0TESTSKU');

    expect(result.success).toBe(true);
    expect(result.data?.title).toBe('Ultimate Guard Katana Sleeves Standard Size Black (100)');
  });

  it('should extract price from markdown', async () => {
    const result = await parseAmazonListing(sampleAmazonMarkdown, sampleAmazonHTML, 'B0TESTSKU');

    expect(result.success).toBe(true);
    expect(result.data?.price).toBe(6.49);
  });

  it('should extract rating and review count', async () => {
    const result = await parseAmazonListing(sampleAmazonMarkdown, sampleAmazonHTML, 'B0TESTSKU');

    expect(result.success).toBe(true);
    expect(result.data?.rating).toBe(4.7);
    expect(result.data?.reviewCount).toBe(2347);
  });

  it('should extract bullet points from HTML', async () => {
    const result = await parseAmazonListing(sampleAmazonMarkdown, sampleAmazonHTML, 'B0TESTSKU');

    expect(result.success).toBe(true);
    expect(result.data?.bullets).toHaveLength(5);
    expect(result.data?.bullets[0]).toBe('Premium quality card sleeves designed for standard size trading cards');
  });

  it('should extract images and convert to high-res URLs', async () => {
    const result = await parseAmazonListing(sampleAmazonMarkdown, sampleAmazonHTML, 'B0TESTSKU');

    expect(result.success).toBe(true);
    expect(result.data?.images.length).toBeGreaterThan(0);
    expect(result.data?.images[0].type).toBe('main');
    expect(result.data?.images[0].url).toContain('_AC_SL1500_');
  });

  it('should limit images to 15', async () => {
    const manyImagesHTML = `
      <div id="imageBlock">
        ${Array.from({ length: 20 }, (_, i) =>
          `<img src="https://m.media-amazon.com/images/I/image${i}._AC_UL320_.jpg">`
        ).join('')}
      </div>
    `;

    const result = await parseAmazonListing('', manyImagesHTML, 'B0TESTSKU');

    expect(result.success).toBe(true);
    expect(result.data?.images.length).toBeLessThanOrEqual(15);
  });

  it('should limit bullets to 10', async () => {
    const manyBulletsHTML = `
      <div id="feature-bullets">
        ${Array.from({ length: 15 }, (_, i) =>
          `<span class="a-list-item">This is bullet point number ${i} with enough text to pass the length filter</span>`
        ).join('')}
      </div>
    `;

    const result = await parseAmazonListing('', manyBulletsHTML, 'B0TESTSKU');

    expect(result.success).toBe(true);
    expect(result.data?.bullets.length).toBeLessThanOrEqual(10);
  });

  it('should handle missing data gracefully', async () => {
    const emptyHTML = '<html><body></body></html>';
    const emptyMarkdown = '';

    const result = await parseAmazonListing(emptyMarkdown, emptyHTML, 'B0TESTSKU');

    expect(result.success).toBe(true);
    expect(result.data?.price).toBe(0);
    expect(result.data?.rating).toBe(0);
    expect(result.data?.reviewCount).toBe(0);
  });

  it('should extract description', async () => {
    const result = await parseAmazonListing(sampleAmazonMarkdown, sampleAmazonHTML, 'B0TESTSKU');

    expect(result.success).toBe(true);
    expect(result.data?.description).toContain('Protect your valuable trading cards');
  });

  it('should filter out navigation bullets from markdown', async () => {
    const markdownWithNav = `
# Product Title
* Customer Questions & Answers
* Valid bullet point that should be included here
* Product Details
* Another valid bullet point
    `;

    const result = await parseAmazonListing(markdownWithNav, '', 'B0TESTSKU');

    expect(result.success).toBe(true);
    expect(result.data?.bullets.some(b => b.includes('Customer Questions'))).toBe(false);
    expect(result.data?.bullets.some(b => b.includes('Product Details'))).toBe(false);
  });

  it('should handle parse errors and return error result', async () => {
    // Trigger error by passing invalid data
    const result = await parseAmazonListing(null as any, null as any, 'B0TESTSKU');

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should include parsedAt timestamp', async () => {
    const result = await parseAmazonListing(sampleAmazonMarkdown, sampleAmazonHTML, 'B0TESTSKU');

    expect(result.success).toBe(true);
    expect(result.data?.parsedAt).toBeDefined();
    expect(new Date(result.data!.parsedAt).getTime()).toBeGreaterThan(0);
  });
});

describe('scrapeAmazonListing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should scrape Amazon listing successfully', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => sampleFirecrawlResponse,
    });

    const result = await scrapeAmazonListing('B0TESTSKU', 'test-api-key');

    expect(result).toBeDefined();
    expect(result?.asin).toBe('B0TESTSKU');
    expect(result?.markdown).toBe(sampleAmazonMarkdown);
    expect(result?.html).toBe(sampleAmazonHTML);
    expect(result?.creditsUsed).toBe(1);
  });

  it('should use correct Firecrawl API endpoint and headers', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => sampleFirecrawlResponse,
    });
    global.fetch = mockFetch;

    await scrapeAmazonListing('B0TESTSKU', 'my-api-key');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.firecrawl.dev/v2/scrape',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Authorization': 'Bearer my-api-key',
          'Content-Type': 'application/json',
        }),
      })
    );
  });

  it('should request markdown and html formats', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => sampleFirecrawlResponse,
    });
    global.fetch = mockFetch;

    await scrapeAmazonListing('B0TESTSKU', 'test-key');

    const callArgs = mockFetch.mock.calls[0][1];
    const body = JSON.parse(callArgs.body);

    expect(body.formats).toContain('markdown');
    expect(body.formats).toContain('html');
  });

  it('should include screenshot action', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => sampleFirecrawlResponse,
    });
    global.fetch = mockFetch;

    await scrapeAmazonListing('B0TESTSKU', 'test-key');

    const callArgs = mockFetch.mock.calls[0][1];
    const body = JSON.parse(callArgs.body);

    expect(body.actions).toContainEqual({ type: 'screenshot', fullPage: true });
  });

  it('should handle API errors', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => 'Unauthorized',
    });

    const result = await scrapeAmazonListing('B0TESTSKU', 'bad-key');

    expect(result).toBeNull();
  });

  it('should handle missing markdown/html in response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {},
      }),
    });

    const result = await scrapeAmazonListing('B0TESTSKU', 'test-key');

    expect(result).toBeNull();
  });

  it('should handle network errors', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const result = await scrapeAmazonListing('B0TESTSKU', 'test-key');

    expect(result).toBeNull();
  });

  it('should construct correct Amazon URL', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => sampleFirecrawlResponse,
    });
    global.fetch = mockFetch;

    await scrapeAmazonListing('B0TESTSKU', 'test-key');

    const callArgs = mockFetch.mock.calls[0][1];
    const body = JSON.parse(callArgs.body);

    expect(body.url).toBe('https://www.amazon.com/dp/B0TESTSKU');
  });
});

describe('scrapeAndParseAmazon', () => {
  it('should scrape and parse in one call', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => sampleFirecrawlResponse,
    });

    const result = await scrapeAndParseAmazon('B0TESTSKU', 'test-key');

    expect(result.success).toBe(true);
    expect(result.data?.asin).toBe('B0TESTSKU');
    expect(result.data?.title).toBe('Ultimate Guard Katana Sleeves Standard Size Black (100)');
  });

  it('should return error if scraping fails', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => 'Server error',
    });

    const result = await scrapeAndParseAmazon('B0TESTSKU', 'test-key');

    expect(result.success).toBe(false);
    expect(result.error).toContain('Failed to scrape');
  });
});
