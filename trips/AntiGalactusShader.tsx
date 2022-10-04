import * as T from 'three';
import * as React from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  OrbitControls,
  PerspectiveCamera,
  OrthographicCamera,
  Center,
  Text3D,
  useHelper,
} from '@react-three/drei/core';
import { proxy, useSnapshot } from 'valtio';
import { useControls } from 'leva';
import { useSpring, animated, config, a } from '@react-spring/three';
import { useDrag } from '@use-gesture/react';
import nice_colors from '../utils/colors';
import useCapture from 'use-capture';
import global from '../globals/index';
import { useTimeout } from '../utils/useTimers';

/** FREE! @link https://kenney.nl/assets */
export default function () {
  const { cw, ch } = useCanvas();
  const cam_ = React.useRef(null);
  const { fondo, material, ambientIntensity, ambient } = useControls({
    ambientIntensity: { value: 0.3, min: 0, max: 1, step: 0.001 },
    ambient: { value: '#ffffff' },
    fondo: { value: global.fog },
    material: { value: global.mat },
  });

  // const [bind, startRecording] = useCapture({ duration: 10, fps: 25 });

  //quitar para iniciar grabacion
  // useTimeout(() => {
  //   startRecording();
  // }, 5000);

  return (
    <>
      <section>
        <Canvas
          // 💡 preserveDrawingBuffer is mandatory
          gl={{
            preserveDrawingBuffer: true,
          }}
          // onCreated={bind}
          shadows={true} /** enable shadowMap */
          dpr={[global.dpr.min, global.dpr.max]}
          style={{
            width: cw + 'px',
            height: ch + 'px',
          }}
        >
          {/* 💡 not having a clear color would glitch the recording */}
          <color attach="background" args={[fondo]} />
          {/* <React.Suspense> */}

          <PerspectiveCamera
            ref={cam_}
            position={[0, 0, 10]}
            fov={75}
            // auto updates the viewport
            manual={false}
            makeDefault={true}
          />

          <OrbitControls enableDamping={true} makeDefault={true} />

          <MyGalaxy />

          <axesHelper args={[4]} />
          <ambientLight color={ambient} intensity={ambientIntensity} />
          <DirectionalLight color={ambient} />
          {/* </React.Suspense> */}
        </Canvas>
      </section>
    </>
  );
}

