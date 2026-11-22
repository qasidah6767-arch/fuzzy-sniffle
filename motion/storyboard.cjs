/* Samples key moments into one contact sheet for fast visual QA. */
const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
const fs = require('fs'), path = require('path');
const DIR = process.argv[2] || '/tmp/sb';
const TIMES = process.argv.slice(3).map(Number);

(async () => {
  fs.rmSync(DIR, { recursive:true, force:true }); fs.mkdirSync(DIR, { recursive:true });
  const b = await chromium.launch();
  const p = await b.newPage({ viewport:{ width:1920, height:1080 } });
  p.on('pageerror', e => console.error('PAGE ERROR:', e.message));
  await p.goto('file://' + path.resolve(__dirname, 'scene.html'));
  await p.evaluate(() => window.ready());
  for (let i=0;i<TIMES.length;i++){
    await p.evaluate(t => window.renderFrame(t), TIMES[i]);
    await p.screenshot({ path: path.join(DIR, `s${String(i).padStart(2,'0')}.png`) });
  }
  await b.close();
  const cols = 2, rows = Math.ceil(TIMES.length/cols);
  execFileSync('ffmpeg', ['-y','-loglevel','error','-i', path.join(DIR,'s%02d.png'),
    '-vf', `scale=760:-1,tile=${cols}x${rows}:padding=8:margin=8:color=0x333333`,
    '-frames:v','1', path.join(DIR,'sheet.png')], { stdio:'inherit' });
  console.log('sheet:', path.join(DIR,'sheet.png'), '\ntimes:', TIMES.join(', '));
})();
