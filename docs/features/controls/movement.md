# Movement Controls
,
## Overview
The movement system provides intuitive controls for the marble using keyboard input, translating player actions into physics-based movement.
,
## Current Implementation
- WASD/Arrow key controls
- Physics-based movement
- Smooth acceleration
- Momentum preservation
,
### Control Scheme
1. Forward/Backward
   - W/Up Arrow: Forward
   - S/Down Arrow: Backward
   - Affects Z-axis movement
,
2. Left/Right
   - A/Left Arrow: Left
   - D/Right Arrow: Right
   - Affects X-axis movement
,
3. Combined Movement
   - Diagonal movement support
   - Momentum preservation
   - Smooth transitions
,
## Technical Requirements
,
### Input Handling
- Must support both WASD and Arrow keys
- Must handle key combinations
- Must prevent key conflicts
- Must work across browsers
,
### Movement Physics
- Must apply forces correctly
- Must maintain momentum
- Must respect surface friction
- Must handle collisions properly
,
### Performance Requirements
- Input lag < 16ms
- Smooth movement
- Consistent behavior
- No physics glitches
,
## Acceptance Criteria
1. Responsive to all inputs
2. Smooth acceleration
3. Natural deceleration
4. Consistent behavior
5. No input conflicts
,
## Dependencies
- @react-three/drei (KeyboardControls)
- @react-three/rapier
- React
- Zustand
,
## Known Issues
1. Mobile device limitations
2. Browser input differences
3. Edge case physics glitches
4. Performance on low-end devices
,
## Planned Improvements
1. Touch controls
2. Gamepad support
3. Custom control mapping
4. Movement tutorials
5. Advanced movement techniques
,
## Implementation Notes
- Input handling in Player component
- Physics forces in Rapier
- State management in Zustand
- Performance optimization techniques
,
## Testing Requirements
1. Input response tests
2. Physics behavior tests
3. Performance benchmarks
4. Cross-browser tests
5. Mobile compatibility tests
,
## Related Features
- [Jumping Mechanics](./jumping.md)
- [Camera System](./camera.md)
- [Marble Physics](../core-mechanics/marble-physics.md)
- [Performance](../technical/performance.md) 