# Pocket Depth (offline)

A standalone copy of the Pocket Depth artifact that works without a connection.
You can install it to your home screen. It makes a depth map from a photo with
Depth Anything V2, then lets you edit the photo by distance or tilt it in 3D. It
all runs in the browser.

## How it works offline

- `sw.js` is a service worker. It keeps the page, the ONNX Runtime and the Small
  model in the browser's Cache Storage.
- These files are served from this folder instead of a CDN or the artifact host:
  - `vendor/`: onnxruntime-web 1.22.0 (MIT)
  - `models/depth-anything-v2-small.onnx`: Depth Anything V2 Small, fp32
    (Apache-2.0), as built by onnx-community
- The first time you use it, press **Save for offline use** in the footer, or
  make one depth map. The footer then shows **Offline: ready**.
- The Large model works offline too. Choose its file once, and it's saved in
  IndexedDB like before.
- Google Fonts are cached the first time they load. With no connection and no
  cached fonts, the page uses system fonts.

## Hosting it

A service worker needs HTTPS (or `localhost`), so the folder has to be served.
Opening `index.html` as a file won't work.

- **GitHub Pages**: in the repo, go to Settings → Pages and deploy from this
  branch. Open `https://<user>.github.io/<repo>/pocket-depth/` once while
  online, then on a phone choose Share → Add to Home Screen. (Pages needs a
  public repo, or a paid plan for a private one.)
- **Any static host** (Netlify, Cloudflare Pages and so on): upload this folder.
- **On a computer**: run `python3 -m http.server` in this folder and open
  `http://localhost:8000/`.

To ship a new version of the page, bump `SHELL` in `sw.js`. The model cache
(`ASSETS`) is kept, so nobody has to download it again.
