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
      value: globals.bg,
    },
    material: {
      value: globals.mat,
    },
  });

  const [m1, m2] = useLoader(T.TextureLoader, [
    `${baseUrl}/matcaps/1.png`,
    `${baseUrl}/matcaps/2.png`,
    `${baseUrl}/matcaps/3.png`,
    `${baseUrl}/matcaps/4.png`,
    `${baseUrl}/matcaps/5.png`,
  ]);

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
            position={[0, 0, 10]}
            fov={75}
            // auto updates the viewport
            manual={false}
            makeDefault={true}
          />
          <OrbitControls enableDamping={true} makeDefault={true} />

          {/* <React.Suspense> */}
          {/* <Cubo color={material} /> */}
          <group position={[0, 1, 0]}>
            <Center>
              <Text3D
                material-matcap={m1}
                font={`${baseUrl}/typeface/press-start-2p.json`}
              >
                drei
                <meshMatcapMaterial matcap={m1} />
              </Text3D>
            </Center>
          </group>

          <MyText />

          <group position={[0, -1, 0]}>
            <MyTextCentered>centered?</MyTextCentered>
          </group>
          {/* </React.Suspense> */}
          <axesHelper args={[4]} />
          <ambientLight args={[0xffffff, 0.5]} />
          <pointLight args={[0xffffff, 0.5]} />
        </Canvas>
      </section>
    </>
  );
}

function MyTextCentered({ children }) {
  console.log('r txt');
  const bevelThickness = 0.03;
  const bevelSize = 0.02;
  const text = React.useRef<T.Mesh>(null!);

  React.useLayoutEffect(() => {
    const geo = text.current.geometry as T.BufferGeometry;
    geo.center();
  });

  return (
    <Text3D
      ref={text}
      size={0.5}
      height={0.2}
      bevelThickness={bevelThickness}
      bevelSize={bevelSize}
      bevelEnabled={true}
      bevelOffset={0}
      // todo: controls do not seem to work!
      bevelSegments={3}
      curveSegments={4}
      font={`${baseUrl}/typeface/press-start-2p.json`}
    >
      {children}
      <meshNormalMaterial wireframe={false} />
    </Text3D>
  );
}

function MyText() {
  console.log('r txt');
  const bevelThickness = 0.03;
  const bevelSize = 0.02;
  const { curveSegments, wireframe, bevelSegments } = useControls({
    curveSegments: {
      value: 8,
      step: 1,
    },
    bevelSegments: {
      value: 3,
      step: 1,
    },
    wireframe: {
      value: true,
    },
  });

  const text = React.useRef<T.Mesh>(null!);

  React.useLayoutEffect(() => {
    const geo = text.current.geometry as T.BufferGeometry;
    /** imperative way
     * still needs a refresh
     */
    geo.bevelSegments = bevelSegments;

    geo.computeBoundingBox();
    console.log(text.current.geometry.boundingBox);

    /** bevelThickness & bevelSize affects the center */
    geo.translate(
      -(geo.boundingBox.max.x - bevelSize) * 0.5,
      -(geo.boundingBox.max.y - bevelSize) * 0.5,
      -(geo.boundingBox.max.z - bevelThickness) * 0.5
    );
  });

  return (
    <Text3D
      ref={text}
      size={0.5}
      height={0.2}
      bevelThickness={bevelThickness}
      bevelSize={bevelSize}
      bevelEnabled={true}
      bevelOffset={0}
      // todo: controls do not seem to work!
      bevelSegments={bevelSegments}
      curveSegments={curveSegments}
      font={`${baseUrl}/typeface/press-start-2p.json`}
    >
      Hello Funker!!
      <meshNormalMaterial wireframe={wireframe} />
    </Text3D>
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
