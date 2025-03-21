# Marble Race - Technical Documentation

## Overview
Marble Race is a 3D browser-based game where players control a marble through an obstacle course. The game features physics-based movement, dynamic obstacles, and a timing system to track performance.

## Documentation Structure

### Architecture
- [Overview](architecture/overview.md) - High-level architecture and system design
- [Physics](architecture/physics.md) - Physics engine implementation details
- [Rendering](architecture/rendering.md) - 3D rendering approach and optimization

### Features
#### Core Mechanics
- [Marble Physics](features/core-mechanics/marble-physics.md) - Ball physics and behavior
- [Track System](features/core-mechanics/track-system.md) - Level structure and progression
- [Timer](features/core-mechanics/timer.md) - Timing system and performance tracking

#### Controls
- [Movement](features/controls/movement.md) - WASD/Arrow key controls
- [Jumping](features/controls/jumping.md) - Jump mechanics
- [Camera](features/controls/camera.md) - Camera behavior and following

#### Level Design
- [Obstacles](features/level-design/obstacles.md) - Obstacle types and behavior
- [Generation](features/level-design/generation.md) - Level generation system
- [Boundaries](features/level-design/boundaries.md) - Track boundaries and collision

#### Visual
- [Models](features/visual/models.md) - 3D models and assets
- [Lighting](features/visual/lighting.md) - Lighting system
- [Effects](features/visual/effects.md) - Post-processing effects

#### Game States
- [Menu](features/game-states/menu.md) - Start screen and menu system
- [Gameplay](features/game-states/gameplay.md) - In-game state management
- [End State](features/game-states/end-state.md) - End game and restart functionality

### Technical
- [Performance](technical/performance.md) - Performance optimization
- [Compatibility](technical/compatibility.md) - Browser compatibility
- [Deployment](technical/deployment.md) - Deployment process and hosting

## Development Status
Each feature document includes:
- Current implementation status
- Planned improvements
- Known issues
- Dependencies

## Contributing
When adding new features or modifying existing ones:
1. Update the relevant documentation
2. Follow the established format
3. Include implementation notes
4. Update dependencies if necessary

## Version History
- v1.0.0 - Initial release
  - Basic marble physics
  - Core obstacle types
  - Timer system
  - Basic UI 