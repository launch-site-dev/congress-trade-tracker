require('dotenv').config();
const fs = require('fs');
const path = require('path');
const Alpaca = require('@alpacahq/alpaca-trade-api');

// Initialize Alpaca API
// Uses environment variables APCA_API_KEY_ID and APCA_API_SECRET_KEY
// Ensure APCA_API_BASE_URL is set to 'https://paper-api.alpaca.markets'
const alpaca = new Alpaca({
  paper: true,
  usePolygon: false
});

// Settings
const TRADE_AMOUNT_USD = 1000; // How much to invest per "buy" trade

async function executePaperTrades() {
  console.log('🚀 Starting Paper Trading Execution...');
  
  // 1. Verify Alpaca Connection
  try {
    const account = await alpaca.getAccount();
    console.log(`✅ Connected to Alpaca. Account Status: ${account.status}`);
    console.log(`💵 Buying Power: $${account.buying_power}`);
    console.log(`💵 Portfolio Value: $${account.portfolio_value}`);
  } catch (error) {
    console.error('❌ Failed to connect to Alpaca API. Ensure APCA_API_KEY_ID and APCA_API_SECRET_KEY are set.');
    console.error(error.message);
    return;
  }

  // 2. Load latest parsed trades
  const tradesFile = path.join(__dirname, '../data/recent_trades.json'); // assuming this file exists or using portfolio_summary
  if (!fs.existsSync(tradesFile)) {
    console.warn(`⚠️ No recent trades file found at ${tradesFile}. Skipping trading.`);
    return;
  }

  const tradesData = JSON.parse(fs.readFileSync(tradesFile, 'utf8'));
  const tradesToExecute = tradesData.trades || tradesData || [];

  if (tradesToExecute.length === 0) {
    console.log('No recent trades to execute.');
    return;
  }

  // 3. Evaluate and place orders
  console.log(`Evaluating ${tradesToExecute.length} trades for execution...`);

  for (const trade of tradesToExecute) {
    const ticker = trade.ticker;
    const type = (trade.type || trade.tx_type || '').toLowerCase(); // 'buy' or 'sell'

    if (!ticker) continue;

    try {
      if (type === 'buy') {
        // We will buy a fractional amount based on TRADE_AMOUNT_USD
        console.log(`📈 Placing BUY order for ${ticker} ($${TRADE_AMOUNT_USD})...`);
        const order = await alpaca.createOrder({
          symbol: ticker,
          notional: TRADE_AMOUNT_USD, // Fractional trading by dollar amount
          side: 'buy',
          type: 'market',
          time_in_force: 'day'
        });
        console.log(`   ✅ Order placed. ID: ${order.id}`);
      } else if (type === 'sell') {
        // For sell, we check if we own the position and sell it
        const positions = await alpaca.getPositions();
        const position = positions.find(p => p.symbol === ticker);
        
        if (position) {
          console.log(`📉 Placing SELL order for ${ticker} (Liquidating position)...`);
          const order = await alpaca.closePosition(ticker);
          console.log(`   ✅ Position closed. ID: ${order.id}`);
        } else {
          console.log(`   ⏭️ Skipping SELL for ${ticker} - we do not currently own it.`);
        }
      }
    } catch (err) {
      console.error(`❌ Failed to execute trade for ${ticker}: ${err.message}`);
    }
  }

  console.log('🎉 Paper Trading Execution Complete.');
}

executePaperTrades();
