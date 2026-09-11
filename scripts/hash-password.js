// One-off local utility: generates a bcrypt hash to paste into supabase/seed.sql
// or to use when creating an admin manually. Never commit real hashes to a
// public repo history if you can avoid it — private repos only for this project.
//
// Usage: node scripts/hash-password.js "your-chosen-password"

const bcrypt = require("bcryptjs");

const password = process.argv[2];
if (!password) {
  console.error("Usage: node scripts/hash-password.js <password>");
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 10);
console.log(hash);
