import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  RotateCcw,
  Pause,
  Play,
  ZoomIn,
  ZoomOut,
  Radio,
  Sparkles,
  Building2,
  Trees,
  Landmark,
  CheckCircle2,
  Maximize2,
} from 'lucide-react';
import { IndiaTelemetryModal } from './IndiaTelemetryModal';

interface ComplianceGlobe3DProps {
  monitoredCount?: number;
  activeAuditsCount?: number;
  averagePassRate?: number;
  className?: string;
}

export interface LocalGovNode {
  id: string;
  name: string;
  category: 'gram_panchayat' | 'taluk_panchayat' | 'municipal_corporation' | 'town_municipality';
  categoryLabel: string;
  district: string;
  state: string;
  complianceRate: number;
  lat: number;
  lon: number;
  services: string[];
  colorHex: string;
  color: number;
}

interface HoveredNode {
  type: 'national' | 'panchayat' | 'municipal';
  name: string;
  categoryLabel: string;
  district: string;
  state: string;
  complianceRate: number;
  lat: number;
  lon: number;
  services: string[];
  colorHex: string;
  screenX: number;
  screenY: number;
}

/**
 * Creates a soft feathered circular glow texture on an HTML5 canvas.
 */
function createSoftGlowTexture(colorHex: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0.0, 'rgba(255, 255, 255, 0.95)');
  grad.addColorStop(0.18, colorHex);
  grad.addColorStop(0.5, 'rgba(56, 189, 248, 0.22)');
  grad.addColorStop(1.0, 'rgba(56, 189, 248, 0.0)');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(64, 64, 64, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.generateMipmaps = true;
  return texture;
}

/**
 * Creates a high-definition anamorphic celestial diamond flare texture (256x256).
 * Produces crisp, needle-sharp diamond diffraction spikes, 45° secondary glints,
 * and a white-hot photon core directly centered over each office location.
 */
function createLuminousShineTexture(tintHex: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  const cx = 128;
  const cy = 128;

  // 1. Soft radial aura falloff
  const radGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 54);
  radGrad.addColorStop(0.0, '#ffffff');
  radGrad.addColorStop(0.18, '#ffffff');
  radGrad.addColorStop(0.42, tintHex);
  radGrad.addColorStop(0.72, 'rgba(255, 255, 255, 0.15)');
  radGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = radGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, 54, 0, Math.PI * 2);
  ctx.fill();

  // 2. Tapered diamond diffraction spikes (Cardinals)
  const drawDiamondSpike = (angle: number, length: number, baseWidth: number) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);

    const grad = ctx.createLinearGradient(0, 0, 0, -length);
    grad.addColorStop(0.0, '#ffffff');
    grad.addColorStop(0.25, '#ffffff');
    grad.addColorStop(0.48, tintHex);
    grad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, -length);
    ctx.lineTo(baseWidth, 0);
    ctx.lineTo(0, baseWidth * 0.4);
    ctx.lineTo(-baseWidth, 0);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  };

  [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].forEach((angle) => {
    drawDiamondSpike(angle, 114, 6.0);
  });

  [Math.PI / 4, (3 * Math.PI) / 4, (5 * Math.PI) / 4, (7 * Math.PI) / 4].forEach((angle) => {
    drawDiamondSpike(angle, 60, 3.0);
  });

  // 3. Central white-hot photon bead
  const beadGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 10);
  beadGrad.addColorStop(0.0, '#ffffff');
  beadGrad.addColorStop(0.65, '#ffffff');
  beadGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = beadGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, 10, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.generateMipmaps = true;
  return texture;
}

