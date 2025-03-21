import * as THREE from 'three'
import { CuboidCollider, RigidBody } from '@react-three/rapier'
import { Float, Text, useGLTF, useTexture } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef, useState, useMemo, useEffect } from 'react'
import { EffectComposer, DepthOfField } from '@react-three/postprocessing'
import useGame from './stores/useGame.js'

THREE.ColorManagement.legacyMode = false

const boxGeometry = new THREE.BoxGeometry(1, 1, 1)
const cylinderGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.3, 32)
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

// Game constants
const SEGMENT_LENGTH = 16 // Length of each track segment

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

// Create audio context and sounds
let audioContext
let pingBuffer
let audioSources = []

// Initialize audio with pre-created sources
const initAudio = async () => {
  audioContext = new (window.AudioContext || window.webkitAudioContext)()
  
  // Create a simple "ping" sound
  const sampleRate = audioContext.sampleRate
  const duration = 0.08 // Reduced from 0.1 to 0.08 for snappier response
  const numSamples = duration * sampleRate
  
  // Create an empty audio buffer
  pingBuffer = audioContext.createBuffer(1, numSamples, sampleRate)
  const channelData = pingBuffer.getChannelData(0)
  
  // Generate a simple sine wave with faster exponential decay
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate
    channelData[i] = Math.sin(2 * Math.PI * 440 * t) * Math.exp(-20 * t) // Increased decay rate
  }

  // Pre-create a pool of audio sources
  for (let i = 0; i < 3; i++) {
    const source = audioContext.createBufferSource()
    const gainNode = audioContext.createGain()
    source.buffer = pingBuffer
    source.connect(gainNode)
    gainNode.connect(audioContext.destination)
    audioSources.push({ source, gainNode, inUse: false })
  }
}

// Function to play the ping sound with a specific pitch
const playPing = (multiplier) => {
  if (!audioContext) return

  // Find an available source from the pool
  const audioSource = audioSources.find(s => !s.inUse)
  if (!audioSource) return // All sources are in use

  // Mark the source as in use
  audioSource.inUse = true

  // Create a new source (since sources can only be played once)
  const newSource = audioContext.createBufferSource()
  newSource.buffer = pingBuffer
  
  // Map multiplier to pitch (higher multiplier = higher pitch)
  // Base frequency for 1x multiplier is 440Hz
  // Log scale for better sound distribution
  const pitch = 1 + Math.log2(multiplier) * 0.5
  newSource.playbackRate.value = pitch
  
  // Reuse the gain node
  audioSource.gainNode.gain.value = 0.2 // Slightly reduced volume
  
  // Connect the new source
  newSource.connect(audioSource.gainNode)
  
  // Play immediately
  newSource.start(0)
  
  // Clean up after the sound plays
  newSource.onended = () => {
    audioSource.inUse = false
    audioSource.source = newSource
  }
}

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
           PINBALL
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
  const setCurrentMultiplier = useGame((state) => state.setCurrentMultiplier)
  const phase = useGame((state) => state.phase)
  const [activeSegment, setActiveSegment] = useState(-1)
  const lastSegment = useRef(-1)
  const lastPlayTime = useRef(0)

  // Initialize audio on component mount
  useEffect(() => {
    initAudio()
    return () => {
      // Cleanup audio context on unmount
      if (audioContext) {
        audioContext.close()
      }
    }
  }, [])

  // Track the marble's position and update the multiplier
  useFrame((state) => {
    if (phase === 'playing') {
      const marble = state.scene.getObjectByName('marble')
      if (marble) {
        const marbleZ = -marble.position.z
        const segmentIndex = Math.floor((marbleZ - 8) / SEGMENT_LENGTH)
        
        if (segmentIndex >= 0 && segmentIndex < multiplierSegments.length) {
          const currentValue = multiplierSegments[segmentIndex].value
          setCurrentMultiplier(currentValue)
          setActiveSegment(segmentIndex)
          
          // Play sound when entering a new segment, with debounce
          if (segmentIndex !== lastSegment.current) {
            const now = performance.now()
            if (now - lastPlayTime.current > 50) { // Debounce threshold of 50ms
              playPing(currentValue)
              lastPlayTime.current = now
            }
            lastSegment.current = segmentIndex
          }
        } else {
          setActiveSegment(-1)
          setCurrentMultiplier(0)
          lastSegment.current = -1
        }
      }
    } else {
      setActiveSegment(-1)
      setCurrentMultiplier(0)
      lastSegment.current = -1
    }
  })

  return (
    <group position={[0, 0, -16]}>
      {multiplierSegments.map((segment, index) => (
        <MultiplierSegment
          key={index}
          position={[0, 0, -(index * SEGMENT_LENGTH)]}
          value={segment.value}
          color={segment.color}
          textColor={segment.textColor}
          segmentLength={SEGMENT_LENGTH}
          isActive={index === activeSegment}
        />
      ))}
    </group>
  )
}

