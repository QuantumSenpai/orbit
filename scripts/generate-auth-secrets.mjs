#!/usr/bin/env node
/**
 * Generate Orbit personal-access credentials.
 *
 *   node scripts/generate-auth-secrets.mjs            # prompts for the password
 *   node scripts/generate-auth-secrets.mjs "my-pass"  # non-interactive
 *
 * Prints two values:
 *   ORBIT_PASSWORD_HASH   — base64-encoded bcrypt hash (safe inside .env files)
 *   ORBIT_SESSION_SECRET  — 32 random bytes, base64
 *
 * The raw bcrypt hash is also printed so it can be pasted straight into a
 * host's secret manager (Vercel, etc.), where no shell expansion occurs.
 */

import crypto from "node:crypto";
import readline from "node:readline";
import bcrypt from "bcrypt";

async function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

const arg = process.argv[2];
const password = arg ?? (await prompt("Orbit password: "));

if (!password) {
  console.error("A password is required.");
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 12);
const secret = crypto.randomBytes(32).toString("base64");

console.log("\n--- Orbit Personal Access credentials -------------------------------\n");
console.log("ORBIT_PASSWORD_HASH (base64 — use this in .env files)");
console.log(hashBase64(hash));
console.log("\nORBIT_PASSWORD_HASH (raw — use this in host secret managers)");
console.log(hash);
console.log("\nORBIT_SESSION_SECRET");
console.log(secret);
console.log("\n----------------------------------------------------------------------\n");
console.log("Keep these out of version control and out of chat transcripts.");

function hashBase64(value) {
  return Buffer.from(value, "utf8").toString("base64");
}
