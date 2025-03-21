import * as THREE from 'three'
import { CuboidCollider, RigidBody } from '@react-three/rapier'
import { Float, Text, useGLTF, useTexture } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef, useState, useMemo } from 'react'
import { EffectComposer, DepthOfField } from '@react-three/postprocessing'
import useGame from './stores/useGame.js'

THREE.ColorManagement.legacyMode = false

const boxGeometry = new THREE.BoxGeometry(1, 1, 1)
const plainMaterial = new THREE.MeshStandardMaterial({
  color: '#FFFFFF',
  metalness: 0,
  roughness: 0,
})
const wallMaterial = new THREE.MeshStandardMaterial({
  color: '#887777',
  metalness: 0,
  roughness: 0,
})

// Define multiplier segments (from the image)
const multiplierSegments = [
  { value: 0.2, color: '#1E1E1E', textColor: '#4ADE80' },
  { value: 0.4, color: '#1E1E1E', textColor: '#4ADE80' },
  { value: 0.8, color: '#1E1E1E', textColor: '#4ADE80' },
  { value: 1.5, color: '#1E1E1E', textColor: '#4ADE80' },
  { value: 4, color: '#1E1E1E', textColor: '#4ADE80' },
  { value: 12, color: '#86EFAC', textColor: 'black' }, // Mint green
  { value: 80, color: '#ECFCCB', textColor: 'black' }, // Yellow-green
  { value: 0.2, color: '#1E1E1E', textColor: '#4ADE80' },
  { value: 20, color: '#8B5CF6', textColor: 'white' },
  { value: 0.4, color: '#1E1E1E', textColor: '#4ADE80' },
  { value: 50, color: '#8B5CF6', textColor: 'white' }, // Purple
  { value: 0.8, color: '#1E1E1E', textColor: '#4ADE80' }, // Dark with neon green text
  { value: 100, color: '#FF7F5C', textColor: 'white' } // Orange
]

function BlockStart({ position = [0, 0, 0] }) {
  const texture = useTexture('/marble-race/Logo_tagline.svg')
  texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping
  texture.minFilter = THREE.LinearFilter
  texture.magFilter = THREE.LinearFilter
  
  return (
    <group position={position}>
      <Float floatIntensity={0.25} rotationIntensity={0.25}>
        <Text
          font='/marble-race/fonts/MIDNIGHT-SANS-ST-48-HEAVY-TRIAL.woff'
          scale={3}
          maxWidth={0.25}
          lineHeight={0.75}
          textAlign='right'
          position={[0.75, 0.7, 0]}
          rotation-y={-0.25}
        >
          CRAZY 
          <meshBasicMaterial toneMapped={false} />
        </Text>
        <Text
          font='/marble-race/fonts/MIDNIGHT-SANS-ST-48-HEAVY-TRIAL.woff'
          scale={1.75}
          maxWidth={0.25}
          lineHeight={0.75}
          textAlign='right'
          position={[0.85, 0.485, 0]}
          rotation-y={-0.25}
        >
           MARBLES
          <meshBasicMaterial toneMapped={false} />
        </Text>
      </Float>
      
      {/* Base floor with color */}
      <mesh
        geometry={boxGeometry}
        material={new THREE.MeshPhongMaterial({ 
          color: '#300931',
          shininess: 60
        })}
        position-y={-0.1}
        scale={[8, 0.2, 16]}
      />
      
      {/* SVG overlay */}
      <mesh
        position={[0, 0.01, -4]}
        rotation-x={-Math.PI / 2}
      >
        <planeGeometry args={[6, 0.496]} />
        <meshBasicMaterial
          map={texture}
          transparent={true}
          opacity={0.9}
          depthWrite={true}
          depthTest={true}
          side={THREE.DoubleSide}
          alphaTest={0.1}
        />
      </mesh>
    </group>
  )
}

function MultiplierSegment({ position, value, color, textColor, segmentLength, isActive }) {
  const [isHit, setIsHit] = useState(false)
  const materialRef = useRef()

  // Create a brighter color for the hit state
  const brightColor = useMemo(() => {
    const color3 = new THREE.Color(color)
    color3.multiplyScalar(1.4) // Make it 40% brighter
    return color3
  }, [color])

  // Create active color (red)
  const activeColor = useMemo(() => {
    return new THREE.Color('#ff0000')
  }, [])

  // Simplified component without collision detection
  return (
    <group position={position}>
      <mesh
        geometry={boxGeometry}
        position-y={-0.1}
        scale={[8, 0.2, segmentLength]}
        receiveShadow
      >
        <meshPhongMaterial
          ref={materialRef}
          color={isActive ? activeColor : (isHit ? brightColor : color)}
          shininess={60}
          specular={new THREE.Color(0x444444)}
        />
      </mesh>
      <Text
        font='/marble-race/fonts/MIDNIGHT-SANS-ST-24-HEAVY-TRIAL.woff'
        scale={3.2}
        position={[0, 0.01, 0]}
        rotation-x={-Math.PI / 2}
        fontSize={1}
        maxWidth={4}
        textAlign="center"
      >
        {value}x
        <meshBasicMaterial toneMapped={false} color={textColor} />
      </Text>
    </group>
  )
}

