// Wobbly blob: a decorative SVG blob that behaves like a drop of ink. A press
// wobbles it, using the same wobble model as the ink cursor (wobble.js), and
// tapping it rapidly makes it swell until it covers the page.
//
// At rest the blob shows its authored path. While it moves, the path is
// redrawn every frame as a fine polygon traced around the blob's center, and
// the authored path goes back once everything has settled. Each press dents
// the outline where it landed and the wobble rings it down.
//
// Taps closer together than `rapidTap` ms each grow the blob a step toward
// covering the viewport. Its size follows a damped spring, like the cursor's
// radius, so every step eases in. When the taps stop for longer than
// `rapidTap`, it lets go and springs back to its authored size.
//
// Once a blob is big enough to start hiding the page, <html> carries the
// `blob-covering` class and `--blobCover`: 0 while the page behind it is still
// clear, 1 once the blob has swallowed it. The stylesheet fades out and
// disables whatever is being swallowed. A wobble or a small grow sets neither,
// so a double-tap can never make a page anyone can still see unclickable.
//
// Only the painted shape takes presses, so the stylesheet has to let the path
// receive pointer events and paint past the SVG's own box. Under
// prefers-reduced-motion the blob neither wobbles nor grows.

import { createWobble } from './wobble.js';

export const DEFAULTS = Object.freeze({
    hz: 2.5,        // wobble frequency of the lowest drop mode
    wobble: 0.035,  // peak wobble as a fraction of the distance from the center
    settle: 380,    // ms for the wobble to fall to 1/e of its peak
    rapidTap: 320,  // ms; closer taps grow the blob, a longer pause lets it shrink back
    growth: 0.15,   // share of the way to covering the viewport each rapid tap adds
    snap: 90,       // size spring stiffness in 1/s². Higher reacts faster.
    bounce: 0.8,    // size spring damping ratio. 1 never overshoots; lower bounces more.
});

const COVERING = 'blob-covering';
const SWALLOW_START = 0.6;  // size at which the page behind the blob starts fading
const SWALLOW_FULL = 0.95;  // size at which there is nothing left to see behind it
const MAX_WOBBLE = 0.15;    // keeps the outline from folding over itself
const OUTLINE_POINTS = 180;
const EDGE_POINTS = 24;     // samples per viewport edge when sizing the cover
const MAX_FRAME = 1 / 30;   // seconds; longer gaps are treated as a stall
const SUBSTEP = 1 / 240;    // seconds; keeps the size spring stable

// Blobs publish what they hide here, and <html> carries the deepest of them,
// so one blob settling cannot strip the state out from under another.
const swallowed = new Map();

function publishSwallow(blob, amount) {
    const root = document.documentElement;
    if (amount > 0) swallowed.set(blob, amount);
    else swallowed.delete(blob);
    const peak = Math.max(0, ...swallowed.values());
    if (peak > 0) {
        root.classList.add(COVERING);
        root.style.setProperty('--blobCover', peak.toFixed(4));
    } else {
        root.classList.remove(COVERING);
        root.style.removeProperty('--blobCover');
    }
}

