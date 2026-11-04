const assert = require('assert/strict');
const {foot, knee} = require('../tools/dinosaur-gait.cjs');
const manifest = require('../artwork/dinosaurs/walk-manifest.json');
for (const [stride,duty,offsets] of [[70,0.62,[0,0.5]],[54,0.78,[0,0.75,0.5,0.25]]]) {
  const planted=[];
  for(let i=0;i<1000;i++) {
    const p=i/1000, feet=offsets.map(offset=>foot(p+offset,stride,duty,25));
    assert(feet.filter(f=>f.planted).length >= (offsets.length===2?1:3), 'walking must keep supporting feet on the floor');
    const f=foot(p,stride,duty,25);
    if(f.planted) {
      assert.equal(f.y,0,'planted feet never hop');
      planted.push(f.x + p*stride/duty); // body travel + local foot position = fixed world position
    } else if(p>duty+1e-8) assert(f.y<0,'swing foot clears the floor after lift-off');
    const q=knee({x:0,y:0},{x:f.x,y:65+f.y},50,45,1);
    assert(Math.abs(Math.hypot(q.x,q.y)-50)<1e-8,'upper bone length stays fixed');
    assert(Math.abs(Math.hypot(q.x-f.x,q.y-(65+f.y))-45)<1e-8,'lower bone length stays fixed');
  }
  assert(Math.max(...planted)-Math.min(...planted)<1e-8,'supporting foot must not slide in world space');
}
for(const dino of manifest) {
  assert.equal(dino.poses.length,24);
  dino.poses.forEach(legs=>{
    assert.equal(legs.length,dino.file.includes('longneck')?4:2);
    legs.forEach(leg=>{if(leg.planted)assert(leg.ankle.y>=225&&leg.ankle.y<=235,'exported support feet share a grounded baseline');});
  });
}
console.log('Dinosaur gait: fixed bone lengths, grounded support, swing clearance, zero stance-foot sliding and exported leg counts passed.');
