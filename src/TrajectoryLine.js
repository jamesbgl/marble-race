import * as THREE from 'three'
import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'

export default function TrajectoryLine({ aimDirection, visible }) {
  const line = useRef()
  const points = useMemo(() => {
    const linePoints = []
    const segments = 50 // Number of segments in the line
    const segmentLength = 0.2 // Length of each segment
    const launchSpeed = 15 // Should match the launch speed in Player.js
    const launchAngle = aimDirection * Math.PI / 6
    
    // Initial velocity components
    const velocityX = Math.sin(launchAngle) * launchSpeed
    const velocityZ = -Math.cos(launchAngle) * launchSpeed
    
    // Create points for the dotted line
    for (let i = 0; i < segments; i++) {
      const t = i * segmentLength // Time parameter
      const x = velocityX * t
      const z = velocityZ * t
      
      // Add point if it should be visible (creating dotted effect)
      if (i % 2 === 0) {
        linePoints.push(new THREE.Vector3(x, 0.3, z))
      }
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
    <line ref={line} visible={visible}>
      <bufferGeometry />
      <lineBasicMaterial color="white" opacity={0.5} transparent={true} linewidth={1} />
    </line>
  )
} 