function MyGalaxy() {
  const geo = React.useRef<T.BufferGeometry>(null!);
  const points = React.useRef<T.Points>(null!);

  const {
    pointsSize,
    pointsAtenuation,
    offset,
    mul,
    particles,
    radius,
    ramas,
    curva,
    noise,
    noiseCurva,
  } = useControls({
    pointsSize: { value: 1, min: 0, max: 5, step: 0.01 },
    offset: { value: 0.5, min: 0, max: 1, step: 0.01 },
    mul: { value: 9, min: 1, max: 20, step: 1 },
    ramas: { value: 3, min: 2, max: 20, step: 1 },
    curva: { value: 1, min: -5, max: 5, step: 0.001 },
    radius: { value: 5, min: 0.01, max: 20, step: 0.01 },
    noise: { value: 0.2, min: 0, max: 2, step: 0.001 },
    noiseCurva: { value: 3, min: 1, max: 10, strep: 0.001 },
    particles: { value: 100_000, min: 100, max: 100_000, step: 1_000 },
    pointsAtenuation: { value: true },
  });

  const { gl, viewport, size } = useThree();
  /** @link https://github.com/pmndrs/react-three-fiber/discussions/1012 */
  // gl.getPixelRatio()
  // viewport -> size in three units
  // size -> size in pixels

  const mat = React.useMemo(
    () =>
      new T.ShaderMaterial({
        // color: '#ff5588',
        depthWrite: false,
        vertexColors: true,
        blending: T.AdditiveBlending,
        vertexShader: `
        /** context -> inputs */
${glslUniforms()}

attribute float aScale;
/** outputs -> frag */

varying vec2 vUv;  
varying vec3 vColor;  
varying float vElevation;  

void main()
{
  vec4 modelPosition = modelMatrix * vec4(position, 1.0);

  float elevation = sin(modelPosition.x * uleverX + utime) * 1.0 * 1.0;
  elevation += sin(modelPosition.y * uleverY + utime) * 1.0 * 1.0;
  modelPosition.z = elevation;

  vec4 viewPosition = viewMatrix * modelPosition;
  vec4 projectedPosition = projectionMatrix * viewPosition;

  /** Position */
  gl_Position = projectedPosition;
  
  /** Point Size */


  /** 
   * - adding randomness for a bit more real feeling!
   * 
   * @link https://github.com/mrdoob/three.js/blob/master/src/renderers/shaders/ShaderLib/points.glsl.js
   * - adding attenuation from three
   */
  
  gl_PointSize = uSize * aScale;
  gl_PointSize *= ( 1.0 / - viewPosition.z );

  /* outputs */
  vUv = uv;
  vElevation = elevation;
  vColor = color;
}
        `,
        fragmentShader: `
        /** context -> inputs */

${glslUniforms()}

/** vertex -> inputs */

varying vec2 vUv;
varying float vElevation;
varying vec3 vColor; 

${fragmentFunctions()}

float circleShape( vec2 pointA, vec2 pointB, float edge ) {
  float value =  distance( pointA, pointB );
  return step( edge, value );
}

float mirror(float value) {
  return 1.0 - value;
}

float circleLinearDifuse(vec2 pointA, vec2 pivot, float intensity) {
  return mirror( distance( pointA, pivot ) * intensity );
}

vec3 black() {
  return vec3(0.0);
}

void main() {
  // black 0,0,0 ,  white 1,1,1

  /**
   * putting a rounded creafted shape pattern
   */
  vec2 coord = gl_PointCoord;

  //float punch = circleShape(coord, vec2(0.5), 0.5);
  // punch = mirror(punch);

  float punch = pow(circleLinearDifuse(coord, vec2(0.5), 3.0 ), 7.0);

  vec3 rgb = vec3( mix(black(), vColor, punch) );
  gl_FragColor = vec4(rgb, 1.0);
}`,
        uniforms: {
          uSize: { value: 20 * pointsSize * gl.getPixelRatio() },
        },
      }),
    [pointsSize, pointsAtenuation /** color */]
  );

  // const { scene } = useThree();
  React.useLayoutEffect(() => {
    if (points.current) {
      geo.current.dispose();
      mat.dispose();
      // scene.remove(points.current);
    }
  }, [particles, offset, mul, radius, ramas, curva, noise, noiseCurva]);

  const [[, niceColors]] = useNiceColors({ quantity: 2 });
  // console.log({ colors });

  const arrays = React.useMemo(() => {
    const positions = new Float32Array(particles * 3);
    const colors = new Float32Array(particles * 3);
    // recreating PointMaterial size as scale
    const scales = new Float32Array(particles * 1 /** just need 1 dimension */);

    const colorIn = new T.Color(niceColors[0]);
    const colorOut = new T.Color(niceColors[1]);

    for (let i = 0; i < particles * 3; i++) {
      const xyz = i * 3;
      const [x, y, z] = [xyz, xyz + 1, xyz + 2];
      const random_radius = Math.random() * radius;
      const random_noise = Math.random() * noise;
      const ramaAngle = ((i % ramas) / ramas) * Math.PI * 2;
      const curveAngle = random_radius * curva;
      const angle = ramaAngle + curveAngle;

      const [rx, ry, rz] = [
        Math.pow(Math.random(), noiseCurva) * (Math.random() < 0.5 ? 1 : -1),
        Math.pow(Math.random(), noiseCurva) * (Math.random() < 0.5 ? 1 : -1),
        Math.pow(Math.random(), noiseCurva) * (Math.random() < 0.5 ? 1 : -1),
      ];

      positions[x] = Math.cos(angle) * random_radius + rx;
      positions[y] = ry;
      positions[z] = Math.sin(angle) * random_radius + rz;

      fusion_colors: {
        const mixedColor = colorIn.clone();
        mixedColor.lerp(colorOut, random_radius / radius);
        colors[x] = mixedColor.r;
        colors[y] = mixedColor.g;
        colors[z] = mixedColor.b;
      }

      scales: {
        scales[i] = Math.random();
      }
    }
    return [positions, colors, scales] as const;
  }, [particles, offset, mul, radius, ramas, curva, noise, noiseCurva]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    geo.current.attributes.position.needsUpdate = true;
    points.current.rotation.y = t * 0.2;
  });

  return (
    <points
      rotation={[Math.PI / 2, 0, 0]}
      // position={[0, 0, 0]}
      ref={points}
      // castShadow={true}
      material={mat}
    >
      <bufferGeometry ref={geo}>
        <bufferAttribute
          attach="attributes-position"
          array={arrays[0]}
          count={arrays[0].length / 3}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          array={arrays[1]}
          count={arrays[1].length / 3}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aScale"
          array={arrays[2]}
          count={arrays[2].length}
          itemSize={1}
        />
      </bufferGeometry>
      {/* from drei */}
      {/* <PointMaterial
      // transparent
      // vertexColors
      size={pointsSize}
      sizeAttenuation={pointsAtenuation}
      // depthWrite={false}
    /> */}

      {/* atenuation is not working on toggle controls */}
      {/* <pointsMaterial size={pointsSize} sizeAttenuation={pointsAtenuation} /> */}
    </points>
  );
}

