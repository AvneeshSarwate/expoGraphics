import Expo from 'expo';
import React from 'react';
import PanResponder from 'react-native';
// import React, {PanResponder} from 'react-native';

const Dimensions = require('Dimensions');
const win = Dimensions.get('window');

var shaderText = `
// stuff outside main() from Shawn Lawson's The Force - https://github.com/shawnlawson/The_Force
precision lowp float;

uniform vec2      resolution;
uniform vec2      timeVec;
uniform float     zoom;
uniform float     time;
uniform float     channelTime[4];
uniform vec4      mouse;
uniform vec4      date;
uniform vec3      channelResolution[4];
uniform vec4      bands;
uniform vec4      bandsTime;
uniform sampler2D backbuffer;

float PI = 3.14159;
float PI2 = 6.28318;

vec3 black = vec3(0.0);
vec3 white = vec3(1.0);
vec3 red = vec3(0.86,0.22,0.27);   
vec3 orange = vec3(0.92,0.49,0.07);
vec3 yellow = vec3(0.91,0.89,0.26);
vec3 green = vec3(0.0,0.71,0.31);
vec3 blue = vec3(0.05,0.35,0.65);
vec3 purple = vec3(0.38,0.09,0.64);
vec3 pink = vec3(.9,0.758,0.798);
vec3 lime = vec3(0.361,0.969,0.282);
vec3 teal = vec3(0.396,0.878,0.878);
vec3 magenta = vec3(1.0, 0.189, 0.745);
vec3 brown = vec3(0.96, 0.474, 0.227);

vec2 uvN(){return (gl_FragCoord.xy / resolution);}
vec2 uv(){return (gl_FragCoord.xy / resolution * 2.0 -1.0) * vec2(resolution.x/resolution.y, 1.0);}  

float box(vec2 p,vec2 b,float r,float f) {
    return smoothstep(f, 0.0, length(max(abs(p)-b,0.0))-r);
}

float circle(float x,float y,float r,float f) {
    float d=distance(uv(),vec2(x, y))/r;
    return 1.-smoothstep(r-f,r,d);
}

vec2 rotate(vec2 space, vec2 center, float amount){
    return vec2(cos(amount) * (space.x - center.x) + sin(amount) * (space.y - center.y) + center.x,
        cos(amount) * (space.y - center.y) - sin(amount) * (space.x - center.x) + center.y);
}

vec2 mod289(vec2 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
vec3 mod289(vec3 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

const mat2 myt = mat2(.12121212,.13131313,-.13131313,.12121212);
const vec2 mys = vec2(1e4, 1e6);
vec2 rhash(vec2 uv) {
    uv *= myt;
    uv *= mys;
    return  fract(fract(uv/mys)*uv);
}
vec3 hash( vec3 p ){
    return fract(sin(vec3( dot(p,vec3(1.0,57.0,113.0)), 
                           dot(p,vec3(57.0,113.0,1.0)),
                           dot(p,vec3(113.0,1.0,57.0))))*43758.5453);

}

float rand(const in float n){return fract(sin(n) * 1e4);}
float rand(const in vec2 n) { return fract(1e4 * sin(17.0 * n.x + n.y * 0.1) * (0.1 + abs(sin(n.y * 13.0 + n.x))));
}

float noise(float x) {
    float i = floor(x);
    float f = fract(x);
    float u = f * f * (3.0 - 2.0 * f);
    return mix(rand(i), rand(i + 1.0), u);
}

float noise(vec2 x) {
    vec2 i = floor(x);
    vec2 f = fract(x);

    // Four corners in 2D of a tile
    float a = rand(i);
    float b = rand(i + vec2(1.0, 0.0));
    float c = rand(i + vec2(0.0, 1.0));
    float d = rand(i + vec2(1.0, 1.0));

    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

float noise(vec3 x) {
    const vec3 step = vec3(110, 241, 171);

    vec3 i = floor(x);
    vec3 f = fract(x);

    float n = dot(i, step);

    vec3 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix( rand(n + dot(step, vec3(0, 0, 0))), rand(n + dot(step, vec3(1, 0, 0))), u.x),
                   mix( rand(n + dot(step, vec3(0, 1, 0))), rand(n + dot(step, vec3(1, 1, 0))), u.x), u.y),
               mix(mix( rand(n + dot(step, vec3(0, 0, 1))), rand(n + dot(step, vec3(1, 0, 1))), u.x),
                   mix( rand(n + dot(step, vec3(0, 1, 1))), rand(n + dot(step, vec3(1, 1, 1))), u.x), u.y), u.z);
}

const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
float snoise(vec2 v){
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m;
    m = m*m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
}

const vec2  CC = vec2(1.0/6.0, 1.0/3.0) ;
const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
float snoise(vec3 v){ 

  vec3 i  = floor(v + dot(v, CC.yyy) );
  vec3 x0 =   v - i + dot(i, CC.xxx) ;
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min( g.xyz, l.zxy );
  vec3 i2 = max( g.xyz, l.zxy );
  vec3 x1 = x0 - i1 + 1.0 * CC.xxx;
  vec3 x2 = x0 - i2 + 2.0 * CC.xxx;
  vec3 x3 = x0 - 1. + 3.0 * CC.xxx;
  i = mod(i, 289.0 ); 
  vec4 p = permute( permute( permute( 
             i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
           + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
  float n_ = 1.0/7.0; // N=7
  vec3  ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z *ns.z);  //  mod(p,N*N)

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)

  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4( x.xy, y.xy );
  vec4 b1 = vec4( x.zw, y.zw );

  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), 
                                dot(p2,x2), dot(p3,x3) ) );
}

float voronoi(const in vec2 point )
{
    vec2 p = floor( point );
    vec2 f = fract( point );
    float res = 0.0;
    for( int j=-1; j<=1; j++ ) {
        for( int i=-1; i<=1; i++ ) {
            vec2 b = vec2( i, j );
            vec2 r = vec2( b ) - f + rhash( p + b);
            res += 1./pow(dot(r,r),8.);
        }
    }
    return pow(1./res, 0.0625);
}

vec3 voronoi( const in vec3 x ) {
    vec3 p = floor( x );
    vec3 f = fract( x );

    float id = 0.0;
    vec2 res = vec2( 100.0 );
    for( int k=-1; k<=1; k++ ) {
        for( int j=-1; j<=1; j++ ) {
            for( int i=-1; i<=1; i++ ) {
                vec3 b = vec3( float(i), float(j), float(k) );
                vec3 r = vec3( b ) - f + hash( p + b );
                float d = dot( r, r );

                if( d < res.x ) {
                    id = dot( p+b, vec3(1.0,57.0,113.0 ) );
                    res = vec2( d, res.x );         
                }
                else if( d < res.y ) {
                    res.y = d;
                }
            }
        }
    }

    return vec3( sqrt( res ), abs(id) );
}

//brownian
float fbm(float x, const in int it) {
    float v = 0.0;
    float a = 0.5;
    float shift = float(100);
    for (int i = 0; i < 32; ++i) {
        if(i<it) {
            v += a * noise(x);
            x = x * 2.0 + shift;
            a *= 0.5;
        }
    }
    return v;
}

float fbm(vec2 x, const in int it) {
    float v = 0.0;
    float a = 0.5;
    vec2 shift = vec2(100);
    // Rotate to reduce axial bias
    mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.50));
    for (int i = 0; i < 32; ++i) {
        if(i<it) {
            v += a * noise(x);
            x = rot * x * 2.0 + shift;
            a *= 0.5;
        }
    }
    return v;
}

float fbm(vec3 x, const in int it) {
    float v = 0.0;
    float a = 0.5;
    vec3 shift = vec3(100);
    for (int i = 0; i < 32; ++i) {
        if(i<it) {
            v += a * noise(x);
            x = x * 2.0 + shift;
            a *= 0.5;
        }
    }
    return v;
}

//ridged multifractal
float rmf(vec2 uv, const in int it) {
    float l = 2.;
    float r = 0.;
    float a = 0.5;
    float f = 1.0;
    for(int i = 0; i < 32; i++) {
        if(i<it) {
            uv = uv.yx * l;
            float n = noise(uv);     
            n = abs(fract(n-.5)-.5);
            n *= n * a;
            a = clamp(0.,1., n*2.);
            r += n*pow(f, -1.);
            f *= l;
        }
    }
    return r*2.;
}

//voronoi fbm
float vfbm(const in vec2 uv, const in int it) {
    float n = 0.;
    float a = 0.5;
    float f = 1.0;
    for(int i = 0; i < 32; i++) {
        if(i<it) {
            n += voronoi(uv*f)*a;
            f *= 2.;
            a *= .5;
        }
    }
    return n;
}

//ridged multifractal
float vrmf(vec2 uv, const in int it) {
    float l = 2.;
    float r = 0.;
    float a = 0.5;
    float f = 1.0;
    for(int i = 0; i < 32; i++) {
        if(i<it) {
            uv = uv.yx * l;
            float n = voronoi(uv);     
            n = abs(fract(n-.5)-.5);
            n *= n * a;
            a = clamp(0.,1., n*2.);
            r += n*pow(f, -1.);
            f *= l;
        }
    }
    return r*2.;
}

const vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
vec3 hsv2rgb(vec3 c) {
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

vec3 sexy(void) {
    float star=0.0;
    vec3 cr = black;
    for(int i = 0; i < 80; i++)
    {
       float tTime = float(i) * PI;
        vec2 p = vec2(rand(floor(-tTime * time*.005)), fract(time *0.1 +tTime));
        float   r = rand(uv().x);
        star= r*(0.3*sin(time * (r * 5.0) + 20.0 * r) + 0.25);
        cr += box(uvN()-p.yx, vec2(0.005, 0.01), 0.001, 0.0001) * star;
        cr += box(uvN()-p.yx * vec2(1.2, 3.0), vec2(0.005, 0.01), 0.001, 0.0001) * star;
    }
    return vec3(cr * 1.5);
}

vec2 nyanFrame(vec2 p, float rr) {
    float v = 40.0/256.0;
    p = clamp(p,0.0,1.0);
    p.x = p.x*v;
    p = clamp(p,0.0,1.0);
    float fr = floor( mod( 20.0*time+rr, 6.0 ) );
    p.x += fr*v;
    return p;
}

// normalize a sine wave to [0, 1]
float sinN(float t){
   return (sin(t) + 1.) / 2.; 
}

// normalize a cosine wave to [0, 1]
float cosN(float t){
   return (cos(t) + 1.) / 2.; 
}

vec3 swirl(float time2, vec2 stN){
    stN = rotate(vec2(0.5+sin(time2)*0.5, 0.5+cos(time2)*0.5), stN, sin(time2));
    
    vec2 segGrid = vec2(floor(stN.x*30.0 * sin(time2/7.)), floor(stN.y*30.0 * sin(time2/7.)));

    vec2 xy;
    float noiseVal = rand(stN)*sin(time2/7.) * 0.15;
    if(mod(segGrid.x, 2.) == mod(segGrid.y, 2.)) xy = rotate(vec2(sinN(time2), cosN(time2)), stN.xy, time2 + noiseVal);
    else xy = rotate(vec2(sinN(time2), cosN(time2)), stN.xy, - time2 - noiseVal);
    
    float section = floor(xy.x*30.0 * sin(time2/7.)); 
    float tile = mod(section, 2.);

    float section2 = floor(xy.y*30.0 * cos(time2/7.)); 
    float tile2 = mod(section2, 2.);
    float timeMod = time2 - (1. * floor(time2/1.)); 
    
    return vec3(tile, tile2, timeMod);
}


void main () {
    vec2 stN = uvN();
    
    float timex = time / 5. + mouse.x / resolution.x + mouse.y / resolution.y;

    stN = rotate(vec2(0.5+sin(timex)*0.5, 0.5+cos(timex)*0.5), stN, sin(timex));
    
    vec2 segGrid = vec2(floor(stN.x*30.0 * sin(timex/7.)), floor(stN.y*30.0 * sin(timex/7.)));

    vec2 xy;
    float noiseVal = rand(stN)*sin(timex/7.) * 0.15;
    if(mod(segGrid.x, 2.) == mod(segGrid.y, 2.)) xy = rotate(vec2(sin(timex),cos(timex)), stN.xy, timex + noiseVal);
    else xy = rotate(vec2(sin(timex),cos(timex)), stN.xy, - timex - noiseVal);
    
    float section = floor(xy.x*30.0 * sin(timex/7.));
    float tile = mod(section, 2.);

    float section2 = floor(xy.y*30.0 * cos(timex/7.));
    float tile2 = mod(section2, 2.);
    
    float timexMod = timex - (1. * floor(timex/1.));

    gl_FragColor = vec4(tile, tile2, timexMod, 1);
}
`;


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
//     `
// precision highp float;
// uniform float time;
// void main () {
// gl_FragColor = vec4(0, time, 0, 1);
// }`
shaderText
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

  var time = gl.getUniformLocation(program, "time");

  var screenResU = gl.getUniformLocation(program, "resolution");
  var div = .5;
  gl.uniform2f(screenResU, win.width/div, win.height/div);

  var timeVal = 0;

  function renderLoop() {
    requestAnimationFrame(renderLoop);
    gl.uniform1f(time, timeVal += .2/6);
    //console.log(time);
    gl.drawArrays(gl.TRIANGLES, 0, verts.length / 2);
    gl.endFrameEXP();
  }

  renderLoop();
}

