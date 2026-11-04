// Exercises the real weather response -> Data -> Home -> CSS path, including temperature-unit changes.
const {chromium}=require(process.env.DINOSAUR_PLAYWRIGHT_MODULE || 'playwright-core');
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict');
(async()=>{
 const root=path.resolve(__dirname,'../out/tizen');
 const server=http.createServer((req,res)=>{
  const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  fs.readFile(file,(e,data)=>{if(e){res.writeHead(404).end();return;}
   res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml'})[path.extname(file)]||'application/octet-stream');res.end(data);});
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const origin='http://127.0.0.1:'+server.address().port;
 let browser,tempF=32,requests=0;
 try{
  browser=await chromium.launch({executablePath:process.env.DINOSAUR_CHROME||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
  const page=await browser.newPage({viewport:{width:1920,height:1080}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',route=>{
   const url=route.request().url();
   if(url.startsWith(origin))return route.continue();
   if(url.includes('api.open-meteo.com/v1/forecast')) {
    requests++;
    return route.fulfill({contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*'},body:JSON.stringify({
     utc_offset_seconds:0,current:{temperature_2m:(tempF-32)*5/9,weather_code:1,is_day:1},
     daily:{temperature_2m_max:[20],temperature_2m_min:[-5],sunrise:['2026-11-04T06:00'],sunset:['2026-11-04T18:00'],time:['2026-11-04'],weather_code:[1]},
     hourly:{time:[],temperature_2m:[],weather_code:[],is_day:[]}
    })});
   }
   return route.abort();
  });
  await page.addInitScript(()=>{
   localStorage.clear();
   window.Audio=function(){this.paused=true;this.src='';};
   Audio.prototype.play=function(){this.paused=false;};Audio.prototype.pause=function(){this.paused=true;};Audio.prototype.load=function(){};
   Audio.prototype.getAttribute=function(n){return this[n];};Audio.prototype.removeAttribute=function(n){this[n]='';};
  });
  await page.goto(origin+'/index.html');
  await page.waitForFunction(()=>Data.weather&&Data.weather.temp===0);
  await page.evaluate(()=>{Prefs.set('theme','light');Data.settingsChanged();});
  assert.equal(await page.locator('body').getAttribute('data-backdrop'),'snowy');
  assert.equal(await page.locator('.snowflakes').isVisible(),true);
  assert.equal(await page.locator('.snowflake').count(),24);
  assert.equal(await page.locator('.leaves').isVisible(),false);
  if(process.env.SKY_SCREENSHOT_DIR)await page.screenshot({path:path.join(process.env.SKY_SCREENSHOT_DIR,'snow-background-preview.png')});
  async function temperature(f,mode){
   tempF=f;await page.evaluate(()=>Data.cityChanged());
   await page.waitForFunction(c=>Data.weather&&Math.abs(Data.weather.temp-c)<1e-8,(f-32)*5/9);
   assert.equal(await page.locator('body').getAttribute('data-backdrop'),mode);
   const classes=await page.locator('body').getAttribute('class');
   assert.equal(classes.split(/\s+/).filter(c=>['snowy','sunny','autumn'].includes(c)).length,1);
  }
  await temperature(33,'autumn');
  assert.equal(await page.locator('.leaves').isVisible(),true);
  assert.equal(await page.locator('.snowflakes').isVisible(),false);
  await temperature(60,'autumn');
  await temperature(61,'sunny');
  assert.equal(await page.locator('.sunshine').isVisible(),true);
  assert.equal(await page.locator('.leaves').isVisible(),false);
  if(process.env.SKY_SCREENSHOT_DIR)await page.screenshot({path:path.join(process.env.SKY_SCREENSHOT_DIR,'sunny-background-preview.png')});
  await page.evaluate(()=>{Prefs.set('temperature','C');Data.settingsChanged();});
  assert.equal(await page.locator('body').getAttribute('data-backdrop'),'sunny');
  await page.evaluate(()=>{Prefs.set('theme','dark');Data.settingsChanged();});
  assert.equal(await page.locator('.sunshine').isVisible(),false,'sun does not glare over the night theme');
  assert.equal(await page.locator('body').getAttribute('data-backdrop'),'sunny');
  await temperature(31,'snowy');
  assert.equal(await page.locator('.snowflakes').isVisible(),true);
  assert(await page.locator('body').evaluate(b=>b.classList.contains('night')));
  assert.equal(requests,5,'only the existing forecast path is used');
  assert.deepEqual(errors,[]);
  console.log('Seasonal sky browser: live temperature transitions, threshold boundaries, exclusive layers, Celsius display and night behavior passed.');
 }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1;});
