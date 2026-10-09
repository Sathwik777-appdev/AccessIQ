import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  INDIA_STATE_PATHS,
  projectGeoToSvg,
} from "../../data/indiaStatePaths";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from "lucide-react";

export interface GovNodeItem {
  id: string;
  name: string;
  category: "railway" | "gram_panchayat" | "municipal" | "central_govt" | "state_govt";
  categoryLabel: string;
  stateOrZone: string;
  district?: string;
  complianceRate: number;
  lat: number;
  lon: number;
  services: string[];
  colorHex: string;
  color: number;
  portalUrl?: string;
  description: string;
}

interface IndiaVectorMapProps {
  nodes: GovNodeItem[];
  selectedNode: GovNodeItem | null;
  onSelectNode: (node: GovNodeItem | null) => void;
  hoveredNode: GovNodeItem | null;
  onHoverNode: (node: GovNodeItem | null, pos: { x: number; y: number }) => void;
  activePreset: "center" | "karnataka" | "delhi" | "mumbai" | "east" | null;
  onResetPreset: () => void;
}

export const IndiaVectorMap: React.FC<IndiaVectorMapProps> = ({
  nodes,
  selectedNode,
  onSelectNode,
  hoveredNode,
  onHoverNode,
  activePreset,
  onResetPreset,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Focus center in SVG coordinates (0-1000, 0-1100) & Zoom level
  const [zoom, setZoom] = useState(1.0);
  const [focus, setFocus] = useState({ x: 500, y: 550 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const focusStartRef = useRef({ x: 500, y: 550 });

  // Hovered state polygon
  const [hoveredStateId, setHoveredStateId] = useState<string | null>(null);

  // Project all nodes once
  const projectedNodes = useMemo(() => {
    return nodes.map((node) => {
      const [x, y] = projectGeoToSvg(node.lon, node.lat);
      return {
        ...node,
        svgX: x,
        svgY: y,
      };
    });
  }, [nodes]);

  // Quick preset transitions
  useEffect(() => {
    if (!activePreset) return;
    if (activePreset === "center") {
      setZoom(1.0);
      setFocus({ x: 500, y: 550 });
    } else if (activePreset === "karnataka") {
      // Karnataka centroid: 314, 792
      setZoom(2.8);
      setFocus({ x: 314, y: 792 });
    } else if (activePreset === "delhi") {
      // Delhi centroid: 332, 367
      setZoom(3.0);
      setFocus({ x: 332, y: 367 });
    } else if (activePreset === "mumbai") {
      // Mumbai centroid: 204, 672
      setZoom(3.0);
      setFocus({ x: 204, y: 672 });
    } else if (activePreset === "east") {
      // Kolkata/Assam centroid: 720, 480
      setZoom(2.5);
      setFocus({ x: 720, y: 480 });
    }
  }, [activePreset]);

  // Pan interaction
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    focusStartRef.current = { ...focus };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const container = containerRef.current;
    const h = container?.clientHeight || 800;
    const svgPerPixel = 1100 / h / zoom;
    const dx = (e.clientX - dragStartRef.current.x) * svgPerPixel;
    const dy = (e.clientY - dragStartRef.current.y) * svgPerPixel;
    setFocus({
      x: focusStartRef.current.x - dx,
      y: focusStartRef.current.y - dy,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.25 : 0.8;
    setZoom((prevZoom) => {
      const nextZoom = Math.min(Math.max(prevZoom * zoomFactor, 0.8), 8.0);
      return nextZoom;
    });
  };

  // Zoom control buttons
  const zoomIn = () => {
    setZoom((z) => Math.min(z * 1.35, 8.0));
  };
  const zoomOut = () => {
    setZoom((z) => Math.max(z / 1.35, 0.8));
  };
  const resetView = () => {
    setZoom(1.0);
    setFocus({ x: 500, y: 550 });
    onResetPreset();
  };

  // Stroke width dynamically inverse to zoom to keep boundaries laser sharp
  const stateStrokeWidth = Math.max(0.5, 1.2 / zoom);
  const borderHighlightWidth = Math.max(1.0, 2.0 / zoom);
  const textScale = Math.max(7, 11 / zoom);

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      className="relative w-full h-full bg-[#020617] overflow-hidden select-none cursor-grab active:cursor-grabbing"
    >
      {/* Background Subtle Cyber Grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-25"
        style={{
          backgroundImage:
            "radial-gradient(circle at 50% 50%, rgba(56, 189, 248, 0.08) 0%, transparent 70%), linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px)",
          backgroundSize: "100% 100%, 40px 40px, 40px 40px",
        }}
      />

      {/* Floating Map Zoom Toolbar */}
      <div className="absolute top-4 right-6 flex items-center gap-1.5 p-1 rounded-xl bg-slate-900/90 backdrop-blur-xl border border-white/15 shadow-2xl text-white z-30">
        <button
          type="button"
          onClick={resetView}
          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-1"
          title="Reset to Full India View"
        >
          <RotateCcw size={13} />
          <span className="hidden sm:inline">Reset India</span>
        </button>
        <div className="w-[1px] h-4 bg-white/20 mx-0.5"></div>
        <button
          type="button"
          onClick={zoomIn}
          className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          title="Zoom In"
        >
          <ZoomIn size={15} />
        </button>
        <button
          type="button"
          onClick={zoomOut}
          className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          title="Zoom Out"
        >
          <ZoomOut size={15} />
        </button>
        <div className="px-2 text-[10px] font-mono text-slate-400 border-l border-white/10">
          {Math.round(zoom * 100)}%
        </div>
      </div>

      {/* Vector SVG India Map */}
      <svg
        ref={svgRef}
        viewBox="0 0 1000 1100"
        className="w-full h-full"
      >
        <defs>
          {/* Subtle Outer Glow Filter */}
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* Pin Pulse Animation */}
          <style>{`
            @keyframes pulseRing {
              0% { r: ${Math.max(6, 10 / zoom)}; opacity: 0.8; }
              100% { r: ${Math.max(12, 22 / zoom)}; opacity: 0; }
            }
            .pin-pulse {
              animation: pulseRing 2s cubic-bezier(0.2, 0.8, 0.2, 1) infinite;
            }
          `}</style>
        </defs>

        <g
          id="map-viewport"
          transform={`translate(500, 550) scale(${zoom}) translate(${-focus.x}, ${-focus.y})`}
          style={{
            transition: isDragging ? "none" : "transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          {/* ─── 1. ALL 37 INDIAN STATES & UNION TERRITORIES (PROPER BORDERS) ─── */}
          <g id="india-states">
            {INDIA_STATE_PATHS.map((state) => {
              const isHovered = hoveredStateId === state.id;
              return (
                <path
                  key={state.id}
                  d={state.path}
                  fill={isHovered ? "rgba(56, 189, 248, 0.18)" : "rgba(15, 23, 42, 0.85)"}
                  stroke={isHovered ? "#38bdf8" : "rgba(148, 163, 184, 0.35)"}
                  strokeWidth={isHovered ? borderHighlightWidth : stateStrokeWidth}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  className="transition-colors duration-150 cursor-pointer"
                  onMouseEnter={() => setHoveredStateId(state.id)}
                  onMouseLeave={() => setHoveredStateId(null)}
                  onClick={() => {
                    // Zoom directly into clicked state centroid
                    setZoom(2.8);
                    setFocus({ x: state.centroid[0], y: state.centroid[1] });
                  }}
                >
                  <title>{state.name}</title>
                </path>
              );
            })}
          </g>

        {/* ─── 2. STATE LABELS (CRISP VECTOR TEXT) ─── */}
        <g id="state-labels" className="pointer-events-none">
          {INDIA_STATE_PATHS.map((state) => {
            // Only show labels if state centroid is valid and not tiny islands
            if (state.id.includes("daman") || state.id.includes("dadra") || state.id.includes("chandigarh")) {
              return null;
            }
            return (
              <text
                key={`lbl-${state.id}`}
                x={state.centroid[0]}
                y={state.centroid[1]}
                textAnchor="middle"
                dominantBaseline="central"
                fill={hoveredStateId === state.id ? "#38bdf8" : "rgba(148, 163, 184, 0.55)"}
                fontSize={textScale}
                fontWeight={hoveredStateId === state.id ? "700" : "600"}
                letterSpacing="0.8px"
                className="transition-colors duration-150 font-sans"
              >
                {state.name.toUpperCase()}
              </text>
            );
          })}
        </g>

        {/* ─── 3. SUB-CONTINENT TELEMETRY LINK ARCS ─── */}
        <g id="telemetry-arcs" className="pointer-events-none opacity-40">
          <path
            d="M332.2 366.8 Q 268 519 202.8 671.5"
            stroke="#00f5ff"
            strokeWidth={1.0 / zoom}
            fill="none"
            strokeDasharray="4,4"
          />
          <path
            d="M202.8 671.5 Q 273 761 343.3 850.6"
            stroke="#38bdf8"
            strokeWidth={1.0 / zoom}
            fill="none"
            strokeDasharray="4,4"
          />
          <path
            d="M343.3 850.6 Q 382 848 422.4 847.3"
            stroke="#38bdf8"
            strokeWidth={1.0 / zoom}
            fill="none"
            strokeDasharray="4,4"
          />
          <path
            d="M332.2 366.8 Q 496 463 661.4 559.5"
            stroke="#10b981"
            strokeWidth={1.0 / zoom}
            fill="none"
            strokeDasharray="4,4"
          />
          <path
            d="M661.4 559.5 Q 711 502 760.9 446.4"
            stroke="#fbbf24"
            strokeWidth={1.0 / zoom}
            fill="none"
            strokeDasharray="4,4"
          />
        </g>

        {/* ─── 4. TELEMETRY PINS (87 AUDITED GOVT NODES) ─── */}
        <g id="telemetry-pins">
          {projectedNodes.map((node) => {
            const isHovered = hoveredNode?.id === node.id;
            const isSelected = selectedNode?.id === node.id;

            const pinRadius = Math.max(3.2, 5.0 / zoom);
            const reticleRadius = Math.max(7, 12 / zoom);
            const coreDotRadius = Math.max(1.2, 2.0 / zoom);

            return (
              <g
                key={node.id}
                transform={`translate(${node.svgX}, ${node.svgY})`}
                className="cursor-pointer transition-transform duration-150"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectNode(node);
                }}
                onMouseEnter={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  onHoverNode(node, { x: rect.left + rect.width / 2, y: rect.top });
                }}
                onMouseLeave={() => {
                  onHoverNode(null, { x: 0, y: 0 });
                }}
              >
                {/* Outer Reticle Ring on Hover or Selection */}
                {(isHovered || isSelected) && (
                  <circle
                    r={reticleRadius * 1.5}
                    fill="none"
                    stroke={node.colorHex}
                    strokeWidth={1.5 / zoom}
                    strokeDasharray="3,3"
                    className="animate-spin-slow"
                  />
                )}

                {/* Snug Ground Reticle Circle */}
                <circle
                  r={reticleRadius}
                  fill="none"
                  stroke={node.colorHex}
                  strokeWidth={1.0 / zoom}
                  opacity={isHovered || isSelected ? 1.0 : 0.6}
                />

                {/* Subtle Pulse Ring */}
                {(isHovered || isSelected) && (
                  <circle
                    r={reticleRadius}
                    fill={node.colorHex}
                    className="pin-pulse"
                  />
                )}

                {/* Needle Stem pointing down */}
                <line
                  x1={0}
                  y1={0}
                  x2={0}
                  y2={-pinRadius * 2.2}
                  stroke={node.colorHex}
                  strokeWidth={Math.max(1.2, 2.0 / zoom)}
                />

                {/* Jewel Bead Head */}
                <circle
                  cx={0}
                  cy={-pinRadius * 2.2}
                  r={isHovered || isSelected ? pinRadius * 1.4 : pinRadius}
                  fill={node.colorHex}
                  stroke="#ffffff"
                  strokeWidth={Math.max(0.8, 1.2 / zoom)}
                  className="transition-all duration-150 shadow-md"
                />

                {/* Specular White Highlight Dot */}
                <circle
                  cx={0}
                  cy={-pinRadius * 2.2}
                  r={coreDotRadius}
                  fill="#ffffff"
                />

                {/* Node Name Label (Shown when zoomed in >= 2.2x or when hovered) */}
                {(zoom >= 2.2 || isHovered || isSelected) && (
                  <g
                    transform={`translate(${pinRadius + 4 / zoom}, ${-pinRadius * 2.2})`}
                    className="pointer-events-none"
                  >
                    <rect
                      x={0}
                      y={-8 / zoom}
                      width={Math.max(60, node.name.length * 6 / zoom + 12 / zoom)}
                      height={16 / zoom}
                      rx={3 / zoom}
                      fill="rgba(15, 23, 42, 0.92)"
                      stroke={node.colorHex}
                      strokeWidth={0.8 / zoom}
                    />
                    <text
                      x={6 / zoom}
                      y={3 / zoom}
                      fill="#ffffff"
                      fontSize={Math.max(7, 9 / zoom)}
                      fontWeight="bold"
                      className="font-sans"
                    >
                      {node.name.length > 24 ? node.name.slice(0, 22) + "..." : node.name}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </g>
        </g>
      </svg>
    </div>
  );
};
