const {readFileSync} = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
let time = 0, id = 0;
const frames = new Map();
const context = vm.createContext({
  performance: {now: () => time},
  requestAnimationFrame: cb => {frames.set(++id, cb); return id;},
  cancelAnimationFrame: key => frames.delete(key),
});
vm.runInContext(readFileSync(require.resolve('../os7-motion.js'), 'utf8'), context);
const Spring = vm.runInContext('HimaSpring', context);
function tick(dt = 16) {
  time += dt; const pending = [...frames.values()]; frames.clear();
  pending.forEach(cb => cb(time));
}
function settle() {
  for (let i = 0; frames.size && i < 200; i++) tick();
  assert.equal(frames.size, 0, 'spring should settle');
}
let rendered, completed = 0;
const spring = new Spring(0, value => rendered = value);
spring.to(-392, {complete: () => completed++}); tick();
assert.ok(rendered < 0 && rendered > -392);
const before = spring.value, velocity = spring.velocity;
spring.to(-784);
assert.equal(spring.value, before, 'retarget must preserve position');
assert.equal(spring.velocity, velocity, 'retarget must preserve velocity');
settle(); assert.equal(rendered, -784); assert.equal(completed, 0, 'interrupted callback must not fire');
spring.to(0, {velocity: 900, complete: () => completed++}); settle();
assert.equal(rendered, 0); assert.equal(completed, 1);
spring.to(400); tick(); spring.jump(80); tick();
assert.equal(rendered, 80); assert.equal(spring.velocity, 0);
spring.to(300, {complete: () => completed++}); spring.finish();
assert.equal(rendered, 300); assert.equal(completed, 2);
const reduced = new Spring(0, value => rendered = value, () => true);
reduced.to(500, {complete: () => completed++});
assert.equal(rendered, 500); assert.equal(completed, 3); assert.equal(frames.size, 0);
spring.to(-392); tick(5000); assert.ok(Number.isFinite(spring.value)); settle();
assert.equal(spring.value, -392);
console.log('PASS: settle, interruption, inherited velocity, cancellation, finish, reduced motion, delayed frame');
