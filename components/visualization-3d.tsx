'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';
import { Box, Loader2, Maximize2 } from 'lucide-react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  buildScatterPoints,
  buildLinePoints,
  buildSurfaceGeometry,
} from '@/lib/visualization-3d';

const MAX_POINTS = 2000;

interface Visualization3DProps {
  data: Record<string, (number | string)[]>;
  columns: string[];
}

export function Visualization3D({ data, columns }: Visualization3DProps) {
  const numericColumns = useMemo(() => {
    return columns.filter(col =>
      data[col] && data[col].some(v => typeof v === 'number' && !isNaN(Number(v)))
    );
  }, [columns, data]);

  const [selectedX, setSelectedX] = useState(numericColumns[0] || '');
  const [selectedY, setSelectedY] = useState(numericColumns[1] || '');
  const [selectedZ, setSelectedZ] = useState(numericColumns[2] || '');
  const [selectedColorCol, setSelectedColorCol] = useState('none');
  const [selectedSizeCol, setSelectedSizeCol] = useState('none');
  const [vizType, setVizType] = useState('scatter');
  const [ready, setReady] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{ scene: THREE.Scene; camera: THREE.PerspectiveCamera; renderer: THREE.WebGLRenderer; controls: OrbitControls; animId: number } | null>(null);

  useEffect(() => {
    setSelectedX(numericColumns[0] || '');
    setSelectedY(numericColumns[1] || '');
    setSelectedZ(numericColumns[2] || '');
  }, [numericColumns]);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const w = container.clientWidth || 600;
    const h = container.clientHeight || 560;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a12);

    const camera = new THREE.PerspectiveCamera(50, w / h, 0.01, 10);
    camera.position.set(2.0, 1.8, 2.0);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x0a0a12, 0);
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.rotateSpeed = 0.8;
    controls.minDistance = 0.5;
    controls.maxDistance = 5;
    controls.target.set(0, 0, 0);

    function animate() {
      controls.update();
      renderer.render(scene, camera);
      if (sceneRef.current) {
        sceneRef.current.animId = requestAnimationFrame(animate);
      }
    }
    sceneRef.current = { scene, camera, renderer, controls, animId: 0 };
    sceneRef.current.animId = requestAnimationFrame(animate);
    setReady(true);

    return () => {
      if (sceneRef.current) {
        cancelAnimationFrame(sceneRef.current.animId);
      }
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      sceneRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!sceneRef.current) return;
    const { scene } = sceneRef.current;

    while (scene.children.length > 0) {
      const child = scene.children[0];
      if ('geometry' in child) (child as any).geometry?.dispose();
      if ('material' in child) {
        const m = (child as any).material;
        if (m) { if (Array.isArray(m)) m.forEach((mm: any) => mm.dispose()); else m.dispose(); }
      }
      scene.remove(child);
    }

    const xArr = (data[selectedX] || []) as number[];
    const yArr = (data[selectedY] || []) as number[];
    const zArr = (data[selectedZ] || []) as number[];
    const n = Math.min(xArr.length, yArr.length, zArr.length, MAX_POINTS);

    const colorArr = selectedColorCol !== 'none' && data[selectedColorCol]
      ? (data[selectedColorCol] as number[]).slice(0, n) : undefined;
    const sizeArr = selectedSizeCol !== 'none' && data[selectedSizeCol]
      ? (data[selectedSizeCol] as number[]).slice(0, n) : undefined;

    const step = Math.max(1, Math.floor(Math.min(xArr.length, yArr.length, zArr.length) / MAX_POINTS));
    const xs = xArr.filter((_, i) => i % step === 0);
    const ys = yArr.filter((_, i) => i % step === 0);
    const zs = zArr.filter((_, i) => i % step === 0);

    const ambient = new THREE.AmbientLight(0x404060, 0.6);
    scene.add(ambient);
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(2, 3, 4);
    scene.add(dirLight);
    const fillLight = new THREE.DirectionalLight(0x4488ff, 0.4);
    fillLight.position.set(-2, 0, -2);
    scene.add(fillLight);

    const gridHelper = new THREE.GridHelper(1.6, 12, 0x3b82f6, 0x1e3a5f);
    gridHelper.position.y = -0.5;
    scene.add(gridHelper);

    const axesHelper = new THREE.AxesHelper(0.9);
    axesHelper.position.y = -0.5;
    scene.add(axesHelper);

    if (vizType === 'scatter') {
      const pts = buildScatterPoints(xs, ys, zs, colorArr, sizeArr);
      if (pts.count === 0) return;

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(pts.positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(pts.colors, 3));
      geometry.setAttribute('size', new THREE.BufferAttribute(pts.sizes, 1));

      const material = new THREE.PointsMaterial({
        size: 0.035,
        vertexColors: true,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true,
      });

      const points = new THREE.Points(geometry, material);
      scene.add(points);
    }

    if (vizType === 'line3d') {
      const line = buildLinePoints(xs, ys, zs);
      if (line.count < 2) return;

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(line.positions, 3));

      const material = new THREE.LineBasicMaterial({
        color: 0x06b6d4,
        linewidth: 2,
        transparent: true,
        opacity: 0.85,
      });
      const pointsGeo = new THREE.BufferGeometry();
      pointsGeo.setAttribute('position', new THREE.BufferAttribute(line.positions, 3));
      const pointsMat = new THREE.PointsMaterial({ color: 0x22d3ee, size: 0.025, sizeAttenuation: true });

      const lines = new THREE.Line(geometry, material);
      scene.add(lines);
      const dots = new THREE.Points(pointsGeo, pointsMat);
      scene.add(dots);
    }

    if (vizType === 'surface') {
      const surf = buildSurfaceGeometry(xs, ys, zs);
      if (surf.indices.length === 0) return;

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(surf.vertices, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(surf.colors, 3));
      geometry.setIndex(new THREE.BufferAttribute(surf.indices, 1));
      geometry.computeVertexNormals();

      const material = new THREE.MeshPhongMaterial({
        vertexColors: true,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85,
        shininess: 40,
        specular: new THREE.Color(0x222244),
      });

      const mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);

      const wireMat = new THREE.MeshBasicMaterial({
        color: 0x3b82f6,
        wireframe: true,
        transparent: true,
        opacity: 0.15,
      });
      const wireframe = new THREE.Mesh(geometry.clone(), wireMat);
      scene.add(wireframe);
    }

    if (vizType === 'mesh3d') {
      const pts = buildScatterPoints(xs, ys, zs, colorArr);
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(pts.positions, 3));

      const material = new THREE.PointsMaterial({
        size: 0.04,
        vertexColors: true,
        transparent: true,
        opacity: 0.85,
        sizeAttenuation: true,
      });
      const points = new THREE.Points(geometry, material);
      scene.add(points);

      if (pts.count >= 4) {
        const hullGeo = new THREE.BufferGeometry();
        hullGeo.setAttribute('position', new THREE.BufferAttribute(pts.positions, 3));
        const hullMat = new THREE.MeshPhongMaterial({
          color: 0xa855f7,
          transparent: true,
          opacity: 0.25,
          side: THREE.DoubleSide,
          wireframe: false,
        });
        const hull = new THREE.Mesh(hullGeo, hullMat);
        scene.add(hull);

        const wireMat = new THREE.MeshBasicMaterial({
          color: 0xa855f7,
          wireframe: true,
          transparent: true,
          opacity: 0.3,
        });
        const wireHull = new THREE.Mesh(hullGeo.clone(), wireMat);
        scene.add(wireHull);
      }
    }

    if (vizType === 'bubble') {
      const sizes = sizeArr || xs.map(() => 1);
      const pts = buildScatterPoints(xs, ys, zs, colorArr, sizes);
      if (pts.count === 0) return;

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(pts.positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(pts.colors, 3));
      geometry.setAttribute('size', new THREE.BufferAttribute(pts.sizes, 1));

      const material = new THREE.PointsMaterial({
        size: 0.06,
        vertexColors: true,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true,
      });
      const points = new THREE.Points(geometry, material);
      scene.add(points);

      const glowMat = new THREE.PointsMaterial({
        size: 0.1,
        vertexColors: true,
        transparent: true,
        opacity: 0.15,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true,
      });
      const glow = new THREE.Points(geometry.clone(), glowMat);
      scene.add(glow);
    }
  }, [vizType, selectedX, selectedY, selectedZ, selectedColorCol, selectedSizeCol, data, numericColumns, ready]);

  const totalRows = columns.length > 0 ? (data[columns[0]]?.length ?? 0) : 0;
  const shownRows = Math.min(totalRows, MAX_POINTS);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <Card className="bg-background/50 border-muted-foreground/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 font-display text-base">
            <Box className="h-5 w-5 text-cyan-500" />
            Visualización 3D Interactiva
            {totalRows > MAX_POINTS && (
              <span className="ml-auto text-[10px] font-normal text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                Mostrando {shownRows.toLocaleString()} de {totalRows.toLocaleString()} pts
              </span>
            )}
          </CardTitle>
          <CardDescription>
            Arrastra para orbitar • Scroll para zoom • Click derecho para paneo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Tipo</label>
              <Select value={vizType} onValueChange={setVizType}>
                <SelectTrigger className="bg-background/50 border-muted-foreground/20 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scatter">Scatter 3D</SelectItem>
                  <SelectItem value="bubble">Burbuja 3D</SelectItem>
                  <SelectItem value="line3d">Línea 3D</SelectItem>
                  <SelectItem value="surface">Superficie 3D</SelectItem>
                  <SelectItem value="mesh3d">Malla 3D</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {vizType !== 'surface' && (
              <>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Eje X</label>
                  <Select value={selectedX} onValueChange={setSelectedX}>
                    <SelectTrigger className="bg-background/50 border-muted-foreground/20 h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {numericColumns.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Eje Y</label>
                  <Select value={selectedY} onValueChange={setSelectedY}>
                    <SelectTrigger className="bg-background/50 border-muted-foreground/20 h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {numericColumns.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Eje Z</label>
                  <Select value={selectedZ} onValueChange={setSelectedZ}>
                    <SelectTrigger className="bg-background/50 border-muted-foreground/20 h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {numericColumns.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {(vizType === 'scatter' || vizType === 'bubble') && (
              <>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Color</label>
                  <Select value={selectedColorCol} onValueChange={setSelectedColorCol}>
                    <SelectTrigger className="bg-background/50 border-muted-foreground/20 h-9">
                      <SelectValue placeholder="Sin color" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin mapeo</SelectItem>
                      {numericColumns.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Tamaño</label>
                  <Select value={selectedSizeCol} onValueChange={setSelectedSizeCol}>
                    <SelectTrigger className="bg-background/50 border-muted-foreground/20 h-9">
                      <SelectValue placeholder="Tamaño fijo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Tamaño estático</SelectItem>
                      {numericColumns.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>

          <div className="relative border-t border-muted-foreground/10 pt-2">
            <div ref={containerRef} className="w-full h-140 rounded-lg overflow-hidden cursor-grab active:cursor-grabbing" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
