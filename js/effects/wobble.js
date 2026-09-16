// Liquid-drop wobble, shared by the ink cursor and the login blob.
//
// An outline wobbles through the first three oscillation modes of a liquid
// drop (n = 2, 3, 4). A kick sets the modes ringing and they ring down on
// their own. The frequency and decay ratios between modes follow the classic
// droplet scalings, so higher modes run faster and die sooner, which is what
// keeps the wobble from looking uniform.
//
// The caller owns the clock and the drawing: step() advances the modes by a
// frame's worth of time, and scale(angle) says how far the outline sits from
// its center at that angle, as a multiple of its rest distance.

// Mode 2 runs at the droplet's `hz`; the others scale from it.
const MODES = [2, 3, 4].map((n) => ({
    n,
    frequency: Math.sqrt((n * (n - 1) * (n + 2)) / 8), // 1, 1.94, 3
    decay: ((n - 1) * (2 * n + 1)) / 5,                 // 1, 2.8, 5.4
    gain: [1, 0.55, 0.3][n - 2],
}));
const SUBSTEP = 1 / 240; // seconds; keeps the fastest mode stable

// hz: frequency of mode 2. maxWobble: cap on the summed mode amplitudes, as a
// fraction of the rest distance, which keeps the outline from folding over.
export function createWobble({ hz, maxWobble }) {
    const modes = MODES.map(() => ({ c: 0, s: 0, vc: 0, vs: 0 }));

    return {
        // Sets the modes ringing with a peak of `amount`, as a fraction of the
        // rest distance. Without an angle each mode starts at a random
        // orientation; with one, the outline first dents inward at that angle,
        // as if poked there.
        kick(amount, angle) {
            for (let j = 0; j < MODES.length; j++) {
                const m = modes[j];
                const w = 2 * Math.PI * hz * MODES[j].frequency;
                const orientation = angle === undefined
                    ? Math.random() * Math.PI * 2
                    : MODES[j].n * angle + Math.PI;
                const impulse = amount * MODES[j].gain * w;
                m.vc += Math.cos(orientation) * impulse;
                m.vs += Math.sin(orientation) * impulse;
            }
        },

        // Advances the modes by dt seconds. `settle` is the ms mode 2 takes to
        // fall to 1/e of its peak; higher modes settle sooner.
        step(dt, settle) {
            const modeDecay = 2000 / settle;
            const steps = Math.max(1, Math.ceil(dt / SUBSTEP));
            const h = dt / steps;
            for (let s = 0; s < steps; s++) {
                for (let j = 0; j < MODES.length; j++) {
                    const m = modes[j];
                    const w = 2 * Math.PI * hz * MODES[j].frequency;
                    const d = modeDecay * MODES[j].decay;
                    m.vc += (-w * w * m.c - d * m.vc) * h;
                    m.vs += (-w * w * m.s - d * m.vs) * h;
                    m.c += m.vc * h;
                    m.s += m.vs * h;
                }
            }
            let total = 0;
            for (const m of modes) total += Math.hypot(m.c, m.s);
            if (total > maxWobble) {
                const g = maxWobble / total;
                for (const m of modes) {
                    m.c *= g;
                    m.s *= g;
                    m.vc *= g;
                    m.vs *= g;
                }
            }
        },

        scale(angle) {
            let f = 1;
            for (let j = 0; j < MODES.length; j++) {
                const m = modes[j];
                const n = MODES[j].n;
                f += m.c * Math.cos(n * angle) + m.s * Math.sin(n * angle);
            }
            return f;
        },

        settled() {
            for (const m of modes) {
                if (Math.hypot(m.c, m.s) > 0.001 || Math.hypot(m.vc, m.vs) > 0.05) return false;
            }
            return true;
        },

        reset() {
            for (const m of modes) {
                m.c = 0;
                m.s = 0;
                m.vc = 0;
                m.vs = 0;
            }
        },
    };
}
