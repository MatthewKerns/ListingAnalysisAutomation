/**
 * Unit tests for AWS Rekognition node
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { analyzeImages } from '../../src/nodes/rekognition.js';

// Mock AWS Rekognition client
vi.mock('@aws-sdk/client-rekognition', () => ({
  RekognitionClient: vi.fn(() => ({
    send: vi.fn(),
  })),
  DetectLabelsCommand: vi.fn(),
  DetectTextCommand: vi.fn(),
  DetectFacesCommand: vi.fn(),
  DetectModerationLabelsCommand: vi.fn(),
}));

// Mock global fetch for image fetching
global.fetch = vi.fn();

describe('analyzeImages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Mock fetch to return a fake image buffer
    (global.fetch as any).mockResolvedValue({
      ok: true,
      arrayBuffer: async () => new ArrayBuffer(100),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should analyze images from scraped listings', async () => {
    const { RekognitionClient } = await import('@aws-sdk/client-rekognition');
    const mockClient = new RekognitionClient({} as any);
    (mockClient.send as any).mockResolvedValue({
      Labels: [{ Name: 'Product', Confidence: 95.5 }],
      TextDetections: [{ DetectedText: 'Test', Confidence: 98.0, Type: 'LINE' }],
      FaceDetails: [],
      ModerationLabels: [],
    });

    const state = {
      asins: ['B0TEST'],
      scrapedListings: new Map([
        ['B0TEST', {
          asin: 'B0TEST',
          title: 'Test Product',
          price: 10,
          rating: 4.5,
          reviewCount: 100,
          bullets: [],
          description: '',
          images: [
            { url: 'https://example.com/image1.jpg', type: 'main' as const, position: 1 },
            { url: 'https://example.com/image2.jpg', type: 'secondary' as const, position: 2 },
          ],
          parsedAt: '2024-01-01T00:00:00.000Z',
        }],
      ]),
      imageAnalysis: new Map(),
      errors: [],
    };

    const awsConfig = {
      region: 'us-east-1',
      accessKeyId: 'test-key',
      secretAccessKey: 'test-secret',
    };

    const promise = analyzeImages(state, awsConfig);
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result.imageAnalysis?.has('B0TEST')).toBe(true);
    expect(result.imageAnalysis?.get('B0TEST')?.images.length).toBe(2);
  });

  it('should limit to 5 images per listing', async () => {
    const { RekognitionClient } = await import('@aws-sdk/client-rekognition');
    const mockClient = new RekognitionClient({} as any);
    (mockClient.send as any).mockResolvedValue({
      Labels: [],
      TextDetections: [],
      FaceDetails: [],
      ModerationLabels: [],
    });

    const state = {
      asins: ['B0TEST'],
      scrapedListings: new Map([
        ['B0TEST', {
          asin: 'B0TEST',
          title: 'Test Product',
          price: 10,
          rating: 4.5,
          reviewCount: 100,
          bullets: [],
          description: '',
          images: Array.from({ length: 10 }, (_, i) => ({
            url: `https://example.com/image${i}.jpg`,
            type: i === 0 ? 'main' as const : 'secondary' as const,
            position: i + 1,
          })),
          parsedAt: '2024-01-01T00:00:00.000Z',
        }],
      ]),
      imageAnalysis: new Map(),
      errors: [],
    };

    const awsConfig = {
      region: 'us-east-1',
      accessKeyId: 'test-key',
      secretAccessKey: 'test-secret',
    };

    const promise = analyzeImages(state, awsConfig);
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result.imageAnalysis?.get('B0TEST')?.images.length).toBeLessThanOrEqual(5);
  });

  it('should extract labels from Rekognition response', async () => {
    const { RekognitionClient } = await import('@aws-sdk/client-rekognition');
    const mockClient = new RekognitionClient({} as any);
    (mockClient.send as any).mockResolvedValue({
      Labels: [
        { Name: 'Product', Confidence: 95.5 },
        { Name: 'Box', Confidence: 89.2 },
      ],
      TextDetections: [],
      FaceDetails: [],
      ModerationLabels: [],
    });

    const state = {
      asins: ['B0TEST'],
      scrapedListings: new Map([
        ['B0TEST', {
          asin: 'B0TEST',
          title: 'Test',
          price: 10,
          rating: 4.5,
          reviewCount: 100,
          bullets: [],
          description: '',
          images: [{ url: 'https://example.com/image.jpg', type: 'main' as const, position: 1 }],
          parsedAt: '2024-01-01T00:00:00.000Z',
        }],
      ]),
      imageAnalysis: new Map(),
      errors: [],
    };

    const promise = analyzeImages(state, {
      region: 'us-east-1',
      accessKeyId: 'test-key',
      secretAccessKey: 'test-secret',
    });
    await vi.runAllTimersAsync();
    const result = await promise;

    const analysis = result.imageAnalysis?.get('B0TEST');
    expect(analysis?.images[0].labels).toHaveLength(2);
    expect(analysis?.images[0].labels[0].name).toBe('Product');
  });

  it('should handle image fetch errors', async () => {
    (global.fetch as any).mockRejectedValue(new Error('Image not found'));

    const state = {
      asins: ['B0TEST'],
      scrapedListings: new Map([
        ['B0TEST', {
          asin: 'B0TEST',
          title: 'Test',
          price: 10,
          rating: 4.5,
          reviewCount: 100,
          bullets: [],
          description: '',
          images: [{ url: 'https://example.com/bad.jpg', type: 'main' as const, position: 1 }],
          parsedAt: '2024-01-01T00:00:00.000Z',
        }],
      ]),
      imageAnalysis: new Map(),
      errors: [],
    };

    const promise = analyzeImages(state, {
      region: 'us-east-1',
      accessKeyId: 'test-key',
      secretAccessKey: 'test-secret',
    });
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result.errors?.length).toBeGreaterThan(0);
    expect(result.errors?.[0].step).toBe('rekognition');
  });

  it('should implement rate limiting between API calls', async () => {
    const { RekognitionClient } = await import('@aws-sdk/client-rekognition');
    const mockClient = new RekognitionClient({} as any);
    (mockClient.send as any).mockResolvedValue({
      Labels: [],
      TextDetections: [],
      FaceDetails: [],
      ModerationLabels: [],
    });

    const state = {
      asins: ['B0TEST'],
      scrapedListings: new Map([
        ['B0TEST', {
          asin: 'B0TEST',
          title: 'Test',
          price: 10,
          rating: 4.5,
          reviewCount: 100,
          bullets: [],
          description: '',
          images: [
            { url: 'https://example.com/image1.jpg', type: 'main' as const, position: 1 },
            { url: 'https://example.com/image2.jpg', type: 'secondary' as const, position: 2 },
          ],
          parsedAt: '2024-01-01T00:00:00.000Z',
        }],
      ]),
      imageAnalysis: new Map(),
      errors: [],
    };

    const promise = analyzeImages(state, {
      region: 'us-east-1',
      accessKeyId: 'test-key',
      secretAccessKey: 'test-secret',
    });

    // Verify timers are being used for rate limiting
    expect(vi.getTimerCount()).toBeGreaterThan(0);

    await vi.runAllTimersAsync();
    await promise;
  });
});
