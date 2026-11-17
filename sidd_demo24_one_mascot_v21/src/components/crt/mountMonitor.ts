import {
  ACESFilmicToneMapping, CanvasTexture, DirectionalLight, HemisphereLight,
  Mesh, MeshBasicMaterial, MeshStandardMaterial, PerspectiveCamera, PlaneGeometry, Raycaster, Scene, SRGBColorSpace,
  Texture, Vector2, Vector3, WebGLRenderer,
} from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { drawEventScreen, SCREEN_HEIGHT, SCREEN_WIDTH, type ScreenState } from './eventScreen';
import { createPushRobot } from './pushRobot';
import { scrollPose } from './scrollPose';
import modelUrl from './relay-14.glb?url';

function labelCabinet(controls: NonNullable<ReturnType<Scene['getObjectByName']>>) {
  const buttonY = .748;
  const faceZ = (x: number) => 1.472 - .041 * (x / 1.73) ** 2 - .029 * ((buttonY - 1.84) / 1.45) ** 2;
  function mark(x: number, z: number, width: number, height: number, ink: string,
    draw: (ctx: CanvasRenderingContext2D) => void) {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = ctx.fillStyle = ink;
    ctx.lineWidth = 13;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    draw(ctx);
    const map = new CanvasTexture(canvas);
    map.colorSpace = SRGBColorSpace;
    const label = new Mesh(
      new PlaneGeometry(width, height),
      new MeshBasicMaterial({ map, transparent: true, depthWrite: false, toneMapped: false }),
    );
    label.position.set(x, buttonY, z);
    // The printed marks pass pointer hits through to the molded buttons below.
    label.raycast = () => {};
    controls.add(label);
  }

  for (const [x, direction] of [[-.15, -1], [.28, 1]]) {
    mark(x, faceZ(x) + .0245, .062, .062, '#373027', ctx => {
      ctx.translate(64, 64);
      ctx.scale(direction, 1);
      ctx.beginPath();
      ctx.moveTo(-40, 0);
      ctx.lineTo(40, 0);
      ctx.moveTo(12, -27);
      ctx.lineTo(40, 0);
      ctx.lineTo(12, 27);
      ctx.stroke();
    });
  }
  mark(.066, faceZ(0) + .0345, .108, .043, '#373027', ctx => {
    ctx.font = '900 83px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('OK', 64, 68, 120);
  });
  mark(1.28, faceZ(1.28) + .0475, .108, .108, '#e2b77c', ctx => {
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.arc(64, 67, 33, -Math.PI / 3, 4 * Math.PI / 3);
    ctx.moveTo(64, 18);
    ctx.lineTo(64, 54);
    ctx.stroke();
  });
}

