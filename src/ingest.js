/**
 * Congress Trade Tracker - Data Ingestion Pipeline
 * Fetches Senate stock trade data from GitHub repository
 * Source: https://github.com/timothycarambat/senate-stock-watcher-data
 */

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

// GitHub raw content base URL
const SENATE_DATA_BASE = 'https://raw.githubusercontent.com/timothycarambat/senate-stock-watcher-data/master';

// Data endpoints
const ENDPOINTS = {
  allTransactions: `${SENATE_DATA_BASE}/aggregate/all_transactions.json`,
  allTickerTransactions: `${SENATE_DATA_BASE}/aggregate/all_ticker_transactions.json`,
  allSenatorTransactions: `${SENATE_DATA_BASE}/aggregate/all_transactions_for_senators.json`,
  dailySummaries: `${SENATE_DATA_BASE}/aggregate/all_daily_summaries.json`
};

// Data directory
const DATA_DIR = path.join(__dirname, '../data');

/**
 * Ensure data directory exists
 */
async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (error) {
    console.error('Failed to create data directory:', error);
    throw error;
  }
}

/**
 * Fetch data from GitHub
 * @param {string} url - GitHub raw URL
 * @returns {Promise<any>} - Parsed JSON data
 */
async function fetchData(url) {
  try {
    console.log(`Fetching: ${url}`);
    const response = await axios.get(url, {
      timeout: 30000,
      headers: {
        'Accept': 'application/json'
      }
    });
    console.log(`✓ Fetched ${response.data.length || Object.keys(response.data).length} records`);
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch ${url}:`, error.message);
    throw error;
  }
}

/**
 * Save data to local file
 * @param {string} filename - Output filename
 * @param {any} data - Data to save
 */
async function saveData(filename, data) {
  const filepath = path.join(DATA_DIR, filename);
  try {
    await fs.writeFile(filepath, JSON.stringify(data, null, 2));
    console.log(`✓ Saved to ${filepath}`);
  } catch (error) {
    console.error(`Failed to save ${filename}:`, error);
    throw error;
  }
}

/**
 * Get recent transactions (last 30 days)
 * @param {Array} transactions - All transactions
 * @returns {Array} - Filtered recent transactions
 */
function getRecentTransactions(transactions, days = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  return transactions.filter(tx => {
    const txDate = new Date(tx.transaction_date);
    return txDate >= cutoffDate;
  });
}

/**
 * Get high-value transactions (>$100k)
 * @param {Array} transactions - All transactions
 * @returns {Array} - High-value transactions
 */
function getHighValueTransactions(transactions) {
  const highValueRanges = [
    '$100,001 - $250,000',
    '$250,001 - $500,000',
    '$500,001 - $1,000,000',
    '$1,000,001 - $5,000,000',
    '$5,000,001 - $25,000,000',
    '$25,000,001 - $50,000,000',
    'Over $50,000,000'
  ];
  
  return transactions.filter(tx => highValueRanges.includes(tx.amount));
}

/**
 * Analyze tickers by frequency
 * @param {Array} transactions - All transactions
 * @returns {Array} - Top tickers with trade counts
 */
function analyzeTopTickers(transactions, limit = 20) {
  const tickerCounts = {};
  
  transactions.forEach(tx => {
    const ticker = tx.ticker || tx.asset_description || '--';
    if (ticker !== '--') {
      tickerCounts[ticker] = (tickerCounts[ticker] || 0) + 1;
    }
  });
  
  return Object.entries(tickerCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([ticker, count]) => ({ ticker, count }));
}

/**
 * Main ingestion function
 */
async function ingest() {
  console.log('🚀 Congress Trade Tracker - Data Ingestion');
  console.log('='.repeat(50));
  
  try {
    // Ensure data directory exists
    await ensureDataDir();
    
    // Fetch all transactions
    console.log('\n📊 Fetching all transactions...');
    const allTransactions = await fetchData(ENDPOINTS.allTransactions);
    await saveData('all_transactions.json', allTransactions);
    
    // Fetch ticker-grouped transactions
    console.log('\n📈 Fetching ticker transactions...');
    const tickerTransactions = await fetchData(ENDPOINTS.allTickerTransactions);
    await saveData('all_ticker_transactions.json', tickerTransactions);
    
    // Fetch senator-grouped transactions
    console.log('\n👔 Fetching senator transactions...');
    const senatorTransactions = await fetchData(ENDPOINTS.allSenatorTransactions);
    await saveData('all_senator_transactions.json', senatorTransactions);
    
    // Generate insights
    console.log('\n🔍 Generating insights...');
    
    const recentTransactions = getRecentTransactions(allTransactions, 30);
    console.log(`- Recent transactions (30 days): ${recentTransactions.length}`);
    await saveData('recent_transactions_30d.json', recentTransactions);
    
    const highValueTxs = getHighValueTransactions(allTransactions);
    console.log(`- High-value transactions (>$100k): ${highValueTxs.length}`);
    await saveData('high_value_transactions.json', highValueTxs);
    
    const topTickers = analyzeTopTickers(allTransactions, 20);
    console.log(`- Top 20 most-traded tickers analyzed`);
    await saveData('top_tickers.json', topTickers);
    
    // Generate summary
    const summary = {
      lastUpdated: new Date().toISOString(),
      totalTransactions: allTransactions.length,
      recentTransactions30d: recentTransactions.length,
      highValueTransactions: highValueTxs.length,
      uniqueTickers: Object.keys(tickerTransactions).length,
      uniqueSenators: Object.keys(senatorTransactions).length,
      topTickers: topTickers.slice(0, 10)
    };
    
    await saveData('summary.json', summary);
    
    console.log('\n✅ Ingestion complete!');
    console.log('='.repeat(50));
    console.log('Summary:');
    console.log(`- Total transactions: ${summary.totalTransactions.toLocaleString()}`);
    console.log(`- Recent (30d): ${summary.recentTransactions30d.toLocaleString()}`);
    console.log(`- High-value (>$100k): ${summary.highValueTransactions.toLocaleString()}`);
    console.log(`- Unique senators: ${summary.uniqueSenators}`);
    console.log(`- Unique tickers: ${summary.uniqueTickers}`);
    console.log('\nTop 5 Tickers:');
    summary.topTickers.slice(0, 5).forEach((t, i) => {
      console.log(`  ${i + 1}. ${t.ticker}: ${t.count} trades`);
    });
    
    return summary;
    
  } catch (error) {
    console.error('\n❌ Ingestion failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  ingest().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { ingest, fetchData, analyzeTopTickers };
