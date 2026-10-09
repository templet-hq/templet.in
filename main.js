(function () {
  'use strict';

  var ALLOWANCE = 40;   // mm, frame allowance per side
  var BAR = 6000;       // mm, stock bar length
  var SCALE = 0.15;     // drawing units per mm
  var AX = 66, AY = 24, AW = 360, AH = 315; // drawing area on the sheet

  // Pure: same inputs, same outputs.
  function solve(w, h, n) {
    var mullions = n - 1;
    var pieces = [w, w, h, h];
    for (var i = 0; i < mullions; i++) pieces.push(h);

    // First-fit, longest piece first.
    pieces.sort(function (a, b) { return b - a; });
    var bars = [];
    pieces.forEach(function (p) {
      for (var j = 0; j < bars.length; j++) {
        if (bars[j] >= p) { bars[j] -= p; return; }
      }
      bars.push(BAR - p);
    });

    return {
      perimeter: 2 * (w + h) / 1000,
      mullion: mullions * h / 1000,
      glass: (w - 2 * ALLOWANCE) * (h - 2 * ALLOWANCE) / 1e6,
      shutters: n,
      bars: bars.length
    };
  }

  var form = document.getElementById('controls');
  if (!form) return;

  var $ = function (id) { return document.getElementById(id); };
  var inW = $('w'), inH = $('h');
  var mull = [$('m1'), $('m2')];
  var pending = false;

  function set(el, attrs) {
    for (var k in attrs) el.setAttribute(k, attrs[k]);
  }

  function render() {
    pending = false;
    var w = +inW.value, h = +inH.value;
    var n = +form.elements.n.value;
    var q = solve(w, h, n);

    var dw = w * SCALE, dh = h * SCALE, t = ALLOWANCE * SCALE;
    var x0 = AX + (AW - dw) / 2, y0 = AY + (AH - dh) / 2;
    var x1 = x0 + dw, y1 = y0 + dh;

    set($('f-out'), { x: x0, y: y0, width: dw, height: dh });
    set($('f-in'), { x: x0 + t, y: y0 + t, width: dw - 2 * t, height: dh - 2 * t });
    mull.forEach(function (m, i) {
      var on = i < n - 1;
      m.toggleAttribute('hidden', !on);
      if (on) set(m, { x: x0 + dw * (i + 1) / n - t / 2, y: y0 + t, height: dh - 2 * t });
    });

    var yd = y1 + 26, xd = x0 - 26, xm = x0 + dw / 2, ym = y0 + dh / 2;
    set($('ext'), {
      d: 'M' + x0 + ' ' + (y1 + 4) + 'V' + (yd + 4) + 'M' + x1 + ' ' + (y1 + 4) + 'V' + (yd + 4) +
         'M' + (x0 - 4) + ' ' + y0 + 'H' + (xd - 4) + 'M' + (x0 - 4) + ' ' + y1 + 'H' + (xd - 4)
    });
    set($('dim-w'), { x1: x0, x2: x1, y1: yd, y2: yd });
    set($('dim-h'), { x1: xd, x2: xd, y1: y0, y2: y1 });
    set($('txt-w'), { x: xm, y: yd + 18 });
    set($('txt-h'), { x: xd - 10, y: ym, transform: 'rotate(-90 ' + (xd - 10) + ' ' + ym + ')' });
    $('txt-w').textContent = w;
    $('txt-h').textContent = h;
    $('tb-size').textContent = w + ' x ' + h;
    $('elev-desc').textContent = 'Elevation of a window frame ' + w + ' mm wide and ' + h +
      ' mm high with ' + n + ' shutters.';

    $('w-out').textContent = w + ' mm';
    $('h-out').textContent = h + ' mm';
    inW.setAttribute('aria-valuetext', w + ' mm');
    inH.setAttribute('aria-valuetext', h + ' mm');

    $('q-per').textContent = q.perimeter.toFixed(2);
    $('q-mul').textContent = q.mullion.toFixed(2);
    $('q-gls').textContent = q.glass.toFixed(2);
    $('q-sht').textContent = q.shutters;
    $('q-bar').textContent = q.bars;
  }

  function schedule() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(render);
  }

  form.addEventListener('input', schedule);
  form.addEventListener('change', schedule);
  form.addEventListener('submit', function (e) { e.preventDefault(); });
  render();
})();
