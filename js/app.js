// Dashboard behaviour: copy-to-clipboard buttons on the contact details card.
const status = document.getElementById('copy-status');

document.addEventListener('click', async (event) => {
    const button = event.target.closest('.contact-view-copy');
    if (!button) return;

    const field = button.closest('.contact-view-field');
    const label = field.querySelector('.contact-view-label').textContent;
    const value = field.querySelector('.contact-view-value').textContent.trim();

    try {
        await navigator.clipboard.writeText(value);
    } catch {
        status.textContent = `Could not copy ${label.toLowerCase()}`;
        return;
    }

    status.textContent = `${label} copied`;
    button.classList.add('is-copied');
    clearTimeout(button.resetTimer);
    button.resetTimer = setTimeout(() => button.classList.remove('is-copied'), 1500);
});
