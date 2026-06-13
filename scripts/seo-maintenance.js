const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const SITE = 'https://puteragani.com';
const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=1200&q=80';
const LOGO = `${SITE}/assets/images/favicon.svg`;
const HOMEPAGE_HERO = {
  src: '/assets/images/homepage-hero-640.webp',
  srcset: [
    '/assets/images/homepage-hero-320.webp 320w',
    '/assets/images/homepage-hero-400.webp 400w',
    '/assets/images/homepage-hero-640.webp 640w'
  ].join(', '),
  sizes: '(max-width: 1023px) 100vw, 50vw'
};
const articlesFile = path.join(ROOT, 'data', 'articles.json');
const articleData = JSON.parse(fs.readFileSync(articlesFile, 'utf8'));
const articles = articleData.articles;
const articleBySlug = new Map(articles.map((article) => [article.slug, article]));

const categoryContent = {
  Technology: {
    summary: 'Technology changes quickly, but the questions underneath it are durable: who benefits, what becomes possible, and what new risks appear? This collection examines artificial intelligence, computing, software, hardware, and digital systems through practical explanations and long-form analysis.',
    focus: 'Explore emerging tools alongside the economic, cultural, and human consequences that determine whether an innovation becomes genuinely useful.'
  },
  Design: {
    summary: 'Design is more than visual polish. It shapes attention, trust, usability, and the way people understand products and ideas. These essays explore typography, visual systems, product design, motion, color, and the principles that make creative work clear and enduring.',
    focus: 'Read practical analysis of the choices behind memorable interfaces, objects, brands, and communication systems.'
  },
  Culture: {
    summary: 'Culture gives technology, cities, habits, and creative work their meaning. This collection looks at philosophy, storytelling, social behavior, identity, and the subtle forces that shape how people live together and interpret a changing world.',
    focus: 'The articles connect everyday experience with wider historical, psychological, and social patterns.'
  },
  Science: {
    summary: 'Scientific discovery changes both what humanity knows and what it can do. These articles explain developments in physics, biology, space, climate, genetics, and computation without losing sight of uncertainty, evidence, and real-world consequences.',
    focus: 'Use this collection to understand the ideas behind major discoveries and why they matter beyond the laboratory.'
  },
  Business: {
    summary: 'Modern business advantage increasingly comes from execution, judgment, and the ability to adapt. This collection covers strategy, pricing, operations, finance, leadership, entrepreneurship, and the changing economics of work and technology.',
    focus: 'The goal is practical clarity for builders and decision-makers navigating markets shaped by rapid technological change.'
  },
  Health: {
    summary: 'Health is shaped by biology, behavior, environment, and access to reliable information. These articles examine longevity, sleep, nutrition, inflammation, mental health, and wellness technology through an evidence-led editorial lens.',
    focus: 'The collection translates complex research into useful context while avoiding simplistic promises or one-size-fits-all advice.'
  }
};

const pageMetadata = {
  'index.html': {
    title: 'Putera Gani | Technology, Design, Culture & Science',
    description: 'Read independent, in-depth articles from Putera Gani about technology, design, culture, science, health, business, and ideas shaping the future.',
    canonical: `${SITE}/`,
    type: 'WebPage'
  },
  'about.html': {
    title: 'About Putera Gani | Independent Editorial Publisher',
    description: 'Meet Putera Buana Gani and discover the editorial mission behind Putera Gani, an independent publication covering technology, design, culture, and science.',
    canonical: `${SITE}/about`,
    type: 'AboutPage'
  },
  'contact.html': {
    title: 'Contact Putera Gani | Editorial Inquiries',
    description: 'Contact Putera Gani for editorial feedback, story ideas, professional collaboration, or questions about the independent publication and its articles.',
    canonical: `${SITE}/contact`,
    type: 'ContactPage'
  },
  'privacy-policy.html': {
    title: 'Privacy Policy and Data Use | Putera Gani',
    description: 'Learn how Putera Gani handles visitor data, cookies, advertising, analytics, and external services across this independent editorial website.',
    canonical: `${SITE}/privacy-policy`,
    type: 'WebPage'
  },
  'terms.html': {
    title: 'Terms of Service | Putera Gani',
    description: 'Review the terms governing access to Putera Gani articles, editorial content, intellectual property, external links, and use of this independent publication.',
    canonical: `${SITE}/terms`,
    type: 'WebPage'
  },
  'technology.html': categoryMetadata('Technology', 'artificial intelligence, computing, software, and digital innovation'),
  'design.html': categoryMetadata('Design', 'visual systems, typography, product design, and timeless creative principles'),
  'culture.html': categoryMetadata('Culture', 'society, cities, philosophy, creativity, and the ideas shaping modern life'),
  'science.html': categoryMetadata('Science', 'physics, biology, space, discovery, and research changing how we understand the world'),
  'business.html': categoryMetadata('Business', 'entrepreneurship, leadership, strategy, operations, and the future of work', '/category/business/'),
  'health.html': categoryMetadata('Health', 'wellness, longevity, mental health, nutrition, and evidence-based human performance', '/category/health/'),
  'category/business/index.html': categoryMetadata('Business', 'entrepreneurship, leadership, strategy, operations, and the future of work', '/category/business/'),
  'category/health/index.html': categoryMetadata('Health', 'wellness, longevity, mental health, nutrition, and evidence-based human performance', '/category/health/')
};

