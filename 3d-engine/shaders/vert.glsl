#version 300 es

uniform mat4 u_modelMatrix;
uniform mat4 u_viewMatrix;
uniform mat4 u_projectionMatrix;
uniform mat4 u_normalMatrix;

in vec3 a_position;
in vec3 a_normal;
in vec2 a_colorTexCoord;

out vec2 v_colorCoord;
out vec3 v_normal;
out vec3 v_fragPos;
void main() {
  v_colorCoord = a_colorTexCoord;
  v_normal = (u_normalMatrix * vec4(a_normal,1.0)).xyz;
  vec4 vertexPos = u_modelMatrix * vec4(a_position, 1.0);
  v_fragPos = vertexPos.xyz;
  gl_Position = u_projectionMatrix * u_viewMatrix * vertexPos;
}