import * as THREE from 'three'
import { CuboidCollider, RigidBody } from '@react-three/rapier'
import { Float, Text, useGLTF, useTexture } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef, useState, useMemo, useEffect } from 'react'
import useGame from './stores/useGame.js'

THREE.ColorManagement.legacyMode = false

const boxGeometry = new THREE.BoxGeometry(1, 1, 1)
const cylinderGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.3, 32)
// Create rounded cylinder for columns - split into base and top
const columnBaseGeometry = new THREE.CylinderGeometry(0.15, 0.15, 3.5, 8)
const columnTopGeometry = new THREE.CylinderGeometry(0.2, 0.15, 0.5, 8)
// Create rounded edges for walls
const roundedWallGeometry = new THREE.CylinderGeometry(0.15, 0.15, 1, 8)

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
let chargeBuffer
let fireBuffer
let cashInBuffer
let collisionBuffer
let audioSources = []
let chargeSource = null
let chargeGainNode = null // Add global reference to charge gain node

// Initialize audio context and load sounds
const initAudio = async () => {
  if (audioContext) return

  audioContext = new (window.AudioContext || window.webkitAudioContext)()
  
  try {
    const sampleRate = audioContext.sampleRate

    // Create collision sound (soft impact)
    const collisionDuration = 0.1
    const collisionNumSamples = collisionDuration * sampleRate
    collisionBuffer = audioContext.createBuffer(1, collisionNumSamples, sampleRate)
    const collisionData = collisionBuffer.getChannelData(0)
    
    for (let i = 0; i < collisionNumSamples; i++) {
      const t = i / sampleRate
      // Create a soft impact sound with white noise and low frequency
      const whiteNoise = Math.random() * 2 - 1
      const lowFreq = Math.sin(2 * Math.PI * 100 * t)
      collisionData[i] = (whiteNoise * 0.3 + lowFreq * 0.7) * Math.exp(-30 * t)
    }

    // Create ping sound (existing)
    const pingDuration = 0.08
    const pingNumSamples = pingDuration * sampleRate
    pingBuffer = audioContext.createBuffer(1, pingNumSamples, sampleRate)
    const pingData = pingBuffer.getChannelData(0)
    
    for (let i = 0; i < pingNumSamples; i++) {
      const t = i / sampleRate
      pingData[i] = Math.sin(2 * Math.PI * 440 * t) * Math.exp(-20 * t)
    }

    // Create fire sound (laser-like)
    const fireDuration = 0.3
    const fireNumSamples = fireDuration * sampleRate
    fireBuffer = audioContext.createBuffer(1, fireNumSamples, sampleRate)
    const fireData = fireBuffer.getChannelData(0)
    
    for (let i = 0; i < fireNumSamples; i++) {
      const t = i / sampleRate
      // Combine descending frequency with white noise for a "pew" effect
      const freq = 1000 - (t * 2000)
      const whiteNoise = Math.random() * 2 - 1
      fireData[i] = (Math.sin(2 * Math.PI * freq * t) * 0.7 + whiteNoise * 0.3) * Math.exp(-5 * t)
    }

    // Create charge sound (rising tone)
    const chargeDuration = 2.0
    const chargeNumSamples = chargeDuration * sampleRate
    chargeBuffer = audioContext.createBuffer(1, chargeNumSamples, sampleRate)
    const chargeData = chargeBuffer.getChannelData(0)
    
    for (let i = 0; i < chargeNumSamples; i++) {
      const t = i / sampleRate
      // Rising frequency from 200Hz to 800Hz
      const freq = 200 + (600 * (t / chargeDuration))
      chargeData[i] = Math.sin(2 * Math.PI * freq * t) * 0.5
    }

    // Create cash-in sound (satisfying chime)
    const cashInDuration = 0.5
    const cashInNumSamples = cashInDuration * sampleRate
    cashInBuffer = audioContext.createBuffer(1, cashInNumSamples, sampleRate)
    const cashInData = cashInBuffer.getChannelData(0)
    
    for (let i = 0; i < cashInNumSamples; i++) {
      const t = i / sampleRate
      // Combine multiple frequencies for a rich chime sound
      const freq1 = 880 // A5
      const freq2 = 1108.73 // C#6
      const freq3 = 1318.51 // E6
      const envelope = Math.exp(-8 * t) // Quick decay
      cashInData[i] = (
        Math.sin(2 * Math.PI * freq1 * t) * 0.5 +
        Math.sin(2 * Math.PI * freq2 * t) * 0.3 +
        Math.sin(2 * Math.PI * freq3 * t) * 0.2
      ) * envelope
    }

    // Create a pool of audio sources for ping sounds
    for (let i = 0; i < 5; i++) {
      const gainNode = audioContext.createGain()
      gainNode.connect(audioContext.destination)
      audioSources.push({
        gainNode,
        inUse: false,
        source: null
      })
    }
  } catch (error) {
    console.error('Error initializing audio:', error)
  }
}

