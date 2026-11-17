import {
  Group, Mesh, MeshStandardMaterial, SphereGeometry, CylinderGeometry, Vector3,
} from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export function createPushRobot() {
  const robot = new Group();
  const body = new Group();
  robot.add(body);
  const cream = new MeshStandardMaterial({ color: 0xbeb6a0, roughness: .69, metalness: .26 });
  const steel = new MeshStandardMaterial({ color: 0x817e73, roughness: .37, metalness: .62 });
  const bronze = new MeshStandardMaterial({ color: 0x8d5940, roughness: .54, metalness: .46 });
  const dark = new MeshStandardMaterial({ color: 0x272a29, roughness: .6, metalness: .36 });
  const glass = new MeshStandardMaterial({ color: 0x101a1a, roughness: .19, metalness: .54 });
  const status = new MeshStandardMaterial({ color: 0x98d39f, emissive: 0x466b52, emissiveIntensity: .6 });
  const sphere = new SphereGeometry(1, 16, 12);
  const cylinder = new CylinderGeometry(1, 1, 1, 14);
  const up = new Vector3(0, 1, 0);
  const direction = new Vector3();

  function box(parent: Group, material: MeshStandardMaterial, size: [number, number, number],
    position: [number, number, number], radius = .045) {
    const mesh = new Mesh(new RoundedBoxGeometry(...size, 2, radius), material);
    mesh.position.set(...position);
    parent.add(mesh);
    return mesh;
  }
  function ball(parent: Group, material: MeshStandardMaterial, size: [number, number, number],
    position: [number, number, number]) {
    const mesh = new Mesh(sphere, material);
    mesh.scale.set(...size);
    mesh.position.set(...position);
    parent.add(mesh);
    return mesh;
  }
  function rod(radius: number, material = steel) {
    const mesh = new Mesh(cylinder, material);
    robot.add(mesh);
    return (start: Vector3, end: Vector3) => {
      direction.subVectors(end, start);
      mesh.position.copy(start).addScaledVector(direction, .5);
      mesh.scale.set(radius, direction.length(), radius);
      mesh.quaternion.setFromUnitVectors(up, direction.normalize());
    };
  }

  box(body, bronze, [.60, .62, .51], [0, 0, 0]);
  box(body, cream, [.59, .60, .51], [0, .021, .012]);
  box(body, dark, [.31, .21, .035], [.03, .075, .266], .022);
  for (let i = 0; i < 4; i++) {
    box(body, steel, [.23, .015, .017], [.03, .017 + i * .036, .286], .008);
  }
  ball(body, status, [.030, .030, .014], [.21, -.16, .277]);
  ball(body, dark, [.18, .075, .15], [.06, .345, 0]);

  const head = new Group();
  body.add(head);
  head.position.set(.13, .66, .02);
  head.rotation.y = .44;
  box(head, bronze, [.69, .53, .50], [0, 0, 0], .06);
  box(head, cream, [.68, .53, .50], [0, .016, .014], .065);
  for (const x of [-.15, .15]) {
    ball(head, steel, [.102, .11, .033], [x, .026, .263]);
    ball(head, dark, [.081, .09, .035], [x, .026, .283]);
    ball(head, glass, [.06, .070, .024], [x, .026, .31]);
    ball(head, status, [.017, .019, .009], [x - .016, .049, .332]);
  }
  box(head, dark, [.21, .021, .018], [0, -.137, .263], .008);
  for (const x of [-.349, .349]) {
    ball(head, dark, [.057, .12, .12], [x, -.005, -.02]);
    ball(head, steel, [.067, .083, .083], [x * 1.09, -.005, -.02]);
  }
  const aerial = new Group();
  aerial.position.set(-.15, .259, -.04);
  aerial.rotation.z = -.22;
  head.add(aerial);
  box(aerial, steel, [.021, .34, .021], [0, .17, 0], .01);
  ball(aerial, bronze, [.039, .039, .039], [0, .346, 0]);

  const arms = [-1, 1].map(side => {
    const shoulder = ball(robot, dark, [.12, .12, .12], [0, 0, 0]);
    const elbow = ball(robot, bronze, [.083, .083, .083], [0, 0, 0]);
    const hand = new Group();
    robot.add(hand);
    box(hand, cream, [.125, .19, .16], [0, 0, 0], .04);
    for (let i = 0; i < 3; i++) {
      box(hand, steel, [.06, .034, .16], [.041, -.057 + i * .055, .055], .017);
    }
    return { side, shoulder, elbow, hand, upper: rod(.065), lower: rod(.061) };
  });
  const legs = [-1, 1].map(side => {
    const knee = ball(robot, dark, [.079, .079, .079], [0, 0, 0]);
    const shoe = new Group();
    robot.add(shoe);
    ball(shoe, bronze, [.23, .083, .17], [0, .085, 0]);
    ball(shoe, cream, [.225, .108, .165], [.01, .104, 0]);
    return { side, knee, shoe, upper: rod(.081, dark), lower: rod(.055) };
  });

  const point = new Vector3();
  const hip = new Vector3();
  const joint = new Vector3();
  const ankle = new Vector3();
  const wrist = new Vector3();
  return {
    robot,
    pose(travel: number, still: boolean, retreat = 0) {
      const stride = (travel + retreat * .65) * Math.PI * 10;
      const effort = still ? 0 : Math.max(Math.min(1, (1 - travel) * 16), Math.sin(retreat * Math.PI));
      const bob = Math.cos(stride * 2) * .02 * effort;
      body.position.set(.10, 1.02 + bob, 0);
      body.rotation.z = -.26 + .20 * retreat;
      head.rotation.y = .44 - .26 * retreat;
      head.rotation.z = -.01 + Math.sin(stride) * .042 * effort;
      body.updateMatrix();
      for (const arm of arms) {
        point.set(-.025, .19, arm.side * .265).applyMatrix4(body.matrix);
        joint.set(.32 - .16 * retreat, 1.06 + bob - .23 * retreat, arm.side * .32);
        wrist.set(.755 - .48 * retreat, 1.19 - arm.side * .07 - .48 * retreat, arm.side * .25);
        arm.shoulder.position.copy(point);
        arm.elbow.position.copy(joint);
        arm.hand.position.copy(wrist);
        arm.upper(point, joint);
        arm.lower(joint, wrist);
      }
      for (const leg of legs) {
        const phase = stride + (leg.side === 1 ? Math.PI : 0);
        const step = Math.cos(phase) * .22 * effort;
        const lift = Math.max(0, Math.sin(phase)) * .14 * effort;
        hip.set(-.045, -.26, leg.side * .17).applyMatrix4(body.matrix);
        const footX = -.22 + leg.side * .12 + step;
        ankle.set(footX - .064, .18 + lift, leg.side * .17);
        joint.set((hip.x + ankle.x) / 2 + .082, .44 + lift * .46, leg.side * .17);
        leg.knee.position.copy(joint);
        leg.shoe.position.set(footX, lift, ankle.z);
        leg.shoe.rotation.z = -.21 * Math.sin(phase) * effort;
        leg.upper(hip, joint);
        leg.lower(joint, ankle);
      }
    },
    dispose() {
      const geometries = new Set<Mesh['geometry']>();
      robot.traverse(object => { if (object instanceof Mesh) geometries.add(object.geometry); });
      for (const geometry of geometries) geometry.dispose();
      for (const material of [cream, steel, bronze, dark, glass, status]) material.dispose();
    },
  };
}
