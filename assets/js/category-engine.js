/* ============================================================
   Putera Gani — Category Page Engine
   category-engine.js

   Reads data-category from <main id="category-page">
   Fetches /data/articles.json
   Renders filtered, sorted article cards with full working links.

   Path resolution is automatic — works from any depth.
   ============================================================ */

const CategoryEngine = (() => {

  /* ── Category config: colours + descriptions ── */
  const CATEGORY_CONFIG = {
    Technology: {
      style:  { bg: 'var(--accent-pale)', color: 'var(--accent-dark)', border: 'rgba(200,151,58,0.25)' },
      icon:   '<path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>',
      desc:   'Artificial intelligence, blockchain, quantum computing, and the digital innovations reshaping civilization — explored with depth and clarity.',
    },
    Design: {
      style:  { bg: '#f0f7ff', color: '#2563eb', border: 'rgba(37,99,235,0.2)' },
      icon:   '<path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/>',
      desc:   'The principles, craft, and culture of design — from timeless typography to the future of digital experience.',
    },
    Science: {
      style:  { bg: '#f0fdf4', color: '#16a34a', border: 'rgba(22,163,74,0.2)' },
      icon:   '<path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/>',
      desc:   'Quantum breakthroughs, climate science, neuroscience, and the discoveries pushing the boundaries of human knowledge.',
    },
    Culture: {
      style:  { bg: '#fdf4ff', color: '#9333ea', border: 'rgba(147,51,234,0.2)' },
      icon:   '<path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>',
      desc:   'Cities, creativity, identity, and the social forces shaping how we live, think, and connect with one another.',
    },
    Business: {
      style:  { bg: '#fff7ed', color: '#ea580c', border: 'rgba(234,88,12,0.2)' },
      icon:   '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
      desc:   'The creator economy, entrepreneurship, leadership, and the new rules of work in an era of rapid transformation.',
    },
    Health: {
      style:  { bg: '#fef2f2', color: '#dc2626', border: 'rgba(220,38,38,0.2)' },
      icon:   '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
      desc:   'Mental health, wellness technology, medical breakthroughs, and the science of living well in a demanding world.',
    },
  };

  /* ── Compute path prefix relative to site root ── */
  function getPrefix() {
    // Count path segments below the root to determine how many ../ needed
    const parts = window.location.pathname.replace(/\/+$/, '').split('/').filter(Boolean);
    // e.g. /category/business/ → 2 parts → ../../
    return parts.length > 0 ? '../'.repeat(parts.length) : '';
  }

  /* ── Format ISO date ── */
  function formatDate(iso) {
    if (!iso) return '';
    return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }

  /* ── Category badge HTML ── */
  function badge(cat) {
    const s = (CATEGORY_CONFIG[cat] || CATEGORY_CONFIG.Technology).style;
    return `<span class="category-badge" style="background:${s.bg};color:${s.color};border-color:${s.border};">${cat}</span>`;
  }

  /* ── Render one article card ── */
  function renderCard(article, prefix) {
    const date = formatDate(article.date);
    const url  = `${prefix}articles/${article.slug}/index.html`;
    return `
      <article class="article-card">
        <a href="${url}" style="text-decoration:none;" aria-label="Read: ${article.title}">
          <div class="card-thumb">
            <img
              src="${article.image}"
              alt="${article.title}"
              loading="lazy" width="600" height="375"
              onerror="this.src='https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=600&q=75'"
            />
            <div class="card-thumb-overlay"></div>
          </div>
        </a>
        <div class="card-body">
          ${badge(article.category)}
          <h2 class="card-title">
            <a href="${url}" style="text-decoration:none;color:inherit;">${article.title}</a>
          </h2>
          <p class="card-desc">${article.excerpt}</p>
          <div class="card-meta">
            <span>${date}</span>
            <span class="card-meta-dot"></span>
            <span>${article.readTime} read</span>
          </div>
          <a href="${url}" class="btn-primary mt-4" style="width:fit-content;font-size:0.75rem;padding:0.5rem 1.1rem;">
            Read More
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </a>
        </div>
      </article>`;
  }

  /* ── Skeleton loader ── */
  function skeleton(count = 6) {
    const card = `
      <div class="article-card" aria-hidden="true" style="pointer-events:none;">
        <div style="aspect-ratio:16/10;background:linear-gradient(90deg,#f0ede8 25%,#e8e4df 50%,#f0ede8 75%);background-size:200% 100%;animation:shimmer 1.4s infinite;"></div>
        <div class="card-body">
          <div style="height:16px;background:#f0ede8;border-radius:4px;width:32%;margin-bottom:12px;animation:shimmer 1.4s infinite;"></div>
          <div style="height:22px;background:#f0ede8;border-radius:4px;width:92%;margin-bottom:6px;animation:shimmer 1.4s infinite;"></div>
          <div style="height:22px;background:#f0ede8;border-radius:4px;width:70%;margin-bottom:16px;animation:shimmer 1.4s infinite;"></div>
          <div style="height:14px;background:#f0ede8;border-radius:4px;width:50%;animation:shimmer 1.4s infinite;"></div>
        </div>
      </div>`;
    return Array(count).fill(card).join('');
  }

  /* ── Empty state ── */
  function emptyState(category) {
    return `
      <div style="grid-column:1/-1;padding:4rem 0;text-align:center;">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.25" style="margin:0 auto 1.25rem;opacity:0.25;display:block;">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10 9 9 9 8 9"/>
        </svg>
        <p style="font-family:'Playfair Display',serif;font-size:1.25rem;font-weight:600;color:var(--ink);margin-bottom:0.5rem;">
          No ${category} articles yet
        </p>
        <p style="font-size:0.875rem;color:var(--ink-muted);margin-bottom:1.5rem;">
          Check back soon — new stories are always on the way.
        </p>
        <a href="../../index.html" class="btn-primary" style="display:inline-flex;">
          Back to Home
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </a>
      </div>`;
  }

  /* ── Error state ── */
  function errorState() {
    return `
      <div style="grid-column:1/-1;padding:4rem 0;text-align:center;">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.25" style="margin:0 auto 1.25rem;opacity:0.25;display:block;">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <p style="font-size:1rem;font-weight:500;color:var(--ink);margin-bottom:0.4rem;">Couldn't load articles</p>
        <p style="font-size:0.8125rem;color:var(--ink-muted);margin-bottom:1.25rem;">Please refresh the page to try again.</p>
        <button onclick="location.reload()" class="btn-ghost">Retry</button>
      </div>`;
  }

  /* ── Update the <head> meta dynamically ── */
  function updateMeta(category, count, config) {
    const desc = config.desc;
    document.title = `${category} — Putera Gani`;
    document.querySelector('meta[name="description"]')?.setAttribute('content', desc);
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', `${category} — Putera Gani`);
    document.querySelector('meta[property="og:description"]')?.setAttribute('content', desc);
    document.querySelector('meta[name="twitter:title"]')?.setAttribute('content', `${category} — Putera Gani`);
    document.querySelector('meta[name="twitter:description"]')?.setAttribute('content', desc);

    // Update hero
    const heroTitle = document.getElementById('cat-hero-title');
    const heroDesc  = document.getElementById('cat-hero-desc');
    if (heroTitle) heroTitle.textContent = category;
    if (heroDesc)  heroDesc.textContent  = desc;

    // Update section label + count
    const sectionLabel = document.getElementById('cat-section-label');
    if (sectionLabel) {
      sectionLabel.textContent = count > 0
        ? `${category} · ${count} article${count !== 1 ? 's' : ''}`
        : `${category} Articles`;
    }
  }

  /* ── Render sidebar trending ── */
  function renderTrending(articles, prefix) {
    const list = document.getElementById('cat-trending-list');
    if (!list) return;
    const trending = articles.filter(a => a.trending).slice(0, 5);
    if (!trending.length) { list.closest('.trending-widget')?.remove(); return; }
    list.innerHTML = trending.map((a, i) => `
      <a href="${prefix}articles/${a.slug}/index.html" class="trending-item" style="text-decoration:none;">
        <span class="trending-num">${String(i+1).padStart(2,'0')}</span>
        <div>
          <div class="trending-title">${a.title}</div>
          <div style="font-size:0.7rem;color:var(--ink-muted);margin-top:3px;">${a.category} · ${a.readTime}</div>
        </div>
      </a>`).join('');
  }

  /* ── Render sidebar browse categories ── */
  function renderSidebarCategories(articles, prefix) {
    const wrap = document.getElementById('cat-sidebar-categories');
    if (!wrap) return;
    const cats = [...new Set(articles.map(a => a.category))].sort();
    const pageMap = { Technology:'technology.html', Design:'design.html', Science:'science.html', Culture:'culture.html' };
    wrap.innerHTML = cats.map(cat => {
      const s    = (CATEGORY_CONFIG[cat] || CATEGORY_CONFIG.Technology).style;
      const href = pageMap[cat]
        ? `${prefix}${pageMap[cat]}`
        : `${prefix}category/${cat.toLowerCase()}/index.html`;
      return `<a href="${href}" class="category-badge" style="text-decoration:none;background:${s.bg};color:${s.color};border-color:${s.border};">${cat}</a>`;
    }).join('');
  }

  /* ── Main init ── */
  async function init() {
    const main     = document.getElementById('category-page');
    const grid     = document.getElementById('cat-article-grid');
    const countEl  = document.getElementById('cat-article-count');
    if (!main || !grid) return;

    const category = main.dataset.category;
    if (!category) return;

    const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.Technology;
    const prefix = getPrefix();

    // Show skeleton immediately
    grid.innerHTML = skeleton(6);

    try {
      const res = await fetch(`${prefix}data/articles.json`, { cache: 'no-cache' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const all  = data.articles || [];

      // Filter + sort newest first
      const filtered = all
        .filter(a => a.category === category)
        .sort((a, b) => new Date(b.date) - new Date(a.date));

      // Update meta + hero + label
      updateMeta(category, filtered.length, config);

      // Article count badge
      if (countEl) countEl.textContent = filtered.length;

      // Render grid
      if (!filtered.length) {
        grid.innerHTML = emptyState(category);
      } else {
        grid.innerHTML = '';
        const observer = new IntersectionObserver((entries) => {
          entries.forEach((entry, i) => {
            if (entry.isIntersecting) {
              entry.target.style.animationDelay = `${i * 0.07}s`;
              entry.target.classList.add('animate-fade-up');
              observer.unobserve(entry.target);
            }
          });
        }, { threshold: 0.1 });

        filtered.forEach(article => {
          const div  = document.createElement('div');
          div.innerHTML = renderCard(article, prefix).trim();
          const card = div.firstChild;
          card.style.opacity = '0';
          grid.appendChild(card);
          observer.observe(card);
        });
      }

      // Sidebar
      renderTrending(all, prefix);
      renderSidebarCategories(all, prefix);

    } catch (err) {
      console.error('[CategoryEngine] Error:', err);
      grid.innerHTML = errorState();
    }
  }

  return { init };

})();

/* ── Shimmer keyframe (injected once) ── */
if (!document.getElementById('ce-shimmer')) {
  const s = document.createElement('style');
  s.id = 'ce-shimmer';
  s.textContent = '@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}';
  document.head.appendChild(s);
}

document.addEventListener('DOMContentLoaded', () => CategoryEngine.init());
