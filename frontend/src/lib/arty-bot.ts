/**
 * arty-bot.ts  —  Three.js scene for the Arty widget.
 *
 * Design:
 *   - Egg-shaped bot body (sphere with asymmetric scale) hovering in space
 *   - Large visor plane (canvas texture) carrying the face expression
 *   - Particle field background driven by LLM colours
 *   - LLM-generated faceSVG overlaid on the visor canvas
 *   - Zero text — purely visual
 */

import * as THREE from 'three';
import type { ArtyAppearance, ArtyState } from './arty-svg';

// ── Constants ─────────────────────────────────────────────────────────────────
const TAU  = Math.PI * 2;
const FACE_W = 512;
const FACE_H = 384;

// ── SVG segment sanitiser (runs in browser, used for faceSVG) ─────────────────

const ALLOWED_SVG_TAGS  = new Set(['path','circle','rect','line','polyline','polygon','ellipse','g','defs','linearGradient','radialGradient','stop','clipPath']);
const BLOCKED_PATTERNS  = [/<script/i, /<foreignObject/i, /<image/i, /<use\s/i, /<style/i, /on\w+\s*=/i, /href\s*=\s*["'][^#"']/i, /xlink:href/i, /\bsrc\s*=/i, /javascript:/i];

export function sanitiseSVGSegment(raw: string): string {
	if (!raw || typeof raw !== 'string') return '';
	if (raw.length > 4000) return '';
	if (BLOCKED_PATTERNS.some(re => re.test(raw))) return '';
	return raw.trim();
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function hexToColor(hex: string, fallback = '#00FFFF'): THREE.Color {
	try { return new THREE.Color(hex); } catch { return new THREE.Color(fallback); }
}

function stateColor(app: ArtyAppearance | null, bs: BotStateFlags): THREE.Color {
	if (bs.isVictory)        return new THREE.Color('#00FFFF');
	if (bs.isDefeat)         return new THREE.Color('#FF0000');
	if (bs.loading)          return new THREE.Color('#FFBF00');
	if (bs.creepLevel >= 75) return new THREE.Color('#FF0000');
	if (bs.creepLevel >= 50) return new THREE.Color('#FFBF00');
	return hexToColor(app?.primary ?? '#00FFFF');
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface BotStateFlags {
	isVictory:   boolean;
	isDefeat:    boolean;
	loading:     boolean;
	creepLevel:  number;
	matchedCount: number;
}

// ── Face canvas — draws eyes/mouth on a CanvasTexture ─────────────────────────

class FaceCanvas {
	readonly canvas: HTMLCanvasElement;
	readonly ctx:    CanvasRenderingContext2D;
	readonly tex:    THREE.CanvasTexture;

	constructor() {
		this.canvas     = document.createElement('canvas');
		this.canvas.width  = FACE_W;
		this.canvas.height = FACE_H;
		this.ctx        = this.canvas.getContext('2d')!;
		this.tex        = new THREE.CanvasTexture(this.canvas);
	}

	/** Full synchronous redraw; overlays faceSVG asynchronously afterwards. */
	draw(app: ArtyAppearance | null, bs: BotStateFlags, t: number, faceSVG: string | null) {
		const ctx = this.ctx;
		const W = FACE_W, H = FACE_H;
		ctx.clearRect(0, 0, W, H);

		// ── Background ──
		const bgColor = app?.bgGlow ?? '#001a1a';
		ctx.fillStyle = bgColor;
		ctx.beginPath();
		this._visorPath(W, H, 52);
		ctx.fill();

		// Radial inner glow
		const grad = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.6);
		grad.addColorStop(0, 'rgba(255,255,255,0.04)');
		grad.addColorStop(1, 'rgba(0,0,0,0)');
		ctx.fillStyle = grad;
		ctx.beginPath();
		this._visorPath(W, H, 52);
		ctx.fill();

		// ── Scanlines ──
		if (app?.scanlines) {
			ctx.save();
			ctx.beginPath(); this._visorPath(W, H, 52); ctx.clip();
			ctx.strokeStyle = app.primary ?? '#00FFFF';
			ctx.globalAlpha = 0.06; ctx.lineWidth = 1;
			for (let y = 0; y < H; y += 4) {
				ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
			}
			ctx.globalAlpha = 1;
			ctx.restore();
		}

		// ── Face elements (clipped to visor) ──
		ctx.save();
		ctx.beginPath(); this._visorPath(W, H, 52); ctx.clip();
		this._drawFace(ctx, W, H, app, bs, t);
		ctx.restore();

		// ── Visor border glow ──
		const faceCol = stateColor(app, bs).getStyle();
		ctx.strokeStyle = faceCol;
		ctx.lineWidth = 4;
		ctx.globalAlpha = 0.5;
		ctx.beginPath(); this._visorPath(W, H, 52); ctx.stroke();
		ctx.globalAlpha = 1;

		// Overlay faceSVG asynchronously (will flag needsUpdate again)
		if (faceSVG) {
			this._overlayFaceSVG(faceSVG, W, H).then(() => { this.tex.needsUpdate = true; });
		} else {
			this.tex.needsUpdate = true;
		}
	}

	private _visorPath(W: number, H: number, r: number) {
		const ctx = this.ctx;
		ctx.moveTo(r, 0); ctx.lineTo(W - r, 0);
		ctx.arcTo(W, 0, W, r, r);
		ctx.lineTo(W, H - r); ctx.arcTo(W, H, W - r, H, r);
		ctx.lineTo(r, H); ctx.arcTo(0, H, 0, H - r, r);
		ctx.lineTo(0, r); ctx.arcTo(0, 0, r, 0, r);
		ctx.closePath();
	}

	private _drawFace(
		ctx: CanvasRenderingContext2D,
		W: number, H: number,
		app: ArtyAppearance | null,
		bs: BotStateFlags,
		t: number,
	) {
		const faceColor = stateColor(app, bs).getStyle();
		const eyeY  = H * 0.38;
		const lEyeX = W * 0.30;
		const rEyeX = W * 0.70;
		const s = Math.max(22, Math.min(54, (app?.eyeSize ?? 4) * 11));

		ctx.fillStyle   = faceColor;
		ctx.strokeStyle = faceColor;
		ctx.lineCap     = 'round';

		// ── Eyes ──
		if (bs.isVictory) {
			// Big filled circles with white glint
			[lEyeX, rEyeX].forEach(x => {
				ctx.beginPath(); ctx.arc(x, eyeY, s + 10, 0, TAU); ctx.fill();
			});
			ctx.fillStyle = '#ffffff';
			[lEyeX, rEyeX].forEach(x => {
				ctx.beginPath(); ctx.arc(x + s * 0.35, eyeY - s * 0.35, s * 0.28, 0, TAU); ctx.fill();
			});

		} else if (bs.isDefeat) {
			// X eyes
			ctx.lineWidth = 10;
			[lEyeX, rEyeX].forEach(x => {
				ctx.beginPath(); ctx.moveTo(x - s, eyeY - s); ctx.lineTo(x + s, eyeY + s); ctx.stroke();
				ctx.beginPath(); ctx.moveTo(x + s, eyeY - s); ctx.lineTo(x - s, eyeY + s); ctx.stroke();
			});

		} else if (bs.loading) {
			// Spinning arc eyes
			const a = t * 4;
			[lEyeX, rEyeX].forEach(x => {
				ctx.lineWidth = 8;
				ctx.beginPath(); ctx.arc(x, eyeY, s, a, a + TAU * 0.75); ctx.stroke();
				// Inner dot
				ctx.fillStyle = faceColor;
				ctx.beginPath(); ctx.arc(x, eyeY, 10, 0, TAU); ctx.fill();
			});

		} else {
			// Appearance-driven eye shape
			switch (app?.eyeShape ?? 'circle') {
				case 'circle':
					[lEyeX, rEyeX].forEach(x => {
						ctx.beginPath(); ctx.arc(x, eyeY, s, 0, TAU); ctx.fill();
					});
					break;
				case 'rect': {
					const rh = s * 0.55;
					[lEyeX, rEyeX].forEach(x => {
						ctx.fillRect(x - s, eyeY - rh, s * 2, rh * 2);
					});
					break;
				}
				case 'diamond':
					[lEyeX, rEyeX].forEach(x => {
						ctx.beginPath();
						ctx.moveTo(x, eyeY - s); ctx.lineTo(x + s, eyeY);
						ctx.lineTo(x, eyeY + s); ctx.lineTo(x - s, eyeY);
						ctx.closePath(); ctx.fill();
					});
					break;
				case 'bar':
					[lEyeX, rEyeX].forEach(x => {
						ctx.fillRect(x - s, eyeY - s * 0.2, s * 2, s * 0.4);
					});
					break;
			}
		}

		// ── Mouth ──
		const mouthY = H * 0.72;
		ctx.lineWidth   = 9;
		ctx.strokeStyle = faceColor;
		ctx.beginPath();

		if (bs.isVictory) {
			ctx.arc(W / 2, mouthY - 20, 65, 0, Math.PI);
		} else if (bs.isDefeat) {
			ctx.arc(W / 2, mouthY + 35, 58, Math.PI, TAU);
		} else if (bs.loading) {
			const p = (Math.sin(t * 3) + 1) * 0.5;
			ctx.moveTo(W / 2 - 40, mouthY);
			ctx.quadraticCurveTo(W / 2, mouthY - 20 * p, W / 2 + 40, mouthY);
		} else {
			const c = Math.max(-1, Math.min(1, app?.mouthCurve ?? 0));
			ctx.moveTo(W / 2 - 72, mouthY);
			ctx.quadraticCurveTo(W / 2, mouthY + c * 48, W / 2 + 72, mouthY);
		}
		ctx.stroke();
	}

	private async _overlayFaceSVG(svgContent: string, W: number, H: number) {
		const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${svgContent}</svg>`;
		const blob   = new Blob([svgStr], { type: 'image/svg+xml' });
		const url    = URL.createObjectURL(blob);
		return new Promise<void>(resolve => {
			const img  = new Image();
			img.onload = () => {
				this.ctx.globalAlpha = 0.55;
				this.ctx.drawImage(img, 0, 0, W, H);
				this.ctx.globalAlpha = 1;
				URL.revokeObjectURL(url);
				resolve();
			};
			img.onerror = () => { URL.revokeObjectURL(url); resolve(); };
			img.src = url;
		});
	}

	dispose() { this.tex.dispose(); }
}

// ── Main Three.js scene ───────────────────────────────────────────────────────

export class ArtyBotScene {
	private renderer!:  THREE.WebGLRenderer;
	private scene!:     THREE.Scene;
	private camera!:    THREE.PerspectiveCamera;
	private botGroup!:  THREE.Group;
	private bodyMesh!:  THREE.Mesh;
	private visorMesh!: THREE.Mesh;
	private face!:      FaceCanvas;
	private antennaTips: THREE.Mesh[]  = [];
	private sensorNodes: THREE.Mesh[]  = [];
	private particles!:  THREE.Points;
	private lights!:     { ambient: THREE.AmbientLight; key: THREE.PointLight; rim: THREE.PointLight };
	private animId = 0;
	private clock  = new THREE.Clock();
	private app:    ArtyAppearance | null = null;
	private bs:     BotStateFlags = { isVictory: false, isDefeat: false, loading: false, creepLevel: 0, matchedCount: 0 };
	private faceSVG: string | null = null;
	private lastFaceRedrawT = -999;
	private ro?: ResizeObserver;

	constructor(private canvas: HTMLCanvasElement) {}

	// ── Public API ────────────────────────────────────────────────────────────

	init() {
		this._initRenderer();
		this._initScene();
		this._buildBot();
		this._buildParticles();
		this._initLights();
		this._startLoop();
		this._watchResize();
	}

	updateState(state: ArtyState) {
		this.app = state.appearance ?? null;
		this.faceSVG = sanitiseSVGSegment(state.appearance?.faceSVG ?? '');
		this.bs = {
			isVictory:    state.wonGame,
			isDefeat:     state.gameOver && !state.wonGame,
			loading:      state.loading,
			creepLevel:   state.creepLevel,
			matchedCount: state.matchedCount,
		};
		this._syncColors();
		this._syncSensors();
		this._syncParticleColor();
		this._syncAntenna();
		this.lastFaceRedrawT = -999; // force immediate face redraw
	}

	dispose() {
		cancelAnimationFrame(this.animId);
		this.ro?.disconnect();
		this.face?.dispose();
		this.renderer.dispose();
	}

	// ── Initialisation ────────────────────────────────────────────────────────

	private _initRenderer() {
		this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: false });
		this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
		this.renderer.setClearColor(0x000000, 1);
		this._resize();
	}

	private _initScene() {
		this.scene  = new THREE.Scene();
		this.scene.fog = new THREE.FogExp2(0x000000, 0.08);
		this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
		this.camera.position.set(0, 0.15, 4.8);
		this.camera.lookAt(0, 0, 0);
	}

	// ── Bot construction ──────────────────────────────────────────────────────

	private _buildBot() {
		this.botGroup = new THREE.Group();
		this.scene.add(this.botGroup);

		// Body — egg: sphere scaled to (1.02, 1.32, 1.0)
		const bodyGeo = new THREE.SphereGeometry(1, 64, 64);
		const bodyMat = new THREE.MeshStandardMaterial({
			color:     new THREE.Color('#00FFFF'),
			metalness: 0.82, roughness: 0.18,
			emissive:  new THREE.Color('#002020'),
			emissiveIntensity: 1,
		});
		this.bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
		this.bodyMesh.scale.set(1.02, 1.32, 1.0);
		this.botGroup.add(this.bodyMesh);

		// Equatorial ring detail (mechanical seam)
		const ringGeo = new THREE.TorusGeometry(1.05, 0.028, 8, 80);
		const ringMat = new THREE.MeshStandardMaterial({ color: '#001a1a', metalness: 0.9, roughness: 0.1 });
		const ring    = new THREE.Mesh(ringGeo, ringMat);
		ring.scale.y  = 1.32;
		this.botGroup.add(ring);

		// Visor (face plane)
		this.face = new FaceCanvas();
		const visorGeo = new THREE.PlaneGeometry(1.26, 0.94);
		const visorMat = new THREE.MeshBasicMaterial({ map: this.face.tex, transparent: true });
		this.visorMesh  = new THREE.Mesh(visorGeo, visorMat);
		this.visorMesh.position.set(0, 0.12, 0.99);
		this.botGroup.add(this.visorMesh);

		// Ground glow disc
		const glowGeo = new THREE.CircleGeometry(1.2, 48);
		const glowMat = new THREE.MeshBasicMaterial({ color: '#00FFFF', transparent: true, opacity: 0.06, side: THREE.DoubleSide });
		const disc    = new THREE.Mesh(glowGeo, glowMat);
		disc.rotation.x = -Math.PI / 2;
		disc.position.y = -1.9;
		this.botGroup.add(disc);

		// Initial face draw
		this.face.draw(null, this.bs, 0, null);
	}

	private _buildAntenna() {
		// Remove old antennas
		const old = this.botGroup.children.filter(c => c.userData.antenna);
		old.forEach(c => { this.botGroup.remove(c); /* dispose geometry */ });
		this.antennaTips = [];

		const style = this.app?.antennaStyle ?? 'single';
		if (style === 'none') return;

		const stemMat = new THREE.MeshStandardMaterial({ color: this.app?.primary ?? '#00FFFF', metalness: 0.9, roughness: 0.1 });
		const tipMat  = new THREE.MeshStandardMaterial({
			color:    hexToColor(this.app?.secondary ?? '#00FF00'),
			emissive: hexToColor(this.app?.secondary ?? '#00FF00'),
			emissiveIntensity: 2,
		});

		const addAntenna = (dx: number, tilt: number) => {
			const g = new THREE.Group();
			g.userData.antenna = true;

			const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 1.0, 8), stemMat);
			stem.position.y = 0.5;
			g.add(stem);

			const tip = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 10), tipMat);
			tip.position.y = 1.02;
			g.add(tip);
			this.antennaTips.push(tip);

			g.position.set(dx, 1.28, 0);
			g.rotation.z = tilt;
			this.botGroup.add(g);
		};

		if (style === 'single') {
			addAntenna(0.18, 0.14);
		} else if (style === 'dual') {
			addAntenna(-0.22, -0.18);
			addAntenna(0.22,   0.18);
		} else if (style === 'coil') {
			// Coil: stacked tori
			const g = new THREE.Group();
			g.userData.antenna = true;
			const coilMat = new THREE.MeshStandardMaterial({ color: this.app?.primary ?? '#00FFFF', metalness: 0.85, roughness: 0.12 });
			for (let i = 0; i < 4; i++) {
				const coil = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.02, 6, 18), coilMat);
				coil.position.y = 0.18 + i * 0.2;
				coil.rotation.x = Math.PI / 2;
				g.add(coil);
			}
			const tip = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), tipMat);
			tip.position.y = 1.05;
			g.add(tip);
			this.antennaTips.push(tip);
			g.position.set(0.12, 1.2, 0);
			this.botGroup.add(g);
		}
	}

	private _buildParticles() {
		const N   = 900;
		const pos = new Float32Array(N * 3);
		for (let i = 0; i < N; i++) {
			// Spherical shell, thinned in the foreground
			const theta = Math.random() * TAU;
			const phi   = Math.acos(2 * Math.random() - 1);
			const r     = 4 + Math.random() * 7;
			pos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
			pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.6;
			pos[i * 3 + 2] = r * Math.cos(phi) - 2;
		}
		const geo = new THREE.BufferGeometry();
		geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
		const mat = new THREE.PointsMaterial({ color: '#00FFFF', size: 0.035, transparent: true, opacity: 0.45, sizeAttenuation: true });
		this.particles = new THREE.Points(geo, mat);
		this.scene.add(this.particles);
	}

	private _initLights() {
		const ambient = new THREE.AmbientLight(0x111111, 2);
		const key     = new THREE.PointLight(new THREE.Color('#00FFFF'), 4, 14);
		key.position.set(1, 1.5, 3.5);
		const rim     = new THREE.PointLight(new THREE.Color('#00FF00'), 2.5, 10);
		rim.position.set(-3, 2, -2);
		this.scene.add(ambient, key, rim);
		this.lights = { ambient, key, rim };
	}

	// ── Sync helpers ──────────────────────────────────────────────────────────

	private _syncColors() {
		const col    = stateColor(this.app, this.bs);
		const emCol  = col.clone().multiplyScalar(bs_emissiveFactor(this.bs));
		const mat    = this.bodyMesh.material as THREE.MeshStandardMaterial;
		mat.color.copy(col); mat.emissive.copy(emCol); mat.needsUpdate = true;

		this.lights.key.color.copy(col);
		this.lights.rim.color.copy(hexToColor(this.app?.secondary ?? '#00FF00'));

		// Ground disc
		const disc = this.botGroup.children.find(c => c instanceof THREE.Mesh && (c.geometry as THREE.CircleGeometry).type === 'CircleGeometry') as THREE.Mesh | undefined;
		if (disc) (disc.material as THREE.MeshBasicMaterial).color.copy(col);
	}

	private _syncAntenna() { this._buildAntenna(); }

	private _syncSensors() {
		this.sensorNodes.forEach(n => this.botGroup.remove(n));
		this.sensorNodes = [];
		if (this.bs.matchedCount === 0) return;

		const tipGeo = new THREE.SphereGeometry(0.09, 8, 8);
		const orbits = [0, 2.094, 4.189];
		for (let i = 0; i < this.bs.matchedCount; i++) {
			const mat  = new THREE.MeshStandardMaterial({ color: '#00FF00', emissive: '#00FF00', emissiveIntensity: 2.5 });
			const node = new THREE.Mesh(tipGeo, mat);
			node.userData.orbitAngle = orbits[i];
			node.userData.orbitSpeed = 0.38 + i * 0.14;
			this.sensorNodes.push(node);
			this.botGroup.add(node);
		}
	}

	private _syncParticleColor() {
		if (!this.particles) return;
		const mat = this.particles.material as THREE.PointsMaterial;
		mat.color.copy(stateColor(this.app, this.bs));
	}

	// ── Animation loop ────────────────────────────────────────────────────────

	private _startLoop() {
		const loop = () => {
			this.animId = requestAnimationFrame(loop);
			const t = this.clock.getElapsedTime();
			this._animate(t);
			this.renderer.render(this.scene, this.camera);
		};
		loop();
	}

	private _animate(t: number) {
		const bs = this.bs;

		// Float
		this.botGroup.position.y = Math.sin(t * 0.65) * 0.13;

		// Rotation
		const rotSpeed = bs.loading ? 1.5 : bs.isVictory ? 0.9 : 0.14;
		this.botGroup.rotation.y = t * rotSpeed * 0.014 + (bs.isDefeat ? Math.sin(t * 1.8) * 0.12 : 0);

		// Defeat tilt
		const targetTilt = bs.isDefeat ? -0.22 : 0;
		this.botGroup.rotation.z += (targetTilt - this.botGroup.rotation.z) * 0.04;

		// Sensor orbits
		this.sensorNodes.forEach(n => {
			const a = n.userData.orbitAngle + t * n.userData.orbitSpeed;
			n.position.set(Math.cos(a) * 1.35, Math.sin(a * 0.5) * 0.28, Math.sin(a) * 0.72);
		});

		// Antenna tips pulse
		const pulse = (Math.sin(t * 2.8) + 1) * 0.5;
		this.antennaTips.forEach(tip => {
			(tip.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.2 + pulse * 2;
		});

		// Victory: body emissive surge
		if (bs.isVictory) {
			const surge = (Math.sin(t * 3) + 1) * 0.5;
			const mat = this.bodyMesh.material as THREE.MeshStandardMaterial;
			mat.emissiveIntensity = 0.2 + surge * 0.5;
		}

		// Particles drift
		this.particles.rotation.y += 0.0004;
		this.particles.rotation.x += 0.00012;

		// Face redraw: every frame when loading (spinner), else on demand
		const needsRedraw = bs.loading ? true : (t - this.lastFaceRedrawT) > 120;
		if (needsRedraw) {
			this.face.draw(this.app, bs, t, this.faceSVG);
			this.lastFaceRedrawT = t;
		}
	}

	// ── Resize ───────────────────────────────────────────────────────────────

	private _resize() {
		const el = this.canvas.parentElement ?? this.canvas;
		const w  = el.clientWidth  || 400;
		const h  = el.clientHeight || 400;
		this.renderer?.setSize(w, h, false);
		if (this.camera) { this.camera.aspect = w / h; this.camera.updateProjectionMatrix(); }
	}

	private _watchResize() {
		this.ro = new ResizeObserver(() => this._resize());
		this.ro.observe(this.canvas.parentElement ?? this.canvas);
	}
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function bs_emissiveFactor(bs: BotStateFlags): number {
	if (bs.isVictory)        return 0.18;
	if (bs.isDefeat)         return 0.12;
	if (bs.loading)          return 0.08;
	if (bs.creepLevel >= 75) return 0.15;
	return 0.05;
}