/**
 *    - functions are typed as well
 *    - float sum(float a, float b) { return a + b; };
 *
 *    - classic built-in functions
 *      - sin, cos, max, min, pow, exp, mod, clamp
 *
 *    - practical built-in functions
 *      - cross, dot, mix, step, smoothstep, length, distance, reflect, refract, normalize
 *
 * - Documentation: (not beginner-friendly)
 *   - https://www.shaderific.com/glsl-functions
 *   - https://www.khronos.org/registry/OpenGL-Refpages/gl4/html/indexflat.php
 *   - https://thebookofshaders.com/glossary/
 *
 * - Inspirational Links:
 *   - https://thebookofshaders.com/
 *   - https://www.shadertoy.com/
 *   - https://www.youtube.com/channel/UCcAlTqd9zID6aNX3TzwxJXg
 *   - https://www.youtube.com/channel/UC8Wzk_R1GoPkPqLo-obU_kQ
 */

function glslUniforms() {
  return `
uniform float utime;
uniform float uSize;
uniform float uleverX;
uniform float uleverY;
uniform float uleverZ;
uniform float uleverA;
uniform float uleverB;`;
}

function fragmentFunctions() {
  return `
float pseudo_random(vec2 seed)
{
  /** from the book of shaders */
  return fract(sin(dot(seed.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

vec2 rotate(vec2 uv, float turn, vec2 pivot) 
{
  /** @link https://www.computerenhance.com/p/turns-are-better-than-radians */
  return vec2(
    cos(turn) * (uv.x - pivot.x) + sin(turn) * (uv.y - pivot.y) + pivot.x,
    cos(turn) * (uv.y - pivot.y) - sin(turn) * (uv.x - pivot.x) + pivot.y
  );
}

vec4 permute(vec4 x)
{
  return mod( ((x * 34.0) + 1.0) * x, 289.0);
}

/** @link https://gist.github.com/patriciogonzalezvivo/670c22f3966e662d2f83 */

//	Classic Perlin 2D Noise 
//	by Stefan Gustavson
//
vec2 fade(vec2 t) {return t*t*t*(t*(t*6.0-15.0)+10.0);}

float cnoise(vec2 P){
  vec4 Pi = floor(P.xyxy) + vec4(0.0, 0.0, 1.0, 1.0);
  vec4 Pf = fract(P.xyxy) - vec4(0.0, 0.0, 1.0, 1.0);
  Pi = mod(Pi, 289.0); // To avoid truncation effects in permutation
  vec4 ix = Pi.xzxz;
  vec4 iy = Pi.yyww;
  vec4 fx = Pf.xzxz;
  vec4 fy = Pf.yyww;
  vec4 i = permute(permute(ix) + iy);
  vec4 gx = 2.0 * fract(i * 0.0243902439) - 1.0; // 1/41 = 0.024...
  vec4 gy = abs(gx) - 0.5;
  vec4 tx = floor(gx + 0.5);
  gx = gx - tx;
  vec2 g00 = vec2(gx.x,gy.x);
  vec2 g10 = vec2(gx.y,gy.y);
  vec2 g01 = vec2(gx.z,gy.z);
  vec2 g11 = vec2(gx.w,gy.w);
  vec4 norm = 1.79284291400159 - 0.85373472095314 * 
    vec4(dot(g00, g00), dot(g01, g01), dot(g10, g10), dot(g11, g11));
  g00 *= norm.x;
  g01 *= norm.y;
  g10 *= norm.z;
  g11 *= norm.w;
  float n00 = dot(g00, vec2(fx.x, fy.x));
  float n10 = dot(g10, vec2(fx.y, fy.y));
  float n01 = dot(g01, vec2(fx.z, fy.z));
  float n11 = dot(g11, vec2(fx.w, fy.w));
  vec2 fade_xy = fade(Pf.xy);
  vec2 n_x = mix(vec2(n00, n01), vec2(n10, n11), fade_xy.x);
  float n_xy = mix(n_x.x, n_x.y, fade_xy.y);
  return 2.3 * n_xy;
}`;
}
var PointersProxy = proxy({
  x: 0,
  y: 0,
});

