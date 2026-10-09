import * as THREE from 'three';

/**
 * Procedural Earth Texture Generator
 * Produces ultra-crisp 2048x1024 photorealistic Earth surface maps,
 * cloud layers, and ocean specular maps completely offline and self-contained.
 */

// Major continental polygon paths in [lon, lat] coordinates (degrees)
const CONTINENT_POLYGONS: [number, number][][] = [
  // ─── 1. AFRICA ───────────────────────────────────────────
  [
    [-5.5, 35.8], [3.0, 36.8], [10.5, 37.2], [11.5, 33.0], [15.0, 31.0],
    [24.0, 32.0], [31.5, 31.5], [32.5, 27.0], [35.0, 24.0], [39.0, 16.0],
    [43.0, 12.5], [51.2, 11.8], [49.0, 7.0], [42.0, 0.0], [40.5, -4.5],
    [39.0, -10.0], [36.0, -18.0], [33.0, -25.0], [31.0, -30.0], [26.0, -33.5],
    [18.5, -34.8], [17.5, -30.0], [14.5, -23.0], [12.0, -15.0], [9.0, -4.0],
    [9.5, 4.5], [4.5, 5.0], [-1.0, 5.5], [-7.5, 4.3], [-13.0, 9.0],
    [-17.5, 14.7], [-16.5, 21.0], [-13.0, 27.5], [-9.5, 31.0], [-5.5, 35.8],
  ],
  // Madagascar
  [
    [49.5, -12.0], [50.5, -16.0], [47.5, -25.5], [43.5, -25.0],
    [44.0, -16.0], [47.0, -12.5], [49.5, -12.0],
  ],

  // ─── 2. EURASIA (Europe + Asia) ──────────────────────────
  [
    // Western Europe
    [-9.0, 37.0], [-9.5, 42.0], [-1.5, 43.5], [-4.5, 48.5], [1.5, 51.0],
    [7.0, 53.5], [8.0, 57.5], [12.0, 56.0], [18.0, 55.0], [22.0, 60.0],
    // Scandinavia
    [28.0, 70.5], [20.0, 68.0], [14.0, 68.0], [5.0, 62.0], [8.0, 58.0],
    [15.0, 55.0], [20.0, 54.5], [24.0, 58.0], [30.0, 60.0],
    // Russia & Siberia North Coast
    [40.0, 68.0], [60.0, 70.0], [75.0, 73.0], [105.0, 77.0], [130.0, 73.0],
    [150.0, 72.0], [170.0, 69.0], [180.0, 66.0], [170.0, 60.0],
    // Kamchatka & Pacific Coast
    [160.0, 55.0], [156.0, 51.0], [143.0, 53.0], [135.0, 48.0], [130.0, 42.0],
    // Korea & China
    [129.0, 35.0], [126.0, 38.0], [122.0, 31.0], [120.0, 26.0], [114.0, 22.0],
    [109.0, 21.0], [108.0, 16.0], [105.0, 10.0], [101.0, 12.5], [104.0, 1.3],
    [98.0, 8.0], [96.0, 16.0], [92.5, 20.5],
    // Indian Subcontinent (detailed realistic triangle peninsula)
    [90.0, 22.5], [88.0, 21.5], [83.0, 17.5], [80.0, 13.0], [78.5, 9.5],
    [77.5, 8.1], // Kanyakumari
    [76.0, 10.0], [74.5, 13.0], [72.8, 19.0], // Mumbai
    [69.0, 22.5], // Gujarat / Kutch
    [67.0, 24.5], // Indus mouth
    [62.0, 25.0], [57.0, 26.0], [50.0, 30.0],
    // Arabian Peninsula
    [48.0, 28.0], [55.0, 25.0], [59.0, 22.5], [54.0, 17.0], [45.0, 12.5],
    [43.0, 14.0], [35.0, 27.5], [34.0, 31.0], [36.0, 36.5], [26.0, 41.0],
    // Mediterranean Europe
    [24.0, 38.0], [20.0, 40.0], [16.0, 41.0], [12.0, 44.0], [8.5, 45.0],
    [3.0, 42.5], [-1.0, 36.5], [-9.0, 37.0],
  ],
  // Great Britain & Ireland
  [
    [-5.0, 50.0], [-5.5, 54.5], [-3.0, 58.5], [1.5, 52.5], [-0.5, 50.5], [-5.0, 50.0],
  ],
  [
    [-10.0, 51.5], [-6.0, 52.0], [-6.0, 55.0], [-10.0, 54.0], [-10.0, 51.5],
  ],
  // Japan (Honshu/Hokkaido)
  [
    [141.0, 43.5], [145.0, 44.0], [142.0, 39.0], [136.0, 35.0],
    [130.5, 33.0], [132.0, 34.5], [138.0, 37.5], [141.0, 43.5],
  ],
  // Sri Lanka
  [
    [80.0, 9.5], [81.5, 7.5], [81.0, 6.0], [79.8, 6.5], [80.0, 9.5],
  ],
  // Indonesia (Sumatra, Java, Borneo)
  [
    [95.5, 5.5], [99.0, 2.0], [105.0, -5.0], [102.0, -3.0], [98.0, 2.5], [95.5, 5.5],
  ],
  [
    [106.0, -6.0], [114.0, -7.5], [114.5, -8.5], [106.0, -7.0], [106.0, -6.0],
  ],
  [
    [110.0, 1.0], [117.0, 4.0], [119.0, -3.0], [115.0, -4.0], [110.0, -2.0], [110.0, 1.0],
  ],

  // ─── 3. NORTH AMERICA ────────────────────────────────────
  [
    // Alaska
    [-168.0, 65.5], [-162.0, 60.0], [-150.0, 59.0], [-140.0, 60.0],
    // Canada West
    [-133.0, 54.0], [-126.0, 49.0],
    // US West Coast
    [-124.0, 42.0], [-120.0, 34.5], [-117.0, 32.5],
    // Mexico & Baja
    [-110.0, 23.0], [-105.0, 20.0], [-96.0, 16.0], [-90.0, 14.0],
    [-84.0, 9.5], [-79.5, 8.5], // Panama
    // Gulf of Mexico & Florida
    [-82.0, 9.0], [-87.5, 21.5], [-97.0, 26.0], [-90.0, 29.5],
    [-81.0, 25.0], // Florida Keys
    [-80.0, 31.0], // US East Coast
    [-75.0, 36.0], [-71.0, 42.0], [-64.0, 45.0], [-53.0, 48.0], // Newfoundland
    [-60.0, 55.0], // Labrador
    [-80.0, 58.0], [-95.0, 60.0], [-120.0, 68.0], [-140.0, 70.0],
    [-160.0, 71.0], [-168.0, 65.5],
  ],
  // Greenland
  [
    [-45.0, 60.0], [-25.0, 70.0], [-18.0, 81.0], [-45.0, 83.0],
    [-60.0, 78.0], [-55.0, 65.0], [-45.0, 60.0],
  ],
  // Cuba / Caribbean
  [
    [-85.0, 22.0], [-75.0, 20.0], [-77.0, 22.5], [-85.0, 22.0],
  ],

  // ─── 4. SOUTH AMERICA ────────────────────────────────────
  [
    [-77.0, 8.0], [-72.0, 11.5], [-62.0, 10.5], [-50.0, 0.0],
    [-35.0, -5.5], // Brazil eastern tip
    [-35.0, -9.0], [-38.5, -13.0], [-43.0, -23.0], // Rio
    [-48.0, -28.0], [-53.0, -33.0], [-57.0, -36.0], // Buenos Aires
    [-64.0, -41.0], [-66.0, -47.0], [-67.0, -55.0], // Cape Horn
    [-74.0, -52.0], [-73.5, -42.0], [-71.5, -33.0], [-70.5, -23.5], // Chile
    [-77.0, -12.0], // Lima
    [-80.5, -2.5], // Ecuador
    [-77.5, 4.0], [-77.0, 8.0],
  ],

  // ─── 5. AUSTRALIA & OCEANIA ──────────────────────────────
  [
    // Australia mainland
    [142.0, -11.0], [146.0, -19.0], [153.0, -27.5], [151.2, -33.8], // Sydney
    [145.0, -38.0], [138.5, -35.0], [130.0, -32.0], [122.0, -34.0],
    [115.5, -32.0], // Perth
    [113.5, -26.0], [114.0, -21.5], [125.0, -15.0], [131.0, -12.5], // Darwin
    [136.0, -15.0], [142.0, -11.0],
  ],
  // Tasmania
  [
    [145.0, -41.0], [148.0, -41.5], [147.0, -43.5], [145.0, -41.0],
  ],
  // New Zealand
  [
    [174.0, -35.0], [178.0, -38.0], [175.0, -41.5], [172.0, -44.0],
    [167.0, -46.0], [169.0, -43.0], [174.0, -35.0],
  ],

  // ─── 6. ANTARCTICA ───────────────────────────────────────
  [
    [-180.0, -68.0], [-120.0, -72.0], [-60.0, -64.0], [0.0, -68.0],
    [60.0, -66.0], [120.0, -66.0], [180.0, -68.0], [180.0, -90.0],
    [-180.0, -90.0], [-180.0, -68.0],
  ],
];

