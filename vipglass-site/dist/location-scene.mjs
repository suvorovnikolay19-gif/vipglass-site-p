/*
 * VIP Glass / pop-up location scene.
 * An authored architectural miniature, not a survey or a reconstruction of the premises.
 * Every visible surface is projected from world-space geometry; camera changes reveal
 * other faces. No images, 3D/CDN dependencies, external requests, or browser-only APIs.
 */

export const locationSceneInfo = Object.freeze({
  version: '1.0',
  type: 'projected-3d-mesh',
  title: 'VIP GLASS — стеклянный павильон на раскрывающейся карте',
  conceptual: true,
  location: { latitude: 55.6863, longitude: 37.88366 },
  durationSeconds: 6.2,
  defaults: { progress: 1, yaw: -25, pitch: 42, zoom: 1, width: 1000, height: 720 },
  stages: [
    { from: 0, to: 0.25, id: 'pin', title: 'Метка опускается на карту' },
    { from: 0.2, to: 0.6, id: 'paper', title: 'Карта раскрывается объёмными лепестками' },
    { from: 0.4, to: 0.94, id: 'pavilion', title: 'Стеклянный павильон поднимается из карты' },
  ],
});

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const finite = (v, fallback) => Number.isFinite(Number(v)) ? Number(v) : fallback;
const ease = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
const stage = (v, a, b) => ease((v - a) / (b - a));
const rad = d => d * Math.PI / 180;
const sub = (a, b) => a.map((v, i) => v - b[i]);
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0);
const normal = p => {
  const n = cross(sub(p[1], p[0]), sub(p[2], p[0]));
  const length = Math.hypot(...n) || 1;
  return n.map(v => v / length);
};
const mean = p => [0, 1, 2].map(i => p.reduce((s, v) => s + v[i], 0) / p.length);
const f = n => (Math.abs(n) < 0.005 ? 0 : n).toFixed(2);
const escape = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function cameraOptions(options = {}) {
  const yaw = finite(options.yaw, -25);
  return {
    yaw: ((yaw + 180) % 360 + 360) % 360 - 180,
    pitch: clamp(finite(options.pitch, 42), 23, 76),
    zoom: clamp(finite(options.zoom, 1), 0.7, 1.45),
    width: clamp(finite(options.width, 1000), 280, 3000),
    height: clamp(finite(options.height, 720), 240, 2200),
    distance: 1450,
  };
}

/** Project a world-space [x, elevation, z] point into the SVG viewport. */
export function projectLocationPoint(point, options = {}) {
  const c = cameraOptions(options);
  const yaw = rad(c.yaw), pitch = rad(c.pitch);
  const p = [finite(point?.[0], 0), finite(point?.[1], 0) - 23, finite(point?.[2], 0)];
  const right = [Math.cos(yaw), 0, -Math.sin(yaw)];
  const up = [-Math.sin(yaw) * Math.sin(pitch), Math.cos(pitch), -Math.cos(yaw) * Math.sin(pitch)];
  const toward = [Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch)];
  const depth = dot(p, toward);
  const scale = Math.min(c.width / 1000, c.height / 720) * 1.11 * c.zoom * c.distance / Math.max(600, c.distance - depth);
  return { x: c.width * 0.5 + dot(p, right) * scale, y: c.height * 0.515 - dot(p, up) * scale, depth, scale };
}

