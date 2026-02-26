import { Suspense, useState, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import BusinessModel from './BusinessModel'
import FloatingParticles from './FloatingParticles'

function SceneContent({ scrollProgress }: { scrollProgress: number }) {
  const [mouse, setMouse] = useState({ x: 0, y: 0 })

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

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[2, 2, 2]} intensity={1.2} />
      <directionalLight position={[-2, 1, -1]} intensity={0.4} />
      <FloatingParticles />
      <BusinessModel
        mouseX={mouse.x}
        mouseY={mouse.y}
        scrollProgress={scrollProgress}
        scale={1.2}
      />
    </>
  )
}

interface SceneLandingProps {
  scrollProgress: number
}

export default function SceneLanding({ scrollProgress }: SceneLandingProps) {
  return (
    <div className="absolute inset-0">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
      >
        <Suspense fallback={null}>
          <SceneContent scrollProgress={scrollProgress} />
        </Suspense>
      </Canvas>
    </div>
  )
}
