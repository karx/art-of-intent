<!--
  ArtyWidget — canvas renderer for Arty's ASCII portrait.
  Three-color system:
    ◉ ◎ ● eye chars   → amber  #e8c060  (the soul)
    §...§ matched text → green  #44ff88  (target word hit)
    everything else    → teal   #00e5b4  (default haiku chars)
-->
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { INITIAL_ARTY_ASCII, parseArtLine } from '$lib/arty-ascii';
	import type { ArtSegment } from '$lib/arty-ascii';

	interface Props {
		width?: number;
		height?: number;
		fullscreen?: boolean;
		loading?: boolean;
		asciiWindow?: string | null;
	}

	let {
		width = 240,
		height = 200,
		fullscreen = false,
		loading = false,
		asciiWindow = null,
	}: Props = $props();

	let canvas: HTMLCanvasElement;
	let container: HTMLDivElement;
	let ro: ResizeObserver;
	let rafId = 0;
	let mounted = false;

	let cW = 0;
	let cH = 0;

	const art = $derived((asciiWindow ?? INITIAL_ARTY_ASCII));

	// Pre-parse art into colored segments whenever art changes
	// (avoids re-parsing on every frame)
	let parsedLines = $derived(
		art.split('\n').map(line => parseArtLine(line))
	);

	// ── Colors ──────────────────────────────────────────────────────────────
	const COLOR_DEFAULT = '#00e5b4';   // teal  — haiku chars
	const COLOR_MATCHED = '#44ff88';   // green — matched target word chars
	const COLOR_EYE     = '#e8c060';   // amber — the soul (◉ etc.)
	const COLOR_GLOW_D  = '#00e5b455';
	const COLOR_GLOW_M  = '#44ff8880';
	const COLOR_GLOW_E  = '#e8c06088';
	const BG            = '#000610';

	// ── Resize ───────────────────────────────────────────────────────────────
	function resize() {
		if (!canvas || !container) return;
		const dpr  = window.devicePixelRatio || 1;
		const rect = container.getBoundingClientRect();
		cW = Math.max(1, Math.floor(rect.width));
		cH = Math.max(1, Math.floor(rect.height));
		canvas.width        = cW * dpr;
		canvas.height       = cH * dpr;
		canvas.style.width  = cW + 'px';
		canvas.style.height = cH + 'px';
	}

	// ── Render loop ──────────────────────────────────────────────────────────
	let tick  = 0;
	let scanY = 0;

	function render() {
		rafId = requestAnimationFrame(render);
		if (!mounted || !canvas || cW < 2 || cH < 2) return;

		const dpr = window.devicePixelRatio || 1;
		const ctx = canvas.getContext('2d')!;
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

		const W = cW;
		const H = cH;
		const lines = parsedLines;
		const numLines = lines.length;

		// Longest visible line (strip § from char count)
		const maxLen = Math.max(
			...lines.map(segs => [...segs.map(s => [...s.text].length).reduce((a, b) => a + b, 0)]),
			1
		);

		// ── Font size to fill container ──────────────────────────────────
		// Courier New: charW ≈ fontSize × 0.601
		const fByW = W / (maxLen   * 0.601);
		const fByH = H / (numLines * 1.42);
		const fSize = Math.max(6, Math.floor(Math.min(fByW, fByH)));

		ctx.font = `${fSize}px "Courier New", Courier, monospace`;
		const cw  = ctx.measureText('M').width;
		const lh  = fSize * 1.42;

		const totalW = maxLen  * cw;
		const totalH = numLines * lh;
		const ox = Math.floor((W - totalW) / 2);
		const oy = Math.floor((H - totalH) / 2) + fSize;

		// ── Background ────────────────────────────────────────────────────
		ctx.fillStyle = BG;
		ctx.fillRect(0, 0, W, H);

		// CRT scanline texture
		ctx.fillStyle = 'rgba(0,0,0,0.15)';
		for (let y = 0; y < H; y += 3) ctx.fillRect(0, y, W, 1);

		// ── Loading: pulse ────────────────────────────────────────────────
		const alpha = loading ? 0.45 + 0.3 * Math.sin(tick * 0.07) : 1;
		ctx.globalAlpha = alpha;

		// ── Draw each line, segment by segment ───────────────────────────
		lines.forEach((segs: ArtSegment[], i: number) => {
			let xPos = ox;
			segs.forEach((seg: ArtSegment) => {
				const color = seg.color === 'matched' ? COLOR_MATCHED
				            : seg.color === 'eye'     ? COLOR_EYE
				            :                           COLOR_DEFAULT;
				const glow  = seg.color === 'matched' ? COLOR_GLOW_M
				            : seg.color === 'eye'     ? COLOR_GLOW_E
				            :                           COLOR_GLOW_D;

				ctx.shadowColor  = glow;
				ctx.shadowBlur   = seg.color === 'eye' ? fSize * 0.9 : fSize * 0.5;
				ctx.fillStyle    = color;
				ctx.fillText(seg.text, xPos, oy + i * lh);
				xPos += ctx.measureText(seg.text).width;
			});
		});

		ctx.globalAlpha = 1;
		ctx.shadowBlur  = 0;

		// ── Loading: sweeping scanline ────────────────────────────────────
		if (loading) {
			scanY = (scanY + 1.5) % H;
			const gr = ctx.createLinearGradient(0, scanY - 40, 0, scanY + 40);
			gr.addColorStop(0,   'rgba(0,229,180,0)');
			gr.addColorStop(0.5, 'rgba(0,229,180,0.07)');
			gr.addColorStop(1,   'rgba(0,229,180,0)');
			ctx.fillStyle = gr;
			ctx.fillRect(0, Math.max(0, scanY - 40), W, 80);
		}

		tick++;
	}

	// ── Lifecycle ────────────────────────────────────────────────────────────
	onMount(() => {
		mounted = true;
		ro = new ResizeObserver(() => resize());
		ro.observe(container);
		resize();
		rafId = requestAnimationFrame(render);
	});

	onDestroy(() => {
		mounted = false;
		ro?.disconnect();
		cancelAnimationFrame(rafId);
	});
</script>

<div
	bind:this={container}
	class="arty-wrap"
	class:fullscreen
	style={fullscreen ? '' : `width:${width}px;height:${height}px;`}
	aria-label="Arty companion"
	role="img"
>
	<canvas bind:this={canvas}></canvas>
</div>

<style>
	.arty-wrap {
		position: relative;
		display: block;
		background: #000610;
		overflow: hidden;
	}
	.arty-wrap.fullscreen {
		position: absolute;
		inset: 0;
		width: 100% !important;
		height: 100% !important;
	}
	canvas { display: block; }
</style>
