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
import { noise } from 'maath/random';
import useCapture from 'use-capture';

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
  const { fondo, ambientIntensity, ambient, w, h, gap } = useControls({
    ambientIntensity: { value: 0.3, min: 0, max: 1, step: 0.001 },
    ambient: { value: '#ffffff' },
    fondo: { value: global.fog },
    w: { value: 100, min: 1, max: 100, step: 1 },
    h: { value: 100, min: 1, max: 100, step: 1 },
    gap: { value: 1.2, min: 0, max: 20, step: 0.1 },
  });

  const [bind, startRecording] = useCapture({ duration: 10, fps: 60 });

  // quitar para iniciar grabacion
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
          // estoy evita que se rerenderize el canvas
          // onCreated={bind}
          shadows={!true} /** enable shadowMap */
          dpr={[dpr.min, dpr.max]}
          style={{
            width: cw + 'px',
            height: ch + 'px',
            backgroundColor: fondo,
          }}
        >
          {/* 💡 not having a clear color would glitch the recording */}
          <color attach="background" args={['#000']} />
          {/* <React.Suspense> */}

          <PerspectiveCamera
            ref={cam_}
            position={[-0, 0, 10]}
            fov={75}
            near={0.1}
            far={1000}
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

          {/* @link https://www.khanacademy.org/computing/computer-programming/programming-natural-simulations */}
          <MemoBackGround
            rotation={[0, 0, 0]}
            position={[0, 0, -1]}
            width={w}
            height={h}
            gap={gap}
          />
          <axesHelper args={[4]} />
          <ambientLight color={ambient} intensity={ambientIntensity} />
          {/* <DirectionalLight
            castShadow={true}
            position={[5, 5, 5]}
            intensity={0.2}
            color={ambient}
          /> */}
          {/* </React.Suspense> */}
        </Canvas>
      </section>
    </>
  );
}

function createVertexBuffer({
  height,
  width,
  gap,
}: {
  height: number;
  width: number;
  gap: number;
}) {
  // const computeZ = ({ x, y, time = 0 }) => {
  //   return 0;
  // };
  const positions = [];
  const colors = [];
  const normals = []; //  for lights

  for (let hi = 0; hi < height; hi++) {
    for (let wi = 0; wi < width; wi++) {
      let x = gap * (wi - (width - 1) / 2);
      let y = gap * (hi - (height + 1) / 2);
      // let z = computeZ({ x, y });
      let z = 0;
      positions.push(x, y, z);
      // RGB in the range  of [0,1]
      colors.push(0, 0, 0);
      // no manipulation at the moment
      normals.push(0, 0, 1);
    }
  }

  return [
    new Float32Array(positions),
    new Float32Array(colors),
    new Float32Array(normals),
  ];
}

function createIndexBuffer({
  height,
  width,
}: {
  height: number;
  width: number;
}) {
  const indices = [];
  // bottom Left Vertex
  let blv = 0;

  for (let hi = 0; hi < height - 1; hi++) {
    for (let wi = 0; wi < width - 1; wi++) {
      bottom_right: {
        indices.push(blv, blv + 1, blv + width + 1);
      }
      top_left: {
        indices.push(blv + width + 1, blv + width, blv);
      }
      blv++;
    }
    blv++;
  }

  return new Uint16Array(indices);
}

var MemoBackGround = React.memo(Background);
var bgUniforms = {
  uTime: { value: 0 },
  uleverX: { value: 0.1 },
};

