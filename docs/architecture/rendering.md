# Rendering Architecture
,
## Overview
The rendering system in Marble Race is built using Three.js and React Three Fiber, providing efficient 3D rendering with modern features and optimizations.
,
## Core Components
,
### Scene Setup
- Camera configuration
- Lighting system
- Post-processing effects
- Renderer settings
,
### Render Pipeline
1. Scene Graph
   - 3D models
   - Lights
   - Cameras
   - Effects
,
2. Post-Processing
   - Depth of Field
   - Screen Space Reflections
   - Color grading
   - Performance monitoring
,
## Implementation Details
,
### Camera System
```javascript
// Camera Configuration
{
  fov: 45,
  near: 0.1,
  far: 200,
  position: [2.5, 4, 6]
}
```
,
### Lighting Setup
- Directional light for shadows
- Ambient light for base illumination
- Dynamic light following camera
- Shadow mapping configuration
,
### Materials
1. Standard Materials
   - Track surfaces
   - Obstacles
   - Boundaries
,
2. Custom Materials
   - Marble material
   - UI elements
   - Special effects
,
## Performance Optimization
- Render optimization through React Three Fiber
- Efficient material management
- Level of detail system
- Asset loading optimization
,
## Visual Effects
,
### Post-Processing Stack
1. Depth of Field
   - Focus distance: 0.01
   - Focus length: 0.2
   - Bokeh scale: 2
,
2. Screen Space Reflections
   - Intensity: 0.45
   - Distance: 10
   - Steps: 40
   - Currently disabled for performance
,
### Performance Monitoring
- FPS counter
- Render time tracking
- Memory usage monitoring
- GPU utilization tracking
,
## Known Limitations
1. Mobile device performance
2. Complex material effects
3. Shadow quality vs performance
4. Post-processing overhead
,
## Future Improvements
1. Advanced material system
2. Dynamic lighting
3. Particle effects
4. Mobile optimizations
5. Advanced post-processing
,
## Related Documentation
- [Lighting System](../features/visual/lighting.md)
- [Post-Processing Effects](../features/visual/effects.md)
- [Performance Optimization](../technical/performance.md)
- [Mobile Compatibility](../technical/compatibility.md) 