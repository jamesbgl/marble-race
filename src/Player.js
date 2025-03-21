import { useFrame } from '@react-three/fiber'
import { useRapier, RigidBody } from '@react-three/rapier'
import { useKeyboardControls } from '@react-three/drei'
import { useState, useEffect, useRef } from 'react'
import * as THREE from 'three'
import useGame from './stores/useGame.js'
import TrajectoryLine from './TrajectoryLine.js'

export default function Player() {
  const body = useRef()
  const [subscribeKeys, getKeys] = useKeyboardControls()
  const { rapier, world } = useRapier()
  const rapierWorld = world.raw()

  const [overviewAnimation, setOverviewAnimation] = useState({ 
    time: 0,
    isComplete: false
  })
  const [aimDirection, setAimDirection] = useState(0) // -1 to 1 for direction
  const [hasLaunched, setHasLaunched] = useState(false)
  const [powerLevel, setPowerLevel] = useState(0)
  const [stopTimeout, setStopTimeout] = useState(null)
  const wasKeyPressed = useRef(false)

  const [smoothedCameraPosition] = useState(() => new THREE.Vector3(10, 10, 10))
  const [smoothedCameraTarget] = useState(() => new THREE.Vector3())

  const start = useGame((state) => state.start)
  const end = useGame((state) => state.end)
  const restart = useGame((state) => state.restart)
  const blocksCount = useGame((state) => state.blocksCount)
  const hasShownCourseOverview = useGame((state) => state.hasShownCourseOverview)
  const completeCourseOverview = useGame((state) => state.completeCourseOverview)
  const phase = useGame((state) => state.phase)
  const setPower = useGame((state) => state.setPower)

  const reset = () => {
    body.current.setTranslation({ x: 0, y: 1, z: 0 })
    body.current.setLinvel({ x: 0, y: 0, z: 0 })
    body.current.setAngvel({ x: 0, y: 0, z: 0 })
    setOverviewAnimation({ time: 0, isComplete: false })
    setAimDirection(0)
    setHasLaunched(false)
    setPowerLevel(0)
    setPower(0)
    wasKeyPressed.current = false
    if (stopTimeout) {
      clearTimeout(stopTimeout)
      setStopTimeout(null)
    }
  }

  const launchMarble = () => {
    if (!hasLaunched && powerLevel >= 0.3) { // Minimum 30% power required
      const minSpeed = 30  // Increased from 15
      const maxSpeed = 120  // Increased from 40
      const launchSpeed = minSpeed + (maxSpeed - minSpeed) * powerLevel
      const launchAngle = aimDirection * Math.PI / 6 // Max 30 degrees left or right
      
      const velocityX = Math.sin(launchAngle) * launchSpeed
      const velocityZ = -Math.cos(launchAngle) * launchSpeed
      
      body.current.setLinvel({ x: velocityX, y: 0, z: velocityZ })
      body.current.setAngvel({ x: -velocityZ * 2, y: 0, z: -velocityX * 2 })
      
      setHasLaunched(true)
      setPowerLevel(0)
      setPower(0)
      start()
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

    /**
     * Camera
     */
    const bodyPosition = body.current.translation()

    const cameraPosition = new THREE.Vector3()
    cameraPosition.copy(bodyPosition)
    cameraPosition.z += 2.25
    cameraPosition.y += 0.65

    const cameraTarget = new THREE.Vector3()
    cameraTarget.copy(bodyPosition)
    cameraTarget.y += 0.25

    smoothedCameraPosition.lerp(cameraPosition, 5 * delta)
    smoothedCameraTarget.lerp(cameraTarget, 5 * delta)

    state.camera.position.copy(smoothedCameraPosition)
    state.camera.lookAt(smoothedCameraTarget)

    /**
     * Phases
     */
    if (bodyPosition.z < -(blocksCount * 16 + 2)) end()
    if (bodyPosition.y < -4) restart()

    // Handle power charging and launching
    if (!hasLaunched && hasShownCourseOverview) {
      if (keys.forward) {
        wasKeyPressed.current = true
        const newPower = Math.min(powerLevel + delta * 0.75, 1)
        setPowerLevel(newPower)
        setPower(newPower)
      } else if (wasKeyPressed.current) {
        // Key was released
        wasKeyPressed.current = false
        if (powerLevel >= 0.3) {
          launchMarble()
        } else {
          setPowerLevel(0)
          setPower(0)
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

    if (!hasShownCourseOverview && !overviewAnimation.isComplete) {
      // Course overview animation
      const animationDuration = 4 // seconds
      overviewAnimation.time += delta
      
      const progress = Math.min(overviewAnimation.time / animationDuration, 1)
      const trackLength = blocksCount * 4
      
      // Starting position (bird's eye view)
      const startPosition = new THREE.Vector3(0, 20, -trackLength / 2)
      const startTarget = new THREE.Vector3(0, 0, -trackLength / 2)
      
      // Ending position (aiming view)
      const endPosition = new THREE.Vector3(0, 2, 4) // Position for aiming
      const endTarget = new THREE.Vector3(0, 0, 0) // Look at the marble
      
      // Use easeInOutCubic for smooth transition
      const ease = (t) => {
        return t < 0.5
          ? 4 * t * t * t
          : 1 - Math.pow(-2 * t + 2, 3) / 2
      }
      
      const easedProgress = ease(progress)
      
      // Interpolate between start and end positions
      const cameraPosition = new THREE.Vector3().lerpVectors(
        startPosition,
        endPosition,
        easedProgress
      )
      
      const targetPosition = new THREE.Vector3().lerpVectors(
        startTarget,
        endTarget,
        easedProgress
      )
      
      state.camera.position.copy(cameraPosition)
      state.camera.lookAt(targetPosition)
      
      if (progress >= 1) {
        setOverviewAnimation(prev => ({ ...prev, isComplete: true }))
        completeCourseOverview()
      }
      
      return
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

  return (
    <>
      <TrajectoryLine 
        aimDirection={aimDirection} 
        visible={!hasLaunched && hasShownCourseOverview} 
      />
      <RigidBody
        ref={body}
        colliders='ball'
        restitution={0.8}
        friction={1}
        linearDamping={0.2}
        angularDamping={0.2}
        position={[0, 1, 0]}
      >
        <mesh>
          <icosahedronGeometry args={[0.3, 1]} />
          <meshStandardMaterial flatShading color='mediumpurple' />
        </mesh>
      </RigidBody>
    </>
  )
}
