import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = 'src/content/competitors';
const STALE_DAYS = 90;
const today = new Date();

let staleCount = 0;
let lowConfidenceCount = 0;
const issues = [];

for (const file of readdirSync(dir)) {
  if (!file.endsWith('.json')) continue;
  const data = JSON.parse(readFileSync(join(dir, file), 'utf8'));
  const verifiedAt = new Date(data.lastVerified);
  const days = Math.floor((today - verifiedAt) / (1000 * 60 * 60 * 24));
  if (days > STALE_DAYS) {
    issues.push(`STALE  ${data.slug.padEnd(20)} verified ${days} days ago (${data.lastVerified})`);
    staleCount++;
  }
  if (data.verificationConfidence !== 'high') {
    issues.push(`LOW    ${data.slug.padEnd(20)} confidence=${data.verificationConfidence}`);
    lowConfidenceCount++;
  }
}

const total = readdirSync(dir).filter((f) => f.endsWith('.json')).length;
if (issues.length === 0) {
  console.log(`✓ All ${total} competitors are fresh and high-confidence.`);
} else {
  console.warn(`⚠ Competitor data needs attention (${total} total):`);
  for (const i of issues) console.warn('  ' + i);
  console.warn(`  ${staleCount} stale, ${lowConfidenceCount} low/medium confidence`);
}