// Major world metropolitan centers for realistic night city lights
const CITY_LIGHTS: [number, number, number][] = [
  // India (High density)
  [77.2, 28.6, 1.0], // New Delhi
  [72.8, 19.0, 1.0], // Mumbai
  [77.5, 12.9, 0.95], // Bengaluru
  [88.3, 22.5, 0.9], // Kolkata
  [80.2, 13.0, 0.9], // Chennai
  [78.4, 17.3, 0.85], // Hyderabad
  [72.5, 23.0, 0.8], // Ahmedabad
  [73.8, 18.5, 0.8], // Pune

  // East Asia
  [139.7, 35.6, 1.0], // Tokyo
  [135.5, 34.6, 0.9], // Osaka
  [126.9, 37.5, 0.95], // Seoul
  [121.4, 31.2, 1.0], // Shanghai
  [116.4, 39.9, 0.95], // Beijing
  [113.2, 23.1, 0.9], // Guangzhou
  [114.1, 22.3, 0.95], // Hong Kong
  [121.5, 25.0, 0.85], // Taipei
  [103.8, 1.3, 0.95], // Singapore
  [100.5, 13.7, 0.85], // Bangkok
  [106.8, -6.2, 0.85], // Jakarta

  // Europe
  [-0.1, 51.5, 1.0], // London
  [2.3, 48.8, 0.95], // Paris
  [13.4, 52.5, 0.85], // Berlin
  [4.9, 52.3, 0.85], // Amsterdam
  [-3.7, 40.4, 0.85], // Madrid
  [12.5, 41.9, 0.85], // Rome
  [37.6, 55.7, 0.9], // Moscow
  [9.1, 45.4, 0.8], // Milan

  // Middle East
  [55.3, 25.2, 0.95], // Dubai
  [46.7, 24.7, 0.85], // Riyadh
  [31.2, 30.0, 0.9], // Cairo
  [35.2, 31.7, 0.8], // Jerusalem
  [51.4, 35.7, 0.85], // Tehran

  // North America
  [-74.0, 40.7, 1.0], // New York
  [-77.0, 38.9, 0.95], // Washington DC
  [-87.6, 41.8, 0.9], // Chicago
  [-118.2, 34.0, 1.0], // Los Angeles
  [-122.4, 37.7, 0.95], // San Francisco
  [-95.3, 29.7, 0.85], // Houston
  [-80.2, 25.7, 0.9], // Miami
  [-79.3, 43.6, 0.85], // Toronto
  [-99.1, 19.4, 0.9], // Mexico City

  // South America
  [-46.6, -23.5, 0.95], // São Paulo
  [-43.1, -22.9, 0.9], // Rio de Janeiro
  [-58.4, -34.6, 0.9], // Buenos Aires
  [-70.6, -33.4, 0.8], // Santiago
  [-74.0, 4.7, 0.8], // Bogotá

  // Australia & Africa
  [151.2, -33.8, 0.9], // Sydney
  [144.9, -37.8, 0.85], // Melbourne
  [28.0, -26.2, 0.85], // Johannesburg
  [3.3, 6.5, 0.85], // Lagos
  [36.8, -1.2, 0.8], // Nairobi
];

