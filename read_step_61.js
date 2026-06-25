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
  if (lineNum === 61) {
    const data = JSON.parse(line);
    // Find the write_to_file call for route.ts
    const toolCall = data.tool_calls.find(tc => tc.name === 'write_to_file' && tc.args.TargetFile.includes('api/upload/route.ts'));
    if (toolCall) {
      console.log(toolCall.args.CodeContent);
    } else {
      console.log("No tool call found in line 61 for route.ts");
    }
  }
});
