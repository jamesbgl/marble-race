import { addEffect } from '@react-three/fiber'
import { useKeyboardControls } from '@react-three/drei'
import useGame from './stores/useGame.js'
import { useEffect, useRef } from 'react'

export default function Interface() {
  const time = useRef()

  const restart = useGame((state) => state.restart)
  const phase = useGame((state) => state.phase)
  const power = useGame((state) => state.power)

  useEffect(() => {
    const unsubscribeEffect = addEffect(() => {
      const state = useGame.getState()

      let elapsedTime = 0

      if (state.phase === 'playing') {
        elapsedTime = Date.now() - state.startTime
      } else if (state.phase === 'ended') {
        elapsedTime = state.endTime - state.startTime
      }

      elapsedTime /= 1000
      elapsedTime = elapsedTime.toFixed(2)

      if (time.current && state.phase !== 'playing') {
        time.current.textContent = elapsedTime
      }
    })

    return () => unsubscribeEffect()
  }, [])

  return (
    <div className='interface'>
      {/* Only show timer when not playing */}
      <div ref={time} className='time' style={{ display: phase === 'playing' ? 'none' : 'block' }}>
        0.00
      </div>

      {phase === 'ended' && (
        <div className='restart' onPointerUp={restart}>
          Restart
        </div>
      )}

      {/* Power bar */}
      {phase === 'ready' && (
        <div className='power-bar-container'>
          <div 
            className='power-bar-fill' 
            style={{ 
              width: `${power * 100}%`,
              backgroundColor: power >= 0.3 ? '#4CAF50' : '#ff6b6b'
            }}
          />
          <div className='power-bar-threshold' style={{ left: '30%' }} />
          {power < 0.3 && (
            <div className='power-bar-text'>
              Hold to charge (min 30% required)
            </div>
          )}
        </div>
      )}
    </div>
  )
}