function categoryMetadata(name, topics, customPath) {
  const urlPath = customPath || `/${name.toLowerCase()}`;
  return {
    title: `${name} Articles & Insights | Putera Gani`,
    description: seoDescription(`Read ${name.toLowerCase()} articles from Putera Gani about ${topics}, presented with clarity, depth, and an independent editorial perspective.`),
    canonical: `${SITE}${urlPath}`,
    type: 'CollectionPage',
    category: name
  };
}

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(file);
    return entry.isFile() && entry.name.endsWith('.html') ? [file] : [];
  });
}

function relative(file) {
  return path.relative(ROOT, file).replaceAll('\\', '/');
}

function cleanText(value) {
  return String(value || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&mdash;|&#8212;/g, '—')
    .replace(/&ndash;|&#8211;/g, '–')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function trimAtWord(value, max) {
  if (value.length <= max) return value;
  const cut = value.slice(0, max + 1);
  const boundary = cut.lastIndexOf(' ');
  return `${cut.slice(0, boundary > 35 ? boundary : max).replace(/[,:;—–-]+$/, '')}…`;
}

function seoTitle(headline, pageNumber) {
  let core = cleanText(headline);
  if (pageNumber > 1) {
    core = core.replace(/^.*?(?:page|part)\s*[23]\s*[:—–-]\s*/i, '');
    if (core.length > 52) core = trimAtWord(core, 52);
    if (!core || core.length < 24) core = `${trimAtWord(cleanText(headline), 43)} – Part ${pageNumber}`;
  }

  if (pageNumber > 1) {
    const suffix = ` - Part ${pageNumber}`;
    core = core.replace(/\s+(?:\S+\s+)?Part\s+[23]$/i, '');
    core = `${trimAtWord(core, 60 - suffix.length)}${suffix}`;
  }

  if (pageNumber === 1 && core.length > 60 && core.includes(':')) {
    const lead = core.split(':')[0].trim();
    if (lead.length >= 18) core = lead;
  }
  if (core.length > 60) core = trimAtWord(core, 59);
  if (core.length < 38 && `${core} | Putera Gani`.length <= 60) core = `${core} | Putera Gani`;
  return core;
}

function firstContentParagraph(html) {
  const marker = html.search(/ARTICLE CONTENT/i);
  const body = marker >= 0 ? html.slice(marker) : html;
  const matches = [...body.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)];
  for (const match of matches) {
    const text = cleanText(match[1]);
    if (text.length >= 100) return text;
  }
  return '';
}

function seoDescription(primary, fallback) {
  let text = cleanText(primary);
  const extra = cleanText(fallback);
  if (text.length < 120 && extra) text = `${text} ${extra}`.trim();
  if (text.length > 160) {
    const cut = text.slice(0, 157);
    const boundary = cut.lastIndexOf(' ');
    text = `${cut.slice(0, boundary > 115 ? boundary : 157).replace(/[,:;—–-]+$/, '')}…`;
  }
  return text;
}

function getTagContent(html, selector) {
  const match = html.match(selector);
  return match ? cleanText(match[1]) : '';
}

function removeManagedHead(html) {
  return html
    .replace(/\s*<!-- SEO-ENHANCEMENT:START -->[\s\S]*?<!-- SEO-ENHANCEMENT:END -->\s*/g, '\n')
    .replace(/\s*<link\b[^>]*\brel\s*=\s*["']canonical["'][^>]*\/?>/gi, '')
    .replace(/\s*<meta\b[^>]*\bname\s*=\s*["']description["'][^>]*\/?>/gi, '')
    .replace(/\s*<meta\b[^>]*\bname\s*=\s*["']author["'][^>]*\/?>/gi, '')
    .replace(/\s*<meta\b[^>]*\bproperty\s*=\s*["'](?:og:type|og:url|og:title|og:description|og:image|article:published_time|article:modified_time|article:author|article:section|article:tag)["'][^>]*\/?>/gi, '')
    .replace(/\s*<meta\b[^>]*\bname\s*=\s*["'](?:twitter:card|twitter:title|twitter:description|twitter:image)["'][^>]*\/?>/gi, '')
    .replace(/\s*<link\b[^>]*\brel\s*=\s*["'](?:prev|next)["'][^>]*\/?>/gi, '');
}

function replaceRuntimeTailwind(html, rel) {
  const depth = rel.split('/').length - 1;
  const prefix = depth ? '../'.repeat(depth) : '';
  const tailwind = `${prefix}assets/css/tailwind.min.css`;
  const custom = `${prefix}assets/css/style.css`;
  const stylesheetBlock = [
    '<!-- Critical local styles: block first paint to prevent layout shifts -->',
    `<link rel="stylesheet" href="${tailwind}" />`,
    `<link rel="stylesheet" href="${custom}" />`
  ].join('\n');
  html = html
    .replace(/\s*<script\b[^>]*src=["']https:\/\/cdn\.tailwindcss\.com["'][^>]*><\/script>\s*/gi, '\n')
    .replace(/\s*<script>\s*tailwind\.config\s*=[\s\S]*?<\/script>\s*/gi, '\n')
    .replace(/\s*<!-- Non-blocking local styles -->[\s\S]*?<\/noscript>\s*/gi, '\n')
    .replace(/\s*<!-- Critical local styles: block first paint to prevent layout shifts -->\s*/gi, '\n')
    .replace(/\s*<noscript>\s*<link\b[^>]*assets\/css\/(?:tailwind\.min|style)\.css[^>]*>\s*(?:<link\b[^>]*assets\/css\/(?:tailwind\.min|style)\.css[^>]*>\s*)?<\/noscript>\s*/gi, '\n')
    .replace(/\s*<link\b[^>]*href=["'][^"']*assets\/css\/(?:tailwind\.min|style)\.css["'][^>]*>\s*/gi, '\n')
    .replace(/<!--\s*Tailwind CSS \(CDN\)\s*-->/gi, '<!-- Compiled Tailwind CSS -->')
    .replace(/<!--\s*Tailwind CSS\s*-->/gi, '<!-- Compiled Tailwind CSS -->');
  return html.replace('</head>', `${stylesheetBlock}\n</head>`);
}

function replaceTitle(html, title) {
  return html.replace(/<title\b[^>]*>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`);
}

function isoDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toISOString();
}

function normalizeArticleDates() {
  let changed = false;
  for (const article of articles) {
    if (article.date && !String(article.date).includes('T')) {
      const time = article.time || '00:00';
      article.date = `${article.date}T${time}:00+07:00`;
      changed = true;
    }
    if ('time' in article) {
      delete article.time;
      changed = true;
    }
  }
  if (changed) {
    fs.writeFileSync(articlesFile, `${JSON.stringify(articleData, null, 2)}\n`);
  }
}

function optimizeUnsplashImage(value, width, height, quality) {
  if (!value || !value.includes('images.unsplash.com')) return value;
  const imageUrl = new URL(value.replaceAll('&amp;', '&'));
  imageUrl.searchParams.set('w', String(width));
  imageUrl.searchParams.set('h', String(height));
  imageUrl.searchParams.set('q', String(quality));
  imageUrl.searchParams.set('auto', 'format');
  imageUrl.searchParams.set('fit', 'crop');
  return imageUrl.toString();
}

function normalizeArticleImages() {
  let changed = false;
  for (const article of articles) {
    const image = optimizeUnsplashImage(article.image, 600, 375, 62);
    const imageLarge = optimizeUnsplashImage(article.imageLarge || article.image, 800, 500, 62);
    if (image !== article.image) {
      article.image = image;
      changed = true;
    }
    if (imageLarge !== article.imageLarge) {
      article.imageLarge = imageLarge;
      changed = true;
    }
  }
  if (changed) {
    fs.writeFileSync(articlesFile, `${JSON.stringify(articleData, null, 2)}\n`);
  }
}

function setTagAttribute(tag, name, value) {
  const pattern = new RegExp(`\\s+${name}=["'][^"']*["']`, 'i');
  const next = tag.replace(pattern, '');
  return next.replace(/\s*\/?>$/, (ending) => ` ${name}="${escapeHtml(value)}"${ending}`);
}

function responsiveWidths(width) {
  const candidates = width >= 1000
    ? [320, 400, 480, 640, 768, 960, width]
    : width >= 600
      ? [320, 400, 480, 640, width]
      : [Math.min(240, width), 320, 400, width];
  return [...new Set(candidates.filter((candidate) => candidate > 0 && candidate <= width))];
}

function imageSizes(tag, width) {
  if (/\barticle-header-img\b/i.test(tag)) return '(max-width: 768px) 100vw, 896px';
  if (/\bfetchpriority=["']high["']/i.test(tag)) return '(max-width: 1023px) 100vw, 50vw';
  if (width <= 600) return '(max-width: 639px) 100vw, (max-width: 1279px) 50vw, 33vw';
  return `(max-width: ${width}px) 100vw, ${width}px`;
}

function enhanceResponsiveImages(html) {
  return html.replace(/<img\b[^>]*>/gi, (tag) => {
    const srcMatch = tag.match(/\bsrc=["']([^"']+)["']/i);
    const widthMatch = tag.match(/\bwidth=["'](\d+)["']/i);
    const heightMatch = tag.match(/\bheight=["'](\d+)["']/i);
    if (!srcMatch || !widthMatch || !heightMatch || !srcMatch[1].includes('images.unsplash.com')) return tag;

    const width = Number(widthMatch[1]);
    const height = Number(heightMatch[1]);
    const ratio = height / width;
    const qualityMatch = srcMatch[1].replaceAll('&amp;', '&').match(/[?&]q=(\d+)/);
    const quality = qualityMatch ? Number(qualityMatch[1]) : 70;
    const src = optimizeUnsplashImage(srcMatch[1], width, height, quality);
    const srcset = responsiveWidths(width)
      .map((candidateWidth) => {
        const candidateHeight = Math.max(1, Math.round(candidateWidth * ratio));
        return `${optimizeUnsplashImage(src, candidateWidth, candidateHeight, quality)} ${candidateWidth}w`;
      })
      .join(', ');

    let next = setTagAttribute(tag, 'src', src);
    next = setTagAttribute(next, 'srcset', srcset);
    next = setTagAttribute(next, 'sizes', imageSizes(tag, width));
    return next;
  });
}

function normalizeFavicons(html) {
  const block = [
    '<!-- Favicon -->',
    '<link rel="icon" href="/favicon.ico" sizes="any" />',
    '<link rel="icon" type="image/svg+xml" href="/assets/images/favicon.svg" />',
    '<link rel="apple-touch-icon" href="/apple-touch-icon.png" />'
  ].join('\n');
  return html
    .replace(/\s*<!-- Favicon -->\s*/gi, '\n')
    .replace(/\s*<link\b(?=[^>]*\brel=["'][^"']*(?:icon|apple-touch-icon)[^"']*["'])[^>]*>\s*/gi, '\n')
    .replace('</head>', `${block}\n</head>`);
}

function cleanInternalHref(href, rel) {
  if (!href || /^(?:https?:|mailto:|tel:|javascript:|data:|#|\/\/)/i.test(href)) return href;
  const match = href.match(/^([^?#]*)(.*)$/);
  const pathname = match ? match[1] : href;
  const suffix = match ? match[2] : '';
  if (!/\.html$/i.test(pathname)) return href;

  const baseDir = path.posix.dirname(`/${rel}`);
  const resolved = pathname.startsWith('/')
    ? path.posix.normalize(pathname)
    : path.posix.normalize(path.posix.join(baseDir, pathname));
  const targetRel = resolved.replace(/^\/+/, '');
  const metadata = pageMetadata[targetRel];
  let cleanPath;

  if (metadata) {
    cleanPath = new URL(metadata.canonical).pathname;
  } else if (/\/index\.html$/i.test(resolved)) {
    cleanPath = resolved.replace(/index\.html$/i, '');
  } else {
    cleanPath = resolved.replace(/\.html$/i, '');
  }

  return `${cleanPath || '/'}${suffix}`;
}

function normalizeInternalLinks(html, rel) {
  return html.replace(/<a\b[^>]*>/gi, (tag) => {
    const hrefMatch = tag.match(/\bhref=["']([^"']*)["']/i);
    if (!hrefMatch) return tag;
    const cleanHref = cleanInternalHref(hrefMatch[1], rel);
    return cleanHref === hrefMatch[1] ? tag : setTagAttribute(tag, 'href', cleanHref);
  });
}

function gitModified(file, fallback) {
  try {
    const value = execFileSync('git', ['log', '-1', '--format=%cI', '--', file], {
      cwd: ROOT,
      encoding: 'utf8'
    }).trim();
    return value || fallback;
  } catch {
    return fallback;
  }
}

function baseEntities() {
  return {
    organization: {
      '@type': 'Organization',
      '@id': `${SITE}/#organization`,
      name: 'Putera Gani',
      url: `${SITE}/`,
      logo: { '@type': 'ImageObject', url: LOGO },
      founder: { '@id': `${SITE}/about#putera-buana-gani` },
      sameAs: [
        'https://www.instagram.com/puterabuana',
        'https://www.linkedin.com/in/puterabuana/'
      ]
    },
    person: {
      '@type': 'Person',
      '@id': `${SITE}/about#putera-buana-gani`,
      name: 'Putera Buana Gani',
      alternateName: 'Putera Gani',
      url: `${SITE}/about`,
      worksFor: { '@id': `${SITE}/#organization` },
      sameAs: [
        'https://www.instagram.com/puterabuana',
        'https://www.linkedin.com/in/puterabuana/'
      ]
    },
    website: {
      '@type': 'WebSite',
      '@id': `${SITE}/#website`,
      url: `${SITE}/`,
      name: 'Putera Gani',
      description: pageMetadata['index.html'].description,
      publisher: { '@id': `${SITE}/#organization` },
      inLanguage: 'en'
    }
  };
}

function breadcrumb(items) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  };
}

function jsonLd(value) {
  return JSON.stringify(value, null, 2).replace(/</g, '\\u003c');
}

function managedBlock({ title, description, canonical, image, schema, article, pageNumber }) {
  const fontUrl = 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&amp;family=DM+Sans:wght@400;500;600&amp;family=DM+Mono:wght@500&amp;display=swap';
  const lines = [
    '<!-- SEO-ENHANCEMENT:START -->',
    '<link rel="preconnect" href="https://fonts.googleapis.com" />',
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />',
    `<link rel="preload" as="style" href="${fontUrl}" />`,
    `<link rel="stylesheet" href="${fontUrl}" media="print" onload="this.media='all'" />`,
    `<noscript><link rel="stylesheet" href="${fontUrl}" /></noscript>`,
    `<meta name="description" content="${escapeHtml(description)}" />`,
    '<meta name="author" content="Putera Buana Gani" />',
    `<link rel="canonical" href="${canonical}" />`,
    `<meta property="og:type" content="${article ? 'article' : 'website'}" />`,
    `<meta property="og:url" content="${canonical}" />`,
    `<meta property="og:title" content="${escapeHtml(title)}" />`,
    `<meta property="og:description" content="${escapeHtml(description)}" />`,
    `<meta property="og:image" content="${image}" />`,
    '<meta name="twitter:card" content="summary_large_image" />',
    `<meta name="twitter:title" content="${escapeHtml(title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(description)}" />`,
    `<meta name="twitter:image" content="${image}" />`
  ];

  if (article) {
    lines.push(
      `<meta property="article:published_time" content="${article.datePublished}" />`,
      `<meta property="article:modified_time" content="${article.dateModified}" />`,
      `<meta property="article:author" content="${SITE}/about#putera-buana-gani" />`,
      `<meta property="article:section" content="${escapeHtml(article.category)}" />`
    );
    for (const tag of article.tags) {
      lines.push(`<meta property="article:tag" content="${escapeHtml(tag)}" />`);
    }
    if (pageNumber > 1) {
      lines.push(`<link rel="prev" href="${pageNumber === 2 ? article.baseUrl : `${article.baseUrl}page-2`}" />`);
    }
    if (pageNumber < 3) {
      lines.push(`<link rel="next" href="${article.baseUrl}page-${pageNumber + 1}" />`);
    }
  }

  lines.push(
    '<script type="application/ld+json">',
    jsonLd(schema),
    '</script>',
    '<!-- SEO-ENHANCEMENT:END -->'
  );
  return lines.join('\n');
}

function articleSchema({ article, canonical, title, description, image, dateModified, pageNumber, wordCount }) {
  const entities = baseEntities();
  const pageName = pageNumber === 1 ? article.title : title;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      entities.organization,
      entities.person,
      entities.website,
      {
        '@type': 'BlogPosting',
        '@id': `${canonical}#article`,
        headline: pageName,
        description,
        image: [image],
        datePublished: isoDate(article.date),
        dateModified: isoDate(dateModified),
        author: { '@id': `${SITE}/about#putera-buana-gani` },
        publisher: { '@id': `${SITE}/#organization` },
        mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
        isPartOf: { '@id': `${SITE}/#website` },
        articleSection: article.category,
        keywords: article.tags.join(', '),
        wordCount,
        inLanguage: 'en'
      },
      {
        '@type': 'WebPage',
        '@id': canonical,
        url: canonical,
        name: title,
        description,
        isPartOf: { '@id': `${SITE}/#website` },
        primaryImageOfPage: { '@type': 'ImageObject', url: image },
        breadcrumb: { '@id': `${canonical}#breadcrumb` },
        inLanguage: 'en'
      },
      {
        ...breadcrumb([
          { name: 'Home', url: `${SITE}/` },
          { name: article.category, url: categoryUrl(article.category) },
          { name: pageNumber === 1 ? article.title : `${article.title} – Part ${pageNumber}`, url: canonical }
        ]),
        '@id': `${canonical}#breadcrumb`
      }
    ]
  };
}

function categoryUrl(category) {
  const lower = category.toLowerCase();
  if (lower === 'business' || lower === 'health') return `${SITE}/category/${lower}/`;
  return `${SITE}/${lower}`;
}

function standardSchema(meta) {
  const entities = baseEntities();
  const graph = [entities.organization, entities.person, entities.website];
  graph.push({
    '@type': meta.type,
    '@id': meta.canonical,
    url: meta.canonical,
    name: meta.title,
    description: meta.description,
    isPartOf: { '@id': `${SITE}/#website` },
    about: meta.category ? { '@type': 'Thing', name: meta.category } : undefined,
    breadcrumb: meta.canonical === `${SITE}/` ? undefined : { '@id': `${meta.canonical}#breadcrumb` },
    inLanguage: 'en'
  });
  if (meta.canonical !== `${SITE}/`) {
    graph.push({
      ...breadcrumb([
        { name: 'Home', url: `${SITE}/` },
        { name: meta.category || meta.title.split('|')[0].trim(), url: meta.canonical }
      ]),
      '@id': `${meta.canonical}#breadcrumb`
    });
  }
  return { '@context': 'https://schema.org', '@graph': graph };
}

function processArticle(file, rel) {
  const parts = rel.split('/');
  const slug = parts[1];
  const article = articleBySlug.get(slug);
  if (!article) return;

  const pageFile = parts[2];
  const pageNumber = pageFile === 'page-2.html' ? 2 : pageFile === 'page-3.html' ? 3 : 1;
  let html = fs.readFileSync(file, 'utf8');
  const h1 = getTagContent(html, /<h1\b[^>]*>([\s\S]*?)<\/h1>/i) || article.title;
  const title = seoTitle(h1, pageNumber);
  const paragraph = firstContentParagraph(html);
  const description = seoDescription(pageNumber === 1 ? article.excerpt : paragraph, article.content);
  const baseUrl = `${SITE}/articles/${slug}/`;
  const canonical = pageNumber === 1 ? baseUrl : `${baseUrl}page-${pageNumber}`;
  const existingImage = (html.match(/<meta\b[^>]*property=["']og:image["'][^>]*content=["']([^"']+)/i) || [])[1];
  const sourceImage = existingImage && /^https:\/\//.test(existingImage) ? existingImage : (article.imageLarge || article.image || DEFAULT_IMAGE);
  const image = sourceImage.replace(/([?&])w=\d+/, '$1w=1200');
  const published = isoDate(article.date);
  const modified = gitModified(rel, published);
  const wordCount = cleanText(html).split(/\s+/).filter(Boolean).length;
  const schema = articleSchema({ article, canonical, title, description, image, dateModified: modified, pageNumber, wordCount });

  html = replaceRuntimeTailwind(removeManagedHead(html), rel);
  html = replaceTitle(html, title);
  html = html.replace('</head>', `${managedBlock({
    title,
    description,
    canonical,
    image,
    schema,
    pageNumber,
    article: {
      datePublished: published,
      dateModified: isoDate(modified),
      category: article.category,
      tags: article.tags,
      baseUrl
    }
  })}\n</head>`);

  html = html.replace(/<img\b([^>]*class=["'][^"']*article-header-img[^"']*["'][^>]*)>/i, (tag, attrs) => {
    let next = attrs;
    if (!/\bwidth\s*=/.test(next)) next += ' width="1200"';
    if (!/\bheight\s*=/.test(next)) next += ' height="675"';
    if (!/\bfetchpriority\s*=/.test(next)) next += ' fetchpriority="high"';
    return `<img${next}>`;
  });
  html = renderStaticRelatedLinks(html, article);
  html = enhanceResponsiveImages(html);
  html = normalizeFavicons(html);
  html = normalizeInternalLinks(html, rel);
  fs.writeFileSync(file, html);
}

function processStandardPage(file, rel) {
  const meta = pageMetadata[rel];
  if (!meta) return;
  let html = fs.readFileSync(file, 'utf8');
  const imageMatch = html.match(/<meta\b[^>]*property=["']og:image["'][^>]*content=["']([^"']+)/i);
  const candidate = imageMatch ? imageMatch[1].replace(/^(?:\.\.\/)+(?=https?:)/, '') : '';
  const image = /^https:\/\//.test(candidate) ? candidate : DEFAULT_IMAGE;
  const schema = standardSchema(meta);
  html = replaceRuntimeTailwind(removeManagedHead(html), rel);
  html = replaceTitle(html, meta.title);
  html = html.replace('</head>', `${managedBlock({
    title: meta.title,
    description: meta.description,
    canonical: meta.canonical,
    image,
    schema
  })}\n</head>`);
  if (meta.category) {
    html = renderCategoryFallback(html, rel, meta.category);
  }
  html = enhanceResponsiveImages(html);
  html = normalizeFavicons(html);
  html = normalizeInternalLinks(html, rel);
  fs.writeFileSync(file, html);
}

function pickRelated(article, count = 3) {
  const sameCategory = articles.filter((candidate) => (
    candidate.slug !== article.slug && candidate.category === article.category
  ));
  const others = articles.filter((candidate) => (
    candidate.slug !== article.slug && candidate.category !== article.category
  ));
  return [...sameCategory, ...others].slice(0, count);
}

function relatedLinksBlock(article) {
  const links = pickRelated(article).map((related) => (
    `<a href="../../articles/${related.slug}/index.html" class="related-static-link">` +
      `<span>${escapeHtml(related.category)}</span>` +
      `<strong>${escapeHtml(related.title)}</strong>` +
    '</a>'
  )).join('\n');
  return `<!-- SEO-RELATED-LINKS:START -->\n${links}\n<!-- SEO-RELATED-LINKS:END -->`;
}

function renderStaticRelatedLinks(html, article) {
  const block = relatedLinksBlock(article);
  return replaceDivContentsById(html, 'related-articles', block);
}

function categoryArticleCard(article, prefix) {
  const url = `${prefix}articles/${article.slug}/index.html`;
  return `<article class="article-card" data-id="${escapeHtml(article.id)}" data-category="${escapeHtml(article.category)}">
    <a href="${url}" style="text-decoration:none;" aria-label="Read: ${escapeHtml(article.title)}">
      <div class="card-thumb">
        <img src="${escapeHtml(optimizeUnsplashImage(article.image, 480, 300, 62))}" alt="${escapeHtml(article.title)}" loading="lazy" width="480" height="300" />
        <div class="card-thumb-overlay"></div>
      </div>
    </a>
    <div class="card-body">
      <span class="category-badge">${escapeHtml(article.category)}</span>
      <h2 class="card-title"><a href="${url}" style="text-decoration:none;color:inherit;">${escapeHtml(article.title)}</a></h2>
      <p class="card-desc">${escapeHtml(article.excerpt)}</p>
      <a href="${url}" class="btn-primary mt-4" aria-label="Read more: ${escapeHtml(article.title)}" style="width:fit-content;font-size:0.75rem;padding:0.5rem 1.1rem;">Read More<span class="sr-only">: ${escapeHtml(article.title)}</span></a>
    </div>
  </article>`;
}

function replaceDivContentsById(html, id, content) {
  const openingPattern = new RegExp(`<div\\b[^>]*id=["']${id}["'][^>]*>`, 'i');
  const opening = openingPattern.exec(html);
  if (!opening) return html;

  const contentStart = opening.index + opening[0].length;
  const tagPattern = /<\/?div\b[^>]*>/gi;
  tagPattern.lastIndex = contentStart;
  let depth = 1;
  let tag;

  while ((tag = tagPattern.exec(html))) {
    depth += /^<div\b/i.test(tag[0]) ? 1 : -1;
    if (depth === 0) {
      return `${html.slice(0, contentStart)}\n${content}\n${html.slice(tag.index)}`;
    }
  }
  return html;
}

function categoryIntroBlock(category) {
  const content = categoryContent[category];
  return `<!-- SEO-CATEGORY-INTRO:START -->
<section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12" aria-label="About ${escapeHtml(category)}">
  <div class="rounded-2xl p-6 sm:p-8" style="background:#fff;border:1px solid var(--rule);">
    <div class="section-label mb-4">About this collection</div>
    <div class="grid md:grid-cols-2 gap-5" style="color:var(--ink-soft);line-height:1.8;">
      <p>${escapeHtml(content.summary)}</p>
      <p>${escapeHtml(content.focus)}</p>
    </div>
  </div>
</section>
<!-- SEO-CATEGORY-INTRO:END -->`;
}

function renderCategoryFallback(html, rel, category) {
  const prefix = rel.startsWith('category/') ? '../../' : '';
  const categoryArticles = articles
    .filter((article) => article.category === category)
    .slice(0, 9);
  const cards = `<!-- SEO-CATEGORY-CARDS:START -->\n${categoryArticles
    .map((article) => categoryArticleCard(article, prefix))
    .join('\n')}\n<!-- SEO-CATEGORY-CARDS:END -->`;
  const intro = categoryIntroBlock(category);

  if (/<!-- SEO-CATEGORY-INTRO:START -->[\s\S]*?<!-- SEO-CATEGORY-INTRO:END -->/.test(html)) {
    html = html.replace(/<!-- SEO-CATEGORY-INTRO:START -->[\s\S]*?<!-- SEO-CATEGORY-INTRO:END -->/, intro);
  } else {
    html = html.replace(/(<main\b[^>]*id=["']category-page["'])/i, `${intro}\n$1`);
  }

  return replaceDivContentsById(html, 'cat-article-grid', cards);
}

function processExcluded(file, rel) {
  let html = fs.readFileSync(file, 'utf8');
  html = replaceRuntimeTailwind(html, rel);
  if (rel === '404.html') {
    html = enhanceResponsiveImages(html);
    html = normalizeFavicons(html);
    html = normalizeInternalLinks(html, rel);
    fs.writeFileSync(file, html);
    return;
  }
  html = html.replace(/<meta\b[^>]*name=["']robots["'][^>]*>/i, '<meta name="robots" content="noindex, nofollow" />');
  if (!/<meta\b[^>]*name=["']robots["']/i.test(html)) {
    html = html.replace('</title>', '</title>\n  <meta name="robots" content="noindex, nofollow" />');
  }
  html = enhanceResponsiveImages(html);
  html = normalizeFavicons(html);
  html = normalizeInternalLinks(html, rel);
  fs.writeFileSync(file, html);
}

function articleCard(article) {
  const url = `articles/${article.slug}/index.html`;
  return `<article class="article-card" data-id="${escapeHtml(article.id)}" data-category="${escapeHtml(article.category)}">
    <a href="${url}" style="text-decoration:none;" aria-label="Read: ${escapeHtml(article.title)}">
      <div class="card-thumb">
        <img src="${escapeHtml(optimizeUnsplashImage(article.image, 480, 300, 62))}" alt="${escapeHtml(article.title)}" loading="lazy" width="480" height="300" />
        <div class="card-thumb-overlay"></div>
      </div>
    </a>
    <div class="card-body">
      <span class="category-badge">${escapeHtml(article.category)}</span>
      <h2 class="card-title"><a href="${url}" style="text-decoration:none; color:inherit;">${escapeHtml(article.title)}</a></h2>
      <p class="card-desc">${escapeHtml(article.excerpt)}</p>
      <a href="${url}" class="btn-primary mt-4" aria-label="Read more: ${escapeHtml(article.title)}" style="width:fit-content; font-size:0.75rem; padding:0.5rem 1.1rem;">Read More<span class="sr-only">: ${escapeHtml(article.title)}</span></a>
    </div>
  </article>`;
}

function renderHomepageFallback() {
  const file = path.join(ROOT, 'index.html');
  let html = fs.readFileSync(file, 'utf8');
  const featured = articles[0];
  const featureUrl = `articles/${featured.slug}/index.html`;
  const hero = `<section class="hero-gradient" id="featured-section" aria-label="Featured Story">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
      <div class="grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <div class="hero-tag mb-5">Featured Story</div>
          <h2 class="font-display text-white mb-5 leading-tight" style="font-size:clamp(2rem,4vw,3rem); font-weight:700; letter-spacing:-0.02em;">${escapeHtml(featured.title)}</h2>
          <p class="text-base mb-8" style="color:rgba(255,255,255,0.65); line-height:1.75; max-width:520px;">${escapeHtml(featured.excerpt)}</p>
          <a href="${featureUrl}" class="btn-accent">Read Story</a>
        </div>
        <div class="hero-img-wrap" style="height:420px;">
          <img src="${HOMEPAGE_HERO.src}" srcset="${HOMEPAGE_HERO.srcset}" sizes="${HOMEPAGE_HERO.sizes}" alt="${escapeHtml(featured.title)}" loading="eager" width="640" height="400" fetchpriority="high" decoding="async" />
          <div class="hero-img-overlay"></div>
        </div>
      </div>
    </div>
  </section>`;
  html = html.replace(/<section class="hero-gradient" id="featured-section"[\s\S]*?<\/section>/i, hero);
  html = html
    .replace(/\s*<link\b[^>]*data-homepage-hero-preload[^>]*>\s*/gi, '\n')
    .replace(
      '</head>',
      `<link rel="preload" as="image" href="${HOMEPAGE_HERO.src}" imagesrcset="${HOMEPAGE_HERO.srcset}" imagesizes="${HOMEPAGE_HERO.sizes}" fetchpriority="high" data-homepage-hero-preload />\n</head>`
    );
  if (!/id="site-purpose-heading"/.test(html)) {
    html = html.replace(
      '<div id="homepage-content">',
      '<div id="homepage-content">\n  <h1 id="site-purpose-heading" class="sr-only">Putera Gani: Independent Articles on Technology, Design, Culture and Science</h1>'
    );
  }
  const cards = articles.slice(1, 7).map(articleCard).join('\n');
  html = html.replace(/(<div id="article-grid"[^>]*>)[\s\S]*?(<\/div>\s*\n\s*<!-- Load More)/i, `$1\n${cards}\n        $2`);
  html = enhanceResponsiveImages(html);
  html = normalizeFavicons(html);
  html = normalizeInternalLinks(html, 'index.html');
  fs.writeFileSync(file, html);
}

function sitemapEntries() {
  const entries = [];
  for (const [rel, meta] of Object.entries(pageMetadata)) {
    if (rel === 'business.html' || rel === 'health.html') continue;
    entries.push({ loc: meta.canonical, lastmod: gitModified(rel, '2026-06-09').slice(0, 10) });
  }
  for (const article of articles) {
    const date = isoDate(article.date).slice(0, 10);
    const base = `${SITE}/articles/${article.slug}/`;
    entries.push({ loc: base, lastmod: date });
    entries.push({ loc: `${base}page-2`, lastmod: date });
    entries.push({ loc: `${base}page-3`, lastmod: date });
  }
  return [...new Map(entries.map((entry) => [entry.loc, entry])).values()];
}

function writeSitemap() {
  const entries = sitemapEntries();
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.map((entry) => `  <url>\n    <loc>${entry.loc}</loc>\n    <lastmod>${entry.lastmod}</lastmod>\n  </url>`).join('\n')}\n</urlset>\n`;
  fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), xml);
  return entries.length;
}

normalizeArticleDates();
normalizeArticleImages();
const files = walk(ROOT);
for (const file of files) {
  const rel = relative(file);
  if (rel === '404.html' || rel.includes('/_TEMPLATE/') || rel.includes('.bak/')) {
    processExcluded(file, rel);
  } else if (rel.startsWith('articles/')) {
    processArticle(file, rel);
  } else {
    processStandardPage(file, rel);
  }
}

renderHomepageFallback();
const sitemapCount = writeSitemap();
console.log(`SEO maintenance complete: ${articles.length} articles, ${sitemapCount} sitemap URLs.`);
