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
import { Debug, Physics } from '@react-three/cannon';

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

          <Physics>
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
              <mesh castShadow={true} position-x={-2} position-y={1}>
                <sphereBufferGeometry args={[1, 32, 32]} />
                <meshStandardMaterial roughness={0.4} metalness={0.3} />
              </mesh>

              <mesh receiveShadow={true} rotation-x={-Math.PI * 0.5}>
                <planeBufferGeometry args={[16, 16]} />
                <meshStandardMaterial
                  color={'#777777'}
                  roughness={0.4}
                  metalness={0.3}
                  side={T.DoubleSide}
                />
              </mesh>
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

function Cubo(props) {
  const [active, setActive] = React.useState(0);
  const { position, wireframe } = useControls({
    wireframe: false,
  });
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
      <a.meshStandardMaterial color={colorA} wireframe={wireframe} />
    </a.mesh>
  );
}

/** suports shadows! */
function DirectionalLight(props) {
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
