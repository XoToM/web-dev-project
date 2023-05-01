#version 300 es

//attribute vec4 position;
in vec4 POSITION;
uniform mat4 cameraMatrix;

void main() {
  gl_Position = cameraMatrix * POSITION;
}