import * as T from 'three';
import * as React from 'react';
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import {
  OrbitControls,
  PerspectiveCamera,
  OrthographicCamera,
  Text3D,
  Center,
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
  bg: '#00102a',
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

  const matcaps = useLoader(T.TextureLoader, [
    `${baseUrl}/matcaps/1.png`,
    `${baseUrl}/matcaps/2.png`,
    `${baseUrl}/matcaps/3.png`,
    `${baseUrl}/matcaps/4.png`,
    `${baseUrl}/matcaps/5.png`,
  ]);

  var geo = React.useMemo(
    () => new T.TorusBufferGeometry(0.3, 0.2, 20, 45),
    []
  );
  var mat = React.useMemo(
    () => new T.MeshMatcapMaterial({ matcap: matcaps[3] }),
    []
  );
  return (
    <>
      <section>
        <Canvas
          dpr={[dpr.min, dpr.max]}
          style={{
            width: cw + 'px',
            height: ch + 'px',
            backgroundColor: fondo,
          }}
        >
          <OrbitControls enableDamping={true} makeDefault={true} />

          {/* <React.Suspense> */}
          <Center>
            <Text3D font={global.font1}>
              phau!
              <meshMatcapMaterial matcap={matcaps[3]} />
            </Text3D>
          </Center>

          {Array.from({ length: 100 }).map((_, i) => {
            return (
              <React.Fragment key={i}>
                <mesh
                  args={[geo, mat]}
                  rotation-x={Math.random() * Math.PI}
                  rotation-y={Math.random() * Math.PI}
                  position={[
                    (Math.random() - 0.5) * 10,
                    (Math.random() - 0.5) * 10,
                    (Math.random() - 0.5) * 10,
                  ]}
                ></mesh>
              </React.Fragment>
            );
          })}
          {/* </React.Suspense> */}
          <PerspectiveCamera
            ref={cam_}
            position={[0, 0, 15]}
            fov={75}
            // auto updates the viewport
            manual={false}
            makeDefault={true}
          />
          <axesHelper args={[4]} />
          <ambientLight args={[0xffffff, 1.5]} />
          <pointLight args={[0xffffff, 1.5]} />
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
