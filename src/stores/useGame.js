import create from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

export default create(
  subscribeWithSelector((set) => {
    return {
      blocksCount: 10,
      blocksSeed: 0,
      hasShownCourseOverview: false,
      power: 0,
      currentMultiplier: 0,
      finalMultiplier: 0,
      stake: 1, // Fixed stake amount
      winnings: 0, // Track winnings

      /**
       * Time
       */
      startTime: 0,
      time: 0,

      /**
       * Phases
       */
      phase: 'ready',

      setPower: (power) => {
        set({ power })
      },

      setCurrentMultiplier: (multiplier) => {
        set({ currentMultiplier: multiplier })
      },

      setFinalMultiplier: (multiplier) => {
        set((state) => ({ 
          finalMultiplier: multiplier,
          winnings: state.stake * multiplier // Calculate winnings
        }))
      },

      start: () => {
        set((state) => {
          if (state.phase === 'ready')
            return { phase: 'playing', startTime: Date.now() }

          return {}
        })
      },

      restart: () => {
        set((state) => {
          if (state.phase === 'playing' || state.phase === 'ended')
            return { 
              phase: 'ready', 
              blocksSeed: Math.random(), 
              power: 0,
              currentMultiplier: 0,
              finalMultiplier: 0,
              winnings: 0 // Reset winnings
            }

          return {}
        })
      },

      end: () => {
        set((state) => {
          if (state.phase === 'playing')
            return { 
              phase: 'ended', 
              endTime: Date.now(),
              finalMultiplier: state.currentMultiplier,
              winnings: state.stake * state.currentMultiplier // Calculate final winnings
            }

          return {}
        })
      },

      completeCourseOverview: () => {
        set(() => ({ hasShownCourseOverview: true }))
      }
    }
  })
)
