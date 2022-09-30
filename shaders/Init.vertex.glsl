/** @link https://learnopengl.com/Getting-started/Coordinate-Systems */
uniform mat4 /** transform coords */ projectionMatrix; 
uniform mat4 /** transform camera */ viewMatrix;
uniform mat4 /** transform mesh */ modelMatrix;
/** or use a shorcut */
uniform mat4 modelViewMatrix;

attribute vec3 position;

void main()
{
  // gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);

  /** or */

  // gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

  /** or granular control */
  vec4 modelPosition = modelMatrix * vec4(position, 1.0);
  modelPosition.z += sin(modelPosition.x * 5.0) * 0.1;
  vec4 viewPosition = viewMatrix * modelPosition;
  vec4 projectedPosition = projectionMatrix * viewPosition;
  gl_Position = projectedPosition;
}