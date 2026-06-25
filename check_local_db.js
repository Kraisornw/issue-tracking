const fs = require('fs');
try {
  const data = JSON.parse(fs.readFileSync('local_db.json', 'utf8'));
  console.log(`Local JSON DB has ${data.issues ? data.issues.length : 0} issues.`);
  if (data.issues && data.issues.length > 0) {
    console.log("Sample local issue:", data.issues[0]);
  }
} catch (e) {
  console.error("Error reading local db:", e);
}
