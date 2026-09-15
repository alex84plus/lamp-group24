// Site-wide behavior loaded by every page.
import { createInkCursor } from './ink-cursor.js';

const tokens = getComputedStyle(document.documentElement);
const ink = tokens.getPropertyValue('--primaryText').trim();
const paper = tokens.getPropertyValue('--pageBackground').trim();

createInkCursor({
    ...(ink && { ink }),
    ...(paper && { paper }),
});