// Real Gram Panchayat & Municipal Office Locations (with focus on Karnataka & India model panchayats)
export const REAL_LOCAL_GOV_NODES: LocalGovNode[] = [
  // ── Karnataka: Coastal & Western Belt ──
  {
    id: 'gp-padubidri',
    name: 'Padubidri Gram Panchayat',
    category: 'gram_panchayat',
    categoryLabel: 'Gram Panchayat',
    district: 'Udupi District',
    state: 'Karnataka',
    complianceRate: 94,
    lat: 13.1364,
    lon: 74.7816,
    services: ['e-GramSwaraj', 'Form 9 & 11 Property Registry', 'Water Tax', 'Citizen Grievances'],
    colorHex: 'rgba(251, 191, 36, 0.95)', // Radiant Amber Gold
    color: 0xfbbf24,
  },
  {
    id: 'mc-mangaluru',
    name: 'Mangaluru City Corporation (MCC)',
    category: 'municipal_corporation',
    categoryLabel: 'Municipal Corporation HQ',
    district: 'Dakshina Kannada',
    state: 'Karnataka',
    complianceRate: 91,
    lat: 12.8703,
    lon: 74.8427,
    services: ['Property Tax Online (SAS)', 'Trade License', 'Birth/Death Records', 'Water Billing'],
    colorHex: 'rgba(56, 189, 248, 0.95)', // Electric Cyan
    color: 0x38bdf8,
  },
  {
    id: 'cmc-udupi',
    name: 'Udupi City Municipal Council',
    category: 'town_municipality',
    categoryLabel: 'City Municipal Council',
    district: 'Udupi District',
    state: 'Karnataka',
    complianceRate: 89,
    lat: 13.3409,
    lon: 74.7421,
    services: ['e-Swathu Portal', 'Khata Transfer', 'Building Approvals', 'Solid Waste Portal'],
    colorHex: 'rgba(56, 189, 248, 0.95)',
    color: 0x38bdf8,
  },
  {
    id: 'tmc-bantwal',
    name: 'Bantwal Town Municipal Council',
    category: 'town_municipality',
    categoryLabel: 'Town Municipality',
    district: 'Dakshina Kannada',
    state: 'Karnataka',
    complianceRate: 86,
    lat: 12.8943,
    lon: 75.0345,
    services: ['Trade License Renewal', 'Property Tax', 'Civic Complaints'],
    colorHex: 'rgba(56, 189, 248, 0.95)',
    color: 0x38bdf8,
  },
  {
    id: 'cmc-puttur',
    name: 'Puttur City Municipal Council',
    category: 'town_municipality',
    categoryLabel: 'City Municipal Council',
    district: 'Dakshina Kannada',
    state: 'Karnataka',
    complianceRate: 88,
    lat: 12.7661,
    lon: 75.2014,
    services: ['e-Aasthi Property Portal', 'Water Meter Billing', 'Public Grievance'],
    colorHex: 'rgba(56, 189, 248, 0.95)',
    color: 0x38bdf8,
  },
  {
    id: 'tmc-kundapura',
    name: 'Kundapura Town Municipal Council',
    category: 'town_municipality',
    categoryLabel: 'Town Municipality',
    district: 'Udupi District',
    state: 'Karnataka',
    complianceRate: 87,
    lat: 13.6272,
    lon: 74.6936,
    services: ['Coastal Zone Clearances', 'Property Tax', 'Citizen Certifications'],
    colorHex: 'rgba(56, 189, 248, 0.95)',
    color: 0x38bdf8,
  },
  {
    id: 'tmc-kumta',
    name: 'Kumta Town Municipal Council',
    category: 'town_municipality',
    categoryLabel: 'Town Municipality',
    district: 'Uttara Kannada',
    state: 'Karnataka',
    complianceRate: 85,
    lat: 14.4253,
    lon: 74.4172,
    services: ['Coastal Registry', 'Civic Tax Portal', 'Building Licences'],
    colorHex: 'rgba(56, 189, 248, 0.95)',
    color: 0x38bdf8,
  },
  {
    id: 'cmc-madikeri',
    name: 'Madikeri City Municipal Council',
    category: 'town_municipality',
    categoryLabel: 'City Municipal Council',
    district: 'Kodagu District',
    state: 'Karnataka',
    complianceRate: 90,
    lat: 12.4244,
    lon: 75.7382,
    services: ['Hill Area Planning', 'e-Tax Gateway', 'Tourism Licensing'],
    colorHex: 'rgba(56, 189, 248, 0.95)',
    color: 0x38bdf8,
  },

  // ── Karnataka: Bengaluru & South Karnataka ──
  {
    id: 'gp-hebbal',
    name: 'Hebbal Ward & Panchayat Node',
    category: 'gram_panchayat',
    categoryLabel: 'Panchayat & Ward Office',
    district: 'Bengaluru Urban',
    state: 'Karnataka',
    complianceRate: 95,
    lat: 13.0358,
    lon: 77.5970,
    services: ['BBMP Sahaaya 2.0', 'Property Tax (SAS)', 'Khata Registration', 'Pothole Grievances'],
    colorHex: 'rgba(251, 191, 36, 0.95)',
    color: 0xfbbf24,
  },
  {
    id: 'tmc-anekal',
    name: 'Anekal Town Municipal Council',
    category: 'town_municipality',
    categoryLabel: 'Town Municipality',
    district: 'Bengaluru Urban',
    state: 'Karnataka',
    complianceRate: 88,
    lat: 12.7107,
    lon: 77.6974,
    services: ['e-Swathu Verification', 'Property Assessment', 'Water Billing'],
    colorHex: 'rgba(56, 189, 248, 0.95)',
    color: 0x38bdf8,
  },
  {
    id: 'tmc-devanahalli',
    name: 'Devanahalli Town Municipal Council',
    category: 'town_municipality',
    categoryLabel: 'Town Municipality',
    district: 'Bengaluru Rural',
    state: 'Karnataka',
    complianceRate: 92,
    lat: 13.2483,
    lon: 77.7126,
    services: ['Industrial Corridor Tax', 'Building Permits', 'Trade License'],
    colorHex: 'rgba(56, 189, 248, 0.95)',
    color: 0x38bdf8,
  },
  {
    id: 'mc-mysuru',
    name: 'Mysuru City Corporation',
    category: 'municipal_corporation',
    categoryLabel: 'Municipal Corporation',
    district: 'Mysuru District',
    state: 'Karnataka',
    complianceRate: 93,
    lat: 12.3051,
    lon: 76.6554,
    services: ['MCC Civic Portal', 'Heritage Zone Approvals', 'Online Water Bill', 'Trade License'],
    colorHex: 'rgba(56, 189, 248, 0.95)',
    color: 0x38bdf8,
  },

  // ── Karnataka: North & Central Belt ──
  {
    id: 'mc-hdmc',
    name: 'Hubballi-Dharwad Municipal Corp (HDMC)',
    category: 'municipal_corporation',
    categoryLabel: 'Municipal Corporation',
    district: 'Dharwad District',
    state: 'Karnataka',
    complianceRate: 90,
    lat: 15.3647,
    lon: 75.1240,
    services: ['e-Governance Seva', 'Property Tax', 'Birth/Death Records', 'Water Supply'],
    colorHex: 'rgba(56, 189, 248, 0.95)',
    color: 0x38bdf8,
  },
  {
    id: 'mc-belagavi',
    name: 'Belagavi City Corporation',
    category: 'municipal_corporation',
    categoryLabel: 'Municipal Corporation',
    district: 'Belagavi District',
    state: 'Karnataka',
    complianceRate: 88,
    lat: 15.8497,
    lon: 74.4977,
    services: ['Bilingual Citizen Portal', 'Property Tax', 'Trade License'],
    colorHex: 'rgba(56, 189, 248, 0.95)',
    color: 0x38bdf8,
  },
  {
    id: 'mc-shivamogga',
    name: 'Shivamogga City Corporation',
    category: 'municipal_corporation',
    categoryLabel: 'Municipal Corporation',
    district: 'Shivamogga District',
    state: 'Karnataka',
    complianceRate: 89,
    lat: 13.9299,
    lon: 75.5681,
    services: ['Smart City Portal', 'Property Tax e-Payment', 'Public Complaints'],
    colorHex: 'rgba(56, 189, 248, 0.95)',
    color: 0x38bdf8,
  },
  {
    id: 'mc-kalaburagi',
    name: 'Kalaburagi City Corporation',
    category: 'municipal_corporation',
    categoryLabel: 'Municipal Corporation',
    district: 'Kalaburagi District',
    state: 'Karnataka',
    complianceRate: 84,
    lat: 17.3297,
    lon: 76.8343,
    services: ['Kalyana Karnataka Portal', 'Property Tax', 'Citizen Seva Kendra'],
    colorHex: 'rgba(56, 189, 248, 0.95)',
    color: 0x38bdf8,
  },

  // ── National Benchmark Gram Panchayats & Municipalities ──
  {
    id: 'gp-punsari',
    name: 'Punsari Model Smart Gram Panchayat',
    category: 'gram_panchayat',
    categoryLabel: 'Model Gram Panchayat',
    district: 'Sabarkantha',
    state: 'Gujarat',
    complianceRate: 98,
    lat: 23.4682,
    lon: 73.0118,
    services: ['e-Gram Centre', 'Smart Public Audio System', 'Digital Education Portal', 'RO Water Gateway'],
    colorHex: 'rgba(251, 191, 36, 0.95)',
    color: 0xfbbf24,
  },
  {
    id: 'gp-hiware',
    name: 'Hiware Bazar Gram Panchayat',
    category: 'gram_panchayat',
    categoryLabel: 'Eco Gram Panchayat',
    district: 'Ahmednagar',
    state: 'Maharashtra',
    complianceRate: 96,
    lat: 19.0305,
    lon: 74.7570,
    services: ['Water Budgeting Portal', 'e-GramSwaraj', 'Land Records e-Seva', 'Village Audit'],
    colorHex: 'rgba(251, 191, 36, 0.95)',
    color: 0xfbbf24,
  },
  {
    id: 'gp-odanthurai',
    name: 'Odanthurai Green Gram Panchayat',
    category: 'gram_panchayat',
    categoryLabel: 'Model Gram Panchayat',
    district: 'Coimbatore',
    state: 'Tamil Nadu',
    complianceRate: 95,
    lat: 11.3094,
    lon: 76.9427,
    services: ['Renewable Energy Telemetry', 'e-Panchayat', 'Tax Online', 'Housing Welfare'],
    colorHex: 'rgba(251, 191, 36, 0.95)',
    color: 0xfbbf24,
  },
  {
    id: 'gp-ralegan',
    name: 'Ralegan Siddhi Gram Panchayat',
    category: 'gram_panchayat',
    categoryLabel: 'Model Gram Panchayat',
    district: 'Ahmednagar',
    state: 'Maharashtra',
    complianceRate: 94,
    lat: 19.0068,
    lon: 74.4608,
    services: ['Watershed Management', 'Citizen Seva Kendra', 'Village Welfare Records'],
    colorHex: 'rgba(251, 191, 36, 0.95)',
    color: 0xfbbf24,
  },
  {
    id: 'gp-kakkodi',
    name: 'Kakkodi Digital Gram Panchayat',
    category: 'gram_panchayat',
    categoryLabel: 'Digital Gram Panchayat',
    district: 'Kozhikode',
    state: 'Kerala',
    complianceRate: 97,
    lat: 11.3126,
    lon: 75.8016,
    services: ['100% e-Literacy Portal', 'Citizen Certificates', 'Building Plan Approvals'],
    colorHex: 'rgba(251, 191, 36, 0.95)',
    color: 0xfbbf24,
  },
  {
    id: 'gp-kothur',
    name: 'Kothur Gram Panchayat',
    category: 'gram_panchayat',
    categoryLabel: 'Gram Panchayat',
    district: 'Rangareddy',
    state: 'Telangana',
    complianceRate: 91,
    lat: 17.1511,
    lon: 78.2917,
    services: ['Panchayat Secretary e-Desk', 'T-Fiber Citizen Access', 'Mutation Registry'],
    colorHex: 'rgba(251, 191, 36, 0.95)',
    color: 0xfbbf24,
  },
  {
    id: 'mc-bmc',
    name: 'Brihanmumbai Municipal Corporation (BMC)',
    category: 'municipal_corporation',
    categoryLabel: 'Municipal Corporation',
    district: 'Mumbai',
    state: 'Maharashtra',
    complianceRate: 95,
    lat: 18.9403,
    lon: 72.8354,
    services: ['e-Municipal Services', 'Property Tax', 'Disaster Control Telemetry', 'Auto DCR'],
    colorHex: 'rgba(56, 189, 248, 0.95)',
    color: 0x38bdf8,
  },
  {
    id: 'mc-gcc',
    name: 'Greater Chennai Corporation (GCC)',
    category: 'municipal_corporation',
    categoryLabel: 'Municipal Corporation',
    district: 'Chennai',
    state: 'Tamil Nadu',
    complianceRate: 93,
    lat: 13.0827,
    lon: 80.2707,
    services: ['Namma Chennai Citizen App', 'Property Tax', 'Birth/Death Certificates', 'Grievance 1913'],
    colorHex: 'rgba(56, 189, 248, 0.95)',
    color: 0x38bdf8,
  },
  {
    id: 'mc-pmc',
    name: 'Pune Municipal Corporation (PMC)',
    category: 'municipal_corporation',
    categoryLabel: 'Municipal Corporation',
    district: 'Pune',
    state: 'Maharashtra',
    complianceRate: 94,
    lat: 18.5204,
    lon: 73.8567,
    services: ['PMC Care 24x7', 'Property Tax Rebates', 'Tree Census Portal', 'Water Metering'],
    colorHex: 'rgba(56, 189, 248, 0.95)',
    color: 0x38bdf8,
  },
  {
    id: 'mc-ndmc',
    name: 'New Delhi Municipal Council (NDMC)',
    category: 'municipal_corporation',
    categoryLabel: 'Municipal Council',
    district: 'New Delhi',
    state: 'Delhi (NCT)',
    complianceRate: 96,
    lat: 28.5983,
    lon: 77.2181,
    services: ['NDMC 311 Citizen App', 'Property Tax', 'Electricity & Water e-Bill', 'Estate Licences'],
    colorHex: 'rgba(56, 189, 248, 0.95)',
    color: 0x38bdf8,
  },
  {
    id: 'mc-kmc',
    name: 'Kolkata Municipal Corporation (KMC)',
    category: 'municipal_corporation',
    categoryLabel: 'Municipal Corporation',
    district: 'Kolkata',
    state: 'West Bengal',
    complianceRate: 89,
    lat: 22.5626,
    lon: 88.3512,
    services: ['KMC Citizen Portal', 'Assessment & Collection', 'License Department', 'Water Supply'],
    colorHex: 'rgba(56, 189, 248, 0.95)',
    color: 0x38bdf8,
  },
  {
    id: 'mc-ghmc',
    name: 'Greater Hyderabad Municipal Corp (GHMC)',
    category: 'municipal_corporation',
    categoryLabel: 'Municipal Corporation',
    district: 'Hyderabad',
    state: 'Telangana',
    complianceRate: 92,
    lat: 17.3850,
    lon: 78.4867,
    services: ['MyGHMC App', 'Trade License Online', 'Property Tax e-Seva', 'Town Planning Approvals'],
    colorHex: 'rgba(56, 189, 248, 0.95)',
    color: 0x38bdf8,
  },
];

