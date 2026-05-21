const { createOpenAI } = require('@ai-sdk/openai');
const { generateText } = require('ai');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local
const envPath = path.join(__dirname, '.env.local');
try {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/OPENROUTER_API_KEY=(.+)/);
  if (match) {
    process.env.OPENROUTER_API_KEY = match[1].trim();
  }
} catch (e) {
  console.error('Failed to read .env.local', e);
}

const apiKey = process.env.OPENROUTER_API_KEY;

if (!apiKey) {
  console.error('No API Key found');
  process.exit(1);
}

const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: apiKey,
});

async function testModel(modelName) {
  try {
    console.log(`Testing model: ${modelName}...`);
    const start = Date.now();
    const response = await generateText({
      model: openrouter(modelName),
      prompt: 'Dame una lista de 3 frutas en español, una por línea.',
      maxOutputTokens: 100,
    });
    const duration = Date.now() - start;
    console.log(`Success in ${duration}ms! Response:\n"${response.text}"`);
    return true;
  } catch (error) {
    console.error(`Failed for model ${modelName}:`, error.message);
    return false;
  }
}

async function main() {
  const models = [
    'baidu/cobuddy:free',
    'poolside/laguna-xs.2:free',
    'arcee-ai/trinity-large-thinking:free',
    'openai/gpt-oss-120b:free'
  ];

  for (const model of models) {
    await testModel(model);
    console.log('---');
  }
}

main();
