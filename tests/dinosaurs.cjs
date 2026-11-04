// Run after tizen/build.py --preview. Needs playwright-core and a local Chrome browser.
const { chromium } = require(process.env.DINOSAUR_PLAYWRIGHT_MODULE || 'playwright-core');
const http = require('http');
const fs = require('fs');
const path = require('path');
const assert = require('assert/strict');

(async () => {
  const root = path.resolve(__dirname, '../out/tizen');
  const server = http.createServer((request, response) => {
    const file = path.resolve(root, '.' + new URL(request.url, 'http://localhost').pathname);
    if (!file.startsWith(root + path.sep)) { response.writeHead(403).end(); return; }
    fs.readFile(file, (error, data) => {
      if (error) { response.writeHead(404).end(); return; }
      const types = {'.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml'};
      response.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
      response.end(data);
    });
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = 'http://127.0.0.1:' + server.address().port;
  let browser;
  try {
    browser = await chromium.launch({executablePath: process.env.DINOSAUR_CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true});
    const page = await browser.newPage({viewport: {width: 1920, height: 1080}});
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/*', route => route.request().url().startsWith(origin) ? route.continue() : route.abort());
    await page.clock.install({time: new Date('2026-11-04T17:00:00Z')});
    await page.addInitScript(() => {
      localStorage.clear();
      window.Audio = function () { this.paused = true; this.src = ''; this.volume = 0; };
      Audio.prototype.play = function () { this.paused = false; if (this.onplaying) this.onplaying(); };
      Audio.prototype.pause = function () { this.paused = true; if (this.onpause) this.onpause(); };
      Audio.prototype.load = function () {};
      Audio.prototype.getAttribute = function (name) { return this[name]; };
      Audio.prototype.removeAttribute = function (name) { this[name] = ''; };
    });
    await page.goto(origin + '/index.html');
    await page.waitForSelector('#tiles .tile');
    const actor = page.locator('#dinowalk');
    const sprite = page.locator('.dino-sprite');
    const image = () => sprite.evaluate(node => node.style.backgroundImage);
    await page.clock.runFor(8100);
    await actor.waitFor({state: 'visible'});
    assert.match(await image(), /dino-raptor/);
    assert.equal(await actor.count(), 1);
    assert.equal(await actor.getAttribute('aria-hidden'), 'true');
    assert.equal(await actor.evaluate(node => getComputedStyle(node).pointerEvents), 'none');
    const shelf = await page.locator('#platter').boundingBox();
    const bounds = await actor.boundingBox();
    assert(bounds.y + bounds.height <= shelf.y, 'sprite box must remain above the app shelf');
    const weather = await page.locator('#nowwx').boundingBox();
    if (weather && weather.height) assert(bounds.y >= weather.y + weather.height, 'sprite must stay below weather');
    const firstFrame = await sprite.evaluate(node => node.style.backgroundPosition);
    await page.clock.runFor(125);
    assert.notEqual(await sprite.evaluate(node => node.style.backgroundPosition), firstFrame, 'walk frames advance');

    // CSS travel is independent of the fake timer. Freeze a middle position for visual review.
    if (process.env.DINOSAUR_SCREENSHOT) {
      await actor.evaluate(node => { node.style.transition = 'none'; node.style.transform = 'translateX(1080px)'; });
      await page.screenshot({path: process.env.DINOSAUR_SCREENSHOT});
    }
    await page.clock.runFor(36000);
    assert.equal(await actor.isVisible(), false, 'there is a gap between dinosaurs');
    await page.clock.runFor(90000);
    await actor.waitFor({state: 'visible'});
    assert.match(await image(), /dino-trex/);
    await page.keyboard.press('ArrowRight'); // real remote activity also keeps the screensaver from timing out
    await page.clock.runFor(126000);
    await actor.waitFor({state: 'visible'});
    assert.match(await image(), /dino-longneck/);

    await page.keyboard.press('ArrowDown');
    assert.equal(await actor.isVisible(), false, 'drawer hides the dinosaur immediately');
    await page.clock.runFor(9000);
    assert.equal(await actor.isVisible(), false);
    await page.keyboard.press('ArrowUp');
    await page.clock.runFor(8100);
    await actor.waitFor({state: 'visible'});

    // Both screensaver types own the actor, above their background and below the clock/weather content.
    await page.evaluate(() => FreeMyTV.showAmbient());
    assert.equal(await actor.isVisible(), false);
    await page.clock.runFor(8100);
    await actor.waitFor({state: 'visible'});
    assert.equal(await actor.evaluate(node => node.parentNode.id), 'ambient');
    assert((await actor.boundingBox()).y >= 850);
    await page.evaluate(() => FreeMyTV.hideAmbient());
    await page.evaluate(() => FreeMyTV.showSaver());
    await page.clock.runFor(8100);
    await actor.waitFor({state: 'visible'});
    assert.equal(await actor.evaluate(node => node.parentNode.id), 'saver');
    await page.clock.runFor(126000);
    await actor.waitFor({state: 'visible'});
    assert.match(await image(), /runner-tristan/, 'Tristan follows the three dinosaurs');
    assert.equal(await sprite.evaluate(node => node.style.backgroundSize), '512px 512px');
    assert.equal(await sprite.evaluate(node => node.style.imageRendering), 'auto');
    const runnerFrame = await sprite.evaluate(node => node.style.backgroundPosition);
    await page.clock.runFor(126);
    assert.notEqual(await sprite.evaluate(node => node.style.backgroundPosition), runnerFrame, '16-frame running cycle advances');
    await page.clock.runFor(102000);
    await actor.waitFor({state: 'visible'});
    assert.match(await image(), /runner-travis/, 'Travis follows Tristan');
    assert.equal(await actor.count(), 1);
    await page.clock.runFor(102000);
    await actor.waitFor({state: 'visible'});
    assert.match(await image(), /dino-raptor/, 'rotation continues and wraps on the screensaver');
    await page.keyboard.press('ArrowRight'); // a real wake also resets the idle timer after the longer five-visitor cycle

    // A background app has no walking timers, and returns to the normal Home lane when opened again.
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', {configurable: true, value: true});
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await page.clock.runFor(10000);
    assert.equal(await actor.isVisible(), false);
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', {configurable: true, value: false});
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await page.clock.runFor(8100);
    await actor.waitFor({state: 'visible'});
    assert.equal(await actor.evaluate(node => node.parentNode.id), 'home');
    assert.equal(await actor.count(), 1);
    assert.deepEqual(errors, []);
    console.log('Visitors: dinosaur and runner frame advance, five-character rotation/wrap, shelf/weather clearance, drawer suppression, both screensavers, and visibility lifecycle passed.');
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
