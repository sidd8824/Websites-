import { MeshBasicMaterial, type Texture } from 'three';

const CURVATURE = .103;

export function glassUV(u: number, v: number) {
  const x = u - .5;
  const y = v - .5;
  const bend = 1 + CURVATURE * 4 * (x * x + y * y);
  return { x: .5 + x * bend, y: .5 + y * bend };
}

export function createGlassMaterial(map: Texture) {
  const time = { value: 0 };
  const interference = { value: 0 };
  const direction = { value: 1 };
  const material = new MeshBasicMaterial({ map, toneMapped: false });

  material.onBeforeCompile = shader => {
    shader.uniforms.crtTime = time;
    shader.uniforms.crtInterference = interference;
    shader.uniforms.crtDirection = direction;
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <map_pars_fragment>', `#include <map_pars_fragment>
        uniform float crtTime;
        uniform float crtInterference;
        uniform float crtDirection;
        float tubeNoise(vec2 p) { return fract(sin(dot(p,vec2(127.1,311.7))) * 43758.5453); }
      `)
      .replace('#include <map_fragment>', `
        #ifdef USE_MAP
          vec2 centered = vMapUv - .5;
          vec2 curved = .5 + centered * (1. + ${CURVATURE * 4} * dot(centered, centered));
          float row = floor(curved.y * 32.);
          float trackingOffset = (curved.y - crtTime) * 10.;
          float tracking = exp(-trackingOffset * trackingOffset);
          float shift = (tubeNoise(vec2(row, 4.)) - .38) * .033 * tracking * crtInterference;
          curved.x += shift * crtDirection;
          vec2 fringe = vec2(.0008 + crtInterference * tracking * .0045, 0.);
          vec3 image = vec3(texture2D(map, curved + fringe).r, texture2D(map, curved).g,
            texture2D(map, curved - fringe).b);
          float border = max(abs(curved.x - .5), abs(curved.y - .5));
          float falloff = 1. - .55 * smoothstep(.23, .69, length(centered));
          float lines = .95 + .05 * cos(curved.y * 6.2831853 * 155.);
          float grain = tubeNoise(floor(curved * vec2(640., 440.))) * .009;
          float reflectionOffset = (centered.y + .36 + centered.x * .06) * 14.;
          float bloom = exp(-reflectionOffset * reflectionOffset) * .012;
          float edge = 1. - smoothstep(.466, .51, border);
          diffuseColor.rgb *= (image * lines * falloff + grain + bloom
            + tracking * crtInterference * .025) * edge + .003;
        #endif
      `);
  };

  return {
    material,
    setTracking(progress: number, sign: number) {
      time.value = progress;
      interference.value = progress >= 1 ? 0 : 1 - progress;
      direction.value = sign;
    },
  };
}