export async function mountMonitor(stage: HTMLDivElement, getState: () => ScreenState, signal: AbortSignal) {
  const source = await fetch(modelUrl, { signal });
  if (!source.ok) throw Error('Monitor model could not be loaded');
  const { scene: monitor } = await new GLTFLoader().parseAsync(await source.arrayBuffer(), '');
  const screenCandidate = monitor.getObjectByName('CRT_SCREEN') as Mesh | undefined;

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
    if (!screenCandidate?.isMesh) throw Error('Monitor screen mesh is missing');
    renderer = new WebGLRenderer({ alpha: true, antialias: true });
  } catch (error) {
    disposeModel();
    throw error;
  }
  const screen = screenCandidate;

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.domElement.setAttribute('aria-hidden', 'true');
  stage.append(renderer.domElement);
  const scene = new Scene();
  const pusher = createPushRobot();
  scene.add(monitor, pusher.robot);
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
  const robotShadow = new Mesh(new PlaneGeometry(1.8, 1.3), shadow.material);
  robotShadow.rotation.x = -Math.PI / 2;
  scene.add(shadow, robotShadow);

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
  const screenOn = new MeshBasicMaterial({ map: texture, toneMapped: false });
  const screenOff = new MeshStandardMaterial({ color: 0x070b0a, roughness: .34 });
  screen.material = screenOn;
  const indicator = monitor.getObjectByName('Green_power_indicator') as Mesh | undefined;
  const light = indicator?.material instanceof MeshStandardMaterial ? indicator.material : undefined;
  const frontControls = monitor.getObjectByName('Front_controls');
  if (frontControls) labelCabinet(frontControls);

  const prefersReducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const ray = new Raycaster();
  const pointer = new Vector2();
  const local = new Vector3();
  const keyCenters = { previous: -.15, select: .066, next: .28, power: 1.28 };
  const cabinetKeys = Object.entries(keyCenters).map(([key, x]) => ({
    button: stage.querySelector<HTMLButtonElement>(`[data-crt-key="${key}"]`),
    x,
  }));
  let lastScreen: ScreenState | undefined;
  let position = getState().selected;
  let pagePosition = getState().page ?? 0;
  let frame = 0;
  let entrance = 0;
  let focus = 0;
  let focusMotion = { from: 0, to: 0, started: 0 };
  const grab = { x: 0, y: 0, targetX: 0, targetY: 0 };


  const progress = () => {
    if (prefersReducedMotion.matches) return 1;
    const rect = stage.getBoundingClientRect();
    const entry = innerHeight * .98;
    const center = Math.max(0, (innerHeight - rect.height) / 2);
    return Math.max(0, Math.min(1, (entry - rect.top) / (entry - center)));
  };
  const approach = (from: number, to: number) =>
    prefersReducedMotion.matches || Math.abs(from - to) < .002 ? to : from + (to - from) * .24;

  function render(now: number) {
    frame = 0;
    const ratio = stage.clientWidth / stage.clientHeight;
    if (!Number.isFinite(ratio) || ratio <= 0) return;
    const state = getState();
    const entranceTarget = state.showEvents ? 1 : progress();
    entrance = approach(entrance, entranceTarget);
    const focusTarget = state.showEvents && entrance >= .97 ? 1 : 0;
    if (focusMotion.to !== focusTarget) {
      focusMotion = { from: focus, to: focusTarget, started: now };
    }
    const elapsed = prefersReducedMotion.matches ? 1 : Math.min(1, (now - focusMotion.started) / 780);
    const eased = elapsed * elapsed * (3 - 2 * elapsed);
    focus = elapsed === 1 ? focusTarget : focusMotion.from + (focusTarget - focusMotion.from) * eased;
    grab.x = approach(grab.x, grab.targetX);
    grab.y = approach(grab.y, grab.targetY);
    const pose = scrollPose(entrance, ratio, focus, grab.x, grab.y);
    monitor.rotation.set(grab.y * .22, grab.x * .65, -grab.x * .06);
    monitor.position.set(pose.x + grab.x * .28, grab.y * .12, 0);
    shadow.position.set(monitor.position.x, -.025, .05);
    pusher.robot.position.set(pose.x - 2.48 - 3.15 * focus, 0, .69);
    pusher.pose(pose.travel, prefersReducedMotion.matches, focus);
    robotShadow.position.set(pusher.robot.position.x - .18, -.022, .69);
    camera.position.set(pose.cameraX, pose.cameraY, pose.cameraZ);
    camera.lookAt(pose.aimX, pose.aimY, pose.aimZ);
    position = approach(position, state.selected);
    if (lastScreen?.page === null && state.page !== null) pagePosition = state.page;
    pagePosition = approach(pagePosition, state.page ?? 0);
    if (lastScreen?.powered !== state.powered) {
      screen.material = state.powered ? screenOn : screenOff;
      if (light) {
        light.color.setHex(state.powered ? 0xa5f982 : 0x283529);
        light.emissiveIntensity = state.powered ? .75 : 0;
      }
    }
    const display = { ...state, position, pagePosition, showEvents: state.showEvents && focus > .38 };
    if (!lastScreen || lastScreen.events !== display.events || lastScreen.position !== position ||
      lastScreen.selected !== state.selected || lastScreen.page !== state.page ||
      lastScreen.pagePosition !== pagePosition || lastScreen.showEvents !== display.showEvents ||
      lastScreen.powered !== state.powered) {
      drawEventScreen(context, display);
      texture.needsUpdate = true;
      lastScreen = display;
    }
    renderer.render(scene, camera);
    for (const { button, x } of cabinetKeys) {
      if (!button) continue;
      local.set(x, .748, 1.49).applyMatrix4(monitor.matrixWorld).project(camera);
      button.style.left = `${(local.x + 1) * 50}%`;
      button.style.top = `${(1 - local.y) * 50}%`;
    }
    if (position !== state.selected || pagePosition !== (state.page ?? 0) ||
      grab.x !== grab.targetX || grab.y !== grab.targetY || entrance !== entranceTarget ||
      focus !== focusTarget) invalidate();
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
    screen.material = screenOff;
    disposeModel();
    screenOn.dispose();
    texture.dispose();
    pusher.dispose();
    robotShadow.geometry.dispose();
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
    moveGrab(dx: number, dy: number) {
      const scale = Math.max(100, stage.clientHeight * .34);
      grab.targetX = Math.max(-1, Math.min(1, dx / scale));
      grab.targetY = Math.max(-1, Math.min(1, dy / scale));
      invalidate();
    },
    hit(clientX: number, clientY: number) {
      const hit = pick(clientX, clientY);
      if (!hit) return null;
      if (hit.object === screen && hit.uv) return { kind: 'screen' as const, uv: hit.uv };
      local.copy(hit.point);
      monitor.worldToLocal(local);
      if (hit.object.parent === frontControls && local.y > .66 && local.y < .85) {
        if (local.x > 1.16 && local.x < 1.40) return { kind: 'power' as const };
        if (local.x >= -.215 && local.x < -.089) return { kind: 'previous' as const };
        if (local.x >= -.089 && local.x < .215) return { kind: 'select' as const };
        if (local.x >= .215 && local.x < .355) return { kind: 'next' as const };
      }
      return { kind: 'cabinet' as const };
    },
  };
}
