import { SSR, DepthOfField, EffectComposer, ChromaticAberration, Vignette, Noise } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'

export default function Effects() {
  return (
    <EffectComposer>
      {/* <SSR
        intensity={0.45}
        exponent={1}
        distance={10}
        fade={10}
        roughnessFade={1}
        thickness={10}
        ior={0.45}
        maxRoughness={1}
        maxDepthDifference={10}
        blend={0.95}
        correction={1}
        correctionRadius={1}
        blur={0}
        blurKernel={1}
        blurSharpness={10}
        jitter={0.75}
        jitterRoughness={0.2}
        steps={40}
        refineSteps={5}
        missedRays={true}
        useNormalMap={true}
        useRoughnessMap={true}
        resolutionScale={1}
        velocityResolutionScale={1}
      /> */}
      <DepthOfField focusDistance={0.01} focusLength={0.2} bokehScale={2} />
      <ChromaticAberration
        offset={[0.0005, 0.0005]} // Reduced to 5% aberration
        blendFunction={BlendFunction.NORMAL}
      />
      <Vignette
        darkness={0.8} // 90% vignette
        offset={0.1}
        blendFunction={BlendFunction.NORMAL}
      />
      <Noise
        opacity={0.06} // 6% noise
        blendFunction={BlendFunction.SOFT_LIGHT}
      />
    </EffectComposer>
  )
}
