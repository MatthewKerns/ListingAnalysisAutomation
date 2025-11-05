# 🚀 Amazon Listing Analysis Automation

Automated Amazon listing analysis using Firecrawl, AWS Rekognition, and ChatGPT with LangGraph workflow orchestration.

## 📋 Overview

This automation runs monthly to analyze Amazon product listings and provide actionable insights:

1. **Google Sheets** → Reads ASINs filled by VA using Titan Atlas Chrome Extension
2. **Firecrawl** → Scrapes listing data and images from Amazon
3. **AWS Rekognition** → Analyzes product images for labels, text, faces, and quality
4. **ChatGPT (GPT-4)** → Generates competitive insights and recommendations
5. **Gmail/Google Drive** → Delivers results via email and cloud storage

## 🏗️ Architecture

```
┌─────────────────┐
│  Google Sheets  │
│  (ASINs Input)  │
└────────┬────────┘
         │
         ▼
    ┌────────┐
    │ Node 1 │ Read ASINs from Sheet
    └────┬───┘
         │
         ▼
    ┌────────┐
    │ Node 2 │ Firecrawl Scraping
    └────┬───┘
         │
         ▼
    ┌────────┐
    │ Node 3 │ AWS Rekognition Analysis
    └────┬───┘
         │
         ▼
    ┌────────┐
    │ Node 4 │ ChatGPT Analysis
    └────┬───┘
         │
         ▼
    ┌────────┐
    │ Node 5 │ Send Email Report
    └────┬───┘
         │
         ▼
    ┌────────┐
    │ Node 6 │ Save to Google Drive
    └────────┘
```

**Orchestration:** LangGraph manages the workflow state and node execution.

## 🔧 Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- Firecrawl API key
- OpenAI API key
- AWS account with Rekognition access
- Google Cloud project with Sheets & Drive API enabled

### 1. Clone and Install

```bash
git clone <repository-url>
cd ListingAnalysisAutomation
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` and fill in your credentials:

```env
# Firecrawl API Configuration
FIRECRAWL_API_KEY=fc-your-api-key-here

# OpenAI API Configuration
OPENAI_API_KEY=sk-your-openai-key-here

# AWS Configuration
AWS_REGION=us-east-1
# Option 1: Use AWS CLI profile (recommended)
AWS_PROFILE=your_aws_profile_name
# Option 2: Use access keys directly
# AWS_ACCESS_KEY_ID=your-aws-access-key
# AWS_SECRET_ACCESS_KEY=your-aws-secret-key

# Google Sheets Configuration
GOOGLE_SHEET_ID=your-google-sheet-id
GOOGLE_CREDENTIALS_PATH=./credentials/google-credentials.json

# Gmail Configuration
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-password

# Google Drive (optional)
GOOGLE_DRIVE_FOLDER_ID=your-drive-folder-id

# Scheduler
CRON_SCHEDULE=0 0 1 * *
```

### 3. Google Cloud Setup

#### A. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable APIs:
   - Google Sheets API
   - Google Drive API

#### B. Create Service Account

1. Go to **IAM & Admin** → **Service Accounts**
2. Click **Create Service Account**
3. Name it (e.g., "listing-analysis-bot")
4. Grant roles:
   - **Editor** (or specific Sheets/Drive permissions)
5. Click **Done**

#### C. Generate Credentials

1. Click on the service account you created
2. Go to **Keys** tab
3. Click **Add Key** → **Create new key**
4. Choose **JSON** format
5. Download the JSON file
6. Save it as `credentials/google-credentials.json`

```bash
mkdir -p credentials
mv ~/Downloads/your-project-*.json credentials/google-credentials.json
```

#### D. Share Google Sheet

1. Open your Google Sheet with ASINs
2. Click **Share**
3. Add the service account email (found in the JSON file)
4. Give **Viewer** or **Editor** access
5. Copy the Sheet ID from the URL:
   ```
   https://docs.google.com/spreadsheets/d/[SHEET_ID]/edit
   ```

#### E. Gmail App Password

