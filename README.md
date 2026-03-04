# Congress Trade Tracker

**Status:** 🚧 Data Ingestion MVP (Night 4/7) - **BLOCKED**

Track US Congressional stock trades and generate Telegram alerts on new disclosures.

## 🚨 Critical Blockers

### 1. **Senate Data Source OUTDATED (2020)**
- **Source:** https://github.com/timothycarambat/senate-stock-watcher-data
- **Last Update:** November 2020
- **Issue:** Repository has not been updated in 5+ years
- **Impact:** Cannot track recent trades or send meaningful alerts

### 2. **House Data Source ACCESS DENIED**
- **Source:** `https://house-stock-watcher-data.s3-us-west-2.amazonaws.com`
- **Issue:** S3 bucket returns 403 Forbidden on all endpoints
- **Previous Access:** Reddit posts from 2021 show it was publicly accessible
- **Impact:** No House data available via this route

## 🔍 Alternative Data Sources to Explore

### Option A: Capitol Trades (Likely Best Option)
- **Website:** https://www.capitoltrades.com
- **Features:** "Free solution" mentioned, claims up-to-date data
- **Action Required:** Investigate if they have a public API or data export
- **URL:** Check `/api` or GitHub for data access

### Option B: Quiver Quantitative  
- **Website:** https://www.quiverquant.com/congresstrading/
- **Features:** Congressional trading data with performance metrics
- **Action Required:** Check for API access (may require subscription)

### Option C: Official Sources (Hard Mode)
- **Senate:** https://efdsearch.senate.gov
- **House:** https://disclosures-clerk.house.gov
- **Issue:** Requires scraping/parsing PDF filings
- **Complexity:** High - would need PDF parser + OCR for some documents

### Option D: Finnhub API
- **Endpoint:** `/stock/congressional-trading`
- **Action Required:** Get Finnhub API key (free tier available?)
- **URL:** https://finnhub.io/docs/api/congressional-trading

## ✅ What's Built (Night 4)

### Data Ingestion Pipeline
- ✅ Fetch from GitHub (Senate data)
- ✅ Parse and store transactions
- ✅ Generate insights (high-value trades, top tickers)
- ✅ JSON storage format
- ✅ Command: `npm run ingest`

### Data Files Generated
```
data/
├── all_transactions.json           # 8,350 transactions (2012-2020)
├── all_ticker_transactions.json    # Grouped by ticker (1,027 tickers)
├── all_senator_transactions.json   # Grouped by senator (68 senators)
├── recent_transactions_30d.json    # Last 30 days (0 - data is old)
├── high_value_transactions.json    # >$100k trades (528 trades)
├── top_tickers.json                # Most-traded stocks
└── summary.json                    # Overview stats
```

### Sample Output
```
Total transactions: 8,350
High-value (>$100k): 528
Unique senators: 68
Unique tickers: 1,027

Top 5 Tickers:
1. AAPL: 153 trades
2. BAC: 84 trades
3. NFLX: 77 trades
4. DISCA: 74 trades
5. PFE: 73 trades
```

## 📋 Original Build Plan (4 Nights)

- **Night 4 (Wed):** Data ingestion ✅ (BLOCKED - need current data)
- **Night 5 (Thu):** Trade parsing + Telegram alerts ⏸️ (WAITING)
- **Night 6 (Fri):** Portfolio tracking + Notion integration ⏸️ (WAITING)
- **Night 7 (Sat):** Paper trading API + dashboard ⏸️ (WAITING)

## 🎯 Next Steps (Requires Ryan's Input)

### High Priority
1. **Find Current Data Source**
   - Try Capitol Trades API/export first
   - Check Finnhub with API key
   - Last resort: Official .gov scraping (complex)

2. **Validate Data Quality**
   - Confirm data is updated within 45 days (STOCK Act requirement)
   - Check if House + Senate both available
   - Test API rate limits if applicable

### Medium Priority
3. **Resume Build Once Data Source Secured**
   - Adapt ingestion script for new source
   - Continue with Telegram alerts (Night 5)

## 🔧 Technical Stack

- **Runtime:** Node.js 22
- **Dependencies:** axios, dotenv
- **Data Format:** JSON
- **Storage:** Local filesystem (for now)
- **Future:** Telegram Bot API, Notion API, Alpaca (paper trading)

## 💡 Educational Goal

Learn to track Congressional trades for potential portfolio insights:
- Historical returns: 15-25% annual (reported by various studies)
- 45-day disclosure lag (trades can be old)
- Focus on patterns, not individual trades

## 📖 Usage (When Data Source Fixed)

```bash
# Install dependencies
npm install

# Run data ingestion
npm run ingest

# View summary
cat data/summary.json
```

## 🤝 Data Attribution

Current (outdated) data from:
- **Senate Stock Watcher** by Timothy Carambat
- **Repository:** https://github.com/timothycarambat/senate-stock-watcher-data
- **License:** Public domain (US Government records)
- **Last Updated:** November 2020

---

**Build Status:** Paused pending current data source identification
**Ryan:** Please investigate Capitol Trades or Finnhub API access
