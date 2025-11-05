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
  ];

  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // AWS credentials: either use profile OR keys
  const hasProfile = !!process.env.AWS_PROFILE;
  const hasKeys = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY;

  if (!hasProfile && !hasKeys) {
    throw new Error('AWS credentials required: Set AWS_PROFILE or (AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY)');
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
    awsProfile: process.env.AWS_PROFILE,
    awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID,
    awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  };
}
