import * as T from 'three';
import * as React from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  OrbitControls,
  PerspectiveCamera,
  OrthographicCamera,
  Center,
  Text3D,
} from '@react-three/drei/core';
import { proxy, useSnapshot } from 'valtio';
import { useControls } from 'leva';

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

export default function () {
  const { cw, ch } = useCanvas();
  const cam_ = React.useRef(null);
  const { fondo, material } = useControls({
    fondo: {
      value: global.bg,
    },
    material: {
      value: global.mat,
    },
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
            backgroundColor: global.fog,
          }}
        >
          <PerspectiveCamera
            ref={cam_}
            position={[0, 0, 3]}
            fov={75}
            // auto updates the viewport
            manual={false}
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
          {/* <React.Suspense> */}
          <Cubo color={material} />
          {/* </React.Suspense> */}

          <axesHelper args={[4]} />
          <ambientLight args={[0xffffff, 0.5]} />
          <pointLight args={[0xffffff, 0.5]} />
        </Canvas>
      </section>
    </>
  );
}

function Cubo({ color }: { color: string }) {
  const { position, wireframe } = useControls({
    wireframe: false,
    position: { min: -3, max: 3, value: { x: 0, y: 0, z: 0 }, step: 0.1 },
  });
  const mesh_ = React.useRef<T.Mesh>(null);

  return (
    <mesh
      position-x={position.x}
      position-y={position.y}
      position-z={position.z}
      ref={mesh_}
    >
      <boxBufferGeometry args={[1, 1, 1]} />
      <meshStandardMaterial wireframe={wireframe} color={color} />
    </mesh>
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
