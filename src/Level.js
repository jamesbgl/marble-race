import * as THREE from 'three'
import { CuboidCollider, RigidBody } from '@react-three/rapier'
import { Float, Text, useGLTF } from '@react-three/drei'

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
const startMaterial = new THREE.MeshBasicMaterial({
  color: '#000000',
  transparent: false,
  opacity: 1,
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
  return (
    <group position={position}>
      <Float floatIntensity={0.25} rotationIntensity={0.25}>
        <Text
          font='/marble-race/bebas-neue-v9-latin-regular.woff'
          scale={4}
          maxWidth={0.25}
          lineHeight={0.75}
          textAlign='right'
          position={[0.75, 0.65, 0]}
          rotation-y={-0.25}
        >
          Crazy Marbles
          <meshBasicMaterial toneMapped={false} />
        </Text>
      </Float>
      <mesh
        geometry={boxGeometry}
        material={startMaterial}
        position-y={-0.1}
        scale={[8, 0.2, 16]}
      />
    </group>
  )
}

function MultiplierSegment({ position, value, color, textColor, segmentLength }) {
  const material = new THREE.MeshStandardMaterial({
    color,
    metalness: 0,
    roughness: 0,
  })

  return (
    <group position={position}>
      <mesh
        geometry={boxGeometry}
        material={material}
        position-y={-0.1}
        scale={[8, 0.2, segmentLength]}
        receiveShadow
      />
      <Text
        font='/marble-race/midnight-sans-st-24.woff'
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
        />
      ))}
    </group>
  )
}

function Bounds({ length = 1 }) {
  return (
    <>
      <RigidBody type='fixed' restitution={0.2} friction={0}>
        {/* Left wall */}
        <mesh
          position={[4.15, 0.75, -(length * 8) + 2]}
          geometry={boxGeometry}
          material={wallMaterial}
          scale={[0.3, 1.5, 16 * length]}
          castShadow
        />
        {/* Right wall */}
        <mesh
          position={[-4.15, 0.75, -(length * 8) + 2]}
          geometry={boxGeometry}
          material={wallMaterial}
          scale={[0.3, 1.5, 16 * length]}
          receiveShadow
        />
        {/* End wall */}
        <mesh
          position={[0, 0.75, -(length * 16) + 2]}
          geometry={boxGeometry}
          material={wallMaterial}
          scale={[8, 1.5, 0.3]}
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

export function Level() {
  // Calculate total segments: 1 start segment + multiplier segments
  const totalSegments = 1 + multiplierSegments.length
  
  return (
    <>
      <BlockStart position={[0, 0, 0]} />
      <TrackSegments />
      <Bounds length={totalSegments} />
    </>
  )
}
