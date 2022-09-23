import * as T from 'three';
import * as React from 'react';
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import {
  OrbitControls,
  PerspectiveCamera,
  OrthographicCamera,
  Text3D,
  Center,
  useHelper,
  // useHelper,
} from '@react-three/drei/core';
import { proxy, useSnapshot } from 'valtio';
import { Leva, useControls } from 'leva';
import { RectAreaLightHelper, RectAreaLightUniformsLib } from 'three-stdlib';

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
  bg: '#00102a',
  mat: '#e83abf',
  font1: `${baseUrl}/typeface/press-start-2p.json`,
};

/** @link https://threejs.org/examples/?q=shadow#webgl_shadowmap_viewer */
export default function () {
  const { cw, ch } = useCanvas();
  const camera = React.useRef(null!);
  const cubo = React.useRef<T.Mesh>(null!);

  const matcaps = useLoader(T.TextureLoader, [
    `${baseUrl}/matcaps/1.png`,
    `${baseUrl}/matcaps/2.png`,
    `${baseUrl}/matcaps/3.png`,
    `${baseUrl}/matcaps/4.png`,
    `${baseUrl}/matcaps/5.png`,
    `${baseUrl}/matcaps/6.png`,
    `${baseUrl}/matcaps/7.png`,
    `${baseUrl}/matcaps/8.png`,
  ]);

  const textures = useLoader(T.TextureLoader, [
    `${baseUrl}/textures/bakedShadow.jpg`,
    `${baseUrl}/textures/simpleShadow.jpg`,
  ]);

  const { ambientIntensity, position } = useControls({
    ambientIntensity: { value: 0.5, min: 0, max: 1, step: 0.001 },
    position: { min: -30, max: 30, step: 0.1, value: { x: 0, y: 0, z: 9 } },
  });

  return (
    <>
      <section>
        <Canvas
          // control shadow does not work!
          shadows={false} /** enable shadowMap */
          dpr={[dpr.min, dpr.max]}
          style={{
            width: cw + 'px',
            height: ch + 'px',
            backgroundColor: global.bg,
          }}
        >
          <OrbitControls enableDamping={true} makeDefault={true} />

          {/* <React.Suspense> */}
          <group position={[0, 4, 0]}>
            <Center>
              <Text3D castShadow={true} font={global.font1}>
                phau!
                <meshStandardMaterial metalness={0} roughness={0} />
              </Text3D>
            </Center>
          </group>

          <group>
            <mesh>{/* haus */}</mesh>

            <mesh position-y={2.5 / 2}>
              <boxBufferGeometry args={[4, 2.5, 4]} />
              <meshStandardMaterial
                color={'#ac8e82'}
                metalness={0}
                roughness={0}
              />
            </mesh>

            <mesh rotation-y={Math.PI * 0.25} position-y={2.5 + 0.5}>
              <coneBufferGeometry args={[3.5, 1, 4]} />
              <meshStandardMaterial
                color={'#ac8eaff'}
                metalness={0}
                roughness={0}
              />
            </mesh>

            <mesh position-z={2 + 0.01} position-y={1}>
              <planeBufferGeometry args={[2, 2]} />
              <meshStandardMaterial
                color={'#ac8eaff'}
                metalness={0}
                roughness={0}
              />
            </mesh>
          </group>

          <Floor textures={textures} />

          <PerspectiveCamera
            ref={camera}
            position={[position.x, position.y, position.z]}
            fov={75}
            // auto updates the viewport
            manual={false}
            makeDefault={true}
          />

          <ambientLight args={[0xffffff, ambientIntensity]} />

          <axesHelper args={[4]} />
        </Canvas>
      </section>
    </>
  );
}

function Floor({ textures, metalness = 0, roughness = 0 }) {
  const floor = React.useRef<T.Mesh>(null!);
  const shadow = React.useRef<T.Mesh>(null!);

  React.useLayoutEffect(() => {
    /** avoid overlapping (glicht effect) with delta */
    shadow.current.position.y = floor.current.position.y + 0.01;
  }, []);

  return (
    <>
      <mesh
        ref={floor}
        rotation-x={Math.PI * 0.5}
        receiveShadow={false}
        position-y={0}
      >
        <planeBufferGeometry args={[20, 20]} />
        <meshStandardMaterial
          color={'#a9c388'}
          metalness={metalness}
          roughness={roughness}
          side={T.DoubleSide}
        />
      </mesh>

      {/* dynamic baked shadow */}
      <mesh ref={shadow} rotation-x={-Math.PI * 0.5}>
        <planeBufferGeometry args={[1.5, 1.5]} />
        <meshBasicMaterial
          transparent={true}
          alphaMap={textures[1]}
          args={[{ color: 0x000000 }]}
        />
      </mesh>
    </>
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
