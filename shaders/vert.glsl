#version 300 es

//attribute vec4 position;
in vec4 position;

void main() {
  gl_Position = position;
}