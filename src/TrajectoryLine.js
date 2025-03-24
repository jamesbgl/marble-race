import * as THREE from 'three'
import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'

export default function TrajectoryLine({ aimDirection, visible }) {
  const line = useRef()
  const points = useMemo(() => {
    const linePoints = []
    const segments = 60 // Increased number of segments for longer line
    const segmentLength = 1.5 // Increased length of each segment
    const launchSpeed = 30 // Should match the minimum launch speed in Player.js
    const launchAngle = aimDirection * Math.PI / 6
    
    // Initial velocity components
    const velocityX = Math.sin(launchAngle) * launchSpeed
    const velocityZ = -Math.cos(launchAngle) * launchSpeed
    
    // Create points for the trajectory line
    for (let i = 0; i < segments; i++) {
      const t = i * segmentLength // Time parameter
      const x = velocityX * t
      const z = velocityZ * t
      linePoints.push(new THREE.Vector3(x, 0.5, z)) // Raised height from 0.3 to 0.5
    }
    
    return linePoints
  }, [aimDirection])

  // Update line geometry when points change
  useEffect(() => {
    if (line.current) {
      line.current.geometry.setFromPoints(points)
    }
  }, [points])

  return (
    <>
      {/* Main bright line */}
      <line ref={line} visible={visible}>
        <bufferGeometry />
        <lineBasicMaterial 
          color="#FF0000" 
          opacity={0.9}  // Increased opacity
          transparent={true} 
          linewidth={4}
        />
      </line>
      {/* Outer glow effect */}
      <line visible={visible}>
        <bufferGeometry points={points} />
        <lineBasicMaterial 
          color="#FF3333" 
          opacity={0.6}  // Increased opacity
          transparent={true} 
          linewidth={8}
        />
      </line>
    </>
  )
} 