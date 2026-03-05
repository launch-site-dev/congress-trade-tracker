const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY || 'fc-982f9f7f05954b4ca2af5fbf6a049287';
const DATA_DIR = path.join(__dirname, '../data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

async function scrapeCapitolTrades() {
    console.log('🚀 Starting Capitol Trades scrape via Firecrawl...');

    try {
        const response = await axios.post('https://api.firecrawl.dev/v0/scrape', {
            url: 'https://www.capitoltrades.com/trades',
            pageOptions: {
                onlyMainContent: true
            }
        }, {
            headers: {
                'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.data.success) {
            console.log('✅ Firecrawl scrape successful');
            const markdown = response.data.data.markdown;
            
            // Parse the markdown table
            const trades = parseMarkdownTable(markdown);
            
            console.log(`📊 Extracted ${trades.length} trades`);
            
            // Save to file
            const outputPath = path.join(DATA_DIR, 'capitol_trades_latest.json');
            fs.writeFileSync(outputPath, JSON.stringify(trades, null, 2));
            console.log(`BS Saved trades to ${outputPath}`);
            
            return trades;
        } else {
            console.error('❌ Firecrawl scrape failed:', response.data);
            return [];
        }
    } catch (error) {
        console.error('❌ Error scraping Capitol Trades:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
        return [];
    }
}

function parseMarkdownTable(markdown) {
    const lines = markdown.split('\n');
    const trades = [];
    let insideTable = false;
    
    // Regex to match table rows: | col1 | col2 | ... |
    // This is a rough parser, might need tuning based on exact markdown output
    
    for (const line of lines) {
        if (line.trim().startsWith('| ---')) {
            insideTable = true;
            continue;
        }
        
        if (insideTable && line.trim().startsWith('|')) {
            // Remove leading/trailing pipes and split
            const cells = line.split('|').map(cell => cell.trim()).filter(cell => cell !== '');
            
            if (cells.length >= 9) {
                // Extract data from cells (based on the structure seen in the previous tool output)
                // | Politician | Traded Issuer | Published | Traded | Filed After | Owner | Type | Size | Price | |
                
                // Helper to remove markdown images and links
                const cleanText = (text) => text.replace(/!\[.*?\]\(.*?\)/g, '').replace(/\[(.*?)\]\(.*?\)/g, '$1').replace(/<br>/g, ' ').replace(/##/g, '').replace(/###/g, '').trim();
                const extractLink = (text) => {
                    const match = text.match(/\[(.*?)\]\((.*?)\)/);
                    return match ? match[2] : null;
                };

                const politicianCell = cells[0];
                const issuerCell = cells[1];
                
                // Politician Name Cleanup: "Dave McCormick RepublicanSenatePA" -> "Dave McCormick"
                // This is tricky without a clear delimiter, but we can assume the name is at the start.
                // Or just keep it as is for now, it's readable.
                const politicianName = cleanText(politicianCell).replace(/\s+/g, ' ');

                // Issuer Name Cleanup: "# MERCER COUNTY N/A" -> "MERCER COUNTY"
                // Remove leading # and trailing N/A if present
                let issuerName = cleanText(issuerCell).replace(/^#\s*/, '').replace(/\s*N\/A$/, '').replace(/\s+/g, ' ');
                
                const publishedDate = cleanText(cells[2]);
                const tradedDate = cleanText(cells[3]);
                const filedAfter = cleanText(cells[4]);
                const owner = cleanText(cells[5]);
                const type = cleanText(cells[6]);
                const size = cleanText(cells[7]);
                const price = cleanText(cells[8]);
                
                let link = extractLink(cells[9]);
                if (link && !link.startsWith('http')) {
                    link = `https://www.capitoltrades.com${link}`;
                }

                trades.push({
                    politician: politicianName,
                    issuer: issuerName,
                    published: publishedDate,
                    traded: tradedDate,
                    filedAfter: filedAfter,
                    owner: owner,
                    type: type,
                    size: size,
                    price: price,
                    link: link,
                    scrapedAt: new Date().toISOString()
                });
            }
        }
    }
    
    return trades;
}

// Run if called directly
if (require.main === module) {
    scrapeCapitolTrades();
}

module.exports = { scrapeCapitolTrades };
