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
  if (lineNum === 241) {
    const data = JSON.parse(line);
    console.log(`--- Line ${lineNum} (Step ${data.step_index}, Source ${data.source}, Type ${data.type}) ---`);
    if (data.content) console.log(data.content.substring(0, 1500));
  }
});
