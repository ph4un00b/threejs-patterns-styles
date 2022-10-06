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
import { Leva, useControls } from 'leva';
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
            position={[0, 0, 10]}
            fov={75}
            near={0.1}
            far={100}
            // auto updates the viewport
            // manual={false}
            makeDefault={true}
          />

          <OrbitControls enableDamping={true} makeDefault={true} />

          <Cubo castShadow={true} />

          <Leva hidden={true} />
          <axesHelper args={[4]} />
          <ambientLight color={ambient} intensity={ambientIntensity} />

          {/* </React.Suspense> */}
        </Canvas>
      </section>
    </>
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

      shader.uniforms.uTime = localUniforms.uTime;
      shader.uniforms.uleverX = localUniforms.uleverX;
      shader.uniforms.uleverR = localUniforms.uleverR;
      shader.uniforms.uleverG = localUniforms.uleverG;
      shader.uniforms.uleverB = localUniforms.uleverB;
      shader.uniforms.uResolution = localUniforms.uResolution;
      shader.uniforms.uPointer = localUniforms.uPointer;

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
          vec2 uv = (gl_FragCoord.xy - uResolution * .5) / uResolution.yy;
          
          vec3 color = vec3(0.5, 0.0, 0.5);

          gl_FragColor = vec4(
              uv.x,
              uv.y,
              1.,
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
    localUniforms.uResolution.value.x = CanvasProxy.w;
    localUniforms.uResolution.value.y = CanvasProxy.h;
    // console.log({ w: viewport.width, h: viewport.height });
  }, [CanvasProxy.h, CanvasProxy.w, pointer]);

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
  const { rotation } = useSpring({ rotation: active ? 1 : 0 });
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
    // @ts-ignore
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
      <planeBufferGeometry args={[8, 8, 64, 64]} />
      {/* 
      // @ts-ignore */}
      <a.meshStandardMaterial ref={shader} color={colorA} />
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
