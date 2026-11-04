// Usage: node tools/export-links-runners.cjs /path/to/links-inMotion
// Requires playwright-core and Chrome; no image generation or changes to the source artwork.
const fs = require('fs');
const path = require('path');
const {chromium} = require(process.env.RUNNER_PLAYWRIGHT_MODULE || 'playwright-core');
(async () => {
  if (!process.argv[2]) throw new Error('Pass the links-inMotion checkout path.');
  const source = path.resolve(process.argv[2]);
  const dest = path.resolve(__dirname, '../web');
  const text = fs.readFileSync(path.join(source, 'scene/runner.js'), 'utf8');
  const rig = text.slice(text.indexOf('var PARTS='), text.indexOf("/* Hooper's joints"));
  const browser = await chromium.launch({executablePath: process.env.RUNNER_CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true});
  try {
    const page = await browser.newPage();
    await page.evaluate(rig);
    for (const [name, folder] of [['tristan', 'runner'], ['travis', 'travis']]) {
      const art = {};
      for (const part of ['head','torso','shorts','thigh','shin','shoe','upperarm','forearm','forearm_far'])
        art[part] = 'data:image/webp;base64,' + fs.readFileSync(path.join(source, 'scene', folder, part + '.webp')).toString('base64');
      const result = await page.evaluate(async art => {
        const imgs = {};
        await Promise.all(Object.entries(art).map(([part, url]) => new Promise((resolve, reject) => {
          const image = new Image(); image.onload = () => { imgs[part] = image; resolve(); }; image.onerror = reject; image.src = url;
        })));
        const puppet = makePuppet(imgs, PARTS, {imgScale: 0.3});
        const sheet = document.createElement('canvas'); sheet.width = sheet.height = 1024;
        const ctx = sheet.getContext('2d');
        const bounds = [];
        for (let frame = 0; frame < 16; frame++) {
          const cell = document.createElement('canvas'); cell.width = cell.height = 256;
          const c = cell.getContext('2d');
          puppet.draw(c, frame / 16, 112, 244, 0.185, false);
          const pixels = c.getImageData(0,0,256,256).data;
          let left=256, top=256, right=0, bottom=0;
          for(let y=0;y<256;y++) for(let x=0;x<256;x++) if(pixels[(y*256+x)*4+3]>10) {
            left=Math.min(left,x); right=Math.max(right,x); top=Math.min(top,y); bottom=Math.max(bottom,y);
          }
          if(left<2 || top<2 || right>253 || bottom>253) throw new Error('Clipped frame '+frame+': '+[left,top,right,bottom]);
          bounds.push([left,top,right,bottom]);
          ctx.drawImage(cell, frame%4*256, Math.floor(frame/4)*256);
        }
        return {png:sheet.toDataURL('image/png').split(',')[1], bounds};
      }, art);
      fs.writeFileSync(path.join(dest, 'runner-' + name + '.png'), Buffer.from(result.png, 'base64'));
      console.log(name + ': 16 original-rig running frames exported, all silhouettes inside frame.');
    }
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode=1; });
