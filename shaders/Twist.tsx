import * as T from 'three';
import * as React from 'react';
import {
  Canvas,
  LightProps,
  MeshProps,
  useFrame,
  useThree,
} from '@react-three/fiber';
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
import { useSpring, config, a } from '@react-spring/three';
import { useDrag } from '@use-gesture/react';
import {
  Debug,
  Physics,
  PlaneProps,
  SphereProps,
  useContactMaterial,
  usePlane,
  useSphere,
  useBox,
  BoxProps,
  CollideEvent,
} from '@react-three/cannon';
import nice_colors from '../utils/colors';

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
  const cam_ = React.useRef(null);
  const { fondo, ambientIntensity, ambient } = useControls({
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

type MaterialOptions =
  | string
  | {
    friction?: number | undefined;
    restitution?: number | undefined;
  }
  | undefined;

function World({ items }: { items: number }) {
  const [circulos, setCirculos] = React.useState(items);
  const [preset] = React.useState(Math.floor(Math.random() * 900));

  const bouncyMat = {
    name: 'plastic',
  } as MaterialOptions;

  const groundMat = {
    name: 'concreto',
  } as MaterialOptions;

  useContactMaterial(groundMat, bouncyMat, {
    friction: 0.1,
    restitution: 0.7 /** bouncing! */,
  });

  const colors = React.useMemo(() => {
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
}: PlaneProps & { receiveShadow?: boolean }) {
  // infinite grid floor
  const [piso, api] = usePlane(
    () => ({ mass: 0, ...props }),
    React.useRef<T.Mesh>(null!)
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

var localUniforms = {
  uTime: { value: 0 },
  uleverX: { value: 0.1 },
  uleverR: { value: 0.1 },
  uleverG: { value: 0.1 },
  uleverB: { value: 0.1 },
  uResolution: { value: new T.Vector2() },
  uPointer: { value: new T.Vector2() },
};

function Cubo(props: BoxProps & MeshProps) {
  const shader = React.useRef<T.MeshStandardMaterial>(null!);

  React.useLayoutEffect(() => {

    shader.current.onBeforeCompile = function (shader: T.Shader) {
      // console.log(shader);

      shader.uniforms.uTime = localUniforms.uTime;
      shader.uniforms.uleverX = localUniforms.uleverX;
      shader.uniforms.uleverR = localUniforms.uleverR;
      shader.uniforms.uleverG = localUniforms.uleverG;
      shader.uniforms.uleverB = localUniforms.uleverB;
      shader.uniforms.uResolution = localUniforms.uResolution;
      shader.uniforms.uPointer = localUniforms.uPointer;


      setBeforeVertexShader(shader, {
        from: '#include <common>', 
        to: `
        #include <common>

        uniform float uTime;
        uniform float uleverX;

        mat2 rotate2D(float _angle) {
          return mat2(
            cos( _angle ), - sin( _angle ),
            sin( _angle ), + cos( _angle )
            );
        }
      `});

      /**
       * aplicando rotación
       * @link https://thebookofshaders.com/08/?lan=es
       */
      const newShader = shader.vertexShader.replace(
        /**
         * this is inside void main()
         */

        '#include <begin_vertex>',
        `#include <begin_vertex>

        float angle = uleverX;
        mat2 rotateMat = rotate2D( angle );

        transformed.xz = rotateMat * transformed.xz;
        `
      );

      shader.vertexShader = newShader;

      /**
       * @link https://thebookofshaders.com/03/?lan=es
       *
       * aceleradas por hardware: sin(), cos(), tan(), asin(), acos(), atan(), pow(), exp(), log(), sqrt(), abs(), sign(), floor(), ceil(), fract(), mod(), min(), max() y clamp().
       * todo: issue en es.
       */
      shader.fragmentShader = `
      uniform float uTime;
      uniform float uleverX;
      uniform float uleverR;
      uniform float uleverG;
      uniform float uleverB;
      uniform vec2 uResolution;
      uniform vec2 uPointer;

        void main() {
          vec2 st = gl_FragCoord.xy / uResolution;
          // vec2 st = gl_FragCoord.xy;

          gl_FragColor = vec4(
            1.0,
            .5,
            0.0,
            1.0
          );
        }
      `;
    };
  }, []);

  const { leverX, leverR, leverG, leverB } = useControls({
    leverX: { value: 0.1, min: 0.0001, max: 1, step: 0.0001 },
    leverR: { value: 0.1, min: 1 / 256, max: 1.0, step: 1 / 256 },
    leverG: { value: 0.1, min: 1 / 256, max: 1.0, step: 1 / 256 },
    leverB: { value: 0.1, min: 1 / 256, max: 1.0, step: 1 / 256 },
  });

  const { pointer, viewport } = useThree();

  React.useLayoutEffect(() => {
    localUniforms.uPointer.value = pointer;
    localUniforms.uResolution.value.x = viewport.width;
    localUniforms.uResolution.value.y = viewport.height;
    // console.log({ w: viewport.width, h: viewport.height });
  }, [viewport.width, viewport.height, pointer]);

  useFrame((state) => {
    // console.log(shader.current);
    localUniforms.uTime.value = state.clock.elapsedTime;
    localUniforms.uleverX.value = leverX;
    localUniforms.uleverR.value = leverR;
    localUniforms.uleverG.value = leverG;
    localUniforms.uleverB.value = leverB;
  });

  const [active, setActive] = React.useState(0);
  const cubo = React.useRef<T.Mesh>(null);
  const { pos } = useSpring({
    to: {
      pos: 0,
    },
    from: { pos: -20 },
    config: config.gentle,
  });
  const { scale } = useSpring({ scale: active ? 4 : 1 });
  const { rotation } = useSpring({ rotation: active ? Math.PI : 0 });
  const { colorA } = useSpring({ colorA: active ? 'royalblue' : '#e83abf' });
  /** interpolate values from common spring */
  // const { spring } = useSpring({
  //   spring: active,
  //   config: config.molasses,
  // });
  // const { pos } = useSpring({ pos: active ? -2 : 0 });
  // const scale = spring.to([0, 1], [1, 4]);
  // const rotation = spring.to([0, 1], [0, Math.PI]);
  // const colorA = spring.to([0, 1], ['#6246ea', 'royalblue']);

  const [{ x, y }, api] = useSpring(() => ({ x: 0, y: 1 }));

  const handlers = useDrag(function ({ event, offset: [x, y] }) {
    event.stopPropagation();
    const aspect = viewport.getCurrentViewport().factor;
    console.log(x, y);
    return api.start({ x: x / aspect, y: -y / aspect });
  });

  return (
    /* ts-ignore infinity */
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
      <a.meshStandardMaterial ref={shader} color={colorA} />
    </a.mesh>
  );
}

function setBeforeVertexShader(shader: T.Shader, { from, to }: { from: string, to: string }) {
    /**
   * dir: /src/renderers/shaders
   *
   * @link https://github.com/mrdoob/three.js/blob/master/src/renderers/shaders/ShaderLib/meshphysical.glsl.js
   */

  const newShaderCommon = shader.vertexShader.replace(
    /**
     * this code is setup before void main()
     */
    from, to
  );

  shader.vertexShader = newShaderCommon;
}

/** suports shadows! */
function DirectionalLight(props: LightProps) {
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
