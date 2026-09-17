// Site-wide behavior loaded by every page.
import { createInkCursor } from './effects/cursor.js';
import { createWobblyBlob } from './effects/blob.js';

const tokens = getComputedStyle(document.documentElement);
const dotOnLight = tokens.getPropertyValue('--primaryText').trim();
const dotOnDark = tokens.getPropertyValue('--pageBackground').trim();

createInkCursor({
    ...(dotOnLight && { dotOnLight }),
    ...(dotOnDark && { dotOnDark }),
});

for (const blob of document.querySelectorAll('.login-blob')) {
    createWobblyBlob(blob);
}
