const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing env variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: issues, error: issuesErr } = await supabase.from('issues').select('*');
  if (issuesErr) {
    console.error("Error fetching issues:", issuesErr);
  } else {
    console.log(`Successfully fetched ${issues.length} issues from Supabase.`);
    if (issues.length > 0) {
      console.log("Sample issue:", issues[0]);
    }
  }

  const { data: history, error: histErr } = await supabase.from('upload_history').select('*');
  if (histErr) {
    console.error("Error fetching history:", histErr);
  } else {
    console.log(`Successfully fetched ${history.length} upload history records.`);
    console.log("History records:", history);
  }
}

check();
