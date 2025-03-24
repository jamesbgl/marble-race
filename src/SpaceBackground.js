import { useRef, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

function ShootingStar({ onComplete }) {
  const ref = useRef()
  const [visible, setVisible] = useState(true)
  
  // Random starting position and direction
  const startPos = useRef(new THREE.Vector3(
    (Math.random() - 0.5) * 100,
    50 + Math.random() * 50,
    -50 - Math.random() * 50
  ))
  
  const direction = useRef(new THREE.Vector3(
    (Math.random() - 0.5) * 2,
    -1,
    (Math.random() - 0.5) * 2
  ).normalize())
  
  const speed = 40 + Math.random() * 60
  const lifetime = useRef(0)
  
  useFrame((state, delta) => {
    if (!ref.current || !visible) return
    
    lifetime.current += delta
    
    // Move the shooting star
    ref.current.position.addScaledVector(direction.current, speed * delta)
    
    // Fade out after 1 second
    if (lifetime.current > 1) {
      setVisible(false)
      onComplete()
    }
  })
  
  return visible ? (
    <group ref={ref} position={startPos.current}>
      {/* The shooting star trail */}
      <mesh>
        <boxGeometry args={[0.1, 2, 0.1]} />
        <meshBasicMaterial color="#FFFFFF" transparent opacity={0.8} />
      </mesh>
      {/* The bright head of the shooting star */}
      <pointLight color="#FFFFFF" intensity={2} distance={10} />
      <mesh position={[0, 1, 0]}>
        <sphereGeometry args={[0.2, 8, 8]} />
        <meshBasicMaterial color="#FFFFFF" />
      </mesh>
    </group>
  ) : null
}

export default function SpaceBackground() {
  const starsRef = useRef()
  const [shootingStars, setShootingStars] = useState([])
  const nextStarId = useRef(1)
  
  // Generate random stars
  const starCount = 2000
  const positions = new Float32Array(starCount * 3)
  const colors = new Float32Array(starCount * 3)
  
  for (let i = 0; i < starCount; i++) {
    const i3 = i * 3
    // Position stars in a large sphere around the scene
    const radius = 50 + Math.random() * 100
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos((Math.random() * 2) - 1)
    
    positions[i3] = radius * Math.sin(phi) * Math.cos(theta)
    positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
    positions[i3 + 2] = radius * Math.cos(phi)
    
    // Randomize star colors between white and light blue
    const colorIntensity = 0.5 + Math.random() * 0.5
    colors[i3] = colorIntensity
    colors[i3 + 1] = colorIntensity
    colors[i3 + 2] = colorIntensity + Math.random() * 0.2
  }

  // Randomly add shooting stars
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() < 0.3) { // 30% chance every 2 seconds
        setShootingStars(stars => [...stars, { id: nextStarId.current }])
        nextStarId.current++
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  useFrame((state) => {
    if (starsRef.current) {
      // Slowly rotate the stars
      starsRef.current.rotation.y += 0.0001
      starsRef.current.rotation.x += 0.0001
    }
  })

  const removeShootingStar = (id) => {
    setShootingStars(stars => stars.filter(star => star.id !== id))
  }

  return (
    <>
      {/* Dark space background */}
      <color attach="background" args={['#000005']} />
      <fog attach="fog" args={['#000005', 100, 200]} />
      
      {/* Star field */}
      <points ref={starsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={positions.length / 3}
            array={positions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            count={colors.length / 3}
            array={colors}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.2}
          vertexColors
          transparent
          opacity={0.8}
          sizeAttenuation={true}
        />
      </points>

      {/* Shooting stars */}
      {shootingStars.map(star => (
        <ShootingStar 
          key={star.id} 
          onComplete={() => removeShootingStar(star.id)}
        />
      ))}
    </>
  )
} 