// Atmospheric horizon limb shader
const atmosphereVertexShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const atmosphereFragmentShader = `
  uniform vec3 uColor;
  varying vec3 vNormal;
  varying vec3 vPosition;
  void main() {
    float viewDot = abs(dot(vNormal, normalize(-vPosition)));
    float fresnel = pow(1.0 - viewDot, 5.5);
    gl_FragColor = vec4(uColor, fresnel * 0.55);
  }
`;

export const ComplianceGlobe3D: React.FC<ComplianceGlobe3DProps> = ({
  monitoredCount = 22,
  activeAuditsCount = 16,
  averagePassRate = 76,
  className = '',
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [hoveredNode, setHoveredNode] = useState<HoveredNode | null>(null);
  const [isAutoRotating, setIsAutoRotating] = useState(true);
  const [isIndiaModalOpen, setIsIndiaModalOpen] = useState(false);
  const [isPanchayatZoomActive, setIsPanchayatZoomActive] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'panchayat' | 'municipal'>('all');
  const [detectedCount, setDetectedCount] = useState<number>(0);

  // References for camera controls and smooth animation
  const resetViewRef = useRef<() => void>(() => {});
  const zoomInRef = useRef<() => void>(() => {});
  const zoomOutRef = useRef<() => void>(() => {});
  const focusPanchayatsRef = useRef<() => void>(() => {});
  const isAutoRotatingRef = useRef(isAutoRotating);
  isAutoRotatingRef.current = isAutoRotating;
  const activeFilterRef = useRef(activeFilter);
  activeFilterRef.current = activeFilter;

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Scene
    const scene = new THREE.Scene();

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 420;

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 1000);
    camera.position.z = 210;
    let targetCameraZ = 210;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);

    const globeGroup = new THREE.Group();
    globeGroup.rotation.z = 0.35;
    scene.add(globeGroup);

    const disposables: { dispose: () => void }[] = [];
    const interactiveNodeMeshes: THREE.Mesh[] = [];

    // ─── 1. PHOTOREALISTIC TEXTURE MAPS ─────────────────
    const sphereRadius = 65;
    const textureLoader = new THREE.TextureLoader();

    const earthDayMap = textureLoader.load('/textures/earth_atmos_2048.jpg');
    earthDayMap.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);

    const earthNormalMap = textureLoader.load('/textures/earth_normal_2048.jpg');
    const earthSpecularMap = textureLoader.load('/textures/earth_specular_2048.jpg');
    const earthLightsMap = textureLoader.load('/textures/earth_lights_2048.png');
    const earthCloudsMap = textureLoader.load('/textures/earth_clouds_1024.png');

    disposables.push(earthDayMap, earthNormalMap, earthSpecularMap, earthLightsMap, earthCloudsMap);

    // ─── 2. EARTH SURFACE ──────────────────────────────
    const earthGeo = new THREE.SphereGeometry(sphereRadius, 64, 64);
    const earthMat = new THREE.MeshPhongMaterial({
      map: earthDayMap,
      normalMap: earthNormalMap,
      normalScale: new THREE.Vector2(0.55, 0.55),
      specularMap: earthSpecularMap,
      specular: new THREE.Color(0x283848),
      shininess: 24,
      emissiveMap: earthLightsMap,
      emissive: new THREE.Color(0xd49b4b),
      emissiveIntensity: 0.55,
    });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    globeGroup.add(earthMesh);
    disposables.push(earthGeo, earthMat);

    // ─── 3. CLOUDS ─────────────────────────────────────
    const cloudGeo = new THREE.SphereGeometry(sphereRadius * 1.006, 64, 64);
    const cloudMat = new THREE.MeshLambertMaterial({
      map: earthCloudsMap,
      transparent: true,
      opacity: 0.30,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
    globeGroup.add(cloudMesh);
    disposables.push(cloudGeo, cloudMat);

    // ─── 4. ATMOSPHERE ─────────────────────────────────
    const atmoGeo = new THREE.SphereGeometry(sphereRadius * 1.012, 64, 64);
    const atmoMat = new THREE.ShaderMaterial({
      vertexShader: atmosphereVertexShader,
      fragmentShader: atmosphereFragmentShader,
      uniforms: {
        uColor: { value: new THREE.Color(0x60a5fa) },
      },
      transparent: true,
      side: THREE.BackSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const atmoMesh = new THREE.Mesh(atmoGeo, atmoMat);
    globeGroup.add(atmoMesh);
    disposables.push(atmoGeo, atmoMat);

    // ─── 5. LIGHTING ───────────────────────────────────
    const sunLight = new THREE.DirectionalLight(0xfffcf2, 2.3);
    sunLight.position.set(150, 85, 140);
    scene.add(sunLight);

    const ambientLight = new THREE.AmbientLight(0x1a2636, 0.85);
    scene.add(ambientLight);

    // ─── 6. NATIONAL LEVEL NODES ───────────────────────
    const portalNodes = [
      { name: 'National Portal of India', country: 'Govt of India', complianceRate: 98, lat: 28.6, lon: 77.2, color: 0x10b981, colorHex: 'rgba(16, 185, 129, 0.85)' },
      { name: 'BBMP Municipal Gateway', country: 'Karnataka State', complianceRate: 92, lat: 12.9, lon: 77.5, color: 0x38bdf8, colorHex: 'rgba(56, 189, 248, 0.85)' },
      { name: 'Digital India Core Services', country: 'MeitY India', complianceRate: 96, lat: 19.0, lon: 72.8, color: 0x10b981, colorHex: 'rgba(16, 185, 129, 0.85)' },
      { name: 'GOV.UK International Benchmark', country: 'United Kingdom', complianceRate: 99, lat: 51.5, lon: -0.1, color: 0x818cf8, colorHex: 'rgba(129, 140, 248, 0.85)' },
      { name: 'USA.gov Accessibility Standard', country: 'United States', complianceRate: 97, lat: 38.9, lon: -77.0, color: 0xa78bfa, colorHex: 'rgba(167, 139, 250, 0.85)' },
      { name: 'IRCTC Transit Gateway', country: 'Indian Railways', complianceRate: 89, lat: 22.5, lon: 88.3, color: 0x2dd4bf, colorHex: 'rgba(45, 212, 191, 0.85)' },
    ];

    const nodePositions: THREE.Vector3[] = [];
    const nationalGlowSprites: THREE.Sprite[] = [];
    const nationalPulseRings: THREE.Mesh[] = [];

    portalNodes.forEach((node) => {
      const phi = (90 - node.lat) * (Math.PI / 180);
      const theta = (node.lon + 180) * (Math.PI / 180);
      const r = sphereRadius * 1.008;
      const x = -(r * Math.sin(phi) * Math.cos(theta));
      const z = r * Math.sin(phi) * Math.sin(theta);
      const y = r * Math.cos(phi);
      const pos = new THREE.Vector3(x, y, z);
      nodePositions.push(pos);

      // Core dot
      const dotGeo = new THREE.SphereGeometry(0.7, 16, 16);
      const dotMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const dotMesh = new THREE.Mesh(dotGeo, dotMat);
      dotMesh.position.copy(pos);
      dotMesh.userData = { portalData: node };
      globeGroup.add(dotMesh);
      interactiveNodeMeshes.push(dotMesh);
      disposables.push(dotGeo, dotMat);

      // Invisible hit collider for effortless raycasting
      const hitGeo = new THREE.SphereGeometry(1.8, 8, 8);
      const hitMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
      const hitMesh = new THREE.Mesh(hitGeo, hitMat);
      hitMesh.position.copy(pos);
      hitMesh.userData = { portalData: node };
      globeGroup.add(hitMesh);
      interactiveNodeMeshes.push(hitMesh);
      disposables.push(hitGeo, hitMat);

      const glowTex = createSoftGlowTexture(node.colorHex);
      const spriteMat = new THREE.SpriteMaterial({
        map: glowTex,
        transparent: true,
        opacity: 0.75,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const sprite = new THREE.Sprite(spriteMat);
      sprite.position.copy(pos);
      sprite.scale.set(3.4, 3.4, 1);
      globeGroup.add(sprite);
      nationalGlowSprites.push(sprite);
      disposables.push(glowTex, spriteMat);

      const ringGeo = new THREE.RingGeometry(0.85, 1.15, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: node.color,
        transparent: true,
        opacity: 0.45,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.copy(pos);
      ring.lookAt(0, 0, 0);
      globeGroup.add(ring);
      nationalPulseRings.push(ring);
      disposables.push(ringGeo, ringMat);
    });

    // ─── 7. REAL PANCHAYAT & MUNICIPAL OFFICE DETECTED NODES (WITH SHINE!) ───
    const panchayatShineTex = createLuminousShineTexture('#fbbf24'); // Radiant golden amber
    const municipalShineTex = createLuminousShineTexture('#38bdf8'); // Sparkling electric cyan
    disposables.push(panchayatShineTex, municipalShineTex);

    interface LocalGovThreeItem {
      data: LocalGovNode;
      pos: THREE.Vector3;
      dotMesh: THREE.Mesh;
      dotMat: THREE.MeshBasicMaterial;
      shineSprite: THREE.Sprite;
      pingRing: THREE.Mesh;
      ringMat: THREE.MeshBasicMaterial;
    }

    const localGovItems: LocalGovThreeItem[] = [];

    REAL_LOCAL_GOV_NODES.forEach((node) => {
      const phi = (90 - node.lat) * (Math.PI / 180);
      const theta = (node.lon + 180) * (Math.PI / 180);
      const r = sphereRadius * 1.011;
      const x = -(r * Math.sin(phi) * Math.cos(theta));
      const z = r * Math.sin(phi) * Math.sin(theta);
      const y = r * Math.cos(phi);
      const pos = new THREE.Vector3(x, y, z);

      const isPanchayat = node.category === 'gram_panchayat' || node.category === 'taluk_panchayat';

      // 1. Core Pin Dot (crisp, small, elegant)
      const dotGeo = new THREE.SphereGeometry(0.38, 16, 16);
      const dotMat = new THREE.MeshBasicMaterial({
        color: isPanchayat ? 0xfffbeb : 0xf0fdf4,
        transparent: true,
        opacity: 0,
      });
      const dotMesh = new THREE.Mesh(dotGeo, dotMat);
      dotMesh.position.copy(pos);
      dotMesh.userData = { localGovData: node };
      globeGroup.add(dotMesh);
      disposables.push(dotGeo, dotMat);

      // Invisible generous hit collider for responsive hovering
      const hitGeo = new THREE.SphereGeometry(1.6, 8, 8);
      const hitMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
      const hitMesh = new THREE.Mesh(hitGeo, hitMat);
      hitMesh.position.copy(pos);
      hitMesh.userData = { localGovData: node };
      globeGroup.add(hitMesh);
      interactiveNodeMeshes.push(hitMesh);
      disposables.push(hitGeo, hitMat);

      // 2. THE LUMINOUS PINPOINT SHINE FLARE (Small, brilliant starburst!)
      const shineTex = isPanchayat ? panchayatShineTex : municipalShineTex;
      const shineMat = new THREE.SpriteMaterial({
        map: shineTex,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const shineSprite = new THREE.Sprite(shineMat);
      shineSprite.position.copy(pos);
      shineSprite.scale.set(0.001, 0.001, 1);
      globeGroup.add(shineSprite);
      disposables.push(shineMat);

      // 3. Delicate radar ripple ping
      const ringGeo = new THREE.RingGeometry(0.4, 0.65, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: node.color,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const pingRing = new THREE.Mesh(ringGeo, ringMat);
      pingRing.position.copy(pos);
      pingRing.lookAt(0, 0, 0);
      globeGroup.add(pingRing);
      disposables.push(ringGeo, ringMat);

      localGovItems.push({
        data: node,
        pos,
        dotMesh,
        dotMat,
        shineSprite,
        pingRing,
        ringMat,
      });
    });

    // ─── 8. LOW-ALTITUDE CONNECTION ARCS ───────────────
    const arcMeshes: THREE.Line[] = [];
    const arcConnections = [
      [0, 1], [0, 2], [1, 2], [0, 5], [3, 4], [2, 5],
    ];

    const connectionCurves = arcConnections.map(([fromIdx, toIdx]) => {
      const from = nodePositions[fromIdx];
      const to = nodePositions[toIdx];
      const mid = from.clone().add(to).multiplyScalar(0.5);
      mid.normalize().multiplyScalar(sphereRadius * 1.15);
      return new THREE.QuadraticBezierCurve3(from, mid, to);
    });

    connectionCurves.forEach((curve) => {
      const points = curve.getPoints(40);
      const arcGeo = new THREE.BufferGeometry().setFromPoints(points);
      const arcMat = new THREE.LineBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.25,
      });
      const arc = new THREE.Line(arcGeo, arcMat);
      globeGroup.add(arc);
      arcMeshes.push(arc);
      disposables.push(arcGeo, arcMat);
    });

    // ─── 9. TRAVELING DATA PULSES ──────────────────────
    const pulseCount = 8;
    const pulseGeo = new THREE.BufferGeometry();
    const pulsePositions = new Float32Array(pulseCount * 3);
    const pulsePhases = new Float32Array(pulseCount);
    const pulseArcIndices = new Uint8Array(pulseCount);

    for (let i = 0; i < pulseCount; i++) {
      pulsePhases[i] = Math.random();
      pulseArcIndices[i] = Math.floor(Math.random() * arcConnections.length);
    }
    pulseGeo.setAttribute('position', new THREE.BufferAttribute(pulsePositions, 3));

    const pulseMat = new THREE.PointsMaterial({
      color: 0x34d399,
      size: 2.4,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const pulsePoints = new THREE.Points(pulseGeo, pulseMat);
    globeGroup.add(pulsePoints);
    disposables.push(pulseGeo, pulseMat);

    // ─── 10. INTERACTION, RAYCASTER & WHEEL ZOOM ────────
    const raycaster = new THREE.Raycaster();
    const mouseVector = new THREE.Vector2();

    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    // Indian subcontinent facing forward
    let targetRotationY = -2.92;
    let targetRotationX = 0.22;
    let velocityY = 0;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      velocityY = 0;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseVector.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseVector.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouseVector, camera);

      const intersects = raycaster.intersectObjects(interactiveNodeMeshes, false);

      if (intersects.length > 0) {
        let frontHit: THREE.Mesh | null = null;
        for (const hitObj of intersects) {
          const m = hitObj.object as THREE.Mesh;
          const worldPos = m.position.clone().applyMatrix4(globeGroup.matrixWorld);
          const normalVec = worldPos.clone().normalize();
          const camDir = camera.position.clone().sub(worldPos).normalize();
          if (normalVec.dot(camDir) > 0.05) {
            frontHit = m;
            break;
          }
        }

        if (frontHit) {
          const hit = frontHit;
          const worldPos = hit.position.clone().applyMatrix4(globeGroup.matrixWorld);
          const screenPos = worldPos.project(camera);
          const x = ((screenPos.x + 1) * rect.width) / 2;
          const y = ((-screenPos.y + 1) * rect.height) / 2;

          if (hit.userData?.localGovData) {
            const lg = hit.userData.localGovData as LocalGovNode;
            setHoveredNode({
              type: lg.category === 'gram_panchayat' ? 'panchayat' : 'municipal',
              name: lg.name,
              categoryLabel: lg.categoryLabel,
              district: lg.district,
              state: lg.state,
              complianceRate: lg.complianceRate,
              lat: lg.lat,
              lon: lg.lon,
              services: lg.services,
              colorHex: lg.colorHex,
              screenX: x,
              screenY: y,
            });
          } else if (hit.userData?.portalData) {
            const p = hit.userData.portalData;
            setHoveredNode({
              type: 'national',
              name: p.name,
              categoryLabel: 'National Public Gateway',
              district: '',
              state: p.country,
              complianceRate: p.complianceRate,
              lat: p.lat,
              lon: p.lon,
              services: ['WCAG 2.2 AA Monitoring', 'Automated Health Telemetry'],
              colorHex: p.colorHex,
              screenX: x,
              screenY: y,
            });
          }
        } else {
          setHoveredNode(null);
        }
      } else {
        setHoveredNode(null);
      }

      if (isDragging) {
        const deltaX = e.clientX - previousMousePosition.x;
        const deltaY = e.clientY - previousMousePosition.y;
        targetRotationY += deltaX * 0.005;
        targetRotationX += deltaY * 0.004;
        velocityY = deltaX * 0.005;
        previousMousePosition = { x: e.clientX, y: e.clientY };
      }
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    // Smooth Mouse Wheel Zoom
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomDelta = e.deltaY * 0.16;
      targetCameraZ = THREE.MathUtils.clamp(targetCameraZ + zoomDelta, 110, 270);
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', onMouseDown);
    dom.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // Touch events
    const onTouchStart = (e: TouchEvent) => {
      isDragging = true;
      velocityY = 0;
      previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };
    const onTouchMove = (e: TouchEvent) => {
      if (isDragging && e.touches.length === 1) {
        const deltaX = e.touches[0].clientX - previousMousePosition.x;
        const deltaY = e.touches[0].clientY - previousMousePosition.y;
        targetRotationY += deltaX * 0.005;
        targetRotationX += deltaY * 0.004;
        velocityY = deltaX * 0.005;
        previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };
    const onTouchEnd = () => {
      isDragging = false;
    };

    dom.addEventListener('touchstart', onTouchStart, { passive: true });
    dom.addEventListener('touchmove', onTouchMove, { passive: true });
    dom.addEventListener('touchend', onTouchEnd);

    // External UI controls binding
    resetViewRef.current = () => {
      targetRotationY = -2.92;
      targetRotationX = 0.22;
      targetCameraZ = 210;
    };
    zoomInRef.current = () => {
      targetCameraZ = Math.max(115, targetCameraZ - 26);
    };
    zoomOutRef.current = () => {
      targetCameraZ = Math.min(270, targetCameraZ + 26);
    };
    // Direct focus to India Panchayats & Municipal Grid with ideal framing!
    focusPanchayatsRef.current = () => {
      targetRotationY = -2.92;
      targetRotationX = 0.24;
      targetCameraZ = 138; // Beautifully frames all Indian states & shining panchayats!
    };

    // Resize
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // ─── ANIMATION LOOP ─────────────────────────────────
    let animationFrameId: number;
    const clock = new THREE.Clock();
    let prevZoomState = false;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Smooth camera Z interpolation (damped zoom)
      camera.position.z += (targetCameraZ - camera.position.z) * 0.085;

      // Calculate Zoom Progress:
      // 0.0 at default distance (210) -> 1.0 when zoomed in (<= 145)
      const zoomProgress = THREE.MathUtils.clamp((176 - camera.position.z) / (176 - 130), 0, 1);
      const isZoomActive = zoomProgress > 0.15;

      if (isZoomActive !== prevZoomState) {
        prevZoomState = isZoomActive;
        setIsPanchayatZoomActive(isZoomActive);
      }

      if (!isDragging && !prefersReducedMotion) {
        velocityY *= 0.96;
        if (isAutoRotatingRef.current) {
          targetRotationY += 0.0018 + velocityY;
        } else {
          targetRotationY += velocityY;
        }
      }

      globeGroup.rotation.y += (targetRotationY - globeGroup.rotation.y) * 0.055;
      globeGroup.rotation.x += (targetRotationX - globeGroup.rotation.x) * 0.055;

      if (!prefersReducedMotion) {
        globeGroup.position.y = Math.sin(elapsed * 0.6) * 1.6;
        cloudMesh.rotation.y = elapsed * 0.0028;

        // National Beacons animation
        nationalGlowSprites.forEach((sprite, i) => {
          const s = 3.2 + Math.sin(elapsed * 2.2 + i * 1.1) * 0.4;
          sprite.scale.set(s, s, 1);
          sprite.material.opacity = 0.65 + Math.sin(elapsed * 2.2 + i * 1.1) * 0.2;
        });

        nationalPulseRings.forEach((ring, i) => {
          const cycle = (elapsed * 0.6 + i * 0.3) % 1.0;
          const scale = 1.0 + cycle * 1.4;
          ring.scale.set(scale, scale, 1);
          ((ring.material as THREE.MeshBasicMaterial)).opacity = (1.0 - cycle) * 0.4;
        });

        // ─── SHINING PANCHAYAT & MUNICIPAL NODES ANIMATION ───
        let activeVisibleNodes = 0;
        const currentFilter = activeFilterRef.current;

        localGovItems.forEach((item, i) => {
          const isFilterMatch =
            currentFilter === 'all' ||
            (currentFilter === 'panchayat' && item.data.category === 'gram_panchayat') ||
            (currentFilter === 'municipal' && item.data.category !== 'gram_panchayat');

          const effectiveProgress = isFilterMatch ? zoomProgress : 0;

          // 1. Core Pin Dot
          item.dotMat.opacity = effectiveProgress;
          const dotScale = 0.5 + effectiveProgress * 0.7;
          item.dotMesh.scale.set(dotScale, dotScale, dotScale);

          // 2. THE CELESTIAL PINPOINT SHINE FLARE!
          if (effectiveProgress > 0.05) {
            activeVisibleNodes++;
            // Delicate sparkling diamond shine glint
            const shinePulse = Math.sin(elapsed * 3.8 + i * 1.5) * 0.25 + 0.85;
            const shineScale = (1.2 + shinePulse * 0.6) * effectiveProgress;
            item.shineSprite.scale.set(shineScale, shineScale, 1);
            item.shineSprite.material.opacity =
              (0.70 + Math.sin(elapsed * 4.5 + i * 1.8) * 0.25) * effectiveProgress;

            // Rotating 4-point diamond rays produce a twinkling star shine!
            item.shineSprite.material.rotation = elapsed * 0.65 + i * 0.4;
          } else {
            item.shineSprite.material.opacity = 0;
            item.shineSprite.scale.set(0.001, 0.001, 1);
          }

          // 3. Delicate radar ping
          if (effectiveProgress > 0.1) {
            const cycle = (elapsed * 0.85 + i * 0.22) % 1.0;
            const ringScale = 0.6 + cycle * 1.8;
            item.pingRing.scale.set(ringScale, ringScale, 1);
            item.ringMat.opacity = (1.0 - cycle) * 0.45 * effectiveProgress;
          } else {
            item.ringMat.opacity = 0;
          }
        });

        if (isZoomActive) {
          setDetectedCount(activeVisibleNodes);
        } else {
          setDetectedCount(0);
        }

        // Connection arcs & traveling photons
        arcMeshes.forEach((arc, i) => {
          ((arc.material as THREE.LineBasicMaterial)).opacity =
            0.15 + Math.sin(elapsed * 1.2 + i * 1.2) * 0.1;
        });

        const positionsArr = pulseGeo.attributes.position.array as Float32Array;
        for (let i = 0; i < pulseCount; i++) {
          pulsePhases[i] = (pulsePhases[i] + 0.003 + (i % 3) * 0.001) % 1.0;
          const arcIdx = pulseArcIndices[i];
          const pt = connectionCurves[arcIdx].getPoint(pulsePhases[i]);
          positionsArr[i * 3] = pt.x;
          positionsArr[i * 3 + 1] = pt.y;
          positionsArr[i * 3 + 2] = pt.z;
        }
        pulseGeo.attributes.position.needsUpdate = true;
      }

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      dom.removeEventListener('mousedown', onMouseDown);
      dom.removeEventListener('wheel', onWheel);
      dom.removeEventListener('touchstart', onTouchStart);
      dom.removeEventListener('touchmove', onTouchMove);
      dom.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('resize', handleResize);

      disposables.forEach((d) => d.dispose());
      arcMeshes.forEach((a) => {
        a.geometry.dispose();
        (a.material as THREE.Material).dispose();
      });
      renderer.dispose();

      if (container.contains(dom)) {
        container.removeChild(dom);
      }
    };
  }, []);

  return (
    <div className={`relative overflow-hidden rounded-2xl glass-card p-6 ${className}`}>
      {/* Space ambient lighting effects */}
      <div className="absolute -top-24 -left-24 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left: Narrative & Status */}
        <div className="lg:col-span-5 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/80 border border-emerald-300 text-emerald-800 text-xs font-semibold backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Planet-Scale Compliance Telemetry
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Protecting Digital Access for{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600">
              Every Citizen
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Continuous automated monitoring across national public portals, municipal
            gateways, and grassroots Gram Panchayats — ensuring zero barriers for screen
            readers, keyboard-only users, and assistive technologies.
          </p>

          {/* Glass Stats */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="group p-3 rounded-xl bg-white/60 border border-white/80 shadow-sm backdrop-blur-md hover:bg-white/80 hover:shadow-md transition-all duration-300">
              <div className="text-xs text-slate-500 font-medium">Monitored Portals</div>
              <div className="text-2xl font-black text-slate-900">{monitoredCount}</div>
              <div className="mt-1 h-0.5 w-full rounded bg-gradient-to-r from-blue-500 to-indigo-500 opacity-50 group-hover:opacity-100 transition-opacity"></div>
            </div>
            <div className="group p-3 rounded-xl bg-white/60 border border-white/80 shadow-sm backdrop-blur-md hover:bg-white/80 hover:shadow-md transition-all duration-300">
              <div className="text-xs text-slate-500 font-medium">National Pass Rate</div>
              <div className="text-2xl font-black text-emerald-600">{averagePassRate}%</div>
              <div className="mt-1 h-0.5 w-full rounded bg-gradient-to-r from-emerald-500 to-teal-500 opacity-50 group-hover:opacity-100 transition-opacity"></div>
            </div>
            <div className="group p-3 rounded-xl bg-white/60 border border-white/80 shadow-sm backdrop-blur-md hover:bg-white/80 hover:shadow-md transition-all duration-300">
              <div className="text-xs text-slate-500 font-medium">Active Audits</div>
              <div className="text-2xl font-black text-primary-600">{activeAuditsCount}</div>
              <div className="mt-1 h-0.5 w-full rounded bg-gradient-to-r from-primary-500 to-blue-500 opacity-50 group-hover:opacity-100 transition-opacity"></div>
            </div>
          </div>

          {/* Dynamic Detection State Feedback Banner */}
          {isPanchayatZoomActive ? (
            <div className="p-3 rounded-xl bg-amber-50/90 border border-amber-300/80 text-amber-900 shadow-sm space-y-2 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-bold text-xs text-amber-900">
                  <Sparkles size={14} className="text-amber-600 animate-spin" />
                  Local Government Grid Active
                </span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-800">
                  {detectedCount} Shining Beacons
                </span>
              </div>
              <p className="text-[11px] text-amber-800 leading-tight">
                Zoomed into Indian Subcontinent. Gram Panchayats (amber shine) and Municipal Offices (cyan shine) are live.
              </p>
              {/* Filter Tabs */}
              <div className="flex items-center gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => setActiveFilter('all')}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-colors ${
                    activeFilter === 'all'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'bg-white/80 text-amber-800 hover:bg-amber-100'
                  }`}
                >
                  All ({REAL_LOCAL_GOV_NODES.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter('panchayat')}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-colors flex items-center gap-1 ${
                    activeFilter === 'panchayat'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'bg-white/80 text-amber-800 hover:bg-amber-100'
                  }`}
                >
                  <Trees size={10} />
                  Panchayats (
                  {REAL_LOCAL_GOV_NODES.filter((n) => n.category === 'gram_panchayat').length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter('municipal')}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-colors flex items-center gap-1 ${
                    activeFilter === 'municipal'
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'bg-white/80 text-sky-800 hover:bg-sky-100'
                  }`}
                >
                  <Building2 size={10} />
                  Municipal Offices (
                  {REAL_LOCAL_GOV_NODES.filter((n) => n.category !== 'gram_panchayat').length})
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-transparent border border-amber-500/20 text-xs text-slate-700">
              <span className="flex items-center gap-1.5">
                <Sparkles size={14} className="text-amber-600 flex-shrink-0" />
                <span className="font-medium text-slate-800">42+ Indian Govt Portals & Local Offices</span>
              </span>
              <button
                type="button"
                onClick={() => setIsIndiaModalOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-[11px] shadow-md transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5"
              >
                <Maximize2 size={12} />
                Explore India Telemetry
              </button>
            </div>
          )}

          <p className="text-xs text-slate-500 flex items-center gap-1.5 pt-0.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary-600"></span>
            Drag to rotate • Scroll wheel or +/- to zoom in • Hover over pins for citizen service audits
          </p>
        </div>

        {/* Right: Three.js Canvas & Interactive Controls */}
        <div className="lg:col-span-7 relative flex items-center justify-center min-h-[360px] sm:min-h-[440px] cursor-grab active:cursor-grabbing">
          <div ref={mountRef} className="w-full h-[380px] sm:h-[460px]" />

          {/* Floating Control Strip */}
          <div className="absolute top-3 right-4 flex items-center gap-1.5 p-1 rounded-xl bg-slate-900/70 backdrop-blur-xl border border-white/10 shadow-lg text-white z-20">
            <button
              type="button"
              onClick={() => setIsAutoRotating(!isAutoRotating)}
              className={`p-1.5 rounded-lg transition-colors ${
                isAutoRotating ? 'bg-primary-600 text-white' : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
              title={isAutoRotating ? 'Pause auto-rotation' : 'Resume auto-rotation'}
              aria-label={isAutoRotating ? 'Pause auto-rotation' : 'Resume auto-rotation'}
            >
              {isAutoRotating ? <Pause size={14} /> : <Play size={14} />}
            </button>
            <button
              type="button"
              onClick={() => resetViewRef.current()}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              title="Reset view to global orbit"
              aria-label="Reset view to global orbit"
            >
              <RotateCcw size={14} />
            </button>
            <div className="w-[1px] h-3.5 bg-white/20 mx-0.5"></div>
            {/* User-requested Icon-Only button that opens full Earth zoomed into India with all govt offices */}
            <button
              type="button"
              onClick={() => setIsIndiaModalOpen(true)}
              className="p-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md transition-all hover:scale-110 active:scale-95 flex items-center justify-center"
              title="Open India Govt Telemetry Grid (Railways, Panchayats, Municipal Bodies & Ministries)"
              aria-label="Open India Govt Telemetry Grid"
            >
              <Maximize2 size={14} />
            </button>
            <div className="w-[1px] h-3.5 bg-white/20 mx-0.5"></div>
            <button
              type="button"
              onClick={() => zoomInRef.current()}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              title="Zoom In"
              aria-label="Zoom In"
            >
              <ZoomIn size={14} />
            </button>
            <button
              type="button"
              onClick={() => zoomOutRef.current()}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              title="Zoom Out"
              aria-label="Zoom Out"
            >
              <ZoomOut size={14} />
            </button>
          </div>

          {/* Dynamic Pin Tooltip Overlay */}
          {hoveredNode && (
            <div
              className={`absolute pointer-events-none z-30 transition-all duration-150 transform -translate-x-1/2 ${
                hoveredNode.screenY < 230 ? 'translate-y-3' : '-translate-y-full -translate-y-3'
              }`}
              style={{
                left: `${Math.max(130, Math.min(hoveredNode.screenX, 500))}px`,
                top: `${hoveredNode.screenY}px`,
              }}
            >
              {hoveredNode.screenY < 230 && (
                <div className="w-2.5 h-2.5 bg-slate-900/95 border-l border-t border-white/20 transform rotate-45 mx-auto -mb-1.5 relative z-10"></div>
              )}
              <div className="px-3.5 py-2.5 rounded-xl bg-slate-900/95 backdrop-blur-xl border border-white/20 shadow-2xl text-white text-xs max-w-sm space-y-1.5">
                {/* Header Badge */}
                <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-1">
                  <div className="flex items-center gap-1.5">
                    {hoveredNode.type === 'panchayat' ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                        <Trees size={10} />
                        {hoveredNode.categoryLabel}
                      </span>
                    ) : hoveredNode.type === 'municipal' ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[10px] font-bold">
                        <Building2 size={10} />
                        {hoveredNode.categoryLabel}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                        <Landmark size={10} />
                        {hoveredNode.categoryLabel}
                      </span>
                    )}
                    <span className="text-[10px] text-amber-400 font-semibold flex items-center gap-0.5">
                      <Sparkles size={9} />
                      Shining Beacon
                    </span>
                  </div>
                  <span className="font-bold text-emerald-400 text-xs flex items-center gap-1">
                    <CheckCircle2 size={11} />
                    {hoveredNode.complianceRate}% Pass
                  </span>
                </div>

                {/* Office Name & Location */}
                <div>
                  <div className="font-extrabold text-slate-100 text-sm">{hoveredNode.name}</div>
                  <div className="text-[11px] text-slate-300">
                    {hoveredNode.district ? `${hoveredNode.district}, ` : ''}
                    {hoveredNode.state}
                  </div>
                </div>

                {/* Citizen Services Monitored */}
                {hoveredNode.services && hoveredNode.services.length > 0 && (
                  <div className="pt-1 border-t border-white/10">
                    <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1">
                      Monitored Citizen Gateways:
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {hoveredNode.services.map((svc, idx) => (
                        <span
                          key={idx}
                          className="px-1.5 py-0.5 rounded bg-white/10 text-slate-200 text-[10px]"
                        >
                          {svc}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Coordinates */}
                <div className="text-[9px] text-slate-500 font-mono pt-0.5">
                  Geo: {hoveredNode.lat.toFixed(4)}°N, {hoveredNode.lon.toFixed(4)}°E
                </div>
              </div>
              {hoveredNode.screenY >= 230 && (
                <div className="w-2.5 h-2.5 bg-slate-900/95 border-r border-b border-white/20 transform rotate-45 mx-auto -mt-1.5"></div>
              )}
            </div>
          )}

          {/* Floating live status badge */}
          <div className="absolute bottom-3 right-4 px-3 py-1.5 rounded-xl bg-slate-900/70 backdrop-blur-xl text-white text-xs border border-white/10 shadow-2xl pointer-events-none flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <Radio size={12} className="text-emerald-400" />
            <span>
              {isPanchayatZoomActive
                ? `Panchayat Grid (${detectedCount} Shining)`
                : 'Earth Telemetry Live'}
            </span>
          </div>
        </div>
      </div>

      {/* Sovereign India Full Govt Telemetry Grid Modal (Railways, Panchayats, Municipal Bodies, Ministries) */}
      <IndiaTelemetryModal
        isOpen={isIndiaModalOpen}
        onClose={() => setIsIndiaModalOpen(false)}
      />
    </div>
  );
};
