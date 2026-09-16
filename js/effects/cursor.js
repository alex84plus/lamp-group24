// Ink cursor: a black dot that swells while the primary button is held and
// wobbles like a drop of ink as it changes size.
//
// While the pointer moves, the dot is not drawn by the page at all. It is a
// CSS cursor image the OS moves with no delay; a page-drawn dot always trails
// the real pointer by a frame or two. This module writes that image into two
// custom properties and the stylesheet wires them up:
//
//     body        { cursor: var(--dotCursor), auto; }
//     .dark-thing { --dotSurface: dark; cursor: var(--dotCursorOnDark), auto; }
//
// The `--dotSurface: dark` marker is inherited, so the swell below reads it
// from whatever element is under the pointer and paints the same color the OS
// cursor shows there.
//
// The page takes over only while a click swells: on press it paints an
// identical dot on a small canvas under the pointer, hides the OS cursor,
// runs the swell, and once the dot has settled it gives the OS cursor back.
// The canvas keeps showing the idle dot, hidden exactly underneath the OS
// one, until the pointer next moves, so there is never a frame with no
// cursor while the OS catches up.
//
// The radius follows a damped spring, so the change between idle and pressed
// is smooth and can overshoot a touch. The outline wobbles like a liquid drop
// (wobble.js): every size change kicks it at a random orientation and it
// rings down on its own.
//
// Nothing is created unless the device has a fine pointer that can hover, and
// touch input never triggers the swell. Under prefers-reduced-motion the dot
// still swells, but instantly and without wobble.

import { createWobble } from './wobble.js';

export const DEFAULTS = Object.freeze({
    idleRadius: 6.5,    // px, radius at rest
    pressedRadius: 11.5, // px, radius while the primary button is held
    snap: 300,          // spring stiffness in 1/s². Higher reacts faster.
    bounce: 0.6,        // spring damping ratio. 1 never overshoots; lower bounces more.
    wobble: 0.14,       // peak wobble as a fraction of the radius
    settle: 200,        // ms for the wobble to fall to 1/e of its peak
    dotOnLight: '#171716', // dot color over light surfaces
    dotOnDark: '#f7f3e9',  // dot color over surfaces marked `--dotSurface: dark`
});

const CLASS = 'ink-cursor-held';
const LISTEN = { capture: true, passive: true };

const MODE_HZ = 6;          // wobble frequency of the lowest droplet mode
const MAX_WOBBLE = 0.3;     // keeps the outline from folding over itself
const OUTLINE_POINTS = 72;
const MAX_FRAME = 1 / 30;   // seconds; longer gaps are treated as a stall
const SUBSTEP = 1 / 240;    // seconds; keeps the radius spring stable

// A CSS cursor value for a solid dot with the hotspot at its center.
export function dotCursor(radius, color) {
    const size = Math.ceil(radius) * 2;
    const center = size / 2;
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}'>`
        + `<circle cx='${center}' cy='${center}' r='${radius}' fill='${color}'/></svg>`;
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}") ${center} ${center}`;
}

