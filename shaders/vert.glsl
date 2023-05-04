#version 300 es

//attribute vec4 position;
in vec4 a_position;
in vec2 a_colorTexCoord;
uniform mat4 u_worldTransformMatrix;

void main() {
  gl_Position = u_worldTransformMatrix * a_position;
}