function Background({
  seed = Math.floor(Math.random() * 2 ** 16),
  width,
  height,
  gap,
  ...props
}: MeshProps & {
  seed?: number;
  width: number;
  height: number;
  gap: number;
}) {
  const shader = React.useRef<T.MeshStandardMaterial>(null!);
  noise.seed(seed);

  React.useLayoutEffect(() => {
    /**
     * @link https://github.com/mrdoob/three.js/tree/master/src/renderers/shaders
     *
     * @link https://github.com/mrdoob/three.js/blob/master/src/renderers/shaders/ShaderLib/meshphysical.glsl.js
     */
    shader.current.onBeforeCompile = function (shader: T.Shader) {
      console.log(shader);

      /**
       * adding more  uniforms
       */

      shader.uniforms.uTime = bgUniforms.uTime;
      shader.uniforms.uleverX = bgUniforms.uleverX;

      /**
       * aplicando rotación
       * @link https://thebookofshaders.com/08/?lan=es
       */
      const newShaderCommon = shader.vertexShader.replace(
        /**
         * this is before void main()
         */

        '#include <common>',
        `#include <common>

        uniform float uTime;
        uniform float uleverX;

        // transformed.xyz = 0.0;

        mat2 rotateMatrix2D(float angle) {
          return mat2(
            cos( angle ), - sin( angle ),
            sin( angle ), + cos( angle )
            );
        }
        `
      );

      shader.vertexShader = newShaderCommon;

      const newShader = shader.vertexShader.replace(
        /**
         * this is inside void main()
         */

        '#include <begin_vertex>',
        `#include <begin_vertex>

        float angle = (position.y + uTime) * uleverX;
        mat2 rotateMat = rotateMatrix2D( angle );

        transformed.xz = rotateMat * transformed.xz;
        `
      );

      shader.vertexShader = newShader;
    };
  }, []);

  const {
    leverX,
    scale,
    octaves,
    persistence,
    lacunarity,
    amplitude,
    frequency,
  } = useControls({
    scale: { value: 0.125, min: 0.0001, max: 1, step: 0.0001 },
    leverX: { value: 0.1, min: 0.0001, max: 1, step: 0.0001 },
    octaves: { value: 20, min: 0, max: 100, step: 1 },
    persistence: { value: 0.6, min: 0, max: 1, step: 0.1 },
    lacunarity: { value: 2, min: 0, max: 5, step: 0.1 },
    amplitude: { value: 1.0, min: 0, max: 3, step: 0.01 },
    frequency: { value: 1.0, min: 0, max: 3, step: 0.01 },
  });

  useFrame((state) => {
    // console.log(shader.current);
    bgUniforms.uTime.value = state.clock.elapsedTime;
    bgUniforms.uleverX.value = leverX;
  });

  const sampleNoise = ({ x, y, z }: { x: number; y: number; z: number }) => {
    /** @link https://www.youtube.com/watch?v=MRNFcywkUSA&list=PLFt_AvWsXl0eBW2EiBtl_sxmDtSgZBxB3&index=4 */
    let amp = amplitude;
    let freq = frequency;

    // let max = -Infinity;
    // let min = Infinity;

    let perlinValue = 0;
    for (let i = 0; i < octaves; i++) {
      perlinValue = noise.perlin3(
        x * freq * scale,
        y * freq * scale,
        z
      ); /** * (* 2 - 1) to allow values in the range of [-1,1] */
      //  *
      //   2 -
      // 1;
      perlinValue += amp * perlinValue;

      amp *= persistence;
      freq *= lacunarity;
    }

    return perlinValue;
  };

  const [positions, colors, normals, indices] = React.useMemo(
    () => [
      ...createVertexBuffer({
        width,
        height,
        gap,
      }),
      createIndexBuffer({
        width,
        height,
      }),
      [width, height],
    ],
    [width, height, gap]
  );

  // const indices = React.useMemo(
  //   () =>
  //     createIndexBuffer({
  //       width,
  //       height,
  //     }),
  //   [width, height]
  // );

  const bg = React.useRef<T.Mesh>(null!);
  const geo = React.useRef<T.BufferGeometry>(null!);

  React.useLayoutEffect(() => {
    /** todo: fix w, h, mutation
     * gap  is working
     */
    geo.current.setAttribute('color', new T.BufferAttribute(colors, 3));
    geo.current.setAttribute('position', new T.BufferAttribute(positions, 3));
    geo.current.setAttribute('normal', new T.BufferAttribute(normals, 3));
    geo.current.setIndex(new T.BufferAttribute(indices, 1));
  }, [positions, colors, normals, indices]);

  // const computeZ = React.useCallback(({ x, y, time = 0 }) => {
  //   return Math.random();
  // }, []);
  const computeZ = ({
    x,
    y,
    time = 0,
  }: {
    x: number;
    y: number;
    time?: number;
  }) => {
    // const res = (Math.random() - 0.5) * 2;
    const res = sampleNoise({ x, y, z: time });
    // console.log(res);
    return res;
  };

  const { r, g, b } = useControls({
    r: { value: 1.0, min: -1.0, max: 1.0, step: 0.001 },
    g: { value: 1.0, min: -5.0, max: 5.0, step: 0.001 },
    b: { value: 1.0, min: -50, max: 100, step: 0.001 },
  });

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    let i = 0;
    for (let yi = 0; yi < height; yi++) {
      for (let xi = 0; xi < width; xi++) {
        // geo.current.attributes.position.array[i + 2] = Math.random();
        positions[i + 2] = computeZ({
          x: positions[i],
          y: positions[i + 1],
          time: t * 0.2,
        });

        const x = positions[i];
        const y = positions[i + 1];
        const zHeight = positions[i + 2];

        const R = i;
        const G = i + 1;
        const B = i + 2;

        colors: {
          colors[R] = zHeight / r;
          // colors[R] = r;
          colors[G] = zHeight / g;
          // colors[G] = g;
          // colors[B] = Math.sqrt(x ** 2 + y ** 2) / b;
          colors[B] = b;
          i += 3;
        }
      }
    }

    geo.current.attributes.position.needsUpdate = true;
    geo.current.attributes.color.needsUpdate = true;
  });

  return (
    <mesh ref={bg} {...props}>
      <bufferGeometry ref={geo} />
      <meshStandardMaterial
        ref={shader}
        vertexColors={true}
        side={T.DoubleSide}
        wireframe={!true}
      />
    </mesh>
  );
}

function Cubo(props: BoxProps & MeshProps) {
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

  const { viewport } = useThree();
  const [{ x, y }, api] = useSpring(() => ({ x: 0, y: 1 }));

  const handlers = useDrag(function ({ event, offset: [x, y] }) {
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

/** @link https://overreacted.io/making-setinterval-declarative-with-react-hooks/ */
function useTimeout(callback: () => void, delay: number) {
  const savedCallback = React.useRef<() => void>(null!);

  React.useEffect(() => {
    savedCallback.current = callback;
  });

  React.useEffect(() => {
    function tick() {
      savedCallback.current();
    }

    let id = window.setTimeout(tick, delay);
    return () => window.clearTimeout(id);
  }, [delay]);
}
