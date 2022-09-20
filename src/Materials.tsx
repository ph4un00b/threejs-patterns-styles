import * as T from 'three';
import * as React from 'react';
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import {
  OrbitControls,
  PerspectiveCamera,
  OrthographicCamera,
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

var params = {
  bg: '#00102a',
  mat: '#e83abf',
};

var globalMaterial = new T.MeshBasicMaterial();
export default function () {
  const { cw, ch } = useCanvas();
  const cam_ = React.useRef(null);
  const { fondo, material } = useControls({
    fondo: {
      value: params.bg,
    },
    material: {
      value: params.mat,
    },
  });
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
          <PerspectiveCamera
            ref={cam_}
            position={[0, 0, 3]}
            fov={75}
            // auto updates the viewport
            manual={false}
            makeDefault={true}
          />
          <OrbitControls enableDamping={true} makeDefault={true} />
          <React.Suspense fallback={<p>cargando...</p>}>
            <MyMaterials />
          </React.Suspense>
          <axesHelper args={[4]} />
        </Canvas>
      </section>
    </>
  );
}

var baseUrl = 'https://ph4un00b.github.io/data';
function MyMaterials() {
  const [plane, sphere, torus] = [
    React.useRef<T.Mesh>(null!),
    React.useRef<T.Mesh>(null!),
    React.useRef<T.Mesh>(null!),
  ];

  const [color] = useLoader(T.TextureLoader, [
    `${baseUrl}/gradients/3.jpg`,
    `${baseUrl}/matcaps/3.png`,
  ]);

  useFrame(({ clock }) => {
    const elap = clock.getElapsedTime();
    plane.current.rotation.y = 0.1 * elap;
    sphere.current.rotation.y = 0.1 * elap;
    torus.current.rotation.y = 0.1 * elap;

    plane.current.rotation.y = 0.15 * elap;
    sphere.current.rotation.y = 0.15 * elap;
    torus.current.rotation.y = 0.15 * elap;
  });
  return (
    <>
      <mesh ref={plane} material={globalMaterial}>
        <planeBufferGeometry args={[1, 1]} />
      </mesh>

      <mesh ref={sphere} position-x={-1.5}>
        <sphereBufferGeometry args={[0.5, 16, 16]} />
        <meshBasicMaterial />
      </mesh>

      <mesh ref={torus} material={globalMaterial} position-x={1.5}>
        <torusBufferGeometry args={[0.3, 0.2, 16, 32]} />
      </mesh>
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
      <meshBasicMaterial wireframe={wireframe} color={color} />
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
