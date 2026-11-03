# SoftSeer website

A responsive website starter built with semantic HTML, CSS, and JavaScript. The landing hero renders the supplied cosmic robot artwork as individually glowing canvas particles, preserving its portrait proportions, color, and bright design details rather than displaying it as a static image.

## Run locally

Open `index.html` in a browser, or serve this folder with any static web server. For example, with Node.js available:

```powershell
npx --yes serve .
```

No build step or package installation is required.

## Brand assets and content to confirm

- The SoftSeer logo in the navigation and footer is currently a text-only wordmark. Replace it with the approved SVG/transparent PNG once the official logo asset is available; preserve the supplied artwork's proportions and colours. The reference video could not be inspected for a clean logo extraction in this environment.
- Update the project names, descriptions, categories, screenshots, technology lists, and live URLs in `content.js` after confirmation. The listed names come from the supplied brief; project details are intentionally not invented.
- The leadership name is included as supplied. Verify the official title and obtain approved biography, portrait, and profile link before publishing.
- Add verified locations and partner details before claiming a global footprint or displaying partner marks.
- Add verified email, telephone, address, and social links where required.

## Contact form

The form performs browser validation. It does not claim delivery unless a configured endpoint accepts the request. Set `contactEndpoint` in `content.js` to a verified HTTPS form-service or backend endpoint that accepts a JSON `POST` with `name`, `email`, and `message`. The endpoint must support the site's CORS origin. Without that endpoint, submission is explicitly reported as not connected.

## Accessibility and performance

The page supports keyboard navigation, narrow-screen navigation, semantic landmarks, focus-visible controls, and `prefers-reduced-motion`. Particle counts are capped and the animation pauses while the tab is hidden. The hero's CSS background and content remain visible if canvas/WebGL effects are unavailable.
