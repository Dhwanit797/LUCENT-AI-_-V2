import { useRef, useMemo, useState, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Line } from '@react-three/drei'
import * as THREE from 'three'

// ── Color palette (electric cyan / acid lime / violet) ──
const CYAN   = '#00d4ff'
const TEAL   = '#00ffc3'
const LIME   = '#beff00'
const VIOLET = '#a78bfa'
const DARK_BG   = '#04060e'
const SURFACE_DARK = '#0c1120'
const LIGHT_BG   = '#f5f7fa'
const LIGHT_SURF = '#dde5f2'

// ─── Fresnel rim shaders ───────────────────────────────────
const fresnelVert = /* glsl */`
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`
const fresnelFrag = /* glsl */`
  uniform vec3 rimColor;
  uniform float rimPower;
  uniform float opacity;
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  void main() {
    vec3 viewDir = normalize(vViewPosition);
    float fresnel = pow(1.0 - max(dot(normalize(vNormal), viewDir), 0.0), rimPower);
    gl_FragColor = vec4(rimColor, fresnel * opacity);
  }
`

function FresnelRim({ isLight }: { isLight: boolean }) {
  const uniforms = useMemo(() => ({
    rimColor: { value: new THREE.Color(isLight ? '#6366f1' : CYAN) },
    rimPower: { value: 2.6 },
    opacity:  { value: isLight ? 0.14 : 0.28 },
  }), [isLight])
  return (
    <mesh>
      <sphereGeometry args={[0.87, 64, 64]} />
      <shaderMaterial vertexShader={fresnelVert} fragmentShader={fresnelFrag}
        uniforms={uniforms} transparent depthWrite={false} side={THREE.BackSide} />
    </mesh>
  )
}

function FresnelRimOuter({ isLight }: { isLight: boolean }) {
  const uniforms = useMemo(() => ({
    rimColor: { value: new THREE.Color(isLight ? '#a5b4fc' : TEAL) },
    rimPower: { value: 3.8 },
    opacity:  { value: isLight ? 0.06 : 0.14 },
  }), [isLight])
  return (
    <mesh>
      <sphereGeometry args={[0.94, 48, 48]} />
      <shaderMaterial vertexShader={fresnelVert} fragmentShader={fresnelFrag}
        uniforms={uniforms} transparent depthWrite={false} side={THREE.BackSide} />
    </mesh>
  )
}

function InnerCoreGlow({ isLight }: { isLight: boolean }) {
  const mesh = useRef<THREE.Mesh>(null)
  useFrame((s) => {
    if (!mesh.current?.material || !(mesh.current.material instanceof THREE.MeshBasicMaterial)) return
    const t = s.clock.elapsedTime * 0.3
    mesh.current.material.opacity = 0.06 + 0.12 * Math.abs(Math.sin(t))
  })
  return (
    <mesh ref={mesh}>
      <sphereGeometry args={[0.3, 32, 32]} />
      <meshBasicMaterial color={isLight ? LIGHT_SURF : CYAN} transparent opacity={0.1}
        depthWrite={false} side={THREE.BackSide} />
    </mesh>
  )
}

function TechGridOverlay({ isLight }: { isLight: boolean }) {
  return (
    <mesh>
      <sphereGeometry args={[0.86, 36, 28]} />
      <meshBasicMaterial color={isLight ? '#64748b' : CYAN}
        transparent opacity={isLight ? 0.035 : 0.04} wireframe depthWrite={false} side={THREE.DoubleSide} />
    </mesh>
  )
}

function GlassSphere({ isLight, hoverRef }: { isLight: boolean; hoverRef: React.MutableRefObject<number> }) {
  const mesh = useRef<THREE.Mesh>(null)
  const matRef = useRef<THREE.MeshPhysicalMaterial>(null)
  useFrame((s) => {
    if (!mesh.current) return
    const t = s.clock.elapsedTime
    mesh.current.rotation.y = t * 0.06
    mesh.current.rotation.x = Math.sin(t * 0.12) * 0.04
    if (matRef.current) {
      const h = hoverRef.current
      matRef.current.emissiveIntensity = (isLight ? 0.03 : 0.08) + h * 0.04
    }
  })
  return (
    <mesh ref={mesh}>
      <sphereGeometry args={[0.85, 64, 64]} />
      <meshPhysicalMaterial ref={matRef}
        color={isLight ? LIGHT_SURF : SURFACE_DARK}
        transparent opacity={isLight ? 0.44 : 0.18}
        transmission={isLight ? 0.76 : 0.86} thickness={0.45}
        roughness={0.05} metalness={isLight ? 0.04 : 0.1}
        envMapIntensity={isLight ? 0.7 : 0.65}
        emissive={new THREE.Color(isLight ? '#bfcfee' : CYAN)}
        emissiveIntensity={isLight ? 0.03 : 0.08}
        clearcoat={0.25} clearcoatRoughness={0.08} ior={1.65}
      />
    </mesh>
  )
}

