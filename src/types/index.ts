/**
 * Type definitions for the Listing Analysis Automation workflow
 */

import { ParsedAmazonProduct } from '../lib/firecrawl-amazon.js';

export interface WorkflowState {
  // Input
  asins: string[];

  // Scraped data
  scrapedListings: Map<string, ParsedAmazonProduct>;

  // Image analysis results
  imageAnalysis: Map<string, RekognitionAnalysis>;

  // GPT analysis
  gptAnalysis?: AnalysisReport;

  // Output
  emailSent?: boolean;
  driveSaved?: boolean;

  // Error tracking
  errors: Array<{
    step: string;
    asin?: string;
    message: string;
  }>;
}

export interface RekognitionAnalysis {
  asin: string;
  images: Array<{
    url: string;
    labels: Array<{
      name: string;
      confidence: number;
    }>;
    text?: Array<{
      detectedText: string;
      confidence: number;
    }>;
    faces?: number;
    moderationLabels?: Array<{
      name: string;
      confidence: number;
    }>;
  }>;
}

export interface AnalysisReport {
  summary: string;
  competitiveInsights: string[];
  recommendations: string[];
  imageQualityAnalysis: string;
  generatedAt: string;
}

export interface Config {
  firecrawlApiKey: string;
  openaiApiKey: string;
  googleSheetId: string;
  googleCredentialsPath: string;
  gmailUser: string;
  gmailPassword: string;
  driveFolderId?: string;
  awsRegion: string;
  awsProfile?: string;
  awsAccessKeyId?: string;
  awsSecretAccessKey?: string;
}
