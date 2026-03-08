require('dotenv').config({ path: '../../../.credentials' });
const { Client } = require('@notionhq/client');
const fs = require('fs');
const path = require('path');

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const PARENT_PAGE_ID = "b5e59e48-e1cc-43e0-968c-c1f9170a3b9b"; // Projects page

async function setup() {
  try {
    console.log("Creating Trades Database...");
    const tradesDb = await notion.databases.create({
      parent: { type: "page_id", page_id: PARENT_PAGE_ID },
      title: [{ type: "text", text: { content: "Congress Trades" } }],
      properties: {
        "Ticker/Issuer": { title: {} },
        "Politician": { rich_text: {} },
        "Trade Type": { select: { options: [{ name: "buy", color: "green" }, { name: "sell", color: "red" }, { name: "exchange", color: "yellow" }] } },
        "Size": { select: {} },
        "Traded Date": { rich_text: {} },
        "Link": { url: {} },
        "Scraped At": { date: {} }
      }
    });

    console.log("Trades DB created:", tradesDb.id);
    
    console.log("Creating Portfolio Database...");
    const portfolioDb = await notion.databases.create({
      parent: { type: "page_id", page_id: PARENT_PAGE_ID },
      title: [{ type: "text", text: { content: "Congress Portfolio Tracking" } }],
      properties: {
        "Ticker/Issuer": { title: {} },
        "Net Position Estimate": { number: { format: "us_dollar" } },
        "Buy Volume (Estimated)": { number: { format: "us_dollar" } },
        "Sell Volume (Estimated)": { number: { format: "us_dollar" } },
        "Last Trade Date": { date: {} }
      }
    });
    
    console.log("Portfolio DB created:", portfolioDb.id);

    // Save IDs
    const dbs = { trades_db: tradesDb.id, portfolio_db: portfolioDb.id };
    fs.writeFileSync(path.join(__dirname, '../data/notion_dbs.json'), JSON.stringify(dbs, null, 2));
    console.log("Saved DB IDs to data/notion_dbs.json");

  } catch (err) {
    console.error("Error setting up Notion databases:", err);
  }
}

setup();
