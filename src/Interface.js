import { useRef } from 'react'
import useGame from './stores/useGame.js'

export default function Interface() {
    const power = useGame((state) => state.power)
    const phase = useGame((state) => state.phase)
    const restart = useGame((state) => state.restart)
    const hasShownCourseOverview = useGame((state) => state.hasShownCourseOverview)
    const currentMultiplier = useGame((state) => state.currentMultiplier)
    const finalMultiplier = useGame((state) => state.finalMultiplier)

    return <div className="interface">
        {/* Game Status */}
        <div className="status">
            {phase === 'ready' && hasShownCourseOverview && (
                <div className="status-text">Waiting</div>
            )}
            {phase === 'playing' && (
                <div className="status-text">
                    {currentMultiplier}x
                </div>
            )}
            {phase === 'ended' && (
                <div className="status-text final">
                    Final: {finalMultiplier}x!
                </div>
            )}
        </div>

        {/* Restart button */}
        { phase === 'ended' && <div className="restart" onClick={ restart }>RESTART</div> }

        {/* Power bar */}
        { (phase === 'ready' && hasShownCourseOverview) && (
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
