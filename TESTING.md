# 🧪 Testing Guide

Quick tests to validate the automation before running the full workflow.

## Test 1: Firecrawl Only (Easiest - 2 minutes)

Test just the Amazon scraping without needing Google/AWS credentials.

### 1. Setup

```bash
# Copy the example env file
cp .env.example .env

# Edit .env and add ONLY your Firecrawl API key:
# FIRECRAWL_API_KEY=fc-your-key-here
```

### 2. Run Test

```bash
npm run test
```

You should see:
```
🧪 Testing Firecrawl Amazon Scraper
============================================================
📦 Testing with ASIN: B0CJBN849W
✅ SUCCESS!

📊 Scraped Data:
  Title: [Product Title]
  Price: $XX.XX
  Rating: 4.X stars
  Reviews: XXX
  Bullets: 5 items
  Images: 7 found
```

This creates `test-output.json` with the full scraped data.

### 3. Test Your Own ASIN

Edit `src/test.ts` line 12:
```typescript
const testAsin = 'B08YOUR-ASIN'; // Your ASIN here
```

Run again: `npm run test`

---

## Test 2: Full Workflow (Requires All Credentials)

Once you have all credentials configured in `.env`:

### 1. Create Test Google Sheet

1. Create a new Google Sheet
2. Add test ASINs in column A:
   ```
   ASIN
   B0CJBN849W
   B07ABC123
   ```
3. Share with your service account email
4. Copy the Sheet ID to `.env`

### 2. Run Once

```bash
npm run dev
```

Watch the console output as it progresses through each step:
- ✅ Reading ASINs from Google Sheet
- ✅ Scraping with Firecrawl
- ✅ Analyzing images with Rekognition
- ✅ Generating insights with GPT-4
- ✅ Sending email
- ✅ Saving to Google Drive

---

## Test 3: Individual Nodes

Test each node separately:

### Test Google Sheets Reader

Create `test-sheets.ts`:
```typescript
import { readAsinsFromSheet } from './src/nodes/googleSheets.js';
import dotenv from 'dotenv';

dotenv.config();

const state = { asins: [], scrapedListings: new Map(), imageAnalysis: new Map(), errors: [] };
const result = await readAsinsFromSheet(
  state,
  process.env.GOOGLE_SHEET_ID!,
  process.env.GOOGLE_CREDENTIALS_PATH!
);
console.log('ASINs found:', result.asins);
```

Run: `tsx test-sheets.ts`

### Test AWS Rekognition

Create `test-rekognition.ts`:
```typescript
import { RekognitionClient, DetectLabelsCommand } from '@aws-sdk/client-rekognition';
import dotenv from 'dotenv';

dotenv.config();

const client = new RekognitionClient({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// Test with a public image URL
const imageUrl = 'https://m.media-amazon.com/images/I/71CZ9vJUGxL._AC_SL1500_.jpg';
const response = await fetch(imageUrl);
const imageBuffer = Buffer.from(await response.arrayBuffer());

const command = new DetectLabelsCommand({
  Image: { Bytes: imageBuffer },
  MaxLabels: 5,
});

const result = await client.send(command);
console.log('Labels detected:', result.Labels?.map(l => l.Name));
```

Run: `tsx test-rekognition.ts`

---

## Common Test Scenarios

### Scenario 1: "I only have Firecrawl key"

✅ Run `npm run test` - Tests scraping only

### Scenario 2: "I have Firecrawl + OpenAI"

Create a minimal workflow test:
```typescript
import { scrapeAndParseAmazon } from './src/lib/firecrawl-amazon.js';
import { ChatOpenAI } from '@langchain/openai';

const result = await scrapeAndParseAmazon('B0CJBN849W', process.env.FIRECRAWL_API_KEY!);
const llm = new ChatOpenAI({ openAIApiKey: process.env.OPENAI_API_KEY! });
const analysis = await llm.invoke(`Analyze this product: ${JSON.stringify(result.data)}`);
console.log(analysis.content);
```

### Scenario 3: "I have everything set up"

✅ Run `npm run dev` - Full workflow

---

## Debugging Tips

### Enable Verbose Logging

Add to your test:
```typescript
console.log(JSON.stringify(result, null, 2));
```

### Test API Keys

```bash
# Test Firecrawl
curl -X POST https://api.firecrawl.dev/v2/scrape \
  -H "Authorization: Bearer $FIRECRAWL_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://amazon.com/dp/B0CJBN849W","formats":["markdown"]}'

# Test OpenAI
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"

# Test AWS
aws rekognition detect-labels --image-bytes file://test-image.jpg
```

### Check Credentials

```bash
# Verify .env is loaded
npm run test

# Should show: "API Key: fc-xxxxxxx..."
# If it shows "API Key: undefined", check .env path
```

---

## What to Test First

**Day 1: Firecrawl Test**
```bash
npm run test
```
Validates: Amazon scraping works

**Day 2: Add Google Sheets**
```bash
npm run dev
```
Validates: Google Sheets → Firecrawl pipeline

**Day 3: Add AWS + OpenAI**
```bash
npm run dev
```
Validates: Full workflow with image analysis

**Day 4: Test Email/Drive**
- Check your inbox for the email
- Check Google Drive for the JSON file

**Day 5: Schedule It**
```bash
npm run schedule
```
Validates: Cron scheduler works

---

## Expected Output

### Successful Test Run

```
🧪 Testing Firecrawl Amazon Scraper
============================================================
📦 Testing with ASIN: B0CJBN849W
🔑 API Key: fc-1234567...

✅ SUCCESS!

📊 Scraped Data:
  Title: Ultimate Guard Katana Sleeves Standard Size Black (100)
  Price: $6.49
  Rating: 4.7 stars
  Reviews: 2,347
  Bullets: 5 items
  Images: 7 found

🔹 First 3 Bullet Points:
  1. Premium quality card sleeves for standard size trading cards
  2. Made from acid-free, archival-safe polypropylene
  3. Crystal clear for perfect visibility of your cards

🖼️  Image URLs:
  1. https://m.media-amazon.com/images/I/71CZ9vJUGxL._AC_SL1500_.jpg
  2. https://m.media-amazon.com/images/I/71rR0WKZUSL._AC_SL1500_.jpg
  3. https://m.media-amazon.com/images/I/71W8kGsZvfL._AC_SL1500_.jpg

============================================================
✅ Firecrawl test passed!

📝 Full data saved to test-output.json
```

### Failed Test (Missing API Key)

```
❌ FIRECRAWL_API_KEY not found in .env

To test:
1. Copy .env.example to .env
2. Add your Firecrawl API key
3. Run: npm run test
```

---

## Quick Checklist

Before running full workflow, verify:

- [ ] `npm run test` passes (Firecrawl works)
- [ ] Test ASINs are in Google Sheet
- [ ] Service account has access to Sheet
- [ ] AWS credentials work (test with AWS CLI)
- [ ] OpenAI API key works
- [ ] Gmail app password is correct
- [ ] Google Drive folder ID is correct (if using)

---

**Ready to test? Start with `npm run test`!** 🚀
