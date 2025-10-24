#!/usr/bin/env node
/**
 * Generate OG Image for Art of Intent
 * Creates a leaderboard image with mock data for static hosting
 */

const fs = require('fs');
const path = require('path');

// Load the generator
const LeaderboardCardGenerator = require('./src/js/leaderboard-card-generator.js');
const { getMockLeaderboardData } = require('./src/js/leaderboard-data.js');

// Mock window.APP_VERSION for Node environment
global.window = {
    APP_VERSION: {
        display: 'v1.0.0'
    }
};

async function generateOGImage() {
    console.log('🎨 Generating OG Image for Art of Intent...\n');
    
    try {
        // Get mock data
        console.log('📊 Loading mock leaderboard data...');
        const data = getMockLeaderboardData();
        console.log(`   - ${data.topPlayers.length} players`);
        console.log(`   - ${data.stats.totalPlayers} total players`);
        console.log(`   - ${data.stats.gamesToday} games today\n`);
        
        // Generate SVG
        console.log('🖼️  Generating SVG...');
        const generator = new LeaderboardCardGenerator();
        const svg = generator.generateSVG(data);
        console.log(`   - SVG size: ${(svg.length / 1024).toFixed(2)} KB\n`);
        
        // Save SVG for reference
        const svgPath = path.join(__dirname, 'src/assets/og_image.svg');
        fs.writeFileSync(svgPath, svg);
        console.log(`✅ SVG saved: ${svgPath}\n`);
        
        console.log('📝 Note: To generate PNG, open generate-og-image.html in browser');
        console.log('   and use the "Download PNG" button.\n');
        
        console.log('🎉 OG Image generation complete!');
        
    } catch (error) {
        console.error('❌ Error generating OG image:', error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    generateOGImage();
}

module.exports = { generateOGImage };
