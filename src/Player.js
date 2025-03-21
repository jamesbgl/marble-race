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
  const [isAnimating, setIsAnimating] = useState(true)
  const animationProgress = useRef(0)
  const [showBall, setShowBall] = useState(false)

  const cameraPosition = useRef(new THREE.Vector3(0, 2, 4))
  const cameraTarget = useRef(new THREE.Vector3(0, 0.25, 0))

  const start = useGame((state) => state.start)
  const end = useGame((state) => state.end)
  const restart = useGame((state) => state.restart)
  const blocksCount = useGame((state) => state.blocksCount)
  const hasShownCourseOverview = useGame((state) => state.hasShownCourseOverview)
  const completeCourseOverview = useGame((state) => state.completeCourseOverview)
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
    setIsAnimating(true)
    animationProgress.current = 0
    setShowBall(false)
    
    // Reset camera to initial position
    cameraPosition.current.set(0, 2, 4)
    cameraTarget.current.set(0, 0.25, 0)
    
    if (stopTimeout) {
      clearTimeout(stopTimeout)
      setStopTimeout(null)
    }
  }

  const launchMarble = () => {
    if (!hasLaunched && powerLevel >= 0.3) { // Minimum 30% power required
      const minSpeed = 30
      const maxSpeed = 120
      const launchSpeed = minSpeed + (maxSpeed - minSpeed) * powerLevel
      const launchAngle = aimDirection * Math.PI / 6
      
      const velocityX = Math.sin(launchAngle) * launchSpeed
      const velocityZ = -Math.cos(launchAngle) * launchSpeed
      
      body.current.setLinvel({ x: velocityX, y: 0, z: velocityZ })
      body.current.setAngvel({ x: -velocityZ * 2, y: 0, z: -velocityX * 2 })
      
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
      if (!hasLaunched && hasShownCourseOverview) {
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
  }, [hasShownCourseOverview, hasLaunched, aimDirection])

  useFrame((state, delta) => {
    const keys = getKeys()
    const bodyPosition = body.current?.translation() || new THREE.Vector3(0, 1, 0)

    /**
     * Camera
     */
    if (isAnimating && !hasShownCourseOverview) {
      animationProgress.current += delta * 0.33 // 3 seconds total (1/3 per second)
      
      if (animationProgress.current >= 1) {
        animationProgress.current = 1
        setIsAnimating(false)
        completeCourseOverview()
      }

      // Calculate camera position and target for the fly-through
      const trackLength = 200 // Approximate length of the track
      const startZ = -trackLength // Start at the back
      const endZ = 0 // End at the start
      const currentZ = startZ + (endZ - startZ) * animationProgress.current

      // Camera height varies during animation
      const baseHeight = 2
      const heightVariation = Math.sin(animationProgress.current * Math.PI) * 3
      const currentHeight = baseHeight + heightVariation

      // Camera distance varies during animation
      const baseDistance = 4
      const distanceVariation = Math.sin(animationProgress.current * Math.PI * 2) * 2
      const currentDistance = baseDistance + distanceVariation

      // Set camera position and target
      cameraPosition.current.set(0, currentHeight, currentZ + currentDistance)
      cameraTarget.current.set(0, 0.25, currentZ)

      // Show the ball when camera is halfway through the animation
      if (animationProgress.current > 0.5 && !showBall) {
        setShowBall(true)
        body.current.setTranslation({ x: 0, y: 1, z: 0 })
      }
    } else {
      // Regular camera follow
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
    }

    /**
     * Phases
     */
    if (bodyPosition.y < -4) restart()

    // Handle power charging and launching
    if (!hasLaunched && hasShownCourseOverview) {
      if (keys.forward) {
        if (!wasKeyPressed.current) {
          // Start charging sound when key is first pressed
          soundEffects.startChargingSound()
        }
        wasKeyPressed.current = true
        const newPower = Math.min(powerLevel + delta * 0.75, 1)
        setPowerLevel(newPower)
        setPower(newPower)
        // Update charging sound pitch and volume
        soundEffects.updateChargingSound(newPower)
      } else if (wasKeyPressed.current) {
        // Key was released
        wasKeyPressed.current = false
        if (powerLevel >= 0.3) {
          launchMarble()
        } else {
          setPowerLevel(0)
          setPower(0)
          // Stop charging sound if power was too low
          soundEffects.stopChargingSound()
        }
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
        visible={!hasLaunched && hasShownCourseOverview} 
      />
      {showBall && (
        <RigidBody
          ref={body}
          colliders='ball'
          restitution={0.8}
          friction={1}
          linearDamping={0.2}
          angularDamping={0.2}
          position={[0, 1, 0]}
          name="marble"
        >
          <mesh>
            <sphereGeometry args={[0.3, 64, 64]} />
            <meshPhongMaterial color='#DFFD51' shininess={100} />
          </mesh>
        </RigidBody>
      )}
    </>
  )
}
