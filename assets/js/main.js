/* ============================================================
   Putera Gani — Main JavaScript
   UI interactions only. Article rendering is handled by articles.js
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ── Navbar scroll effect ── */
  const navbar = document.getElementById('navbar');
  if (navbar) {
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 20);
    }, { passive: true });
  }

  /* ── Mobile menu toggle ── */
  const menuBtn    = document.getElementById('menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener('click', () => {
      mobileMenu.classList.toggle('open');
      const icon = menuBtn.querySelector('svg');
      if (mobileMenu.classList.contains('open')) {
        icon.innerHTML = `
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>`;
      } else {
        icon.innerHTML = `
          <line x1="4" y1="8" x2="20" y2="8"/>
          <line x1="4" y1="16" x2="20" y2="16"/>`;
      }
    });

    // Close mobile menu on outside click
    document.addEventListener('click', (e) => {
      if (!menuBtn.contains(e.target) && !mobileMenu.contains(e.target)) {
        mobileMenu.classList.remove('open');
      }
    });
  }

  /* ── Search bar focus expand (desktop) ── */
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('focus', () => searchInput.style.width = '260px');
    searchInput.addEventListener('blur',  () => { if (!searchInput.value) searchInput.style.width = ''; });
  }

  /* ── Reading progress bar (article pages only) ── */
  const progressBar = document.getElementById('reading-progress');
  if (progressBar) {
    window.addEventListener('scroll', () => {
      const scrollTop  = document.documentElement.scrollTop;
      const docHeight  = document.documentElement.scrollHeight - window.innerHeight;
      const progress   = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      progressBar.style.width = `${progress}%`;
    }, { passive: true });
  }

});

/* ── Spinner animation for loading state ── */
const spinStyle = document.createElement('style');
spinStyle.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
document.head.appendChild(spinStyle);