/** Dual energy rings */
function EnergyRings({ isLight }: { isLight: boolean }) {
  const r1 = useRef<THREE.Mesh>(null)
  const r2 = useRef<THREE.Mesh>(null)
  const r3 = useRef<THREE.Mesh>(null)
  useFrame((s) => {
    const t = s.clock.elapsedTime
    if (r1.current) { r1.current.rotation.z = t * 0.045; r1.current.rotation.x = Math.sin(t*0.16)*0.14; (r1.current.material as THREE.MeshBasicMaterial).opacity = 0.1+0.06*Math.sin(t*0.4) }
    if (r2.current) { r2.current.rotation.z = -t * 0.038; r2.current.rotation.y = t * 0.09; (r2.current.material as THREE.MeshBasicMaterial).opacity = 0.07+0.05*Math.sin(t*0.3+1.2) }
    if (r3.current) { r3.current.rotation.x = t * 0.028; r3.current.rotation.z = Math.sin(t*0.1)*0.2; (r3.current.material as THREE.MeshBasicMaterial).opacity = 0.05+0.03*Math.sin(t*0.25+2.4) }
  })
  return (
    <>
      <mesh ref={r1} rotation={[Math.PI/2, 0, 0]}>
        <torusGeometry args={[1.05, 0.009, 16, 90]} />
        <meshBasicMaterial color={CYAN} transparent opacity={0.12} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <mesh ref={r2} rotation={[Math.PI/3, 0.5, 0]}>
        <torusGeometry args={[1.1, 0.006, 12, 72]} />
        <meshBasicMaterial color={TEAL} transparent opacity={0.08} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <mesh ref={r3} rotation={[Math.PI/5, 1.2, 0.4]}>
        <torusGeometry args={[1.16, 0.004, 10, 56]} />
        <meshBasicMaterial color={LIME} transparent opacity={0.05} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
    </>
  )
}

