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
  var w, h, groundY, buildings, smoke, carX, carSpeed, flashTimer, flashOn, stars;

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
    groundY = h - 90;
    buildings = [];
    var x = -40;
    while (x < w + 40) {
      var bw = 40 + Math.random() * 70;
      var bh = 60 + Math.random() * (h * 0.35);
      buildings.push({ x: x, w: bw, h: bh });
      x += bw + 6;
    }
    stars = [];
    for (var i = 0; i < 60; i++) {
      stars.push({ x: Math.random() * w, y: Math.random() * (groundY * 0.6), r: Math.random() * 1.4 });
    }
  }

  smoke = [];
  carX = -120;
  carSpeed = 1.4;
  flashTimer = 0;
  flashOn = true;

  window.addEventListener('resize', resize);
  resize();

  function drawSkyline() {
    ctx.fillStyle = '#0f1420';
    for (var s = 0; s < stars.length; s++) {
      ctx.fillStyle = 'rgba(200,205,220,0.5)';
      ctx.beginPath();
      ctx.arc(stars[s].x, stars[s].y, stars[s].r, 0, Math.PI * 2);
      ctx.fill();
    }

    for (var i = 0; i < buildings.length; i++) {
      var b = buildings[i];
      ctx.fillStyle = '#1b2130';
      ctx.fillRect(b.x, groundY - b.h, b.w, b.h);
      ctx.fillStyle = '#f2c94c';
      for (var wy = groundY - b.h + 10; wy < groundY - 8; wy += 16) {
        for (var wx = b.x + 6; wx < b.x + b.w - 6; wx += 12) {
          if (Math.random() < 0.08) {
            ctx.fillRect(wx, wy, 4, 6);
          }
        }
      }
    }
    ctx.fillStyle = '#181c24';
    ctx.fillRect(0, groundY, w, h - groundY);
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(0, groundY + 6, w, 2);
  }

  function drawCar(x, y) {
    ctx.fillStyle = '#e8e8ea';
    ctx.fillRect(x, y, 70, 22);
    ctx.fillRect(x + 10, y - 12, 42, 14);
    ctx.fillStyle = '#0a0a0b';
    ctx.beginPath();
    ctx.arc(x + 16, y + 24, 7, 0, Math.PI * 2);
    ctx.arc(x + 54, y + 24, 7, 0, Math.PI * 2);
    ctx.fill();

    var redOn = flashOn;
    ctx.fillStyle = redOn ? '#ff2c2c' : 'rgba(120,30,30,0.5)';
    ctx.fillRect(x + 12, y - 17, 10, 5);
    ctx.fillStyle = !redOn ? '#3c6eff' : 'rgba(30,50,120,0.5)';
    ctx.fillRect(x + 40, y - 17, 10, 5);

    if (redOn) {
      ctx.fillStyle = 'rgba(255,44,44,0.25)';
      ctx.beginPath();
      ctx.arc(x + 17, y - 15, 34, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = 'rgba(60,110,255,0.25)';
      ctx.beginPath();
      ctx.arc(x + 45, y - 15, 34, 0, Math.PI * 2);
      ctx.fill();
    }

    if (Math.random() < 0.5) {
      smoke.push({ x: x - 2, y: y + 18, r: 2 + Math.random() * 2, a: 0.35 });
    }
  }

  function drawSmoke() {
    for (var i = smoke.length - 1; i >= 0; i--) {
      var p = smoke[i];
      ctx.fillStyle = 'rgba(200,200,205,' + p.a + ')';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      p.x -= carSpeed * 0.6;
      p.y -= 0.3;
      p.r += 0.06;
      p.a -= 0.007;
      if (p.a <= 0) smoke.splice(i, 1);
    }
  }

  function tick() {
    ctx.clearRect(0, 0, w, h);
    drawSkyline();

    carX += carSpeed;
    if (carX > w + 100) {
      carX = -140;
    }
    drawSmoke();
    drawCar(carX, groundY - 22);

    flashTimer++;
    if (flashTimer > 18) {
      flashOn = !flashOn;
      flashTimer = 0;
    }

    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
})();