1. Enable 2-factor authentication on your Google account
2. Go to [App Passwords](https://myaccount.google.com/apppasswords)
3. Generate a new app password for "Mail"
4. Use this password in `GMAIL_APP_PASSWORD`

### 4. AWS Setup

1. Go to [AWS IAM](https://console.aws.amazon.com/iam/)
2. Create a new user with **Programmatic access**
3. Attach policy: **AmazonRekognitionFullAccess**
4. Save the Access Key ID and Secret Access Key

### 5. Firecrawl Setup

1. Sign up at [Firecrawl](https://firecrawl.dev/)
2. Get your API key from the dashboard
3. Add to `.env` as `FIRECRAWL_API_KEY`

### 6. OpenAI Setup

1. Sign up at [OpenAI](https://platform.openai.com/)
2. Create an API key
3. Add to `.env` as `OPENAI_API_KEY`

## 📊 Google Sheet Format

Your Google Sheet should have ASINs in **Column A**:

```
| A (ASIN)     |
|--------------|
| ASIN         | ← Header (optional)
| B08XYZ123    |
| B07ABC456    |
| B09DEF789    |
```

The automation will:
- Skip the header row
- Validate ASIN format (B + 9 alphanumeric characters)
- Remove duplicates

## 🚀 Usage

### Run Once (Manual)

```bash
npm run dev
```

### Run on Schedule (Monthly)

```bash
npm run schedule
```

This starts a cron job that runs on the schedule defined in `.env` (default: midnight on the 1st of every month).

### Build for Production

```bash
npm run build
npm start
```

## 🧪 Testing

### Run All Tests

```bash
npm test
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Generate Coverage Report

```bash
npm run test:coverage
```

### Manual Integration Tests

Test individual components with your API keys:

```bash
# Test Firecrawl scraping only
npm run test:manual

# Test full workflow: Scrape → Rekognition → ChatGPT
npm run test:workflow

# Test OpenAI analysis only (with mock data)
npm run test:openai-only
```

**Test Coverage:**
- ✅ Firecrawl Amazon parser (HTML/Markdown parsing)
- ✅ Google Sheets ASIN reader
- ✅ Firecrawl workflow node
- ✅ AWS Rekognition image analysis
- ✅ ChatGPT analysis and insights
- ✅ Email and Google Drive output
- ✅ Configuration loader

See `TESTING.md` for detailed testing guide.

## 📅 Cron Schedule Examples

Edit `CRON_SCHEDULE` in `.env`:

```bash
# Midnight on the 1st of every month (default)
CRON_SCHEDULE=0 0 1 * *

# Every Monday at 9 AM
CRON_SCHEDULE=0 9 * * 1

# Every 7 days at midnight
CRON_SCHEDULE=0 0 */7 * *

# Every day at 3 PM
CRON_SCHEDULE=0 15 * * *
```

Format: `minute hour day month weekday`

## 📧 Output

### Email Report

The automation sends an HTML email with:
- Executive summary
- Competitive insights (5-7 key findings)
- Recommendations (7-10 actionable items)
- Image quality analysis
- Error log (if any)

### Google Drive

Saves a JSON file with full analysis data:
- Filename: `listing-analysis-YYYY-MM-DD.json`
- Contains: All scraped data, image analysis, GPT insights

## 🔍 What Gets Analyzed

### Listing Data (Firecrawl)
- Title
- Price
- Rating & review count
- Bullet points
- Description
- Product images (ALL images: main, gallery, and A+ content)

### Image Analysis (AWS Rekognition)
- Object/scene labels (confidence scores)
- Text detection in images (critical for Rufus AI)
- Face detection
- Content moderation (inappropriate content)
- Visual context analysis

### GPT-4 Analysis (Rufus AI & COSMO Optimized)
- **What Amazon AI Actually Sees**: Rekognition's detected labels and text
- **Target Audience Identification**: Based on visual + textual signals
- **Rufus Optimization**: Multimodal AI recommendations
- Visual Label Tagging (VLT) opportunities
- Semantic search optimization (NPO, intent-driven content)
- Backend attribute enrichment recommendations
- Competitive pricing and positioning insights
- Image quality and visual consistency analysis

## 🛠️ Project Structure

```
ListingAnalysisAutomation/
├── src/
│   ├── lib/
│   │   └── firecrawl-amazon.ts    # Firecrawl scraping logic
│   ├── nodes/
│   │   ├── googleSheets.ts        # Read ASINs from Sheets
│   │   ├── firecrawl.ts           # Scrape listings
│   │   ├── rekognition.ts         # Analyze images
│   │   ├── chatgpt.ts             # GPT-4 analysis (Rufus optimized)
│   │   └── output.ts              # Email & Drive output
│   ├── types/
│   │   └── index.ts               # TypeScript types
│   ├── utils/
│   │   └── config.ts              # Config loader
│   ├── workflow.ts                # LangGraph workflow
│   ├── index.ts                   # Main entry point
│   ├── scheduler.ts               # Cron scheduler
│   ├── test.ts                    # Firecrawl integration test
│   ├── test-workflow.ts           # Full workflow test
│   └── test-openai-only.ts        # OpenAI API test
├── tests/
│   ├── unit/                      # Unit tests (Vitest)
│   ├── fixtures/                  # Test data
│   └── mocks/                     # Mock implementations
├── credentials/
│   └── google-credentials.json    # Google service account (gitignored)
├── .env                           # Environment variables (gitignored)
├── .env.example                   # Example environment config
├── package.json
├── tsconfig.json
└── README.md
```

## 🔐 Security Notes

- **Never commit** `.env` or `credentials/` to version control
- Use environment variables for all secrets
- Restrict Google service account permissions
- Use AWS IAM least-privilege policies
- Rotate API keys periodically

## 💰 Cost Considerations

- **Firecrawl**: ~1 credit per scrape (check pricing)
- **AWS Rekognition**: ~$0.001 per image operation
- **OpenAI GPT-4**: ~$0.03 per 1K input tokens, ~$0.06 per 1K output tokens
- **Google APIs**: Free tier available

**Estimate for 10 ASINs:**
- Firecrawl: ~10 credits
- Rekognition: ~50 images × 4 operations = ~$0.20
- GPT-4: ~5,000 tokens = ~$0.30
- **Total: ~$0.50 + Firecrawl credits**

## 🐛 Troubleshooting

### "Missing required environment variables"
- Check `.env` file exists
- Verify all required variables are set
- Run `npm run dev` to test

### "Failed to read Google Sheet"
- Verify service account email has access to the sheet
- Check `GOOGLE_SHEET_ID` is correct
- Ensure `google-credentials.json` path is correct

### "Firecrawl API error"
- Verify API key is correct
- Check Firecrawl account has credits
- Ensure ASINs are valid

### "AWS Rekognition failed"
- Verify AWS credentials
- Check IAM permissions for Rekognition
- Ensure region is correct

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - feel free to use this for your own projects!

## 🙏 Credits

- Built with [LangGraph](https://github.com/langchain-ai/langgraph)
- Powered by [Firecrawl](https://firecrawl.dev/)
- Image analysis by [AWS Rekognition](https://aws.amazon.com/rekognition/)
- Insights from [OpenAI GPT-4](https://openai.com/)

## 📞 Support

For issues or questions:
- Open a GitHub issue
- Check existing documentation
- Review error logs in console output

---

**Happy analyzing! 🎉**
