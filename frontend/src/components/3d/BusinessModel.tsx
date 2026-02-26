import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * Simple 3D building/shop from primitives — rotates with mouse, reacts to scroll via props
 */
interface BusinessModelProps {
  mouseX: number
  mouseY: number
  scrollProgress: number
  scale?: number
}

export default function BusinessModel({ mouseX, mouseY, scrollProgress, scale = 1 }: BusinessModelProps) {
  const group = useRef<THREE.Group>(null)

  useFrame(() => {
    if (!group.current) return
    // Subtle rotation following mouse
    group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, mouseX * 0.3, 0.05)
    group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, mouseY * 0.2, 0.05)
    // Slight idle rotation
    group.current.rotation.y += 0.002
  })

  // Scale and position from scroll (parent can pass scrollProgress 0..1)
  const s = scale * (1 - scrollProgress * 0.5)
  const opacity = 1 - scrollProgress * 0.8

  return (
    <group ref={group} scale={s}>
      {/* Base / floor */}
      <mesh position={[0, -0.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.2, 0.1, 1.8]} />
        <meshStandardMaterial color="#1e293b" roughness={0.8} metalness={0.1} />
      </mesh>
      {/* Main building box */}
      <mesh position={[0, 0.3, 0]} castShadow>
        <boxGeometry args={[1.8, 1, 1.4]} />
        <meshStandardMaterial
          color="#334155"
          roughness={0.6}
          metalness={0.2}
          transparent
          opacity={opacity}
        />
      </mesh>
      {/* Roof */}
      <mesh position={[0, 0.95, 0]} castShadow>
        <coneGeometry args={[1.2, 0.5, 4]} />
        <meshStandardMaterial color="#475569" roughness={0.7} metalness={0.1} />
      </mesh>
      {/* Door */}
      <mesh position={[0, -0.05, 0.71]} castShadow>
        <boxGeometry args={[0.4, 0.5, 0.05]} />
        <meshStandardMaterial color="#0f172a" roughness={0.5} />
      </mesh>
      {/* Window left */}
      <mesh position={[-0.4, 0.2, 0.71]} castShadow>
        <boxGeometry args={[0.3, 0.25, 0.05]} />
        <meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={0.3} />
      </mesh>
      {/* Window right */}
      <mesh position={[0.4, 0.2, 0.71]} castShadow>
        <boxGeometry args={[0.3, 0.25, 0.05]} />
        <meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={0.3} />
      </mesh>
    </group>
  )
}
