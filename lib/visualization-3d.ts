export function computeBounds(arr: number[]) {
  const min = Math.min(...arr);
  const max = Math.max(...arr);
  const range = max - min || 1;
  return { min, max, range };
}

export function normalize(arr: number[], min: number, max: number) {
  const range = max - min || 1;
  return arr.map(v => (v - min) / range);
}

export function buildScatterPoints(
  x: number[], y: number[], z: number[],
  colorArr?: number[], sizeArr?: number[]
) {
  const n = Math.min(x.length, y.length, z.length);
  const positions = new Float32Array(n * 3);
  const colors = new Float32Array(n * 3);
  const sizes = new Float32Array(n);

  const bx = computeBounds(x), by = computeBounds(y), bz = computeBounds(z);

  for (let i = 0; i < n; i++) {
    positions[i * 3] = (x[i] - bx.min) / bx.range - 0.5;
    positions[i * 3 + 1] = (y[i] - by.min) / by.range - 0.5;
    positions[i * 3 + 2] = (z[i] - bz.min) / bz.range - 0.5;
  }

  if (colorArr) {
    const bc = computeBounds(colorArr);
    for (let i = 0; i < n; i++) {
      const t = (colorArr[i] - bc.min) / bc.range;
      colors[i * 3] = 0.2 + 0.8 * (1 - t);
      colors[i * 3 + 1] = 0.2 + 0.8 * (t < 0.5 ? t * 2 : 2 - t * 2);
      colors[i * 3 + 2] = 0.2 + 0.8 * t;
    }
  } else {
    for (let i = 0; i < n; i++) {
      colors[i * 3] = 0.23;
      colors[i * 3 + 1] = 0.51;
      colors[i * 3 + 2] = 0.96;
    }
  }

  if (sizeArr) {
    const bs = computeBounds(sizeArr);
    for (let i = 0; i < n; i++) {
      sizes[i] = 2 + 18 * ((sizeArr[i] - bs.min) / bs.range);
    }
  } else {
    sizes.fill(6);
  }

  return { positions, colors, sizes, count: n };
}

export function buildLinePoints(x: number[], y: number[], z: number[]) {
  const n = Math.min(x.length, y.length, z.length);
  const positions = new Float32Array(n * 3);
  const bx = computeBounds(x), by = computeBounds(y), bz = computeBounds(z);

  for (let i = 0; i < n; i++) {
    positions[i * 3] = (x[i] - bx.min) / bx.range - 0.5;
    positions[i * 3 + 1] = (y[i] - by.min) / by.range - 0.5;
    positions[i * 3 + 2] = (z[i] - bz.min) / bz.range - 0.5;
  }
  return { positions, count: n };
}

export function buildSurfaceGeometry(
  x: number[], y: number[], z: number[],
  gridSize = 20
) {
  const bx = computeBounds(x), by = computeBounds(y), bz = computeBounds(z);
  const vertices: number[] = [];
  const indices: number[] = [];
  const colors: number[] = [];

  for (let j = 0; j < gridSize; j++) {
    for (let i = 0; i < gridSize; i++) {
      const xPos = i / (gridSize - 1) - 0.5;
      const yPos = j / (gridSize - 1) - 0.5;
      const zVal = Math.sin(xPos * 4) * Math.cos(yPos * 4) * 0.3;
      vertices.push(xPos, yPos, zVal);
      const t = (zVal + 0.3) / 0.6;
      colors.push(0.2 + 0.8 * t, 0.2 + 0.8 * (1 - t), 0.8);
    }
  }

  for (let j = 0; j < gridSize - 1; j++) {
    for (let i = 0; i < gridSize - 1; i++) {
      const a = i + j * gridSize;
      const b = i + 1 + j * gridSize;
      const c = i + (j + 1) * gridSize;
      const d = i + 1 + (j + 1) * gridSize;
      indices.push(a, b, c, b, d, c);
    }
  }

  return { vertices: new Float32Array(vertices), indices: new Uint16Array(indices), colors: new Float32Array(colors) };
}
