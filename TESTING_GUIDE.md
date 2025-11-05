# 🧪 Testing Guide

Comprehensive testing documentation for the Listing Analysis Automation project.

## Overview

This project includes a complete test suite using **Vitest** to ensure reliability and maintainability.

### Test Statistics

- **Test Files:** 7
- **Test Cases:** 60+
- **Coverage Target:** >80%
- **Testing Framework:** Vitest
- **Mocking:** Built-in Vitest mocks

## Quick Start

```bash
# Install dependencies
npm install

# Run all tests
npm test

# Run tests in watch mode (for development)
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## Test Structure

```
tests/
├── setup.ts                          # Global test configuration
├── fixtures/
│   └── amazon-sample.ts             # Sample data for testing
├── mocks/
│   └── google.ts                    # Mock utilities for Google APIs
└── unit/
    ├── firecrawl-amazon.test.ts     # Parser tests (25+ cases)
    ├── googleSheets.test.ts          # Google Sheets node tests
    ├── firecrawl-node.test.ts       # Firecrawl workflow node tests
    ├── rekognition.test.ts          # AWS Rekognition tests
    ├── chatgpt.test.ts              # ChatGPT analysis tests
    ├── output.test.ts               # Email/Drive output tests
    └── config.test.ts               # Config loader tests
```

## Test Categories

### 1. Firecrawl Amazon Parser Tests

**File:** `tests/unit/firecrawl-amazon.test.ts`

Tests the core Amazon listing parser logic:

✅ **Title Extraction**
- Extract from HTML `productTitle` element
- Fallback to markdown headings
- Filter accessibility text
- Handle missing titles

✅ **Price Extraction**
- Parse various price formats
- Handle missing prices (default to 0)

✅ **Rating & Reviews**
- Extract star ratings
- Parse review counts with commas
- Handle missing data

✅ **Bullet Points**
- Extract from HTML `feature-bullets`
- Fallback to markdown bullets
- Filter navigation items
- Limit to 10 bullets
- Filter by length (20-500 chars)

✅ **Images**
- Extract from `imageBlock` section
- Convert to high-res URLs
- Limit to 15 images
- Deduplicate by base ID
- Mark first image as "main"

✅ **API Integration**
- Test Firecrawl API calls
- Verify correct endpoint and headers
- Handle API errors
- Handle network errors
- Handle missing response data

**Example Test:**

```typescript
it('should extract title from HTML productTitle', async () => {
  const result = await parseAmazonListing(
    sampleMarkdown,
    sampleHTML,
    'B0TESTSKU'
  );

  expect(result.success).toBe(true);
  expect(result.data?.title).toBe('Ultimate Guard Katana Sleeves...');
});
```

### 2. Google Sheets Node Tests

**File:** `tests/unit/googleSheets.test.ts`

Tests reading ASINs from Google Sheets:

✅ Read ASINs from sheet
✅ Filter invalid ASIN formats
✅ Skip header row
✅ Convert to uppercase
✅ Remove duplicates
✅ Handle empty sheets
✅ Handle API errors
✅ Verify correct API parameters

**ASIN Validation:**
- Format: `B[0-9A-Z]{9}` (B + 9 alphanumeric characters)
- Case-insensitive
- Automatically uppercased

### 3. Firecrawl Workflow Node Tests

**File:** `tests/unit/firecrawl-node.test.ts`

Tests the workflow node that orchestrates scraping:

✅ Scrape all ASINs in batch
✅ Handle scraping errors gracefully
✅ Implement rate limiting (2s between requests)
✅ Track errors with ASIN info
✅ Handle exceptions

**Rate Limiting:**
Tests verify 2-second delays between API calls to avoid throttling.

### 4. AWS Rekognition Tests

**File:** `tests/unit/rekognition.test.ts`

Tests image analysis functionality:

✅ Analyze images from listings
✅ Limit to 5 images per listing
✅ Extract labels with confidence scores
✅ Detect text in images
✅ Detect faces
✅ Check moderation labels
✅ Handle image fetch errors
✅ Implement rate limiting (300ms between calls)

**Mock Example:**

```typescript
(mockClient.send as any).mockResolvedValue({
  Labels: [
    { Name: 'Product', Confidence: 95.5 },
    { Name: 'Box', Confidence: 89.2 },
  ],
  TextDetections: [...],
  FaceDetails: [...],
  ModerationLabels: [...],
});
```

### 5. ChatGPT Analysis Tests

**File:** `tests/unit/chatgpt.test.ts`

Tests GPT-4 analysis and report generation:

✅ Generate structured reports
✅ Extract competitive insights
✅ Extract recommendations
✅ Parse markdown sections
✅ Handle API errors
✅ Include timestamps
✅ Use correct model (GPT-4o)

**Report Structure:**
- Summary (executive summary)
- Competitive Insights (5-7 bullet points)
- Recommendations (7-10 action items)
- Image Quality Analysis (prose)

### 6. Output Node Tests

**File:** `tests/unit/output.test.ts`

Tests email and Google Drive output:

**Email Tests:**
✅ Send email with report
✅ Include all report sections
✅ Skip if no credentials
✅ Handle SMTP errors
✅ Include error log in email

**Google Drive Tests:**
✅ Save JSON file to Drive
✅ Skip if no folder ID
✅ Include full analysis data
✅ Handle Drive API errors

### 7. Config Loader Tests

**File:** `tests/unit/config.test.ts`

Tests environment variable loading:

✅ Load all required variables
✅ Load optional variables
✅ Throw error for missing required vars
✅ List all missing variables
✅ Handle empty optional variables

**Required Variables:**
- `FIRECRAWL_API_KEY`
- `OPENAI_API_KEY`
- `GOOGLE_SHEET_ID`
- `GOOGLE_CREDENTIALS_PATH`
- `AWS_REGION`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

## Test Fixtures

### Sample Amazon Data

**File:** `tests/fixtures/amazon-sample.ts`

Provides realistic test data:

```typescript
export const sampleAmazonHTML = `
  <span id="productTitle">Ultimate Guard Katana Sleeves...</span>
  <div id="feature-bullets">
    <span class="a-list-item">Premium quality sleeves</span>
    ...
  </div>
`;

