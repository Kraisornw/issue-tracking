const fs = require('fs');
const readline = require('readline');

const fileStream = fs.createReadStream('C:/Users/kraisornw/.gemini/antigravity/brain/9b2d923c-370e-498f-ac4a-fbfda6107b38/.system_generated/logs/transcript_full.jsonl');
const rl = readline.createInterface({
  input: fileStream,
  crlfDelay: Infinity
});

let lineNum = 0;
rl.on('line', (line) => {
  lineNum++;
  const data = JSON.parse(line);
  if (data.tool_calls) {
    data.tool_calls.forEach(tc => {
      if (tc.name === 'write_to_file') {
        console.log(`Line ${lineNum} wrote to: ${tc.args.TargetFile || tc.args.TargetFile}`);
      }
    });
  }
});
