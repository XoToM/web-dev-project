#version 300 es

//attribute vec4 position;
in vec4 POSITION;
uniform mat4 u_worldTransformMatrix;

void main() {
  gl_Position = u_worldTransformMatrix * POSITION;
}