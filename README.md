# Siddharth Kumar Portfolio

A responsive personal portfolio for Siddharth Kumar, Content Writer, Social Media Executive, and Growth Strategist.

## Highlights

- Interactive landing experience and portfolio profile
- Day and night modes with a star field and AstroMon companion
- Accessible keyboard navigation for the work-experience switcher
- Embedded, viewable, and downloadable PDF resume
- Mobile-responsive layout
- SEO-ready build support for canonical URLs, Open Graph tags, robots.txt, and sitemap.xml

## Run locally

```bash
npm install
npm run dev
```

Open the local address shown by Vite (normally `http://127.0.0.1:5173`).

## Create a production build

```bash
npm run build
```

The production-ready site is generated in the `dist` directory.

To add canonical and social-share URLs during deployment, provide the public domain:

```bash
SITE_URL=https://your-domain.example npm run build
```

On PowerShell:

```powershell
$env:SITE_URL="https://your-domain.example"
npm run build
```

## Publish with GitHub Pages

1. In the repository settings, open **Pages**.
2. Choose the deployment source appropriate for your workflow.
3. If deploying the generated files manually, upload the contents of `dist`.
4. Build with `SITE_URL` set to the final GitHub Pages or custom-domain URL.

## Main files

- `index.html` — interactive landing page
- `details.html` — portfolio, work history, and resume
- `styles.css` — responsive visual styles, night mode, and animations
- `script.js` — lightweight page interactions
- `public/Siddharth_Kumar_C.V_.pdf` — downloadable resume

## License

All portfolio content and personal assets are © Siddharth Kumar. Do not reuse without permission.
