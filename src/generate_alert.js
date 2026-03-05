const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../data/capitol_trades_latest.json');

function generateAlerts() {
    if (!fs.existsSync(DATA_FILE)) {
        console.error('❌ Data file not found:', DATA_FILE);
        return;
    }

    const trades = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    
    // Filter for recent trades (published "Yesterday" or "Today")
    // The format is like "22:00 Yesterday" or "10:00 Today"
    const recentTrades = trades.filter(t => {
        const pub = t.published.toLowerCase();
        return pub.includes('yesterday') || pub.includes('today');
    });

    if (recentTrades.length === 0) {
        console.log('No new trades found from Yesterday/Today.');
        return;
    }

    console.log(`🚨 Found ${recentTrades.length} new trades!`);

    let message = `🏛️ **Congress Trade Alert**\n\n`;
    
    // Group by politician to make it readable
    const byPolitician = {};
    recentTrades.forEach(t => {
        if (!byPolitician[t.politician]) {
            byPolitician[t.politician] = [];
        }
        byPolitician[t.politician].push(t);
    });

    for (const [politician, pTrades] of Object.entries(byPolitician)) {
        message += `👤 **${politician}**\n`;
        pTrades.forEach(t => {
            const icon = t.type.toLowerCase().includes('buy') ? '🟢' : '🔴';
            message += `${icon} ${t.type.toUpperCase()} ${t.issuer}\n`;
            message += `   💰 ${t.size} | 📅 Traded: ${t.traded}\n`;
            if (t.link) message += `   🔗 [Details](${t.link})\n`;
        });
        message += '\n';
    }

    // Save alert text to a file so the agent can read it
    const alertPath = path.join(__dirname, '../data/alert_message.txt');
    fs.writeFileSync(alertPath, message);
    console.log(`✅ Alert message saved to ${alertPath}`);
    console.log(message);
}

// Run if called directly
if (require.main === module) {
    generateAlerts();
}

module.exports = { generateAlerts };
