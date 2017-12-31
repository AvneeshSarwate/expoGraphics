import Expo from 'expo';
import React from 'react';

const onGLContextCreate = (gl) => {
  const vert = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(
    vert,
    `
precision highp float;
attribute vec2 position;
void main () {
gl_Position = vec4(1.0 - 2.0 * position, 0, 1);
}`
  );
  gl.compileShader(vert);
  const frag = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(
    frag,
    `
precision highp float;
uniform float time;
void main () {
gl_FragColor = vec4(0, time, 0, 1);
}`
  );
  gl.compileShader(frag);

  const program = gl.createProgram();
  gl.attachShader(program, vert);
  gl.attachShader(program, frag);
  gl.linkProgram(program);
  gl.useProgram(program);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  const verts = new Float32Array([-2, 0, 0, -2, 2, 2]);
  gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);
  const positionAttrib = gl.getAttribLocation(program, 'position');
  gl.enableVertexAttribArray(positionAttrib);
  gl.vertexAttribPointer(positionAttrib, 2, gl.FLOAT, false, 0, 0);

  gl.clearColor(0, 1, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  var time;
  time = gl.getUniformLocation(program, "time");

  function renderLoop() {
    gl.uniform1f(time, (Math.sin(Date.now() * 0.001)+1)/2);
    console.log(time, (Math.sin(Date.now() * 0.001)+1)/2);
    gl.drawArrays(gl.TRIANGLES, 0, verts.length / 2);
    gl.endFrameEXP();
    requestAnimationFrame(renderLoop);
  }

  renderLoop();

}

export default class App extends React.Component {
  render() {
    return (
      <Expo.GLView
        style={{ flex: 1 }}
        onContextCreate={onGLContextCreate}
      />
    );
  }
}