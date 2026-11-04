// Packs the original CC0 animation frames into the TV player's square-cell atlases without redrawing them.
const fs=require('fs'),path=require('path'),http=require('http');
const {chromium}=require(process.env.DINOSAUR_PLAYWRIGHT_MODULE||'playwright-core');
const root=path.resolve(__dirname,'..'),source=path.join(root,'artwork/stock-animals');
const specs=[
 {name:'fox',file:'fox/run.png',count:8,columns:4,sourceWidth:19,sourceHeight:16,scale:6},
 {name:'cat',file:'cat/run.gif',count:6,columns:3,gif:true,scale:3,flip:true},
 {name:'rabbit',file:'rabbit/run.png',count:6,columns:3,sourceWidth:32,sourceHeight:26,scale:4,flip:true},
 {name:'cartoon-cat',files:Array.from({length:8},(_,i)=>'cartoon-cat/Run ('+(i+1)+').png'),count:8,columns:4,height:166,smooth:true},
 {name:'cartoon-dog',files:Array.from({length:8},(_,i)=>'cartoon-dog/Run ('+(i+1)+').png'),count:8,columns:4,height:166,smooth:true}
];
(async()=>{
 const server=http.createServer((req,res)=>{res.setHeader('Content-Type','text/html');res.end('<!doctype html><title>Sprite export</title>');});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 let browser;
 try{
  browser=await chromium.launch({executablePath:process.env.DINOSAUR_CHROME||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
  const page=await browser.newPage();
  await page.goto('http://127.0.0.1:'+server.address().port);
  for(const spec of specs){
   const inputs=(spec.files||[spec.file]).map(f=>({data:fs.readFileSync(path.join(source,f)).toString('base64'),type:f.endsWith('.gif')?'image/gif':'image/png'}));
   const result=await page.evaluate(async({spec,inputs})=>{
    const frames=[];
    if(spec.gif){
     const bytes=Uint8Array.from(atob(inputs[0].data),c=>c.charCodeAt(0));
     const decoder=new ImageDecoder({data:bytes,type:'image/gif'});await decoder.tracks.ready;
     if(decoder.tracks.selectedTrack.frameCount!==spec.count)throw new Error('Wrong GIF frame count');
     for(let i=0;i<spec.count;i++){const {image}=await decoder.decode({frameIndex:i});
      const c=document.createElement('canvas');c.width=image.displayWidth;c.height=image.displayHeight;const x=c.getContext('2d');x.drawImage(image,0,0);
      // The original GIF's purple matte is a palette background, not part of the cat. Apply a lossless color key.
      const data=x.getImageData(0,0,c.width,c.height),rgba=data.data,bg=rgba.slice(0,3);
      for(let p=0;p<rgba.length;p+=4)if(rgba[p]===bg[0]&&rgba[p+1]===bg[1]&&rgba[p+2]===bg[2])rgba[p+3]=0;
      x.putImageData(data,0,0);frames.push(c);image.close();}
     decoder.close();
    }else{
     const images=await Promise.all(inputs.map(input=>new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=reject;i.src='data:'+input.type+';base64,'+input.data;})));
     if(spec.files)frames.push(...images);
     else for(let i=0;i<spec.count;i++){
      const c=document.createElement('canvas');c.width=spec.sourceWidth;c.height=spec.sourceHeight;
      c.getContext('2d').drawImage(images[0],i*spec.sourceWidth,0,spec.sourceWidth,spec.sourceHeight,0,0,spec.sourceWidth,spec.sourceHeight);frames.push(c);
     }
    }
    const width=Math.max(...frames.map(f=>f.naturalWidth||f.width)),height=Math.max(...frames.map(f=>f.naturalHeight||f.height));
    const scale=spec.scale||spec.height/height;
    const out=document.createElement('canvas');out.width=spec.columns*256;out.height=Math.ceil(spec.count/spec.columns)*256;
    const ctx=out.getContext('2d');ctx.imageSmoothingEnabled=!!spec.smooth;
    for(let i=0;i<frames.length;i++){
     const x=i%spec.columns*256,y=Math.floor(i/spec.columns)*256;
     ctx.save();ctx.translate(x+(256-width*scale)/2,y+246-height*scale);
     if(spec.flip){ctx.translate(width*scale,0);ctx.scale(-1,1);}
     ctx.drawImage(frames[i],0,0,(frames[i].naturalWidth||frames[i].width)*scale,(frames[i].naturalHeight||frames[i].height)*scale);ctx.restore();
    }
    const pixels=ctx.getImageData(0,0,out.width,out.height).data;
    if(pixels[3]!==0)throw new Error(spec.name+' has an opaque background');
    return {png:out.toDataURL('image/png').split(',')[1],width:out.width,height:out.height};
   },{spec,inputs});
   fs.writeFileSync(path.join(root,'web','animal-'+spec.name+'.png'),Buffer.from(result.png,'base64'));
   console.log(spec.name+': '+spec.count+' original animation frames, '+result.width+'x'+result.height+', transparent background.');
  }
 }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1;});
