const crypto = require('crypto');

// Generate a secure random 32-byte encryption key
const encryptionKey = crypto.randomBytes(32).toString('hex');

// Generate a secure random 16-byte IV
const iv = crypto.randomBytes(16).toString('hex');

// Generate a secure random salt
const salt = crypto.randomBytes(16).toString('hex');

console.log('\nAdd these to your Backend/.env file:\n');
console.log(`QR_ENCRYPTION_KEY=${encryptionKey}`);
console.log(`QR_IV=${iv}`);
console.log(`QR_SALT=${salt}\n`); 