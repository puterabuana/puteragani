/* ============================================================
   Putera Gani — Main JavaScript
   UI interactions only. Article rendering is handled by articles.js
   ============================================================ */

window.PuteraGani = (() => {
  const CATEGORY_URLS = {
    Technology: '/technology',
    Design: '/design',
    Culture: '/culture',
    Science: '/science',
    Business: '/category/business/',
    Health: '/category/health/',
  };

  function articleUrl(slug, pageNumber) {
    const base = `/articles/${slug}/`;
    return pageNumber && pageNumber > 1 ? `${base}page-${pageNumber}` : base;
  }

  function categoryUrl(category) {
    return CATEGORY_URLS[category] || `/category/${String(category || '').toLowerCase()}/`;
  }

  function unsplashUrl(source, width, height, quality) {
    if (!source || !source.includes('images.unsplash.com')) return source;
    const url = new URL(source.replaceAll('&amp;', '&'));
    url.searchParams.set('w', String(width));
    url.searchParams.set('h', String(height));
    url.searchParams.set('q', String(quality || 62));
    url.searchParams.set('auto', 'format');
    url.searchParams.set('fit', 'crop');
    return url.toString();
  }

  function responsiveImage(source, width, height, quality) {
    const widths = width >= 1000
      ? [480, 768, width]
      : width >= 600
        ? [320, 480, width]
        : [Math.min(240, width), width];
    const ratio = height / width;
    const candidates = [...new Set(widths.filter((candidate) => candidate > 0 && candidate <= width))];
    return {
      src: unsplashUrl(source, width, height, quality),
      srcset: source && source.includes('images.unsplash.com')
        ? candidates.map((candidateWidth) => {
            const candidateHeight = Math.max(1, Math.round(candidateWidth * ratio));
            return `${unsplashUrl(source, candidateWidth, candidateHeight, quality)} ${candidateWidth}w`;
          }).join(', ')
        : '',
    };
  }

  return { articleUrl, categoryUrl, responsiveImage };
})();

function localPreviewTarget(pathname) {
  if (pathname === '/') return '/index.html';
  if (/^\/(?:about|contact|privacy-policy|terms|technology|design|culture|science)$/.test(pathname)) {
    return `${pathname}.html`;
  }
  if (/^\/category\/[^/]+\/$/.test(pathname)) return `${pathname}index.html`;
  if (/^\/articles\/[^/]+\/$/.test(pathname)) return `${pathname}index.html`;
  if (/^\/articles\/[^/]+\/page-[23]$/.test(pathname)) return `${pathname}.html`;
  return '';
}

function cleanRuntimePath(pathname) {
  if (pathname === '/business.html' || pathname === '/business') return '/category/business/';
  if (pathname === '/health.html' || pathname === '/health') return '/category/health/';
  if (/\/index\.html$/i.test(pathname)) return pathname.replace(/index\.html$/i, '');
  if (/\.html$/i.test(pathname)) return pathname.replace(/\.html$/i, '');
  return pathname;
}

function runtimeImageSizes(image, width) {
  if (image.classList.contains('article-header-img')) return '(max-width: 768px) 100vw, 896px';
  if (image.getAttribute('fetchpriority') === 'high') return '(max-width: 1023px) 100vw, 50vw';
  if (width <= 600) return '(max-width: 639px) 100vw, (max-width: 1279px) 50vw, 33vw';
  return `(max-width: ${width}px) 100vw, ${width}px`;
}

function enhanceRuntimeContent(root) {
  const elements = root instanceof Element ? [root, ...root.querySelectorAll('a[href], img[src]')] : [];

  for (const element of elements) {
    if (element.matches('a[href]')) {
      const rawHref = element.getAttribute('href');
      if (!rawHref || /^(?:mailto:|tel:|javascript:|data:|#)/i.test(rawHref)) continue;
      const url = new URL(rawHref, window.location.href);
      if (url.origin !== window.location.origin) continue;
      const cleanPath = cleanRuntimePath(url.pathname);
      if (cleanPath !== url.pathname) element.setAttribute('href', `${cleanPath}${url.search}${url.hash}`);
    }

    if (element.matches('img[src]')) {
      const source = element.getAttribute('src');
      const width = Number(element.getAttribute('width'));
      const height = Number(element.getAttribute('height'));
      if (!source || !source.includes('images.unsplash.com') || !width || !height) continue;

      const image = window.PuteraGani.responsiveImage(source, width, height, 62);
      element.setAttribute('src', image.src);
      if (image.srcset) element.setAttribute('srcset', image.srcset);
      element.setAttribute('sizes', runtimeImageSizes(element, width));
    }
  }
}

const runtimeContentObserver = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (node instanceof Element) enhanceRuntimeContent(node);
    }
  }
});

runtimeContentObserver.observe(document.documentElement, { childList: true, subtree: true });

document.addEventListener('click', (event) => {
  const isLocalPreview = ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname);
  if (!isLocalPreview || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

  const link = event.target.closest('a[href]');
  if (!link || link.target || link.hasAttribute('download')) return;
  const url = new URL(link.href, window.location.href);
  if (url.origin !== window.location.origin) return;

  const previewPath = localPreviewTarget(url.pathname);
  if (!previewPath) return;
  event.preventDefault();
  window.location.assign(`${previewPath}${url.search}${url.hash}`);
});

document.addEventListener('DOMContentLoaded', () => {
  enhanceRuntimeContent(document.body);

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