export function createInkCursor(options = {}) {
    const opts = { ...DEFAULTS, ...options };
    const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    const root = document.documentElement;

    const canvas = document.createElement('canvas');
    canvas.className = 'ink-cursor';
    canvas.setAttribute('aria-hidden', 'true');
    Object.assign(canvas.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        pointerEvents: 'none',
        zIndex: '2147483647',
        opacity: '0',
        willChange: 'transform',
    });
    const ctx = canvas.getContext('2d');

    // The OS cursor is hidden only while the class is on <html>, so a script
    // failure never leaves the page without any cursor at all.
    const style = document.createElement('style');
    style.textContent = `html.${CLASS}, html.${CLASS} * { cursor: none !important; }`;

    const drop = createWobble({ hz: MODE_HZ, maxWobble: MAX_WOBBLE });

    const state = {
        x: 0,
        y: 0,
        half: 0,
        over: null,     // element under the pointer
        phase: 'idle',  // 'idle' | 'held' (canvas replaces the OS cursor) | 'parked' (both, overlapping)
        radius: opts.idleRadius,
        velocity: 0,
        goal: opts.idleRadius,
        pressed: false,
        active: false,
        frame: 0,
        last: 0,
    };

    function applyIdleCursor() {
        root.style.setProperty('--dotCursor', dotCursor(opts.idleRadius, opts.dotOnLight));
        root.style.setProperty('--dotCursorOnDark', dotCursor(opts.idleRadius, opts.dotOnDark));
    }

    function fill() {
        const over = state.over;
        const onDark = over && getComputedStyle(over).getPropertyValue('--dotSurface').trim() === 'dark';
        return onDark ? opts.dotOnDark : opts.dotOnLight;
    }

    function fit() {
        const dpr = window.devicePixelRatio || 1;
        const half = Math.ceil(opts.pressedRadius * (1 + MAX_WOBBLE) * 1.3 + 3);
        const size = half * 2;
        state.half = half;
        if (canvas.width !== size * dpr || canvas.height !== size * dpr) {
            canvas.width = size * dpr;
            canvas.height = size * dpr;
            canvas.style.width = `${size}px`;
            canvas.style.height = `${size}px`;
        }
        ctx.setTransform(dpr, 0, 0, dpr, half * dpr, half * dpr);
    }

    function place() {
        canvas.style.transform = `translate3d(${state.x - state.half}px, ${state.y - state.half}px, 0)`;
    }

    function draw() {
        fit();
        const half = state.half;
        ctx.clearRect(-half, -half, half * 2, half * 2);
        ctx.beginPath();
        for (let i = 0; i < OUTLINE_POINTS; i++) {
            const t = (i / OUTLINE_POINTS) * Math.PI * 2;
            const r = Math.max(0.5, state.radius * drop.scale(t));
            const px = Math.cos(t) * r;
            const py = Math.sin(t) * r;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fillStyle = fill();
        ctx.fill();
    }

    function integrate(dt) {
        const k = opts.snap;
        const c = 2 * opts.bounce * Math.sqrt(k);
        const steps = Math.max(1, Math.ceil(dt / SUBSTEP));
        const h = dt / steps;
        for (let s = 0; s < steps; s++) {
            state.velocity += (-k * (state.radius - state.goal) - c * state.velocity) * h;
            state.radius += state.velocity * h;
        }
        drop.step(dt, opts.settle);
    }

    function settleNow() {
        state.radius = state.goal;
        state.velocity = 0;
        drop.reset();
    }

    function atRest() {
        if (Math.abs(state.radius - state.goal) > 0.02 || Math.abs(state.velocity) > 0.2) return false;
        return drop.settled();
    }

    function takeOver() {
        if (state.phase === 'held') return;
        state.phase = 'held';
        root.classList.add(CLASS);
        canvas.style.opacity = '1';
    }

    function park() {
        state.phase = 'parked';
        root.classList.remove(CLASS);
    }

    function release() {
        state.phase = 'idle';
        root.classList.remove(CLASS);
        canvas.style.opacity = '0';
    }

    function tick(now) {
        const dt = Math.min(MAX_FRAME, Math.max(0, (now - state.last) / 1000));
        state.last = now;
        if (reducedMotion.matches) settleNow();
        else integrate(dt);
        if (atRest()) {
            settleNow();
            state.frame = 0;
            draw();
            if (!state.pressed && state.phase === 'held') park();
            return;
        }
        draw();
        state.frame = requestAnimationFrame(tick);
    }

    function run() {
        if (state.frame || !state.active) return;
        state.last = performance.now();
        state.frame = requestAnimationFrame(tick);
    }

    function stop() {
        cancelAnimationFrame(state.frame);
        state.frame = 0;
    }

    function kick() {
        if (reducedMotion.matches) return;
        drop.kick(opts.wobble);
    }

    function setPressed(pressed) {
        if (pressed === state.pressed) return;
        state.pressed = pressed;
        state.goal = pressed ? opts.pressedRadius : opts.idleRadius;
        if (pressed) {
            // Paint the idle dot exactly under the OS one before swapping them.
            place();
            draw();
            takeOver();
        }
        kick();
        run();
    }

    function track(event) {
        state.x = event.clientX;
        state.y = event.clientY;
        state.over = event.target instanceof Element ? event.target : null;
    }

    function onMove(event) {
        if (event.pointerType === 'touch') return;
        track(event);
        if (state.phase === 'parked') release();
        else if (state.phase === 'held') place();
        // `buttons` is the truth after a release outside the window.
        setPressed((event.buttons & 1) === 1);
    }

    function onDown(event) {
        if (event.pointerType === 'touch' || event.button !== 0) return;
        track(event);
        setPressed(true);
    }

    function onUp(event) {
        if (event.pointerType === 'touch' || event.button !== 0) return;
        setPressed(false);
    }

    function reset() {
        stop();
        state.pressed = false;
        state.goal = opts.idleRadius;
        settleNow();
        release();
    }

    function enable() {
        if (state.active) return;
        state.active = true;
        document.head.append(style);
        document.body.append(canvas);
        applyIdleCursor();
        window.addEventListener('pointermove', onMove, LISTEN);
        window.addEventListener('pointerdown', onDown, LISTEN);
        window.addEventListener('pointerup', onUp, LISTEN);
        window.addEventListener('pointercancel', reset, LISTEN);
        root.addEventListener('pointerleave', reset);
        window.addEventListener('blur', reset);
        fit();
    }

    function disable() {
        if (!state.active) return;
        state.active = false;
        reset();
        window.removeEventListener('pointermove', onMove, LISTEN);
        window.removeEventListener('pointerdown', onDown, LISTEN);
        window.removeEventListener('pointerup', onUp, LISTEN);
        window.removeEventListener('pointercancel', reset, LISTEN);
        root.removeEventListener('pointerleave', reset);
        window.removeEventListener('blur', reset);
        root.style.removeProperty('--dotCursor');
        root.style.removeProperty('--dotCursorOnDark');
        canvas.remove();
        style.remove();
    }

    function sync() {
        if (finePointer.matches) enable();
        else disable();
    }

    finePointer.addEventListener('change', sync);
    sync();

    return {
        set(partial) {
            Object.assign(opts, partial);
            state.goal = state.pressed ? opts.pressedRadius : opts.idleRadius;
            if (!state.active) return;
            applyIdleCursor();
            fit();
            place();
            draw();
            run();
        },
        get() {
            return { ...opts };
        },
        destroy() {
            finePointer.removeEventListener('change', sync);
            disable();
        },
    };
}