var CanvasProxy = proxy({
  w: window.innerWidth,
  h: window.innerHeight,
});

function usePointers() {
  const snap = useSnapshot(PointersProxy);
  return { px: snap.x, py: snap.y } as const;
}

function useCanvas() {
  const snap = useSnapshot(CanvasProxy);
  return { cw: snap.w, ch: snap.h } as const;
}

/** suports shadows! */
function DirectionalLight({ color }: { color: string }) {
  const light = React.useRef<T.DirectionalLight>(null!);
  const camera = React.useRef<T.OrthographicCamera>(null!);
  useHelper(light, T.DirectionalLightHelper, 0.5);
  useHelper(camera, T.CameraHelper);

  React.useLayoutEffect(() => {
    camera.current = light.current.shadow.camera;
    // light.current.shadow.radius = 10;
    // alert(JSON.stringify(light.current.shadow.mapSize, null, 2));
  }, []);

  useFrame(() => {
    camera.current.updateProjectionMatrix();
  });

  return (
    <directionalLight
      ref={light}
      castShadow={true}
      // power of 2 due to bitmapping
      shadow-mapSize-width={256}
      shadow-mapSize-height={256}
      shadow-camera-near={1}
      shadow-camera-far={15}
      // shadow-camera-top={top}
      // shadow-camera-bottom={bottom}
      // shadow-camera-left={left}
      // shadow-camera-right={right}
      /** @link https://github.com/pmndrs/react-three-fiber/blob/master/packages/fiber/tests/core/renderer.test.tsx#L571
       *
       * types:
       *
       * T.BasicShadowMap
       * T.PCFShadowMap
       * T.VSMShadowMap
       *
       * 3RF set PCFSoftShadowMap as the default shadow map
       */
      shadow-radius={10}
      // position={[directional.x, directional.y, directional.z]}
      position={[0, 15, -20]}
      args={[color, 0.5 /** intensity */]}
    />
  );
}

window.addEventListener('resize', () => {
  CanvasProxy.w = window.innerWidth;
  CanvasProxy.h = window.innerHeight;
});

window.addEventListener('dblclick', () => {
  // todo: verify on safari!
  if (!document.fullscreenElement) {
    document.querySelector('canvas')!.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
});

function useNiceColors({
  quantity,
  preset = Math.floor(Math.random() * 900),
}: {
  quantity: number;
  preset?: number;
}) {
  return React.useState(() => {
    const c = new T.Color();

    const colors = Array.from(
      { length: quantity },
      () => nice_colors[preset][Math.floor(Math.random() * 4)]
    );

    const colorsRGB = Float32Array.from(
      Array.from({ length: quantity }, (_, i) =>
        c.set(colors[i]).convertSRGBToLinear().toArray()
      ).flat()
    );

    return [colorsRGB, colors] as const;
  });
}
