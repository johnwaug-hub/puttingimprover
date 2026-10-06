#!/usr/bin/env node
/**
 * Achievement Points Sync Script
 * 
 * This script syncs achievement point values from the single source of truth
 * (shared/achievement-points.json) to both:
 * - Client: js/config/constants.js
 * - Server: functions/src/index.ts
 * 
 * Usage: node shared/sync-achievement-points.js
 */

const fs = require('fs');
const path = require('path');

const SOURCE_FILE = path.join(__dirname, 'achievement-points.json');
const CLIENT_FILE = path.join(__dirname, '..', 'js', 'config', 'constants.js');
const SERVER_FILE = path.join(__dirname, '..', 'functions', 'src', 'index.ts');

// Load source of truth
const sourceData = JSON.parse(fs.readFileSync(SOURCE_FILE, 'utf8'));
const version = sourceData._version;
delete sourceData._version;
delete sourceData._lastUpdated;
delete sourceData._description;

// Convert to sorted entries (alphabetical)
const sortedEntries = Object.entries(sourceData)
  .sort(([a], [b]) => a.localeCompare(b));

console.log(`\n🔄 Syncing Achievement Points (v${version})`);
console.log(`   Found ${sortedEntries.length} achievements\n`);

// Generate TypeScript constant for server
function generateServerConst() {
  let ts = `// Source of truth: shared/achievement-points.json - AUTO-GENERATED\n`;
  ts += `// Last synced: v${version}\n`;
  ts += `const ACHIEVEMENT_POINTS: Record<string, number> = {\n`;
  
  for (const [id, points] of sortedEntries) {
    ts += `  ${id}: ${points},\n`;
  }
  
  ts += `};`;
  return ts;
}

// Update server file
function updateServer() {
  let content = fs.readFileSync(SERVER_FILE, 'utf8');
  
  // Find and replace the ACHIEVEMENT_POINTS constant
  const startMarker = /\/\/ Source of truth:.*\nconst ACHIEVEMENT_POINTS/;
  const endMarker = /^};$/m;
  
  // Find the start
  const startMatch = content.match(/const ACHIEVEMENT_POINTS: Record<string, number> = \{/);
  if (!startMatch) {
    console.log('❌ Could not find ACHIEVEMENT_POINTS in server file');
    return false;
  }
  
  const startIdx = content.indexOf('const ACHIEVEMENT_POINTS');
  
  // Find the closing brace (count braces)
  let braceCount = 0;
  let endIdx = startIdx;
  let inConst = false;
  
  for (let i = startIdx; i < content.length; i++) {
    if (content[i] === '{') {
      braceCount++;
      inConst = true;
    } else if (content[i] === '}') {
      braceCount--;
      if (inConst && braceCount === 0) {
        endIdx = i + 2; // Include }; and newline
        break;
      }
    }
  }
  
  // Also capture any comment lines before
  let commentStart = startIdx;
  const lines = content.substring(0, startIdx).split('\n');
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].trim().startsWith('//') && lines[i].includes('Source of truth')) {
      commentStart = content.lastIndexOf(lines[i], startIdx);
      break;
    }
  }
  
  const newContent = content.substring(0, commentStart) + 
                     generateServerConst() + 
                     content.substring(endIdx);
  
  fs.writeFileSync(SERVER_FILE, newContent);
  console.log('✅ Updated server: functions/src/index.ts');
  return true;
}

// Validate client has all achievements
function validateClient() {
  const content = fs.readFileSync(CLIENT_FILE, 'utf8');
  const missing = [];
  
  for (const [id, points] of sortedEntries) {
    // Look for the achievement id in the file
    if (!content.includes(`'${id}'`) && !content.includes(`"${id}"`)) {
      missing.push(id);
    }
  }
  
  if (missing.length > 0) {
    console.log(`\n⚠️  Client missing ${missing.length} achievement IDs:`);
    missing.forEach(id => console.log(`   - ${id}`));
    console.log('\n   These need to be added manually to js/config/constants.js');
  } else {
    console.log('✅ Client has all achievement IDs');
  }
  
  return missing;
}

// Run sync
console.log('📋 Updating server...');
updateServer();

console.log('\n📋 Validating client...');
validateClient();

console.log('\n✨ Sync complete!\n');
console.log('Next steps:');
console.log('1. Review changes in functions/src/index.ts');
console.log('2. Add any missing achievements to js/config/constants.js');
console.log('3. Update version numbers');
console.log('4. Deploy: firebase deploy --project putting-improver-waugs\n');
