const hero = document.getElementById('hero');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function hasWebGL() {
  try {
    const probe = document.createElement('canvas');
    return Boolean(window.WebGLRenderingContext && (probe.getContext('webgl2') || probe.getContext('webgl')));
  } catch {
    return false;
  }
}

function shouldRun() {
  return Boolean(hero) &&
    !reducedMotion.matches &&
    window.innerWidth >= 768 &&
    !(navigator.connection && navigator.connection.saveData) &&
    hasWebGL();
}

async function init() {
  if (!shouldRun()) return;

  let THREE;
  try {
    THREE = await import('./vendor/three.module.min.js');
  } catch {
    return;
  }

  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: false,
    powerPreference: 'low-power'
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);

  const canvas = renderer.domElement;
  canvas.className = 'hero__canvas';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.setAttribute('role', 'presentation');
  hero.insertBefore(canvas, hero.firstChild);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 200);
  camera.position.z = 40;

  const count = Math.min(650, Math.round(window.innerWidth * 0.45));
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const palette = [
    new THREE.Color(0xfff2c8),
    new THREE.Color(0x41a6f6),
    new THREE.Color(0x7fe3a0)
  ];

  for (let i = 0; i < count; i += 1) {
    positions[i * 3] = Math.random() * 120 - 60;
    positions[i * 3 + 1] = Math.random() * 80 - 40;
    positions[i * 3 + 2] = Math.random() * 60 - 20;

    const color = palette[Math.random() < 0.6 ? 0 : Math.random() < 0.5 ? 1 : 2];
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 0.5,
    sizeAttenuation: true,
    vertexColors: true,
    transparent: true,
    opacity: 0.5,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  const stars = new THREE.Points(geometry, material);
  scene.add(stars);

  let width = 0;
  let height = 0;

  function resize() {
    width = hero.clientWidth;
    height = hero.clientHeight;
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  resize();

  let resizeTimer = 0;
  const resizeObserver = new ResizeObserver(() => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 150);
  });
  resizeObserver.observe(hero);

  let pointerX = 0;
  let pointerY = 0;

  hero.addEventListener('pointermove', (event) => {
    const rect = hero.getBoundingClientRect();
    pointerX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointerY = ((event.clientY - rect.top) / rect.height) * 2 - 1;
  }, { passive: true });

  hero.addEventListener('pointerleave', () => {
    pointerX = 0;
    pointerY = 0;
  });

  const positionAttribute = geometry.getAttribute('position');
  const driftSpeed = 3.2;

  let frameId = 0;
  let running = false;
  let heroVisible = true;
  let documentVisible = !document.hidden;
  let previousTime = 0;

  function frame(time) {
    if (!running) return;

    const delta = previousTime ? Math.min((time - previousTime) / 1000, 0.05) : 0;
    previousTime = time;

    const array = positionAttribute.array;
    for (let i = 0; i < count; i += 1) {
      const index = i * 3 + 1;
      let y = array[index] + driftSpeed * delta;
      if (y > 45) y = -45;
      array[index] = y;
    }
    positionAttribute.needsUpdate = true;

    stars.position.x += (pointerX * 4 - stars.position.x) * 0.04;
    stars.position.y += (-pointerY * 3 - stars.position.y) * 0.04;

    renderer.render(scene, camera);
    frameId = requestAnimationFrame(frame);
  }

  function start() {
    if (running) return;
    running = true;
    previousTime = 0;
    frameId = requestAnimationFrame(frame);
  }

  function stop() {
    running = false;
    cancelAnimationFrame(frameId);
  }

  function sync() {
    if (heroVisible && documentVisible && !reducedMotion.matches) start();
    else stop();
  }

  const intersectionObserver = new IntersectionObserver((entries) => {
    heroVisible = entries[0]?.isIntersecting ?? true;
    sync();
  }, { threshold: 0.01 });
  intersectionObserver.observe(hero);

  document.addEventListener('visibilitychange', () => {
    documentVisible = !document.hidden;
    sync();
  });

  reducedMotion.addEventListener('change', sync);

  sync();
}

function schedule() {
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(init, { timeout: 2000 });
  } else {
    setTimeout(init, 200);
  }
}

if (document.readyState === 'complete') schedule();
else window.addEventListener('load', schedule, { once: true });
