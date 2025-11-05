/**
 * Unit tests for configuration loader
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { loadConfig } from '../../src/utils/config.js';

describe('loadConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should load all required environment variables', () => {
    process.env.FIRECRAWL_API_KEY = 'fc-test-key';
    process.env.OPENAI_API_KEY = 'sk-test-key';
    process.env.GOOGLE_SHEET_ID = 'sheet-123';
    process.env.GOOGLE_CREDENTIALS_PATH = './creds.json';
    process.env.AWS_REGION = 'us-west-2';
    process.env.AWS_ACCESS_KEY_ID = 'aws-key';
    process.env.AWS_SECRET_ACCESS_KEY = 'aws-secret';

    const config = loadConfig();

    expect(config.firecrawlApiKey).toBe('fc-test-key');
    expect(config.openaiApiKey).toBe('sk-test-key');
    expect(config.googleSheetId).toBe('sheet-123');
    expect(config.googleCredentialsPath).toBe('./creds.json');
    expect(config.awsRegion).toBe('us-west-2');
    expect(config.awsAccessKeyId).toBe('aws-key');
    expect(config.awsSecretAccessKey).toBe('aws-secret');
  });

  it('should load optional gmail credentials', () => {
    process.env.FIRECRAWL_API_KEY = 'test';
    process.env.OPENAI_API_KEY = 'test';
    process.env.GOOGLE_SHEET_ID = 'test';
    process.env.GOOGLE_CREDENTIALS_PATH = 'test';
    process.env.AWS_REGION = 'test';
    process.env.AWS_ACCESS_KEY_ID = 'test';
    process.env.AWS_SECRET_ACCESS_KEY = 'test';
    process.env.GMAIL_USER = 'user@gmail.com';
    process.env.GMAIL_APP_PASSWORD = 'password';

    const config = loadConfig();

    expect(config.gmailUser).toBe('user@gmail.com');
    expect(config.gmailPassword).toBe('password');
  });

  it('should load optional drive folder ID', () => {
    process.env.FIRECRAWL_API_KEY = 'test';
    process.env.OPENAI_API_KEY = 'test';
    process.env.GOOGLE_SHEET_ID = 'test';
    process.env.GOOGLE_CREDENTIALS_PATH = 'test';
    process.env.AWS_REGION = 'test';
    process.env.AWS_ACCESS_KEY_ID = 'test';
    process.env.AWS_SECRET_ACCESS_KEY = 'test';
    process.env.GOOGLE_DRIVE_FOLDER_ID = 'folder-123';

    const config = loadConfig();

    expect(config.driveFolderId).toBe('folder-123');
  });

  it('should throw error if required variable is missing', () => {
    delete process.env.FIRECRAWL_API_KEY;

    expect(() => loadConfig()).toThrow('Missing required environment variables');
  });

  it('should list all missing required variables', () => {
    delete process.env.FIRECRAWL_API_KEY;
    delete process.env.OPENAI_API_KEY;
    delete process.env.AWS_REGION;

    expect(() => loadConfig()).toThrow(/FIRECRAWL_API_KEY.*OPENAI_API_KEY.*AWS_REGION/);
  });

  it('should handle empty optional variables', () => {
    process.env.FIRECRAWL_API_KEY = 'test';
    process.env.OPENAI_API_KEY = 'test';
    process.env.GOOGLE_SHEET_ID = 'test';
    process.env.GOOGLE_CREDENTIALS_PATH = 'test';
    process.env.AWS_REGION = 'test';
    process.env.AWS_ACCESS_KEY_ID = 'test';
    process.env.AWS_SECRET_ACCESS_KEY = 'test';

    const config = loadConfig();

    expect(config.gmailUser).toBe('');
    expect(config.gmailPassword).toBe('');
    expect(config.driveFolderId).toBeUndefined();
  });
});
