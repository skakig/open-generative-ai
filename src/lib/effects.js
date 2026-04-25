export function confettiBurst(target = document.body) {
  const burst = document.createElement('div');
  burst.className = 'confetti-burst';

  for (let i = 0; i < 80; i += 1) {
    const piece = document.createElement('span');
    piece.style.setProperty('--x', `${(Math.random() * 2 - 1) * 220}px`);
    piece.style.setProperty('--y', `${(Math.random() * 2 - 1) * 220}px`);
    piece.style.setProperty('--r', `${Math.random() * 900}deg`);
    piece.style.setProperty('--h', `${Math.floor(Math.random() * 360)}deg`);
    piece.style.animationDelay = `${Math.random() * 120}ms`;
    burst.appendChild(piece);
  }

  target.appendChild(burst);
  setTimeout(() => burst.remove(), 1300);
}

export function toast(message, tone = 'info') {
  const container = document.querySelector('#toast-stack');
  if (!container) return;

  const item = document.createElement('div');
  item.className = `toast toast-${tone}`;
  item.textContent = message;
  container.appendChild(item);

  requestAnimationFrame(() => item.classList.add('show'));
  setTimeout(() => {
    item.classList.remove('show');
    setTimeout(() => item.remove(), 250);
  }, 2600);
}

export function startParticles(canvas) {
  const ctx = canvas.getContext('2d');
  let particles = [];
  let raf;

  const resize = () => {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    particles = Array.from({ length: 45 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      size: Math.random() * 2.4 + 0.5,
    }));
  };

  resize();
  window.addEventListener('resize', resize);

  const frame = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
      if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
      const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 6);
      glow.addColorStop(0, 'rgba(129, 242, 255, 0.6)');
      glow.addColorStop(1, 'rgba(129, 242, 255, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 6, 0, Math.PI * 2);
      ctx.fill();
    });

    raf = requestAnimationFrame(frame);
  };

  frame();

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', resize);
  };
}