export default class App extends React.Component {
  componentWillMount() {
    console.log("COMPONENT WILL MOUNT", PanResponder.PanResponder);
    this._panResponder = PanResponder.PanResponder.create({
      // Ask to be the responder:
      onStartShouldSetPanResponder: (evt, gestureState) => true,
      onStartShouldSetPanResponderCapture: (evt, gestureState) => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => true,
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => true,

      onPanResponderGrant: (evt, gestureState) => {
        // The gesture has started. Show visual feedback so the user knows
        // what is happening!

        // gestureState.d{x,y} will be set to zero now
      },
      onPanResponderMove: (evt, gestureState) => {
        // The most recent move distance is gestureState.move{X,Y}

        // The accumulated gesture distance since becoming responder is
        // gestureState.d{x,y}
      },
      onPanResponderTerminationRequest: (evt, gestureState) => true,
      onPanResponderRelease: (evt, gestureState) => {
        // The user has released all touches while this view is the
        // responder. This typically means a gesture has succeeded
      },
      onPanResponderTerminate: (evt, gestureState) => {
        // Another component has become the responder, so this gesture
        // should be cancelled
      },
      onShouldBlockNativeResponder: (evt, gestureState) => {
        // Returns whether this component should block native components from becoming the JS
        // responder. Returns true by default. Is currently only supported on android.
        return true;
      },
    });
    console.log("PANRESPONDER MADE");
  } 
  render() {
    return (
      <Expo.GLView
        style={{ flex: 1 }}
        onContextCreate={onGLContextCreate}
        // {...this._panResponder.panHandlers}
      />
    );
  }
}