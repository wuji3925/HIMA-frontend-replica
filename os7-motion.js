// Web spring model: preserves position and velocity when a gesture interrupts it.
// Demo tuning, not a claim of native ArkUI animation equivalence.
class HimaSpring {
  constructor(value, render, reduced = () => false) {
    this.value = value;
    this.velocity = 0;
    this.target = value;
    this.render = render;
    this.reduced = reduced;
    this.frame = 0;
  }
  stop() { cancelAnimationFrame(this.frame); this.frame = 0; this.complete = null; }
  jump(value) { this.stop(); this.value = this.target = value; this.velocity = 0; this.render(value); }
  to(target, { velocity, complete, stiffness = 520, damping = 42 } = {}) {
    this.stop();
    this.target = target;
    if (velocity !== undefined) this.velocity = velocity;
    this.complete = complete;
    if (this.reduced()) { this.jump(target); complete?.(); return; }
    let previous = performance.now();
    const tick = now => {
      let elapsed = Math.min(.032, (now - previous) / 1000);
      previous = now;
      while (elapsed > 0) {
        const dt = Math.min(.008, elapsed);
        this.velocity += (-stiffness * (this.value - target) - damping * this.velocity) * dt;
        this.value += this.velocity * dt;
        elapsed -= dt;
      }
      if (Math.abs(this.value - target) < .3 && Math.abs(this.velocity) < 3) {
        const done = this.complete;
        this.jump(target); done?.(); return;
      }
      this.render(this.value);
      this.frame = requestAnimationFrame(tick);
    };
    this.frame = requestAnimationFrame(tick);
  }
  finish() { const done = this.complete; this.jump(this.target); done?.(); }
}