function shade(hex, amount) {
  if (!/^#[a-f\d]{6}$/i.test(hex)) return hex;
  const rgb = [1, 3, 5].map(i => clamp(Math.round(parseInt(hex.slice(i, i + 2), 16) * amount), 0, 255));
  return '#' + rgb.map(v => v.toString(16).padStart(2, '0')).join('');
}

function clipAboveGround(points, minimum = 0.6) {
  const result = [];
  for (let i = 0; i < points.length; i++) {
    const a = points[i], b = points[(i + 1) % points.length];
    const aInside = a[1] >= minimum, bInside = b[1] >= minimum;
    if (aInside) result.push(a);
    if (aInside !== bInside) {
      const t = (minimum - a[1]) / (b[1] - a[1]);
      result.push(a.map((v, index) => v + (b[index] - v) * t));
    }
  }
  return result;
}

/** Deterministic animated mesh, useful both for rendering and scene validation. */
export function createLocationSceneGeometry(progress = 1, time = 0) {
  progress = clamp(finite(progress, 1), 0, 1);
  time = finite(time, 0);
  const opening = stage(progress, 0.2, 0.68);
  const rise = stage(progress, 0.41, 0.94);
  const faces = [], lines = [], labels = [];
  let serial = 0;
  const face = (points, color, options = {}) => {
    const p = options.clip ? clipAboveGround(points) : points;
    if (p.length < 3) return;
    faces.push({ points: p, color, layer: 3, id: `surface-${serial++}`, ...options });
  };
  const line = (points, color, width = 1, options = {}) => {
    if (options.clip && points.some(p => p[1] < 0.6)) return;
    lines.push({ points, color, width, layer: 3, id: `line-${serial++}`, ...options });
  };
  const flat = (x0, z0, x1, z1, color, y = 0.3, options = {}) => face([[x0, y, z0], [x0, y, z1], [x1, y, z1], [x1, y, z0]], color, { layer: 1, ...options });
  const box = (x, y, z, w, h, d, color, options = {}) => {
    const x0 = x - w / 2, x1 = x + w / 2, z0 = z - d / 2, z1 = z + d / 2, y0 = y, y1 = y + h;
    const op = { cull: true, lit: true, ...options };
    face([[x0, y1, z0], [x0, y1, z1], [x1, y1, z1], [x1, y1, z0]], color, op);
    face([[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], color, op);
    face([[x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0]], color, op);
    face([[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]], color, op);
    face([[x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1]], color, op);
  };

  // A physical paper/map board. The centre is an actual opening, not an overlay.
  box(0, -9, 0, 750, 9, 550, '#d6d0c5', { layer: 0 });
  flat(-375, -275, 375, -126, '#eeece5', 0, { layer: 0 });
  flat(-375, 126, 375, 275, '#eeece5', 0, { layer: 0 });
  flat(-375, -126, -166, 126, '#eeece5', 0, { layer: 0 });
  flat(166, -126, 375, 126, '#eeece5', 0, { layer: 0 });
  flat(-166, -126, 166, 126, '#252a2a', 0.05, { layer: 0, opacity: opening });
  // Large roads are intentionally schematic: no invented street names or geometry claims.
  flat(-375, 172, 375, 205, '#d7c8a6');
  flat(-375, -211, 375, -184, '#d7c8a6');
  flat(-269, -275, -238, 275, '#d7c8a6');
  flat(255, -275, 284, 275, '#d7c8a6');
  for (const z of [174, 203, -209, -186]) line([[-375, 0.6, z], [375, 0.6, z]], '#f8f5ec', 1.25, { layer: 1 });
  for (const x of [-267, -240, 257, 282]) line([[x, 0.6, -275], [x, 0.6, 275]], '#f8f5ec', 1.25, { layer: 1 });
  for (let x = -355; x < 360; x += 38) {
    flat(x, 188, x + 15, 189.3, '#f6f0dd', 0.6);
    flat(x, -198, x + 15, -196.8, '#f6f0dd', 0.6);
  }
  for (let z = -255; z < 260; z += 38) {
    flat(-254, z, -252.7, z + 15, '#f6f0dd', 0.6);
    flat(269, z, 270.3, z + 15, '#f6f0dd', 0.6);
  }
  // Pedestrian links and neighbourhood blocks stay subdued, so the pavilion is the focus.
  for (const [x0, z0, x1, z1] of [
    [-375, -130, -166, -123], [-375, 121, -166, 128], [166, -130, 375, -123], [166, 121, 375, 128],
    [-165, -275, -158, -126], [157, -275, 164, -126], [-165, 126, -158, 275], [157, 126, 164, 275],
    [-371, -57, -275, -52], [288, -10, 372, -5], [-226, 229, 229, 234],
  ]) flat(x0, z0, x1, z1, '#faf8f2', 0.8);

  const blocks = [
    [-326, -244, 68, 32, 5], [-202, -243, 42, 32, 3], [-102, -244, 68, 31, 5], [2, -245, 78, 28, 4], [112, -244, 62, 34, 6], [205, -241, 46, 34, 3], [330, -244, 66, 32, 4],
    [-325, -155, 64, 32, 5], [-205, -152, 42, 28, 4], [-85, -158, 94, 27, 3], [65, -157, 103, 30, 4], [204, -153, 53, 29, 6], [327, -154, 66, 31, 5],
    [-324, -92, 64, 37, 5], [-322, 0, 64, 68, 4], [-326, 87, 64, 38, 7], [-202, -63, 43, 72, 4], [-202, 70, 43, 60, 5],
    [208, -66, 51, 73, 5], [208, 71, 51, 62, 6], [328, -69, 65, 68, 5], [329, 54, 68, 83, 4],
    [-325, 149, 65, 26, 3], [-202, 150, 39, 25, 4], [-96, 152, 86, 24, 3], [48, 151, 91, 25, 4], [202, 151, 56, 27, 3], [329, 148, 65, 29, 4],
    [-325, 245, 67, 30, 4], [-202, 247, 45, 27, 5], [-101, 253, 73, 24, 4], [9, 252, 77, 25, 3], [117, 251, 68, 28, 5], [206, 246, 42, 29, 4], [329, 246, 69, 32, 5],
  ];
  blocks.forEach(([x, z, w, d, h], i) => {
    flat(x - w / 2 - 3, z - d / 2 - 3, x + w / 2 + 3, z + d / 2 + 3, '#d6d5cd', 0.7);
    box(x, 1, z, w, h, d, i % 4 === 0 ? '#d7d9d1' : '#e5e4de', { stroke: '#f7f5ef', strokeWidth: 0.55 });
    if (i % 3 === 0) line([[x - w / 2 + 5, h + 1.3, z], [x + w / 2 - 5, h + 1.3, z]], '#cecec7', 0.55);
  });

  // Fine cast shadows anchor the raised paper and pavilion to their map surface.
  if (opening > 0.01) {
    face([[-160, 0.9, -117], [164, 0.9, -117], [211, 0.9, 150], [-130, 0.9, 170]], '#8c8c81', { layer: 2, opacity: 0.11 * opening });
  }

  // Eight curved paper flaps. Their inner edge starts over the opening and peels outward.
  const sides = [
    { base: [-166, 0.8, 0], inward: [1, 0], tangent: [0, 1], width: 126, length: 166 },
    { base: [166, 0.8, 0], inward: [-1, 0], tangent: [0, 1], width: 126, length: 166 },
    { base: [0, 0.8, -126], inward: [0, 1], tangent: [1, 0], width: 166, length: 126 },
    { base: [0, 0.8, 126], inward: [0, -1], tangent: [1, 0], width: 166, length: 126 },
  ];
  sides.forEach((side, sideIndex) => {
    for (let half = 0; half < 2; half++) {
      const flapOpen = ease(clamp(opening * 1.18 - ((sideIndex + half) % 3) * 0.07, 0, 1));
      const fold = flapOpen * Math.PI * 1.06;
      const segments = 7;
      const flap = [];
      const offset = half === 0 ? -side.width / 2 : side.width / 2;
      const stripWidth = side.width - 3;
      // The triangle tapers towards the centre; no square patch is exposed mid-animation.
      for (let j = 0; j <= segments; j++) {
        const u = j / segments;
        let along, elevation;
        if (fold < 0.001) { along = side.length * u; elevation = 0; }
        else {
          // At full opening, the paper curves up and back beyond its hinge.
          const angle = fold * (0.42 + 0.92 * u);
          const radius = side.length / (fold * 1.35 + 0.1);
          along = radius * (Math.sin(angle) - Math.sin(fold * 0.42));
          elevation = radius * (Math.cos(fold * 0.42) - Math.cos(angle));
          // A short hinge rotation makes the flat-to-curled transition continuous.
          along = (1 - flapOpen) * side.length * u + flapOpen * along;
          elevation *= flapOpen;
        }
        const taper = 1 - u * (1 - flapOpen * 0.73);
        const centreShift = offset * (1 - u * (1 - flapOpen));
        flap.push([-1, 1].map(sign => [
          side.base[0] + side.inward[0] * along + side.tangent[0] * (centreShift + sign * stripWidth * taper / 2),
          1 + elevation,
          side.base[2] + side.inward[1] * along + side.tangent[1] * (centreShift + sign * stripWidth * taper / 2),
        ]));
      }
      for (let j = 0; j < segments; j++) {
        face([flap[j][0], flap[j][1], flap[j + 1][1], flap[j + 1][0]], '#f5f2e9', {
          id: `paper-${sideIndex}-${half}-${j}`, lit: true, twoSided: true, stroke: opening > 0.005 ? '#e7e2d7' : undefined, strokeWidth: 0.35,
        });
        // Street grid ink bends with the actual curved paper.
        if (j % 2 === 1) line([flap[j][0].map((v, i) => i === 1 ? v + 0.3 : v), flap[j][1].map((v, i) => i === 1 ? v + 0.3 : v)], '#c9c8bc', 0.65, { opacity: 0.7 });
      }
    }
  });

  // The miniature is a designed VIP Glass pavilion; all glazing is colour-neutral.
  const lift = -178 * (1 - rise);
  const glass = '#dce4e6', dark = '#293638', brass = '#b8a27b', stone = '#eee7db';
  const model = { clip: true, id: 'pavilion' };
  if (rise > 0.002) {
    box(0, lift + 2, 0, 292, 9, 204, '#6f7472', model);
    box(0, lift + 11, 0, 278, 5, 190, stone, model);
    // Floor joints are visible through the shopfront.
    for (let x = -105; x <= 110; x += 35) line([[x, lift + 16.3, -90], [x, lift + 16.3, 91]], '#d3cbbe', 0.7, model);
    for (let z = -65; z <= 80; z += 40) line([[-135, lift + 16.4, z], [135, lift + 16.4, z]], '#d3cbbe', 0.7, model);
    // Rear gallery wall, timber portal and an actual interior glass display.
    box(0, lift + 16, -87, 260, 112, 8, '#c0b29b', { ...model, rearOccluder: true });
    box(-79, lift + 24, -80, 68, 88, 3, '#353f40', model);
    face([[-108, lift + 30, -77.9], [-50, lift + 30, -77.9], [-50, lift + 105, -77.9], [-108, lift + 105, -77.9]], '#bac4c8', { ...model, opacity: 0.95, stroke: '#ddd8ca', strokeWidth: 1.4 });
    face([[-106, lift + 31, -77.7], [-87, lift + 31, -77.7], [-51, lift + 104, -77.7], [-65, lift + 104, -77.7]], '#e7edef', { ...model, opacity: 0.8 });
    // Three sample panes, clear / bronze / smoked. These are exhibits, not partitions for sale.
    for (let i = 0; i < 3; i++) {
      const x = 29 + 25 * i;
      box(x, lift + 17, -45, 4, 8, 41, dark, model);
      face([[x, lift + 25, -65], [x, lift + 25, -25], [x, lift + 103 - i * 9, -25], [x, lift + 103 - i * 9, -65]], ['#dee8ec', '#bca68d', '#858f94'][i], { ...model, opacity: 0.75, stroke: '#f4f8f9', strokeWidth: 0.8 });
    }
    // Central glass desk and slender sculptural base.
    box(-8, lift + 17, 12, 5, 28, 24, brass, model);
    box(40, lift + 17, 12, 5, 28, 24, brass, model);
    box(16, lift + 45, 12, 78, 3, 39, '#d1dce0', { ...model, opacity: 0.87, stroke: '#f8fcff', strokeWidth: 0.6 });
    // Load-bearing frame. Thin warm metal frames, not chunky opaque walls.
    for (const x of [-132, 132]) for (const z of [-87, 87]) box(x, lift + 16, z, 5, 113, 5, dark, model);
    for (const x of [-129, 129]) {
      // Two side lights separated by a single slender mullion.
      for (const [z0, z1] of [[-83, -2], [2, 83]]) {
        face([[x, lift + 20, z0], [x, lift + 20, z1], [x, lift + 123, z1], [x, lift + 123, z0]], glass, { ...model, opacity: 0.33, stroke: '#9ba9ac', strokeWidth: 0.8 });
        face([[x - Math.sign(x) * 0.1, lift + 30, z0 + 5], [x - Math.sign(x) * 0.1, lift + 30, z0 + 16], [x - Math.sign(x) * 0.1, lift + 117, z1 - 5], [x - Math.sign(x) * 0.1, lift + 117, z1 - 17]], '#ffffff', { ...model, opacity: 0.17 });
      }
      box(x, lift + 17, 0, 3, 109, 3, brass, model);
      box(x, lift + 17, 0, 3, 3, 173, dark, model);
    }
    // Front glass wall: two large display windows and a double glass entrance.
    for (const [x0, x1] of [[-127, -38], [38, 127]]) {
      face([[x0, lift + 20, 88], [x1, lift + 20, 88], [x1, lift + 123, 88], [x0, lift + 123, 88]], glass, { ...model, opacity: 0.30, stroke: '#bbc5c6', strokeWidth: 0.75 });
      face([[x0 + 4, lift + 23, 88.5], [x0 + 17, lift + 23, 88.5], [x1 - 6, lift + 120, 88.5], [x1 - 20, lift + 120, 88.5]], '#ffffff', { ...model, opacity: 0.19 });
      box((x0 + x1) / 2, lift + 17, 88, x1 - x0, 3, 3, dark, model);
    }
    for (const x of [-37, 37]) box(x, lift + 17, 88, 3.4, 110, 3.4, brass, model);
    // One door stands slightly open, making the depth of the entrance explicit.
    const doorAngle = rad(19 * stage(progress, 0.88, 1));
    const leftDoor = [[-34, lift + 19, 88], [-1, lift + 19, 88], [-1, lift + 121, 88], [-34, lift + 121, 88]];
    const rightDoor = [[3, lift + 19, 88], [34, lift + 19, 88], [34, lift + 121, 88], [3, lift + 121, 88]].map(p => {
      const dx = p[0] - 34;
      return [34 + dx * Math.cos(doorAngle), p[1], 88 - dx * Math.sin(doorAngle)];
    });
    for (const points of [leftDoor, rightDoor]) face(points, '#e2ebed', { ...model, opacity: 0.26, stroke: '#f1f6f6', strokeWidth: 0.9 });
    box(-7, lift + 53, 90, 1.8, 24, 2.3, brass, model);
    line([[34 - 27 * Math.cos(doorAngle), lift + 53, 90 + 27 * Math.sin(doorAngle)], [34 - 27 * Math.cos(doorAngle), lift + 77, 90 + 27 * Math.sin(doorAngle)]], brass, 1.8, model);
    // Overhang and dark fascia form a clean, architectural crown.
    for (const z of [-91, 91]) box(0, lift + 126, z, 282, 12, 8, dark, model);
    for (const x of [-137, 137]) box(x, lift + 126, 0, 8, 12, 178, dark, model);
    // A glazed roof exposes the interior and makes the pavilion unmistakably about glass.
    for (const x of [-99, -33, 33, 99]) {
      flat(x - 30, -84, x + 30, 84, '#bdcdd4', lift + 137.5, { ...model, layer: 3, opacity: 0.32, stroke: '#b3c0c5', strokeWidth: 0.65 });
      flat(x - 24, -79, x - 16, 78, '#f7fbfc', lift + 137.7, { ...model, layer: 3, opacity: 0.27, depthAnchor: [x, lift + 138, 0] });
    }
    for (const x of [-66, 0, 66]) box(x, lift + 132, 0, 3.5, 5, 178, brass, model);
    box(0, lift + 138, -92, 282, 2.5, 3, brass, model);
    box(0, lift + 138, 92, 282, 2.5, 3, brass, model);
    // Physical raised sign: front-facing text belongs to the scene and rotates with it.
    box(0, lift + 144, 76, 179, 23, 5, '#273335', model);
    if (lift + 146 > 0.6) labels.push({
      id: 'pavilion-sign', text: 'VIP GLASS', origin: [-80, lift + 148, 79.1],
      u: [160, 0, 0], v: [0, 17, 0], color: '#f3eee2', weight: 600,
      font: 'Arial, sans-serif', letterSpacing: 3.0, layer: 3,
    });
    // Entrance steps project beyond the glass facade.
    box(0, lift + 1, 113, 100, 4, 25, '#d2ccc0', model);
    box(0, lift + 5, 105, 93, 4, 19, '#e2dbcf', model);
    // Two fine stone plinths are part of the miniature, without invented landscaping claims.
    box(-110, lift + 12, 106, 23, 24, 19, '#908d82', model);
    box(110, lift + 12, 106, 23, 24, 19, '#908d82', model);
    box(-110, lift + 36, 106, 20, 2, 17, '#d5cec0', model);
    box(110, lift + 36, 106, 20, 2, 17, '#d5cec0', model);
  }

  // The pin descends onto the paper, then dissolves as the architecture rises.
  const pinOpacity = 1 - stage(progress, 0.32, 0.49);
  if (pinOpacity > 0.005) {
    const pinDrop = stage(progress, 0, 0.23);
    const pinBase = 18 + (1 - pinDrop) * 170 + Math.sin(Math.PI * stage(progress, 0.23, 0.32)) * 4;
    const ringY = pinBase + 44;
    const ring = [];
    for (let i = 0; i < 16; i++) {
      const angle = i / 16 * Math.PI * 2;
      ring.push([Math.cos(angle) * 24, ringY + Math.sin(angle) * 24, 0]);
    }
    for (let i = 0; i < 16; i++) {
      const j = (i + 1) % 16;
      face([ring[i].map((v, k) => k === 2 ? v - 4 : v), ring[j].map((v, k) => k === 2 ? v - 4 : v), ring[j].map((v, k) => k === 2 ? v + 4 : v), ring[i].map((v, k) => k === 2 ? v + 4 : v)], brass, { opacity: pinOpacity, lit: true });
    }
    const outline = [[0, pinBase, 4], ...Array.from({ length: 17 }, (_, i) => {
      const angle = rad(210 - i * 240 / 16);
      return [Math.cos(angle) * 24, ringY + Math.sin(angle) * 24, 4];
    })];
    face(outline, brass, { opacity: pinOpacity, depthAnchor: [0, ringY, 4] });
    const inner = Array.from({ length: 16 }, (_, i) => { const a = i / 16 * Math.PI * 2; return [Math.cos(a) * 9.5, ringY + Math.sin(a) * 9.5, 4.3]; });
    face(inner, '#f7f5ee', { opacity: pinOpacity, depthAnchor: [0, ringY, 4.5] });
    const halo = Array.from({ length: 32 }, (_, i) => { const a = i / 32 * Math.PI * 2; return [Math.cos(a) * 37, 2, Math.sin(a) * 26]; });
    line([...halo, halo[0]], brass, 1.2, { opacity: pinOpacity * 0.7, layer: 2 });
  }

  // Tiny 3D traffic adds scale. Time is an explicit input; the mesh is deterministic.
  const car = (x, z, heading, color) => {
    const carFacesStart = faces.length;
    box(0, 2, 0, 21, 5, 10, color);
    box(-1, 7, 0, 10.5, 4, 8.2, '#39484d', { stroke: '#7d9093', strokeWidth: 0.4 });
    box(7, 3, 0, 3, 1.4, 10.2, '#eee7cd');
    for (let i = carFacesStart; i < faces.length; i++) faces[i].points = faces[i].points.map(p => [x + p[0] * Math.cos(heading) - p[2] * Math.sin(heading), p[1], z + p[0] * Math.sin(heading) + p[2] * Math.cos(heading)]);
  };
  const move = (start, speed, span) => ((start + time * speed + span / 2) % span + span) % span - span / 2;
  car(move(-175, 13, 710), 181, 0, '#3e555d');
  car(move(214, -10, 710), 197, Math.PI, '#9f8974');
  car(move(79, 9, 710), -204, 0, '#535f63');
  car(-260, move(75, 9, 500), Math.PI / 2, '#a99d85');
  car(277, move(-140, -12, 500), -Math.PI / 2, '#faf7ed');

  return { progress, time, opening, rise, faces, lines, labels, counts: { faces: faces.length, lines: lines.length, labels: labels.length } };
}

/** Complete SVG. Safe to insert into the dedicated scene container. */
export function renderLocationScene(options = {}) {
  const camera = cameraOptions(options);
  const progress = clamp(finite(options.progress, 1), 0, 1);
  const geometry = createLocationSceneGeometry(progress, finite(options.time, 0));
  const yaw = rad(camera.yaw), pitch = rad(camera.pitch);
  const eye = [Math.sin(yaw) * Math.cos(pitch) * camera.distance, Math.sin(pitch) * camera.distance + 23, Math.cos(yaw) * Math.cos(pitch) * camera.distance];
  const project = point => projectLocationPoint(point, camera);
  const commands = [];
  for (const item of geometry.faces) {
    const centre = mean(item.points), n = normal(item.points);
    if (item.cull && dot(n, sub(eye, centre)) <= 0) continue;
    const projected = item.points.map(project);
    const light = clamp(dot(n, [-0.35, 0.82, 0.45]) * (item.twoSided && n[1] < 0 ? -1 : 1), -1, 1);
    const color = item.lit ? shade(item.color, 0.82 + 0.19 * Math.max(0, light)) : item.color;
    const depth = item.rearOccluder && Math.cos(yaw) < 0
      ? Math.max(...projected.map(p => p.depth)) + 1
      : item.depthAnchor ? project(item.depthAnchor).depth : projected.reduce((sum, p) => sum + p.depth, 0) / projected.length;
    commands.push({ layer: item.layer, depth, order: 0,
      svg: `<polygon data-mesh="${escape(item.id)}" points="${projected.map(p => `${f(p.x)},${f(p.y)}`).join(' ')}" fill="${color}"${item.opacity !== undefined ? ` opacity="${f(item.opacity)}"` : ''}${item.stroke ? ` stroke="${item.stroke}" stroke-width="${item.strokeWidth || 0.6}" stroke-linejoin="round"` : ' stroke="none"'}/>` });
  }
  for (const item of geometry.lines) {
    const projected = item.points.map(project);
    commands.push({ layer: item.layer, depth: projected.reduce((sum, p) => sum + p.depth, 0) / projected.length + 0.03, order: 1,
      svg: `<polyline points="${projected.map(p => `${f(p.x)},${f(p.y)}`).join(' ')}" fill="none" stroke="${item.color}" stroke-width="${item.width}" stroke-linecap="round"${item.opacity !== undefined ? ` opacity="${f(item.opacity)}"` : ''}/>` });
  }
  for (const item of geometry.labels) {
    const p = project(item.origin), u = project(item.origin.map((v, i) => v + item.u[i])), v = project(item.origin.map((value, i) => value + item.v[i]));
    // A plane-aligned label, not screen-aligned UI text; the sign occludes in depth.
    const centre = item.origin.map((value, i) => value + item.u[i] / 2 + item.v[i] / 2);
    const front = cross(item.u, item.v);
    if (dot(front, sub(eye, centre)) <= 0) continue;
    commands.push({ layer: item.layer, depth: project(centre).depth + 0.1, order: 2,
      svg: `<g transform="matrix(${f((u.x - p.x) / 160)} ${f((u.y - p.y) / 160)} ${f((p.x - v.x) / 17)} ${f((p.y - v.y) / 17)} ${f(p.x)} ${f(p.y)})"><text x="80" y="-2" text-anchor="middle" fill="${item.color}" font-family="${escape(item.font)}" font-size="17" font-weight="${item.weight}" letter-spacing="${item.letterSpacing}">${escape(item.text)}</text></g>` });
  }
  commands.sort((a, b) => a.layer - b.layer || a.depth - b.depth || a.order - b.order);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${camera.width} ${camera.height}" width="${camera.width}" height="${camera.height}" role="img" aria-label="Объёмная схема VIP GLASS: стеклянный павильон поднимается из раскрывающейся карты" data-scene="vipglass-3d-location" data-progress="${f(progress)}" data-faces="${geometry.faces.length}" style="display:block;width:100%;height:auto"><defs><radialGradient id="location-floor-glow"><stop offset="0" stop-color="#f7f5ed"/><stop offset="1" stop-color="#e3dfd4"/></radialGradient><radialGradient id="location-board-shadow"><stop offset="0" stop-color="#66706b" stop-opacity=".22"/><stop offset=".75" stop-color="#858d85" stop-opacity=".08"/><stop offset="1" stop-color="#858d85" stop-opacity="0"/></radialGradient></defs><rect width="100%" height="100%" fill="url(#location-floor-glow)"/><ellipse cx="${f(camera.width * 0.51)}" cy="${f(camera.height * 0.62)}" rx="${f(camera.width * 0.43)}" ry="${f(camera.height * 0.30)}" fill="url(#location-board-shadow)"/>${commands.map(c => c.svg).join('')}</svg>`;
}
