import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface AuditCrystal3DProps {
  grade?: 'A+' | 'A' | 'B' | 'C' | 'F';
  healthScore?: number;
  className?: string;
  size?: number;
}

interface GradeTheme {
  primary: number;
  secondary: number;
  emissive: number;
  ambient: number;
  light: number;
  glowClass: string;
  badgeBg: string;
}

const GRADE_THEMES: Record<string, GradeTheme> = {
  'A+': {
    primary: 0x059669,
    secondary: 0x34d399,
    emissive: 0x10b981,
    ambient: 0x064e3b,
    light: 0x6ee7b7,
    glowClass: 'from-emerald-500/30 to-teal-500/20',
    badgeBg: 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300',
  },
  A: {
    primary: 0x10b981,
    secondary: 0x6ee7b7,
    emissive: 0x059669,
    ambient: 0x064e3b,
    light: 0xa7f3d0,
    glowClass: 'from-emerald-500/25 to-cyan-500/15',
    badgeBg: 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300',
  },
  B: {
    primary: 0x2563eb,
    secondary: 0x60a5fa,
    emissive: 0x3b82f6,
    ambient: 0x1e3a8a,
    light: 0x93c5fd,
    glowClass: 'from-blue-500/30 to-indigo-500/20',
    badgeBg: 'bg-blue-500/20 border-blue-400/40 text-blue-300',
  },
  C: {
    primary: 0xd97706,
    secondary: 0xfbbf24,
    emissive: 0xf59e0b,
    ambient: 0x78350f,
    light: 0xfde68a,
    glowClass: 'from-amber-500/30 to-orange-500/20',
    badgeBg: 'bg-amber-500/20 border-amber-400/40 text-amber-300',
  },
  F: {
    primary: 0xe11d48,
    secondary: 0xfb7185,
    emissive: 0xf43f5e,
    ambient: 0x881337,
    light: 0xfecdd3,
    glowClass: 'from-rose-500/30 to-pink-500/20',
    badgeBg: 'bg-rose-500/20 border-rose-400/40 text-rose-300',
  },
};

