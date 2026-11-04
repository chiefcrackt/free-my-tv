/* Dinosaurs and the original In Motion runners take turns on Home and both screensavers. No network or keys. */
(function () {
  'use strict';

  var VISITORS = [
    {file: 'dino-raptor.png', columns: 3, rows: 2, count: 6, frameMs: 125, duration: 18000},
    {file: 'dino-trex.png', columns: 3, rows: 2, count: 6, frameMs: 125, duration: 18000},
    {file: 'dino-longneck.png', columns: 3, rows: 2, count: 6, frameMs: 125, duration: 18000},
    {file: 'runner-tristan.png', columns: 4, rows: 4, count: 16, frameMs: 31.25, duration: 12000, smooth: true},
    {file: 'runner-travis.png', columns: 4, rows: 4, count: 16, frameMs: 31.25, duration: 12000, smooth: true}
  ];
  var SIZE = 128, FIRST_MS = 8000, GAP_MS = 90000;
  var active = null, generation = 0, next = 0, timer = 0, frames = 0, actor = null, sprite = null, image = null;

  function clear() {
    clearTimeout(timer);
    clearInterval(frames);
    timer = frames = 0;
    if (actor) actor.style.display = 'none';
    image = null;
  }

  function schedule(delay) {
    if (active) timer = setTimeout(walk, delay);
  }

  function walk() {
    if (!active) return;
    var mine = ++generation, visitor = VISITORS[next], file = visitor.file;
    image = new Image();
    image.onload = function () {
      if (!active || mine !== generation) return;
      // The dinosaurs use 3x2 sheets; original-rig runner exports use 4x4 sheets.
      if (!image.naturalWidth || image.naturalWidth / visitor.columns !== image.naturalHeight / visitor.rows) {
        clear();
        schedule(GAP_MS);
        return;
      }
      if (!actor) {
        actor = document.createElement('div');
        actor.id = 'dinowalk';
        actor.setAttribute('aria-hidden', 'true');
        sprite = document.createElement('div');
        sprite.className = 'dino-sprite';
        actor.appendChild(sprite);
      }
      var container = document.getElementById(active === 'home' ? 'home' : active);
      if (actor.parentNode !== container) container.appendChild(actor);
      // The entire frame box stays above the shelf, including while an app tile grows with focus.
      actor.style.top = (active === 'home' ? document.getElementById('platter').offsetTop - SIZE - 2 : 1080 - SIZE - 80) + 'px';
      actor.style.webkitTransition = actor.style.transition = 'none';
      actor.style.webkitTransform = actor.style.transform = 'translateX(-' + SIZE + 'px)';
      sprite.style.backgroundImage = 'url(' + file + ')';
      sprite.style.backgroundSize = (visitor.columns * SIZE) + 'px ' + (visitor.rows * SIZE) + 'px';
      sprite.style.imageRendering = visitor.smooth ? 'auto' : 'pixelated';
      sprite.style.backgroundPosition = '0px 0px';
      actor.style.display = 'block';
      void actor.offsetWidth;
      actor.style.webkitTransition = '-webkit-transform ' + visitor.duration + 'ms linear';
      actor.style.transition = 'transform ' + visitor.duration + 'ms linear';
      actor.style.webkitTransform = actor.style.transform = 'translateX(1920px)';
      var started = Date.now();
      frames = setInterval(function () {
        if (!active || mine !== generation) return;
        var frame = Math.floor((Date.now() - started) / visitor.frameMs) % visitor.count;
        sprite.style.backgroundPosition = (-(frame % visitor.columns) * SIZE) + 'px ' + (-Math.floor(frame / visitor.columns) * SIZE) + 'px';
      }, visitor.frameMs);
      timer = setTimeout(function () {
        if (!active || mine !== generation) return;
        clear();
        next = (next + 1) % VISITORS.length;
        schedule(GAP_MS);
      }, visitor.duration);
    };
    image.onerror = function () {
      if (!active || mine !== generation) return;
      clear();
      schedule(GAP_MS);
    };
    image.src = file;
  }

  window.DinoWalk = {
    setMode: function (mode) {
      mode = mode === 'home' || mode === 'ambient' || mode === 'saver' ? mode : null;
      if (mode === active) return;
      active = mode;
      generation++;
      clear();
      if (active) schedule(FIRST_MS);
    }
  };
})();