export function createWobblyBlob(svg, options = {}) {
    const opts = { ...DEFAULTS, ...options };
    const path = svg.querySelector('path');
    const root = document.documentElement;
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    const drop = createWobble({ hz: opts.hz, maxWobble: MAX_WOBBLE });
    const rest = path.getAttribute('d');

    // The outline seen from the blob's center: the angle and distance of evenly
    // spaced points along the authored path, in the SVG's own units.
    const box = path.getBBox();
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    const length = path.getTotalLength();
    const outline = Array.from({ length: OUTLINE_POINTS }, (_, i) => {
        const point = path.getPointAtLength((i / OUTLINE_POINTS) * length);
        return {
            angle: Math.atan2(point.y - cy, point.x - cx),
            distance: Math.hypot(point.x - cx, point.y - cy),
        };
    });
    const byAngle = [...outline].sort((a, b) => a.angle - b.angle);

    const state = {
        size: 0,        // 0 at the authored size, 1 when covering the viewport
        velocity: 0,
        goal: 0,
        lastTap: -Infinity,
        frame: 0,
        last: 0,
    };

    // The authored outline's distance from the center at an angle: the smaller
    // of the two samples around it, so the cover errs on the large side.
    function restDistance(angle) {
        let lo = 0;
        let hi = byAngle.length;
        while (lo < hi) {
            const mid = (lo + hi) >> 1;
            if (byAngle[mid].angle < angle) lo = mid + 1;
            else hi = mid;
        }
        const next = byAngle[lo % byAngle.length];
        const prev = byAngle[(lo + byAngle.length - 1) % byAngle.length];
        return Math.min(prev.distance, next.distance);
    }

    // How many times its authored size the blob must be for the viewport to sit
    // inside it, with room for the deepest wobble so the page never shows
    // through while it ripples.
    function coverScale() {
        const toSvg = svg.getScreenCTM().inverse();
        const width = root.clientWidth;
        const height = root.clientHeight;
        let needed = 1;
        for (let i = 0; i < EDGE_POINTS; i++) {
            const t = i / EDGE_POINTS;
            const edges = [[t * width, 0], [width, t * height], [width - t * width, height], [0, height - t * height]];
            for (const [x, y] of edges) {
                const p = new DOMPoint(x, y).matrixTransform(toSvg);
                const need = Math.hypot(p.x - cx, p.y - cy) / restDistance(Math.atan2(p.y - cy, p.x - cx));
                needed = Math.max(needed, need);
            }
        }
        return needed / (1 - MAX_WOBBLE);
    }

    // How much of the page this blob hides: 0 while the page behind it is still
    // clear, 1 once it has grown past everything worth seeing.
    function swallow() {
        return Math.min(1, Math.max(0, (state.size - SWALLOW_START) / (SWALLOW_FULL - SWALLOW_START)));
    }

    function draw() {
        const grown = state.size === 0 ? 1 : 1 + state.size * (coverScale() - 1);
        const points = outline.map(({ angle, distance }) => {
            const r = distance * grown * drop.scale(angle);
            return `${(cx + Math.cos(angle) * r).toFixed(2)} ${(cy + Math.sin(angle) * r).toFixed(2)}`;
        });
        path.setAttribute('d', `M${points.join('L')}Z`);
    }

    function integrate(dt) {
        const k = opts.snap;
        const c = 2 * opts.bounce * Math.sqrt(k);
        const steps = Math.max(1, Math.ceil(dt / SUBSTEP));
        const h = dt / steps;
        for (let s = 0; s < steps; s++) {
            state.velocity += (-k * (state.size - state.goal) - c * state.velocity) * h;
            state.size += state.velocity * h;
        }
        drop.step(dt, opts.settle);
    }

    function settleNow() {
        state.size = 0;
        state.velocity = 0;
        state.goal = 0;
        drop.reset();
    }

    function atRest() {
        return state.goal === 0 && Math.abs(state.size) < 0.0005 && Math.abs(state.velocity) < 0.01 && drop.settled();
    }

    function tick(now) {
        const dt = Math.min(MAX_FRAME, Math.max(0, (now - state.last) / 1000));
        state.last = now;
        if (state.goal > 0 && now - state.lastTap > opts.rapidTap) {
            // The taps stopped: let go, with a jiggle as it shrinks back.
            state.goal = 0;
            drop.kick(opts.wobble);
        }
        if (reducedMotion.matches) settleNow();
        else integrate(dt);
        if (atRest()) {
            settleNow();
            path.setAttribute('d', rest);
            publishSwallow(path, 0);
            state.frame = 0;
            return;
        }
        publishSwallow(path, swallow());
        draw();
        state.frame = requestAnimationFrame(tick);
    }

    function onDown(event) {
        if (event.button !== 0 || reducedMotion.matches) return;
        // Keeps rapid presses from selecting the page's text.
        event.preventDefault();
        // The press, in the SVG's units, as an angle from the blob's center.
        const hit = new DOMPoint(event.clientX, event.clientY).matrixTransform(svg.getScreenCTM().inverse());
        drop.kick(opts.wobble, Math.atan2(hit.y - cy, hit.x - cx));
        const now = performance.now();
        if (now - state.lastTap <= opts.rapidTap) {
            state.goal = Math.min(1, state.goal + opts.growth);
        }
        state.lastTap = now;
        if (state.frame) return;
        state.last = now;
        state.frame = requestAnimationFrame(tick);
    }

    path.addEventListener('pointerdown', onDown);
}
