/**
 * Unit tests for ChatGPT analysis node
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { analyzeWithGPT } from '../../src/nodes/chatgpt.js';

// Mock LangChain
vi.mock('@langchain/openai', () => ({
  ChatOpenAI: vi.fn(() => ({
    invoke: vi.fn(),
  })),
}));

describe('analyzeWithGPT', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should analyze listings and return structured report', async () => {
    const { ChatOpenAI } = await import('@langchain/openai');
    const mockLLM = new ChatOpenAI({} as any);
    (mockLLM.invoke as any).mockResolvedValue({
      content: `
## Summary
This is a test summary of the competitive analysis.

## Competitive Insights
- Insight 1: Products are competitively priced
- Insight 2: High review counts indicate market saturation
- Insight 3: Images vary in quality

## Recommendations
- Recommendation 1: Optimize product titles
- Recommendation 2: Improve image quality
- Recommendation 3: Update bullet points

## Image Quality Analysis
Overall image quality is moderate with room for improvement.
      `,
    });

    const state = {
      asins: ['B0TEST'],
      scrapedListings: new Map([
        ['B0TEST', {
          asin: 'B0TEST',
          title: 'Test Product',
          price: 10.99,
          rating: 4.5,
          reviewCount: 100,
          bullets: ['Feature 1', 'Feature 2'],
          description: 'Test description',
          images: [{ url: 'https://example.com/image.jpg', type: 'main' as const, position: 1 }],
          parsedAt: '2024-01-01T00:00:00.000Z',
        }],
      ]),
      imageAnalysis: new Map([
        ['B0TEST', {
          asin: 'B0TEST',
          images: [{
            url: 'https://example.com/image.jpg',
            labels: [{ name: 'Product', confidence: 95 }],
            text: [],
            faces: 0,
            moderationLabels: [],
          }],
        }],
      ]),
      errors: [],
    };

    const result = await analyzeWithGPT(state, 'test-api-key');

    expect(result.gptAnalysis).toBeDefined();
    expect(result.gptAnalysis?.summary).toContain('competitive analysis');
    expect(result.gptAnalysis?.competitiveInsights.length).toBeGreaterThan(0);
    expect(result.gptAnalysis?.recommendations.length).toBeGreaterThan(0);
  });

  it('should extract insights as list items', async () => {
    const { ChatOpenAI } = await import('@langchain/openai');
    const mockLLM = new ChatOpenAI({} as any);
    (mockLLM.invoke as any).mockResolvedValue({
      content: `
## Competitive Insights
- First insight here
- Second insight here
- Third insight here
      `,
    });

    const state = {
      asins: [],
      scrapedListings: new Map(),
      imageAnalysis: new Map(),
      errors: [],
    };

    const result = await analyzeWithGPT(state, 'test-api-key');

    expect(result.gptAnalysis?.competitiveInsights).toHaveLength(3);
    expect(result.gptAnalysis?.competitiveInsights[0]).toBe('First insight here');
  });

  it('should extract recommendations as list items', async () => {
    const { ChatOpenAI } = await import('@langchain/openai');
    const mockLLM = new ChatOpenAI({} as any);
    (mockLLM.invoke as any).mockResolvedValue({
      content: `
## Recommendations
1. First recommendation
2. Second recommendation
3. Third recommendation
      `,
    });

    const state = {
      asins: [],
      scrapedListings: new Map(),
      imageAnalysis: new Map(),
      errors: [],
    };

    const result = await analyzeWithGPT(state, 'test-api-key');

    expect(result.gptAnalysis?.recommendations).toHaveLength(3);
    expect(result.gptAnalysis?.recommendations[0]).toBe('First recommendation');
  });

  it('should handle GPT API errors', async () => {
    const { ChatOpenAI } = await import('@langchain/openai');
    const mockLLM = new ChatOpenAI({} as any);
    (mockLLM.invoke as any).mockRejectedValue(new Error('API rate limit exceeded'));

    const state = {
      asins: [],
      scrapedListings: new Map(),
      imageAnalysis: new Map(),
      errors: [],
    };

    const result = await analyzeWithGPT(state, 'test-api-key');

    expect(result.gptAnalysis).toBeUndefined();
    expect(result.errors?.length).toBeGreaterThan(0);
    expect(result.errors?.[0].step).toBe('chatgpt');
  });

  it('should include timestamp in generated report', async () => {
    const { ChatOpenAI } = await import('@langchain/openai');
    const mockLLM = new ChatOpenAI({} as any);
    (mockLLM.invoke as any).mockResolvedValue({
      content: '## Summary\nTest',
    });

    const state = {
      asins: [],
      scrapedListings: new Map(),
      imageAnalysis: new Map(),
      errors: [],
    };

    const result = await analyzeWithGPT(state, 'test-api-key');

    expect(result.gptAnalysis?.generatedAt).toBeDefined();
    expect(new Date(result.gptAnalysis!.generatedAt).getTime()).toBeGreaterThan(0);
  });

  it('should use GPT-4 model', async () => {
    const { ChatOpenAI } = await import('@langchain/openai');
    const mockLLM = new ChatOpenAI({} as any);
    (mockLLM.invoke as any).mockResolvedValue({ content: 'Test' });

    const state = {
      asins: [],
      scrapedListings: new Map(),
      imageAnalysis: new Map(),
      errors: [],
    };

    await analyzeWithGPT(state, 'test-api-key');

    expect(ChatOpenAI).toHaveBeenCalledWith(
      expect.objectContaining({
        modelName: 'gpt-4o',
        openAIApiKey: 'test-api-key',
      })
    );
  });
});
