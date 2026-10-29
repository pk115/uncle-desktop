const { spawnSync } = require('child_process');
const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;

const res = spawnSync('node_modules/electron/dist/electron.exe', ['.'], {
  env,
  encoding: 'utf8',
  timeout: 5000
});

console.log('STATUS:', res.status);
console.log('SIGNAL:', res.signal);
console.log('STDOUT:', res.stdout);
console.log('STDERR:', res.stderr);

