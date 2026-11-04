/* The three approved pixel dinosaurs take turns above the Samsung shelf and on both screensavers. No network or keys. */
(function () {
  'use strict';

  var FILES = ['dino-raptor.png', 'dino-trex.png', 'dino-longneck.png'];
  var SIZE = 128, FRAME_MS = 125, WALK_MS = 18000, FIRST_MS = 8000, GAP_MS = 90000;
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
    var mine = ++generation, file = FILES[next];
    image = new Image();
    image.onload = function () {
      if (!active || mine !== generation) return;
      // All three sheets are six frames in an exact 3-column, 2-row grid.
      if (!image.naturalWidth || image.naturalWidth / 3 !== image.naturalHeight / 2) {
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
      sprite.style.backgroundPosition = '0px 0px';
      actor.style.display = 'block';
      void actor.offsetWidth;
      actor.style.webkitTransition = '-webkit-transform ' + WALK_MS + 'ms linear';
      actor.style.transition = 'transform ' + WALK_MS + 'ms linear';
      actor.style.webkitTransform = actor.style.transform = 'translateX(1920px)';
      var started = Date.now();
      frames = setInterval(function () {
        if (!active || mine !== generation) return;
        var frame = Math.floor((Date.now() - started) / FRAME_MS) % 6;
        sprite.style.backgroundPosition = (-(frame % 3) * SIZE) + 'px ' + (-Math.floor(frame / 3) * SIZE) + 'px';
      }, FRAME_MS);
      timer = setTimeout(function () {
        if (!active || mine !== generation) return;
        clear();
        next = (next + 1) % FILES.length;
        schedule(GAP_MS);
      }, WALK_MS);
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
