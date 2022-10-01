/** @link https://learnopengl.com/Getting-started/Coordinate-Systems */

// uniform mat4 /** transform coords */ projectionMatrix; 
// uniform mat4 /** transform camera */ viewMatrix;
// uniform mat4 /** transform mesh */ modelMatrix;
/** or use a shorcut */
// uniform mat4 modelViewMatrix;
// attribute vec3 position;
// attribute vec2 uv;

/** all the above are automatically set on <ShaderMaterial/> */
uniform vec2 ufreq;
uniform float uTime;
uniform float uAmp;

/** context -> inputs */
attribute float aRandom;

/** outputs -> frag */
varying float vRandom;  
varying vec2 vUV;  

void main()
{
  // gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);

  /** or */

  // gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

  /** or granular control */
  vec4 modelPosition = modelMatrix * vec4(position, 1.0);
  modelPosition.z += sin(modelPosition.x * ufreq.x + uTime) * uAmp;
  modelPosition.z += sin(modelPosition.y * ufreq.y + uTime) * uAmp;
  vec4 viewPosition = viewMatrix * modelPosition;

  vec4 projectedPosition = projectionMatrix * viewPosition;

  gl_Position = projectedPosition;
  vUV = uv;
}

/**
 *    - functions are typed as well
 *    - float sum(float a, float b) { return a + b; };
 *
 *    - classic built-in functions
 *      - sin, cos, max, min, pow, exp, mod, clamp
 *
 *    - practical built-in functions
 *      - cross, dot, mix, step, smoothstep, length, distance, reflect, refract, normalize
 *
 * - Documentation: (not beginner-friendly)
 *   - https://www.shaderific.com/glsl-functions
 *   - https://www.khronos.org/registry/OpenGL-Refpages/gl4/html/indexflat.php
 *   - https://thebookofshaders.com/glossary/
 * 
 * - Inspirational Links:
 *   - https://thebookofshaders.com/
 *   - https://www.shadertoy.com/
 *   - https://www.youtube.com/channel/UCcAlTqd9zID6aNX3TzwxJXg
 *   - https://www.youtube.com/channel/UC8Wzk_R1GoPkPqLo-obU_kQ
 */