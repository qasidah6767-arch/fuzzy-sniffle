/* Renders scene.html frame-by-frame and encodes an MP4.
   usage: node render.cjs [--fps 30] [--out out/promo-16x9.mp4] [--scale 1] */
const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
const fs = require('fs'), path = require('path');

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > -1 ? process.argv[i+1] : d; };
const FPS   = +arg('fps', 30);
const SCALE = +arg('scale', 1);
const OUT   = path.resolve(__dirname, arg('out', 'out/promo-16x9.mp4'));
const FRAMES = arg('frames', path.join(process.env.SCRATCH || '/tmp', 'promo-frames'));

(async () => {
  fs.rmSync(FRAMES, { recursive:true, force:true });
  fs.mkdirSync(FRAMES, { recursive:true });
  fs.mkdirSync(path.dirname(OUT), { recursive:true });

  const browser = await chromium.launch({ args:['--force-color-profile=srgb','--disable-lcd-text'] });
  const page = await browser.newPage({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: SCALE,
  });
  page.on('pageerror', e => { console.error('PAGE ERROR:', e.message); process.exitCode = 1; });
  await page.goto('file://' + path.resolve(__dirname, 'scene.html'));
  await page.evaluate(() => window.ready());

  const DUR = await page.evaluate(() => window.DURATION);
  const total = Math.round(DUR * FPS);
  console.log(`rendering ${total} frames @ ${FPS}fps (${DUR}s)`);

  const t0 = Date.now();
  for (let f = 0; f < total; f++) {
    await page.evaluate(t => window.renderFrame(t), f / FPS);
    await page.screenshot({ path: path.join(FRAMES, `f${String(f).padStart(5,'0')}.png`) });
    if (f % 60 === 0 && f) {
      const el = (Date.now()-t0)/1000;
      console.log(`  ${f}/${total}  ${el.toFixed(0)}s elapsed, ~${(el/f*(total-f)).toFixed(0)}s left`);
    }
  }
  await browser.close();
  console.log(`frames done in ${((Date.now()-t0)/1000).toFixed(0)}s — encoding`);

  execFileSync('ffmpeg', [
    '-y','-loglevel','error','-framerate', String(FPS),
    '-i', path.join(FRAMES, 'f%05d.png'),
    '-c:v','libx264','-preset','slow','-crf','18',
    '-pix_fmt','yuv420p','-movflags','+faststart',
    OUT,
  ], { stdio:'inherit' });

  // poster frame
  execFileSync('ffmpeg', ['-y','-loglevel','error','-i', OUT, '-ss','18.4','-frames:v','1',
    OUT.replace(/\.mp4$/, '-poster.png')], { stdio:'inherit' });

  const mb = (fs.statSync(OUT).size/1048576).toFixed(2);
  console.log(`\nDONE  ${OUT}  (${mb} MB)`);
})();
