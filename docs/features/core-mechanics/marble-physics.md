# Marble Physics

## Overview
The marble physics system is the core gameplay mechanic that determines how the player's marble moves and interacts with the track and obstacles.

## Current Implementation
- Uses Rapier physics engine through @react-three/rapier
- Ball collider with radius 0.3 units
- Standard material with medium purple color
- Flat shading for visual style

### Physics Properties
- Restitution: 0.2 (bounciness)
- Friction: 1.0 (surface grip)
- Linear Damping: 0.5 (air resistance)
- Angular Damping: 0.5 (rotation resistance)

## Technical Requirements

### Collision Detection
- Must detect collisions with:
  - Track surface
  - Obstacles
  - Track boundaries
  - Other game objects

### Movement Forces
- Must respond to:
  - Gravity
  - Player input forces
  - Collision reactions
  - Surface friction

### Performance Requirements
- Physics calculations must run at 60fps
- Collision detection must be precise
- No physics glitches or unexpected behavior

## Acceptance Criteria
1. Marble rolls smoothly on flat surfaces
2. Marble responds realistically to slopes
3. Marble maintains momentum appropriately
4. No clipping through surfaces
5. Consistent behavior across different devices

## Dependencies
- @react-three/rapier
- Three.js
- React Three Fiber

## Known Issues
1. Occasional physics glitches on steep slopes
2. Minor bouncing inconsistencies
3. Edge cases with obstacle collisions

## Planned Improvements
1. Add particle effects for rolling
2. Implement surface material variations
3. Add sound effects based on surface type
4. Improve collision response on edges
5. Add visual trail effects

## Implementation Notes
- Physics calculations are handled in the Player component
- Collision masks are used to optimize performance
- Custom collision handlers for special effects
- Physics properties can be tuned in the Player component

## Testing Requirements
1. Unit tests for physics calculations
2. Integration tests for collision detection
3. Performance benchmarks
4. Cross-browser compatibility tests
5. Mobile device testing

## Related Features
- [Movement Controls](../controls/movement.md)
- [Jumping Mechanics](../controls/jumping.md)
- [Track System](./track-system.md)
- [Obstacles](../level-design/obstacles.md) 