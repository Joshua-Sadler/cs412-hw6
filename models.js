function createCube() {
  const positions = new Float32Array([
    -1, -1,  1,   1, -1,  1,   1,  1,  1,  -1,  1,  1,   // front
     1, -1, -1,  -1, -1, -1,  -1,  1, -1,   1,  1, -1,   // back
    -1,  1,  1,   1,  1,  1,   1,  1, -1,  -1,  1, -1,   // top
    -1, -1, -1,   1, -1, -1,   1, -1,  1,  -1, -1,  1,   // bottom
     1, -1,  1,   1, -1, -1,   1,  1, -1,   1,  1,  1,   // right
    -1, -1, -1,  -1, -1,  1,  -1,  1,  1,  -1,  1, -1    // left
  ]);
  const faceNormals = [[0, 0, 1], [0, 0, -1], [0, 1, 0], [0, -1, 0], [1, 0, 0], [-1, 0, 0]];
  const normals = new Float32Array(faceNormals.flatMap(n => [...n, ...n, ...n, ...n]));

  // Tangent; bitangent = cross(N, T)
  const faceTangents = [[1, 0, 0], [-1, 0, 0], [1, 0, 0], [1, 0, 0], [0, 0, -1], [0, 0, 1]];
  const tangents = new Float32Array(faceTangents.flatMap(t => [...t, ...t, ...t, ...t]));

  const texCoords = new Float32Array(faceNormals.flatMap(() => [0, 0, 1, 0, 1, 1, 0, 1]));

  const indices = new Uint16Array([
     0,  1,  2,   0,  2,  3,   // front
     4,  5,  6,   4,  6,  7,   // back
     8,  9, 10,   8, 10, 11,   // top
    12, 13, 14,  12, 14, 15,   // bottom
    16, 17, 18,  16, 18, 19,   // right
    20, 21, 22,  20, 22, 23    // left
  ]);
  return { positions, normals, tangents, texCoords, indices };
}


function createCylinder(segments = 64, uRepeat = 3) {
  const positions = [], normals = [], tangents = [], texCoords = [], indices = [];

  // Side: theta grows with u, so T points along the circle and B = cross(N, T) points up
  for (let i = 0; i <= segments; i++) {
    const u = i / segments, theta = 2 * Math.PI * u;
    const s = Math.sin(theta), c = Math.cos(theta);
    for (const y of [-1, 1]) {
      positions.push(s, y, c);
      normals.push(s, 0, c);
      tangents.push(c, 0, -s);
      texCoords.push(u * uRepeat, (y + 1) / 2);
    }
  }
  for (let i = 0; i < segments; i++) {
    const k = 2 * i;
    indices.push(k, k + 2, k + 3, k, k + 3, k + 1);
  }

  // Caps: planar mapping of x, z into the texture, T = +x on both
  for (const y of [1, -1]) {
    const center = positions.length / 3;
    positions.push(0, y, 0);
    normals.push(0, y, 0);
    tangents.push(1, 0, 0);
    texCoords.push(0.5, 0.5);
    for (let i = 0; i <= segments; i++) {
      const theta = 2 * Math.PI * i / segments;
      const s = Math.sin(theta), c = Math.cos(theta);
      positions.push(s, y, c);
      normals.push(0, y, 0);
      tangents.push(1, 0, 0);
      texCoords.push(0.5 + 0.5 * s, 0.5 - 0.5 * y * c);  // keeps cross(N, T) along +v
    }
    for (let i = 0; i < segments; i++) {
      const a = center + 1 + i, b = a + 1;
      if (y > 0) indices.push(center, a, b);
      else indices.push(center, b, a);
    }
  }

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    tangents: new Float32Array(tangents),
    texCoords: new Float32Array(texCoords),
    indices: new Uint16Array(indices)
  };
}


function createSphere(latSegments = 32, lonSegments = 64) {
  const positions = [];
  const normals = [];
  const tangents = [];
  const texCoords = [];
  const indices = [];

  // Generate vertices
  for (let lat = 0; lat <= latSegments; lat++) {
    const v = lat / latSegments;
    const phi = v * Math.PI;

    for (let lon = 0; lon <= lonSegments; lon++) {
      const u = lon / lonSegments;
      const theta = u * 2 * Math.PI;

      const x = Math.sin(phi) * Math.cos(theta);
      const y = Math.cos(phi);
      const z = Math.sin(phi) * Math.sin(theta);

      // Position
      positions.push(x, y, z);

      // Normal points outward from sphere center
      normals.push(x, y, z);

      // Tangent points in the U direction
      tangents.push(
        -Math.sin(theta),
        0,
        Math.cos(theta)
      );

      // Texture coordinates
      texCoords.push(u, 1 - v);
    }
  }

  // Connect vertices to form triangles
  for (let lat = 0; lat < latSegments; lat++) {
    for (let lon = 0; lon < lonSegments; lon++) {
      const a = lat * (lonSegments + 1) + lon;
      const b = a + lonSegments + 1;

      indices.push(a, a + 1, b);
      indices.push(a + 1, b + 1, b);
    }
  }

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    tangents: new Float32Array(tangents),
    texCoords: new Float32Array(texCoords),
    indices: new Uint16Array(indices)
  };
}

