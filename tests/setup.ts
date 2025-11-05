/**
 * Test setup and global configuration
 */

import { vi } from 'vitest';

// Mock environment variables for tests
process.env.FIRECRAWL_API_KEY = 'test-firecrawl-key';
process.env.OPENAI_API_KEY = 'test-openai-key';
process.env.AWS_REGION = 'us-east-1';
process.env.AWS_ACCESS_KEY_ID = 'test-aws-key';
process.env.AWS_SECRET_ACCESS_KEY = 'test-aws-secret';
process.env.GOOGLE_SHEET_ID = 'test-sheet-id';
process.env.GOOGLE_CREDENTIALS_PATH = './tests/fixtures/test-credentials.json';
process.env.GMAIL_USER = 'test@gmail.com';
process.env.GMAIL_APP_PASSWORD = 'test-password';

// Global test timeout
vi.setConfig({ testTimeout: 10000 });
