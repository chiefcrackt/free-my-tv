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
console.log('Seasonal sky: Fahrenheit thresholds, exact boundaries, Celsius input and missing-weather fallback passed.');