export const AuditCrystal3D: React.FC<AuditCrystal3DProps> = ({
  grade = 'A',
  healthScore = 90,
  className = '',
  size = 130,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const theme = GRADE_THEMES[grade] || GRADE_THEMES['A'];

    // Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 1000);
    camera.position.set(0, 0, 88);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(size, size);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    container.appendChild(renderer.domElement);

    const disposables: { dispose: () => void }[] = [];
    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    // ─── 1. FACETED DIAMOND CRYSTAL BODY ────────────────
    const gemGeo = new THREE.OctahedronGeometry(20, 0);
    const gemMat = new THREE.MeshPhysicalMaterial({
      color: theme.primary,
      emissive: theme.emissive,
      emissiveIntensity: 0.18,
      roughness: 0.08,
      metalness: 0.12,
      transmission: 0.85,
      thickness: 1.8,
      ior: 1.72,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
      transparent: true,
      opacity: 0.92,
      flatShading: true,
      side: THREE.DoubleSide,
    });
    const gemMesh = new THREE.Mesh(gemGeo, gemMat);
    gemMesh.scale.set(1.0, 1.35, 1.0); // elongated jewel cut
    rootGroup.add(gemMesh);
    disposables.push(gemGeo, gemMat);

    // ─── 2. LUMINOUS INNER CORE ─────────────────────────
    const coreGeo = new THREE.IcosahedronGeometry(8.5, 0);
    const coreMat = new THREE.MeshStandardMaterial({
      color: theme.secondary,
      emissive: theme.light,
      emissiveIntensity: 0.8,
      roughness: 0.3,
      metalness: 0.5,
      wireframe: true,
      transparent: true,
      opacity: 0.65,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    gemMesh.add(coreMesh);
    disposables.push(coreGeo, coreMat);

    // ─── 3. FACET OUTLINE CAGE (Fine Wire) ──────────────
    const wireGeo = new THREE.OctahedronGeometry(20.4, 0);
    const wireMat = new THREE.MeshBasicMaterial({
      color: theme.light,
      wireframe: true,
      transparent: true,
      opacity: 0.4,
    });
    const wireMesh = new THREE.Mesh(wireGeo, wireMat);
    wireMesh.scale.copy(gemMesh.scale);
    rootGroup.add(wireMesh);
    disposables.push(wireGeo, wireMat);

    // ─── 4. GYROSCOPIC ORBITAL RINGS ────────────────────
    const ring1Geo = new THREE.TorusGeometry(26, 0.45, 16, 64);
    const ring1Mat = new THREE.MeshBasicMaterial({
      color: theme.secondary,
      transparent: true,
      opacity: 0.45,
    });
    const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
    ring1.rotation.x = Math.PI / 3;
    ring1.rotation.y = Math.PI / 6;
    rootGroup.add(ring1);
    disposables.push(ring1Geo, ring1Mat);

    const ring2Geo = new THREE.TorusGeometry(30, 0.35, 16, 64);
    const ring2Mat = new THREE.MeshBasicMaterial({
      color: theme.light,
      transparent: true,
      opacity: 0.3,
    });
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2.rotation.x = -Math.PI / 4;
    ring2.rotation.z = Math.PI / 4;
    rootGroup.add(ring2);
    disposables.push(ring2Geo, ring2Mat);

    // ─── 5. DOUBLE-HELIX STARDUST SWARM ─────────────────
    const particleCount = 75;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(particleCount * 3);
    const pColors = new Float32Array(particleCount * 3);

    const color1 = new THREE.Color(theme.secondary);
    const color2 = new THREE.Color(theme.light);

    for (let i = 0; i < particleCount; i++) {
      const t = (i / particleCount) * Math.PI * 4;
      const radius = 28 + Math.sin(t * 2) * 5;
      const y = ((i / particleCount) - 0.5) * 44;

      // Swirl around in dual spirals
      const angle = t + (i % 2 === 0 ? 0 : Math.PI);
      pPos[i * 3] = Math.cos(angle) * radius;
      pPos[i * 3 + 1] = y;
      pPos[i * 3 + 2] = Math.sin(angle) * radius;

      const c = i % 2 === 0 ? color1 : color2;
      pColors[i * 3] = c.r;
      pColors[i * 3 + 1] = c.g;
      pColors[i * 3 + 2] = c.b;
    }

    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    pGeo.setAttribute('color', new THREE.BufferAttribute(pColors, 3));

    const pMat = new THREE.PointsMaterial({
      size: 2.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const particles = new THREE.Points(pGeo, pMat);
    rootGroup.add(particles);
    disposables.push(pGeo, pMat);

    // ─── 6. DYNAMIC SPECULAR LIGHTING ───────────────────
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const keyLight = new THREE.PointLight(theme.light, 3.5, 120);
    keyLight.position.set(35, 45, 45);
    scene.add(keyLight);

    const rimLight = new THREE.PointLight(0xffffff, 2.5, 120);
    rimLight.position.set(-35, -40, -35);
    scene.add(rimLight);

    const fillLight = new THREE.PointLight(theme.primary, 2.0, 100);
    fillLight.position.set(0, -30, 40);
    scene.add(fillLight);

    // ─── MOUSE INTERACTION ──────────────────────────────
    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      targetMouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      targetMouseY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    };

    const handleMouseEnter = () => setIsHovered(true);
    const handleMouseLeave = () => {
      setIsHovered(false);
      targetMouseX = 0;
      targetMouseY = 0;
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseenter', handleMouseEnter);
    container.addEventListener('mouseleave', handleMouseLeave);

    // ─── ANIMATION LOOP ─────────────────────────────────
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Smooth mouse tilt damping
      mouseX += (targetMouseX - mouseX) * 0.08;
      mouseY += (targetMouseY - mouseY) * 0.08;

      if (!prefersReducedMotion) {
        const speedMult = isHovered ? 1.8 : 1.0;

        // Gem faceted rotation
        gemMesh.rotation.y = elapsed * 0.55 * speedMult;
        gemMesh.rotation.x = Math.sin(elapsed * 0.4) * 0.25;
        wireMesh.rotation.copy(gemMesh.rotation);

        // Core counter-rotation & pulsing heartbeat
        coreMesh.rotation.y = -elapsed * 0.9 * speedMult;
        coreMesh.rotation.z = elapsed * 0.6;
        const pulse = 1.0 + Math.sin(elapsed * 3.2) * 0.12;
        coreMesh.scale.setScalar(pulse);

        // Gyro rings counter-revolution
        ring1.rotation.z = elapsed * 0.4 * speedMult;
        ring1.rotation.y = Math.PI / 6 + Math.sin(elapsed * 0.5) * 0.2;

        ring2.rotation.z = -elapsed * 0.3 * speedMult;
        ring2.rotation.x = -Math.PI / 4 + Math.cos(elapsed * 0.6) * 0.25;

        // Particle swarm rotation & bobbing
        particles.rotation.y = elapsed * 0.65 * speedMult;
        particles.position.y = Math.sin(elapsed * 1.5) * 2.0;

        // Orbiting light effect for glints
        keyLight.position.x = Math.cos(elapsed * 1.2) * 40;
        keyLight.position.z = Math.sin(elapsed * 1.2) * 40;

        // Root levitation and tilt
        rootGroup.position.y = Math.sin(elapsed * 1.2) * 2.5;
        rootGroup.rotation.y = mouseX * 0.6;
        rootGroup.rotation.x = -mouseY * 0.6;
      }

      renderer.render(scene, camera);
    };

    animate();

    // ─── DISPOSAL ───────────────────────────────────────
    return () => {
      cancelAnimationFrame(animId);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseenter', handleMouseEnter);
      container.removeEventListener('mouseleave', handleMouseLeave);

      disposables.forEach((d) => d.dispose());
      renderer.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [grade, size, isHovered]);

  const theme = GRADE_THEMES[grade] || GRADE_THEMES['A'];

  return (
    <div
      className={`relative inline-flex items-center justify-center cursor-pointer transition-transform duration-300 hover:scale-105 select-none ${className}`}
      style={{ width: size, height: size }}
      title={`Compliance Health Grade: ${grade} (${healthScore}%)`}
    >
      {/* Dynamic ambient background glow */}
      <div
        className={`absolute inset-2 rounded-full bg-gradient-to-tr ${theme.glowClass} blur-xl pointer-events-none opacity-70 transition-opacity duration-300 ${
          isHovered ? 'opacity-100 scale-110' : ''
        }`}
      />

      {/* 3D WebGL Canvas */}
      <div ref={mountRef} style={{ width: size, height: size }} className="relative z-10" />

      {/* Floating Center Glass Score Badge */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-20 text-center">
        <span className="text-2xl font-black text-white tracking-wider drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] filter">
          {grade}
        </span>
        <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full backdrop-blur-md border shadow-sm ${theme.badgeBg}`}>
          {healthScore}%
        </span>
      </div>
    </div>
  );
};
