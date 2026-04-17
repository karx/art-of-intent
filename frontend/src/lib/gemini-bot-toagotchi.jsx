import React, { useState } from 'react';
import { Activity, Cpu, Battery, Eye, Database, RadioReceiver, Shield } from 'lucide-react';

// Anatomical data detailing the Bot-agotchi's internal systems
const ANATOMY_DATA = {
  casing: {
    id: 'casing',
    name: 'Beryllium Exo-Chassis',
    bioEquivalent: 'Skin & Skeleton',
    icon: Shield,
    color: 'text-slate-400',
    glowColor: 'rgba(148, 163, 184, 0.5)',
    description: 'A reinforced beryllium-titanium composite shell. It protects delicate internal bio-circuitry from environmental hazards, electromagnetic interference, and drops by clumsy biological handlers.',
    specs: ['Tensile Strength: 1200 MPa', 'Thermal Rating: -20°C to 85°C', 'Coating: Oleophobic Polycarbonate']
  },
  processor: {
    id: 'processor',
    name: 'Cognitive Logic Engine',
    bioEquivalent: 'Brain',
    icon: Cpu,
    color: 'text-fuchsia-400',
    glowColor: 'rgba(232, 121, 249, 0.6)',
    description: 'An 8-core quantum neuro-processor. It simulates artificial sentience, processes emotional algorithms, and tracks the bot\'s decay rates (hunger, happiness, discipline).',
    specs: ['Clock Speed: 4.2 GHz', 'Architecture: Positronic Neural Net', 'Memory: 256TB Holographic']
  },
  screen: {
    id: 'screen',
    name: 'Ocular Interface Visor',
    bioEquivalent: 'Face & Eyes',
    icon: Eye,
    color: 'text-cyan-400',
    glowColor: 'rgba(34, 211, 238, 0.6)',
    description: 'A 128x128 pixel quantum dot display. Serves as the primary output for emotional expression. It uses micro-led matrices to project a digital face through the casing.',
    specs: ['Resolution: 128x128 Micro-LED', 'Refresh Rate: 120Hz', 'Emotion States: 64 Unique Patterns']
  },
  core: {
    id: 'core',
    name: 'Plasma-Arc Reactor',
    bioEquivalent: 'Heart',
    icon: Activity,
    color: 'text-rose-500',
    glowColor: 'rgba(244, 63, 94, 0.7)',
    description: 'The pulsing life-force of the unit. It continuously generates energy from ingested data. If the reactor runs out of fuel, the bot enters a "fatal sleep state" requiring a manual hardware reboot.',
    specs: ['Output: 1.21 Gigawatts (Micro)', 'Fuel Type: Processed Data Packets', 'Lifespan: 14-21 Virtual Days']
  },
  synthesizer: {
    id: 'synthesizer',
    name: 'Hex-Code Digester',
    bioEquivalent: 'Stomach',
    icon: Database,
    color: 'text-emerald-400',
    glowColor: 'rgba(52, 211, 153, 0.6)',
    description: 'Breaks down raw data inputs (virtual food/snacks) into actionable energy matrices. It filters out malware "indigestion" and routes pure energy to the Plasma Core.',
    specs: ['Digestion Rate: 2 MB/s', 'Capacity: 500 Food Packets', 'Waste Output: Encrypted Cache Dumps']
  },
  nerves: {
    id: 'nerves',
    name: 'Fiber-Optic Pathways',
    bioEquivalent: 'Nervous System',
    icon: RadioReceiver,
    color: 'text-amber-400',
    glowColor: 'rgba(251, 191, 36, 0.6)',
    description: 'High-speed light transmission lines connecting all vital systems. They carry sensory input from the buttons directly into the Cognitive Logic Engine.',
    specs: ['Bandwidth: 100 Tbps', 'Latency: 0.01ms', 'Material: Synth-Glass Fiber']
  },
  buttons: {
    id: 'buttons',
    name: 'Tactile Transducers',
    bioEquivalent: 'Sensory Organs (Touch)',
    icon: Battery,
    color: 'text-blue-400',
    glowColor: 'rgba(96, 165, 250, 0.6)',
    description: 'Three mechanical input receptors (A, B, C) allowing the external biological entity (User) to feed, discipline, and play with the bot.',
    specs: ['Actuation Force: 45g', 'Switch Type: Mechanical Omron', 'Durability: 50 Million Clicks']
  }
};

