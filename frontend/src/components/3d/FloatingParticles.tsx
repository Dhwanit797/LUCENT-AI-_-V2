import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const COUNT = 60

export default function FloatingParticles() {
  const points = useRef<THREE.Points>(null)
  const positions = useMemo(() => {
    const pos = new Float32Array(COUNT * 3)
    for (let i = 0; i < COUNT * 3; i += 3) {
      pos[i] = (Math.random() - 0.5) * 20
      pos[i + 1] = (Math.random() - 0.5) * 20
      pos[i + 2] = (Math.random() - 0.5) * 10
    }
    return pos
  }, [])

  useFrame((state) => {
    if (!points.current) return
    points.current.rotation.y = state.clock.elapsedTime * 0.02
  })

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={COUNT}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.08}
        color="#3b82f6"
        transparent
        opacity={0.4}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  )
}
