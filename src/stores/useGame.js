import create from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

export default create(
  subscribeWithSelector((set) => {
    return {
      blocksCount: 10,
      blocksSeed: 0,
      hasShownCourseOverview: false,
      power: 0,

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
              power: 0
            }

          return {}
        })
      },
      end: () => {
        set((state) => {
          if (state.phase === 'playing')
            return { phase: 'ended', endTime: Date.now() }

          return {}
        })
      },
      completeCourseOverview: () => {
        set(() => ({ hasShownCourseOverview: true }))
      }
    }
  })
)
