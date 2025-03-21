# Physics Architecture

## Overview
The physics system in Marble Race is built on top of the Rapier physics engine, integrated through @react-three/rapier. This document details the physics implementation and configuration.

## Core Components

### Physics World
- Initialized in the Experience component
- Configures gravity and physics parameters
- Manages collision groups and masks
- Handles physics thread communication

### Collision System
- Ball collider for the marble
- Hull colliders for obstacles
- Cuboid colliders for track boundaries
- Custom collision handlers for special effects

### Physics Properties
```javascript
// World Configuration
gravity: { x: 0, y: -9.81, z: 0 }
timestep: 1/60

// Collision Groups
MARBLE: 1
TRACK: 2
OBSTACLE: 4
BOUNDARY: 8
```

## Implementation Details

### Physics Thread
- Runs in a separate Web Worker
- Handles physics calculations
- Communicates with main thread via message passing
- Optimized for 60fps updates

### Collision Detection
- Uses continuous collision detection
- Implements custom collision masks
- Handles edge cases and glitches
- Optimized for performance

### Physics Bodies
1. Marble
   - Dynamic body
   - Ball collider
   - Custom material properties

2. Obstacles
   - Kinematic bodies
   - Hull colliders
   - Custom movement patterns

3. Track
   - Static bodies
   - Cuboid colliders
   - Optimized mesh colliders

## Performance Optimization
- Physics calculations in Web Worker
- Collision mask optimization
- Efficient body management
- Memory usage optimization

## Known Limitations
1. Complex collision shapes impact performance
2. Physics glitches on extreme angles
3. Memory usage with many bodies
4. Mobile device limitations

## Future Improvements
1. Advanced collision shapes
2. Physics-based particle effects
3. Improved mobile optimization
4. Custom physics materials

## Related Documentation
- [Marble Physics](../features/core-mechanics/marble-physics.md)
- [Obstacles](../features/level-design/obstacles.md)
- [Track System](../features/core-mechanics/track-system.md)
- [Performance](../technical/performance.md) 