export const sampleAmazonMarkdown = `
  # Ultimate Guard Katana Sleeves...
  4.7 out of 5 stars
  2,347 ratings
  $6.49
`;
```

## Mocking Strategy

### 1. External APIs

All external API calls are mocked:

- **Firecrawl API:** `global.fetch`
- **Google APIs:** `googleapis` module
- **AWS Rekognition:** `@aws-sdk/client-rekognition`
- **OpenAI:** `@langchain/openai`
- **Email:** `nodemailer`

### 2. File System

File operations are mocked:

```typescript
vi.mock('fs', () => ({
  default: {
    readFileSync: vi.fn(() => JSON.stringify({ client_email: 'test@test.com' })),
  },
}));
```

### 3. Timers

Rate limiting is tested with fake timers:

```typescript
vi.useFakeTimers();
const promise = scrapeListings(state, apiKey);
await vi.runAllTimersAsync();
const result = await promise;
```

## Coverage Goals

| Module | Target | Current |
|--------|--------|---------|
| `firecrawl-amazon.ts` | >90% | ✅ |
| `googleSheets.ts` | >85% | ✅ |
| `firecrawl.ts` | >85% | ✅ |
| `rekognition.ts` | >80% | ✅ |
| `chatgpt.ts` | >80% | ✅ |
| `output.ts` | >80% | ✅ |
| `config.ts` | >90% | ✅ |

## Running Specific Tests

### Run Single Test File

```bash
npx vitest tests/unit/firecrawl-amazon.test.ts
```

### Run Tests Matching Pattern

```bash
npx vitest -t "should extract title"
```

### Run with UI

```bash
npx vitest --ui
```

### Debug Tests

```bash
npx vitest --inspect-brk
```

## Writing New Tests

### Test Template

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('MyModule', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should do something', async () => {
    // Arrange
    const input = 'test';

    // Act
    const result = await myFunction(input);

    // Assert
    expect(result).toBe('expected');
  });
});
```

### Best Practices

1. **Clear test names:** Use descriptive names that explain what's being tested
2. **Arrange-Act-Assert:** Structure tests clearly
3. **Mock external dependencies:** Don't make real API calls
4. **Test edge cases:** Empty data, errors, missing fields
5. **Use fake timers:** For testing rate limiting and delays
6. **Clean up:** Reset mocks in `beforeEach`

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm test
      - run: npm run test:coverage
```

## Common Issues

### "Module not found"

Ensure you're using `.js` extensions in imports (ESM requirement):

```typescript
import { myFunction } from './module.js'; // ✅ Correct
import { myFunction } from './module';    // ❌ Wrong
```

### "Mock not working"

Clear mocks before each test:

```typescript
beforeEach(() => {
  vi.clearAllMocks();
});
```

### "Async tests timing out"

Increase timeout in test or vitest config:

```typescript
it('long test', async () => {
  // test code
}, 15000); // 15 second timeout
```

## Performance

- **Test Suite Runtime:** ~2-3 seconds
- **Coverage Generation:** ~3-4 seconds
- **Watch Mode:** Instant re-runs

## Next Steps

1. ✅ Run `npm test` to verify all tests pass
2. ✅ Add tests when adding new features
3. ✅ Maintain >80% coverage
4. ✅ Review coverage report: `npm run test:coverage`
5. ✅ Check `coverage/index.html` for detailed report

---

**Happy testing!** 🎉
