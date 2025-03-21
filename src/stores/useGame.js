import create from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

export default create(
  subscribeWithSelector((set) => {
    return {
      blocksCount: 10,
      blocksSeed: 0,
      hasShownCourseOverview: true,
      power: 0,
      currentMultiplier: 0,
      finalMultiplier: 0,
      stake: 1, // Fixed stake amount
      winnings: 0, // Track winnings
      balance: 50, // Starting balance

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

      setStake: (adjustment) => {
        set((state) => {
          const newStake = Math.max(0.1, Math.round((state.stake + adjustment) * 10) / 10)
          return { stake: newStake }
        })
      },

      setCurrentMultiplier: (multiplier) => {
        set({ currentMultiplier: multiplier })
      },

      setFinalMultiplier: (multiplier) => {
        set((state) => ({ 
          finalMultiplier: multiplier,
          winnings: state.stake * multiplier, // Calculate winnings
          balance: state.balance + (state.stake * multiplier) // Add winnings to balance
        }))
      },

      start: () => {
        set((state) => {
          if (state.phase === 'ready')
            return { 
              phase: 'playing', 
              startTime: Date.now(),
              balance: state.balance - state.stake // Deduct stake when launching
            }

          return {}
        })
      },

      restart: () => {
        set((state) => {
          if (state.phase === 'playing' || state.phase === 'ended') {
            // If ball went out of bounds (phase is playing), refund the stake
            const refund = state.phase === 'playing' ? state.stake : 0
            return { 
              phase: 'ready', 
              blocksSeed: Math.random(), 
              power: 0,
              currentMultiplier: 0,
              finalMultiplier: 0,
              winnings: 0,
              balance: state.balance + refund // Add refund if ball went out of bounds
            }
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
              winnings: state.stake * state.currentMultiplier,
              balance: state.balance + (state.stake * state.currentMultiplier) // Add winnings to balance
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
