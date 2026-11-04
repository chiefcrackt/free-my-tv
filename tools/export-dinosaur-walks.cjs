// Regenerate the 24-frame walk sheets from image-generated puppet parts.
const fs = require('fs'), path = require('path');
const {chromium} = require(process.env.DINOSAUR_PLAYWRIGHT_MODULE || 'playwright-core');
const gait = require('./dinosaur-gait.cjs');
const root = path.resolve(__dirname, '..');
const specs = [
  {name:'raptor', x:16, y:70, width:224, hip:[0.55,0.87], stride:44, duty:0.62, lift:14, upper:26, lower:22, widths:[34,23], foot:[38,19]},
  {name:'trex', x:18, y:80, width:220, hip:[0.49,0.86], stride:44, duty:0.62, lift:14, upper:27, lower:23, widths:[38,26], foot:[41,22]},
  {name:'longneck', x:16, y:64, width:224, hips:[[0.47,0.89],[0.72,0.87]], stride:32, duty:0.78, lift:9, upper:20, lower:18, widths:[27,24], foot:[30,17]}
];
(async () => {
  const browser = await chromium.launch({executablePath:process.env.DINOSAUR_CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
  try {
    const page = await browser.newPage();
    await page.evaluate('window.foot = ' + gait.foot.toString() + '; window.knee = ' + gait.knee.toString());
    const manifests = [];
    for (const spec of specs) {
      const url = 'data:image/png;base64,' + fs.readFileSync(path.join(root,'artwork/dinosaurs',spec.name+'-parts.png')).toString('base64');
      const result = await page.evaluate(async ({spec,url}) => {
        const image = await new Promise((resolve,reject) => {const i=new Image();i.onload=()=>resolve(i);i.onerror=reject;i.src=url;});
        const parts = [];
        for(let n=0;n<4;n++) {
          const c=document.createElement('canvas');c.width=768;c.height=512;const x=c.getContext('2d');
          x.drawImage(image,n%2*768,Math.floor(n/2)*512,768,512,0,0,768,512);
          const a=x.getImageData(0,0,768,512).data;let l=768,t=512,r=0,b=0;
          for(let y=0;y<512;y++)for(let xx=0;xx<768;xx++)if(a[(y*768+xx)*4+3]>80){l=Math.min(l,xx);r=Math.max(r,xx);t=Math.min(t,y);b=Math.max(b,y);}
          parts.push({canvas:c,box:[l,t,r-l+1,b-t+1]});
        }
        const bodyHeight=spec.width*parts[0].box[3]/parts[0].box[2];
        const quad=!!spec.hips, count=24, size=256;
        const sheet=document.createElement('canvas');sheet.width=1536;sheet.height=1024;
        const out=sheet.getContext('2d');
        const poses=[];
        function drawPart(c,n,x,y,w,h,dark) {
          const p=parts[n];c.drawImage(p.canvas,...p.box,x,y,w,h);
          if(dark) {c.save();c.globalCompositeOperation='source-atop';c.fillStyle='rgba(8,12,30,0.25)';c.fillRect(x,y,w,h);c.restore();}
        }
        function bone(c,n,a,b,width,dark) {
          c.save();c.translate(a.x,a.y);c.rotate(Math.atan2(b.y-a.y,b.x-a.x)-Math.PI/2);
          drawPart(c,n,-width/2,-width*0.2,width,Math.hypot(b.x-a.x,b.y-a.y)+width*0.4,dark);c.restore();
        }
        function draw(p) {
          const cell=document.createElement('canvas');cell.width=cell.height=size;const c=cell.getContext('2d');c.imageSmoothingEnabled=false;
          const bob=0.65*Math.cos(p*Math.PI*4), legs=[];
          const hips=quad?spec.hips:[spec.hip,spec.hip];
          const offsets=quad?[0,0.75,0.5,0.25]:[0,0.5];
          for(let n=0;n<offsets.length;n++) {
            const far=quad?n>=2:n===1, base=hips[quad?n%2:n];
            const hip={x:spec.x+spec.width*base[0]+(far?5:0),y:spec.y+bodyHeight*base[1]+bob-(far?3:0)};
            const f=foot(p+offsets[n],spec.stride,spec.duty,spec.lift);
            const ankle={x:hip.x+f.x,y:246-spec.foot[1]*0.75+f.y-(far?2:0)};
            const joint=knee(hip,ankle,spec.upper,spec.lower,quad&&n%2===1?-1:1);
            legs.push({hip,ankle,joint,far,planted:f.planted});
          }
          function leg(q) {
            const layer=document.createElement('canvas');layer.width=layer.height=size;const l=layer.getContext('2d');l.imageSmoothingEnabled=false;
            bone(l,1,q.hip,q.joint,spec.widths[0],false);bone(l,2,q.joint,q.ankle,spec.widths[1],false);
            drawPart(l,3,q.ankle.x-spec.foot[0]*0.23,q.ankle.y-spec.foot[1]*0.25,spec.foot[0],spec.foot[1],false);
            if(q.far){l.globalCompositeOperation='source-atop';l.fillStyle='rgba(8,12,30,0.24)';l.fillRect(0,0,size,size);}
            c.drawImage(layer,0,0);
          }
          legs.filter(q=>q.far).forEach(leg);
          drawPart(c,0,spec.x,spec.y+bob,spec.width,bodyHeight,false);
          legs.filter(q=>!q.far).forEach(leg);
          return {cell,legs};
        }
        for(let i=0;i<count;i++) {
          const pose=draw(i/count);out.drawImage(pose.cell,i%6*size,Math.floor(i/6)*size);
          const a=pose.cell.getContext('2d').getImageData(0,0,size,size).data;
          for(let y=0;y<size;y++)for(let x=0;x<size;x++)if(a[(y*size+x)*4+3]>120&&(x<2||x>253||y<2||y>253))throw new Error(spec.name+' clipped frame '+i);
          poses.push(pose.legs.map(q=>({planted:q.planted,hip:q.hip,ankle:q.ankle})));
        }
        return {png:sheet.toDataURL('image/png').split(',')[1],poses,bodyHeight};
      }, {spec,url});
      const file='dino-'+spec.name+'-walk-v3.png';
      fs.writeFileSync(path.join(root,'web',file),Buffer.from(result.png,'base64'));
      const stridePixels=spec.stride/spec.duty*0.5;
      manifests.push({file,columns:6,rows:4,count:24,duration:36000,stridePixels,
        silhouette:{width:spec.width,height:246-spec.y},poses:result.poses});
      console.log(spec.name+': 24 grounded frames, world stride '+stridePixels.toFixed(3)+'px; body height '+result.bodyHeight.toFixed(1));
    }
    fs.writeFileSync(path.join(root,'artwork/dinosaurs/walk-manifest.json'),JSON.stringify(manifests,null,2)+'\n');
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
