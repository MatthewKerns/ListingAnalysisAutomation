/**
 * Google Sheets Node - Reads ASINs from Google Sheet
 */

import { google } from 'googleapis';
import { WorkflowState } from '../types/index.js';
import fs from 'fs';

export async function readAsinsFromSheet(
  state: WorkflowState,
  sheetId: string,
  credentialsPath: string
): Promise<Partial<WorkflowState>> {
  console.log('📊 Reading ASINs from Google Sheet...');

  try {
    // Load credentials
    const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));

    // Authenticate with Google
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // Read the sheet (assuming ASINs are in column A)
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'A:A', // Read all values in column A
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      console.log('⚠️  No ASINs found in sheet');
      return {
        asins: [],
        errors: [
          ...state.errors,
          { step: 'googleSheets', message: 'No ASINs found in sheet' }
        ]
      };
    }

    // Extract ASINs (skip header row if present)
    const asins = rows
      .slice(1) // Skip header
      .map(row => row[0])
      .filter(asin => asin && /^B[0-9A-Z]{9}$/i.test(asin)) // Valid ASIN format
      .map(asin => asin.toUpperCase());

    console.log(`✅ Found ${asins.length} valid ASINs`);

    return {
      asins: Array.from(new Set(asins)), // Remove duplicates
    };

  } catch (error) {
    console.error('❌ Error reading Google Sheet:', error);
    return {
      asins: [],
      errors: [
        ...state.errors,
        {
          step: 'googleSheets',
          message: error instanceof Error ? error.message : String(error)
        }
      ]
    };
  }
}
