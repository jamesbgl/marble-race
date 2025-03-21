import { useRef, useEffect, useState } from 'react'
import useGame from './stores/useGame.js'
import { soundEffects } from './Level.js'
import { useKeyboardControls } from '@react-three/drei'
import { addEffect } from '@react-three/fiber'

export default function Interface() {
    const power = useGame((state) => state.power)
    const phase = useGame((state) => state.phase)
    const restart = useGame((state) => state.restart)
    const hasShownCourseOverview = useGame((state) => state.hasShownCourseOverview)
    const currentMultiplier = useGame((state) => state.currentMultiplier)
    const finalMultiplier = useGame((state) => state.finalMultiplier)
    const winnings = useGame((state) => state.winnings)
    const balance = useGame((state) => state.balance)
    const stake = useGame((state) => state.stake)
    const [displayedWinnings, setDisplayedWinnings] = useState(0)
    const [displayedBalance, setDisplayedBalance] = useState(50) // Start with initial balance
    const previousBalance = useRef(50)

    // Balance animation
    useEffect(() => {
        if (balance !== previousBalance.current) {
            const startValue = previousBalance.current
            const endValue = balance
            const duration = 1000 // 1 second
            const steps = 30
            const stepDuration = duration / steps
            const increment = (endValue - startValue) / steps

            let currentStep = 0
            const interval = setInterval(() => {
                currentStep++
                setDisplayedBalance(startValue + (increment * currentStep))
                if (currentStep >= steps) {
                    setDisplayedBalance(endValue)
                    clearInterval(interval)
                }
            }, stepDuration)

            previousBalance.current = balance
            return () => clearInterval(interval)
        }
    }, [balance])

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
        {/* Balance display */}
        <div className={`balance ${balance !== previousBalance.current ? 'balance-change' : ''}`}>
            Balance: ${displayedBalance.toFixed(2)}
        </div>

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
        {(phase === 'ready') && (
            <div className="power-bar-container">
                <div 
                    className="power-bar-fill"
                    style={{ 
                        width: `${power * 100}%`,
                        backgroundColor: '#4CAF50'
                    }}
                />
                <div className="power-bar-text">
                    Hold W or ↑ to charge
                </div>
            </div>
        )}

        {/* Stake controls */}
        <div className={`stake-controls ${phase !== 'ready' ? 'fade-out' : ''}`}>
            <div className="stake-adjust">
                <button 
                    className="stake-button" 
                    onClick={() => useGame.getState().setStake(-0.1)}
                    disabled={phase !== 'ready'}
                >
                    -
                </button>
                <div className="stake-display">
                    STAKE
                    <div className="stake-amount">${stake.toFixed(2)}</div>
                </div>
                <button 
                    className="stake-button" 
                    onClick={() => useGame.getState().setStake(0.1)}
                    disabled={phase !== 'ready'}
                >
                    +
                </button>
            </div>
        </div>
    </div>
} 