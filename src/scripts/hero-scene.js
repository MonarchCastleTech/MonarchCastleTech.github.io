import * as THREE from "three";

const host = document.querySelector(".mission-hero-visual");
const canvas = host?.querySelector(".hero-scene-canvas");

if (host && canvas) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "low-power",
    });
  } catch {
    // The authored SVG remains visible when a WebGL context cannot be created.
  }

  if (renderer) {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(37, 1, 0.1, 50);
    camera.position.set(0, -7.4, 7.5);
    camera.lookAt(0, 0, 0);

    const field = new THREE.Group();
    field.rotation.z = -0.12;
    scene.add(field);

    const lineMaterial = (color, opacity) => new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity,
      depthWrite: false,
    });
    const fineLine = lineMaterial(0x49636c, 0.35);
    const strongLine = lineMaterial(0x89a9af, 0.55);
    const signalLine = lineMaterial(0xc18b63, 0.82);

    const heightAt = (x, y) => {
      const ridge = Math.exp(-((x + 1.4) ** 2 / 3.6 + (y - 0.3) ** 2 / 1.8));
      const basin = Math.exp(-((x - 1.8) ** 2 / 2.8 + (y + 0.9) ** 2 / 2.4));
      return 0.45 * ridge + 0.26 * basin + 0.11 * Math.sin(x * 1.35 + y * 0.65);
    };

    const makeLine = (points, material, parent = field) => {
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geometry, material);
      parent.add(line);
      return line;
    };

    for (let row = 0; row <= 28; row += 1) {
      const y = -3.25 + row * (6.5 / 28);
      const points = [];
      for (let step = 0; step <= 88; step += 1) {
        const x = -5 + step * (10 / 88);
        points.push(new THREE.Vector3(x, y, heightAt(x, y)));
      }
      makeLine(points, row % 7 === 0 ? strongLine : fineLine);
    }

    for (let column = 0; column <= 24; column += 1) {
      const x = -5 + column * (10 / 24);
      const points = [];
      for (let step = 0; step <= 56; step += 1) {
        const y = -3.25 + step * (6.5 / 56);
        points.push(new THREE.Vector3(x, y, heightAt(x, y) + 0.002));
      }
      makeLine(points, column % 6 === 0 ? strongLine : fineLine);
    }

    const coordinates = [
      new THREE.Vector2(-3.5, -1.2),
      new THREE.Vector2(-1.5, 1.3),
      new THREE.Vector2(0.7, -0.5),
      new THREE.Vector2(3.3, 1.4),
      new THREE.Vector2(2.6, -2.0),
    ];
    const nodes = coordinates.map((point, index) => {
      const marker = new THREE.Mesh(
        new THREE.SphereGeometry(index === 2 ? 0.075 : 0.055, 12, 12),
        new THREE.MeshBasicMaterial({ color: index === 2 ? 0xc18b63 : 0xcbdde0 })
      );
      marker.position.set(point.x, point.y, heightAt(point.x, point.y) + 0.11);
      field.add(marker);

      const ringPoints = [];
      const radius = index === 2 ? 0.33 : 0.21;
      for (let segment = 0; segment <= 64; segment += 1) {
        const angle = segment * Math.PI * 2 / 64;
        const x = point.x + Math.cos(angle) * radius;
        const y = point.y + Math.sin(angle) * radius;
        ringPoints.push(new THREE.Vector3(x, y, heightAt(x, y) + 0.06));
      }
      makeLine(ringPoints, index === 2 ? signalLine : strongLine);
      return marker;
    });

    const paths = [
      [0, 1, 0.52],
      [1, 2, 0.6],
      [2, 3, 0.58],
      [2, 4, 0.46],
    ].map(([startIndex, endIndex, lift], index) => {
      const start = nodes[startIndex].position;
      const end = nodes[endIndex].position;
      const control = start.clone().add(end).multiplyScalar(0.5);
      control.z += lift;
      const curve = new THREE.QuadraticBezierCurve3(start, control, end);
      makeLine(curve.getPoints(70), index === 2 ? signalLine : strongLine);
      return curve;
    });

    const pulses = paths.slice(1, 3).map((curve, index) => {
      const marker = new THREE.Mesh(
        new THREE.SphereGeometry(0.065, 12, 12),
        new THREE.MeshBasicMaterial({ color: index ? 0xd4a376 : 0xb8d3d7 })
      );
      field.add(marker);
      return { curve, marker, offset: index * 0.54 };
    });

    const clock = new THREE.Clock();
    const pointer = { x: 0, y: 0 };
    let visible = false;
    let ready = false;

    function resize() {
      const width = Math.max(1, host.clientWidth);
      const height = Math.max(1, host.clientHeight);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.setSize(width, height, false);
      if (!visible) renderer.render(scene, camera);
    }

    function animate() {
      const elapsed = clock.getElapsedTime();
      field.rotation.z += (Math.sin(elapsed * 0.14) * 0.018 + pointer.x * 0.035 - field.rotation.z - 0.12) * 0.025;
      field.rotation.x += (pointer.y * 0.025 - field.rotation.x) * 0.03;
      camera.position.x += (pointer.x * 0.24 - camera.position.x) * 0.018;
      camera.lookAt(0, 0, 0);
      for (const pulse of pulses) {
        const progress = (elapsed * 0.065 + pulse.offset) % 1;
        pulse.marker.position.copy(pulse.curve.getPoint(progress));
      }
      renderer.render(scene, camera);
      if (!ready) {
        ready = true;
        host.classList.add("scene-ready");
      }
    }

    function syncAnimation() {
      const shouldAnimate = visible && !document.hidden
        && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      renderer.setAnimationLoop(shouldAnimate ? animate : null);
      if (!shouldAnimate) renderer.render(scene, camera);
    }

    const visibility = new IntersectionObserver((entries) => {
      visible = entries[0]?.isIntersecting ?? false;
      syncAnimation();
    }, { threshold: 0.05 });
    visibility.observe(host);

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    host.addEventListener("pointermove", (event) => {
      const bounds = host.getBoundingClientRect();
      pointer.x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
      pointer.y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
    }, { passive: true });
    host.addEventListener("pointerleave", () => {
      pointer.x = 0;
      pointer.y = 0;
    });
    document.addEventListener("visibilitychange", syncAnimation);
    window.addEventListener("pagehide", () => renderer.setAnimationLoop(null), { once: true });
    resize();
  }
}
