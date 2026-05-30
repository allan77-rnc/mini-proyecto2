import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { Group, Points as ThreePoints, Mesh } from 'three';

/** Paleta de marca StudySphere */
const BRAND = {
  teal: '#2dd4bf',
  indigo: '#818cf8',
  lime: '#a3e635',
  navy: '#081e2f',
} as const;

const NODE_COUNT = 22;
/** Distancia máxima para conectar dos nodos. */
const LINK_DISTANCE = 1.9;
/** Radio de la esfera dentro de la cúpula donde viven los nodos. */
const RADIUS = 2.1;

interface MotionProps {
  /** Si el usuario prefiere menos movimiento, se reduce la animación. */
  reducedMotion: boolean;
}

/** Pseudoaleatorio determinista (puro) en [0,1) a partir de una semilla. */
function rand(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/** Geometría de la red: nodos distribuidos en la esfera + aristas cercanas. */
function useNetwork() {
  return useMemo(() => {
    const nodes: THREE.Vector3[] = [];
    for (let i = 0; i < NODE_COUNT; i++) {
      // Distribución uniforme dentro de la esfera
      const theta = rand(i * 3) * Math.PI * 2;
      const phi = Math.acos(2 * rand(i * 3 + 1) - 1);
      const r = RADIUS * Math.cbrt(rand(i * 3 + 2));
      nodes.push(
        new THREE.Vector3(
          r * Math.sin(phi) * Math.cos(theta),
          r * Math.sin(phi) * Math.sin(theta),
          r * Math.cos(phi),
        ),
      );
    }

    // Aristas entre nodos suficientemente cercanos (índices)
    const edges: [number, number][] = [];
    for (let a = 0; a < NODE_COUNT; a++) {
      for (let b = a + 1; b < NODE_COUNT; b++) {
        if (nodes[a].distanceTo(nodes[b]) < LINK_DISTANCE) edges.push([a, b]);
      }
    }

    const linePositions = new Float32Array(edges.length * 6);
    edges.forEach(([a, b], i) => {
      const p1 = nodes[a];
      const p2 = nodes[b];
      linePositions.set([p1.x, p1.y, p1.z, p2.x, p2.y, p2.z], i * 6);
    });

    return { nodes, edges, linePositions };
  }, []);
}

/** Red neuronal dentro de la cúpula, reactiva al cursor. */
function Network({ reducedMotion }: MotionProps) {
  const group = useRef<Group>(null);
  const pulses = useRef<ThreePoints>(null);
  const planets = useRef<Group>(null);
  const nodeRefs = useRef<Mesh[]>([]);
  const { nodes, edges, linePositions } = useNetwork();

  /** Subconjunto de aristas que transportan un pulso morado. */
  const pulseEdges = useMemo(() => edges.filter((_, i) => i % 2 === 0).slice(0, 16), [edges]);
  const pulsePositions = useMemo(() => new Float32Array(pulseEdges.length * 3), [pulseEdges]);

  /** Nivel de "encendido" por nodo (decae con el tiempo). */
  const activation = useRef(new Float32Array(NODE_COUNT));

  // Colores reutilizables para interpolar el brillo de los nodos
  const colors = useMemo(
    () => ({
      base: new THREE.Color(BRAND.teal),
      hot: new THREE.Color(BRAND.lime),
      tmp: new THREE.Color(),
    }),
    [],
  );

  useFrame((state, delta) => {
    if (!group.current) return;
    const t = state.clock.elapsedTime;

    // Parallax suavizado hacia el puntero + giro automático
    const targetX = reducedMotion ? 0 : state.pointer.y * 0.4;
    const targetY = reducedMotion ? 0 : state.pointer.x * 0.6 + t * 0.05;
    group.current.rotation.x = THREE.MathUtils.damp(group.current.rotation.x, targetX, 3, delta);
    group.current.rotation.y = THREE.MathUtils.damp(group.current.rotation.y, targetY, 3, delta);

    // Órbita de los planetas
    if (planets.current && !reducedMotion) planets.current.rotation.y = t * 0.25;

    // Decaimiento del encendido de cada nodo
    const act = activation.current;
    for (let i = 0; i < NODE_COUNT; i++) act[i] = Math.max(0, act[i] - delta * 2.2);

    // Avance de los pulsos a lo largo de sus aristas
    if (pulses.current && !reducedMotion) {
      const attr = pulses.current.geometry.attributes.position as THREE.BufferAttribute;
      pulseEdges.forEach(([a, b], i) => {
        const p1 = nodes[a];
        const p2 = nodes[b];
        const k = (t * 0.35 + i * 0.137) % 1; // progreso 0→1 cíclico
        attr.setXYZ(i, p1.x + (p2.x - p1.x) * k, p1.y + (p2.y - p1.y) * k, p1.z + (p2.z - p1.z) * k);
        // Al llegar a un extremo, enciende ese nodo
        if (k > 0.9) act[b] = 1;
        else if (k < 0.1) act[a] = 1;
      });
      attr.needsUpdate = true;
    }

    // Aplica el encendido (teal → verde lima) a cada esfera-nodo
    for (let i = 0; i < NODE_COUNT; i++) {
      const mesh = nodeRefs.current[i];
      if (!mesh) continue;
      const mat = mesh.material as THREE.MeshStandardMaterial;
      const a = act[i];
      colors.tmp.copy(colors.base).lerp(colors.hot, a);
      mat.color.copy(colors.tmp);
      mat.emissive.copy(colors.tmp);
      mat.emissiveIntensity = 0.5 + a * 2.5;
      const s = 1 + a * 0.6;
      mesh.scale.setScalar(s);
    }
  });

  return (
    <group ref={group}>
      {/* Cúpula: malla wireframe que envuelve la red */}
      <mesh>
        <icosahedronGeometry args={[RADIUS * 1.25, 1]} />
        <meshBasicMaterial color={BRAND.teal} wireframe transparent opacity={0.1} />
      </mesh>

      {/* Conexiones */}
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[linePositions, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color={BRAND.teal} transparent opacity={0.22} />
      </lineSegments>

      {/* Nodos (esferas que se encienden al paso de un pulso) */}
      {nodes.map((n, i) => (
        <mesh
          key={i}
          position={n}
          ref={(el) => {
            if (el) nodeRefs.current[i] = el;
          }}
        >
          <sphereGeometry args={[0.07, 16, 16]} />
          <meshStandardMaterial
            color={BRAND.teal}
            emissive={BRAND.teal}
            emissiveIntensity={0.5}
            toneMapped={false}
          />
        </mesh>
      ))}

      {/* Pulsos morados viajando por las conexiones */}
      <points ref={pulses}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[pulsePositions, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.15} color={BRAND.indigo} transparent opacity={0.95} sizeAttenuation toneMapped={false} />
      </points>

      {/* Planetas en órbita alrededor de la cúpula */}
      <group ref={planets}>
        {[0, 1, 2].map((i) => {
          const angle = (i / 3) * Math.PI * 2;
          const orbit = RADIUS * 1.5;
          return (
            <mesh key={i} position={[Math.cos(angle) * orbit, Math.sin(angle) * 0.6, Math.sin(angle) * orbit]}>
              <sphereGeometry args={[0.13, 24, 24]} />
              <meshStandardMaterial
                color={i === 1 ? BRAND.indigo : BRAND.teal}
                emissive={i === 1 ? BRAND.indigo : BRAND.teal}
                emissiveIntensity={0.7}
                toneMapped={false}
              />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}

/**
 * Escena 3D del hero: red neuronal dentro de una cúpula, reactiva al cursor.
 * Los nodos se encienden en verde lima cuando un pulso morado pasa por ellos.
 * Respeta `prefers-reduced-motion` para accesibilidad.
 */
export default function HeroScene() {
  const reducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <Canvas camera={{ position: [0, 0, 7], fov: 50 }} dpr={[1, 1.5]} gl={{ antialias: true, alpha: true }}>
      <color attach="background" args={[BRAND.navy]} />
      <ambientLight intensity={0.6} />
      <pointLight position={[5, 5, 5]} intensity={1} color={BRAND.teal} />
      <pointLight position={[-5, -3, 2]} intensity={0.6} color={BRAND.indigo} />
      <Network reducedMotion={reducedMotion} />
      {/* Solo zoom con la rueda (sin rotar ni desplazar); se captura únicamente
          cuando el cursor está sobre el canvas, sin afectar el scroll de la página */}
      <OrbitControls
        enablePan={false}
        enableRotate={false}
        enableZoom
        zoomSpeed={0.6}
        minDistance={4}
        maxDistance={11}
      />
    </Canvas>
  );
}
