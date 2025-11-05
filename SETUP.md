# 📝 Step-by-Step Setup Guide

Complete setup instructions for Amazon Listing Analysis Automation.

## Quick Start Checklist

- [ ] Node.js 18+ installed
- [ ] Git repository cloned
- [ ] Dependencies installed (`npm install`)
- [ ] Firecrawl API key obtained
- [ ] OpenAI API key obtained
- [ ] AWS account configured
- [ ] Google Cloud project created
- [ ] Google service account credentials downloaded
- [ ] Environment variables configured
- [ ] Test run successful

## Part 1: Basic Setup (5 minutes)

### 1. Install Node.js

```bash
# Check if Node.js is installed
node --version  # Should be 18.x or higher

# If not installed, download from https://nodejs.org/
```

### 2. Clone Repository

```bash
cd ~/workspace
git clone <your-repo-url>
cd ListingAnalysisAutomation
```

### 3. Install Dependencies

```bash
npm install
```

## Part 2: API Keys (10 minutes)

### Firecrawl

1. Visit https://firecrawl.dev/
2. Sign up for an account
3. Go to Dashboard
4. Copy your API key
5. Save it for later

### OpenAI

1. Visit https://platform.openai.com/
2. Sign up or log in
3. Go to API Keys
4. Create new secret key
5. Copy and save it

## Part 3: Google Cloud Setup (15 minutes)

### Step 1: Create Google Cloud Project

1. Go to https://console.cloud.google.com/
2. Click "Select a project" → "New Project"
3. Name it (e.g., "listing-analysis")
4. Click "Create"
5. Wait for project creation

### Step 2: Enable APIs

1. In the project, go to **APIs & Services** → **Library**
2. Search for "Google Sheets API"
3. Click on it and press "Enable"
4. Go back to Library
5. Search for "Google Drive API"
6. Click on it and press "Enable"

### Step 3: Create Service Account

1. Go to **IAM & Admin** → **Service Accounts**
2. Click **+ Create Service Account**
3. Fill in:
   - **Name**: `listing-analysis-bot`
   - **Description**: "Service account for automated listing analysis"
4. Click **Create and Continue**
5. For role, select **Editor** (or create custom role with Sheets/Drive access)
6. Click **Continue** → **Done**

### Step 4: Generate Credentials

1. Click on the service account you just created
2. Go to the **Keys** tab
3. Click **Add Key** → **Create new key**
4. Choose **JSON**
5. Click **Create**
6. A JSON file will download automatically

### Step 5: Save Credentials

```bash
# In your project directory
mkdir -p credentials
mv ~/Downloads/listing-analysis-*.json credentials/google-credentials.json
```

### Step 6: Prepare Your Google Sheet

1. Create a new Google Sheet or use existing one
2. Put ASINs in Column A:
   ```
   | A          |
   |------------|
   | ASIN       |
   | B08XYZ123  |
   | B07ABC456  |
   ```

3. Click **Share** button
4. Add the service account email (find it in `credentials/google-credentials.json` - look for `"client_email"`)
5. Give **Viewer** access
6. Click **Done**

7. Copy the Sheet ID from URL:
   ```
   https://docs.google.com/spreadsheets/d/[SHEET_ID]/edit
   ```

### Step 7: Gmail App Password

1. Go to your Google Account settings
2. Enable **2-Step Verification** if not already enabled
3. Visit https://myaccount.google.com/apppasswords
4. Create a new app password:
   - Select app: **Mail**
   - Select device: **Other** (name it "Listing Analysis")
5. Click **Generate**
6. Copy the 16-character password (no spaces)

## Part 4: AWS Setup (10 minutes)

### Step 1: Create IAM User

1. Go to https://console.aws.amazon.com/iam/
2. Click **Users** → **Add users**
3. Username: `listing-analysis-bot`
4. Access type: **Access key - Programmatic access**
5. Click **Next: Permissions**

### Step 2: Attach Policies

1. Click **Attach existing policies directly**
2. Search for `AmazonRekognitionFullAccess`
3. Check the box next to it
4. Click **Next: Tags** (skip tags)
5. Click **Next: Review**
6. Click **Create user**

### Step 3: Save Credentials

1. **Important:** Copy the Access Key ID and Secret Access Key
2. Click **Download .csv** (backup)
3. Save these for the next step

## Part 5: Environment Configuration (5 minutes)

### Create .env File

```bash
cp .env.example .env
```

### Edit .env

Open `.env` in your text editor and fill in:

```env
# Firecrawl (from Part 2)
FIRECRAWL_API_KEY=fc-xxxxxxxxxxxxx

# OpenAI (from Part 2)
OPENAI_API_KEY=sk-xxxxxxxxxxxxx

# AWS (from Part 4)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIAxxxxxxxxxxxxx
AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxx

# Google Sheets (from Part 3)
GOOGLE_SHEET_ID=1abc_xyz_your_sheet_id
GOOGLE_CREDENTIALS_PATH=./credentials/google-credentials.json

# Gmail (from Part 3)
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=abcdabcdabcdabcd

# Google Drive (optional)
GOOGLE_DRIVE_FOLDER_ID=

# Scheduler
CRON_SCHEDULE=0 0 1 * *
```

Save the file.

## Part 6: Test Run (2 minutes)

### Verify Setup

```bash
# Test that everything is configured
npm run dev
```

You should see:
```
🚀 Starting Listing Analysis Automation Workflow
============================================================
📊 Reading ASINs from Google Sheet...
✅ Found X valid ASINs
🔥 Scraping X Amazon listings with Firecrawl...
...
```

If you see errors, check:
- [ ] All environment variables are set
- [ ] Google service account has access to the sheet
- [ ] API keys are valid
- [ ] AWS credentials are correct

## Part 7: Schedule for Monthly Runs

### Start Scheduler

```bash
npm run schedule
```

This will run the automation on the schedule defined in `.env` (default: 1st of every month at midnight).

### Keep Scheduler Running

**Option 1: Run in background (macOS/Linux)**

```bash
nohup npm run schedule > scheduler.log 2>&1 &
```

**Option 2: Use PM2 (Recommended)**

```bash
# Install PM2 globally
npm install -g pm2

# Build the project
npm run build

# Start with PM2
pm2 start dist/scheduler.js --name listing-analysis

# Save PM2 configuration
pm2 save

# Enable PM2 startup on boot
pm2 startup
```

**Option 3: Docker (Advanced)**

Create a `Dockerfile`:
```dockerfile
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
CMD ["node", "dist/scheduler.js"]
```

## Troubleshooting

### "Cannot find module"
```bash
npm install
npm run build
```

### "Permission denied" for credentials
```bash
chmod 600 credentials/google-credentials.json
```

### "Invalid credentials" for Google
- Verify service account email is added to the Sheet
- Check JSON file is correct
- Ensure APIs are enabled in Google Cloud

### "Firecrawl 401 Unauthorized"
- Check API key is correct
- Verify account has credits
- Try generating a new API key

### "AWS credentials not found"
- Verify `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` are in `.env`
- Check credentials are not expired
- Verify user has Rekognition permissions

## Next Steps

1. ✅ Test with a small batch (2-3 ASINs)
2. ✅ Verify email report looks good
3. ✅ Check Google Drive file is created (if configured)
4. ✅ Set up monthly schedule
5. ✅ Monitor first scheduled run
6. ✅ Adjust GPT prompt if needed (in `src/nodes/chatgpt.ts`)

## Support

If you encounter issues:
1. Check the error message
2. Review this guide
3. Check `.env` configuration
4. Verify all API keys are valid
5. Open a GitHub issue with error details

---

**You're all set! 🎉**
