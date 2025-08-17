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

function updateSecretsFile() {
  const secretsPath = path.join(__dirname, '../fixtures/secrets.json');

  // Read existing secrets file
  let secrets;
  try {
    const fileContent = fs.readFileSync(secretsPath, 'utf-8');
    secrets = JSON.parse(fileContent);
  } catch (error) {
    console.error('❌ Failed to read secrets.json:', error.message);
    return false;
  }

  let updated = false;

  // Update Gemini API key
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    const geminiSecret = secrets.find(s => s.key === 'GEMINI_API_KEY');
    if (geminiSecret) {
      geminiSecret.encryptedValue = encrypt(geminiKey);
      console.log('✅ Updated Gemini API key with encrypted value');
      updated = true;
    }
  } else {
    console.log('⚠️  GEMINI_API_KEY environment variable not found');
  }

  // Update GitHub API key
  const githubKey = process.env.GITHUB_API_KEY;
  if (githubKey) {
    const githubSecret = secrets.find(s => s.key === 'GITHUB_API_KEY');
    if (githubSecret) {
      githubSecret.encryptedValue = encrypt(githubKey);
      console.log('✅ Updated GitHub API key with encrypted value');
      updated = true;
    }
  } else {
    console.log('⚠️  GITHUB_API_KEY environment variable not found');
  }

  if (updated) {
    try {
      fs.writeFileSync(secretsPath, JSON.stringify(secrets, null, 2));
      console.log('✅ Successfully updated secrets.json');
      return true;
    } catch (error) {
      console.error('❌ Failed to write secrets.json:', error.message);
      return false;
    }
  } else {
    console.log('ℹ️  No updates made - no environment variables found');
    return false;
  }
}

function main() {
  console.log('🔐 Updating secrets.json with encrypted values...\n');

  const success = updateSecretsFile();

  if (success) {
    console.log('\n📝 Next steps:');
    console.log('1. Run database seeding: npm run seed');
    console.log('2. The encrypted secrets will be available in your database');
    console.log('3. Remember: secrets.json is gitignored for security');
  } else {
    console.log('\n💡 To use this script:');
    console.log('1. Set your API keys as environment variables:');
    console.log('   export GEMINI_API_KEY="your-gemini-key"');
    console.log('   export GITHUB_API_KEY="your-github-key"');
    console.log('2. Run this script again');
  }
}

if (require.main === module) {
  main();
}

module.exports = { encrypt, updateSecretsFile };
