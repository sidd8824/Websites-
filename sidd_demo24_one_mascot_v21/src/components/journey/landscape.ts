import * as THREE from 'three';

export function buildLandscape(scene: THREE.Scene, route: THREE.CatmullRomCurve3) {
  const material = (color: string) => new THREE.MeshStandardMaterial({ color, roughness: 0.85 });
  const grass = material('#778646');
  const sidewalk = material('#a6a08b');
  const asphalt = material('#2e393c');
  const clay = material('#a3492c');
  const cream = material('#ded4be');
  const glass = material('#263944');
  const wood = material('#483728');
  const leaves = [material('#526638'), material('#667a38'), material('#38552e')];
  const gold = new THREE.MeshStandardMaterial({ color: '#e99536', emissive: '#ee781a', emissiveIntensity: 0.34 });
  const windowLight = new THREE.MeshStandardMaterial({ color: '#e5ca87', emissive: '#d6a44b', emissiveIntensity: 0.4 });
  const boxGeometry = new THREE.BoxGeometry();
  const treeGeometry = new THREE.IcosahedronGeometry(1, 0);
  const roofGeometry = new THREE.CylinderGeometry(1, 1, 1, 3);
  const trunkGeometry = new THREE.CylinderGeometry(0.65, 1, 1, 7);
  const fixtures = new THREE.Group();
  scene.add(fixtures);

  function object(geometry: THREE.BufferGeometry, surface: THREE.Material, x: number, y: number, z: number, parent: THREE.Object3D = fixtures) {
    const mesh = new THREE.Mesh(geometry, surface);
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  }
  function box(surface: THREE.Material, x: number, y: number, z: number, w: number, h: number, d: number, parent?: THREE.Object3D) {
    const mesh = object(boxGeometry, surface, x, y, z, parent);
    mesh.scale.set(w, h, d);
    return mesh;
  }

  // Variation in the ground color follows world coordinates so it stays put as the camera flies.
  const terrain = new THREE.PlaneGeometry(620, 760, 100, 120);
  terrain.rotateX(-Math.PI / 2);
  const color = new THREE.Color();
  const colors: number[] = [];
  const points = terrain.getAttribute('position');
  for (let i = 0; i < points.count; i++) {
    const x = points.getX(i);
    const z = points.getZ(i);
    color.set('#778649').multiplyScalar(0.88 + 0.085 * Math.sin(x * 0.21 + z * 0.16) + 0.035 * Math.cos(z * 1.25 - x * 0.55));
    colors.push(color.r, color.g, color.b);
  }
  terrain.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  grass.color.set('#ffffff');
  grass.vertexColors = true;
  object(terrain, grass, -254, -0.44, -114);
  const water = new THREE.MeshStandardMaterial({ color: '#4f90a7', roughness: 0.36, metalness: 0.12 });
  box(water, 130, -0.73, -112, 150, 0.38, 580);
  box(water, 0, -0.62, -259, 150, 0.43, 16);
  box(sidewalk, 54, -0.19, -91, 4.6, 0.49, 294);
  box(cream, 56.3, -0.1, -91, 0.4, 0.7, 294);

  const sampleCount = 220;
  const tangent = new THREE.Vector3();
  function ribbon(surface: THREE.Material, offset: number, width: number, elevation: number) {
    const vertices: number[] = [];
    const indices: number[] = [];
    for (let i = 0; i <= sampleCount; i++) {
      const t = i / sampleCount;
      const p = route.getPoint(t);
      route.getTangent(t, tangent);
      for (const side of [-1, 1]) {
        const shift = offset + side * width / 2;
        vertices.push(p.x - tangent.z * shift, p.y + elevation, p.z + tangent.x * shift);
      }
      if (i) {
        const a = 2 * i;
        indices.push(a - 2, a - 1, a, a, a - 1, a + 1);
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    surface.side = THREE.DoubleSide;
    object(geometry, surface, 0, 0, 0);
  }
  ribbon(sidewalk, 0, 11.5, 0);
  ribbon(asphalt, 0, 8.4, 0.035);
  ribbon(gold, -0.15, 0.12, 0.055);
  ribbon(gold, 0.15, 0.12, 0.055);
  ribbon(cream, -3.9, 0.11, 0.055);
  ribbon(cream, 3.9, 0.11, 0.055);

  const roadLength = route.getLength();
  function roadPoint(t: number, offset: number) {
    const point = route.getPointAt(t);
    route.getTangentAt(t, tangent);
    point.x -= tangent.z * offset;
    point.z += tangent.x * offset;
    return point;
  }
  for (let i = 1; i < Math.floor(roadLength / 9); i++) {
    const t = i * 9 / roadLength;
    const side = i % 2 === 0 ? 5.25 : -5.25;
    const p = roadPoint(t, side);
    const lamp = new THREE.Group();
    lamp.position.set(p.x, p.y, p.z);
    lamp.rotation.y = Math.atan2(tangent.x, tangent.z);
    fixtures.add(lamp);
    box(glass, 0, 1.65, 0, 0.11, 3.3, 0.11, lamp);
    box(glass, Math.sign(side) * 0.4, 3.24, 0, 0.85, 0.1, 0.12, lamp);
    box(windowLight, Math.sign(side) * 0.79, 3.2, 0, 0.34, 0.13, 0.23, lamp);
  }

  function house(x: number, z: number, turns: number, floors: number) {
    const house = new THREE.Group();
    house.position.set(x, 0, z);
    house.rotation.y = turns;
    fixtures.add(house);
    const height = floors * 2.7;
    box(sidewalk, 0, -0.17, 0, 8, 0.25, 8, house);
    box(cream, 0, height / 2, 0, 6.5, height, 5.4, house);
    // Triangular prism with its ridge parallel to the street facade.
    const roof = object(roofGeometry, clay, 0, height + 0.35, 0, house);
    roof.rotation.set(0, 0, Math.PI / 2);
    roof.scale.set(1.45, 7.1, 3.35);
    for (let level = 0; level < floors; level++) {
      const y = 1.48 + level * 2.7;
      for (const x of [-2.1, 0, 2.1]) {
        box(glass, x, y, 2.73, 1.23, 1.64, 0.07, house);
        box(wood, x - 0.75, y, 2.77, 0.21, 1.64, 0.09, house);
        box(wood, x + 0.75, y, 2.77, 0.21, 1.64, 0.09, house);
      }
      box(cream, 0, y - 1, 2.85, 6.72, 0.13, 0.26, house);
    }
    box(clay, 0, 2.45, 3.3, 4.7, 0.16, 1.45, house).rotation.x = -0.12;
    for (const x of [-2, 2]) box(wood, x, 1.08, 3.92, 0.1, 2.25, 0.11, house);
  }

  function palm(x: number, z: number, height: number, seed: number) {
    const trunk = object(trunkGeometry, wood, x, height * 0.49 - 0.3, z);
    trunk.scale.set(0.15, height, 0.15);
    trunk.rotation.z = 0.06 * Math.cos(seed);
    for (let i = 0; i < 8; i++) {
      const angle = i * Math.PI / 4 + seed;
      for (let segment = 1; segment <= 3; segment++) {
        const distance = segment * 0.65;
        const leaf = object(treeGeometry, leaves[i % 3], x + Math.cos(angle) * distance, height - 0.34 - 0.14 * segment * segment, z + Math.sin(angle) * distance);
        leaf.rotation.y = -angle;
        leaf.rotation.z = -segment * 0.2;
        leaf.scale.set(0.86, 0.15, 0.32 - 0.05 * segment);
      }
    }
  }
  for (let i = 0; i < 15; i++) {
    const z = 13 - i * 12;
    const x = i % 2 ? 34 : -34;
    house(x, z, i % 2 ? -0.7 : 0.4, i % 3 ? 1 : 2);
    palm(x + (i % 2 ? 8 : -7), z + 3, 6 + i % 4, i);
  }
  for (let i = 0; i < 15; i++) {
    const x = -38 + (i % 8) * 11;
    const z = -229 - Math.floor(i / 8) * 19 - 4 * Math.sin(i);
    const height = 9 + (i * 13 % 19);
    box(glass, x, height / 2, z, 7, height, 6);
    box(cream, x, height, z, 7.25, 0.26, 6.25);
    for (let level = 2; level < height; level += 2) {
      box(sidewalk, x, level, z + 3.06, 7, 0.075, 0.07);
      for (let column = -2; column <= 2; column++) {
        if ((i + level + column * 3) % 5 < 2) box(windowLight, x + column * 1.24, level - 0.55, z + 3.07, 0.67, 0.53, 0.08);
      }
    }
  }

  // Cable spans above a river behind the last stop.
  const bridge = new THREE.Group();
  bridge.position.set(15, 1, -259);
  fixtures.add(bridge);
  box(asphalt, 0, 0, 0, 110, 0.7, 8, bridge);
  for (const x of [-27, 27]) {
    for (const z of [-4, 4]) box(cream, x, 8, z, 1.1, 17, 1.1, bridge);
    box(cream, x, 15, 0, 1.1, 0.8, 9.1, bridge);
    for (let i = 1; i <= 7; i++) {
      for (const side of [-1, 1]) for (const z of [-4, 4]) {
        const start = new THREE.Vector3(x, 15 - i * 0.4, z);
        const end = new THREE.Vector3(x + side * i * 3.6, 0.5, z);
        const delta = end.clone().sub(start);
        const middle = start.addScaledVector(delta, 0.5);
        const cable = box(gold, middle.x, middle.y, middle.z, 0.08, delta.length(), 0.08, bridge);
        cable.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize());
      }
    }
  }

  fixtures.updateMatrixWorld(true);
  const batches = new Map<string, THREE.Mesh[]>();
  fixtures.traverse(node => {
    if (!(node instanceof THREE.Mesh)) return;
    if (node.geometry !== boxGeometry && node.geometry !== treeGeometry) return;
    const key = node.geometry.uuid + node.material.uuid;
    const batch = batches.get(key) ?? [];
    batch.push(node);
    batches.set(key, batch);
  });
  batches.forEach(batch => {
    const source = batch[0];
    const instances = new THREE.InstancedMesh(source.geometry, source.material, batch.length);
    batch.forEach((mesh, i) => {
      instances.setMatrixAt(i, mesh.matrixWorld);
      mesh.removeFromParent();
    });
    instances.computeBoundingSphere();
    fixtures.add(instances);
  });

  const cars = ['#bd573e', '#346587', '#e5ddc1', '#88753d', '#2d5053'].map((color, i) => {
    const car = new THREE.Group();
    const paint = material(color);
    box(paint, 0, 0.44, 0, 1.43, 0.53, 2.8, car);
    box(glass, 0, 0.8, -0.2, 1.25, 0.48, 1.43, car);
    box(paint, 0, 1.035, -0.2, 1.26, 0.075, 1.36, car);
    for (const x of [-0.69, 0.69]) for (const z of [-0.86, 0.86]) box(wood, x, 0.22, z, 0.28, 0.4, 0.46, car);
    fixtures.add(car);
    return { car, phase: i / 5, lane: i % 2 === 0 ? 2.05 : -2.05 };
  });

  return (seconds: number) => {
    cars.forEach(({ car, phase, lane }) => {
      const progress = (seconds * 0.019 + phase) % 1;
      const point = roadPoint(lane > 0 ? progress : 1 - progress, lane);
      car.position.copy(point);
      car.rotation.y = Math.atan2(tangent.x, tangent.z) + (lane > 0 ? 0 : Math.PI);
    });
  };
}