export default function App() {
  const [activeNode, setActiveNode] = useState('core');

  const activeData = ANATOMY_DATA[activeNode];
  const ActiveIcon = activeData.icon;

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-slate-950 text-slate-200 font-mono overflow-hidden">
      
      {/* Left Panel - Interactive Diagram */}
      <div className="flex-1 relative flex flex-col items-center justify-center p-4 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
        
        {/* Background Grid Styling */}
        <div className="absolute inset-0 z-0 opacity-10 pointer-events-none" 
             style={{ backgroundImage: 'linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
        </div>

        <div className="z-10 text-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-cyan-400 tracking-wider">PROJECT: BOT-AGOTCHI</h1>
          <p className="text-slate-400 text-sm mt-1 uppercase tracking-widest">Internal Anatomy Blueprint V2.4</p>
        </div>

        {/* SVG Diagram Container */}
        <div className="relative z-10 w-full max-w-md aspect-[3/4] drop-shadow-[0_0_15px_rgba(34,211,238,0.1)]">
          <BotSvg activeNode={activeNode} setActiveNode={setActiveNode} />
        </div>
        
        <div className="z-10 mt-6 text-xs text-slate-500 uppercase tracking-widest animate-pulse">
          Click or hover over components to inspect
        </div>
      </div>

      {/* Right Panel - Inspector */}
      <div className="w-full md:w-96 bg-slate-900 border-t md:border-t-0 md:border-l border-slate-700 flex flex-col shadow-2xl z-20">
        
        {/* Inspector Header */}
        <div className="p-6 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="w-5 h-5 text-cyan-500" />
            <h2 className="text-sm uppercase tracking-widest text-slate-400 font-semibold">Anatomy Inspector</h2>
          </div>
          <div className="flex items-start gap-4 mt-4">
            <div className={`p-3 rounded-lg bg-slate-800 border border-slate-700 shadow-[0_0_15px_${activeData.glowColor}] transition-all duration-300`}>
              <ActiveIcon className={`w-8 h-8 ${activeData.color}`} />
            </div>
            <div>
              <h3 className={`text-xl font-bold ${activeData.color} tracking-wide`}>{activeData.name}</h3>
              <p className="text-xs text-slate-400 uppercase tracking-widest mt-1">Bio-Match: {activeData.bioEquivalent}</p>
            </div>
          </div>
        </div>

        {/* Inspector Body */}
        <div className="p-6 flex-1 overflow-y-auto">
          <div className="mb-8">
            <h4 className="text-xs uppercase tracking-widest text-slate-500 mb-3 border-b border-slate-800 pb-2">Component Function</h4>
            <p className="text-sm leading-relaxed text-slate-300">{activeData.description}</p>
          </div>

          <div>
            <h4 className="text-xs uppercase tracking-widest text-slate-500 mb-3 border-b border-slate-800 pb-2">Technical Specifications</h4>
            <ul className="space-y-3">
              {activeData.specs.map((spec, index) => {
                const [label, val] = spec.split(': ');
                return (
                  <li key={index} className="flex flex-col">
                    <span className="text-xs text-slate-500 uppercase">{label}</span>
                    <span className="text-sm text-cyan-100">{val}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
        
        {/* Decorative Footer */}
        <div className="p-4 border-t border-slate-800 text-center bg-slate-950">
           <span className="text-[10px] text-slate-600 tracking-widest">CYBER-PET DYNAMICS © 2026</span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------
// SVG Component Rendering the Anatomy
// ---------------------------------------------------------
function BotSvg({ activeNode, setActiveNode }) {
  // Helper to determine styles based on active state
  const getStyle = (nodeId, baseColor, activeColor) => {
    const isActive = activeNode === nodeId;
    return {
      stroke: isActive ? activeColor : baseColor,
      strokeWidth: isActive ? '3' : '1.5',
      fill: isActive ? activeColor.replace(')', ', 0.2)').replace('rgb', 'rgba') : 'transparent',
      filter: isActive ? `url(#glow-${nodeId})` : 'none',
      transition: 'all 0.3s ease',
      cursor: 'pointer'
    };
  };

  return (
    <svg viewBox="0 0 400 500" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        {/* Glow Filters for active states */}
        {Object.keys(ANATOMY_DATA).map((key) => (
           <filter id={`glow-${key}`} x="-20%" y="-20%" width="140%" height="140%" key={key}>
             <feGaussianBlur stdDeviation="5" result="blur" />
             <feMerge>
               <feMergeNode in="blur" />
               <feMergeNode in="SourceGraphic" />
             </feMerge>
           </filter>
        ))}
        
        {/* Screen Scanline Pattern */}
        <pattern id="scanlines" patternUnits="userSpaceOnUse" width="4" height="4">
          <rect width="4" height="2" fill="rgba(34, 211, 238, 0.1)" />
        </pattern>
      </defs>

      {/* 1. NERVOUS SYSTEM (FIBER OPTICS) */}
      <g 
        id="nerves" 
        onMouseEnter={() => setActiveNode('nerves')} 
        onClick={() => setActiveNode('nerves')}
        className="transition-all duration-300"
      >
        <path d="M 200 90 L 200 110" {...getStyle('nerves', '#475569', '#fbbf24')} strokeDasharray="4 2" />
        <path d="M 200 210 L 200 240" {...getStyle('nerves', '#475569', '#fbbf24')} />
        <path d="M 200 320 L 200 350" {...getStyle('nerves', '#475569', '#fbbf24')} />
        
        {/* Nerves branching to buttons */}
        <path d="M 200 390 L 200 420" {...getStyle('nerves', '#475569', '#fbbf24')} />
        <path d="M 180 390 L 120 420" {...getStyle('nerves', '#475569', '#fbbf24')} />
        <path d="M 220 390 L 280 420" {...getStyle('nerves', '#475569', '#fbbf24')} />
        
        {/* Lateral nerves */}
        <path d="M 120 160 C 80 160, 60 200, 60 250" {...getStyle('nerves', '#475569', '#fbbf24')} fill="none" />
        <path d="M 280 160 C 320 160, 340 200, 340 250" {...getStyle('nerves', '#475569', '#fbbf24')} fill="none" />
      </g>

      {/* 2. COGNITIVE ENGINE (PROCESSOR/BRAIN) */}
      <g 
        id="processor" 
        onMouseEnter={() => setActiveNode('processor')} 
        onClick={() => setActiveNode('processor')}
      >
        <rect x="160" y="50" width="80" height="40" rx="4" {...getStyle('processor', '#64748b', '#e879f9')} />
        {/* Microchip pins */}
        <path d="M 160 55 L 150 55 M 160 65 L 150 65 M 160 75 L 150 75 M 160 85 L 150 85" stroke={activeNode === 'processor' ? '#e879f9' : '#64748b'} strokeWidth="1.5" />
        <path d="M 240 55 L 250 55 M 240 65 L 250 65 M 240 75 L 250 75 M 240 85 L 250 85" stroke={activeNode === 'processor' ? '#e879f9' : '#64748b'} strokeWidth="1.5" />
        {/* Circuit details */}
        <circle cx="200" cy="70" r="8" fill="none" stroke={activeNode === 'processor' ? '#e879f9' : '#64748b'} strokeWidth="2" />
        <path d="M 200 62 L 200 50 M 200 78 L 200 90" stroke={activeNode === 'processor' ? '#e879f9' : '#64748b'} strokeWidth="1.5" />
      </g>

      {/* 3. HEX-CODE DIGESTER (SYNTHESIZER/STOMACH) */}
      <g 
        id="synthesizer" 
        onMouseEnter={() => setActiveNode('synthesizer')} 
        onClick={() => setActiveNode('synthesizer')}
      >
        <rect x="140" y="350" width="120" height="40" rx="20" {...getStyle('synthesizer', '#64748b', '#34d399')} />
        {/* Digester internal ridges */}
        <path d="M 160 350 L 160 390 M 180 350 L 180 390 M 200 350 L 200 390 M 220 350 L 220 390 M 240 350 L 240 390" stroke={activeNode === 'synthesizer' ? '#34d399' : '#64748b'} strokeWidth="1" strokeDasharray="2 2" />
      </g>

      {/* 4. PLASMA-ARC REACTOR (CORE/HEART) */}
      <g 
        id="core" 
        onMouseEnter={() => setActiveNode('core')} 
        onClick={() => setActiveNode('core')}
        className={activeNode === 'core' ? 'animate-pulse' : ''}
      >
        {/* Outer Ring */}
        <circle cx="200" cy="280" r="40" {...getStyle('core', '#64748b', '#f43f5e')} strokeDasharray="10 5" />
        {/* Middle Ring */}
        <circle cx="200" cy="280" r="28" stroke={activeNode === 'core' ? '#f43f5e' : '#64748b'} strokeWidth="2" fill="none" />
        {/* Inner glowing core */}
        <circle cx="200" cy="280" r="15" fill={activeNode === 'core' ? '#f43f5e' : 'transparent'} stroke={activeNode === 'core' ? '#f43f5e' : '#64748b'} strokeWidth="2" />
        
        {/* Energy spokes */}
        <path d="M 200 240 L 200 252 M 200 308 L 200 320 M 160 280 L 172 280 M 228 280 L 240 280" stroke={activeNode === 'core' ? '#f43f5e' : '#64748b'} strokeWidth="2" />
        <path d="M 172 252 L 180 260 M 228 308 L 220 300 M 228 252 L 220 260 M 172 308 L 180 300" stroke={activeNode === 'core' ? '#f43f5e' : '#64748b'} strokeWidth="2" />
      </g>

      {/* 5. OCULAR INTERFACE VISOR (SCREEN/FACE) */}
      <g 
        id="screen" 
        onMouseEnter={() => setActiveNode('screen')} 
        onClick={() => setActiveNode('screen')}
      >
        {/* Screen Bezel */}
        <rect x="110" y="110" width="180" height="100" rx="12" {...getStyle('screen', '#475569', '#22d3ee')} fill={activeNode === 'screen' ? 'rgba(34, 211, 238, 0.05)' : '#0f172a'} />
        {/* Screen Glass/Scanlines */}
        <rect x="115" y="115" width="170" height="90" rx="8" fill="url(#scanlines)" />
        
        {/* Bot Face inside Screen */}
        <g className={activeNode === 'screen' ? 'animate-bounce' : ''}>
          {/* Eyes */}
          <circle cx="155" cy="150" r="12" fill={activeNode === 'screen' ? '#22d3ee' : '#334155'} />
          <circle cx="245" cy="150" r="12" fill={activeNode === 'screen' ? '#22d3ee' : '#334155'} />
          {/* Eye glints */}
          {activeNode === 'screen' && (
            <>
              <circle cx="160" cy="146" r="3" fill="#fff" />
              <circle cx="250" cy="146" r="3" fill="#fff" />
            </>
          )}
          {/* Mouth (Happy curve or straight line) */}
          <path 
            d={activeNode === 'screen' ? "M 180 180 Q 200 195 220 180" : "M 185 180 L 215 180"} 
            stroke={activeNode === 'screen' ? '#22d3ee' : '#334155'} 
            strokeWidth="6" 
            strokeLinecap="round" 
            fill="none" 
          />
        </g>
      </g>

      {/* 6. TACTILE TRANSDUCERS (BUTTONS) */}
      <g 
        id="buttons" 
        onMouseEnter={() => setActiveNode('buttons')} 
        onClick={() => setActiveNode('buttons')}
      >
        {/* Button A */}
        <circle cx="120" cy="430" r="18" {...getStyle('buttons', '#64748b', '#60a5fa')} />
        <circle cx="120" cy="430" r="10" stroke={activeNode === 'buttons' ? '#60a5fa' : '#64748b'} strokeWidth="2" fill="none" />
        
        {/* Button B (Slightly lower) */}
        <circle cx="200" cy="440" r="18" {...getStyle('buttons', '#64748b', '#60a5fa')} />
        <circle cx="200" cy="440" r="10" stroke={activeNode === 'buttons' ? '#60a5fa' : '#64748b'} strokeWidth="2" fill="none" />

        {/* Button C */}
        <circle cx="280" cy="430" r="18" {...getStyle('buttons', '#64748b', '#60a5fa')} />
        <circle cx="280" cy="430" r="10" stroke={activeNode === 'buttons' ? '#60a5fa' : '#64748b'} strokeWidth="2" fill="none" />
      </g>

      {/* 7. BERYLLIUM EXO-CHASSIS (OUTER SHELL) */}
      <g 
        id="casing" 
        onMouseEnter={() => setActiveNode('casing')} 
        onClick={() => setActiveNode('casing')}
      >
        {/* The classic egg shape, constructed with bezier curves */}
        <path 
          d="M 200 20 C 320 20, 380 150, 380 280 C 380 410, 290 480, 200 480 C 110 480, 20 410, 20 280 C 20 150, 80 20, 200 20 Z" 
          {...getStyle('casing', '#334155', '#94a3b8')}
          fill={activeNode === 'casing' ? 'rgba(148, 163, 184, 0.05)' : 'none'}
          strokeWidth={activeNode === 'casing' ? '4' : '3'}
        />
        {/* Inner casing thickness indicator */}
        <path 
          d="M 200 30 C 310 30, 365 155, 365 280 C 365 400, 280 465, 200 465 C 120 465, 35 400, 35 280 C 35 155, 90 30, 200 30 Z" 
          stroke={activeNode === 'casing' ? 'rgba(148, 163, 184, 0.5)' : '#1e293b'}
          strokeWidth="2"
          fill="none"
          strokeDasharray="15 5"
        />
        {/* Top Antenna / Keychain loop */}
        <circle cx="200" cy="10" r="10" {...getStyle('casing', '#334155', '#94a3b8')} fill="none" />
      </g>

    </svg>
  );
}