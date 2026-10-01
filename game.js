(() => {
  "use strict";

  const intro = document.getElementById("intro");
  const gameArea = document.getElementById("gameArea");
  const help = document.getElementById("help");
  const ending = document.getElementById("ending");
  const world = document.getElementById("world");
  const worldContent = document.getElementById("worldContent");
  const playerEl = document.getElementById("player");
  const livesEl = document.getElementById("lives");
  const scoreEl = document.getElementById("score");
  const distanceEl = document.getElementById("distance");
  const messageEl = document.getElementById("gameMessage");

  const startBtn = document.getElementById("startBtn");
  const restartBtn = document.getElementById("restartBtn");
  const restartTop = document.getElementById("restartTop");
  const leftBtn = document.getElementById("leftBtn");
  const rightBtn = document.getElementById("rightBtn");
  const jumpBtn = document.getElementById("jumpBtn");

  const WORLD_WIDTH = 4800;
  const GROUND_Y = 58;
  const PLAYER_W = 52;
  const PLAYER_H = 64;

  let player;
  let platforms = [];
  let items = [];
  let obstacles = [];
  let finishX = 0;
  let cameraX = 0;
  let running = false;
  let lastTime = 0;
  let raf = 0;
  let input = { left: false, right: false };
  let invulnerableUntil = 0;

  function resetState() {
    player = {
      x: 90,
      y: GROUND_Y,
      vx: 0,
      vy: 0,
      speed: 4.8,
      jump: 11.8,
      grounded: true
    };

    platforms = [];
    items = [];
    obstacles = [];
    cameraX = 0;
    lastTime = 0;
    invulnerableUntil = 0;

    buildLevel();
    renderLevel();
    updateHud();
  }

  function buildLevel() {
    // Plataformas: x, y desde el suelo, ancho
    platforms = [
      { x: 520, y: 125, w: 190 },
      { x: 940, y: 90, w: 160 },
      { x: 1290, y: 135, w: 200 },
      { x: 1700, y: 90, w: 170 },
      { x: 2080, y: 130, w: 220 },
      { x: 2530, y: 85, w: 180 },
      { x: 2940, y: 135, w: 190 },
      { x: 3370, y: 95, w: 190 },
      { x: 3780, y: 135, w: 210 },
      { x: 4230, y: 90, w: 190 }
    ];

    items = [
      { x: 350, emoji: "💗", collected: false },
      { x: 610, y: 0, emoji: "💊", collected: false, platform: true },
      { x: 820, emoji: "💗", collected: false },
      { x: 1000, emoji: "🩹", collected: false, platform: true },
      { x: 1200, emoji: "💗", collected: false },
      { x: 1370, emoji: "⭐", collected: false, platform: true },
      { x: 1580, emoji: "💗", collected: false },
      { x: 1770, emoji: "💊", collected: false, platform: true },
      { x: 1950, emoji: "💗", collected: false },
      { x: 2170, emoji: "🩹", collected: false, platform: true },
      { x: 2400, emoji: "💗", collected: false },
      { x: 2600, emoji: "⭐", collected: false, platform: true },
      { x: 2800, emoji: "💗", collected: false },
      { x: 3020, emoji: "💊", collected: false, platform: true },
      { x: 3250, emoji: "💗", collected: false },
      { x: 3440, emoji: "🩹", collected: false, platform: true },
      { x: 3650, emoji: "💗", collected: false },
      { x: 3860, emoji: "⭐", collected: false, platform: true },
      { x: 4080, emoji: "💗", collected: false },
      { x: 4320, emoji: "💗", collected: false, platform: true }
    ];

    obstacles = [
      { x: 690, emoji: "🦠", w: 46 },
      { x: 1130, emoji: "🦠", w: 46 },
      { x: 1510, emoji: "🦠", w: 46 },
      { x: 1890, emoji: "🦠", w: 46 },
      { x: 2320, emoji: "🦠", w: 46 },
      { x: 2730, emoji: "🦠", w: 46 },
      { x: 3150, emoji: "🦠", w: 46 },
      { x: 3560, emoji: "🦠", w: 46 },
      { x: 3990, emoji: "🦠", w: 46 },
      { x: 4180, emoji: "🦠", w: 46 }
    ];

    finishX = 4540;
  }

  function renderLevel() {
    worldContent.querySelectorAll(".platform, .item, .obstacle").forEach(el => el.remove());

    platforms.forEach((p) => {
      const el = document.createElement("div");
      el.className = "platform";
      el.style.left = `${p.x}px`;
      el.style.bottom = `${GROUND_Y + p.y}px`;
      el.style.width = `${p.w}px`;
      worldContent.appendChild(el);
    });

    items.forEach((item, index) => {
      const el = document.createElement("div");
      el.className = "item";
      el.dataset.index = String(index);
      el.textContent = item.emoji;
      el.style.left = `${item.x}px`;
      el.style.bottom = `${item.platform ? GROUND_Y + 95 : GROUND_Y + 15}px`;
      worldContent.appendChild(el);
    });

    obstacles.forEach((obstacle) => {
      const el = document.createElement("div");
      el.className = "obstacle";
      el.textContent = obstacle.emoji;
      el.style.left = `${obstacle.x}px`;
      worldContent.appendChild(el);
    });

    document.getElementById("finish").style.right = `${WORLD_WIDTH - finishX - 130}px`;
    playerEl.style.left = `${player.x}px`;
    playerEl.style.bottom = `${player.y}px`;
  }

  function startGame() {
    intro.style.display = "none";
    ending.classList.remove("show");
    gameArea.classList.add("active");
    help.style.display = window.innerWidth >= 700 ? "flex" : "none";
    resetState();
    running = true;
    messageEl.classList.remove("show");
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(loop);
  }

  function restartGame() {
    startGame();
  }

  function showMessage(text, duration = 1100) {
    messageEl.textContent = text;
    messageEl.classList.add("show");
    window.setTimeout(() => messageEl.classList.remove("show"), duration);
  }

  function updateHud() {
    livesEl.textContent = String(player?.lives ?? 3);
    scoreEl.textContent = String(player?.score ?? 0);
    const pct = Math.min(100, Math.max(0, Math.round((player?.x ?? 0) / finishX * 100)));
    distanceEl.textContent = `${pct}%`;
  }

  function addStats() {
    player.lives = player.lives ?? 3;
    player.score = player.score ?? 0;
  }

  function rectsOverlap(a, b) {
    return (
      a.x < b.x + b.w &&
      a.x + a.w > b.x &&
      a.y < b.y + b.h &&
      a.y + a.h > b.y
    );
  }

  function getPlayerRect() {
    return {
      x: player.x + 7,
      y: player.y,
      w: PLAYER_W - 14,
      h: PLAYER_H
    };
  }

  function getPlatforms() {
    return [
      { x: 0, y: 0, w: WORLD_WIDTH, h: GROUND_Y },
      ...platforms.map(p => ({
        x: p.x,
        y: GROUND_Y + p.y,
        w: p.w,
        h: 18
      }))
    ];
  }

  function move(dt) {
    const direction = (input.right ? 1 : 0) - (input.left ? 1 : 0);

    player.vx = direction * player.speed;
    player.x += player.vx * dt;

    if (player.x < 0) player.x = 0;
    if (player.x > WORLD_WIDTH - 120) player.x = WORLD_WIDTH - 120;

    if (direction !== 0) playerEl.classList.add("running");
    else playerEl.classList.remove("running");

    player.vy -= 0.55 * dt;
    player.y += player.vy * dt;

    resolveVerticalCollisions();
  }

  function resolveVerticalCollisions() {
    const oldY = player.y - player.vy;
    const newBottom = player.y;
    let landed = false;

    // y is distance from the bottom of the world.
    // A platform top is its bottom distance + height.
    for (const p of getPlatforms()) {
      const platformTop = p.y + p.h;
      const playerBottom = player.y;

      const horizontal =
        player.x + PLAYER_W - 9 > p.x &&
        player.x + 9 < p.x + p.w;

      const crossingDown =
        player.vy <= 0 &&
        oldY >= platformTop &&
        playerBottom <= platformTop;

      if (horizontal && crossingDown) {
        player.y = platformTop;
        player.vy = 0;
        landed = true;
        break;
      }
    }

    player.grounded = landed;

    if (player.y < GROUND_Y) {
      player.y = GROUND_Y;
      player.vy = 0;
      player.grounded = true;
    }
  }

  function jump() {
    if (!running || !player.grounded) return;
    player.vy = player.jump;
    player.grounded = false;
  }

  function checkItems() {
    const p = getPlayerRect();

    items.forEach((item, index) => {
      if (item.collected) return;

      const itemY = item.platform ? GROUND_Y + 92 : GROUND_Y + 12;
      const r = { x: item.x, y: itemY, w: 40, h: 40 };

      if (rectsOverlap(p, r)) {
        item.collected = true;
        const el = worldContent.querySelector(`.item[data-index="${index}"]`);
        if (el) el.style.display = "none";
        player.score += item.emoji === "⭐" ? 3 : 1;
        showMessage(item.emoji === "⭐" ? "¡Estrellita para ti! ⭐" : "¡Bien hecho! 💗", 700);
      }
    });
  }

  function checkObstacles() {
    if (performance.now() < invulnerableUntil) return;

    const p = getPlayerRect();

    for (const obstacle of obstacles) {
      const r = {
        x: obstacle.x + 5,
        y: GROUND_Y,
        w: obstacle.w - 10,
        h: 46
      };

      if (rectsOverlap(p, r)) {
        player.lives -= 1;
        invulnerableUntil = performance.now() + 1300;
        playerEl.classList.remove("hit");
        void playerEl.offsetWidth;
        playerEl.classList.add("hit");

        if (player.lives <= 0) {
          gameOver();
        } else {
          player.x = Math.max(0, player.x - 180);
          player.y = GROUND_Y + 20;
          player.vy = 0;
          showMessage(`¡Cuidado con el virus! 🦠 Te quedan ${player.lives} ❤️`, 1000);
        }
        updateHud();
        return;
      }
    }
  }

  function updateCamera() {
    const viewportWidth = world.clientWidth;
    const target = player.x - viewportWidth * 0.35;
    cameraX += (target - cameraX) * 0.12;
    cameraX = Math.max(0, Math.min(WORLD_WIDTH - viewportWidth, cameraX));
    worldContent.style.transform = `translateX(${-cameraX}px)`;
  }

  function checkFinish() {
    if (player.x + PLAYER_W >= finishX) {
      winGame();
    }
  }

  function loop(time) {
    if (!running) return;

    if (!lastTime) lastTime = time;
    const dt = Math.min(1.8, (time - lastTime) / 16.67);
    lastTime = time;

    move(dt);
    checkItems();
    checkObstacles();
    updateCamera();
    updateHud();
    playerEl.style.left = `${player.x}px`;
    playerEl.style.bottom = `${player.y}px`;

    if (player.lives <= 0) return;

    checkFinish();

    raf = requestAnimationFrame(loop);
  }

  function winGame() {
    if (!running) return;
    running = false;
    cancelAnimationFrame(raf);

    player.x = finishX;
    updateHud();

    gameArea.classList.remove("active");
    help.style.display = "none";
    ending.classList.add("show");
  }

  function gameOver() {
    running = false;
    cancelAnimationFrame(raf);
    showMessage("Misión fallida... pero se puede intentar otra vez 💗", 1500);

    window.setTimeout(() => {
      gameArea.classList.remove("active");
      help.style.display = "none";
      intro.style.display = "block";
      intro.querySelector("h2").textContent = "Casi, enfermera 🩺";
      intro.querySelector("p").textContent =
        "Los virus se han puesto pesados, pero una misión así no se abandona. Vuelve a intentarlo.";
    }, 900);
  }

  function setupInput(button, key) {
    const down = (event) => {
      event.preventDefault();
      input[key] = true;
    };

    const up = (event) => {
      event.preventDefault();
      input[key] = false;
    };

    button.addEventListener("pointerdown", down);
    button.addEventListener("pointerup", up);
    button.addEventListener("pointercancel", up);
    button.addEventListener("pointerleave", up);
  }

  setupInput(leftBtn, "left");
  setupInput(rightBtn, "right");

  jumpBtn.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    jump();
  });

  window.addEventListener("keydown", (event) => {
    if (!running) return;

    if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
      input.left = true;
      event.preventDefault();
    }

    if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
      input.right = true;
      event.preventDefault();
    }

    if (event.key === "ArrowUp" || event.key === " " || event.key.toLowerCase() === "w") {
      jump();
      event.preventDefault();
    }
  });

  window.addEventListener("keyup", (event) => {
    if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") input.left = false;
    if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") input.right = false;
  });

  startBtn.addEventListener("click", startGame);
  restartBtn.addEventListener("click", restartGame);
  restartTop.addEventListener("click", () => {
    if (running) {
      resetState();
    } else {
      intro.style.display = "block";
      ending.classList.remove("show");
      gameArea.classList.remove("active");
    }
  });

  // Estado inicial.
  resetState();
  addStats();
  updateHud();
})();
