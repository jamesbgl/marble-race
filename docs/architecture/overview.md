# Architecture Overview

## System Architecture
Marble Race is built using a modern React-based architecture with Three.js for 3D rendering and Rapier for physics simulation.

### Core Technologies
- React 18
- Three.js
- React Three Fiber
- Rapier Physics Engine
- Zustand (State Management)

## Component Structure

### Main Components
1. Experience
   - Root component managing the 3D scene
   - Handles physics world setup
   - Manages global game state

2. Level
   - Manages track generation
   - Handles obstacle placement
   - Controls level boundaries

3. Player
   - Manages marble physics
   - Handles player input
   - Controls camera behavior

4. Interface
   - Manages UI elements
   - Handles game state display
   - Controls user interaction

### State Management
- Uses Zustand for global state
- Manages:
  - Game phase (ready/playing/ended)
  - Timer state
  - Level configuration
  - Player progress

## Data Flow
1. User Input → Player Component
2. Physics Updates → Game State
3. Game State → UI Updates
4. Level Generation → Track System

## Performance Considerations
- Physics calculations run in a separate thread
- Asset loading is optimized
- Render optimization through React Three Fiber
- Efficient state updates

## Dependencies
```json
{
  "@react-three/drei": "^9.32.4",
  "@react-three/fiber": "^8.8.7",
  "@react-three/postprocessing": "2.6",
  "@react-three/rapier": "^0.9.0",
  "react": "^18.2.0",
  "three": "^0.145.0",
  "zustand": "4.1"
}
```

## Build and Deployment
- Built with React Scripts
- Deployed to GitHub Pages
- Optimized for production builds
- Asset path handling for subdirectory deployment

## Development Workflow
1. Local development with hot reloading
2. Testing in development environment
3. Production build verification
4. GitHub Pages deployment

## Future Considerations
1. Multiplayer support
2. Custom track creation
3. Advanced physics features
4. Mobile optimization
5. Performance monitoring

## Related Documentation
- [Physics Implementation](physics.md)
- [Rendering System](rendering.md)
- [State Management](../features/game-states/gameplay.md)
- [Performance Optimization](../technical/performance.md) 