import * as T from 'three';
import * as R from 'react';
import * as F from '@react-three/fiber';
import * as D from '@react-three/drei/core';
import * as L from 'leva';
import * as S from '@react-spring/three';
import * as G from '@use-gesture/react';
import * as C from '@react-three/cannon';
import { proxy, useSnapshot } from 'valtio';
import nice_colors from '../utils/colors';
import { Canvas } from '@react-three/fiber';
import {
  Center,
  OrbitControls,
  PerspectiveCamera,
  Text3D,
} from '@react-three/drei/core';
import { Debug, Physics } from '@react-three/cannon';
import { a } from '@react-spring/three';

var dpr = { min: 1, max: 2 };
var baseUrl = 'https://ph4un00b.github.io/data';
var global = {
  bg: 'red',
  fog: '#262837',
  mat: '#e83abf',
  font1: `${baseUrl}/typeface/press-start-2p.json`,
};

/** FREE! @link https://kenney.nl/assets */
export default function () {
  const { cw, ch } = useCanvas();
  const cam_ = R.useRef(null);
  const { fondo, ambientIntensity, ambient } = L.useControls({
    ambientIntensity: { value: 0.3, min: 0, max: 1, step: 0.001 },
    ambient: { value: '#ffffff' },
    fondo: { value: global.fog },
  });

  return (
    <>
      <section>
        <Canvas
          shadows={true} /** enable shadowMap */
          dpr={[dpr.min, dpr.max]}
          style={{
            width: cw + 'px',
            height: ch + 'px',
            backgroundColor: fondo,
          }}
        >
          {/* <React.Suspense> */}

          <PerspectiveCamera
            ref={cam_}
            position={[-6, 6, 6]}
            fov={75}
            near={0.1}
            far={100}
            // auto updates the viewport
            // manual={false}
            makeDefault={true}
          />

          <OrbitControls enableDamping={true} makeDefault={true} />

          {/* @link https://pmndrs.github.io/cannon-es/docs/ */}
          <Physics
            /**
             * - SAPBroadphase : ideal (performance)
             * if your objects are not traveling too fast
             * - NaiveBroadphase
             *  */
            broadphase={'SAP'}
            /** does not update quiet objects */
            allowSleep={true}
          >
            <Debug color="black" scale={1.1}>
              <group position={[0, 4, 0]}>
                <Center>
                  <Text3D castShadow={true} font={global.font1}>
                    phau!
                    <meshStandardMaterial metalness={0} roughness={0} />
                  </Text3D>
                </Center>
              </group>

              <Cubo castShadow={true} />
              {/* <World items={4} /> */}
            </Debug>
          </Physics>

          <Fondo />
          <axesHelper args={[4]} />
          <ambientLight color={ambient} intensity={ambientIntensity} />
          <DirectionalLight
            castShadow={true}
            position={[5, 5, 5]}
            intensity={0.2}
            color={ambient}
          />
          {/* </React.Suspense> */}
        </Canvas>
      </section>
    </>
  );
}

function Cubo(props: C.BoxProps & F.MeshProps) {
  const [active, setActive] = R.useState(0);
  const cubo = R.useRef<T.Mesh>(null!);
  const { pos } = S.useSpring({
    to: {
      pos: 0,
    },
    from: { pos: -20 },
    config: S.config.gentle,
  });
  const { scale } = S.useSpring({ scale: active ? 4 : 1 });
  const { rotation } = S.useSpring({ rotation: active ? Math.PI : 0 });
  const { colorA } = S.useSpring({ colorA: active ? 'royalblue' : '#e83abf' });
  /** interpolate values from common spring */
  // const { spring } = useSpring({
  //   spring: active,
  //   config: config.molasses,
  // });
  // const { pos } = useSpring({ pos: active ? -2 : 0 });
  // const scale = spring.to([0, 1], [1, 4]);
  // const rotation = spring.to([0, 1], [0, Math.PI]);
  // const colorA = spring.to([0, 1], ['#6246ea', 'royalblue']);

  const { viewport } = F.useThree();
  const [{ x, y }, api] = S.useSpring(() => ({ x: 0, y: 1 }));

  const handlers = G.useDrag(function ({ event, offset: [x, y] }) {
    event.stopPropagation();
    const aspect = viewport.getCurrentViewport().factor;
    console.log(x, y);
    return api.start({ x: x / aspect, y: -y / aspect });
  });

  return (
    <a.mesh
      {...handlers()}
      {...props}
      onClick={(e) => {
        e.stopPropagation();
        setActive(Number(!active));
      }}
      rotation-x={rotation}
      scale={scale}
      position-x={x}
      position-y={y}
      position-z={pos}
    >
      <boxGeometry />
      {/* 
      // @ts-ignore */}
      <a.meshStandardMaterial color={colorA} />
    </a.mesh>
  );
}

