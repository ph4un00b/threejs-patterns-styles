precision /** highp | mediump | lowp **/ mediump  float;
uniform vec3 uColor;

/** vertex -> inputs */
void main()
{
  gl_FragColor = vec4(uColor,0.5);
}