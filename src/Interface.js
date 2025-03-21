import { useRef } from 'react'
import useGame from './stores/useGame.js'

export default function Interface() {
    const power = useGame((state) => state.power)
    const phase = useGame((state) => state.phase)
    const restart = useGame((state) => state.restart)

    return <div className="interface">
        {/* Restart button */}
        { phase === 'ended' && <div className="restart" onClick={ restart }>RESTART</div> }

        {/* Power bar */}
        { (phase === 'ready' || phase === 'playing') && (
            <div className="power-bar-container">
                <div 
                    className="power-bar-fill"
                    style={{ 
                        width: `${power * 100}%`,
                        backgroundColor: power >= 0.3 ? '#4CAF50' : '#ff6b6b'
                    }}
                />
                <div 
                    className="power-bar-threshold"
                    style={{ left: '30%' }}
                />
                {power < 0.3 && (
                    <div className="power-bar-text">
                        Hold W or ↑ to charge (min 30% required)
                    </div>
                )}
            </div>
        )}
    </div>
}
