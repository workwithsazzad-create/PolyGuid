import confetti from 'canvas-confetti';

interface CelebrationOptions {
  title?: string;
  redirectUrl?: string;
  onComplete?: () => void;
}

export function triggerPurchaseCelebration(options: CelebrationOptions = {}) {
  const {
    title = 'Congratulations!',
    redirectUrl,
    onComplete
  } = options;

  // 1. Mobile Vibration
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([200, 60, 200, 60, 300]);
    } catch (e) {
      console.log('Vibration not supported/allowed:', e);
    }
  }

  // 2. Light Screen Shake on root element
  if (typeof document !== 'undefined') {
    const rootEl = document.getElementById('root') || document.body;
    rootEl.classList.add('animate-screen-shake');
    setTimeout(() => {
      rootEl.classList.remove('animate-screen-shake');
    }, 450);
  }

  // 3. High-visibility animated sprinkles and ribbons with slow gravity & high tick count
  const colors = [
    '#FF3366', '#FFD166', '#FFB703', '#FB8500', 
    '#00F5D4', '#00BBF9', '#7B2CBF', '#F15BB5', '#06D6A0', '#E76F51'
  ];

  // Initial big upward explosion from center bottom
  confetti({
    particleCount: 200,
    angle: 90,
    spread: 120,
    startVelocity: 75,
    gravity: 0.6,
    ticks: 450,
    origin: { x: 0.5, y: 0.95 },
    colors: colors,
    scalar: 1.4,
    zIndex: 999999
  });

  // Left & Right side cannons firing upward diagonally
  setTimeout(() => {
    confetti({
      particleCount: 130,
      angle: 65,
      spread: 80,
      startVelocity: 70,
      gravity: 0.6,
      ticks: 400,
      origin: { x: 0.1, y: 0.9 },
      colors: colors,
      scalar: 1.3,
      zIndex: 999999
    });
    confetti({
      particleCount: 130,
      angle: 115,
      spread: 80,
      startVelocity: 70,
      gravity: 0.6,
      ticks: 400,
      origin: { x: 0.9, y: 0.9 },
      colors: colors,
      scalar: 1.3,
      zIndex: 999999
    });
  }, 180);

  // Continuous rain of falling sprinkles across 2.2 seconds
  let waveCount = 0;
  const timer = setInterval(() => {
    waveCount++;
    confetti({
      particleCount: 50,
      angle: 90,
      spread: 130,
      startVelocity: 50,
      gravity: 0.55,
      ticks: 350,
      origin: { x: 0.15 + Math.random() * 0.7, y: 0.85 },
      colors: colors,
      scalar: 1.25,
      zIndex: 999999
    });
    if (waveCount >= 7) clearInterval(timer);
  }, 280);

  // 4. Create Fully Transparent Overlay - ONLY "Congratulations!" and 🎉, NO extra text/card
  const overlay = document.createElement('div');
  overlay.id = 'purchase-celebration-overlay';
  overlay.className = 'fixed inset-0 z-[99990] flex flex-col items-center justify-center pointer-events-none select-none bg-transparent p-4';

  overlay.innerHTML = `
    <div class="flex flex-col items-center justify-center text-center animate-congrats max-w-xl">
      <div class="text-6xl sm:text-7xl md:text-8xl mb-3 drop-shadow-[0_10px_25px_rgba(255,183,3,0.8)]">
        🎉
      </div>
      <h1 class="text-3xl sm:text-5xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-orange-500 tracking-tight drop-shadow-[0_6px_20px_rgba(0,0,0,0.9)] leading-tight">
        ${title}
      </h1>
    </div>
  `;

  document.body.appendChild(overlay);

  // 5. Cleanup Overlay and Optional Redirect or Callback after ~3 seconds
  setTimeout(() => {
    if (overlay.parentNode) {
      overlay.parentNode.removeChild(overlay);
    }
    if (onComplete) {
      onComplete();
    }
    if (redirectUrl) {
      window.location.href = redirectUrl;
    }
  }, 3000);
}
