document.querySelectorAll('.expandable-item').forEach(item => {
  item.setAttribute('tabindex', '0'); // Make focusable
  item.setAttribute('aria-expanded', 'false'); // Initial state

  item.addEventListener('click', () => {
    const isOpen = item.classList.contains('open');

    // Close all items
    document.querySelectorAll('.expandable-item').forEach(el => {
      el.classList.remove('open');
      el.setAttribute('aria-expanded', 'false');
    });

    // Open clicked one if it was closed
    if (!isOpen) {
      item.classList.add('open');
      item.setAttribute('aria-expanded', 'true');
    }
  });

  item.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault(); // Prevent page scroll on space
      item.click(); // Trigger the click handler
    }
  });
});