// DOS-style audio feedback via Web Audio API
class SoundManager {
	private enabled: boolean;
	private volume: number;
	private ctx: AudioContext | null = null;

	constructor() {
		this.enabled = localStorage.getItem('soundEnabled') !== 'false';
		this.volume  = parseFloat(localStorage.getItem('soundVolume') ?? '0.5');
	}

	private getCtx(): AudioContext | null {
		if (!this.ctx) {
			try { this.ctx = new AudioContext(); } catch { return null; }
		}
		return this.ctx;
	}

	private beep(freq: number, dur: number, type: OscillatorType = 'square') {
		if (!this.enabled) return;
		const ctx = this.getCtx();
		if (!ctx) return;
		const osc  = ctx.createOscillator();
		const gain = ctx.createGain();
		osc.connect(gain);
		gain.connect(ctx.destination);
		osc.type = type;
		osc.frequency.value = freq;
		gain.gain.setValueAtTime(this.volume, ctx.currentTime);
		gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + dur);
		osc.start(ctx.currentTime);
		osc.stop(ctx.currentTime + dur);
	}

	playSubmit() { this.beep(800, 0.1); }

	playMatch() {
		this.beep(600, 0.05);
		setTimeout(() => this.beep(800, 0.05), 50);
	}

	playMiss() {
		setTimeout(() => this.beep(400, 0.15), 0);
		setTimeout(() => this.beep(300, 0.20), 150);
	}

	playVictory() {
		setTimeout(() => this.beep(523, 0.1),  0);
		setTimeout(() => this.beep(659, 0.1),  100);
		setTimeout(() => this.beep(784, 0.1),  200);
		setTimeout(() => this.beep(1047, 0.3), 300);
	}

	playDefeat() {
		setTimeout(() => this.beep(400, 0.2), 0);
		setTimeout(() => this.beep(350, 0.2), 200);
		setTimeout(() => this.beep(300, 0.3), 400);
	}

	isEnabled() { return this.enabled; }

	toggle() {
		this.enabled = !this.enabled;
		localStorage.setItem('soundEnabled', String(this.enabled));
		return this.enabled;
	}
}

// Lazy singleton — only instantiated client-side
let _mgr: SoundManager | null = null;
function mgr(): SoundManager {
	if (!_mgr) _mgr = new SoundManager();
	return _mgr;
}

export const sound = {
	playSubmit:  () => mgr().playSubmit(),
	playMatch:   () => mgr().playMatch(),
	playMiss:    () => mgr().playMiss(),
	playVictory: () => mgr().playVictory(),
	playDefeat:  () => mgr().playDefeat(),
	isEnabled:   () => mgr().isEnabled(),
	toggle:      () => mgr().toggle(),
};
