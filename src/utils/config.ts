/**
 * Configuration loader from environment variables
 */

import dotenv from 'dotenv';
import { Config } from '../types/index.js';

dotenv.config();

export function loadConfig(): Config {
  const required = [
    'FIRECRAWL_API_KEY',
    'OPENAI_API_KEY',
    'GOOGLE_SHEET_ID',
    'GOOGLE_CREDENTIALS_PATH',
    'AWS_REGION',
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
  ];

  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  return {
    firecrawlApiKey: process.env.FIRECRAWL_API_KEY!,
    openaiApiKey: process.env.OPENAI_API_KEY!,
    googleSheetId: process.env.GOOGLE_SHEET_ID!,
    googleCredentialsPath: process.env.GOOGLE_CREDENTIALS_PATH!,
    gmailUser: process.env.GMAIL_USER || '',
    gmailPassword: process.env.GMAIL_APP_PASSWORD || '',
    driveFolderId: process.env.GOOGLE_DRIVE_FOLDER_ID,
    awsRegion: process.env.AWS_REGION!,
    awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  };
}
