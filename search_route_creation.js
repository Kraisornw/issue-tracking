const fs = require('fs');
const readline = require('readline');

const fileStream = fs.createReadStream('C:/Users/kraisornw/.gemini/antigravity/brain/9b2d923c-370e-498f-ac4a-fbfda6107b38/.system_generated/logs/transcript.jsonl');
const rl = readline.createInterface({
  input: fileStream,
  crlfDelay: Infinity
});

let lineNum = 0;
rl.on('line', (line) => {
  lineNum++;
  if (line.includes('write_to_file') && line.includes('api/upload/route.ts')) {
    console.log(`Creation Match at line ${lineNum}: ${line.substring(0, 300)}...`);
  }
});
