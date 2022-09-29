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
          {/* 💡 not having a clear color would glitch the recording */}
          <color attach="background" args={['#000']} />
          {/* <React.Suspense> */}

          <PerspectiveCamera
            ref={cam_}
            position={[-1, 1, 7]}
            fov={75}
            near={0.1}
            far={100}
            // auto updates the viewport
            // manual={false}
            makeDefault={true}
          />

          <OrbitControls enableDamping={true} makeDefault={true} />
          <group position={[0, 4, 0]}>
            <Center>
              <Text3D castShadow={true} font={global.font1}>
                phau!
                <meshStandardMaterial metalness={0} roughness={0} />
              </Text3D>
            </Center>
          </group>

          <mesh>
            <planeBufferGeometry args={[1, 1, 32, 32]} />
            <rawShaderMaterial vertexShader={``} fragmentShader={``} />
          </mesh>
          <axesHelper args={[4]} />
          <ambientLight color={ambient} intensity={ambientIntensity} />
          {/* </React.Suspense> */}
        </Canvas>
      </section>
    </>
  );
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