function TrackSegments() {
  const segmentLength = 16 // Each segment is 16 units long
  const setCurrentMultiplier = useGame((state) => state.setCurrentMultiplier)
  const phase = useGame((state) => state.phase)
  const [activeSegment, setActiveSegment] = useState(-1)

  // Track the marble's position and update the multiplier
  useFrame((state) => {
    if (phase === 'playing') {
      const marble = state.scene.getObjectByName('marble')
      if (marble) {
        // Get the marble's Z position (negated because track goes in negative Z)
        const marbleZ = -marble.position.z
        
        // First segment starts at z=-16, each segment is 16 units
        // If marble is at z=-20, that's 4 units into first segment (index 0)
        // If marble is at z=-36, that's 4 units into second segment (index 1)
        const segmentIndex = Math.floor((marbleZ - 8) / segmentLength)

        // Debug logging
        console.log({
          marbleZ,
          segmentIndex,
          value: segmentIndex >= 0 && segmentIndex < multiplierSegments.length ? 
            multiplierSegments[segmentIndex].value : 'out of bounds'
        })
        
        if (segmentIndex >= 0 && segmentIndex < multiplierSegments.length) {
          const currentValue = multiplierSegments[segmentIndex].value
          setCurrentMultiplier(currentValue)
          setActiveSegment(segmentIndex)
        } else {
          setActiveSegment(-1)
          setCurrentMultiplier(0)
        }
      }
    } else {
      setActiveSegment(-1)
      setCurrentMultiplier(0)
    }
  })

  return (
    <group position={[0, 0, -16]}>
      {multiplierSegments.map((segment, index) => (
        <MultiplierSegment
          key={index}
          position={[0, 0, -(index * segmentLength)]}
          value={segment.value}
          color={segment.color}
          textColor={segment.textColor}
          segmentLength={segmentLength}
          isActive={index === activeSegment}
        />
      ))}
    </group>
  )
}

function Bounds({ length = 1 }) {
  const segmentLength = 16 // Each segment is 16 units long

  return (
    <>
      <RigidBody type='fixed' restitution={0.2} friction={0}>
        {/* Left wall segments */}
        {multiplierSegments.map((segment, index) => (
          <mesh
            key={`left-${index}`}
            position={[4.15, 0.15, -(index * segmentLength + 16)]}
            geometry={boxGeometry}
            material={new THREE.MeshStandardMaterial({
              color: segment.color,
              metalness: 0.3,
              roughness: 0.4,
              envMapIntensity: 0.5
            })}
            scale={[0.3, 0.3, segmentLength]}
            castShadow
          />
        ))}

        {/* Right wall segments */}
        {multiplierSegments.map((segment, index) => (
          <mesh
            key={`right-${index}`}
            position={[-4.15, 0.15, -(index * segmentLength + 16)]}
            geometry={boxGeometry}
            material={new THREE.MeshStandardMaterial({
              color: segment.color,
              metalness: 0.3,
              roughness: 0.4,
              envMapIntensity: 0.5
            })}
            scale={[0.3, 0.3, segmentLength]}
            receiveShadow
          />
        ))}

        {/* End wall */}
        <mesh
          position={[0, 0.15, -(length * 16) + 2]}
          geometry={boxGeometry}
          material={new THREE.MeshStandardMaterial({
            color: multiplierSegments[multiplierSegments.length - 1].color,
            metalness: 0.3,
            roughness: 0.4,
            envMapIntensity: 0.5
          })}
          scale={[8, 0.3, 0.3]}
          receiveShadow
        />

        {/* Floor collider */}
        <CuboidCollider
          args={[4, 0.1, 16 * length]}
          position={[0, -0.1, -(length * 8) + 2]}
          restitution={0.2}
          friction={1}
        />
      </RigidBody>
    </>
  )
}