// Function to play the fire sound
const playFireSound = (power) => {
  if (!audioContext) return

  const source = audioContext.createBufferSource()
  const gainNode = audioContext.createGain()
  
  source.buffer = fireBuffer
  gainNode.gain.value = 0.3
  
  // Higher power = higher pitch and volume
  source.playbackRate.value = 0.8 + (power * 0.4)
  gainNode.gain.value = 0.2 + (power * 0.2)
  
  source.connect(gainNode)
  gainNode.connect(audioContext.destination)
  source.start()
}

// Function to start the charging sound
const startChargingSound = () => {
  if (!audioContext || chargeSource) return

  chargeSource = audioContext.createBufferSource()
  chargeGainNode = audioContext.createGain() // Store gain node in global variable
  
  chargeSource.buffer = chargeBuffer
  chargeSource.loop = true
  chargeGainNode.gain.value = 0.1
  
  chargeSource.connect(chargeGainNode)
  chargeGainNode.connect(audioContext.destination)
  chargeSource.start()
}

// Function to update charging sound
const updateChargingSound = (power) => {
  if (!chargeSource || !chargeGainNode) return
  
  // Increase pitch and volume with power
  chargeSource.playbackRate.value = 0.5 + (power * 1.5)
  chargeGainNode.gain.value = 0.1 + (power * 0.2)
}

