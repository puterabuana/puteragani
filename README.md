# PuteraGani — Premium Article Website

A modern, premium editorial website built with HTML, Tailwind CSS (CDN), and minimal JavaScript.
Ready to deploy directly on GitHub Pages or Cloudflare Pages.

---

## 📁 Folder Structure

```
puteragani/
├── index.html                          ← Homepage
├── assets/
│   ├── css/
│   │   └── style.css                  ← All custom styles (fonts, animations, variables)
│   ├── js/
│   │   └── main.js                    ← Navbar scroll, mobile menu, animations
│   └── images/
│       ├── favicon.svg                ← Site favicon (SVG logo)
│       ├── og-cover.jpg               ← Open Graph preview image (add your own)
│       └── thumbnails/                ← Place article thumbnails here
│           └── (your images here)
└── articles/
    └── the-future-of-artificial-intelligence/
        ├── index.html                 ← Article Page 1
        ├── page-2.html                ← Article Page 2
        └── page-3.html                ← Article Page 3
```

---

## ➕ How to Add a New Article

### Step 1 — Create the Article Folder
```
articles/
└── your-article-slug/
    ├── index.html    ← Page 1
    ├── page-2.html   ← Page 2
    └── page-3.html   ← Page 3
```
Name the folder using a URL-friendly slug (lowercase, hyphens, no spaces).
Example: `articles/quantum-computing-explained/`

### Step 2 — Copy the Article Template
Copy the entire contents of:
`articles/the-future-of-artificial-intelligence/index.html`
into your new `index.html`.

Then update:
- `<title>` — your article title
- `<meta name="description">` — your article description
- `<h1>` — article title
- Hero `<img src="...">` — your thumbnail image
- Article body content inside `<div class="article-body">`
- Navigation links in the sidebar page list
- Related articles section

Repeat for `page-2.html` and `page-3.html`.

### Step 3 — Add a Card to the Homepage
In `index.html`, find the comment:
```html
<!-- ADD MORE ARTICLE CARDS HERE -->
```

Copy any existing `<article class="article-card">` block and paste it before that comment.
Update:
- `href` — path to your article (e.g., `articles/your-slug/index.html`)
- `img src` — thumbnail image URL or local path
- Category badge text and color
- Article title, description, date, and read time

---

## 🖼️ How to Add Thumbnails

### Using local images:
1. Place your image in `assets/images/thumbnails/`
   Example: `assets/images/thumbnails/quantum-computing.jpg`
2. Reference it in article cards as:
   ```html
   <img src="assets/images/thumbnails/quantum-computing.jpg" alt="..." />
   ```
3. From inside an article page (note the `../../` path):
   ```html
   <img src="../../assets/images/thumbnails/quantum-computing.jpg" alt="..." />
   ```

### Recommended image size:
- Thumbnails: **800×500px** minimum (16:10 ratio)
- Article headers: **1200×600px** minimum
- Format: `.jpg` or `.webp` for best performance

### Using Unsplash (free images):
```html
<img src="https://images.unsplash.com/photo-XXXXXXXXXX?w=800&q=75" alt="..." />
```
Replace `XXXXXXXXXX` with the photo ID from unsplash.com.

---

## 🎨 Customizing Colors & Typography

All design tokens are in `assets/css/style.css` under `:root`:

```css
:root {
  --ink:        #0f0f0f;    /* Primary text */
  --accent:     #c8973a;    /* Gold accent color */
  --paper:      #fafaf8;    /* Page background */
  --paper-warm: #f4f2ee;    /* Warm section backgrounds */
  /* ... more variables */
}
```

Change `--accent` to use a different brand color throughout the entire site.

**Fonts** are loaded from Google Fonts:
- `Playfair Display` — headings, titles (elegant serif)
- `DM Sans` — body text (clean sans-serif)
- `DM Mono` — numbers, labels (monospace)

To change fonts, edit the `@import` line at the top of `style.css`.

---

## 📂 Category Badge Colors

When adding a new article card, pick a category color scheme:

| Category    | Style attributes                                                                 |
|-------------|----------------------------------------------------------------------------------|
| Technology  | *(default gold — no extra style needed)*                                        |
| Design      | `style="background:#f0f7ff; color:#2563eb; border-color:rgba(37,99,235,0.2);"` |
| Science     | `style="background:#f0fdf4; color:#16a34a; border-color:rgba(22,163,74,0.2);"` |
| Culture     | `style="background:#fdf4ff; color:#9333ea; border-color:rgba(147,51,234,0.2);"` |
| Business    | `style="background:#fff7ed; color:#ea580c; border-color:rgba(234,88,12,0.2);"` |
| Health      | `style="background:#fef2f2; color:#dc2626; border-color:rgba(220,38,38,0.2);"` |

---

## 🚀 Deploying to Cloudflare Pages

1. Push this folder to a GitHub repository
2. Go to [Cloudflare Pages](https://pages.cloudflare.com/)
3. Click **Create a project** → **Connect to Git**
4. Select your repository
5. Build settings:
   - **Framework preset**: None
   - **Build command**: *(leave empty)*
   - **Build output directory**: `/` (root)
6. Click **Save and Deploy**

Your site will be live at `https://your-project.pages.dev`

### Custom Domain:
In Cloudflare Pages → your project → **Custom domains** → add `puteragani.com`

---

## 🚀 Deploying to GitHub Pages

1. Push to GitHub
2. Go to **Settings → Pages**
3. Source: **Deploy from branch** → `main` → `/ (root)`
4. Save — your site will be at `https://yourusername.github.io/puteragani/`

---

## ✅ SEO Checklist for Each Article

Edit these in every article's `<head>`:
```html
<title>Article Title — PuteraGani</title>
<meta name="description" content="150-160 character description." />
<meta property="og:title"       content="Article Title" />
<meta property="og:description" content="Article description." />
<meta property="og:image"       content="../../assets/images/thumbnails/your-image.jpg" />
<meta property="og:url"         content="https://puteragani.com/articles/your-slug/" />
```

---

## 📋 Quick Reference Checklist — New Article

- [ ] Created folder: `articles/your-slug/`
- [ ] Created `index.html`, `page-2.html`, `page-3.html`
- [ ] Updated all `<title>` and `<meta>` tags
- [ ] Replaced hero image URLs
- [ ] Filled in article body content
- [ ] Updated sidebar page navigation links
- [ ] Updated related articles section
- [ ] Added article card to homepage `index.html`
- [ ] Updated homepage featured section (if it's a featured article)
- [ ] Added thumbnail image to `assets/images/thumbnails/`

---

*Built with HTML · Tailwind CSS · Minimal JavaScript*
*PuteraGani © 2025*
