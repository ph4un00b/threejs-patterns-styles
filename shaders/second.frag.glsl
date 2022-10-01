precision /** highp | mediump | lowp **/ mediump  float;
uniform vec3 uColor;
uniform sampler2D uTexture;
uniform float uIntensity;
uniform float uDelta;

/** vertex -> inputs */
varying vec2 vUV;
varying float vElevation;

void main()
{
  vec4 textureColor = texture2D(uTexture,  vUV);
  textureColor.rgb  *=  vElevation * uIntensity + uDelta;
//   gl_FragColor = vec4(uColor,0.5);
  gl_FragColor = textureColor;
}