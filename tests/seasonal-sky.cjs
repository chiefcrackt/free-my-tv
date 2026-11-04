const assert = require('assert/strict');
const fs = require('fs'), vm = require('vm');
const context = {window:{}};
vm.runInNewContext(fs.readFileSync(require('path').join(__dirname,'../web/seasonal-sky.js'),'utf8'),context);
const pick = context.window.SeasonalSky.pick;
const c = f => (f - 32) * 5 / 9;
for(const month of [0,5,10]) {
  assert.equal(pick(c(32.99),month),'snowy');
  assert.equal(pick(c(33),month),'autumn');
  assert.equal(pick(c(45),month),'autumn');
  assert.equal(pick(c(60),month),'autumn');
  assert.equal(pick(c(60.01),month),'sunny');
}
for(const invalid of [null,undefined,NaN,Infinity,-Infinity,'0']) {
  assert.equal(pick(invalid,10),'autumn');
  assert.equal(pick(invalid,0),'neutral');
}
assert.equal(pick(0,10),'snowy','API temperatures are Celsius, not the current display unit');
assert.equal(pick(20,10),'sunny');
for(const code of [51,53,55,56,57,61,63,65,66,67,80,81,82,95,96,99]) {
  assert.equal(pick(c(65),10,code),'rainy','reported rain overrides a warm sunny theme');
  assert.equal(pick(c(40),10,code),'rainy');
  assert.equal(pick(c(32),10,code),'snowy','freezing temperatures keep the snow look');
}
for(const code of [71,73,75,77,85,86])assert.equal(pick(c(35),10,code),'snowy');
for(const code of [0,1,2,3,45,48,null,undefined])assert.equal(pick(c(65),10,code),'sunny','clouds/fog are not rain');
console.log('Seasonal sky: Fahrenheit thresholds, exact boundaries, Celsius input and missing-weather fallback passed.');
