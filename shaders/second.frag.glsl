precision /** highp | mediump | lowp **/ mediump  float;
uniform vec3 uColor;
uniform sampler2D uTexture;

/** vertex -> inputs */
varying vec2 vUV;

void main()
{
  vec4 textureColor = texture2D(uTexture,  vUV);
//   gl_FragColor = vec4(uColor,0.5);
  gl_FragColor = textureColor;
}