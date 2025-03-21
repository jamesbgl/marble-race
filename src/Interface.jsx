import { useRef, useEffect, useState } from 'react'
import useGame from './stores/useGame.js'
import { soundEffects } from './Level.js'

export default function Interface() {
    const power = useGame((state) => state.power)
    const phase = useGame((state) => state.phase)
    const restart = useGame((state) => state.restart)
    const hasShownCourseOverview = useGame((state) => state.hasShownCourseOverview)
    const currentMultiplier = useGame((state) => state.currentMultiplier)
    const finalMultiplier = useGame((state) => state.finalMultiplier)
    const winnings = useGame((state) => state.winnings)
    const [displayedWinnings, setDisplayedWinnings] = useState(0)

    // Animation for winnings display and odometer effect
    useEffect(() => {
        if (phase === 'ended') {
            // Play cash-in sound using the existing sound system
            soundEffects.playCashInSound()

            // Create confetti effect
            const colors = ['#FFD700', '#FF6B6B', '#4CAF50', '#64B5F6', '#BA68C8']
            for (let i = 0; i < 100; i++) {
                const confetti = document.createElement('div')
                confetti.className = 'confetti'
                confetti.style.left = Math.random() * 100 + 'vw'
                confetti.style.animationDelay = Math.random() * 3 + 's'
                confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)]
                document.body.appendChild(confetti)

                // Clean up confetti after animation
                setTimeout(() => confetti.remove(), 5000)
            }

            // Odometer animation
            const duration = 2000 // 2 seconds
            const steps = 60
            const stepDuration = duration / steps
            const stepAmount = winnings / steps

            let currentStep = 0
            const interval = setInterval(() => {
                currentStep++
                setDisplayedWinnings(stepAmount * currentStep)
                if (currentStep >= steps) {
                    setDisplayedWinnings(winnings)
                    clearInterval(interval)
                }
            }, stepDuration)

            return () => clearInterval(interval)
        }
    }, [phase, winnings])

    // Cleanup confetti on unmount or restart
    useEffect(() => {
        return () => {
            const confetti = document.querySelectorAll('.confetti')
            confetti.forEach(c => c.remove())
        }
    }, [])

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

        {/* Winnings Display */}
        {phase === 'ended' && (
            <div className="winnings-display">
                <div className="winnings-text">
                    You Won:
                    <div className="winnings-amount">
                        ${displayedWinnings.toFixed(2)}
                    </div>
                </div>
                <button className="play-again-button" onClick={restart}>
                    Play Again
                </button>
            </div>
        )}

        {/* Power bar */}
        {(phase === 'ready' && hasShownCourseOverview) && (
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