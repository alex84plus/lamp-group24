// Site-wide behavior loaded by every page.
import { createInkCursor } from './effects/cursor.js';
import { createWobblyBlob } from './effects/blob.js';

const urlBase = (typeof window !== 'undefined' && window.location && 
  (window.location.hostname === 'localhost' || 
   window.location.hostname === '127.0.0.1' || 
   window.location.origin.includes('alex84plus')))
  ? '/api/index.php'
  : 'http://lamp.alex84plus.xyz/api/index.php';

const loginUrlBase = urlBase;

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
