/* ============================================================
   Putera Gani — JSON-Driven Article Engine
   articles.js — rendering, search, filter, load-more
   ============================================================
   HOW TO ADD NEW ARTICLES:
   1. Open /data/articles.json
   2. Add a new object to the "articles" array
   3. Save — the homepage updates automatically.
   ============================================================ */

const ArticleEngine = (() => {

  /* ── State ── */
  const STATE = {
    all:            [],
    filtered:       [],
    displayed:      0,
    INITIAL:        6,
    PER_LOAD:       3,
    activeCategory: 'All',
    searchQuery:    '',
    isSearchActive: false,
  };

  /* ── Category colour map ── */
  const CATEGORY_STYLES = {
    Technology: { bg: 'var(--accent-pale)',  color: 'var(--accent-dark)', border: 'rgba(200,151,58,0.25)' },
    Design:     { bg: '#f0f7ff',             color: '#2563eb',            border: 'rgba(37,99,235,0.2)'   },
    Science:    { bg: '#f0fdf4',             color: '#16a34a',            border: 'rgba(22,163,74,0.2)'   },
    Culture:    { bg: '#fdf4ff',             color: '#9333ea',            border: 'rgba(147,51,234,0.2)'  },
    Business:   { bg: '#fff7ed',             color: '#ea580c',            border: 'rgba(234,88,12,0.2)'   },
    Health:     { bg: '#fef2f2',             color: '#dc2626',            border: 'rgba(220,38,38,0.2)'   },
  };

  function formatDate(isoDate) {
    if (!isoDate) return '';
    return new Date(isoDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }

  function categoryBadge(cat) {
    const s = CATEGORY_STYLES[cat] || CATEGORY_STYLES.Technology;
    return `<span class="category-badge" style="background:${s.bg}; color:${s.color}; border-color:${s.border};">${cat}</span>`;
  }

  function renderCard(article) {
    const date = formatDate(article.date);
    const url  = article.slug ? `articles/${article.slug}/index.html` : (article.url || '#');
    return `
      <article class="article-card" data-id="${article.id}" data-category="${article.category}">
        <a href="${url}" style="text-decoration:none;" aria-label="Read: ${article.title}">
          <div class="card-thumb">
            <img src="${article.image}" alt="${article.title}" loading="lazy" width="600" height="375"
              onerror="this.src='https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=600&q=75'" />
            <div class="card-thumb-overlay"></div>
          </div>
        </a>
        <div class="card-body">
          ${categoryBadge(article.category)}
          <h2 class="card-title">
            <a href="${url}" style="text-decoration:none; color:inherit;">${article.title}</a>
          </h2>
          <p class="card-desc">${article.excerpt}</p>
          <div class="card-meta">
            <span>${date}</span>
            <span class="card-meta-dot"></span>
            <span>${article.readTime} read</span>
          </div>
          <a href="${url}" class="btn-primary mt-4" style="width:fit-content; font-size:0.75rem; padding:0.5rem 1.1rem;">
            Read More
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </a>
        </div>
      </article>`;
  }

  /* ── Render featured hero ── */
  function renderFeatured(articles) {
    const heroSection = document.getElementById('featured-section');
    if (!heroSection) return;
    const featured = articles.find(a => a.featured) || articles[0];
    if (!featured) { heroSection.style.display = 'none'; return; }
    const url = featured.slug ? `articles/${featured.slug}/index.html` : (featured.url || '#');
    heroSection.innerHTML = `
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div class="grid lg:grid-cols-2 gap-12 items-center">
          <div class="animate-fade-up">
            <div class="hero-tag mb-5">
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
              Featured Story
            </div>
            <h1 class="font-display text-white mb-5 leading-tight" style="font-size:clamp(2rem,4vw,3rem); font-weight:700; letter-spacing:-0.02em;">${featured.title}</h1>
            <p class="text-base mb-8" style="color:rgba(255,255,255,0.65); line-height:1.75; max-width:520px;">${featured.excerpt}</p>
            <div class="flex flex-wrap items-center gap-4">
              <a href="${url}" class="btn-accent">
                Read Story
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </a>
              <div class="flex items-center gap-3" style="color:rgba(255,255,255,0.45); font-size:0.8125rem;">
                <span>${featured.readTime} read</span>
                <span style="width:3px;height:3px;border-radius:50%;background:rgba(255,255,255,0.3);"></span>
                <span>${featured.category}</span>
              </div>
            </div>
          </div>
          <div class="hero-img-wrap animate-fade-up delay-200" style="height:420px;">
            <img src="${featured.imageLarge || featured.image}" alt="${featured.title}" loading="eager"
              onerror="this.src='https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800&q=80'" />
            <div class="hero-img-overlay"></div>
          </div>
        </div>
      </div>`;
  }

  /* ── Render trending sidebar ── */
  function renderTrending(articles) {
    const trendingList = document.getElementById('trending-list');
    if (!trendingList) return;
    const trending = articles.filter(a => a.trending).slice(0, 5);
    if (!trending.length) { trendingList.closest('.trending-widget')?.remove(); return; }
    trendingList.innerHTML = trending.map((a, i) => {
      const url = a.slug ? `articles/${a.slug}/index.html` : (a.url || '#');
      return `
        <a href="${url}" class="trending-item" style="text-decoration:none;">
          <span class="trending-num">${String(i+1).padStart(2,'0')}</span>
          <div>
            <div class="trending-title">${a.title}</div>
            <div style="font-size:0.7rem; color:var(--ink-muted); margin-top:3px;">${a.category} · ${a.readTime}</div>
          </div>
        </a>`;
    }).join('');
  }

  /* ── Render category filter chips ── */
  function renderCategoryFilter(articles) {
    const filterWrap = document.getElementById('category-filter');
    if (!filterWrap) return;
    const categories = ['All', ...new Set(articles.map(a => a.category))].sort((a, b) => a === 'All' ? -1 : b === 'All' ? 1 : a.localeCompare(b));
    filterWrap.innerHTML = categories.map(cat => {
      const s = cat === 'All'
        ? { bg: 'var(--ink)', color: 'var(--paper)', border: 'var(--ink)' }
        : (CATEGORY_STYLES[cat] || { bg: 'var(--accent-pale)', color: 'var(--accent-dark)', border: 'rgba(200,151,58,0.25)' });
      const isActive = cat === STATE.activeCategory;
      return `<button class="category-filter-btn${isActive?' active':''}" data-category="${cat}"
        style="display:inline-flex;align-items:center;padding:5px 14px;border-radius:50px;font-size:0.6875rem;font-weight:600;
               letter-spacing:0.08em;text-transform:uppercase;cursor:pointer;border:1px solid;
               background:${isActive?s.bg:'transparent'};color:${isActive?s.color:'var(--ink-soft)'};border-color:${isActive?s.border:'var(--rule)'};
               transition:all 0.22s ease;">${cat}</button>`;
    }).join('');

    filterWrap.querySelectorAll('.category-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        STATE.activeCategory = btn.dataset.category;
        filterWrap.querySelectorAll('.category-filter-btn').forEach(b => {
          const cat = b.dataset.category;
          const s = cat === 'All'
            ? { bg: 'var(--ink)', color: 'var(--paper)', border: 'var(--ink)' }
            : (CATEGORY_STYLES[cat] || { bg: 'var(--accent-pale)', color: 'var(--accent-dark)', border: 'rgba(200,151,58,0.25)' });
          const active = b.dataset.category === STATE.activeCategory;
          b.style.background  = active ? s.bg    : 'transparent';
          b.style.color       = active ? s.color : 'var(--ink-soft)';
          b.style.borderColor = active ? s.border : 'var(--rule)';
        });
        applyFilters();
      });
    });
  }

  /* ── Render sidebar categories ── */
  function renderSidebarCategories(articles) {
    const sidebarCats = document.getElementById('sidebar-categories');
    if (!sidebarCats) return;
    const categoryPageMap = { Technology:'technology.html', Design:'design.html', Science:'science.html', Culture:'culture.html', Business:'category/business/index.html', Health:'category/health/index.html' };
    const categories = [...new Set(articles.map(a => a.category))].sort();
    sidebarCats.innerHTML = categories.map(cat => {
      const s = CATEGORY_STYLES[cat] || CATEGORY_STYLES.Technology;
      const href = categoryPageMap[cat] || `category/${cat.toLowerCase()}/index.html`;
      return `<a href="${href}" class="category-badge" style="text-decoration:none;background:${s.bg};color:${s.color};border-color:${s.border};">${cat}</a>`;
    }).join('');
  }

  /* ════════════════════════════════════════════════════════════
     SEARCH OVERLAY — the core of the new search UX.
     
     Instead of collapsing the hero and scrolling the page,
     we swap entire layers:
       - #homepage-content: the normal page (hero + grid + sidebar)
       - #search-overlay:   the search results layer
     
     When query is non-empty → hide homepage, show overlay (no scroll).
     When query is empty     → show homepage, hide overlay.
     Zero layout shift. Zero scroll jump. Works on all screen sizes.
     ════════════════════════════════════════════════════════════ */

  const homepageContent  = document.getElementById('homepage-content');
  const searchOverlay    = document.getElementById('search-overlay');
  const searchResultsGrid = document.getElementById('search-results-grid');
  const searchNoResults  = document.getElementById('search-no-results');
  const searchNoResultsMsg = document.getElementById('search-no-results-msg');
  const searchOverlayTitle = document.getElementById('search-overlay-title');
  const searchOverlayCount = document.getElementById('search-overlay-count');
  const searchOverlayClose = document.getElementById('search-overlay-close');

  function showSearchOverlay(query, results) {
    /* Update overlay content */
    if (searchOverlayTitle) {
      searchOverlayTitle.textContent = `"${query}"`;
    }
    if (searchOverlayCount) {
      searchOverlayCount.textContent = results.length === 0
        ? 'No articles match your search'
        : `${results.length} article${results.length !== 1 ? 's' : ''} found`;
    }

    /* Render results or show empty state */
    if (searchResultsGrid) {
      searchResultsGrid.innerHTML = '';
      searchResultsGrid.style.display = '';
    }
    if (results.length === 0) {
      if (searchResultsGrid) searchResultsGrid.style.display = 'none';
      if (searchNoResults) {
        searchNoResults.style.display = '';
        if (searchNoResultsMsg) searchNoResultsMsg.textContent = `No articles found for "${query}". Try different keywords.`;
      }
    } else {
      if (searchNoResults) searchNoResults.style.display = 'none';
      if (searchResultsGrid) {
        results.forEach((article, i) => {
          const div = document.createElement('div');
          div.innerHTML = renderCard(article).trim();
          const card = div.firstChild;
          // Staggered fade-in
          card.style.opacity = '0';
          card.style.transform = 'translateY(16px)';
          card.style.transition = `opacity 0.35s ease ${i * 0.06}s, transform 0.35s ease ${i * 0.06}s`;
          searchResultsGrid.appendChild(card);
          // Trigger animation next frame
          requestAnimationFrame(() => requestAnimationFrame(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
          }));
        });
      }
    }

    /* Show overlay, hide homepage — no scroll */
    if (!STATE.isSearchActive) {
      STATE.isSearchActive = true;
      if (homepageContent)  homepageContent.classList.add('search-active');
      if (searchOverlay)    searchOverlay.classList.add('search-active');
    }
  }

  function hideSearchOverlay() {
    STATE.isSearchActive = false;
    if (homepageContent) homepageContent.classList.remove('search-active');
    if (searchOverlay)   searchOverlay.classList.remove('search-active');
    // Clean up grid
    if (searchResultsGrid) searchResultsGrid.innerHTML = '';
  }

  /* Close button on overlay */
  if (searchOverlayClose) {
    searchOverlayClose.addEventListener('click', () => {
      clearAllSearchInputs();
      hideSearchOverlay();
    });
  }

  function clearAllSearchInputs() {
    STATE.searchQuery = '';
    document.querySelectorAll('#search-input, #mobile-search-input').forEach(i => { i.value = ''; });
    const clearBtns = document.querySelectorAll('#search-clear-btn, #mobile-search-clear');
    clearBtns.forEach(b => b.style.display = 'none');
  }

  /* ── Apply search filter ── */
  function applyFilters() {
    const q = STATE.searchQuery.trim();
    const ql = q.toLowerCase();

    if (!q) {
      hideSearchOverlay();
      // Also refresh the main grid in case category changed
      STATE.filtered = STATE.all.sort((a, b) => new Date(b.date) - new Date(a.date));
      return;
    }

    const results = STATE.all
      .filter(a => {
        const matchCat = STATE.activeCategory === 'All' || a.category === STATE.activeCategory;
        if (!matchCat) return false;
        return (
          a.title.toLowerCase().includes(ql) ||
          a.category.toLowerCase().includes(ql) ||
          a.excerpt.toLowerCase().includes(ql) ||
          (a.tags || []).some(t => t.toLowerCase().includes(ql))
        );
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    showSearchOverlay(q, results);
  }

  /* ── Render the homepage article grid ── */
  function renderGrid(reset = false) {
    const grid = document.getElementById('article-grid');
    if (!grid) return;

    if (reset) {
      grid.innerHTML = '';
      STATE.displayed = 0;
    }

    const slice = STATE.filtered.slice(STATE.displayed, STATE.displayed + STATE.PER_LOAD);
    if (!slice.length && STATE.displayed === 0) {
      grid.innerHTML = `
        <div class="col-span-full" style="padding:3rem 0; text-align:center; color:var(--ink-muted);">
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin:0 auto 1rem; opacity:0.4; display:block;">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <p style="font-size:1rem; font-weight:500;">No articles found</p>
          <p style="font-size:0.875rem; margin-top:0.25rem; opacity:0.6;">Try a different category.</p>
        </div>`;
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          entry.target.style.animationDelay = `${i * 0.07}s`;
          entry.target.classList.add('animate-fade-up');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    slice.forEach(article => {
      const div = document.createElement('div');
      div.innerHTML = renderCard(article).trim();
      const card = div.firstChild;
      card.style.opacity = '0';
      grid.appendChild(card);
      observer.observe(card);
    });

    STATE.displayed += slice.length;
  }

  function updateLoadMore() {
    const btn = document.getElementById('load-more-btn');
    if (!btn) return;
    btn.style.display = (STATE.filtered.length - STATE.displayed) > 0 ? '' : 'none';
  }

  /* ── Loading skeleton ── */
  function showSkeleton() {
    const grid = document.getElementById('article-grid');
    if (!grid) return;
    const skeletonCard = `
      <div class="article-card" style="pointer-events:none;">
        <div style="aspect-ratio:16/10; background:linear-gradient(90deg,#f0ede8 25%,#e8e4df 50%,#f0ede8 75%); background-size:200% 100%; animation:shimmer 1.4s infinite;"></div>
        <div class="card-body">
          <div style="height:18px; background:#f0ede8; border-radius:4px; width:30%; margin-bottom:12px; animation:shimmer 1.4s infinite;"></div>
          <div style="height:22px; background:#f0ede8; border-radius:4px; width:90%; margin-bottom:8px; animation:shimmer 1.4s infinite;"></div>
          <div style="height:22px; background:#f0ede8; border-radius:4px; width:75%; margin-bottom:16px; animation:shimmer 1.4s infinite;"></div>
          <div style="height:14px; background:#f0ede8; border-radius:4px; width:60%; animation:shimmer 1.4s infinite;"></div>
        </div>
      </div>`;
    grid.innerHTML = Array(6).fill(skeletonCard).join('');
  }

  function showError(msg) {
    const grid = document.getElementById('article-grid');
    if (grid) {
      grid.innerHTML = `
        <div class="col-span-full" style="padding:3rem; text-align:center; color:var(--ink-muted);">
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin:0 auto 1rem; opacity:0.4; display:block;">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <p style="font-size:1rem; font-weight:500; margin-bottom:0.5rem;">Couldn't load articles</p>
          <p style="font-size:0.8125rem; opacity:0.6;">${msg}</p>
          <button onclick="ArticleEngine.init()" style="margin-top:1.25rem; padding:0.5rem 1.25rem; background:var(--ink); color:#fff; border:none; border-radius:50px; font-size:0.8125rem; cursor:pointer;">Try Again</button>
        </div>`;
    }
    document.getElementById('featured-section')?.style && (document.getElementById('featured-section').style.display = 'none');
    document.getElementById('load-more-btn')?.style && (document.getElementById('load-more-btn').style.display = 'none');
  }

  async function fetchArticles() {
    const res = await fetch('data/articles.json', { cache: 'no-cache' });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    const data = await res.json();
    if (!data.articles || !Array.isArray(data.articles)) throw new Error('Invalid data format in articles.json');
    return data.articles;
  }

  /* ── Wire up all search inputs ── */
  function initSearch() {
    const inputs = document.querySelectorAll('#search-input, #mobile-search-input');
    let debounceTimer;

    inputs.forEach(input => {
      input.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          STATE.searchQuery = input.value;
          // Sync other inputs
          inputs.forEach(i => { if (i !== input) i.value = input.value; });
          applyFilters();
        }, 160);
      });

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          clearAllSearchInputs();
          hideSearchOverlay();
          input.blur();
          // Close mobile search bar if open
          const mobileBar = document.getElementById('mobile-search-bar');
          const mobileBtn = document.getElementById('mobile-search-btn');
          if (mobileBar) mobileBar.classList.remove('open');
          if (mobileBtn) { mobileBtn.classList.remove('active'); mobileBtn.setAttribute('aria-expanded', 'false'); }
        }
      });
    });
  }

  function initLoadMore() {
    const btn = document.getElementById('load-more-btn');
    if (!btn) return;
    btn.addEventListener('click', () => { renderGrid(false); updateLoadMore(); });
  }

  /* ── Public init ── */
  async function init() {
    showSkeleton();
    try {
      const articles = await fetchArticles();
      STATE.all      = articles;
      STATE.filtered = [...articles].sort((a, b) => new Date(b.date) - new Date(a.date));

      renderFeatured(articles);
      renderTrending(articles);
      renderCategoryFilter(articles);
      renderSidebarCategories(articles);

      const grid = document.getElementById('article-grid');
      if (grid) grid.innerHTML = '';
      STATE.displayed = 0;

      const initialSlice = STATE.filtered.slice(0, STATE.INITIAL);
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, i) => {
          if (entry.isIntersecting) {
            entry.target.style.animationDelay = `${i * 0.07}s`;
            entry.target.classList.add('animate-fade-up');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1 });

      initialSlice.forEach(article => {
        const div = document.createElement('div');
        div.innerHTML = renderCard(article).trim();
        const card = div.firstChild;
        card.style.opacity = '0';
        grid.appendChild(card);
        observer.observe(card);
      });
      STATE.displayed = initialSlice.length;

      updateLoadMore();
      initSearch();
      initLoadMore();

    } catch (err) {
      console.error('[ArticleEngine] Failed to load articles:', err);
      showError(err.message || 'An unexpected error occurred.');
    }
  }

  return { init };

})();

/* ── Shimmer animation ── */
const shimmerStyle = document.createElement('style');
shimmerStyle.textContent = `@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`;
document.head.appendChild(shimmerStyle);

/* ── Boot ── */
document.addEventListener('DOMContentLoaded', () => ArticleEngine.init());
