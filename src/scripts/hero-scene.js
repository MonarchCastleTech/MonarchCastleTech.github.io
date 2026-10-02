import * as THREE from "three";
import { countryCentre, matchGeography } from './atlas-data.js';

const radians=Math.PI/180;
const xyz=(lon,lat,radius=1.004)=>new THREE.Vector3(Math.cos(lat*radians)*Math.sin(lon*radians)*radius,Math.sin(lat*radians)*radius,Math.cos(lat*radians)*Math.cos(lon*radians)*radius);

export function createScene(geography,records,onSelect) {
  const canvas=document.querySelector('#world-canvas'), host=canvas.parentElement;
  let renderer;
  try {renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'low-power'});} catch {return null;}
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setClearColor(0x111613,0);
  const scene=new THREE.Scene(), world=new THREE.Group(), camera=new THREE.PerspectiveCamera(32,1,.1,30);scene.add(world);
  scene.add(new THREE.AmbientLight(0xf2f3f0,.65));
  const key=new THREE.DirectionalLight(0xf2f3f0,3.2);key.position.set(-3,3,5);scene.add(key);
  const rim=new THREE.DirectionalLight(0x7e9581,1.2);rim.position.set(3,0,-3);scene.add(rim);
  const ocean=new THREE.Mesh(new THREE.SphereGeometry(1,96,64),new THREE.MeshPhongMaterial({color:0x24352b,specular:0x334438,shininess:12}));world.add(ocean);
  const vertices=[],lines=[];
  // Tessellate planar country triangles before projecting them onto the sphere.
  // Large chords would otherwise pass under the ocean mesh and leave holes.
  function triangle(a,b,c,depth=0) {
    const span=Math.max(Math.hypot(a[0]-b[0],a[1]-b[1]),Math.hypot(b[0]-c[0],b[1]-c[1]),Math.hypot(c[0]-a[0],c[1]-a[1]));
    if(span>5&&depth<8) {
      const ab=[(a[0]+b[0])/2,(a[1]+b[1])/2],bc=[(b[0]+c[0])/2,(b[1]+c[1])/2],ca=[(c[0]+a[0])/2,(c[1]+a[1])/2];
      triangle(a,ab,ca,depth+1);triangle(ab,b,bc,depth+1);triangle(ca,bc,c,depth+1);triangle(ab,bc,ca,depth+1);
    } else {for(const point of [a,b,c]) vertices.push(...xyz(...point,1.004).toArray());}
  }
  for(const feature of geography) for(const sourceRing of feature.rings) {
    const ring=sourceRing.slice(0,-1);
    if(ring.length<3)continue;
    for(let i=1;i<sourceRing.length;i++) {
      if(Math.abs(sourceRing[i][0]-sourceRing[i-1][0])<160)lines.push(...xyz(...sourceRing[i-1],1.005).toArray(),...xyz(...sourceRing[i],1.005).toArray());
    }
    if(ring.some((p,i)=>i&&Math.abs(p[0]-ring[i-1][0])>160))continue;
    const faces=THREE.ShapeUtils.triangulateShape(ring.map(([lon,lat])=>new THREE.Vector2(lon,lat)),[]);
    for(const face of faces) triangle(...face.map(index=>ring[index]));
  }
  const landGeometry=new THREE.BufferGeometry();landGeometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));landGeometry.computeVertexNormals();
  world.add(new THREE.Mesh(landGeometry,new THREE.MeshLambertMaterial({color:0x8a9b80,side:THREE.DoubleSide})));
  const outlineGeometry=new THREE.BufferGeometry();outlineGeometry.setAttribute('position',new THREE.Float32BufferAttribute(lines,3));
  world.add(new THREE.LineSegments(outlineGeometry,new THREE.LineBasicMaterial({color:0xa9b5a3,transparent:true,opacity:.4})));
  const points=records.flatMap(record=>{const feature=matchGeography(record,geography),centre=feature&&countryCentre(feature);return centre&&record.value!==null?[{...record,centre}]:[];});
  const dots=points.map(record=>{const marker=new THREE.Mesh(new THREE.SphereGeometry(.005,6,6),new THREE.MeshBasicMaterial({color:0xe4e9df}));marker.position.copy(xyz(...record.centre,1.01));marker.userData.code=record.code;world.add(marker);return marker;});
  const selected=new THREE.Mesh(new THREE.SphereGeometry(.016,12,12),new THREE.MeshBasicMaterial({color:0xffffff}));world.add(selected);
  const motion=matchMedia('(prefers-reduced-motion: reduce)');let frame=0,visible=true,targetY=-.45,targetX=.05,start=0;
  world.rotation.y=-.8;world.rotation.x=.08;
  const render=()=>{renderer.render(scene,camera);};
  function tick(now) {
    frame=0;if(document.hidden||!visible)return;
    const factor=motion.matches?1:.08;world.rotation.y+=(targetY-world.rotation.y)*factor;world.rotation.x+=(targetX-world.rotation.x)*factor;render();
    if(!motion.matches&&now-start<1400&&(Math.abs(targetY-world.rotation.y)>.001||Math.abs(targetX-world.rotation.x)>.001))frame=requestAnimationFrame(tick);
  }
  function draw(){if(frame)cancelAnimationFrame(frame);start=performance.now();frame=requestAnimationFrame(tick);}
  function resize() {
    const mobile=host.clientWidth<600;camera.position.set(0,0,mobile?7.3:5);camera.aspect=host.clientWidth/host.clientHeight;camera.updateProjectionMatrix();
    world.scale.setScalar(mobile?1.18:1.52);world.position.set(mobile?0:1.45,mobile?-1.15:-.02,0);renderer.setSize(host.clientWidth,host.clientHeight,false);draw();
  }
  const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(host);
  const observer=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;if(visible)draw();});observer.observe(host);
  const resume=()=>{if(!document.hidden)draw();};document.addEventListener('visibilitychange',resume);motion.addEventListener('change',draw);
  const ray=new THREE.Raycaster();canvas.addEventListener('click',event=>{
    const box=canvas.getBoundingClientRect();ray.setFromCamera(new THREE.Vector2((event.clientX-box.left)/box.width*2-1,-(event.clientY-box.top)/box.height*2+1),camera);
    const hit=ray.intersectObjects(dots)[0];if(hit&&!ray.intersectObject(ocean).some(surface=>surface.distance<hit.distance-.01))onSelect(hit.object.userData.code);
  });
  host.classList.add('is-3d');resize();
  window.addEventListener('pagehide',()=>{cancelAnimationFrame(frame);resizeObserver.disconnect();observer.disconnect();document.removeEventListener('visibilitychange',resume);motion.removeEventListener('change',draw);scene.traverse(node=>{node.geometry?.dispose();node.material?.dispose();});renderer.dispose();},{once:true});
  return {select(record){const feature=matchGeography(record,geography),centre=feature&&countryCentre(feature);if(!centre){selected.visible=false;return;}selected.visible=true;selected.position.copy(xyz(...centre,1.024));targetY=-centre[0]*radians+.13;targetX=centre[1]*radians*.33;draw();}};
}
