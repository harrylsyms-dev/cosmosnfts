// Export all NFT prompts to Word document
// Run with: npx tsx scripts/export-prompts-to-docx.ts

import * as fs from 'fs';
import * as path from 'path';

// Read the generation results
const resultsPath = path.join(process.cwd(), 'generated-images', 'generation-results.json');
const data = JSON.parse(fs.readFileSync(resultsPath, 'utf-8'));

// Group by object type
const grouped: Record<string, any[]> = {};
for (const item of data.results) {
  if (!grouped[item.objectType]) {
    grouped[item.objectType] = [];
  }
  grouped[item.objectType].push(item);
}

// Sort object types alphabetically
const sortedTypes = Object.keys(grouped).sort();

// Build the document content
let content = `COSMONFT IMAGE PROMPTS
Generated: ${new Date().toISOString().split('T')[0]}
Total NFTs: ${data.results.length}

${'='.repeat(80)}

`;

for (const objectType of sortedTypes) {
  const items = grouped[objectType];
  content += `\n${'='.repeat(80)}\n`;
  content += `${objectType.toUpperCase()} (${items.length} items)\n`;
  content += `${'='.repeat(80)}\n\n`;

  for (const item of items) {
    content += `----------------------------------------\n`;
    content += `NAME: ${item.name}\n`;
    content += `----------------------------------------\n\n`;

    content += `PROMPT:\n`;
    content += `${item.prompt}\n\n`;

    if (item.negativePrompt) {
      content += `NEGATIVE PROMPT:\n`;
      content += `${item.negativePrompt}\n\n`;
    }

    content += `IMAGE URL:\n`;
    content += `${item.imageUrl}\n\n`;

    content += `\n`;
  }
}

// Save as text file (can be opened in Word)
const outputPath = path.join(process.cwd(), 'generated-images', 'NFT_Prompts_Report.txt');
fs.writeFileSync(outputPath, content);
console.log(`\nReport saved to: ${outputPath}`);

// Also create a simpler CSV for easy viewing
let csv = 'Name,Object Type,Prompt,Negative Prompt,Image URL\n';
for (const item of data.results) {
  const prompt = item.prompt.replace(/"/g, '""').replace(/\n/g, ' ');
  const negPrompt = (item.negativePrompt || '').replace(/"/g, '""').replace(/\n/g, ' ');
  csv += `"${item.name}","${item.objectType}","${prompt}","${negPrompt}","${item.imageUrl}"\n`;
}

const csvPath = path.join(process.cwd(), 'generated-images', 'NFT_Prompts.csv');
fs.writeFileSync(csvPath, csv);
console.log(`CSV saved to: ${csvPath}`);

console.log('\nDone!');