function createTorus(
  majorRadius = 0.8,
  minorRadius = 0.3,
  majorSegments = 64,
  minorSegments = 32
) {
  const positions = [];
  const normals = [];
  const tangents = [];
  const texCoords = [];
  const indices = [];

  // Generate vertices
  for (let i = 0; i <= majorSegments; i++) {
    const u = i / majorSegments;
    const theta = u * 2 * Math.PI;

    const cosTheta = Math.cos(theta);
    const sinTheta = Math.sin(theta);

    for (let j = 0; j <= minorSegments; j++) {
      const v = j / minorSegments;
      const phi = v * 2 * Math.PI;

      const cosPhi = Math.cos(phi);
      const sinPhi = Math.sin(phi);

      // Vertex position
      const x = (majorRadius + minorRadius * cosPhi) * cosTheta;
      const y = minorRadius * sinPhi;
      const z = (majorRadius + minorRadius * cosPhi) * sinTheta;

      positions.push(x, y, z);

      // Surface normal
      normals.push(
        cosPhi * cosTheta,
        sinPhi,
        cosPhi * sinTheta
      );

      // Tangent in the U direction
      tangents.push(
        -sinTheta,
        0,
        cosTheta
      );

      // UV texture coordinates
      texCoords.push(u * 3, v);
    }
  }

  // Connect vertices into triangles
  for (let i = 0; i < majorSegments; i++) {
    for (let j = 0; j < minorSegments; j++) {
      const a = i * (minorSegments + 1) + j;
      const b = a + minorSegments + 1;

      indices.push(a, a + 1, b);
      indices.push(a + 1, b + 1, b);
    }
  }

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    tangents: new Float32Array(tangents),
    texCoords: new Float32Array(texCoords),
    indices: new Uint16Array(indices)
  };
}

function createCone(segments = 64) {
  const positions = [];
  const normals = [];
  const tangents = [];
  const texCoords = [];
  const indices = [];

  const radius = 1;
  const height = 2;
  const halfHeight = height / 2;

  // Cone side vertices
  for (let i = 0; i <= segments; i++) {
    const u = i / segments;
    const theta = u * 2 * Math.PI;

    const c = Math.cos(theta);
    const s = Math.sin(theta);

    // Normal for a cone side
    const length = Math.sqrt(height * height + radius * radius);

    const nx = height * c / length;
    const ny = radius / length;
    const nz = height * s / length;

    // Bottom vertex
    positions.push(radius * c, -halfHeight, radius * s);
    normals.push(nx, ny, nz);
    tangents.push(-s, 0, c);
    texCoords.push(u, 0);

    // Top vertex (tip)
    positions.push(0, halfHeight, 0);
    normals.push(nx, ny, nz);
    tangents.push(-s, 0, c);
    texCoords.push(u, 1);
  }

  // Side triangles
  for (let i = 0; i < segments; i++) {
    const k = i * 2;
    indices.push(k, k + 2, k + 1);
  }

  // Bottom cap center
  const center = positions.length / 3;

  positions.push(0, -halfHeight, 0);
  normals.push(0, -1, 0);
  tangents.push(1, 0, 0);
  texCoords.push(0.5, 0.5);

  // Bottom cap circle
  for (let i = 0; i <= segments; i++) {
    const theta = i * 2 * Math.PI / segments;

    const c = Math.cos(theta);
    const s = Math.sin(theta);

    positions.push(radius * c, -halfHeight, radius * s);
    normals.push(0, -1, 0);
    tangents.push(1, 0, 0);

    texCoords.push(
      0.5 + 0.5 * c,
      0.5 + 0.5 * s
    );
  }

  // Bottom cap triangles
  for (let i = 0; i < segments; i++) {
    const a = center + 1 + i;
    const b = a + 1;

    indices.push(center, a, b);
  }

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    tangents: new Float32Array(tangents),
    texCoords: new Float32Array(texCoords),
    indices: new Uint16Array(indices)
  };
}
