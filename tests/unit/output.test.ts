/**
 * Unit tests for output nodes (email and Google Drive)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendEmail, saveToGoogleDrive } from '../../src/nodes/output.js';

// Mock nodemailer
vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn(() => ({
      sendMail: vi.fn(),
    })),
  },
}));

// Mock googleapis
vi.mock('googleapis', () => ({
  google: {
    auth: {
      GoogleAuth: vi.fn(() => ({})),
    },
    drive: vi.fn(() => ({
      files: {
        create: vi.fn(),
      },
    })),
  },
}));

// Mock fs
vi.mock('fs', () => ({
  default: {
    readFileSync: vi.fn(() => JSON.stringify({ client_email: 'test@test.com' })),
  },
}));

describe('sendEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should send email with analysis report', async () => {
    const nodemailer = await import('nodemailer');
    const mockTransport = nodemailer.default.createTransport({} as any);
    (mockTransport.sendMail as any).mockResolvedValue({ messageId: 'test-123' });

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
          images: [],
          parsedAt: '2024-01-01T00:00:00.000Z',
        }],
      ]),
      imageAnalysis: new Map([
        ['B0TEST', { asin: 'B0TEST', images: [] }],
      ]),
      gptAnalysis: {
        summary: 'Test summary',
        competitiveInsights: ['Insight 1', 'Insight 2'],
        recommendations: ['Rec 1', 'Rec 2'],
        imageQualityAnalysis: 'Good quality',
        generatedAt: '2024-01-01T00:00:00.000Z',
      },
      errors: [],
    };

    const config = {
      user: 'test@gmail.com',
      password: 'test-password',
    };

    const result = await sendEmail(state, config);

    expect(result.emailSent).toBe(true);
    expect(mockTransport.sendMail).toHaveBeenCalled();
  });

  it('should include report data in email body', async () => {
    const nodemailer = await import('nodemailer');
    const mockTransport = nodemailer.default.createTransport({} as any);
    (mockTransport.sendMail as any).mockResolvedValue({ messageId: 'test-123' });

    const state = {
      asins: ['B0TEST'],
      scrapedListings: new Map(),
      imageAnalysis: new Map(),
      gptAnalysis: {
        summary: 'Test summary',
        competitiveInsights: ['Insight 1'],
        recommendations: ['Rec 1'],
        imageQualityAnalysis: 'Good',
        generatedAt: '2024-01-01T00:00:00.000Z',
      },
      errors: [],
    };

    await sendEmail(state, { user: 'test@gmail.com', password: 'test-password' });

    const callArgs = (mockTransport.sendMail as any).mock.calls[0][0];
    expect(callArgs.html).toContain('Test summary');
    expect(callArgs.html).toContain('Insight 1');
    expect(callArgs.html).toContain('Rec 1');
  });

  it('should skip email if credentials not configured', async () => {
    const state = {
      asins: [],
      scrapedListings: new Map(),
      imageAnalysis: new Map(),
      errors: [],
    };

    const result = await sendEmail(state, { user: '', password: '' });

    expect(result.emailSent).toBe(false);
  });

  it('should handle email sending errors', async () => {
    const nodemailer = await import('nodemailer');
    const mockTransport = nodemailer.default.createTransport({} as any);
    (mockTransport.sendMail as any).mockRejectedValue(new Error('SMTP error'));

    const state = {
      asins: [],
      scrapedListings: new Map(),
      imageAnalysis: new Map(),
      gptAnalysis: {
        summary: 'Test',
        competitiveInsights: [],
        recommendations: [],
        imageQualityAnalysis: '',
        generatedAt: '2024-01-01T00:00:00.000Z',
      },
      errors: [],
    };

    const result = await sendEmail(state, { user: 'test@gmail.com', password: 'test-password' });

    expect(result.emailSent).toBe(false);
    expect(result.errors?.length).toBeGreaterThan(0);
  });

  it('should include errors in email if present', async () => {
    const nodemailer = await import('nodemailer');
    const mockTransport = nodemailer.default.createTransport({} as any);
    (mockTransport.sendMail as any).mockResolvedValue({ messageId: 'test-123' });

    const state = {
      asins: [],
      scrapedListings: new Map(),
      imageAnalysis: new Map(),
      gptAnalysis: {
        summary: 'Test',
        competitiveInsights: [],
        recommendations: [],
        imageQualityAnalysis: '',
        generatedAt: '2024-01-01T00:00:00.000Z',
      },
      errors: [
        { step: 'firecrawl', asin: 'B0BAD', message: 'Scraping failed' },
      ],
    };

    await sendEmail(state, { user: 'test@gmail.com', password: 'test-password' });

    const callArgs = (mockTransport.sendMail as any).mock.calls[0][0];
    expect(callArgs.html).toContain('Errors Encountered');
    expect(callArgs.html).toContain('firecrawl');
    expect(callArgs.html).toContain('B0BAD');
  });
});

describe('saveToGoogleDrive', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should save analysis to Google Drive', async () => {
    const { google } = await import('googleapis');
    const mockDrive = google.drive({} as any);
    (mockDrive.files.create as any).mockResolvedValue({
      data: {
        id: 'file-123',
        name: 'listing-analysis-2024-01-01.json',
        webViewLink: 'https://drive.google.com/file/d/file-123/view',
      },
    });

    const state = {
      asins: ['B0TEST'],
      scrapedListings: new Map(),
      imageAnalysis: new Map(),
      gptAnalysis: {
        summary: 'Test',
        competitiveInsights: [],
        recommendations: [],
        imageQualityAnalysis: '',
        generatedAt: '2024-01-01T00:00:00.000Z',
      },
      errors: [],
    };

    const config = {
      credentialsPath: './test-credentials.json',
      folderId: 'folder-123',
    };

    const result = await saveToGoogleDrive(state, config);

    expect(result.driveSaved).toBe(true);
    expect(mockDrive.files.create).toHaveBeenCalled();
  });

  it('should skip if folder ID not configured', async () => {
    const state = {
      asins: [],
      scrapedListings: new Map(),
      imageAnalysis: new Map(),
      errors: [],
    };

    const result = await saveToGoogleDrive(state, {
      credentialsPath: './test.json',
      folderId: undefined,
    });

    expect(result.driveSaved).toBe(false);
  });

  it('should include full analysis data in saved file', async () => {
    const { google } = await import('googleapis');
    const mockDrive = google.drive({} as any);
    (mockDrive.files.create as any).mockResolvedValue({
      data: { id: 'file-123' },
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
          images: [],
          parsedAt: '2024-01-01T00:00:00.000Z',
        }],
      ]),
      imageAnalysis: new Map([
        ['B0TEST', { asin: 'B0TEST', images: [] }],
      ]),
      gptAnalysis: {
        summary: 'Test',
        competitiveInsights: [],
        recommendations: [],
        imageQualityAnalysis: '',
        generatedAt: '2024-01-01T00:00:00.000Z',
      },
      errors: [],
    };

    await saveToGoogleDrive(state, {
      credentialsPath: './test.json',
      folderId: 'folder-123',
    });

    const callArgs = (mockDrive.files.create as any).mock.calls[0][0];
    expect(callArgs.media.body).toContain('B0TEST');
    expect(callArgs.media.body).toContain('Test Product');
  });

  it('should handle Drive API errors', async () => {
    const { google } = await import('googleapis');
    const mockDrive = google.drive({} as any);
    (mockDrive.files.create as any).mockRejectedValue(new Error('Drive API error'));

    const state = {
      asins: [],
      scrapedListings: new Map(),
      imageAnalysis: new Map(),
      gptAnalysis: {
        summary: 'Test',
        competitiveInsights: [],
        recommendations: [],
        imageQualityAnalysis: '',
        generatedAt: '2024-01-01T00:00:00.000Z',
      },
      errors: [],
    };

    const result = await saveToGoogleDrive(state, {
      credentialsPath: './test.json',
      folderId: 'folder-123',
    });

    expect(result.driveSaved).toBe(false);
    expect(result.errors?.length).toBeGreaterThan(0);
  });
});
