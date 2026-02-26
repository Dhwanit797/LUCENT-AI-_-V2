import { useRef, useState, useEffect, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/** Floating data orbs — AI / digital commerce vibe */
function DataOrbs() {
  const group = useRef<THREE.Group>(null)
  const count = 24
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 3
      pos[i * 3 + 1] = (Math.random() - 0.5) * 2
      pos[i * 3 + 2] = (Math.random() - 0.5) * 2
    }
    return pos
  }, [])

  useFrame((state) => {
    if (!group.current) return
    group.current.rotation.y = state.clock.elapsedTime * 0.06
  })

  return (
    <group ref={group} position={[0, 0, -1.5]}>
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={count}
            array={positions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.06}
          color="#3b82f6"
          transparent
          opacity={0.5}
          sizeAttenuation
          depthWrite={false}
        />
      </points>
    </group>
  )
}

/** Simple building/city block */
function CityBlock({ position, scale }: { position: [number, number, number]; scale: number }) {
  const mesh = useRef<THREE.Mesh>(null)
  useFrame((state) => {
    if (mesh.current) mesh.current.rotation.y = state.clock.elapsedTime * 0.02
  })
  return (
    <mesh ref={mesh} position={position} castShadow>
      <boxGeometry args={[0.4 * scale, 0.6 * scale, 0.3 * scale]} />
      <meshStandardMaterial color="#1e293b" roughness={0.7} metalness={0.1} />
    </mesh>
  )
}

function LoginSceneContent() {
  const [mouse, setMouse] = useState({ x: 0, y: 0 })
  const group = useRef<THREE.Group>(null)

  useEffect(() => {
    function onMove(e: MouseEvent) {
      setMouse({
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: -(e.clientY / window.innerHeight) * 2 + 1,
      })
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  useFrame((_, delta) => {
    if (!group.current) return
    group.current.rotation.y += (mouse.x * 0.2 - group.current.rotation.y) * delta * 2
    group.current.rotation.x += (mouse.y * 0.1 - group.current.rotation.x) * delta * 2
  })

  return (
    <>
      <ambientLight intensity={0.45} />
      <directionalLight position={[3, 2, 5]} intensity={1} />
      <pointLight position={[-2, 1, 3]} intensity={0.4} color="#6366f1" />
      <DataOrbs />
      <group ref={group}>
        <CityBlock position={[0, 0, 0]} scale={1.2} />
        <CityBlock position={[0.6, -0.1, -0.3]} scale={0.8} />
        <CityBlock position={[-0.5, 0.05, -0.2]} scale={0.9} />
      </group>
    </>
  )
}

export default function SceneLogin() {
  return (
    <div className="absolute inset-0">
      <Canvas
        camera={{ position: [0, 0, 4.5], fov: 50 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
      >
        <LoginSceneContent />
      </Canvas>
    </div>
  )
}
