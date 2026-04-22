import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const mount = document.getElementById('brain3d');
if (mount && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const size = () => Math.min(mount.clientWidth, mount.clientHeight) || 400;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.z = 3.6;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(size(), size());
  mount.appendChild(renderer.domElement);

  // Generate Fibonacci-distributed points on a sphere
  const COUNT = 220;
  const RADIUS = 1.25;
  const positions = new Float32Array(COUNT * 3);
  const points = [];
  const phi = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < COUNT; i++) {
    const y = 1 - (i / (COUNT - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const theta = phi * i;
    const x = Math.cos(theta) * r;
    const z = Math.sin(theta) * r;
    positions[i * 3] = x * RADIUS;
    positions[i * 3 + 1] = y * RADIUS;
    positions[i * 3 + 2] = z * RADIUS;
    points.push(new THREE.Vector3(x * RADIUS, y * RADIUS, z * RADIUS));
  }

  // Nodes (point cloud)
  const ptGeom = new THREE.BufferGeometry();
  ptGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const colors = new Float32Array(COUNT * 3);
  const c1 = new THREE.Color(0xff6b9d);
  const c2 = new THREE.Color(0xc471ed);
  const c3 = new THREE.Color(0x12c2e9);
  for (let i = 0; i < COUNT; i++) {
    const t = i / COUNT;
    const c = t < 0.5
      ? new THREE.Color().lerpColors(c1, c2, t * 2)
      : new THREE.Color().lerpColors(c2, c3, (t - 0.5) * 2);
    colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
  }
  ptGeom.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const ptMat = new THREE.PointsMaterial({
    size: 0.06,
    vertexColors: true,
    transparent: true,
    opacity: 0.95,
    sizeAttenuation: true,
  });
  const cloud = new THREE.Points(ptGeom, ptMat);
  scene.add(cloud);

  // Connections (nearest neighbours)
  const linkVerts = [];
  const linkColors = [];
  const MAX_LINKS = 4;
  for (let i = 0; i < COUNT; i++) {
    const distances = [];
    for (let j = 0; j < COUNT; j++) {
      if (i === j) continue;
      distances.push({ j, d: points[i].distanceTo(points[j]) });
    }
    distances.sort((a, b) => a.d - b.d);
    for (let k = 0; k < MAX_LINKS; k++) {
      const { j } = distances[k];
      if (j < i) continue;
      linkVerts.push(points[i].x, points[i].y, points[i].z);
      linkVerts.push(points[j].x, points[j].y, points[j].z);
      linkColors.push(colors[i*3], colors[i*3+1], colors[i*3+2]);
      linkColors.push(colors[j*3], colors[j*3+1], colors[j*3+2]);
    }
  }
  const linkGeom = new THREE.BufferGeometry();
  linkGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(linkVerts), 3));
  linkGeom.setAttribute('color', new THREE.BufferAttribute(new Float32Array(linkColors), 3));
  const linkMat = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.25,
  });
  const lines = new THREE.LineSegments(linkGeom, linkMat);
  scene.add(lines);

  // Inner glow sphere
  const glowGeom = new THREE.SphereGeometry(0.55, 32, 32);
  const glowMat = new THREE.MeshBasicMaterial({
    color: 0xc471ed,
    transparent: true,
    opacity: 0.18,
  });
  const glow = new THREE.Mesh(glowGeom, glowMat);
  scene.add(glow);

  // Interaction
  let targetRotX = 0, targetRotY = 0;
  let rotX = 0, rotY = 0;
  let dragging = false;
  let lastX = 0, lastY = 0;
  let autoRotate = true;

  mount.addEventListener('mousemove', (e) => {
    if (dragging) {
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      targetRotY += dx * 0.005;
      targetRotX += dy * 0.005;
      lastX = e.clientX;
      lastY = e.clientY;
    } else {
      const r = mount.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width - 0.5;
      const ny = (e.clientY - r.top) / r.height - 0.5;
      targetRotY = nx * 0.6;
      targetRotX = ny * 0.6;
    }
  });
  mount.addEventListener('mousedown', (e) => {
    dragging = true; autoRotate = false;
    lastX = e.clientX; lastY = e.clientY;
  });
  window.addEventListener('mouseup', () => { dragging = false; });
  mount.addEventListener('mouseleave', () => { dragging = false; });

  // Touch
  mount.addEventListener('touchstart', (e) => {
    if (!e.touches[0]) return;
    autoRotate = false;
    lastX = e.touches[0].clientX; lastY = e.touches[0].clientY;
    dragging = true;
  }, { passive: true });
  mount.addEventListener('touchmove', (e) => {
    if (!dragging || !e.touches[0]) return;
    const dx = e.touches[0].clientX - lastX;
    const dy = e.touches[0].clientY - lastY;
    targetRotY += dx * 0.005;
    targetRotX += dy * 0.005;
    lastX = e.touches[0].clientX;
    lastY = e.touches[0].clientY;
  }, { passive: true });
  mount.addEventListener('touchend', () => { dragging = false; });

  function onResize() {
    const s = size();
    renderer.setSize(s, s);
    camera.aspect = 1;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', onResize);

  const clock = new THREE.Clock();
  function animate() {
    const dt = clock.getDelta();
    if (autoRotate) {
      targetRotY += dt * 0.18;
    }
    rotX += (targetRotX - rotX) * 0.06;
    rotY += (targetRotY - rotY) * 0.06;
    cloud.rotation.x = rotX;
    cloud.rotation.y = rotY;
    lines.rotation.x = rotX;
    lines.rotation.y = rotY;
    glow.scale.setScalar(1 + Math.sin(clock.elapsedTime * 1.4) * 0.06);
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  animate();
}
