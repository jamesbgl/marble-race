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
  { value: 100, color: '#E8B4B8' },
  { value: 0.8, color: '#FFFFFF' },
  { value: 50, color: '#E8B4B8' },
  { value: 0.4, color: '#FFFFFF' },
  { value: 20, color: '#E8B4B8' },
  { value: 0.2, color: '#FFFFFF' },
  { value: 80, color: '#E8B4B8' },
  { value: 12, color: '#FFFFFF' },
  { value: 4, color: '#E8B4B8' },
  { value: 1.5, color: '#FFFFFF' },
  { value: 0.8, color: '#E8B4B8' },
  { value: 0.4, color: '#FFFFFF' },
  { value: 0.2, color: '#E8B4B8' }
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

function BlockEnd({ position = [0, 0, 0] }) {
  return (
    <group position={position}>
      <Text
        font='/marble-race/bebas-neue-v9-latin-regular.woff'
        scale={8}
        position={[0, 2.25, 2]}
      >
        FINISH
        <meshBasicMaterial toneMapped={false} />
      </Text>
      <mesh
        geometry={boxGeometry}
        material={plainMaterial}
        position-y={-0.1}
        scale={[8, 0.2, 16]}
        receiveShadow
      />
    </group>
  )
}

function MultiplierSegment({ position, value, color, segmentLength }) {
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
        font='/marble-race/bebas-neue-v9-latin-regular.woff'
        scale={6}
        position={[0, 0.01, 0]}
        rotation-x={-Math.PI / 2}
      >
        {value}x
        <meshBasicMaterial toneMapped={false} color="black" />
      </Text>
    </group>
  )
}

function TrackSegments({ count = 5 }) {
  const totalLength = count * 16
  const segmentLength = totalLength / multiplierSegments.length // Remove +1 since we're not adding a start segment here

  return (
    <group position={[0, 0, -16]}> {/* Start after the black segment */}
      {/* Multiplier segments */}
      {multiplierSegments.map((segment, index) => (
        <MultiplierSegment
          key={index}
          position={[0, 0, -(index * segmentLength)]}
          value={segment.value}
          color={segment.color}
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

export function Level({ count = 5 }) {
  return (
    <>
      <BlockStart position={[0, 0, 0]} />
      <TrackSegments count={count} />
      <BlockEnd position={[0, 0, -(count + 1) * 16]} />
      <Bounds length={count + 2} />
    </>
  )
}
