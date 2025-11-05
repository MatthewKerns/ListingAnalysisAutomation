/**
 * Mock utilities for Google APIs
 */

import { vi } from 'vitest';

export const createMockGoogleSheets = () => {
  return {
    spreadsheets: {
      values: {
        get: vi.fn(),
      },
    },
  };
};

export const createMockGoogleDrive = () => {
  return {
    files: {
      create: vi.fn(),
    },
  };
};

export const mockGoogleAuth = vi.fn(() => ({
  getClient: vi.fn(),
}));

export const mockGoogleSheetsData = {
  data: {
    values: [
      ['ASIN'],
      ['B0TESTSKU1'],
      ['B0TESTSKU2'],
      ['INVALID'],
      ['B0TESTSKU3'],
    ],
  },
};

export const mockGoogleDriveResponse = {
  data: {
    id: 'file-123',
    name: 'listing-analysis-2024-01-01.json',
    webViewLink: 'https://drive.google.com/file/d/file-123/view',
  },
};
