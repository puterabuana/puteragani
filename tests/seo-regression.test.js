const fs = require('fs');
const path = require('path');
const test = require('node:test');
const assert = require('node:assert/strict');

const ROOT = path.resolve(__dirname, '..');

function walkHtml(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) return walkHtml(file);
    return entry.isFile() && entry.name.endsWith('.html') ? [file] : [];
  });
}

function relative(file) {
  return path.relative(ROOT, file).replaceAll('\\', '/');
}

function productionPages() {
  return walkHtml(ROOT).filter((file) => {
    const rel = relative(file);
    return !rel.includes('/_TEMPLATE/') && !rel.includes('.bak/');
  });
}

function attribute(tag, name) {
  const match = tag.match(new RegExp(`\\b${name}=["']([^"']*)["']`, 'i'));
  return match ? match[1] : '';
}

test('production HTML uses clean internal links without .html redirects', () => {
  const failures = [];
  for (const file of productionPages()) {
    const html = fs.readFileSync(file, 'utf8');
    for (const tag of html.match(/<a\b[^>]*\bhref=["'][^"']+["'][^>]*>/gi) || []) {
      const href = attribute(tag, 'href');
      if (!/^(?:https?:|mailto:|tel:|javascript:|data:|#)/i.test(href) && /\.html(?:[?#]|$)/i.test(href)) {
        failures.push(`${relative(file)} -> ${href}`);
      }
    }
  }
  assert.deepEqual(failures, []);
});

test('Unsplash images use exact crops and responsive image candidates', () => {
  const failures = [];
  for (const file of productionPages()) {
    const html = fs.readFileSync(file, 'utf8');
    for (const tag of html.match(/<img\b[^>]*>/gi) || []) {
      const src = attribute(tag, 'src').replaceAll('&amp;', '&');
      if (!src.includes('images.unsplash.com')) continue;

      const width = Number(attribute(tag, 'width'));
      const height = Number(attribute(tag, 'height'));
      const url = new URL(src);
      const sourceWidth = Number(url.searchParams.get('w'));
      const sourceHeight = Number(url.searchParams.get('h'));

      if (!width || !height || sourceWidth !== width || sourceHeight !== height) {
        failures.push(`${relative(file)} -> dimensions do not match ${src}`);
      }
      if (!attribute(tag, 'srcset') || !attribute(tag, 'sizes')) {
        failures.push(`${relative(file)} -> missing srcset/sizes ${src}`);
      }
    }
  }
  assert.deepEqual(failures, []);
});

test('security headers, favicon compatibility, and heading structure are complete', () => {
  const headers = fs.readFileSync(path.join(ROOT, '_headers'), 'utf8');
  assert.match(headers, /Strict-Transport-Security:\s*max-age=\d+/i);
  assert.equal(fs.existsSync(path.join(ROOT, 'favicon.ico')), true);
  assert.equal(fs.existsSync(path.join(ROOT, 'apple-touch-icon.png')), true);

  for (const file of productionPages()) {
    const html = fs.readFileSync(file, 'utf8');
    assert.match(html, /<link\b[^>]*rel=["']icon["'][^>]*href=["']\/favicon\.ico["']/i, relative(file));
    assert.doesNotMatch(html, /<h[1-6]\b[^>]*>\s*<\/h[1-6]>/i, relative(file));
  }
});

test('local stylesheets load non-blocking with a no-script fallback', () => {
  for (const file of productionPages()) {
    const html = fs.readFileSync(file, 'utf8');
    const localStyles = html.match(/<link\b[^>]*href=["'][^"']*assets\/css\/(?:tailwind\.min|style)\.css["'][^>]*>/gi) || [];
    assert.equal(localStyles.length, 4, `${relative(file)} should contain preload and noscript links for both stylesheets`);
    for (const tag of localStyles.slice(0, 2)) {
      assert.match(tag, /\brel=["']preload["']/i, relative(file));
      assert.match(tag, /\bas=["']style["']/i, relative(file));
      assert.match(tag, /\bonload=/i, relative(file));
    }
  }
});
