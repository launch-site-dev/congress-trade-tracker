require('dotenv').config({ path: '../../../.credentials' });
const { Client } = require('@notionhq/client');
const fs = require('fs');
const path = require('path');

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const NOTION_DATABASE_ID = process.env.NOTION_TRADES_DB_ID || "PASTE_YOUR_DB_ID_HERE";

async function pushTrades() {
  const dataPath = path.join(__dirname, '../data/capitol_trades_latest.json');
  if (!fs.existsSync(dataPath)) {
    console.error("No trades data found. Run scrape_capitoltrades.js first.");
    return;
  }

  const trades = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  console.log(`Found ${trades.length} trades to sync...`);

  for (const trade of trades) {
    try {
      await notion.pages.create({
        parent: { database_id: NOTION_DATABASE_ID },
        properties: {
          "Ticker/Issuer": { title: [{ text: { content: trade.issuer } }] },
          "Politician": { rich_text: [{ text: { content: trade.politician } }] },
          "Trade Type": { select: { name: trade.type } },
          "Size": { select: { name: trade.size || "Unknown" } },
          "Traded Date": { rich_text: [{ text: { content: trade.traded || "" } }] },
          "Link": { url: trade.link || "" },
          "Scraped At": { date: { start: trade.scrapedAt } }
        }
      });
      console.log(`✅ Synced trade: ${trade.issuer}`);
    } catch (err) {
      console.error(`❌ Failed to sync trade: ${trade.issuer}`, err.message);
    }
  }
}

pushTrades();
