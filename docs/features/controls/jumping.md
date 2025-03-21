# Jumping Mechanics
,
## Overview
The jumping system allows players to overcome obstacles and navigate the track by applying vertical force to the marble when grounded.
,
## Current Implementation
- Space bar activation
- Ground detection
- Physics-based jump force
- Cooldown system
,
### Jump Components
1. Activation
   - Space bar input
   - Ground check
   - Force application
   - Cooldown management
,
2. Physics
   - Jump force: 0.5 units
   - Ground detection: 0.15 units
   - Cooldown: None
   - Momentum preservation
,
3. Camera
   - Smooth follow
   - Height adjustment
   - Perspective maintenance
,
## Technical Requirements
,
### Ground Detection
- Must be precise
- Must handle slopes
- Must prevent double jumps
- Must work with all surfaces
,
### Jump Physics
- Must apply consistent force
- Must maintain horizontal momentum
- Must respect gravity
- Must handle collisions
,
### Performance Requirements
- Instant response
- No physics glitches
- Smooth animation
- Consistent behavior
,
## Acceptance Criteria
1. Jumps only when grounded
2. Consistent jump height
3. Maintains momentum
4. Smooth camera follow
5. No physics glitches
,
## Dependencies
- @react-three/rapier
- @react-three/drei
- React
- Zustand
,
## Known Issues
1. Edge case ground detection
2. Slope jumping inconsistencies
3. Camera jitter on jump
4. Mobile device limitations
,
## Planned Improvements
1. Variable jump height
2. Double jump ability
3. Jump effects
4. Advanced jump mechanics
5. Mobile touch controls
,
## Implementation Notes
- Jump logic in Player component
- Physics in Rapier
- Camera in Player component
- State management in Zustand
,
## Testing Requirements
1. Ground detection tests
2. Physics behavior tests
3. Camera follow tests
4. Performance benchmarks
5. Mobile compatibility tests
,
## Related Features
- [Movement Controls](./movement.md)
- [Camera System](./camera.md)
- [Marble Physics](../core-mechanics/marble-physics.md)
- [Performance](../technical/performance.md) 