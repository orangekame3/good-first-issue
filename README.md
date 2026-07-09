# good-first-issue

A static GitHub Pages site that collects open issues labeled `good first issue` from repositories in the `oqtopus-team` organization.

## Local preview

```bash
GITHUB_TOKEN=... node scripts/fetch-issues.mjs
python3 -m http.server 8000 --directory public
```

Open `http://localhost:8000` to preview the site. Use `?theme=light` or `?theme=dark` to pin the theme, or switch it from the toggle in the header.

## UI

The UI follows the OQTOPUS project brand.

- Hero section using the brand colors, blue `#1f1fdd` and red `#e21331`, plus the OQTOPUS mascot.
- Light and dark modes with system preference detection, a manual toggle, and `localStorage` persistence.
- Logo and mascot assets come from [oqtopus-team/artwork](https://github.com/oqtopus-team/artwork), licensed under CC BY 4.0.

## Update schedule

`.github/workflows/update-pages.yml` fetches fresh data from the GitHub API every day at 02:00 JST and deploys the `public` directory to GitHub Pages. You can also run the `Update GitHub Pages` workflow manually from GitHub Actions.