/**
 * Generates an ultra-detailed Earth surface texture map on a 2D canvas.
 * @param width Canvas width in pixels (default 2048)
 * @param height Canvas height in pixels (default 1024)
 */
export function createEarthTexture(width = 2048, height = 1024): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // 1. Deep Ocean Base with Bathymetric Gradients
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, height);
  oceanGrad.addColorStop(0.0, '#040d1a'); // Arctic deep abyss
  oceanGrad.addColorStop(0.2, '#06162a');
  oceanGrad.addColorStop(0.5, '#0a2540'); // Equatorial blue
  oceanGrad.addColorStop(0.8, '#06162a');
  oceanGrad.addColorStop(1.0, '#040d1a'); // Antarctic abyss
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, width, height);

  // Subtle ocean current latitudinal streaks
  ctx.fillStyle = 'rgba(14, 165, 233, 0.04)';
  for (let y = 80; y < height; y += 40) {
    ctx.fillRect(0, y, width, 18);
  }

  // Helper to map [lon, lat] degrees to canvas [x, y] pixels
  const project = (lon: number, lat: number): [number, number] => {
    const x = ((lon + 180) / 360) * width;
    const y = ((90 - lat) / 180) * height;
    return [x, y];
  };

  // 2. Continental Landmasses
  CONTINENT_POLYGONS.forEach((polygon) => {
    if (polygon.length < 3) return;

    // Draw Shallow Coastal Shelf Glow
    ctx.beginPath();
    const firstPt = project(polygon[0][0], polygon[0][1]);
    ctx.moveTo(firstPt[0], firstPt[1]);
    for (let i = 1; i < polygon.length; i++) {
      const pt = project(polygon[i][0], polygon[i][1]);
      ctx.lineTo(pt[0], pt[1]);
    }
    ctx.closePath();

    ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)'; // Cyan shelf glow
    ctx.lineWidth = 14;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Secondary coastal rim
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.45)'; // Emerald coastal water
    ctx.lineWidth = 6;
    ctx.stroke();

    // Fill Landmass with Realistic Earth Palette
    const landGrad = ctx.createLinearGradient(0, 0, 0, height);
    landGrad.addColorStop(0.0, '#dbeafe'); // Arctic Ice / Snow
    landGrad.addColorStop(0.18, '#1e3a2e'); // Northern Boreal Forest
    landGrad.addColorStop(0.35, '#234e38'); // Temperate Green
    landGrad.addColorStop(0.48, '#a67c52'); // Sahara / Desert sands
    landGrad.addColorStop(0.55, '#166534'); // Tropical Rainforest (Amazon, Congo, India)
    landGrad.addColorStop(0.72, '#9a6b41'); // Outback & Savanna
    landGrad.addColorStop(0.88, '#1e3a2e'); // Patagonia / Southern Forest
    landGrad.addColorStop(1.0, '#f8fafc'); // Antarctic Ice Sheet

    ctx.fillStyle = landGrad;
    ctx.fill();

    // Crisp Bioluminescent Digital Frontier Border
    ctx.strokeStyle = '#34d399';
    ctx.lineWidth = 1.6;
    ctx.stroke();
  });

  // 3. Glowing Night City Lights & Infrastructure Corridors
  CITY_LIGHTS.forEach(([lon, lat, intensity]) => {
    const [cx, cy] = project(lon, lat);

    // City glow halo
    const rad = 10 * intensity;
    const cityGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
    cityGrad.addColorStop(0.0, `rgba(254, 240, 138, ${0.95 * intensity})`); // Golden center
    cityGrad.addColorStop(0.3, `rgba(245, 158, 11, ${0.65 * intensity})`); // Amber halo
    cityGrad.addColorStop(1.0, 'rgba(245, 158, 11, 0.0)');

    ctx.fillStyle = cityGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, rad, 0, Math.PI * 2);
    ctx.fill();

    // Micro city lights cluster
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(cx - 1, cy - 1, 2, 2);
  });

  // 4. Subtle Latitude & Longitude Geodetic Grid
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.08)';
  ctx.lineWidth = 1;
  // Parallels (Latitudes)
  for (let lat = -60; lat <= 60; lat += 30) {
    const y = ((90 - lat) / 180) * height;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  // Meridians (Longitudes)
  for (let lon = -150; lon <= 180; lon += 30) {
    const x = ((lon + 180) / 360) * width;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  // Create Three.js Texture
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

/**
 * Generates an atmospheric cloud texture with swirling meteorological patterns.
 */
export function createCloudTexture(width = 1024, height = 512): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, width, height);

  // Procedural cloud bands (Equatorial ITCZ + Mid-latitude storm spirals)
  const cloudBands = [
    { y: 0.15, h: 60, opacity: 0.45 }, // Arctic storm belt
    { y: 0.35, h: 80, opacity: 0.55 }, // Northern temperate storms
    { y: 0.50, h: 50, opacity: 0.70 }, // Intertropical Convergence Zone (ITCZ)
    { y: 0.65, h: 85, opacity: 0.60 }, // Southern Roaring Forties
    { y: 0.85, h: 55, opacity: 0.50 }, // Antarctic vortex
  ];

  cloudBands.forEach((band) => {
    const centerY = band.y * height;
    for (let x = 0; x < width; x += 15) {
      const wave = Math.sin(x * 0.02) * 18 + Math.cos(x * 0.05) * 12;
      const py = centerY + wave;
      const radius = 25 + Math.sin(x * 0.03) * 15;

      const grad = ctx.createRadialGradient(x, py, 2, x, py, radius);
      grad.addColorStop(0.0, `rgba(255, 255, 255, ${band.opacity})`);
      grad.addColorStop(0.6, `rgba(240, 249, 255, ${band.opacity * 0.4})`);
      grad.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, py, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  // Soft atmospheric blur
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  return texture;
}
