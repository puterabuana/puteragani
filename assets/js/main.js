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
      const isOpen = mobileMenu.classList.contains('open');
      menuBtn.querySelector('svg').innerHTML = isOpen
        ? `<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>`
        : `<line x1="4" y1="8" x2="20" y2="8"/><line x1="4" y1="16" x2="20" y2="16"/>`;
    });

    document.addEventListener('click', (e) => {
      if (!menuBtn.contains(e.target) && !mobileMenu.contains(e.target)) {
        mobileMenu.classList.remove('open');
        menuBtn.querySelector('svg').innerHTML = `<line x1="4" y1="8" x2="20" y2="8"/><line x1="4" y1="16" x2="20" y2="16"/>`;
      }
    });
  }

  /* ── Mobile search button: show/hide the mobile search bar ── */
  const mobileSearchBtn   = document.getElementById('mobile-search-btn');
  const mobileSearchBar   = document.getElementById('mobile-search-bar');
  const mobileSearchInput = document.getElementById('mobile-search-input');
  const mobileSearchClear = document.getElementById('mobile-search-clear');

  if (mobileSearchBtn && mobileSearchBar && mobileSearchInput) {
    mobileSearchBtn.addEventListener('click', () => {
      const isOpen = mobileSearchBar.classList.toggle('open');
      mobileSearchBtn.setAttribute('aria-expanded', isOpen);
      mobileSearchBtn.classList.toggle('active', isOpen);
      mobileSearchBar.setAttribute('aria-hidden', String(!isOpen));
      mobileSearchInput.disabled = !isOpen;

      if (isOpen) {
        // Close nav menu if open
        if (mobileMenu) mobileMenu.classList.remove('open');
        // Focus input after transition
        setTimeout(() => mobileSearchInput.focus(), 50);
      } else {
        // Clear and close
        mobileSearchInput.value = '';
        mobileSearchInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });

    // Clear button inside mobile search bar
    if (mobileSearchClear) {
      mobileSearchClear.addEventListener('click', () => {
        mobileSearchInput.value = '';
        mobileSearchInput.dispatchEvent(new Event('input', { bubbles: true }));
        mobileSearchClear.style.display = 'none';
        mobileSearchInput.focus();
      });

      mobileSearchInput.addEventListener('input', () => {
        mobileSearchClear.style.display = mobileSearchInput.value ? 'block' : 'none';
      });
    }
  }

  /* ── Desktop search clear button ── */
  const searchInput    = document.getElementById('search-input');
  const searchClearBtn = document.getElementById('search-clear-btn');

  if (searchInput) {
    searchInput.addEventListener('focus',  () => searchInput.style.width = '260px');
    searchInput.addEventListener('blur',   () => { if (!searchInput.value) searchInput.style.width = ''; });

    searchInput.addEventListener('input', () => {
      if (searchClearBtn) {
        searchClearBtn.style.display = searchInput.value ? 'flex' : 'none';
      }
    });
  }

  if (searchClearBtn && searchInput) {
    searchClearBtn.addEventListener('click', () => {
      searchInput.value = '';
      searchClearBtn.style.display = 'none';
      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      searchInput.focus();
    });
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
