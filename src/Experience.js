import { Physics } from '@react-three/rapier'
import { Level } from './Level.js'
import Lights from './Lights.js'
import Player from './Player.js'
import Effects from './Effects.js'
import useGame from './stores/useGame.js'

export default function Experience() {
  const blocksCount = useGame((state) => state.blocksCount)
  const phase = useGame((state) => state.phase)

  return (
    <>
      <color args={['#252731']} attach='background' />
      <Physics>
        {/* <Debug /> */}
        <Lights />
        <Level count={blocksCount} />
        {phase === 'ready' || phase === 'playing' ? <Player /> : null}
      </Physics>

      <Effects />
    </>
  )
}