/** suports shadows! */
function DirectionalLight(props: F.LightProps) {
  const light = R.useRef<T.DirectionalLight>(null!);
  const camera = R.useRef<T.OrthographicCamera>(null!);
  D.useHelper(light, T.DirectionalLightHelper, 0.5);
  D.useHelper(camera, T.CameraHelper);

  R.useLayoutEffect(() => {
    camera.current = light.current.shadow.camera;
    // light.current.shadow.radius = 10;
    // alert(JSON.stringify(light.current.shadow.mapSize, null, 2));
  }, []);

  F.useFrame(() => {
    camera.current.updateProjectionMatrix();
  });

  return (
    <directionalLight
      {...props}
      ref={light}
      // power of 2 due to bitmapping
      shadow-mapSize-width={1024}
      shadow-mapSize-height={1024}
      shadow-camera-far={15}
      shadow-camera-near={1}
      shadow-camera-top={7}
      shadow-camera-bottom={-7}
      shadow-camera-left={-7}
      shadow-camera-right={7}
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
      // args={[color, 0.5 /** intensity */]}
    />
  );
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

function Fondo() {
  const shader = R.useRef<ShaderProps>(null!);

  F.useFrame((state) => {
    shader.current.utime = state.clock.elapsedTime;
  });

  const { uleverX, uleverY, uleverA, ucolor, uleverB, uleverC } = L.useControls(
    {
      uleverX: {
        value: 0.8,
        min: 0.1,
        max: 1,
        step: 0.01,
      },
      uleverY: {
        value: 1.0,
        min: 0.1,
        max: 1,
        step: 0.01,
      },
      uleverA: {
        value: 30.0,
        min: 0.1,
        max: 10,
        step: 0.01,
      },
      uleverB: {
        value: 30.0,
        min: 0.1,
        max: 10,
        step: 0.01,
      },
      uleverC: {
        value: 1.0,
        min: 0.1,
        max: 3,
        step: 0.01,
      },
      ucolor: {
        value: '#ff00bc',
      },
    }
  );
  return (
    <mesh>
      <planeBufferGeometry args={[10, 10, 2 ** 7, 2 ** 7]} />
      <aguaMat
        ref={shader}
        wireframe={!true}
        color={0xff0000}
        side={T.DoubleSide}
        uleverX={uleverX}
        uleverY={uleverY}
        uleverA={uleverA}
        uleverB={uleverB}
        uleverC={uleverC}
        ucolor={ucolor}
      />
    </mesh>
  );
}

/** identity for template-literal */
const glsl = (x: TemplateStringsArray) => String(x);

/**
 * about drawing:
 * texture drawing:
 * - loading issues
 * - process to send it to GPU
 * - can overload GPU
 * - less control (f.i. animations)
 */

var frag = glsl`
/** context -> inputs */

uniform float utime;
uniform float uleverX;
uniform float uleverY;
uniform float uleverA;
uniform float uleverB;

/** vertex -> inputs */

varying vec2 vUv;
varying float vElevation;

void main() {

  // vertical
  float coordValue = step(uleverX, mod(vUv.x * uleverA, 1.0));

  /** + */

  // horizontal
  // coordValue *= step(uleverX, mod(vUv.y * uleverA, 1.0));

  // dots by drawing on crossing lines (multiplying)
  // coordValue *= step(uleverX, mod(vUv.y * uleverA, 1.0));
  
  coordValue *= step(uleverX , mod(vUv.y * uleverA, 1.0));
  
  // black 0,0,0 ,  white 1,1,1
  gl_FragColor.rgba = vec4(coordValue, coordValue, coordValue, 1.0);

}
`;

var frag = glsl`
/** context -> inputs */

uniform float utime;
uniform float uleverX;
uniform float uleverY;
uniform float uleverA;
uniform float uleverB;

/** vertex -> inputs */

varying vec2 vUv;
varying float vElevation;

void main() {

  // bar X
  float barx = step(0.1, mod(vUv.x * uleverA, 1.0));
  barx *= step(uleverX , mod(vUv.y * uleverA, 1.0));
  
  // black 0,0,0 ,  white 1,1,1
  gl_FragColor.rgba = vec4(barx, barx, barx, 1.0);

}
`;

var frag = glsl`
/** context -> inputs */

uniform float utime;
uniform float uleverX;
uniform float uleverY;
uniform float uleverA;
uniform float uleverB;

/** vertex -> inputs */

varying vec2 vUv;
varying float vElevation;

void main() {

  // bar Y
  float bary = step(uleverX, mod(vUv.x * uleverA, 1.0));
  bary *= step(uleverX * 0.5 , mod(vUv.y * uleverA, 1.0));

  // bar X
  float barx = step(uleverX * 0.5, mod(vUv.x * uleverA, 1.0));
  barx *= step(uleverX , mod(vUv.y * uleverA, 1.0));

  float combo = barx + bary;
  
  // black 0,0,0 ,  white 1,1,1
  gl_FragColor.rgba = vec4(combo, combo, combo, 1.0);

}
`;

var frag = glsl`
/** context -> inputs */

uniform float utime;
uniform float uleverX;
uniform float uleverY;
uniform float uleverA;
uniform float uleverB;

/** vertex -> inputs */

varying vec2 vUv;
varying float vElevation;

void main() {
  float offset = 0.2;
  // bar Y
  float bary = step(uleverX, mod(vUv.x * uleverA + offset, 1.0));
  bary *= step(uleverX * 0.5 , mod(vUv.y * uleverA, 1.0));

  // bar X
  float barx = step(uleverX * 0.5, mod(vUv.x * uleverA, 1.0));
  barx *= step(uleverX , mod(vUv.y * uleverA + offset, 1.0));

  float combo = barx + bary;
  
  // black 0,0,0 ,  white 1,1,1
  gl_FragColor.rgba = vec4(combo, combo, combo, 1.0);

}
`;

type ShaderProps = T.ShaderMaterial & {
  [key: string]: any;
};

declare module '@react-three/fiber' {
  interface ThreeElements {
    aguaMat: F.Object3DNode<ShaderProps, typeof AguaMat>;
  }
}

const vertex = glsl`
/** context -> inputs */

uniform float utime;
uniform float uleverX;
uniform float uleverY;
uniform float uleverA;
uniform float uleverB;
uniform float uleverC;
uniform float ucolor;

/** outputs -> frag */

varying vec2 vUv;  
varying float vElevation;  

void main()
{

  // gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);

  /** OR */

  // gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

  /** OR */
  vec4 modelPosition = modelMatrix * vec4(position, 1.0);

  float elevation = sin(modelPosition.x * uleverX + utime) * 1.0 * 1.0;
  elevation += sin(modelPosition.y * uleverY + utime) * 1.0 * 1.0;
  modelPosition.z = elevation;

  vec4 viewPosition = viewMatrix * modelPosition;

  vec4 projectedPosition = projectionMatrix * viewPosition;

  gl_Position = projectedPosition;

  /* outputs */

  vUv = uv;
  vElevation = elevation;
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
`;

const AguaMat = D.shaderMaterial(
  {
    utime: 0,
    uleverX: 1.0,
    uleverY: 1.0,
    uleverA: 1.0,
    uleverB: 1.0,
    uleverC: 1.0,
    ucolor: 0xff0000,
  },
  vertex,
  frag
);

F.extend({ AguaMat }); // -> now you can do <aguaMat ... />
