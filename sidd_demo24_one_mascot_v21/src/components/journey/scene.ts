import * as THREE from 'three';
import { buildLandscape } from './landscape';
import { EVENTS, VERTICALS } from '../../data/club';

export const stops = [
  { id: 'home', label: 'B/Stack', x: 0, z: 0 },
  { id: 'about', label: 'About', x: -18, z: -32 },
  { id: 'verticals', label: 'Verticals', x: 12, z: -65 },
  { id: 'projects', label: 'Projects', x: -15, z: -100 },
  { id: 'events', label: 'Events', x: 13, z: -138 },
  { id: 'team', label: 'Crew', x: -14, z: -177 },
  { id: 'join', label: 'Join', x: 0, z: -212 },
];

export function createJourney(canvas: HTMLCanvasElement, onSelect: (id: string) => void) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.35;
  const scene = new THREE.Scene();
  const daySky = new THREE.Color('#c8dde7');
  const nightSky = new THREE.Color('#101e34');
  const sky = daySky.clone();
  scene.background = sky;
  const fog = new THREE.FogExp2(daySky, 0.006);
  scene.fog = fog;
  const starPositions = Array.from({ length: 450 }, (_, i) => [
    Math.sin(i * 21.7) * 240, 46 + (i * 13 % 125), -282 + Math.cos(i * 14.1) * 150,
  ]).flat();
  const starsGeometry = new THREE.BufferGeometry();
  starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
  const starMaterial = new THREE.PointsMaterial({ color: '#d3dcee', transparent: true, opacity: 0, size: 0.55 });
  scene.add(new THREE.Points(starsGeometry, starMaterial));
  const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 350);
  const ambient = new THREE.HemisphereLight('#cadff4', '#5a6747', 2.15);
  scene.add(ambient);
  const sun = new THREE.DirectionalLight('#ffeed2', 2.5);
  sun.position.set(20, 35, 10);
  scene.add(sun);
  const warm = new THREE.DirectionalLight('#849dca', 0.7);
  warm.position.set(-30, 12, -30);
  scene.add(warm);
  const metal = new THREE.MeshStandardMaterial({ color: '#697b91', metalness: 0.72, roughness: 0.34 });
  const dark = new THREE.MeshStandardMaterial({ color: '#111d28', metalness: 0.5, roughness: 0.42 });
  const targets: THREE.Object3D[] = [];
  const textures: THREE.Texture[] = [];
  const groups: THREE.Group[] = [];

  function mesh(geometry: THREE.BufferGeometry, material: THREE.Material, parent: THREE.Object3D, x = 0, y = 0, z = 0) {
    const object = new THREE.Mesh(geometry, material);
    object.position.set(x, y, z);
    parent.add(object);
    return object;
  }
  function glow(color: string) {
    return new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 1.2, roughness: 0.45 });
  }
  function label(text: string, color = '#e6edf7', width = 8, height = 2) {
    const surface = document.createElement('canvas');
    surface.width = 1024;
    surface.height = 256;
    const ctx = surface.getContext('2d')!;
    ctx.clearRect(0, 0, 1024, 256);
    ctx.fillStyle = color;
    ctx.font = 'bold 100px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const lines = text.split('\n');
    ctx.font = `bold ${lines.length > 1 ? 75 : 100}px Arial`;
    lines.forEach((line, index) => ctx.fillText(line, 512, 128 + (index - (lines.length - 1) / 2) * 85, 980));
    const texture = new THREE.CanvasTexture(surface);
    textures.push(texture);
    return new THREE.Mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide }));
  }
  function ring(parent: THREE.Object3D, radius: number, y: number, color: string) {
    const rim = mesh(new THREE.TorusGeometry(radius, 0.065, 8, 80), glow(color), parent, 0, y);
    rim.rotation.x = Math.PI / 2;
  }
  function pick(object: THREE.Object3D, id: string) {
    object.userData.action = id;
    targets.push(object);
  }
  const stone = new THREE.MeshStandardMaterial({ color: '#d9ccb1', roughness: 0.91 });
  const roof = new THREE.MeshStandardMaterial({ color: '#a8432e', roughness: 0.79 });
  const glazing = new THREE.MeshStandardMaterial({ color: '#254355', roughness: 0.45 });
  function building(group: THREE.Group, name: string, color: string, id: string) {
    const modern = id === 'projects';
    const height = modern ? 13 : 7;
    const body = mesh(new THREE.BoxGeometry(13, height, 9), modern ? glazing : stone, group, 0, height / 2);
    pick(body, id);
    for (let level = 3; level < height; level += 2.5) {
      mesh(new THREE.BoxGeometry(13.3, 0.18, 9.35), stone, group, 0, level);
      for (let column = -5; column <= 5; column += 2) {
        const pane = mesh(new THREE.BoxGeometry(1.1, 1.45, 0.09), modern && (column + level) % 3 > 0.9 ? glow('#c7a467') : glazing, group, column, level - 1.15, 4.53);
        pick(pane, id);
      }
    }
    if (modern) {
      mesh(new THREE.BoxGeometry(13.6, 0.42, 9.65), stone, group, 0, height);
      for (let x = -6; x <= 6; x += 2) {
        mesh(new THREE.BoxGeometry(0.16, height, 0.17), stone, group, x, height / 2, 4.58);
      }
    } else {
      const canopy = mesh(new THREE.ConeGeometry(9.6, 3.5, 4), roof, group, 0, height + 1.6);
      canopy.rotation.y = Math.PI / 4;
      canopy.scale.z = 0.72;
      mesh(new THREE.BoxGeometry(13.7, 0.3, 2.8), stone, group, 0, 4.5, 5.9);
      for (const x of [-5.6, -3.4, 3.4, 5.6]) {
        mesh(new THREE.CylinderGeometry(0.21, 0.25, 4.4, 12), stone, group, x, 2.2, 6.8);
      }
    }
    const signHeight = modern ? height - 0.85 : 5.35;
    mesh(new THREE.BoxGeometry(10.5, 1.5, 0.24), modern ? dark : roof, group, 0, signHeight, 4.8);
    const sign = label(name, color, 9, 2.5);
    sign.position.set(0, signHeight, 4.95);
    group.add(sign);
    pick(sign, id);
    const door = mesh(new THREE.BoxGeometry(3, 2.8, 0.32), glazing, group, 0, 1.45, 4.65);
    pick(door, id);
    for (let i = 0; i < 3; i++) mesh(new THREE.BoxGeometry(6 + i, 0.25, 0.8), stone, group, 0, 0.27 - i * 0.09, 4.8 + i * 0.72);
  }

  const roadPath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-7, -0.26, 42),
    ...stops.map(s => new THREE.Vector3(s.x + 13, -0.26, s.z)),
    new THREE.Vector3(22, -0.26, -249),
  ]);
  const animateLandscape = buildLandscape(scene, roadPath);
  const moon = mesh(new THREE.SphereGeometry(3.5, 32, 24), new THREE.MeshStandardMaterial({ color: '#aaaeb1', emissive: '#616875', emissiveIntensity: 0.45 }), scene, 40, 54, -295);
  moon.visible = false;
  stops.forEach((stop, index) => {
    const group = new THREE.Group();
    group.position.set(stop.x, 0, stop.z);
    scene.add(group);
    groups.push(group);
    mesh(new THREE.BoxGeometry(15, 0.28, 15), stone, group, 0, -0.26);
    if (index === 0) {
      const title = label('B/Stack', '#ffffff', 15, 4);
      title.position.set(0, 5, 1);
      group.add(title);
      const subtitle = label('MAKE · BREAK · SHIP', '#67e8f9', 9, 1.2);
      subtitle.position.set(0, 2.3, 1);
      group.add(subtitle);
      mesh(new THREE.BoxGeometry(11, 4.2, 0.45), dark, group, 0, 4, 0.65);
      mesh(new THREE.BoxGeometry(12, 0.38, 0.85), stone, group, 0, 6.35, 0.6);
      for (const x of [-5.4, 5.4]) {
        mesh(new THREE.BoxGeometry(0.65, 6.4, 1.2), stone, group, x, 3.15, 0.55);
      }
      pick(title, 'home');
    } else if (index === 1) {
      const title = label('STUDENT BUILDERS', '#ffffff', 11, 1.5);
      title.position.set(0, 7, 0);
      group.add(title);
      ['140+ MEMBERS', '42+ PROJECTS', '28+ EVENTS', '4 VERTICALS'].forEach((text, i) => {
        const panel = mesh(new THREE.BoxGeometry(4.6, 2.2, 0.35), dark, group, (i % 2 - 0.5) * 5, 4.9 - Math.floor(i / 2) * 2.7);
        const sign = label(text, ['#a99bff', '#67e8f9', '#ff996a', '#78dec0'][i], 4.3, 1);
        sign.position.z = 0.2;
        panel.add(sign);
        pick(panel, 'about');
      });
    } else if (index === 2) {
      mesh(new THREE.CylinderGeometry(0.3, 0.3, 11, 24), metal, group, 0, 5);
      Object.values(VERTICALS).forEach((vertical, i) => {
        const y = 2 + i * 2.2;
        mesh(new THREE.CylinderGeometry(3.7, 3.7, 1.5, 64, 1, true), new THREE.MeshStandardMaterial({ color: vertical.color, metalness: 0.45, roughness: 0.35, side: THREE.DoubleSide }), group, 0, y);
        ring(group, 3.75, y + 0.8, vertical.color);
        ring(group, 3.75, y - 0.8, '#9cbdce');
        const sign = label(vertical.name, '#ffffff', 4, 1.3);
        sign.position.set(0, y, 3.85);
        group.add(sign);
        pick(sign, 'verticals');
      });
    } else if (index === 3) {
      building(group, 'PROJECTS', '#fff1ca', 'projects');
      const rover = new THREE.Group();
      rover.position.set(5, 0.4, 5);
      mesh(new THREE.BoxGeometry(1.8, 0.6, 2.5), metal, rover, 0, 0.5);
      for (const x of [-1, 1]) for (const z of [-0.8, 0.8]) {
        const wheel = mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.3, 16), dark, rover, x, 0.2, z);
        wheel.rotation.z = Math.PI / 2;
      }
      group.add(rover);
      pick(rover, 'projects');
    } else if (index === 4) {
      mesh(new THREE.CylinderGeometry(0.5, 0.75, 12, 32), metal, group, 0, 6);
      for (let i = 0; i < 12; i++) {
        const angle = i * Math.PI / 6;
        mesh(new THREE.CylinderGeometry(0.04, 0.04, 12, 8), metal, group, Math.sin(angle) * 0.57, 6, Math.cos(angle) * 0.57);
      }
      mesh(new THREE.CylinderGeometry(4.6, 1, 1.5, 64), dark, group, 0, 11.5);
      mesh(new THREE.CylinderGeometry(4.6, 4.6, 4, 64), metal, group, 0, 14);
      mesh(new THREE.CylinderGeometry(3.8, 4.7, 0.8, 64), dark, group, 0, 16.3);
      mesh(new THREE.CylinderGeometry(0.06, 0.12, 3, 12), metal, group, 0, 18);
      mesh(new THREE.SphereGeometry(0.13), glow('#ff8e59'), group, 0, 19.5);
      ring(group, 4.65, 12, '#67e8f9');
      ring(group, 4.65, 16, '#67e8f9');
      const events = EVENTS.filter(e => e.status === 'upcoming');
      events.forEach((event, i) => {
        const angle = (i - 1) * 1.25;
        const banner = mesh(new THREE.CylinderGeometry(4.85, 4.85, 2.8, 24, 1, true, angle - 0.47, 0.94), new THREE.MeshStandardMaterial({ color: event.verticalColor, roughness: 0.55, side: THREE.DoubleSide }), group, 0, 14);
        pick(banner, event.id);
        const name = label(event.vertical + '\n' + event.title.replace(/^B\/\w+:?\s*/, '').split(' ').slice(0, 3).join(' '), '#ffffff', 4, 1.4);
        name.position.set(Math.sin(angle) * 4.95, 14, Math.cos(angle) * 4.95);
        name.rotation.y = angle;
        group.add(name);
        pick(name, event.id);
      });
    } else if (index === 5) {
      building(group, 'THE CREW', '#fff1ca', 'team');
    } else {
      const title = label('YOUR PLACE IN THE STACK', '#ffffff', 12, 1.5);
      title.position.set(0, 7, 0);
      group.add(title);
      for (let i = 0; i < 4; i++) {
        mesh(new THREE.BoxGeometry(6, 0.8, 4), metal, group, 0, 0.7 + i);
        ring(group, 3.8, 0.7 + i, ['#7f77dd', '#1d9e75', '#d85a30', '#378add'][i]);
      }
      const slot = mesh(new THREE.BoxGeometry(6.3, 0.12, 4.3), glow('#67e8f9'), group, 0, 5.3);
      pick(slot, 'join');
      const sign = label('JOIN B/STACK ↗', '#67e8f9', 6, 1);
      sign.position.set(0, 5.8, 2.5);
      group.add(sign);
      pick(sign, 'join');
    }
  });

  let progress = 0;
  let target = 0;
  let frame = 0;
  let rotation = 0;
  let downX: number | null = null;
  let dragged = false;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const raycaster = new THREE.Raycaster();
  function hit(event: PointerEvent) {
    const rect = canvas.getBoundingClientRect();
    raycaster.setFromCamera(new THREE.Vector2((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1), camera);
    const hits = raycaster.intersectObjects(targets, true);
    if (!hits.length) return null;
    let object: THREE.Object3D | null = hits[0].object;
    while (object && !object.userData.action) object = object.parent;
    return object?.userData.action as string | undefined;
  }
  function pointerDown(event: PointerEvent) { downX = event.clientX; dragged = false; }
  function pointerMove(event: PointerEvent) {
    if (downX !== null && Math.round(progress) === 4) {
      const delta = event.clientX - downX;
      if (Math.abs(delta) > 3) dragged = true;
      rotation += delta * 0.008;
      downX = event.clientX;
    }
    canvas.style.cursor = hit(event) ? 'pointer' : Math.round(progress) === 4 ? 'grab' : 'default';
  }
  function pointerUp(event: PointerEvent) {
    if (downX !== null && !dragged) {
      const id = hit(event);
      if (id) onSelect(id);
    }
    downX = null;
  }
  canvas.addEventListener('pointerdown', pointerDown);
  canvas.addEventListener('pointermove', pointerMove);
  window.addEventListener('pointerup', pointerUp);
  function resize() {
    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
  }
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  resize();
  const moonlight = new THREE.Color('#bccfee');
  function render(now = 0) {
    progress += (target - progress) * (reduced ? 1 : 0.055);
    const a = Math.min(stops.length - 1, Math.floor(progress));
    const b = Math.min(stops.length - 1, a + 1);
    const raw = progress - a;
    const t = raw * raw * (3 - 2 * raw);
    const x = THREE.MathUtils.lerp(stops[a].x, stops[b].x, t);
    const z = THREE.MathUtils.lerp(stops[a].z, stops[b].z, t);
    const towerWeight = THREE.MathUtils.lerp(a === 4 ? 1 : 0, b === 4 ? 1 : 0, t);
    const mobile = canvas.clientWidth <= 750;
    const distance = mobile ? 35 : 30;
    camera.position.set(x + (mobile ? 2 : 14), 17 + towerWeight * 2, z + distance + towerWeight * 4);
    camera.lookAt(x - (mobile ? 0 : 8), (mobile ? 6.5 : 3.5) + towerWeight * 6.8, z - 1);
    const dusk = THREE.MathUtils.smoothstep(progress, 2.9, 5.35);
    sky.copy(daySky).lerp(nightSky, dusk);
    fog.color.copy(sky);
    fog.density = THREE.MathUtils.lerp(0.0055, 0.0045, dusk);
    ambient.intensity = THREE.MathUtils.lerp(2.15, 0.62, dusk);
    sun.intensity = THREE.MathUtils.lerp(2.5, 0.85, dusk);
    sun.color.set('#ffeed2').lerp(moonlight, dusk);
    starMaterial.opacity = dusk * 0.76;
    moon.visible = dusk > 0.7;
    animateLandscape(reduced ? 0 : now * 0.001);
    groups[4].rotation.y = rotation;
    renderer.render(scene, camera);
    frame = requestAnimationFrame(render);
  }
  render();
  return {
    setProgress(value: number) { target = Math.max(0, Math.min(6, value)); },
    dispose() {
      cancelAnimationFrame(frame);
      observer.disconnect();
      canvas.removeEventListener('pointerdown', pointerDown);
      canvas.removeEventListener('pointermove', pointerMove);
      window.removeEventListener('pointerup', pointerUp);
      const geometries = new Set<THREE.BufferGeometry>();
      const materials = new Set<THREE.Material>();
      scene.traverse(object => {
        if (object instanceof THREE.Mesh) {
          if (object instanceof THREE.InstancedMesh) object.dispose();
          geometries.add(object.geometry);
          for (const material of Array.isArray(object.material) ? object.material : [object.material]) materials.add(material);
        }
      });
      geometries.forEach(g => g.dispose());
      materials.forEach(m => m.dispose());
      starsGeometry.dispose();
      starMaterial.dispose();
      textures.forEach(t => t.dispose());
      renderer.dispose();
    },
  };
}