function MovingWall({ position, range, speed, horizontal = true }) {
  const wall = useRef()
  const timeOffset = useRef(Math.random() * Math.PI * 2)

  useFrame((state) => {
    if (wall.current) {
      const time = state.clock.getElapsedTime()
      const offset = Math.sin(time * speed + timeOffset.current)
      
      if (horizontal) {
        wall.current.setNextKinematicTranslation({
          x: position[0] + offset * range,
          y: position[1],
          z: position[2]
        })
      } else {
        wall.current.setNextKinematicTranslation({
          x: position[0],
          y: position[1] + offset * range,
          z: position[2]
        })
      }
    }
  })

  return (
    <RigidBody ref={wall} type="kinematicPosition" restitution={0.2} friction={0}>
      <mesh
        geometry={boxGeometry}
        material={new THREE.MeshPhongMaterial({
          color: '#FF0060',
          shininess: 60,
          specular: new THREE.Color(0x444444)
        })}
        scale={[0.3, 0.8, 2]}
        castShadow
      />
    </RigidBody>
  )
}

function SpinningWall({ position, speed }) {
  const wall = useRef()
  const timeOffset = useRef(Math.random() * Math.PI * 2)

  useFrame((state) => {
    if (wall.current) {
      const time = state.clock.getElapsedTime()
      const rotation = new THREE.Quaternion()
      rotation.setFromEuler(new THREE.Euler(0, (time * speed + timeOffset.current), 0))
      wall.current.setNextKinematicRotation(rotation)
    }
  })

  return (
    <RigidBody ref={wall} type="kinematicPosition" restitution={0.2} friction={0} position={position}>
      <mesh
        geometry={boxGeometry}
        material={new THREE.MeshPhongMaterial({
          color: '#9333EA',
          shininess: 60,
          specular: new THREE.Color(0x444444)
        })}
        scale={[3, 0.8, 0.3]}
        castShadow
      />
    </RigidBody>
  )
}

function MovingObstacles() {
  const segmentLength = 16
  
  // Generate random x positions for spinning walls between -3 and 3
  const spinningWallsX = useMemo(() => {
    return Array(4).fill(0).map(() => (Math.random() * 4 - 2)) // Reduced range to keep walls more centered
  }, [])
  
  // Calculate z positions to be evenly distributed across multiplier segments
  // First multiplier segment starts at z=-16, and each is 16 units long
  // We have 13 multiplier segments, so we'll distribute the spinning walls across this range
  const totalLength = multiplierSegments.length * segmentLength
  const spacing = totalLength / 5 // Divide the track into 5 sections to place 4 walls
  
  return (
    <>
      {/* Existing horizontal moving walls */}
      <MovingWall 
        position={[0, 0.5, -32]} 
        range={3} 
        speed={0.8}
        horizontal={true}
      />
      <MovingWall 
        position={[0, 0.5, -48]} 
        range={3.2} 
        speed={1.2}
        horizontal={true}
      />
      <MovingWall 
        position={[0, 0.5, -64]} 
        range={2} 
        speed={0.3}
        horizontal={true}
      />
      <MovingWall 
        position={[0, 0.5, -96]} 
        range={3.3} 
        speed={0.5}
        horizontal={true}
      />
      <MovingWall 
        position={[0, 0.5, -128]} 
        range={3} 
        speed={1.5}
        horizontal={true}
      />
      <MovingWall 
        position={[0, 0.5, -160]} 
        range={2.8} 
        speed={2}
        horizontal={true}
      />

      {/* Spinning walls - evenly distributed across multiplier segments */}
      <SpinningWall 
        position={[spinningWallsX[0], 0.5, -(32 + spacing)]} 
        speed={2}
      />
      <SpinningWall 
        position={[spinningWallsX[1], 0.5, -(32 + spacing * 2)]} 
        speed={-2.5}
      />
      <SpinningWall 
        position={[spinningWallsX[2], 0.5, -(32 + spacing * 3)]} 
        speed={3}
      />
      <SpinningWall 
        position={[spinningWallsX[3], 0.5, -(32 + spacing * 4)]} 
        speed={-2.2}
      />
    </>
  )
}

export function Level() {
  // Calculate total segments: 1 start segment + multiplier segments
  const totalSegments = 1 + multiplierSegments.length
  
  return (
    <>
      <color attach="background" args={['#130413']} />
      <ambientLight intensity={0.75} />
      <EffectComposer>
        <DepthOfField
          focusDistance={0.01}
          focalLength={0.2}
          bokehScale={3}
        />
      </EffectComposer>
      <BlockStart position={[0, 0, 0]} />
      <TrackSegments />
      <MovingObstacles />
      <Bounds length={totalSegments} />
    </>
  )
}
