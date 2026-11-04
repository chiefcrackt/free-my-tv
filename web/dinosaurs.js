/* Dinosaurs, original In Motion runners and CC0 animals take turns on Home and both screensavers. No network or keys. */
(function () {
  'use strict';

  var VISITORS = [
    {file: 'dino-raptor-walk-v3.png', columns: 6, rows: 4, count: 24, stridePixels: 35.483870967741936, duration: 36000},
    {file: 'animal-fox.png', columns: 4, rows: 2, count: 8, frameMs: 50, duration: 16000},
    {file: 'runner-tristan.png', columns: 4, rows: 4, count: 16, frameMs: 31.25, duration: 12000, smooth: true},
    {file: 'animal-cat.png', columns: 3, rows: 2, count: 6, frameMs: 100, duration: 16000},
    {file: 'dino-trex-walk-v3.png', columns: 6, rows: 4, count: 24, stridePixels: 35.483870967741936, duration: 36000},
    {file: 'animal-rabbit.png', columns: 3, rows: 2, count: 6, frameMs: 90, duration: 16000},
    {file: 'runner-travis.png', columns: 4, rows: 4, count: 16, frameMs: 31.25, duration: 12000, smooth: true},
    {file: 'animal-cartoon-cat.png', columns: 4, rows: 2, count: 8, frameMs: 70, duration: 16000, smooth: true},
    {file: 'dino-longneck-walk-v3.png', columns: 6, rows: 4, count: 24, stridePixels: 20.51282051282051, duration: 36000},
    {file: 'animal-cartoon-dog.png', columns: 4, rows: 2, count: 8, frameMs: 70, duration: 16000, smooth: true}
  ];
  var SIZE = 128, FIRST_MS = 8000, GAP_MS = 45000;
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
      // Puppet-rendered dinosaurs use 6x4 sheets; the original runner exports use 4x4 sheets.
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
      // Ground travel per stride comes from the planted-foot rig. Step rate follows travel speed, avoiding skating.
      var cycleMs = visitor.stridePixels ? visitor.duration * visitor.stridePixels / (1920 + SIZE)
        : visitor.frameMs * visitor.count;
      var frameMs = cycleMs / visitor.count;
      frames = setInterval(function () {
        if (!active || mine !== generation) return;
        var frame = Math.floor((Date.now() - started) / frameMs) % visitor.count;
        sprite.style.backgroundPosition = (-(frame % visitor.columns) * SIZE) + 'px ' + (-Math.floor(frame / visitor.columns) * SIZE) + 'px';
      }, frameMs);
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
