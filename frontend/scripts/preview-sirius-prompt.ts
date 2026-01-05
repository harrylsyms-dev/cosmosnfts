/**
 * Preview the prompt that will be generated for Sirius
 * This tests the updated template system
 */

import { getAllAstronomicalObjects } from '../lib/astronomicalData';
import { buildImagePrompt, PromptBuildOptions, validatePrompt } from '../lib/imagePromptTemplates';

// Find Sirius in astronomical data
const allObjects = getAllAstronomicalObjects();
const sirius = allObjects.find(obj => obj.name === 'Sirius');

if (!sirius) {
  console.log('Sirius not found in astronomical data!');
  process.exit(1);
}

console.log('=== Sirius Astronomical Data ===');
console.log(`Name: ${sirius.name}`);
console.log(`Object Type: ${sirius.objectType}`);
console.log(`Spectral Type: ${sirius.spectralType}`);
console.log(`Description: ${sirius.description}`);
console.log('');

// Build prompt options
const options: PromptBuildOptions = {
  name: sirius.name,
  objectType: sirius.objectType,
  description: sirius.description,
  spectralType: sirius.spectralType,
  mass: sirius.mass,
  notableFeatures: sirius.notableFeatures,
  subType: sirius.subType,
  colorDescription: sirius.colorDescription,
  customVisualCharacteristics: sirius.visualCharacteristics,
};

// Generate the prompt
const result = buildImagePrompt(options);
const validation = validatePrompt(result.prompt);

console.log('=== GENERATED POSITIVE PROMPT ===');
console.log(result.prompt);
console.log('');
console.log('=== GENERATED NEGATIVE PROMPT ===');
console.log(result.negativePrompt);
console.log('');
console.log('=== VALIDATION ===');
console.log(`Valid: ${validation.valid}`);
if (validation.warnings.length > 0) {
  console.log('Warnings:', validation.warnings);
}
console.log('');
console.log('=== KEY CHECK: Object name in parentheses ===');
const firstLine = result.prompt.split('\n')[0];
console.log(`First line: "${firstLine}"`);
console.log(`Contains "(Sirius)": ${firstLine.includes('(Sirius)')}`);
