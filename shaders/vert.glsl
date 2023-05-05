#version 300 es

//attribute vec4 position;
in vec4 a_position;
in vec2 a_colorTexCoord;
uniform mat4 u_modelMatrix;
uniform mat4 u_normalMatrix;
out vec2 v_colorCoord;

void main() {
  v_colorCoord = a_colorTexCoord;
  gl_Position = u_modelMatrix * a_position;
}