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
  if (lineNum === 60) {
    const data = JSON.parse(line);
    const tc = data.tool_calls.find(t => t.name === 'write_to_file');
    console.log(tc.args.CodeContent);
  }
});
