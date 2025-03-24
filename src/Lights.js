import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'

export default function Lights() {
  const mainLight = useRef()
  const fillLight = useRef()

  useFrame((state) => {
    // Update main light position to follow camera
    mainLight.current.position.z = state.camera.position.z + 1 - 4
    mainLight.current.target.position.z = state.camera.position.z - 4
    mainLight.current.target.updateMatrixWorld()

    // Update fill light position
    fillLight.current.position.z = state.camera.position.z - 2
  })

  return (
    <>
      {/* Main directional light */}
      <directionalLight
        ref={mainLight}
        castShadow
        position={[4, 4, 1]}
        intensity={0.8}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={1}
        shadow-camera-far={50}
        shadow-camera-top={20}
        shadow-camera-right={20}
        shadow-camera-bottom={-20}
        shadow-camera-left={-20}
        shadow-bias={-0.0001}
      />

      {/* Fill light for better depth */}
      <directionalLight
        ref={fillLight}
        position={[-2, 3, -2]}
        intensity={0.15}
      />

      {/* Ambient light for base illumination */}
      <ambientLight intensity={0.2} />

      {/* Hemisphere light for sky/ground ambient */}
      <hemisphereLight
        color="#ffffff"
        groundColor="#000000"
        intensity={0.15}
      />
    </>
  )
}
