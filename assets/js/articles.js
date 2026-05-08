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
    all: [],         // all articles from JSON
    filtered: [],    // currently filtered/searched set
    displayed: 0,    // how many are currently shown in grid
    INITIAL: 6,      // articles shown on load
    PER_LOAD: 3,     // added per "Load More" click
    activeCategory: 'All',
    searchQuery: '',
  };

  /* ── Category colour map (matches existing CSS design) ── */
  const CATEGORY_STYLES = {
    Technology: { bg: 'var(--accent-pale)',  color: 'var(--accent-dark)', border: 'rgba(200,151,58,0.25)' },
    Design:     { bg: '#f0f7ff',             color: '#2563eb',            border: 'rgba(37,99,235,0.2)'   },
    Science:    { bg: '#f0fdf4',             color: '#16a34a',            border: 'rgba(22,163,74,0.2)'   },
    Culture:    { bg: '#fdf4ff',             color: '#9333ea',            border: 'rgba(147,51,234,0.2)'  },
    Business:   { bg: '#fff7ed',             color: '#ea580c',            border: 'rgba(234,88,12,0.2)'   },
    Health:     { bg: '#fef2f2',             color: '#dc2626',            border: 'rgba(220,38,38,0.2)'   },
  };

  /* ── Format date → "May 2025" ── */
  function formatDate(isoDate) {
    if (!isoDate) return '';
    const d = new Date(isoDate + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }

  /* ── Category badge HTML ── */
  function categoryBadge(cat) {
    const s = CATEGORY_STYLES[cat] || CATEGORY_STYLES.Technology;
    return `<span class="category-badge" style="background:${s.bg}; color:${s.color}; border-color:${s.border};">${cat}</span>`;
  }

  /* ── Render article card HTML ── */
  function renderCard(article) {
    const date = formatDate(article.date);
    const url  = article.slug ? `articles/${article.slug}/index.html` : (article.url || '#');
    return `
      <article class="article-card" data-id="${article.id}" data-category="${article.category}">
        <a href="${url}" style="text-decoration:none;" aria-label="Read: ${article.title}">
          <div class="card-thumb">
            <img
              src="${article.image}"
              alt="${article.title}"
              loading="lazy"
              width="600" height="375"
              onerror="this.src='https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=600&q=75'"
            />
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

  /* ── Render the featured hero section ── */
  function renderFeatured(articles) {
    const heroSection = document.getElementById('featured-section');
    if (!heroSection) return;

    const featured = articles.find(a => a.featured) || articles[0];
    if (!featured) { heroSection.style.display = 'none'; return; }

    const url = featured.slug ? `articles/${featured.slug}/index.html` : (featured.url || '#');
    heroSection.innerHTML = `
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div class="grid lg:grid-cols-2 gap-12 items-center">
          <!-- Featured Text -->
          <div class="animate-fade-up">
            <div class="hero-tag mb-5">
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
              Featured Story
            </div>
            <h1 class="font-display text-white mb-5 leading-tight" style="font-size:clamp(2rem,4vw,3rem); font-weight:700; letter-spacing:-0.02em;">
              ${featured.title}
            </h1>
            <p class="text-base mb-8" style="color:rgba(255,255,255,0.65); line-height:1.75; max-width:520px;">
              ${featured.excerpt}
            </p>
            <div class="flex flex-wrap items-center gap-4">
              <a href="${url}" class="btn-accent">
                Read Story
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </a>
              <div class="flex items-center gap-3" style="color:rgba(255,255,255,0.45); font-size:0.8125rem;">
                <span>${featured.readTime} read</span>
                <span style="width:3px;height:3px;border-radius:50%;background:rgba(255,255,255,0.3);"></span>
                <span>${featured.category}</span>
              </div>
            </div>
          </div>
          <!-- Featured Image -->
          <div class="hero-img-wrap animate-fade-up delay-200" style="height:420px;">
            <img
              src="${featured.imageLarge || featured.image}"
              alt="${featured.title}"
              loading="eager"
              onerror="this.src='https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800&q=80'"
            />
            <div class="hero-img-overlay"></div>
          </div>
        </div>
      </div>`;
  }

  /* ── Render trending sidebar list ── */
  function renderTrending(articles) {
    const trendingList = document.getElementById('trending-list');
    if (!trendingList) return;

    const trending = articles.filter(a => a.trending).slice(0, 5);
    if (!trending.length) { trendingList.closest('.trending-widget')?.style && (trendingList.closest('.trending-widget').style.display = 'none'); return; }

    trendingList.innerHTML = trending.map((a, i) => {
      const num = String(i + 1).padStart(2, '0');
      const url = a.slug ? `articles/${a.slug}/index.html` : (a.url || '#');
      return `
        <a href="${url}" class="trending-item" style="text-decoration:none;">
          <span class="trending-num">${num}</span>
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
      return `
        <button
          class="category-filter-btn ${isActive ? 'active' : ''}"
          data-category="${cat}"
          style="
            display:inline-flex; align-items:center; padding:5px 14px;
            border-radius:50px; font-size:0.6875rem; font-weight:600;
            letter-spacing:0.08em; text-transform:uppercase;
            cursor:pointer; border:1px solid;
            background:${isActive ? s.bg : 'transparent'};
            color:${isActive ? s.color : 'var(--ink-soft)'};
            border-color:${isActive ? s.border : 'var(--rule)'};
            transition:all 0.22s ease;
          "
        >${cat}</button>`;
    }).join('');

    filterWrap.querySelectorAll('.category-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        STATE.activeCategory = btn.dataset.category;
        applyFilters();
        // Update active styles
        filterWrap.querySelectorAll('.category-filter-btn').forEach(b => {
          const cat = b.dataset.category;
          const s = cat === 'All'
            ? { bg: 'var(--ink)', color: 'var(--paper)', border: 'var(--ink)' }
            : (CATEGORY_STYLES[cat] || { bg: 'var(--accent-pale)', color: 'var(--accent-dark)', border: 'rgba(200,151,58,0.25)' });
          const active = b.dataset.category === STATE.activeCategory;
          b.style.background    = active ? s.bg   : 'transparent';
          b.style.color         = active ? s.color : 'var(--ink-soft)';
          b.style.borderColor   = active ? s.border : 'var(--rule)';
        });
      });
    });
  }

  /* ── Render browse categories sidebar ── */
  function renderSidebarCategories(articles) {
    const sidebarCats = document.getElementById('sidebar-categories');
    if (!sidebarCats) return;

    const categoryPageMap = { Technology: 'technology.html', Design: 'design.html', Science: 'science.html', Culture: 'culture.html', Business: 'category/business/index.html', Health: 'category/health/index.html' };
    const categories = [...new Set(articles.map(a => a.category))].sort();

    sidebarCats.innerHTML = categories.map(cat => {
      const s = CATEGORY_STYLES[cat] || CATEGORY_STYLES.Technology;
      const href = categoryPageMap[cat] || `category/${cat.toLowerCase()}/index.html`;
      return `<a href="${href}" class="category-badge" style="text-decoration:none; background:${s.bg}; color:${s.color}; border-color:${s.border};">${cat}</a>`;
    }).join('');
  }

  /* ── Apply search + category filter, refresh grid ── */
  function applyFilters() {
    const q = STATE.searchQuery.toLowerCase().trim();
    STATE.filtered = STATE.all
      .filter(a => {
        const matchCat = STATE.activeCategory === 'All' || a.category === STATE.activeCategory;
        if (!matchCat) return false;
        if (!q) return true;
        return (
          a.title.toLowerCase().includes(q) ||
          a.category.toLowerCase().includes(q) ||
          a.excerpt.toLowerCase().includes(q) ||
          (a.tags || []).some(t => t.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date)); // newest first

    STATE.displayed = 0;
    renderGrid(true); // full reset
    updateLoadMore();
    showSearchFeedback(q, STATE.filtered.length);
  }

  /* ── Render the article grid ── */
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
          <p style="font-size:0.875rem; margin-top:0.25rem; opacity:0.6;">Try a different search term or category.</p>
        </div>`;
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          const el = entry.target;
          el.style.animationDelay = `${i * 0.07}s`;
          el.classList.add('animate-fade-up');
          observer.unobserve(el);
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

  /* ── Load more button logic ── */
  function updateLoadMore() {
    const btn = document.getElementById('load-more-btn');
    if (!btn) return;
    const remaining = STATE.filtered.length - STATE.displayed;
    btn.style.display = remaining > 0 ? '' : 'none';
  }

  /* ── Search feedback message ── */
  function showSearchFeedback(query, count) {
    let feedback = document.getElementById('search-feedback');
    if (!feedback) {
      feedback = document.createElement('p');
      feedback.id = 'search-feedback';
      feedback.style.cssText = 'font-size:0.8125rem; color:var(--ink-muted); margin-bottom:1.25rem; min-height:1.2em;';
      const label = document.querySelector('.section-label');
      label?.insertAdjacentElement('afterend', feedback);
    }
    if (!query && STATE.activeCategory === 'All') {
      feedback.textContent = '';
    } else if (count === 0) {
      feedback.textContent = `No results for "${query || STATE.activeCategory}"`;
    } else {
      const parts = [];
      if (query) parts.push(`"${query}"`);
      if (STATE.activeCategory !== 'All') parts.push(STATE.activeCategory);
      feedback.textContent = `${count} article${count !== 1 ? 's' : ''} for ${parts.join(' in ')}`;
    }
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

  /* ── Error state ── */
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
    const hero = document.getElementById('featured-section');
    if (hero) hero.style.display = 'none';
    const loadMoreBtn = document.getElementById('load-more-btn');
    if (loadMoreBtn) loadMoreBtn.style.display = 'none';
  }

  /* ── Fetch JSON data ── */
  async function fetchArticles() {
    const res = await fetch('data/articles.json', { cache: 'no-cache' });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    const data = await res.json();
    if (!data.articles || !Array.isArray(data.articles)) throw new Error('Invalid data format in articles.json');
    return data.articles;
  }

  /* ── Wire up search inputs ── */
  function initSearch() {
    const inputs = document.querySelectorAll('.search-input');
    let debounceTimer;
    inputs.forEach(input => {
      input.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          STATE.searchQuery = input.value;
          // Sync all search inputs
          inputs.forEach(i => { if (i !== input) i.value = input.value; });
          applyFilters();
        }, 220);
      });
    });
  }

  /* ── Wire up Load More button ── */
  function initLoadMore() {
    const btn = document.getElementById('load-more-btn');
    if (!btn) return;
    btn.addEventListener('click', () => {
      renderGrid(false);
      updateLoadMore();
    });
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

      // Initial grid: show first INITIAL articles
      const grid = document.getElementById('article-grid');
      if (grid) grid.innerHTML = '';
      STATE.displayed = 0;

      // Show INITIAL cards by calling renderGrid in chunks
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

/* ── Shimmer animation (injected once) ── */
const shimmerStyle = document.createElement('style');
shimmerStyle.textContent = `@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`;
document.head.appendChild(shimmerStyle);

/* ── Boot when DOM ready ── */
document.addEventListener('DOMContentLoaded', () => ArticleEngine.init());