function Bounds({ length = 1 }) {
  const totalLength = multiplierSegments.length * SEGMENT_LENGTH
  const spacing = totalLength / 5
  
  return (
    <>
      <RigidBody type='fixed' restitution={0.2} friction={0}>
        {/* Left wall segments */}
        {multiplierSegments.map((segment, index) => (
          <mesh
            key={`left-${index}`}
            position={[4.15, 0.15, -(index * SEGMENT_LENGTH + 16)]}
            geometry={boxGeometry}
            material={new THREE.MeshStandardMaterial({
              color: segment.color,
              metalness: 0.3,
              roughness: 0.4,
              envMapIntensity: 0.5
            })}
            scale={[0.3, 0.3, SEGMENT_LENGTH]}
            castShadow
          />
        ))}

        {/* Right wall segments */}
        {multiplierSegments.map((segment, index) => (
          <mesh
            key={`right-${index}`}
            position={[-4.15, 0.15, -(index * SEGMENT_LENGTH + 16)]}
            geometry={boxGeometry}
            material={new THREE.MeshStandardMaterial({
              color: segment.color,
              metalness: 0.3,
              roughness: 0.4,
              envMapIntensity: 0.5
            })}
            scale={[0.3, 0.3, SEGMENT_LENGTH]}
            receiveShadow
          />
        ))}

        {/* End wall */}
        <mesh
          position={[0, 0.15, -(length * SEGMENT_LENGTH) + 2]}
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
          args={[4, 0.1, SEGMENT_LENGTH * length]}
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

// Geometry for bollards
const bollardGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.3, 32)

function Bollard({ position, speed }) {
  const bollard = useRef()
  const timeOffset = useRef(Math.random() * Math.PI * 2)

  useFrame((state) => {
    if (bollard.current) {
      const time = state.clock.getElapsedTime()
      // Modified sine wave to create longer "down" time
      const wave = Math.sin(time * speed + timeOffset.current)
      // Only rise up if wave is above 0.5, creating longer down time
      const offset = wave > 0.5 ? (wave - 0.5) * 2 : 0
      
      bollard.current.setNextKinematicTranslation({
        x: position[0],
        y: 0.01 + offset * 0.4, // Keep slightly above ground when down, rise up to 0.41
        z: position[2]
      })
    }
  })

  return (
    <RigidBody ref={bollard} type="kinematicPosition" restitution={0.2} friction={0}>
      <mesh
        geometry={bollardGeometry}
        material={new THREE.MeshPhongMaterial({
          color: '#22c55e',
          shininess: 60,
          specular: new THREE.Color(0x444444)
        })}
        castShadow
      />
    </RigidBody>
  )
}

function BollardRow({ zPosition, count = 3, speed }) {
  const positions = useMemo(() => {
    // Generate random x positions between -2.5 and 2.5, but ensure they're spread out
    const spacing = 5 / (count - 1) // Total width of 5 units (-2.5 to 2.5)
    return Array(count).fill(0).map((_, i) => {
      const baseX = -2.5 + i * spacing
      const randomOffset = (Math.random() - 0.5) * (spacing * 0.5) // Random offset within half the spacing
      return baseX + randomOffset
    })
  }, [count])

  return (
    <>
      {positions.map((x, index) => (
        <Bollard
          key={index}
          position={[x, 0, zPosition]}
          speed={speed + Math.random() * 0.2} // Add slight variation to speed
        />
      ))}
    </>
  )
}

function MovingObstacles() {
  // Generate random x positions for spinning walls between -3 and 3
  const spinningWallsX = useMemo(() => {
    return Array(4).fill(0).map(() => (Math.random() * 4 - 2))
  }, [])
  
  const obstacleSpacing = multiplierSegments.length * SEGMENT_LENGTH / 5
  
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

      {/* Spinning walls */}
      <SpinningWall 
        position={[spinningWallsX[0], 0.5, -(32 + obstacleSpacing)]} 
        speed={2}
      />
      <SpinningWall 
        position={[spinningWallsX[1], 0.5, -(32 + obstacleSpacing * 2)]} 
        speed={-2.5}
      />
      <SpinningWall 
        position={[spinningWallsX[2], 0.5, -(32 + obstacleSpacing * 3)]} 
        speed={3}
      />
      <SpinningWall 
        position={[spinningWallsX[3], 0.5, -(32 + obstacleSpacing * 4)]} 
        speed={-2.2}
      />

      {/* Bollard rows - placed between spinning walls */}
      <BollardRow 
        zPosition={-56}
        count={3}
        speed={0.6} // Slower
      />
      <BollardRow 
        zPosition={-88}
        count={4}
        speed={1.2} // Medium
      />
      <BollardRow 
        zPosition={-120}
        count={3}
        speed={0.8} // Medium-slow
      />
      <BollardRow 
        zPosition={-152}
        count={4}
        speed={1.5} // Fast
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
