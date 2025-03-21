# Obstacles
,
## Overview
The obstacle system provides various challenges throughout the track, requiring players to navigate through different types of moving and static obstacles.
,
## Current Implementation
- Three obstacle types
- Dynamic movement patterns
- Physics-based interactions
- Random placement system
,
### Obstacle Types
1. Spinner
   - Rotating obstacle
   - Random speed/direction
   - Kinematic body
   - Hull collider
,
2. Limbo
   - Vertical movement
   - Sinusoidal pattern
   - Random phase offset
   - Kinematic body
,
3. Axe
   - Horizontal movement
   - Sinusoidal pattern
   - Random phase offset
   - Kinematic body
,
## Technical Requirements
,
### Movement Patterns
- Must be predictable
- Must be challenging
- Must be fair
- Must be varied
,
### Physics
- Must have proper collisions
- Must maintain momentum
- Must be stable
- Must handle edge cases
,
### Performance
- Must be efficient
- Must not cause lag
- Must handle many instances
- Must be optimized
,
## Acceptance Criteria
1. Obstacles move smoothly
2. Collisions work correctly
3. Patterns are consistent
4. Placement is fair
5. Performance is stable
,
## Dependencies
- @react-three/rapier
- Three.js
- React Three Fiber
- Zustand
,
## Known Issues
1. Occasional physics glitches
2. Edge case collisions
3. Performance with many obstacles
4. Mobile device limitations
,
## Planned Improvements
1. More obstacle types
2. Custom movement patterns
3. Interactive obstacles
4. Special effects
5. Mobile optimization
,
## Implementation Notes
- Obstacle logic in Level component
- Physics in Rapier
- Movement patterns in useFrame
- State management in Zustand
,
## Testing Requirements
1. Movement pattern tests
2. Physics behavior tests
3. Performance benchmarks
4. Mobile compatibility tests
5. Edge case handling
,
## Related Features
- [Track System](../core-mechanics/track-system.md)
- [Level Generation](./generation.md)
- [Boundaries](./boundaries.md)
- [Performance](../technical/performance.md) 