import { useFrame } from '@react-three/fiber'
import { useRapier, RigidBody } from '@react-three/rapier'
import { useKeyboardControls } from '@react-three/drei'
import { useState, useEffect, useRef } from 'react'
import * as THREE from 'three'
import useGame from './stores/useGame.js'
import TrajectoryLine from './TrajectoryLine.js'
import { soundEffects } from './Level.js'

export default function Player() {
  const body = useRef()
  const [subscribeKeys, getKeys] = useKeyboardControls()
  const { rapier, world } = useRapier()
  const rapierWorld = world.raw()

  const [aimDirection, setAimDirection] = useState(0)
  const [hasLaunched, setHasLaunched] = useState(false)
  const [powerLevel, setPowerLevel] = useState(0)
  const [stopTimeout, setStopTimeout] = useState(null)
  const wasKeyPressed = useRef(false)
  const [showBall, setShowBall] = useState(true)

  const cameraPosition = useRef(new THREE.Vector3(0, 1.65, 2.25))
  const cameraTarget = useRef(new THREE.Vector3(0, 0.25, 0))

  const start = useGame((state) => state.start)
  const end = useGame((state) => state.end)
  const restart = useGame((state) => state.restart)
  const blocksCount = useGame((state) => state.blocksCount)
  const hasShownCourseOverview = useGame((state) => state.hasShownCourseOverview)
  const phase = useGame((state) => state.phase)
  const setPower = useGame((state) => state.setPower)
  const setCurrentMultiplier = useGame((state) => state.setCurrentMultiplier)

  const reset = () => {
    body.current.setTranslation({ x: 0, y: 1, z: 0 })
    body.current.setLinvel({ x: 0, y: 0, z: 0 })
    body.current.setAngvel({ x: 0, y: 0, z: 0 })
    
    setAimDirection(0)
    setHasLaunched(false)
    setPowerLevel(0)
    setPower(0)
    setCurrentMultiplier(0)
    wasKeyPressed.current = false
    
    // Reset camera to launch position
    cameraPosition.current.set(0, 1.65, 2.25)
    cameraTarget.current.set(0, 0.25, 0)
    
    if (stopTimeout) {
      clearTimeout(stopTimeout)
      setStopTimeout(null)
    }
  }

  const launchMarble = () => {
    if (!hasLaunched && powerLevel >= 0.3) { // Minimum 30% power required
      const minSpeed = 25 // Reduced from 30 for smoother start
      const maxSpeed = 100 // Reduced from 120 for better control
      const launchSpeed = minSpeed + (maxSpeed - minSpeed) * powerLevel
      const launchAngle = aimDirection * Math.PI / 6
      
      const velocityX = Math.sin(launchAngle) * launchSpeed
      const velocityZ = -Math.cos(launchAngle) * launchSpeed
      
      // Smoother initial velocity
      body.current.setLinvel({ 
        x: velocityX, 
        y: 0, 
        z: velocityZ 
      })
      
      // Reduced initial rotation for smoother start
      body.current.setAngvel({ 
        x: -velocityZ * 1.5, // Reduced from 2
        y: 0, 
        z: -velocityX * 1.5  // Reduced from 2
      })
      
      setHasLaunched(true)
      setPowerLevel(0)
      setPower(0)
      start()

      // Play fire sound with current power level
      soundEffects.playFireSound(powerLevel)
      // Stop the charging sound
      soundEffects.stopChargingSound()
    }
  }

  useEffect(() => {
    const unsubscribeReset = useGame.subscribe(
      (state) => state.phase,
      (value) => {
        if (value === 'ready') reset()
      }
    )

    // Handle aiming
    const unsubscribeKeys = subscribeKeys((state) => {
      if (!hasLaunched) {
        if (state.leftward) {
          setAimDirection(Math.max(aimDirection - 0.02, -1))
        }
        if (state.rightward) {
          setAimDirection(Math.min(aimDirection + 0.02, 1))
        }
      }
    })

    return () => {
      unsubscribeKeys()
      unsubscribeReset()
      if (stopTimeout) {
        clearTimeout(stopTimeout)
      }
    }
  }, [hasLaunched, aimDirection])

  useFrame((state, delta) => {
    const keys = getKeys()
    const bodyPosition = body.current?.translation() || new THREE.Vector3(0, 1, 0)

    /**
     * Camera
     */
    const targetPosition = new THREE.Vector3(
      bodyPosition.x,
      bodyPosition.y + 0.65,
      bodyPosition.z + 2.25
    )
    
    const targetLookAt = new THREE.Vector3(
      bodyPosition.x,
      bodyPosition.y + 0.25,
      bodyPosition.z
    )

    // Smooth camera movement
    cameraPosition.current.lerp(targetPosition, delta * 4)
    cameraTarget.current.lerp(targetLookAt, delta * 4)

    state.camera.position.copy(cameraPosition.current)
    state.camera.lookAt(cameraTarget.current)

    /**
     * Phases
     */
    if (bodyPosition.y < -4) restart()

    // Handle power charging and launching
    if (!hasLaunched) {
      if (keys.forward) {
        if (!wasKeyPressed.current) {
          // Start charging sound when key is first pressed
          soundEffects.startChargingSound()
        }
        wasKeyPressed.current = true
        // Smoother power charging
        const newPower = Math.min(powerLevel + delta * 0.5, 1) // Reduced from 0.75 for smoother charging
        setPowerLevel(newPower)
        setPower(newPower)
        // Update charging sound pitch and volume
        soundEffects.updateChargingSound(newPower)
      } else if (wasKeyPressed.current) {
        // Key was released
        wasKeyPressed.current = false
        launchMarble()
        // Stop charging sound
        soundEffects.stopChargingSound()
      }
    }

    // Check if ball has come to a stop
    if (hasLaunched && phase === 'playing') {
      const velocity = body.current.linvel()
      const angularVel = body.current.angvel()
      const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y + velocity.z * velocity.z)
      const rotationSpeed = Math.sqrt(angularVel.x * angularVel.x + angularVel.y * angularVel.y + angularVel.z * angularVel.z)
      
      if (speed < 0.1 && rotationSpeed < 0.1) {
        // Ball has essentially stopped
        if (!stopTimeout) {
          setStopTimeout(setTimeout(() => {
            end()
          }, 1000))
        }
      } else {
        // Ball is still moving
        if (stopTimeout) {
          clearTimeout(stopTimeout)
          setStopTimeout(null)
        }
      }
    }

    // Update marble rotation based on its velocity when launched
    if (hasLaunched) {
      const velocity = body.current.linvel()
      const speed = Math.sqrt(velocity.x * velocity.x + velocity.z * velocity.z)
      if (speed > 0) {
        body.current.setAngvel({ 
          x: -velocity.z / speed * speed * 2,
          y: 0,
          z: -velocity.x / speed * speed * 2
        })
      }
    }
  })

  // Cleanup sounds on unmount
  useEffect(() => {
    return () => {
      soundEffects.stopChargingSound()
    }
  }, [])

  return (
    <>
      <TrajectoryLine 
        aimDirection={aimDirection} 
        visible={!hasLaunched} 
      />
      {showBall && (
        <RigidBody
          ref={body}
          colliders='ball'
          restitution={0.7} // Reduced from 0.8 for less bouncy collisions
          friction={1.2} // Increased from 1 for better grip
          linearDamping={0.15} // Reduced from 0.2 for smoother movement
          angularDamping={0.15} // Reduced from 0.2 for smoother rotation
          position={[0, 1, 0]}
          name="marble"
        >
          <mesh castShadow>
              <icosahedronGeometry args={[0.3, 1]} />
              <meshStandardMaterial flatShading color='#DFFD51' />
            </mesh>
        </RigidBody>
      )}
    </>
  )
}
