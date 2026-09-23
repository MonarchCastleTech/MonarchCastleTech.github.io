const canAnimate = window.matchMedia("(min-width: 48rem)").matches
  && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (canAnimate) {
  import("/scripts/hero-scene.js").catch(() => {
    // The authored SVG remains visible when WebGL or the module is unavailable.
  });
}
