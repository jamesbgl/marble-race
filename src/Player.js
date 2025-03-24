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
  const lastCollisionTime = useRef(0)
  const lastCollisionSpeed = useRef(0)

  const [aimDirection, setAimDirection] = useState(0)
  const [hasLaunched, setHasLaunched] = useState(false)
  const [powerLevel, setPowerLevel] = useState(0)
  const [stopTimeout, setStopTimeout] = useState(null)
  const wasKeyPressed = useRef(false)
  const [showBall, setShowBall] = useState(true)

  const cameraPosition = useRef(new THREE.Vector3(0, 3, 4))
  const cameraTarget = useRef(new THREE.Vector3(0, 0.25, -4))

  const start = useGame((state) => state.start)
  const end = useGame((state) => state.end)
  const restart = useGame((state) => state.restart)
  const blocksCount = useGame((state) => state.blocksCount)
  const hasShownCourseOverview = useGame((state) => state.hasShownCourseOverview)
  const phase = useGame((state) => state.phase)
  const setPower = useGame((state) => state.setPower)
  const setCurrentMultiplier = useGame((state) => state.setCurrentMultiplier)

  const lastVelocity = useRef(new THREE.Vector3())

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
    cameraPosition.current.set(0, 3, 4)
    cameraTarget.current.set(0, 0.25, -4)
    
    if (stopTimeout) {
      clearTimeout(stopTimeout)
      setStopTimeout(null)
    }
  }

  const launchMarble = () => {
    if (!hasLaunched && powerLevel >= 0.3) { // Minimum 30% power required
      const minSpeed = 8 // Reduced from 10 for even gentler start
      const maxSpeed = 35 // Reduced from 40 for more controlled movement
      const launchSpeed = minSpeed + (maxSpeed - minSpeed) * powerLevel
      const launchAngle = aimDirection * Math.PI / 6
      
      const velocityX = Math.sin(launchAngle) * launchSpeed
      const velocityZ = -Math.cos(launchAngle) * launchSpeed
      
      // Even smoother initial velocity with reduced values
      body.current.setLinvel({ 
        x: velocityX, 
        y: 0, 
        z: velocityZ 
      })
      
      // Reduced initial rotation for smoother start
      body.current.setAngvel({ 
        x: -velocityZ * 1.2, // Reduced from 1.5 for smoother rotation
        y: 0, 
        z: -velocityX * 1.2
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
    const currentVelocity = body.current?.linvel() || new THREE.Vector3()

    // Check for collisions by monitoring velocity changes
    if (hasLaunched) {
      const velocityDiff = currentVelocity.clone().sub(lastVelocity.current)
      const speedDiff = velocityDiff.length()
      
      // If there's a significant velocity change, it might be a collision
      if (speedDiff > 2) {
        const now = performance.now()
        // Debounce collision sounds (minimum 50ms between sounds)
        if (now - lastCollisionTime.current > 50) {
          const speed = Math.sqrt(currentVelocity.x * currentVelocity.x + 
                                currentVelocity.y * currentVelocity.y + 
                                currentVelocity.z * currentVelocity.z)
          
          // Only play sound if impact speed is significant
          if (speed > 2) {
            soundEffects.playCollisionSound(speed)
            lastCollisionTime.current = now
          }
        }
      }

      // Check for boost pad collision
      const boostPads = [
        { x: 0, z: -24, boost: 3 },     // Early gentle boost before first hammer
        { x: -2, z: -56, boost: 4 },    // Help navigate around first hammer
        { x: 2, z: -88, boost: 4 },     // Recovery path before second hammer
        { x: -2, z: -120, boost: 5 },   // Help with third hammer section
        { x: 0, z: -152, boost: 5 },    // Strategic boost near high multiplier
        { x: 2, z: -184, boost: 6 }     // Final boost for end game
      ]

      for (const pad of boostPads) {
        const distance = Math.sqrt(
          Math.pow(bodyPosition.x - pad.x, 2) + 
          Math.pow(bodyPosition.z - pad.z, 2)
        )
        
        if (distance < 1.2) { // Increased detection radius from 1 to 1.2
          // Apply boost force in the negative z direction
          const boostForce = pad.boost
          body.current.setLinvel({
            x: currentVelocity.x,
            y: currentVelocity.y,
            z: currentVelocity.z - boostForce
          })
          soundEffects.playFireSound(boostForce / 100) // Play boost sound
        }
      }

      // Check for speed boost collision
      const boostZones = [
        { x: -2, z: -144, boost: 25 }, // Speed boost at z = -144
      ]

      boostZones.forEach(zone => {
        const distance = Math.sqrt(
          Math.pow(bodyPosition.x - zone.x, 2) + 
          Math.pow(bodyPosition.z - zone.z, 2)
        )
        
        if (distance < 0.5) { // If marble is close enough to boost zone
          const currentSpeed = Math.sqrt(
            currentVelocity.x * currentVelocity.x + 
            currentVelocity.z * currentVelocity.z
          )
          
          // Apply boost in the direction of current velocity
          const boostDirection = new THREE.Vector3(
            currentVelocity.x / currentSpeed,
            0,
            currentVelocity.z / currentSpeed
          )
          
          const boostForce = boostDirection.multiplyScalar(zone.boost)
          body.current.setLinvel({
            x: currentVelocity.x + boostForce.x,
            y: currentVelocity.y,
            z: currentVelocity.z + boostForce.z
          })
        }
      })
    }
    
    // Update last velocity for next frame
    lastVelocity.current.copy(currentVelocity)

    /**
     * Camera
     */
    const targetPosition = new THREE.Vector3(
      bodyPosition.x,
      hasLaunched ? bodyPosition.y + 8 : bodyPosition.y + 2,  // Much higher camera when launched
      bodyPosition.z + (hasLaunched ? 12 : 4)  // Further back when launched
    )
    
    const targetLookAt = new THREE.Vector3(
      bodyPosition.x,
      hasLaunched ? bodyPosition.y - 2 : bodyPosition.y,  // Look more downward when launched
      bodyPosition.z - (hasLaunched ? 30 : 8)  // Look further ahead when launched
    )

    // Faster camera movement with adjusted lerp speed
    const cameraSpeed = hasLaunched ? 4 : 6  // Keep the same speed
    cameraPosition.current.lerp(targetPosition, delta * cameraSpeed)
    cameraTarget.current.lerp(targetLookAt, delta * cameraSpeed)

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
          colliders="ball"
          restitution={0.4} // Reduced from 0.5 for softer bounces
          friction={0.7} // Increased from 0.6 for better control
          linearDamping={0.03} // Reduced from 0.05 for smoother movement
          angularDamping={0.03} // Reduced from 0.05 for smoother rotation
          position={[0, 1, 0]}
          name="marble"
          mass={1.5} // Reduced from 2 for better control
        >
          <mesh castShadow>
            <icosahedronGeometry args={[0.3, 2]} />
            <meshStandardMaterial flatShading color="#DFFD51" />
          </mesh>
        </RigidBody>
      )}
    </>
  )
}
