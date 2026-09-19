import type { CalibrationProfile } from './calibration.ts';

export type RomanovAnchorPose = {
  position: [number, number, number];
  rotationEulerDeg: [number, number, number];
};

export type RomanovAnchorFrameModelTransform = {
  position: [number, number, number];
  rotationEulerDeg: [number, number, number];
  scale: number;
};

type Mat3 = [
  number, number, number,
  number, number, number,
  number, number, number
];

const deg = (value: number) => value * Math.PI / 180;
const rad = (value: number) => value * 180 / Math.PI;

function multiply3(a: Mat3, b: Mat3): Mat3 {
  return [
    a[0]*b[0] + a[1]*b[3] + a[2]*b[6],
    a[0]*b[1] + a[1]*b[4] + a[2]*b[7],
    a[0]*b[2] + a[1]*b[5] + a[2]*b[8],
    a[3]*b[0] + a[4]*b[3] + a[5]*b[6],
    a[3]*b[1] + a[4]*b[4] + a[5]*b[7],
    a[3]*b[2] + a[4]*b[5] + a[5]*b[8],
    a[6]*b[0] + a[7]*b[3] + a[8]*b[6],
    a[6]*b[1] + a[7]*b[4] + a[8]*b[7],
    a[6]*b[2] + a[7]*b[5] + a[8]*b[8]
  ];
}

function transpose3(m: Mat3): Mat3 {
  return [
    m[0], m[3], m[6],
    m[1], m[4], m[7],
    m[2], m[5], m[8]
  ];
}

function apply3(m: Mat3, [x,y,z]: [number, number, number]): [number, number, number] {
  return [
    m[0]*x + m[1]*y + m[2]*z,
    m[3]*x + m[4]*y + m[5]*z,
    m[6]*x + m[7]*y + m[8]*z
  ];
}

/**
 * Viro exposes anchor/node rotations as X-Y-Z Euler degrees.
 * For column vectors this composes as Rz * Ry * Rx.
 */
export function viroEulerXYZToMatrix([xDeg,yDeg,zDeg]: [number, number, number]): Mat3 {
  const x = deg(xDeg);
  const y = deg(yDeg);
  const z = deg(zDeg);
  const cx = Math.cos(x), sx = Math.sin(x);
  const cy = Math.cos(y), sy = Math.sin(y);
  const cz = Math.cos(z), sz = Math.sin(z);

  const rx: Mat3 = [1,0,0, 0,cx,-sx, 0,sx,cx];
  const ry: Mat3 = [cy,0,sy, 0,1,0, -sy,0,cy];
  const rz: Mat3 = [cz,-sz,0, sz,cz,0, 0,0,1];
  return multiply3(rz, multiply3(ry, rx));
}

export function matrixToViroEulerXYZ(m: Mat3): [number, number, number] {
  const sy = Math.max(-1, Math.min(1, -m[6]));
  const y = Math.asin(sy);
  const cy = Math.cos(y);
  let x: number;
  let z: number;

  if (Math.abs(cy) > 1e-6) {
    x = Math.atan2(m[7], m[8]);
    z = Math.atan2(m[3], m[0]);
  } else {
    x = Math.atan2(-m[5], m[4]);
    z = 0;
  }

  return [rad(x), rad(y), rad(z)];
}

export function modelWorldToAnchorFrame(
  calibration: CalibrationProfile,
  anchor: RomanovAnchorPose
): RomanovAnchorFrameModelTransform {
  const anchorR = viroEulerXYZToMatrix(anchor.rotationEulerDeg);
  const modelR = viroEulerXYZToMatrix(calibration.rotationEulerDeg);
  const invAnchorR = transpose3(anchorR);
  const delta: [number, number, number] = [
    calibration.translation[0] - anchor.position[0],
    calibration.translation[1] - anchor.position[1],
    calibration.translation[2] - anchor.position[2]
  ];

  return {
    position: apply3(invAnchorR, delta),
    rotationEulerDeg: matrixToViroEulerXYZ(multiply3(invAnchorR, modelR)),
    scale: calibration.scale
  };
}

export function anchorFrameModelToWorld(
  anchor: RomanovAnchorPose,
  relative: RomanovAnchorFrameModelTransform
): RomanovAnchorFrameModelTransform {
  const anchorR = viroEulerXYZToMatrix(anchor.rotationEulerDeg);
  const relativeR = viroEulerXYZToMatrix(relative.rotationEulerDeg);
  const rotatedPosition = apply3(anchorR, relative.position);

  return {
    position: [
      anchor.position[0] + rotatedPosition[0],
      anchor.position[1] + rotatedPosition[1],
      anchor.position[2] + rotatedPosition[2]
    ],
    rotationEulerDeg: matrixToViroEulerXYZ(multiply3(anchorR, relativeR)),
    scale: relative.scale
  };
}

export function isFiniteAnchorFrameTransform(value?: RomanovAnchorFrameModelTransform | null) {
  return Boolean(
    value
    && value.position.length === 3
    && value.position.every(Number.isFinite)
    && value.rotationEulerDeg.length === 3
    && value.rotationEulerDeg.every(Number.isFinite)
    && Number.isFinite(value.scale)
    && value.scale > 0
  );
}
