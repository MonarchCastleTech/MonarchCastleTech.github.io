import * as THREE from "three";
export function createAtlas(host, geography, points, onSelect) {
  const canvas = host.querySelector("canvas"); let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "low-power" }); } catch { return null; }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  const scene = new THREE.Scene(), world = new THREE.Group(), camera = new THREE.PerspectiveCamera(38, 1, 0.1, 20);
  scene.add(world); camera.position.set(0, 0, 3.7);
  const position = (lon, lat, radius = 1.006) => { const phi = lat * Math.PI / 180, theta = lon * Math.PI / 180; return new THREE.Vector3(Math.cos(phi) * Math.sin(theta) * radius, Math.sin(phi) * radius, Math.cos(phi) * Math.cos(theta) * radius); };
  const sphere = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32), new THREE.MeshBasicMaterial({ color: 0x0b1726 })); world.add(sphere);
  const vertices = [];
  for (const feature of geography) for (const ring of feature.rings) for (let i = 1; i < ring.length; i += 1) vertices.push(...position(...ring[i - 1]).toArray(), ...position(...ring[i]).toArray());
  const geometry = new THREE.BufferGeometry(); geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  world.add(new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({ color: 0x658197, transparent: true, opacity: 0.7 })));
  const markers = points.map(point => { const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.009, 8, 8), new THREE.MeshBasicMaterial({ color: 0xa2c4d5 })); mesh.position.copy(position(point.lon, point.lat, 1.014)); mesh.userData.code = point.code; world.add(mesh); return mesh; });
  let visible = false, frame = 0; const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const resize = new ResizeObserver(() => { const width = host.clientWidth, height = Math.max(260, Math.min(400, width * 0.58)); renderer.setSize(width, height, false); camera.aspect = width / height; camera.updateProjectionMatrix(); }); resize.observe(host);
  function loop() { frame = 0; if (!visible || document.hidden || motion.matches) return; world.rotation.y += 0.0008; renderer.render(scene, camera); frame = requestAnimationFrame(loop); }
  const resume = () => { if (!frame && visible && !document.hidden && !motion.matches) loop(); };
  const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; resume(); }); observer.observe(host);
  document.addEventListener("visibilitychange", resume);
  const changeMotion = () => { host.classList.toggle("atlas-3d", !motion.matches); resume(); }; motion.addEventListener("change", changeMotion);
  const ray = new THREE.Raycaster();
  canvas.addEventListener("click", event => { const box = canvas.getBoundingClientRect(); ray.setFromCamera(new THREE.Vector2((event.clientX - box.left) / box.width * 2 - 1, -(event.clientY - box.top) / box.height * 2 + 1), camera); const hit = ray.intersectObjects(markers)[0]; if (hit && !ray.intersectObject(sphere).some(surface => surface.distance < hit.distance - 0.02)) onSelect(hit.object.userData.code); });
  world.rotation.y = -0.6; host.classList.add("atlas-3d");
  window.addEventListener("pagehide", () => { cancelAnimationFrame(frame); observer.disconnect(); resize.disconnect(); scene.traverse(object => { object.geometry?.dispose(); object.material?.dispose(); }); renderer.dispose(); document.removeEventListener("visibilitychange", resume); motion.removeEventListener("change", changeMotion); }, { once: true });
  return { select(code) { const selected = points.find(point => point.code === code); for (const mesh of markers) { mesh.material.color.setHex(mesh.userData.code === code ? 0xc9a97b : 0xa2c4d5); mesh.scale.setScalar(mesh.userData.code === code ? 2.5 : 1); } if (selected) world.rotation.y = -selected.lon * Math.PI / 180; renderer.render(scene, camera); } };
}
