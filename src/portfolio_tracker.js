const fs = require('fs');
const path = require('path');

function aggregatePortfolio() {
  const dataPath = path.join(__dirname, '../data/capitol_trades_latest.json');
  if (!fs.existsSync(dataPath)) {
    console.error("No trades data found. Run scrape_capitoltrades.js first.");
    return;
  }

  const trades = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  const portfolio = {};

  const parseSize = (sizeStr) => {
    if (!sizeStr || sizeStr === 'N/A') return 0;
    // e.g. "1K–15K", "500K–1M", "1M–5M", "<1K"
    let cleaned = sizeStr.replace(/,/g, '');
    let maxVal = 0;
    
    if (cleaned.includes('–')) {
        let parts = cleaned.split('–');
        let right = parts[1].trim();
        maxVal = right.includes('M') ? parseFloat(right) * 1000000 : parseFloat(right) * 1000;
    } else if (cleaned.includes('<')) {
        let num = cleaned.replace('<', '').trim();
        maxVal = num.includes('M') ? parseFloat(num) * 1000000 : parseFloat(num) * 1000;
    }
    return isNaN(maxVal) ? 0 : maxVal;
  };

  for (const trade of trades) {
    const issuer = trade.issuer;
    if (!portfolio[issuer]) {
      portfolio[issuer] = { ticker: issuer, totalBought: 0, totalSold: 0, netEstimate: 0, lastTrade: trade.traded };
    }
    
    const amount = parseSize(trade.size);
    if (trade.type.toLowerCase() === 'buy') {
      portfolio[issuer].totalBought += amount;
      portfolio[issuer].netEstimate += amount;
    } else if (trade.type.toLowerCase() === 'sell') {
      portfolio[issuer].totalSold += amount;
      portfolio[issuer].netEstimate -= amount;
    }
    
    // update last trade date if we assume latest data is parsed top-down
  }

  const portfolioArray = Object.values(portfolio).sort((a, b) => b.netEstimate - a.netEstimate);
  
  const outPath = path.join(__dirname, '../data/portfolio_summary.json');
  fs.writeFileSync(outPath, JSON.stringify(portfolioArray, null, 2));
  console.log(`✅ Calculated portfolio summary for ${portfolioArray.length} assets.`);
  console.log(`Saved to ${outPath}`);
}

aggregatePortfolio();
