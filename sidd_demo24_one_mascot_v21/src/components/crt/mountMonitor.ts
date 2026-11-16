import {
  ACESFilmicToneMapping, CanvasTexture, DirectionalLight, HemisphereLight,
  Mesh, MeshBasicMaterial, PerspectiveCamera, PlaneGeometry, Raycaster, Scene, SRGBColorSpace,
  Texture, Vector2, WebGLRenderer,
} from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { drawEventScreen, SCREEN_HEIGHT, SCREEN_WIDTH, type ScreenState } from './eventScreen';
import { scrollPose } from './scrollPose';
import modelUrl from './relay-14.glb?url';

export async function mountMonitor(stage: HTMLDivElement, getState: () => ScreenState, signal: AbortSignal) {
  const source = await fetch(modelUrl, { signal });
  if (!source.ok) throw Error('Monitor model could not be loaded');
  const { scene: monitor } = await new GLTFLoader().parseAsync(await source.arrayBuffer(), '');
  const screen = monitor.getObjectByName('CRT_SCREEN') as Mesh | undefined;

  const disposeModel = () => {
    monitor.traverse(object => {
      if (!(object instanceof Mesh)) return;
      object.geometry.dispose();
      for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
        for (const property of Object.values(material)) {
          if (property instanceof Texture) property.dispose();
        }
        material.dispose();
      }
    });
  };
  let renderer: WebGLRenderer;
  try {
    signal.throwIfAborted();
    if (!screen?.isMesh) throw Error('Monitor screen mesh is missing');
    renderer = new WebGLRenderer({ alpha: true, antialias: true });
  } catch (error) {
    disposeModel();
    throw error;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.domElement.setAttribute('aria-hidden', 'true');
  stage.append(renderer.domElement);
  const scene = new Scene();
  scene.add(monitor);
  scene.add(new HemisphereLight(0xf8f1e0, 0x4c6470, 1.9));
  const key = new DirectionalLight(0xffe2c2, 2.25);
  key.position.set(-3, 6, 5);
  const rim = new DirectionalLight(0xc5e1ff, 1.55);
  rim.position.set(4, 3, -4);
  scene.add(key, rim);

  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = shadowCanvas.height = 64;
  const shadowContext = shadowCanvas.getContext('2d')!;
  const shade = shadowContext.createRadialGradient(32, 32, 2, 32, 32, 31);
  shade.addColorStop(0, '#000000dc');
  shade.addColorStop(.45, '#00000072');
  shade.addColorStop(1, '#00000000');
  shadowContext.fillStyle = shade;
  shadowContext.fillRect(0, 0, 64, 64);
  const shadowMap = new CanvasTexture(shadowCanvas);
  const shadow = new Mesh(
    new PlaneGeometry(4.5, 3.6),
    new MeshBasicMaterial({ map: shadowMap, transparent: true, depthWrite: false }),
  );
  shadow.rotation.x = -Math.PI / 2;
  scene.add(shadow);

  const camera = new PerspectiveCamera(38, 1, .1, 50);
  const art = document.createElement('canvas');
  art.width = SCREEN_WIDTH;
  art.height = SCREEN_HEIGHT;
  const context = art.getContext('2d')!;
  const texture = new CanvasTexture(art);
  texture.flipY = false;
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const blank = screen.material;
  for (const material of Array.isArray(blank) ? blank : [blank]) material.dispose();
  screen.material = new MeshBasicMaterial({ map: texture, toneMapped: false });

  const prefersReducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const ray = new Raycaster();
  const pointer = new Vector2();
  let lastScreen: ScreenState | undefined;
  let position = getState().selected;
  let pagePosition = getState().page ?? 0;
  let frame = 0;
  const grab = { x: 0, y: 0, targetX: 0, targetY: 0 };


  const progress = () => {
    if (prefersReducedMotion.matches) return 1;
    const rect = stage.getBoundingClientRect();
    const entry = innerHeight * 1.05;
    const center = Math.max(0, (innerHeight - rect.height) / 2);
    return Math.max(0, Math.min(1, (entry - rect.top) / (entry - center)));
  };
  const approach = (from: number, to: number) =>
    prefersReducedMotion.matches || Math.abs(from - to) < .002 ? to : from + (to - from) * .24;

  function render() {
    frame = 0;
    const ratio = stage.clientWidth / stage.clientHeight;
    if (!Number.isFinite(ratio) || ratio <= 0) return;
    const state = getState();
    const scroll = progress();
    const pose = scrollPose(state.page !== null ? 1 : scroll, 1, ratio, prefersReducedMotion.matches);
    grab.x = approach(grab.x, grab.targetX);
    grab.y = approach(grab.y, grab.targetY);
    monitor.rotation.set(grab.y * .22, pose.yaw + grab.x * .65, -grab.x * .06);
    monitor.position.set(grab.x * .28, pose.y + grab.y * .12, 0);
    shadow.position.set(monitor.position.x, pose.y - .025, .05);
    camera.position.fromArray(pose.camera);
    camera.lookAt(0, pose.aimY, .15 * pose.push);
    position = approach(position, state.selected);
    if (lastScreen?.page === null && state.page !== null) pagePosition = state.page;
    pagePosition = approach(pagePosition, state.page ?? 0);
    const display = { ...state, position, pagePosition, showEvents: scroll >= .87 || state.page !== null };
    if (!lastScreen || lastScreen.events !== display.events || lastScreen.position !== position ||
      lastScreen.selected !== state.selected || lastScreen.page !== state.page ||
      lastScreen.pagePosition !== pagePosition || lastScreen.showEvents !== display.showEvents) {
      drawEventScreen(context, display);
      texture.needsUpdate = true;
      lastScreen = display;
    }
    renderer.render(scene, camera);
    if (position !== state.selected || pagePosition !== (state.page ?? 0) ||
      grab.x !== grab.targetX || grab.y !== grab.targetY) invalidate();
  }

  function invalidate() {
    if (!frame && !signal.aborted) frame = requestAnimationFrame(render);
  }
  const observer = new ResizeObserver(() => {
    if (!stage.clientHeight || !stage.clientWidth) return;
    renderer.setSize(stage.clientWidth, stage.clientHeight, false);
    camera.aspect = stage.clientWidth / stage.clientHeight;
    camera.updateProjectionMatrix();
    invalidate();
  });
  observer.observe(stage);
  window.addEventListener('scroll', invalidate, { passive: true });
  window.addEventListener('resize', invalidate);
  prefersReducedMotion.addEventListener('change', invalidate);
  signal.addEventListener('abort', () => {
    cancelAnimationFrame(frame);
    observer.disconnect();
    window.removeEventListener('scroll', invalidate);
    window.removeEventListener('resize', invalidate);
    prefersReducedMotion.removeEventListener('change', invalidate);
    disposeModel();
    shadow.geometry.dispose();
    shadow.material.dispose();
    shadowMap.dispose();
    renderer.dispose();
    renderer.domElement.remove();
  }, { once: true });
  const pick = (clientX: number, clientY: number) => {
    const rect = stage.getBoundingClientRect();
    pointer.set(2 * (clientX - rect.left) / rect.width - 1, 1 - 2 * (clientY - rect.top) / rect.height);
    ray.setFromCamera(pointer, camera);
    return ray.intersectObject(monitor, true)[0];
  };
  return {
    invalidate,
    target(clientX: number, clientY: number) {
      const hit = pick(clientX, clientY);
      if (!hit) return null;
      return hit.object === screen && lastScreen?.showEvents ? 'screen' : 'cabinet';
    },
    moveGrab(dx: number, dy: number) {
      const scale = Math.max(100, stage.clientHeight * .34);
      grab.targetX = Math.max(-1, Math.min(1, dx / scale));
      grab.targetY = Math.max(-1, Math.min(1, dy / scale));
      invalidate();
    },
    hit(clientX: number, clientY: number) {
      if (!lastScreen?.showEvents) return null;
      const hit = pick(clientX, clientY);
      return hit?.object === screen ? hit.uv ?? null : null;
    },
  };
}
