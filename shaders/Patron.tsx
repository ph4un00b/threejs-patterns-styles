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
              <World items={4} />
            </Debug>
          </Physics>

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

var hitSound = new window.Audio(`${baseUrl}/sounds/hit.mp3`);

function playHit({ contact: { impactVelocity } }: C.CollideEvent) {
  if (impactVelocity < 1.5) return;
  /** todo:
   * - change the  volume in relation to impact
   * - add a little delay since hitting the floor
   * fires multiple events (4?)
   */
  hitSound.volume = Math.random();
  hitSound.currentTime = 0;
  hitSound.play();
}

type MaterialOptions =
  | string
  | {
      friction?: number | undefined;
      restitution?: number | undefined;
    }
  | undefined;

function World({ items }: { items: number }) {
  const [circulos, setCirculos] = R.useState(items);
  const [preset] = R.useState(Math.floor(Math.random() * 900));

  const bouncyMat = {
    name: 'plastic',
  } as MaterialOptions;

  const groundMat = {
    name: 'concreto',
  } as MaterialOptions;

  C.useContactMaterial(groundMat, bouncyMat, {
    friction: 0.1,
    restitution: 0.7 /** bouncing! */,
  });

  const colors = R.useMemo(() => {
    const array = new Float32Array(items * 3);
    const color = new T.Color();
    for (let i = 0; i < items; i++) {
      color
        .set(nice_colors[preset][Math.floor(Math.random() * 4)])
        .convertSRGBToLinear()
        .toArray(array, i * 3);
    }
    return array;
  }, [items]);

  return (
    <>
      {/* using position instead of granular ones 'position-x' */}
      <Esfera castShadow={true} material={bouncyMat} position={[-2, 5, 0]} />

      {/* using rotation instead of granular ones 'rotation-x' */}
      <Piso
        receiveShadow={true}
        material={groundMat}
        rotation={[-Math.PI * 0.5, 0, 0]}
      />
    </>
  );
}
function Piso({
  receiveShadow,
  ...props
}: C.PlaneProps & { receiveShadow?: boolean }) {
  // infinite grid floor
  const [piso, api] = C.usePlane(
    () => ({ mass: 0, ...props }),
    R.useRef<T.Mesh>(null!)
  );

  return (
    <mesh ref={piso} receiveShadow>
      <planeBufferGeometry args={[16, 16]} />
      <meshStandardMaterial
        color={'#777777'}
        roughness={0.4}
        metalness={0.3}
        side={T.DoubleSide}
      />
    </mesh>
  );
}

function Esfera({
  receiveShadow,
  castShadow,
  ...props
}: C.SphereProps & { receiveShadow?: boolean; castShadow?: boolean }) {
  const [esfera, world] = C.useSphere(
    () => ({
      mass: 1,
      onCollide: (e) => {
        playHit(e);
      },
      ...props,
    }),
    R.useRef<T.Mesh>(null!)
  );

  R.useEffect(() => {
    world.applyLocalForce([150, 0, 0], [0, 0, 0]);
  }, []);

  F.useFrame(({ clock }) => {
    // api.position.set(Math.sin(clock.getElapsedTime()) * 5, 1, 0)
    world.applyForce([-0.05, 0, 0], esfera.current!.position.toArray());
  });

  return (
    // shall we spread the props again?
    <mesh ref={esfera} castShadow>
      <sphereBufferGeometry args={[1, 32, 32]} />
      <meshStandardMaterial roughness={0.4} metalness={0.3} />
    </mesh>
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

export function Fondo() {
  const shader = R.useRef<ShaderProps>(null!);

  F.useFrame((state) => {
    shader.current.utime = state.clock.elapsedTime;
  });

  return (
    <mesh>
      <planeBufferGeometry args={[10, 10, 2 ** 7, 2 ** 7]} />
      <aguaMat
        ref={shader}
        wireframe={true}
        color={0xff0000}
        side={T.DoubleSide}
      />
    </mesh>
  );
}

/** identity for template-literal */
const glsl = (x: TemplateStringsArray) => String(x);

const vertex = glsl`
/** @link https://learnopengl.com/Getting-started/Coordinate-Systems */

// uniform mat4 /** transform coords */ projectionMatrix; 
// uniform mat4 /** transform camera */ viewMatrix;
// uniform mat4 /** transform mesh */ modelMatrix;
/** or use a shorcut */
// uniform mat4 modelViewMatrix;
// attribute vec3 position;
// attribute vec2 uv;

/** all the above are automatically set on <ShaderMaterial/> */

/** context -> inputs */
uniform float utime;


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

float elevation = sin(modelPosition.x * 4.0 + utime) * 0.5;
elevation += sin(modelPosition.y * 4.0 + utime) * 0.2;
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

const frag = glsl`
/** context -> inputs */
uniform float utime;

/** vertex -> inputs */
varying vec2 vUv;
// #pragma glslify: random = require(glsl-random)
varying float vElevation;


void main() {
  // gl_FragColor.rgba = vec4(0.5 + 0.3 * sin(vUv.yxx + utime) + color, 1.0);
  gl_FragColor.rgba = 1.0 * vElevation * vec4(0.5 + 0.3 * sin(vUv.yxy + utime), 1.0);
  // gl_FragColor.rgba = 1.0 * vElevation * vec4(0.5 + 0.3 * 1.0, 0.5 + 0.3 * 1.0, 0.5 + 0.3 * 1.0, 1.0);
  // gl_FragColor.rgba = vec4(vec3(0.), 1.);
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

const AguaMat = D.shaderMaterial({ utime: 0 }, vertex, frag);

F.extend({ AguaMat }); // -> now you can do <aguaMat ... />