// Function to stop charging sound
const stopChargingSound = () => {
  if (chargeSource) {
    chargeSource.stop()
    chargeSource = null
    chargeGainNode = null // Reset gain node reference
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

// Function to play the cash-in sound
const playCashInSound = () => {
  if (!audioContext || !cashInBuffer) return

  const source = audioContext.createBufferSource()
  source.buffer = cashInBuffer
  
  // Create a gain node for volume control
  const gainNode = audioContext.createGain()
  gainNode.gain.value = 0.3 // Adjust volume as needed
  
  // Connect nodes
  source.connect(gainNode)
  gainNode.connect(audioContext.destination)
  
  // Play the sound
  source.start(0)
}

// Function to play collision sound
const playCollisionSound = (impactSpeed) => {
  if (!audioContext || !collisionBuffer) return

  // Find an available source from the pool
  const audioSource = audioSources.find(s => !s.inUse)
  if (!audioSource) return // All sources are in use

  // Mark the source as in use
  audioSource.inUse = true

  // Create a new source
  const newSource = audioContext.createBufferSource()
  newSource.buffer = collisionBuffer
  
  // Adjust volume and pitch based on impact speed
  const volume = Math.min(0.3, impactSpeed * 0.1)
  const pitch = 1 + (impactSpeed * 0.05)
  
  audioSource.gainNode.gain.value = volume
  newSource.playbackRate.value = pitch
  
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

// Export the sound functions
export const soundEffects = {
  playFireSound,
  startChargingSound,
  updateChargingSound,
  stopChargingSound,
  playPing,
  playCashInSound,
  playCollisionSound
}

function BlockStart({ position = [0, 0, 0] }) {
  const texture = useTexture('/marble-race/Logo_tagline.svg')
  texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping
  texture.minFilter = THREE.LinearFilter
  texture.magFilter = THREE.LinearFilter
  
  return (
    <group position={position}>
      {/* Left wall */}
      <group>
        {/* Main wall segment */}
        <mesh
          position={[4.15, 0.15, 0]}
          geometry={boxGeometry}
          material={new THREE.MeshStandardMaterial({
            color: multiplierSegments[0].color,
            metalness: 0.3,
            roughness: 0.4,
            envMapIntensity: 0.5
          })}
          scale={[0.3, 0.3, 16]}
          castShadow
        />
        {/* Columns along the start section */}
        {[0, -4, -8, -12].map((zOffset, index) => (
          <group key={`left-column-${index}`}>
            {/* Column base */}
            <mesh
              position={[4.15, 1.75, zOffset]}
              geometry={columnBaseGeometry}
              material={new THREE.MeshStandardMaterial({
                color: multiplierSegments[0].color,
                metalness: 0.3,
                roughness: 0.4,
                envMapIntensity: 0.5
              })}
              castShadow
            />
            {/* Column glowing top */}
            <mesh
              position={[4.15, 3.75, zOffset]}
              geometry={columnTopGeometry}
              material={new THREE.MeshStandardMaterial({
                color: multiplierSegments[0].color,
                emissive: multiplierSegments[0].color,
                emissiveIntensity: 0.5,
                metalness: 0.1,
                roughness: 0.2,
                envMapIntensity: 1
              })}
              castShadow
            />
            {/* Point light at column top */}
            <pointLight
              position={[4.15, 4, zOffset]}
              intensity={0.5}
              distance={4}
              color={multiplierSegments[0].color}
            />
          </group>
        ))}
        {/* Rounded corner at end */}
        <mesh
          position={[4.15, 0.15, -8]}
          geometry={roundedWallGeometry}
          material={new THREE.MeshStandardMaterial({
            color: multiplierSegments[0].color,
            metalness: 0.3,
            roughness: 0.4,
            envMapIntensity: 0.5
          })}
          scale={[1, 0.3, 1]}
          castShadow
        />
      </group>

      {/* Right wall */}
      <group>
        {/* Main wall segment */}
        <mesh
          position={[-4.15, 0.15, 0]}
          geometry={boxGeometry}
          material={new THREE.MeshStandardMaterial({
            color: multiplierSegments[0].color,
            metalness: 0.3,
            roughness: 0.4,
            envMapIntensity: 0.5
          })}
          scale={[0.3, 0.3, 16]}
          castShadow
        />
        {/* Columns along the start section */}
        {[0, -4, -8, -12].map((zOffset, index) => (
          <group key={`right-column-${index}`}>
            {/* Column base */}
            <mesh
              position={[-4.15, 1.75, zOffset]}
              geometry={columnBaseGeometry}
              material={new THREE.MeshStandardMaterial({
                color: multiplierSegments[0].color,
                metalness: 0.3,
                roughness: 0.4,
                envMapIntensity: 0.5
              })}
              castShadow
            />
            {/* Column glowing top */}
            <mesh
              position={[-4.15, 3.75, zOffset]}
              geometry={columnTopGeometry}
              material={new THREE.MeshStandardMaterial({
                color: multiplierSegments[0].color,
                emissive: multiplierSegments[0].color,
                emissiveIntensity: 0.5,
                metalness: 0.1,
                roughness: 0.2,
                envMapIntensity: 1
              })}
              castShadow
            />
            {/* Point light at column top */}
            <pointLight
              position={[-4.15, 4, zOffset]}
              intensity={0.5}
              distance={4}
              color={multiplierSegments[0].color}
            />
          </group>
        ))}
        {/* Rounded corner at end */}
        <mesh
          position={[-4.15, 0.15, -8]}
          geometry={roundedWallGeometry}
          material={new THREE.MeshStandardMaterial({
            color: multiplierSegments[0].color,
            metalness: 0.3,
            roughness: 0.4,
            envMapIntensity: 0.5
          })}
          scale={[1, 0.3, 1]}
          castShadow
        />
      </group>

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
              soundEffects.playPing(currentValue)
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
  
  return (
    <>
      <RigidBody type='fixed' restitution={0.6} friction={0.1}>
        {/* Left wall segments with rounded corners */}
        {multiplierSegments.map((segment, index) => (
          <group key={`left-${index}`}>
            {/* Main wall segment */}
            <mesh
              position={[4.15, 0.15, -(index * SEGMENT_LENGTH + 16)]}
              geometry={boxGeometry}
              material={new THREE.MeshStandardMaterial({
                color: segment.color,
                metalness: 0.3,
                roughness: 0.4,
                envMapIntensity: 0.5
              })}
              scale={[0.3, 1.5, SEGMENT_LENGTH]}
              castShadow
            />
            {/* Rounded corners at start of segment */}
            <mesh
              position={[4.15, 0.15, -(index * SEGMENT_LENGTH + 16 - SEGMENT_LENGTH/2)]}
              geometry={roundedWallGeometry}
              material={new THREE.MeshStandardMaterial({
                color: segment.color,
                metalness: 0.3,
                roughness: 0.4,
                envMapIntensity: 0.5
              })}
              scale={[1, 0.3, 1]}
              castShadow
            />
            {/* Column base */}
            <mesh
              position={[4.15, 1.75, -(index * SEGMENT_LENGTH + 16)]}
              geometry={columnBaseGeometry}
              material={new THREE.MeshStandardMaterial({
                color: segment.color,
                metalness: 0.3,
                roughness: 0.4,
                envMapIntensity: 0.5
              })}
              castShadow
            />
            {/* Column glowing top */}
            <mesh
              position={[4.15, 3.75, -(index * SEGMENT_LENGTH + 16)]}
              geometry={columnTopGeometry}
              material={new THREE.MeshStandardMaterial({
                color: segment.color,
                emissive: segment.color,
                emissiveIntensity: 0.5,
                metalness: 0.1,
                roughness: 0.2,
                envMapIntensity: 1
              })}
              castShadow
            />
            {/* Point light at column top */}
            <pointLight
              position={[4.15, 4, -(index * SEGMENT_LENGTH + 16)]}
              intensity={0.5}
              distance={4}
              color={segment.color}
            />
          </group>
        ))}

        {/* Right wall segments with rounded corners */}
        {multiplierSegments.map((segment, index) => (
          <group key={`right-${index}`}>
            {/* Main wall segment */}
            <mesh
              position={[-4.15, 0.15, -(index * SEGMENT_LENGTH + 16)]}
              geometry={boxGeometry}
              material={new THREE.MeshStandardMaterial({
                color: segment.color,
                metalness: 0.3,
                roughness: 0.4,
                envMapIntensity: 0.5
              })}
              scale={[0.3, 1.5, SEGMENT_LENGTH]}
              castShadow
            />
            {/* Rounded corners at start of segment */}
            <mesh
              position={[-4.15, 0.15, -(index * SEGMENT_LENGTH + 16 - SEGMENT_LENGTH/2)]}
              geometry={roundedWallGeometry}
              material={new THREE.MeshStandardMaterial({
                color: segment.color,
                metalness: 0.3,
                roughness: 0.4,
                envMapIntensity: 0.5
              })}
              scale={[1, 0.3, 1]}
              castShadow
            />
            {/* Column base */}
            <mesh
              position={[-4.15, 1.75, -(index * SEGMENT_LENGTH + 16)]}
              geometry={columnBaseGeometry}
              material={new THREE.MeshStandardMaterial({
                color: segment.color,
                metalness: 0.3,
                roughness: 0.4,
                envMapIntensity: 0.5
              })}
              castShadow
            />
            {/* Column glowing top */}
            <mesh
              position={[-4.15, 3.75, -(index * SEGMENT_LENGTH + 16)]}
              geometry={columnTopGeometry}
              material={new THREE.MeshStandardMaterial({
                color: segment.color,
                emissive: segment.color,
                emissiveIntensity: 0.5,
                metalness: 0.1,
                roughness: 0.2,
                envMapIntensity: 1
              })}
              castShadow
            />
            {/* Point light at column top */}
            <pointLight
              position={[-4.15, 4, -(index * SEGMENT_LENGTH + 16)]}
              intensity={0.5}
              distance={4}
              color={segment.color}
            />
          </group>
        ))}

        {/* End wall with rounded corners */}
        <group>
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
          {/* Rounded corners for end wall */}
          <mesh
            position={[4, 0.15, -(length * SEGMENT_LENGTH) + 2]}
            geometry={roundedWallGeometry}
            material={new THREE.MeshStandardMaterial({
              color: multiplierSegments[multiplierSegments.length - 1].color,
              metalness: 0.3,
              roughness: 0.4,
              envMapIntensity: 0.5
            })}
            scale={[1, 0.3, 1]}
            castShadow
          />
          <mesh
            position={[-4, 0.15, -(length * SEGMENT_LENGTH) + 2]}
            geometry={roundedWallGeometry}
            material={new THREE.MeshStandardMaterial({
              color: multiplierSegments[multiplierSegments.length - 1].color,
              metalness: 0.3,
              roughness: 0.4,
              envMapIntensity: 0.5
            })}
            scale={[1, 0.3, 1]}
            castShadow
          />
        </group>

        {/* Floor collider */}
        <CuboidCollider
          args={[4, 0.1, SEGMENT_LENGTH * length]}
          position={[0, -0.1, -(length * 8) + 2]}
          restitution={0.4}
          friction={0.2}
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
    <RigidBody ref={wall} type="kinematicPosition" restitution={0.6} friction={0.1}>
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
    <RigidBody ref={wall} type="kinematicPosition" restitution={0.6} friction={0.1} position={position}>
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

function BouncingPlatform({ position, bounceStrength = 15 }) {
  const platform = useRef()
  const timeOffset = useRef(Math.random() * Math.PI * 2)

  useFrame((state) => {
    if (platform.current) {
      const time = state.clock.getElapsedTime()
      const offset = Math.sin(time * 2 + timeOffset.current) * 0.3
      
      platform.current.setNextKinematicTranslation({
        x: position[0],
        y: position[1] + offset,
        z: position[2]
      })
    }
  })

  return (
    <RigidBody ref={platform} type="kinematicPosition" restitution={0.8} friction={0.2} position={position}>
      <mesh
        geometry={boxGeometry}
        material={new THREE.MeshPhongMaterial({
          color: '#00FF00',
          shininess: 60,
          specular: new THREE.Color(0x444444)
        })}
        scale={[2, 0.3, 2]}
        castShadow
      />
    </RigidBody>
  )
}

function RotatingCylinder({ position, speed = 2 }) {
  const cylinder = useRef()
  const timeOffset = useRef(Math.random() * Math.PI * 2)

  useFrame((state) => {
    if (cylinder.current) {
      const time = state.clock.getElapsedTime()
      const rotation = new THREE.Quaternion()
      rotation.setFromEuler(new THREE.Euler(0, (time * speed + timeOffset.current), 0))
      cylinder.current.setNextKinematicRotation(rotation)
    }
  })

  return (
    <RigidBody ref={cylinder} type="kinematicPosition" restitution={0.6} friction={0.1} position={position}>
      <mesh
        geometry={cylinderGeometry}
        material={new THREE.MeshPhongMaterial({
          color: '#FF00FF',
          shininess: 60,
          specular: new THREE.Color(0x444444)
        })}
        scale={[1, 2, 1]}
        castShadow
      />
    </RigidBody>
  )
}

function SpeedBoost({ position, boostStrength = 20 }) {
  const boost = useRef()
  const timeOffset = useRef(Math.random() * Math.PI * 2)

  useFrame((state) => {
    if (boost.current) {
      const time = state.clock.getElapsedTime()
      const rotation = new THREE.Quaternion()
      rotation.setFromEuler(new THREE.Euler(0, (time * 3 + timeOffset.current), 0))
      boost.current.setNextKinematicRotation(rotation)
    }
  })

  return (
    <RigidBody ref={boost} type="kinematicPosition" restitution={0.2} friction={0.1} position={position}>
      <mesh
        geometry={cylinderGeometry}
        material={new THREE.MeshPhongMaterial({
          color: '#FFFF00',
          shininess: 60,
          specular: new THREE.Color(0x444444)
        })}
        scale={[0.5, 0.3, 0.5]}
        castShadow
      />
    </RigidBody>
  )
}

function SwingingHammer({ position, swingSpeed = 1.5, swingRange = Math.PI / 3 }) {
  const hammer = useRef()
  const timeOffset = useRef(Math.random() * Math.PI * 2)

  useFrame((state) => {
    if (hammer.current) {
      const time = state.clock.getElapsedTime()
      const angle = Math.sin(time * swingSpeed + timeOffset.current) * swingRange
      
      // Create rotation quaternion for the swinging motion
      const rotation = new THREE.Quaternion()
      rotation.setFromEuler(new THREE.Euler(0, 0, angle))
      hammer.current.setNextKinematicRotation(rotation)
    }
  })

  return (
    <RigidBody ref={hammer} type="kinematicPosition" restitution={0.8} friction={0.1} position={position}>
      <group>
        {/* Hammer head - made much bigger */}
        <mesh
          geometry={boxGeometry}
          material={new THREE.MeshPhongMaterial({
            color: '#FF0000',
            shininess: 60,
            specular: new THREE.Color(0x444444),
            emissive: '#330000',
            emissiveIntensity: 0.5
          })}
          scale={[2, 2, 2]} // Much larger hammer head
          position={[0, -8, 0]} // Moved further down for longer reach
          castShadow
        />
        {/* Hammer shaft - made longer and thicker */}
        <mesh
          geometry={boxGeometry}
          material={new THREE.MeshPhongMaterial({
            color: '#8B4513',
            shininess: 60,
            specular: new THREE.Color(0x444444)
          })}
          scale={[0.4, 8, 0.4]} // Much longer and thicker shaft
          position={[0, -4, 0]} // Adjusted for new size
          castShadow
        />
        {/* Pivot point - made bigger */}
        <mesh
          geometry={cylinderGeometry}
          material={new THREE.MeshPhongMaterial({
            color: '#808080',
            shininess: 60,
            specular: new THREE.Color(0x444444)
          })}
          scale={[0.6, 0.6, 0.6]} // Bigger pivot point
          position={[0, 0, 0]}
          castShadow
        />
      </group>
    </RigidBody>
  )
}

function BoostPad({ position, boostStrength = 40 }) {
  return (
    <group position={position}>
      {/* First chevron (bottom) */}
      <mesh
        geometry={boxGeometry}
        material={new THREE.MeshPhongMaterial({
          color: '#9D4EDD',
          shininess: 100,
          specular: new THREE.Color(0xB8A8FF),
          emissive: '#7B2CBF',
          emissiveIntensity: 0.4,
          transparent: true,
          opacity: 0.3,
          depthWrite: true
        })}
        scale={[2, 0.1, 1]}
        position={[0, -0.05, -0.5]}  // Moved below ground
        rotation={[0, -Math.PI / 4, 0]}
        castShadow
      />
      <mesh
        geometry={boxGeometry}
        material={new THREE.MeshPhongMaterial({
          color: '#9D4EDD',
          shininess: 100,
          specular: new THREE.Color(0xB8A8FF),
          emissive: '#7B2CBF',
          emissiveIntensity: 0.4,
          transparent: true,
          opacity: 0.3,
          depthWrite: true
        })}
        scale={[2, 0.1, 1]}
        position={[0, -0.05, -0.5]}  // Moved below ground
        rotation={[0, Math.PI / 4, 0]}
        castShadow
      />

      {/* Second chevron (middle) */}
      <mesh
        geometry={boxGeometry}
        material={new THREE.MeshPhongMaterial({
          color: '#9D4EDD',
          shininess: 100,
          specular: new THREE.Color(0xB8A8FF),
          emissive: '#7B2CBF',
          emissiveIntensity: 0.5,
          transparent: true,
          opacity: 0.25,
          depthWrite: false
        })}
        scale={[2, 0.1, 1]}
        position={[0, -0.02, 0]}  // Moved below ground
        rotation={[0, -Math.PI / 4, 0]}
      />
      <mesh
        geometry={boxGeometry}
        material={new THREE.MeshPhongMaterial({
          color: '#9D4EDD',
          shininess: 100,
          specular: new THREE.Color(0xB8A8FF),
          emissive: '#7B2CBF',
          emissiveIntensity: 0.5,
          transparent: true,
          opacity: 0.25,
          depthWrite: false
        })}
        scale={[2, 0.1, 1]}
        position={[0, -0.02, 0]}  // Moved below ground
        rotation={[0, Math.PI / 4, 0]}
      />

      {/* Third chevron (top) */}
      <mesh
        geometry={boxGeometry}
        material={new THREE.MeshPhongMaterial({
          color: '#9D4EDD',
          shininess: 100,
          specular: new THREE.Color(0xB8A8FF),
          emissive: '#7B2CBF',
          emissiveIntensity: 0.6,
          transparent: true,
          opacity: 0.2,
          depthWrite: false
        })}
        scale={[2, 0.1, 1]}
        position={[0, 0.01, 0.5]}  // Just barely above ground
        rotation={[0, -Math.PI / 4, 0]}
      />
      <mesh
        geometry={boxGeometry}
        material={new THREE.MeshPhongMaterial({
          color: '#9D4EDD',
          shininess: 100,
          specular: new THREE.Color(0xB8A8FF),
          emissive: '#7B2CBF',
          emissiveIntensity: 0.6,
          transparent: true,
          opacity: 0.2,
          depthWrite: false
        })}
        scale={[2, 0.1, 1]}
        position={[0, 0.01, 0.5]}  // Just barely above ground
        rotation={[0, Math.PI / 4, 0]}
      />

      {/* Point light for subtle glow effect */}
      <pointLight
        color="#9D4EDD"
        intensity={0.5}
        distance={3}
        position={[0, 0.5, 0]}
      />

      {/* Ground glow effect */}
      <mesh
        geometry={boxGeometry}
        material={new THREE.MeshPhongMaterial({
          color: '#9D4EDD',
          emissive: '#7B2CBF',
          emissiveIntensity: 0.3,
          transparent: true,
          opacity: 0.15,
          depthWrite: false
        })}
        scale={[2.5, 0.01, 2.5]}
        position={[0, -0.01, 0]}  // Slightly below ground
        receiveShadow
      />
    </group>
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
      {/* Strategic boost pads */}
      <BoostPad position={[0, 0, -24]} boostStrength={3} />   {/* Early gentle boost */}
      <BoostPad position={[-2, 0, -56]} boostStrength={4} />  {/* First hammer help */}
      <BoostPad position={[2, 0, -88]} boostStrength={4} />   {/* Recovery path */}
      <BoostPad position={[-2, 0, -120]} boostStrength={5} /> {/* Third hammer help */}
      <BoostPad position={[0, 0, -152]} boostStrength={5} />  {/* High multiplier boost */}
      <BoostPad position={[2, 0, -184]} boostStrength={6} />  {/* Final boost */}

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

      {/* New obstacles */}
      <BouncingPlatform position={[0, 0.5, -80]} />
      <RotatingCylinder position={[2, 0.5, -112]} speed={3} />
      <SpeedBoost position={[-2, 0.5, -144]} boostStrength={25} />
      <BouncingPlatform position={[0, 0.5, -176]} />
      <RotatingCylinder position={[-2, 0.5, -192]} speed={-2.5} />

      {/* Giant swinging hammers at strategic positions */}
      <SwingingHammer 
        position={[0, 8, -64]} 
        swingSpeed={1.0} 
        swingRange={Math.PI / 2.5}
      />
      <SwingingHammer 
        position={[0, 8, -96]} 
        swingSpeed={1.5} 
        swingRange={Math.PI / 2}
      />
      <SwingingHammer 
        position={[0, 8, -128]} 
        swingSpeed={1.2} 
        swingRange={Math.PI / 2}
      />
      <SwingingHammer 
        position={[0, 8, -176]} 
        swingSpeed={0.8} 
        swingRange={Math.PI / 2.2}
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

      <BlockStart position={[0, 0, 0]} />
      <TrackSegments />
      <MovingObstacles />
      <Bounds length={totalSegments} />
    </>
  )
}

