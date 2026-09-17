#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { createCipheriv, randomBytes, scryptSync } = require('crypto');

// Encryption function matching the Secret entity
function encrypt(value) {
  const algorithm = 'aes-256-cbc';
  const password = process.env.ENCRYPTION_KEY || 'default-key-change-in-production-32-chars';

  // Generate a random IV for each encryption
  const iv = randomBytes(16);

  // Derive key from password
  const key = scryptSync(password, 'salt', 32);

  const cipher = createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(value, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  // Prepend IV to encrypted data
  return iv.toString('hex') + ':' + encrypted;
}

function populateSecretFixture(fixturePath, envKey, description) {
  const apiKey = process.env[envKey];

  if (!apiKey) {
    console.error(`❌ Environment variable ${envKey} not found`);
    console.log(`Please set ${envKey} in your environment and try again`);
    return false;
  }

  const fixture = [
    {
      name: `${description} API Key`,
      description: `${description} API key for service access`,
      key: envKey,
      encryptedValue: encrypt(apiKey),
      type: "api_key",
      provider: description.toLowerCase(),
      isActive: true,
      userId: "system@platform.com"
    }
  ];

  try {
    fs.writeFileSync(fixturePath, JSON.stringify(fixture, null, 2));
    console.log(`✅ Successfully populated ${fixturePath}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to write ${fixturePath}:`, error.message);
    return false;
  }
}

function main() {
  console.log('🔐 Populating secret fixtures with encrypted values...\n');

  const fixturesDir = path.join(__dirname, '../fixtures');

  // Ensure fixtures directory exists
  if (!fs.existsSync(fixturesDir)) {
    fs.mkdirSync(fixturesDir, { recursive: true });
  }

  let success = true;

  // Populate Gemini key
  const geminiPath = path.join(fixturesDir, 'gemini-key.json');
  if (!populateSecretFixture(geminiPath, 'GEMINI_API_KEY', 'Gemini')) {
    success = false;
  }

  // Populate GitHub key
  const githubPath = path.join(fixturesDir, 'github-key.json');
  if (!populateSecretFixture(githubPath, 'GITHUB_API_KEY', 'GitHub')) {
    success = false;
  }

  // Populate OpenAI key
  const openaiPath = path.join(fixturesDir, 'openai-key.json');
  if (!populateSecretFixture(openaiPath, 'OPENAI_API_KEY', 'OpenAI')) {
    success = false;
  }

  // Populate Anthropic key
  const anthropicPath = path.join(fixturesDir, 'anthropic-key.json');
  if (!populateSecretFixture(anthropicPath, 'ANTHROPIC_API_KEY', 'Anthropic')) {
    success = false;
  }

  // Populate DeepSeek key
  const deepseekPath = path.join(fixturesDir, 'deepseek-key.json');
  if (!populateSecretFixture(deepseekPath, 'DEEPSEEK_API_KEY', 'DeepSeek')) {
    success = false;
  }

  console.log('\n' + (success ? '🎉 All fixtures populated successfully!' : '⚠️  Some fixtures failed to populate'));

  if (success) {
    console.log('\n📝 Next steps:');
    console.log('1. Run database seeding: npm run seed');
    console.log('2. The encrypted secrets will be available in your database');
    console.log('3. Remember: These fixture files are gitignored for security');
  }
}

if (require.main === module) {
  main();
}

module.exports = { encrypt, populateSecretFixture };
