# Congress Trade Tracker

**Status:** ✅ Data Ingestion & Alerts MVP (Night 5/7) - **ACTIVE**

Track US Congressional stock trades and generate Telegram alerts on new disclosures.

## ✅ Built Features

### 1. **Data Ingestion (Capitol Trades)**
- **Source:** https://www.capitoltrades.com (via Firecrawl)
- **Script:** `src/scrape_capitoltrades.js`
- **Function:** Scrapes the latest trades table, parses markdown, and saves to JSON.
- **Output:** `data/capitol_trades_latest.json`

### 2. **Telegram Alerts**
- **Script:** `src/generate_alert.js`
- **Function:** Reads the latest trades, filters for "Yesterday" or "Today", and generates a formatted alert message.
- **Output:** `data/alert_message.txt` (ready for bot transmission)

### 3. **Historical Data (Archived)**
- Legacy scripts (`src/ingest.js`) exist for processing older Senate data (2012-2020), but are secondary to the live scraper.

## 🚀 Usage

```bash
# Install dependencies
npm install

# 1. Scrape latest trades
export FIRECRAWL_API_KEY=your_key
node src/scrape_capitoltrades.js

# 2. Generate alert
node src/generate_alert.js
```

## 📋 Build Plan Progress

- **Night 4 (Wed):** Infrastructure & Historical Ingestion ✅
- **Night 5 (Thu):** Live Data Scraper & Alerting ✅ (Unblocked!)
- **Night 6 (Fri):** Portfolio Tracking & Notion Integration 🔜
- **Night 7 (Sat):** Paper Trading API + Dashboard 🔜

## 🔧 Technical Details

- **Scraping:** Firecrawl API (bypasses SPA rendering issues)
- **Parsing:** Custom Markdown table parser in Node.js
- **Storage:** JSON (local filesystem)

## 🤝 Data Source

- **Primary:** [Capitol Trades](https://www.capitoltrades.com)
- **Method:** Public web scraping via Firecrawl
