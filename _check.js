const { execSync } = require('child_process');
try {
  const out = execSync('npx tsc --noEmit', { cwd: __dirname, encoding: 'utf-8', stdio: 'pipe' });
  console.log('SUCCESS');
  if (out) console.log(out);
} catch (e) {
  console.error(e.stdout || e.message);
  if (e.stderr) console.error(e.stderr);
  process.exit(1);
}
