/* Shared authoring math, not shipped in the TV app. A supporting foot moves backwards at ground speed. */
function foot(phase, stride, duty, lift) {
  const u = ((phase % 1) + 1) % 1;
  if (u < duty) return {x: stride / 2 - stride * u / duty, y: 0, planted: true};
  const t = (u - duty) / (1 - duty), ease = t * t * (3 - 2 * t);
  return {x: -stride / 2 + stride * ease, y: -lift * Math.sin(Math.PI * t), planted: false};
}
function knee(hip, ankle, upper, lower, bend) {
  const dx = ankle.x - hip.x, dy = ankle.y - hip.y, d = Math.hypot(dx, dy);
  if (d >= upper + lower || d <= Math.abs(upper - lower)) throw new Error('Unreachable leg target');
  const along = (upper * upper - lower * lower + d * d) / (2 * d);
  const side = Math.sqrt(Math.max(0, upper * upper - along * along)) * bend;
  return {x: hip.x + dx / d * along + dy / d * side, y: hip.y + dy / d * along - dx / d * side};
}
module.exports = {foot, knee};
