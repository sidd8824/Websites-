import * as THREE from 'three';
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
  scene.fog = new THREE.FogExp2('#050805', 0.012);
  const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 350);
  scene.add(new THREE.HemisphereLight('#b9d9ff', '#132d22', 2.8));
  const sun = new THREE.DirectionalLight('#d3e7ff', 4);
  sun.position.set(20, 35, 10);
  scene.add(sun);
  const warm = new THREE.DirectionalLight('#a091ff', 2);
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
  function building(group: THREE.Group, name: string, color: string, id: string) {
    const body = mesh(new THREE.BoxGeometry(10, 6, 7), dark, group, 0, 3.5);
    pick(body, id);
    mesh(new THREE.BoxGeometry(11, 0.35, 8), metal, group, 0, 6.7);
    for (let x = -4; x <= 4; x += 2) {
      mesh(new THREE.BoxGeometry(0.15, 6, 7.2), metal, group, x, 3.5);
      mesh(new THREE.BoxGeometry(1.4, 2.5, 0.08), glow(color), group, x, 3.5, 3.55);
    }
    const sign = label(name, '#ffffff', 9, 1.8);
    sign.position.set(0, 7.9, 3.5);
    group.add(sign);
    pick(sign, id);
    mesh(new THREE.BoxGeometry(3, 2.8, 0.3), dark, group, 0, 1.8, 3.8);
    for (let i = 0; i < 3; i++) mesh(new THREE.BoxGeometry(5 + i, 0.15, 0.8), metal, group, 0, 0.25 - i * 0.05, 4.1 + i * 0.7);
  }

  // A continuous route connects the landmarks in world coordinates.
  const roadPath = new THREE.CatmullRomCurve3(stops.map(s => new THREE.Vector3(s.x + 7, -0.15, s.z)));
  mesh(new THREE.TubeGeometry(roadPath, 180, 0.045, 5, false), glow('#67e8cf'), scene);
  stops.forEach((stop, index) => {
    const group = new THREE.Group();
    group.position.set(stop.x, 0, stop.z);
    scene.add(group);
    groups.push(group);
    mesh(new THREE.CylinderGeometry(8, 8.4, 0.45, 64), dark, group, 0, -0.5);
    ring(group, 8, -0.25, '#315d62');
    if (index === 0) {
      const title = label('B/Stack', '#ffffff', 15, 4);
      title.position.set(0, 5, 1);
      group.add(title);
      const subtitle = label('MAKE · BREAK · SHIP', '#67e8f9', 9, 1.2);
      subtitle.position.set(0, 2.3, 1);
      group.add(subtitle);
      for (let i = 0; i < 3; i++) {
        const portal = mesh(new THREE.TorusGeometry(7.5 + i * 0.3, 0.1, 10, 100, Math.PI), i === 0 ? glow('#67e8f9') : metal, group, 0, 1, -i * 0.7);
        portal.rotation.z = 0;
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
      building(group, 'PROJECTS', '#79b4e8', 'projects');
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
      building(group, 'THE CREW', '#ad92e7', 'team');
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
  function render() {
    progress += (target - progress) * (reduced ? 1 : 0.055);
    const a = Math.min(stops.length - 1, Math.floor(progress));
    const b = Math.min(stops.length - 1, a + 1);
    const raw = progress - a;
    const t = raw * raw * (3 - 2 * raw);
    const x = THREE.MathUtils.lerp(stops[a].x, stops[b].x, t);
    const z = THREE.MathUtils.lerp(stops[a].z, stops[b].z, t);
    const towerWeight = THREE.MathUtils.lerp(a === 4 ? 1 : 0, b === 4 ? 1 : 0, t);
    const mobile = camera.aspect < 0.8;
    const distance = mobile ? 32 : 24;
    camera.position.set(x + (mobile ? 1 : 9), 9 + towerWeight * 5, z + distance + towerWeight * 8);
    camera.lookAt(x, 3.8 + towerWeight * 7.5, z);
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
          geometries.add(object.geometry);
          for (const material of Array.isArray(object.material) ? object.material : [object.material]) materials.add(material);
        }
      });
      geometries.forEach(g => g.dispose());
      materials.forEach(m => m.dispose());
      textures.forEach(t => t.dispose());
      renderer.dispose();
    },
  };
}
