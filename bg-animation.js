(function () {
  var existing = document.getElementById('fwtxrp-bg-canvas');
  if (existing) existing.remove();

  var existingGlow = document.getElementById('fwtxrp-bg-glow');
  if (existingGlow) existingGlow.remove();

  var canvas = document.createElement('canvas');
  canvas.id = 'fwtxrp-bg-canvas';
  document.body.appendChild(canvas);

  var glow = document.createElement('div');
  glow.id = 'fwtxrp-bg-glow';
  document.body.appendChild(glow);

  var ctx = canvas.getContext('2d');
  var w, h, groundY, buildings, smoke, skidmarks, flashTimer, flashOn, stars;
  var left = 0, colWidth = window.innerWidth;

  var AGENCIES = [
    { name: 'police', body: '#101318', panel: '#f2f2f0', stripe: '#1447c9', trim: '#c9c9c9', star: false, shirt: '#1c2230', text: 'PD' },
    { name: 'sheriff', body: '#3a2e1c', panel: '#e6dcc4', stripe: '#5a3c1e', trim: '#c9a227', star: true, shirt: '#4a3a22', text: 'SO' },
    { name: 'trooper', body: '#f5f5f3', panel: '#f5f5f3', stripe: '#0d3fae', trim: '#c9a227', star: true, text: 'DPS', shirt: '#2b3a55' }
  ];

  var scene = null;

  function findContentArea() {
    return document.getElementById('content-container')
      || document.getElementById('content-area')
      || document.getElementById('content')
      || document.getElementById('body-content');
  }

  function measure() {
    var el = findContentArea();
    if (el) {
      var rect = el.getBoundingClientRect();
      left = rect.left;
      colWidth = rect.width;
    } else {
      left = 0;
      colWidth = window.innerWidth;
    }
    canvas.style.left = left + 'px';
    canvas.style.width = colWidth + 'px';
    glow.style.left = left + 'px';
    glow.style.width = colWidth + 'px';
  }

  function generateBuildings() {
    buildings = [];
    var x = -40;
    while (x < w + 40) {
      var bw = 40 + Math.random() * 70;
      var bh = 60 + Math.random() * (h * 0.3);
      var windows = [];
      for (var wy = groundY - bh + 10; wy < groundY - 8; wy += 16) {
        for (var wx = x + 6; wx < x + bw - 6; wx += 12) {
          if (Math.random() < 0.06) {
            windows.push({ x: wx, y: wy });
          }
        }
      }
      buildings.push({ x: x, w: bw, h: bh, windows: windows });
      x += bw + 6;
    }
  }

  function resize() {
    measure();
    w = canvas.width = colWidth;
    h = canvas.height = window.innerHeight;
    groundY = h - 90;
    generateBuildings();
    stars = [];
    for (var i = 0; i < 40; i++) {
      stars.push({ x: Math.random() * w, y: Math.random() * (groundY * 0.5), r: Math.random() * 1.2 });
    }
  }

  smoke = [];
  skidmarks = [];
  flashTimer = 0;
  flashOn = true;

  window.addEventListener('resize', resize);
  resize();
  setInterval(measure, 1200);

  function newScene() {
    var count = 1 + Math.floor(Math.random() * 5);
    if (typeof newScene.lastCount === 'number' && count === newScene.lastCount) {
      count = 1 + Math.floor(Math.random() * 5);
    }
    newScene.lastCount = count;
    generateBuildings();
    var cars = [];
    for (var i = 0; i < count; i++) {
      var agency = AGENCIES[Math.floor(Math.random() * AGENCIES.length)];
      cars.push({
        x: -320 - i * 110,
        y: 0,
        followGap: 95 + Math.random() * 25,
        agency: agency,
        alpha: 1,
        officer: null,
        parked: false
      });
    }
    scene = {
      state: 'chase',
      suspectX: -220,
      suspectY: 0,
      suspectSpeed: 1.35,
      suspectRotation: 0,
      suspectSpin: 0,
      gap: 100,
      timer: 0,
      pitTriggerX: w * (0.45 + Math.random() * 0.15),
      criminal: null,
      cars: cars
    };
  }

  newScene();

  function roundRect(x, y, width, height, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + width, y, x + width, y + height, r);
    ctx.arcTo(x + width, y + height, x, y + height, r);
    ctx.arcTo(x, y + height, x, y, r);
    ctx.arcTo(x, y, x + width, y, r);
    ctx.closePath();
  }

  function drawSkyline() {
    for (var s = 0; s < stars.length; s++) {
      ctx.fillStyle = 'rgba(200,205,220,0.35)';
      ctx.beginPath();
      ctx.arc(stars[s].x, stars[s].y, stars[s].r, 0, Math.PI * 2);
      ctx.fill();
    }

    for (var i = 0; i < buildings.length; i++) {
      var b = buildings[i];
      ctx.fillStyle = '#1b2130';
      ctx.fillRect(b.x, groundY - b.h, b.w, b.h);
      ctx.fillStyle = '#e8c355';
      for (var wi = 0; wi < b.windows.length; wi++) {
        ctx.fillRect(b.windows[wi].x, b.windows[wi].y, 4, 6);
      }
    }
    ctx.fillStyle = '#181c24';
    ctx.fillRect(0, groundY, w, h - groundY);
  }

  function drawSkidmarks() {
    for (var i = 0; i < skidmarks.length; i++) {
      var m = skidmarks[i];
      ctx.strokeStyle = 'rgba(20,20,22,' + m.a + ')';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(m.x1, m.y);
      ctx.lineTo(m.x2, m.y);
      ctx.stroke();
    }
  }

  function drawCarBody(x, y, body, panel, stripe, trim, star, text) {
    ctx.fillStyle = body;
    roundRect(x, y, 78, 24, 6);
    ctx.fill();

    ctx.fillStyle = panel;
    roundRect(x + 4, y + 3, 70, 18, 4);
    ctx.fill();

    ctx.fillStyle = stripe;
    ctx.fillRect(x + 4, y + 16, 70, 4);
    ctx.fillStyle = trim;
    ctx.fillRect(x + 4, y + 13, 70, 1.5);

    ctx.fillStyle = '#0c0e12';
    roundRect(x + 14, y - 14, 44, 15, 3);
    ctx.fill();
    ctx.fillStyle = '#2a3040';
    ctx.fillRect(x + 17, y - 11, 16, 10);
    ctx.fillRect(x + 36, y - 11, 19, 10);

    ctx.strokeStyle = '#0c0e12';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 34, y + 4);
    ctx.lineTo(x + 34, y + 20);
    ctx.stroke();

    if (star) {
      ctx.fillStyle = trim;
      ctx.beginPath();
      var starX = x + 24, starY = y + 10, outerR = 4.5, innerR = 1.8;
      for (var i = 0; i < 10; i++) {
        var ang = (Math.PI / 5) * i - Math.PI / 2;
        var r = i % 2 === 0 ? outerR : innerR;
        var px = starX + Math.cos(ang) * r;
        var py = starY + Math.sin(ang) * r;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillStyle = trim;
      ctx.font = 'bold 7px sans-serif';
      ctx.fillText(text, x + 44, y + 12);
    }

    ctx.fillStyle = '#c7ccd4';
    ctx.fillRect(x + 3, y - 2, 6, 2);

    ctx.fillStyle = '#0a0a0b';
    ctx.beginPath();
    ctx.arc(x + 17, y + 26, 7.5, 0, Math.PI * 2);
    ctx.arc(x + 61, y + 26, 7.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3a3d44';
    ctx.beginPath();
    ctx.arc(x + 17, y + 26, 3, 0, Math.PI * 2);
    ctx.arc(x + 61, y + 26, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#7c828c';
    roundRect(x - 5, y + 15, 6, 5, 1);
    ctx.fill();
  }

  function drawLightbar(x, y, lightsOn) {
    ctx.fillStyle = '#0d0d0f';
    roundRect(x + 22, y - 21, 38, 7, 2);
    ctx.fill();

    if (!lightsOn) return;
    var redOn = flashOn;
    ctx.fillStyle = redOn ? '#ff2c2c' : '#5a1414';
    ctx.fillRect(x + 24, y - 19.5, 16, 4);
    ctx.fillStyle = !redOn ? '#3c6eff' : '#132a5a';
    ctx.fillRect(x + 42, y - 19.5, 16, 4);

    ctx.fillStyle = redOn ? 'rgba(255,44,44,0.18)' : 'rgba(60,110,255,0.18)';
    ctx.beginPath();
    ctx.arc(x + 41, y - 17, 30, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawPoliceCar(x, y, agency, alpha, lightsOn) {
    ctx.globalAlpha = alpha;
    drawCarBody(x, y, agency.body, agency.panel, agency.stripe, agency.trim, agency.star, agency.text);
    drawLightbar(x, y, lightsOn);
    ctx.globalAlpha = 1;

    if (Math.random() < 0.4) {
      smoke.push({ x: x - 2, y: y + 20, r: 2 + Math.random() * 2, a: 0.22 * alpha });
    }
  }

  function drawSuspectCar(x, y, rotation, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x + 33, y + 12);
    ctx.rotate(rotation);
    ctx.translate(-33, -12);

    ctx.fillStyle = '#2b2d33';
    roundRect(0, 0, 66, 20, 4);
    ctx.fill();
    ctx.fillStyle = '#1f2126';
    roundRect(12, -12, 36, 13, 3);
    ctx.fill();
    ctx.fillStyle = '#3a3c42';
    ctx.fillRect(16, -9, 13, 8);
    ctx.fillRect(33, -9, 13, 8);
    ctx.fillStyle = '#0a0a0b';
    ctx.beginPath();
    ctx.arc(15, 22, 6, 0, Math.PI * 2);
    ctx.arc(51, 22, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ff3b3b';
    ctx.fillRect(60, 4, 4, 6);

    ctx.restore();
  }

  function drawPerson(x, y, phase, alpha, shirt, hat, running) {
    ctx.globalAlpha = alpha;
    var legShift = running ? Math.sin(phase) * 6 : 0;

    ctx.strokeStyle = '#1b1d22';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + legShift, y + 13);
    ctx.moveTo(x, y);
    ctx.lineTo(x - legShift, y + 13);
    ctx.stroke();

    ctx.fillStyle = shirt;
    roundRect(x - 4, y - 15, 8, 16, 2);
    ctx.fill();

    ctx.fillStyle = '#c9a227';
    ctx.fillRect(x - 4, y - 3, 8, 2);

    ctx.fillStyle = '#dcb992';
    ctx.beginPath();
    ctx.arc(x, y - 19, 3.6, 0, Math.PI * 2);
    ctx.fill();

    if (hat) {
      ctx.fillStyle = '#101318';
      ctx.fillRect(x - 5, y - 23, 10, 3);
      ctx.fillRect(x - 3, y - 25, 6, 2);
    }

    ctx.strokeStyle = shirt;
    ctx.lineWidth = 2.4;
    var armShift = running ? Math.sin(phase + 1.6) * 6 : 0;
    ctx.beginPath();
    ctx.moveTo(x, y - 9);
    ctx.lineTo(x + 5, y - 3 + armShift * 0.4);
    ctx.moveTo(x, y - 9);
    ctx.lineTo(x - 5, y - 3 - armShift * 0.4);
    ctx.stroke();

    ctx.globalAlpha = 1;
  }

  function drawSmoke() {
    for (var i = smoke.length - 1; i >= 0; i--) {
      var p = smoke[i];
      ctx.fillStyle = 'rgba(200,200,205,' + p.a + ')';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      p.x -= 0.8;
      p.y -= 0.3;
      p.r += 0.06;
      p.a -= 0.007;
      if (p.a <= 0) smoke.splice(i, 1);
    }
  }

  function updateSkidmarks() {
    for (var i = skidmarks.length - 1; i >= 0; i--) {
      skidmarks[i].a -= 0.004;
      if (skidmarks[i].a <= 0) skidmarks.splice(i, 1);
    }
  }

  function updateChase(s) {
    s.gap += (Math.random() - 0.5) * 1.2;
    if (s.gap < 70) s.gap = 70;
    if (s.gap > 120) s.gap = 120;

    s.suspectX += s.suspectSpeed;

    var aheadX = s.suspectX - s.gap;
    for (var i = 0; i < s.cars.length; i++) {
      var target = aheadX - i * s.cars[i].followGap;
      s.cars[i].x += (target - s.cars[i].x) * 0.12;
    }

    if (s.suspectX > s.pitTriggerX) {
      s.state = 'pit';
      s.timer = 0;
    }
  }

  function updatePit(s) {
    s.timer++;
    s.suspectX += s.suspectSpeed;

    var lead = s.cars[0];
    var targetX = s.suspectX - 30;
    lead.x += (targetX - lead.x) * 0.1;
    lead.y += (-13 - lead.y) * 0.15;

    for (var i = 1; i < s.cars.length; i++) {
      var target = s.suspectX - s.gap - (i - 1) * s.cars[i].followGap;
      s.cars[i].x += (target - s.cars[i].x) * 0.12;
    }

    if (s.timer > 45) {
      s.state = 'spin';
      s.suspectSpin = 0.26;
      skidmarks.push({ x1: s.suspectX, x2: s.suspectX, y: groundY + 18, a: 0.5 });
    }
  }

  function updateSpin(s) {
    s.suspectRotation += s.suspectSpin;
    s.suspectSpin *= 0.94;
    s.suspectSpeed *= 0.9;
    s.suspectX += s.suspectSpeed;

    var lead = s.cars[0];
    lead.y += (0 - lead.y) * 0.08;
    var target0 = s.suspectX - 90;
    lead.x += (target0 - lead.x) * 0.06;
    for (var i = 1; i < s.cars.length; i++) {
      var target = lead.x - i * s.cars[i].followGap;
      s.cars[i].x += (target - s.cars[i].x) * 0.1;
    }

    if (skidmarks.length) {
      skidmarks[skidmarks.length - 1].x2 = s.suspectX;
    }

    if (Math.random() < 0.6) {
      smoke.push({ x: s.suspectX + 20, y: groundY + 14, r: 2 + Math.random() * 3, a: 0.3 });
    }

    if (Math.abs(s.suspectSpin) < 0.01 && s.suspectSpeed < 0.15) {
      s.state = 'parking';
      s.timer = 0;
      s.suspectSpeed = 0;
    }
  }

  function updateParking(s) {
    s.timer++;
    for (var i = 0; i < s.cars.length; i++) {
      var side = i % 2 === 0 ? -1 : 1;
      var targetX = s.suspectX - 110 - i * 60;
      var targetY = side * 8;
      s.cars[i].x += (targetX - s.cars[i].x) * 0.06;
      s.cars[i].y += (targetY - s.cars[i].y) * 0.08;
    }

    if (s.timer > 70) {
      s.state = 'exit';
      s.timer = 0;
      for (var j = 0; j < s.cars.length; j++) {
        s.cars[j].officer = {
          x: s.cars[j].x + 10,
          y: groundY - 2,
          phase: Math.random() * 6,
          alpha: 1,
          running: false
        };
      }
      s.criminal = {
        x: s.suspectX + 10,
        y: groundY - 2,
        phase: 0,
        alpha: 1,
        running: false
      };
    }
  }

  function updateExit(s) {
    s.timer++;
    if (s.timer > 35) {
      s.state = 'footChase';
      s.criminal.running = true;
      for (var i = 0; i < s.cars.length; i++) {
        if (s.cars[i].officer) s.cars[i].officer.running = true;
      }
    }
  }

  function updateFootChase(s) {
    s.criminal.x += 2.6;
    s.criminal.phase += 0.35;

    for (var i = 0; i < s.cars.length; i++) {
      var officer = s.cars[i].officer;
      if (!officer) continue;
      officer.x += 2.2;
      officer.phase += 0.32;
    }

    if (s.criminal.x > w + 40) {
      s.state = 'fadeOut';
      s.timer = 0;
    }
  }

  function updateFadeOut(s) {
    s.timer++;
    for (var i = 0; i < s.cars.length; i++) {
      s.cars[i].alpha -= 0.02;
      if (s.cars[i].officer) s.cars[i].officer.alpha -= 0.02;
    }
    if (s.criminal) s.criminal.alpha -= 0.02;
    if (s.timer > 55) newScene();
  }

  function updateScene() {
    var s = scene;
    if (s.state === 'chase') updateChase(s);
    else if (s.state === 'pit') updatePit(s);
    else if (s.state === 'spin') updateSpin(s);
    else if (s.state === 'parking') updateParking(s);
    else if (s.state === 'exit') updateExit(s);
    else if (s.state === 'footChase') updateFootChase(s);
    else if (s.state === 'fadeOut') updateFadeOut(s);
  }

  function tick() {
    ctx.clearRect(0, 0, w, h);
    drawSkyline();
    drawSkidmarks();
    drawSmoke();

    var s = scene;
    var suspectVisible = s.state !== 'exit' && s.state !== 'footChase' && s.state !== 'fadeOut';
    if (suspectVisible) {
      drawSuspectCar(s.suspectX, groundY - 20, s.suspectRotation, 1);
    } else if (s.state === 'exit' || s.state === 'footChase') {
      drawSuspectCar(s.suspectX, groundY - 20, s.suspectRotation, 1);
    } else if (s.state === 'fadeOut' && s.criminal) {
      drawSuspectCar(s.suspectX, groundY - 20, s.suspectRotation, Math.max(s.criminal.alpha, 0));
    }

    var lightsOn = s.state !== 'fadeOut';
    for (var i = s.cars.length - 1; i >= 0; i--) {
      var c = s.cars[i];
      if (c.alpha > 0) {
        drawPoliceCar(c.x, groundY - 22 + c.y, c.agency, c.alpha, lightsOn);
      }
      if (c.officer && c.officer.alpha > 0) {
        drawPerson(c.officer.x, c.officer.y, c.officer.phase, c.officer.alpha, c.agency.shirt, true, c.officer.running);
      }
    }

    if (s.criminal && s.criminal.alpha > 0) {
      drawPerson(s.criminal.x, s.criminal.y, s.criminal.phase, s.criminal.alpha, '#4b4f58', false, s.criminal.running);
    }

    updateScene();
    updateSkidmarks();

    flashTimer++;
    if (flashTimer > 18) {
      flashOn = !flashOn;
      flashTimer = 0;
    }

    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
})();