/** Neural network inner wires */
function NeuralCore({ isLight }: { isLight: boolean }) {
  const lineRef = useRef<THREE.Line>(null)
  const nodesRef = useRef<THREE.Group>(null)
  const nodeCount = 16
  const nodes = useMemo(() => {
    return Array.from({ length: nodeCount }, (_, i) => {
      const t = (i / nodeCount) * Math.PI * 2 + 0.5
      const u = Math.acos(2 * (i / nodeCount) - 1) - Math.PI / 2
      return new THREE.Vector3(
        Math.cos(u) * Math.cos(t) * 0.45,
        Math.sin(u) * 0.45,
        Math.cos(u) * Math.sin(t) * 0.45
      )
    })
  }, [])
  const pairs = useMemo(() => {
    const p: [number,number][] = []
    for (let i = 0; i < nodes.length; i++)
      for (let j = i+1; j < nodes.length; j++)
        if (nodes[i].distanceTo(nodes[j]) < 0.52) p.push([i,j])
    return p
  }, [nodes])
  const linePos = useMemo(() => new Float32Array(pairs.flatMap(([a,b]) => [nodes[a].x,nodes[a].y,nodes[a].z,nodes[b].x,nodes[b].y,nodes[b].z])), [pairs,nodes])
  const lineOpacity = isLight ? 0.42 : 0.38

  useFrame((s) => {
    const t = s.clock.elapsedTime * 0.5
    if (lineRef.current?.material instanceof THREE.LineBasicMaterial)
      lineRef.current.material.opacity = Math.max(0.12, (0.42 + 0.5 * Math.sin(t) * Math.sin(t*0.65)) * lineOpacity)
    if (nodesRef.current)
      nodesRef.current.children.forEach((c, i) => {
        if (c instanceof THREE.Mesh && c.material instanceof THREE.MeshBasicMaterial) {
          c.material.opacity = Math.max(0.18, (0.45 + 0.5*Math.sin(t + i*0.55)**2) * (isLight ? 0.6 : 0.55))
          c.material.color.setStyle(i%3===0 ? TEAL : i%3===1 ? CYAN : LIME)
        }
      })
  })

  return (
    <group>
      <line ref={lineRef as any}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={linePos.length/3} array={linePos} itemSize={3} />
        </bufferGeometry>
        <lineBasicMaterial color={CYAN} transparent opacity={lineOpacity} />
      </line>
      <group ref={nodesRef}>
        {nodes.map((pos, i) => (
          <mesh key={i} position={[pos.x, pos.y, pos.z]}>
            <sphereGeometry args={[0.026, 10, 10]} />
            <meshBasicMaterial color={i%3===0 ? TEAL : i%3===1 ? CYAN : LIME} transparent opacity={0.55} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

/** Particle field */
function ParticleField({ isLight }: { isLight: boolean }) {
  const pts = useRef<THREE.Points>(null)
  const count = 240
  const positions = useMemo(() => {
    const p = new Float32Array(count*3)
    for (let i = 0; i < count; i++) {
      p[i*3]   = (Math.random()-0.5)*8
      p[i*3+1] = (Math.random()-0.5)*8
      p[i*3+2] = (Math.random()-0.5)*6
    }
    return p
  }, [])
  useFrame((s) => {
    if (pts.current) {
      pts.current.rotation.y = s.clock.elapsedTime * 0.012
      pts.current.rotation.x = Math.sin(s.clock.elapsedTime * 0.05) * 0.025
    }
  })
  return (
    <points ref={pts}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.018} color={CYAN} transparent opacity={isLight ? 0.1 : 0.16} sizeAttenuation />
    </points>
  )
}

/** Floating wireframe geometry satellites */
function FloatingSatellite({ color, orbitRadius, orbitSpeed, orbitOffset, size, geomType, isLight }:
  { color: string; orbitRadius: number; orbitSpeed: number; orbitOffset: number; size: number; geomType: 'box'|'icosa'|'tetra'; isLight: boolean }) {
  const group = useRef<THREE.Group>(null)
  const mesh  = useRef<THREE.Mesh>(null)
  useFrame((s) => {
    const t = s.clock.elapsedTime
    if (group.current) {
      group.current.position.x = Math.cos(t * orbitSpeed + orbitOffset) * orbitRadius
      group.current.position.z = Math.sin(t * orbitSpeed + orbitOffset) * orbitRadius
      group.current.position.y = Math.sin(t * orbitSpeed * 0.7 + orbitOffset * 1.3) * 0.35
    }
    if (mesh.current) {
      mesh.current.rotation.x += 0.008
      mesh.current.rotation.y += 0.012
      mesh.current.rotation.z += 0.005
    }
  })
  return (
    <group ref={group}>
      <mesh ref={mesh}>
        {geomType === 'box'   && <boxGeometry args={[size, size, size]} />}
        {geomType === 'icosa' && <icosahedronGeometry args={[size, 0]} />}
        {geomType === 'tetra' && <tetrahedronGeometry args={[size, 0]} />}
        <meshBasicMaterial color={color} transparent opacity={isLight ? 0.3 : 0.45} wireframe />
      </mesh>
      {/* Solid fill with low opacity */}
      <mesh>
        {geomType === 'box'   && <boxGeometry args={[size, size, size]} />}
        {geomType === 'icosa' && <icosahedronGeometry args={[size, 0]} />}
        {geomType === 'tetra' && <tetrahedronGeometry args={[size, 0]} />}
        <meshBasicMaterial color={color} transparent opacity={isLight ? 0.04 : 0.06} depthWrite={false} />
      </mesh>
    </group>
  )
}

/** Orbit particle ring */
function ParticleOrbitRing({ isLight }: { isLight: boolean }) {
  const ref = useRef<THREE.Points>(null)
  const count = 120
  const positions = useMemo(() => {
    const p = new Float32Array(count*3)
    const r = 1.04
    for (let i = 0; i < count; i++) {
      const t = (i/count)*Math.PI*2
      const scatter = (Math.random()-0.5)*0.04
      p[i*3]   = Math.cos(t)*r + scatter
      p[i*3+1] = scatter*0.5
      p[i*3+2] = Math.sin(t)*r + scatter
    }
    return p
  }, [])
  useFrame((s) => {
    if (ref.current) {
      ref.current.rotation.y = s.clock.elapsedTime * 0.02
      ref.current.rotation.x = Math.sin(s.clock.elapsedTime * 0.09) * 0.12;
      (ref.current.material as THREE.PointsMaterial).opacity = 0.06 + 0.04*Math.sin(s.clock.elapsedTime*0.3)
    }
  })
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.016} color={TEAL} transparent opacity={0.07} sizeAttenuation depthWrite={false} />
    </points>
  )
}

/** Data panel floating cards */
function DataPanel({ chartType, offset }: { chartType: 'line'|'bar'|'kpi'; offset: number }) {
  const group = useRef<THREE.Group>(null)
  const { camera } = useThree()
  useFrame((s) => {
    if (group.current) {
      const t = s.clock.elapsedTime * 0.14 + offset
      group.current.position.x = Math.cos(t) * 1.42
      group.current.position.z = Math.sin(t) * 1.42
      group.current.position.y = Math.sin(t * 0.6) * 0.2
      group.current.quaternion.copy(camera.quaternion)
    }
  })
  const linePts: [number,number,number][] = chartType==='line'
    ? [[0,0.3,0],[0.25,0.12,0],[0.5,-0.04,0],[0.75,0.22,0],[1,0.08,0]] : []
  const barSegs: [number,number,number][][] = chartType==='bar'
    ? [[[0.1,0,0],[0.1,0.38,0]],[[0.35,0,0],[0.35,0.22,0]],[[0.6,0,0],[0.6,0.34,0]],[[0.85,0,0],[0.85,0.18,0]]] : []

  return (
    <group ref={group}>
      <mesh>
        <planeGeometry args={[0.54, 0.35]} />
        <meshBasicMaterial color={DARK_BG} transparent opacity={0.78} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <lineLoop position={[0, 0, 0.02]}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={4}
            array={new Float32Array([0.27,0.175,0,-0.27,0.175,0,-0.27,-0.175,0,0.27,-0.175,0])} itemSize={3} />
        </bufferGeometry>
        <lineBasicMaterial color={CYAN} transparent opacity={0.28} />
      </lineLoop>
      <group position={[-0.22, 0, 0.01]} scale={[0.2, 0.2, 1]}>
        {chartType==='line' && <Line points={linePts} color={CYAN} lineWidth={1.3} transparent opacity={0.9} />}
        {chartType==='bar' && barSegs.map((seg, i) => (
          <Line key={i} points={seg} color={i%2===0 ? CYAN : TEAL} lineWidth={1} transparent opacity={0.85} />
        ))}
        {chartType==='kpi' && (
          <group>
            <mesh position={[0.5,0.1,0]}><planeGeometry args={[0.16,0.07]}/><meshBasicMaterial color={TEAL} transparent opacity={0.9}/></mesh>
            <mesh position={[0.5,-0.06,0]}><planeGeometry args={[0.09,0.045]}/><meshBasicMaterial color={CYAN} transparent opacity={0.7}/></mesh>
          </group>
        )}
      </group>
    </group>
  )
}

function GroundShadow({ isLight }: { isLight: boolean }) {
  return (
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,-1.05,0]}>
      <circleGeometry args={[1.25, 56]} />
      <meshBasicMaterial color={isLight ? LIGHT_BG : DARK_BG}
        transparent opacity={isLight ? 0.06 : 0.28} side={THREE.DoubleSide} depthWrite={false} />
    </mesh>
  )
}

