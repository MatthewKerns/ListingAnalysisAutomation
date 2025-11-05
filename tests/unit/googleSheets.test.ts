/**
 * Unit tests for Google Sheets node
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readAsinsFromSheet } from '../../src/nodes/googleSheets.js';
import { sampleWorkflowState } from '../fixtures/amazon-sample.js';
import { mockGoogleSheetsData } from '../mocks/google.js';

// Mock the googleapis module
vi.mock('googleapis', () => ({
  google: {
    auth: {
      GoogleAuth: vi.fn(() => ({
        getClient: vi.fn(),
      })),
    },
    sheets: vi.fn(() => ({
      spreadsheets: {
        values: {
          get: vi.fn(),
        },
      },
    })),
  },
}));

// Mock fs module
vi.mock('fs', () => ({
  default: {
    readFileSync: vi.fn(() => JSON.stringify({ client_email: 'test@test.com' })),
  },
}));

describe('readAsinsFromSheet', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should read ASINs from Google Sheet', async () => {
    const { google } = await import('googleapis');
    const mockSheets = google.sheets() as any;
    mockSheets.spreadsheets.values.get.mockResolvedValue(mockGoogleSheetsData);

    const result = await readAsinsFromSheet(
      sampleWorkflowState,
      'test-sheet-id',
      './test-credentials.json'
    );

    expect(result.asins).toBeDefined();
    expect(result.asins?.length).toBeGreaterThan(0);
  });

  it('should filter out invalid ASINs', async () => {
    const { google } = await import('googleapis');
    const mockSheets = google.sheets() as any;
    mockSheets.spreadsheets.values.get.mockResolvedValue(mockGoogleSheetsData);

    const result = await readAsinsFromSheet(
      sampleWorkflowState,
      'test-sheet-id',
      './test-credentials.json'
    );

    expect(result.asins).toBeDefined();
    expect(result.asins?.every(asin => /^B[0-9A-Z]{9}$/i.test(asin))).toBe(true);
    expect(result.asins?.includes('INVALID')).toBe(false);
  });

  it('should skip header row', async () => {
    const { google } = await import('googleapis');
    const mockSheets = google.sheets() as any;
    mockSheets.spreadsheets.values.get.mockResolvedValue(mockGoogleSheetsData);

    const result = await readAsinsFromSheet(
      sampleWorkflowState,
      'test-sheet-id',
      './test-credentials.json'
    );

    expect(result.asins?.includes('ASIN')).toBe(false);
  });

  it('should convert ASINs to uppercase', async () => {
    const { google } = await import('googleapis');
    const mockSheets = google.sheets() as any;
    mockSheets.spreadsheets.values.get.mockResolvedValue({
      data: {
        values: [
          ['ASIN'],
          ['b0testsku1'],
          ['B0TESTSKU2'],
        ],
      },
    });

    const result = await readAsinsFromSheet(
      sampleWorkflowState,
      'test-sheet-id',
      './test-credentials.json'
    );

    expect(result.asins?.every(asin => asin === asin.toUpperCase())).toBe(true);
  });

  it('should remove duplicate ASINs', async () => {
    const { google } = await import('googleapis');
    const mockSheets = google.sheets() as any;
    mockSheets.spreadsheets.values.get.mockResolvedValue({
      data: {
        values: [
          ['ASIN'],
          ['B0TESTSKU1'],
          ['B0TESTSKU1'],
          ['B0TESTSKU2'],
        ],
      },
    });

    const result = await readAsinsFromSheet(
      sampleWorkflowState,
      'test-sheet-id',
      './test-credentials.json'
    );

    const uniqueAsins = new Set(result.asins);
    expect(result.asins?.length).toBe(uniqueAsins.size);
  });

  it('should handle empty sheet', async () => {
    const { google } = await import('googleapis');
    const mockSheets = google.sheets() as any;
    mockSheets.spreadsheets.values.get.mockResolvedValue({
      data: { values: [] },
    });

    const result = await readAsinsFromSheet(
      sampleWorkflowState,
      'test-sheet-id',
      './test-credentials.json'
    );

    expect(result.asins).toEqual([]);
    expect(result.errors).toBeDefined();
  });

  it('should handle API errors', async () => {
    const { google } = await import('googleapis');
    const mockSheets = google.sheets() as any;
    mockSheets.spreadsheets.values.get.mockRejectedValue(new Error('API error'));

    const result = await readAsinsFromSheet(
      sampleWorkflowState,
      'test-sheet-id',
      './test-credentials.json'
    );

    expect(result.asins).toEqual([]);
    expect(result.errors).toBeDefined();
    expect(result.errors?.[0].step).toBe('googleSheets');
  });

  it('should use correct Google Sheets API parameters', async () => {
    const { google } = await import('googleapis');
    const mockSheets = google.sheets() as any;
    mockSheets.spreadsheets.values.get.mockResolvedValue(mockGoogleSheetsData);

    await readAsinsFromSheet(
      sampleWorkflowState,
      'my-sheet-id',
      './test-credentials.json'
    );

    expect(mockSheets.spreadsheets.values.get).toHaveBeenCalledWith({
      spreadsheetId: 'my-sheet-id',
      range: 'A:A',
    });
  });
});
