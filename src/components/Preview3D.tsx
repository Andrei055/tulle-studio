"use client";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { useEditor } from "../state/editor";
import type { Geometry } from "../geometry/envelope";
import { extrude, heights } from "../manufacturing/model";
export function Preview3D({ geometry: g }: { geometry: Geometry }) {
  const mount = useRef<HTMLDivElement>(null),
    p = useEditor((s) => s.project);
  const [explode, setExplode] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    const el = mount.current;
    if (!el) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      setError(
        "WebGL недоступен в этом браузере. SVG и STL доступны через экспорт.",
      );
      return;
    }
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#eae7e2");
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 3000),
      controls = new OrbitControls(camera, renderer.domElement);
    camera.position.set(100, -170, 340);
    controls.target.set(0, 0, 0);
    controls.enableDamping = true;
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    el.appendChild(renderer.domElement);
    const h = heights(p.print),
      group = new THREE.Group();
    group.position.set(-p.envelope.width / 2, g.total / 2, 0);
    scene.add(group);
    const add = (
      paths: typeof g.outer,
      depth: number,
      z: number,
      color: string,
      opacity = 1,
    ) => {
      const mesh = new THREE.Mesh(
        extrude(paths, depth, z),
        new THREE.MeshStandardMaterial({
          color,
          roughness: 0.65,
          metalness: 0.05,
          transparent: opacity < 1,
          opacity,
          side: THREE.DoubleSide,
        }),
      );
      group.add(mesh);
    };
    if (p.layers.bottom.visible) add(g.bottom, h.bottom, 0, "#ba8f9b");
    if (p.layers.top.visible)
      add(g.top, h.top, h.topStart + (explode ? 18 : 0), "#fff6f0");
    if (p.layers.fabric.visible) {
      add(g.outer, 0.015, h.bottom + (explode ? 9 : 0), "#a7b4a7", 0.18);
      const lines: number[] = [];
      for (let x = 0; x <= p.envelope.width; x += 3)
        lines.push(
          x,
          -p.envelope.flapHeight,
          h.bottom + (explode ? 9 : 0),
          x,
          -g.total,
          h.bottom + (explode ? 9 : 0),
        );
      const geom = new THREE.BufferGeometry();
      geom.setAttribute("position", new THREE.Float32BufferAttribute(lines, 3));
      group.add(
        new THREE.LineSegments(
          geom,
          new THREE.LineBasicMaterial({
            color: "#819781",
            transparent: true,
            opacity: 0.2,
          }),
        ),
      );
    }
    scene.add(new THREE.HemisphereLight("#fff8ee", "#776d77", 3));
    const light = new THREE.DirectionalLight("#ffffff", 3);
    light.position.set(50, 100, 300);
    scene.add(light);
    const resize = () => {
      const w = el.clientWidth,
        h = el.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    resize();
    let frame = 0;
    const animate = () => {
      controls.update();
      renderer.render(scene, camera);
      frame = requestAnimationFrame(animate);
    };
    animate();
    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
      controls.dispose();
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh || o instanceof THREE.LineSegments) {
          o.geometry.dispose();
          const mats = Array.isArray(o.material) ? o.material : [o.material];
          mats.forEach((m) => m.dispose());
        }
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [p, g, explode]);
  return (
    <div className="preview3d">
      <div ref={mount} className="three-mount" />
      {error && <p className="webgl-error">{error}</p>}
      <div className="preview-caption">
        <span>
          Печатная развёртка · толщина {heights(p.print).total.toFixed(2)} мм
        </span>
        <button onClick={() => setExplode(!explode)}>
          {explode ? "Собрать слои" : "Разнести слои"}
        </button>
      </div>
      <div className="three-hint">
        Перетаскивание — вращение · колесо — масштаб
        <br />
        Розовый: нижний PLA · сетка: ткань · белый: верхний PLA
      </div>
    </div>
  );
}