function Scene({ theme, isMobile }: { theme: 'dark'|'light'; isMobile: boolean }) {
  const groupRef = useRef<THREE.Group>(null)
  const pl1 = useRef<THREE.PointLight>(null)
  const pl2 = useRef<THREE.PointLight>(null)
  const pl3 = useRef<THREE.PointLight>(null)
  const pl4 = useRef<THREE.PointLight>(null)
  const { pointer } = useThree()
  const isLight = theme === 'light'
  const fogColor = isLight ? LIGHT_BG : DARK_BG

  const pointerRef = useRef(new THREE.Vector2(0, 0))
  const hoverRef = useRef(0)

  useFrame(() => {
    pointerRef.current.lerp(pointer, 0.065)
    const dist = Math.sqrt(pointerRef.current.x**2 + pointerRef.current.y**2)
    const targetHover = isMobile ? 0 : Math.max(0, 1 - dist*2.0)
    hoverRef.current += (targetHover - hoverRef.current) * 0.05
    const h = hoverRef.current

    if (pl1.current) pl1.current.intensity = isLight ? 0.35 : 0.5 + h*0.12
    if (pl2.current) pl2.current.intensity = isLight ? 0.22 : 0.3 + h*0.08
    if (pl3.current) pl3.current.intensity = isLight ? 0.35 : 0.55 + h*0.1
    if (pl4.current) pl4.current.intensity = isLight ? 0.12 : 0.22 + h*0.06

    if (groupRef.current) {
      const tx = pointer.y * 0.14
      const ty = pointer.x * 0.14
      groupRef.current.rotation.x += (tx - groupRef.current.rotation.x) * 0.045
      groupRef.current.rotation.y += (ty - groupRef.current.rotation.y) * 0.045
      const s = 1 + h * 0.02
      groupRef.current.scale.lerp(new THREE.Vector3(s, s, s), 0.06)
    }
  })

  return (
    <>
      <fog attach="fog" args={[fogColor, 2.5, isLight ? 5.2 : 5.8]} />
      <ambientLight intensity={isLight ? 0.55 : 0.3} />
      <directionalLight position={[4, 5, 5]} intensity={isLight ? 1.1 : 1.2} />
      <pointLight ref={pl1} position={[-2.5, 2.5, 3.5]} intensity={isLight ? 0.35 : 0.5} color={CYAN} />
      <pointLight ref={pl2} position={[2.5, -1.5, 2.5]} intensity={isLight ? 0.22 : 0.3} color={TEAL} />
      <pointLight ref={pl3} position={[-1.2, 0.8, -2]} intensity={isLight ? 0.35 : 0.55} color={VIOLET} />
      <pointLight ref={pl4} position={[1.5, 2, -1.5]} intensity={isLight ? 0.12 : 0.22} color={LIME} />

      <ParticleField isLight={isLight} />

      <group ref={groupRef}>
        <EnergyRings isLight={isLight} />
        <GroundShadow isLight={isLight} />
        <FresnelRimOuter isLight={isLight} />
        <FresnelRim isLight={isLight} />
        <InnerCoreGlow isLight={isLight} />
        <TechGridOverlay isLight={isLight} />
        <GlassSphere isLight={isLight} hoverRef={hoverRef} />
        <NeuralCore isLight={isLight} />
        <ParticleOrbitRing isLight={isLight} />

        {/* Floating wireframe satellites */}
        {!isMobile && (
          <>
            <FloatingSatellite color={CYAN}   orbitRadius={1.55} orbitSpeed={0.18} orbitOffset={0}    size={0.1}  geomType="box"   isLight={isLight} />
            <FloatingSatellite color={TEAL}   orbitRadius={1.72} orbitSpeed={0.14} orbitOffset={2.1}  size={0.09} geomType="icosa" isLight={isLight} />
            <FloatingSatellite color={LIME}   orbitRadius={1.62} orbitSpeed={0.22} orbitOffset={4.2}  size={0.08} geomType="tetra" isLight={isLight} />
            <FloatingSatellite color={VIOLET} orbitRadius={1.80} orbitSpeed={0.11} orbitOffset={1.05} size={0.07} geomType="box"   isLight={isLight} />
            <FloatingSatellite color={CYAN}   orbitRadius={1.68} orbitSpeed={0.16} orbitOffset={3.6}  size={0.06} geomType="icosa" isLight={isLight} />
          </>
        )}

        {/* Data panels */}
        <DataPanel chartType="line" offset={0} />
        <DataPanel chartType="bar"  offset={1.3} />
        <DataPanel chartType="kpi"  offset={2.6} />
        <DataPanel chartType="line" offset={4.0} />
        <DataPanel chartType="bar"  offset={5.3} />
      </group>
    </>
  )
}

export default function Hero3D({ theme = 'dark' }: { theme?: 'dark'|'light' }) {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 768px)')
    const fn = () => setIsMobile(mql.matches)
    fn()
    mql.addEventListener('change', fn)
    return () => mql.removeEventListener('change', fn)
  }, [])

  return (
    <div className="hero-3d-canvas-wrapper absolute inset-0 z-0 overflow-hidden">
      {typeof window !== 'undefined' && (
        <Canvas camera={{ position: [0, 0, 3.1], fov: 44 }} dpr={[1, 1.6]} gl={{ antialias: true, alpha: true }}>
          <Scene theme={theme} isMobile={isMobile} />
        </Canvas>
      )}
    </div>
  )
}
