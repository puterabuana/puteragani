/* ============================================================
   Putera Gani — Main JavaScript
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ── Navbar scroll effect ── */
  const navbar = document.getElementById('navbar');
  if (navbar) {
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 20);
    }, { passive: true 
  /* ── Load More Articles (homepage) ── */
  const articleGrid = document.getElementById('article-grid');
  const loadMoreBtn = document.getElementById('load-more-btn');
  if (articleGrid && loadMoreBtn) {
    const INITIAL_VISIBLE = 6;
    const cards = Array.from(articleGrid.querySelectorAll('.article-card'));
    
    // Hide cards beyond initial count
    cards.forEach((card, i) => {
      if (i >= INITIAL_VISIBLE) {
        card.style.display = 'none';
        card.dataset.hidden = 'true';
      }
    });

    // If all cards fit, hide the button
    if (cards.length <= INITIAL_VISIBLE) {
      loadMoreBtn.style.display = 'none';
    }

    loadMoreBtn.addEventListener('click', () => {
      const hidden = articleGrid.querySelectorAll('.article-card[data-hidden="true"]');
      let shown = 0;
      hidden.forEach(card => {
        if (shown < 3) {
          card.style.display = '';
          card.removeAttribute('data-hidden');
          // Animate in
          card.style.opacity = '0';
          card.style.transform = 'translateY(20px)';
          requestAnimationFrame(() => {
            card.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
          });
          shown++;
        }
      });
      // Hide button if no more hidden
      const remaining = articleGrid.querySelectorAll('.article-card[data-hidden="true"]');
      if (remaining.length === 0) {
        loadMoreBtn.style.display = 'none';
      }
    });
  }

});
  }

  /* ── Mobile menu toggle ── */
  const menuBtn  = document.getElementById('menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener('click', () => {
      mobileMenu.classList.toggle('open');
      // Swap icon
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
  }

  /* ── Animate cards on scroll ── */
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        entry.target.style.animationDelay = `${i * 0.07}s`;
        entry.target.classList.add('animate-fade-up');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.article-card').forEach(card => {
    card.style.opacity = '0';
    observer.observe(card);
  });

  /* ── Search bar focus expand ── */
  const searchInput = document.querySelector('.search-input');
  if (searchInput) {
    searchInput.addEventListener('focus',  () => searchInput.style.width = '260px');
    searchInput.addEventListener('blur',   () => searchInput.style.width = '');
  }

  /* ── Reading progress bar (article pages) ── */
  const progressBar = document.getElementById('reading-progress');
  if (progressBar) {
    window.addEventListener('scroll', () => {
      const scrollTop    = document.documentElement.scrollTop;
      const docHeight    = document.documentElement.scrollHeight - window.innerHeight;
      const progress     = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      progressBar.style.width = `${progress}%`;
    }, { passive: true });
  }

});
