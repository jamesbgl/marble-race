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
      {/* Main directional light - simulating distant star/sun */}
      <directionalLight
        ref={mainLight}
        castShadow
        position={[4, 6, 1]}
        intensity={1.5}
        color="#FFFFFF"
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={1}
        shadow-camera-far={50}
        shadow-camera-top={20}
        shadow-camera-right={20}
        shadow-camera-bottom={-20}
        shadow-camera-left={-20}
        shadow-bias={-0.0001}
      />

      {/* Fill light - cosmic background radiation */}
      <directionalLight
        ref={fillLight}
        position={[-2, 3, -2]}
        intensity={0.4}
        color="#4B0082"  // Indigo for space tint
      />

      {/* Ambient light - star field glow */}
      <ambientLight intensity={0.3} color="#000B4D" />

      {/* Point lights for track highlights */}
      <pointLight
        position={[10, 5, 0]}
        intensity={0.5}
        color="#FFFFFF"
        distance={20}
      />
      <pointLight
        position={[-10, 5, 0]}
        intensity={0.5}
        color="#FFFFFF"
        distance={20}
      />
    </>
  )
}
