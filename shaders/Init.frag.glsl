precision /** highp | mediump | lowp **/ mediump  float;
/** vertex -> inputs */
varying float vRandom;

void main()
{
  gl_FragColor = vec4(0.5, vRandom,1.0,0.5);
}