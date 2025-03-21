import * as THREE from 'three'
import { CuboidCollider, RigidBody } from '@react-three/rapier'
import { Float, Text, useGLTF } from '@react-three/drei'

THREE.ColorManagement.legacyMode = false

const boxGeometry = new THREE.BoxGeometry(1, 1, 1)
const floor1Material = new THREE.MeshStandardMaterial({
  color: '#87CEEB', // Light blue color
  metalness: 0,
  roughness: 0,
})
const wallMaterial = new THREE.MeshStandardMaterial({
  color: '#887777',
  metalness: 0,
  roughness: 0,
})

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
          Marble Race
          <meshBasicMaterial toneMapped={false} />
        </Text>
      </Float>
      <mesh
        geometry={boxGeometry}
        material={floor1Material}
        position-y={-0.1}
        scale={[8, 0.2, 16]}
        receiveShadow
      />
    </group>
  )
}

function BlockEnd({ position = [0, 0, 0] }) {
  const hamburger = useGLTF('/marble-race/hamburger.glb')

  hamburger.scene.children.forEach((mesh) => {
    mesh.castShadow = true
  })

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
        material={floor1Material}
        position-y={-0.1}
        scale={[8, 0.2, 16]}
        receiveShadow
      />
      <RigidBody
        type='fixed'
        colliders='hull'
        position={[0, 0.25, 0]}
        restitution={0.2}
        friction={0}
      >
        <primitive object={hamburger.scene} scale={0.2} />
      </RigidBody>
    </group>
  )
}

function TrackBlock({ position = [0, 0, 0] }) {
  return (
    <group position={position}>
      <mesh
        geometry={boxGeometry}
        material={floor1Material}
        position-y={-0.1}
        scale={[8, 0.2, 16]}
        receiveShadow
      />
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

      {Array.from({ length: count }).map((_, index) => (
        <TrackBlock key={index} position={[0, 0, -(index + 1) * 16]} />
      ))}

      <BlockEnd position={[0, 0, -(count + 1) * 16]} />

      <Bounds length={count + 2} />
    </>
  )
}
