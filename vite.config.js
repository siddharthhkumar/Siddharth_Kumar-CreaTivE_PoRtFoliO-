import { resolve } from "path"
import { defineConfig } from "vite"

// Relative base: the built site works from any path (a custom domain, a GitHub Pages project page, a preview
// folder) without knowing the final URL. It replaces the base that came from the original repository's name.
//
// Search metadata that needs the real address is produced at build time, only when it is known:
//
//   SITE_URL=https://your-domain.example npm run build
//
// adds the canonical link, og:url, og:image (public/og-image.jpg), the schema.org "url" fields, sitemap.xml and the
// Sitemap line of robots.txt. With SITE_URL unset none of those are emitted: no address is ever guessed.
// (If the site lives under a sub-path, include it: https://user.github.io/repo)
const SITE_URL = (process.env.SITE_URL || "").trim().replace(/\/+$/, "")
const OG_IMAGE = "og-image.jpg"

const siteSeo = () => ({
  name: "site-seo",

  transformIndexHtml(html, ctx) {
    if (!SITE_URL) return html

    const pagePath = !ctx?.path || ctx.path === "/" || ctx.path.endsWith("index.html")
      ? "/"
      : `/${ctx.path.replace(/^\/+/, "")}`
    const pageUrl = `${SITE_URL}${pagePath}`

    const head = [
      `    <link rel="canonical" href="${pageUrl}" />`,
      `    <meta property="og:url" content="${pageUrl}" />`,
      `    <meta property="og:image" content="${SITE_URL}/${OG_IMAGE}" />`,
      `    <meta property="og:image:alt" content="Siddharth Kumar, SEO Content Strategist and Digital Marketer: the portfolio home screen" />`,
      `    <meta name="twitter:image" content="${SITE_URL}/${OG_IMAGE}" />`,
    ].join("\n")

    return html
      .replace("</head>", `${head}\n  </head>`)
      .replace('name="twitter:card" content="summary"', 'name="twitter:card" content="summary_large_image"')
      .replace(/(<script type="application\/ld\+json">)([\s\S]*?)(<\/script>)/, (_, open, json, close) => {
        const data = JSON.parse(json)
        data["@graph"].forEach((node) => {
          node.url = pageUrl
        })
        return `${open}\n${JSON.stringify(data, null, 2)}\n${close}`
      })
  },

  generateBundle() {
    const robots = ["User-agent: *", "Allow: /", SITE_URL ? `\nSitemap: ${SITE_URL}/sitemap.xml` : ""].join("\n")
    this.emitFile({ type: "asset", fileName: "robots.txt", source: robots + "\n" })

    if (SITE_URL) {
      const today = new Date().toISOString().slice(0, 10)
      const pages = ["/", "/details.html"]
      this.emitFile({
        type: "asset",
        fileName: "sitemap.xml",
        source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map((page) => `  <url>\n    <loc>${SITE_URL}${page}</loc>\n    <lastmod>${today}</lastmod>\n  </url>`).join("\n")}\n</urlset>\n`,
      })
    }
  },
})

export default defineConfig({
  base: "./",
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        details: resolve(__dirname, "details.html"),
      },
    },
  },
  plugins: [siteSeo()],
})
