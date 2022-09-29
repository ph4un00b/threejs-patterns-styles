/** @jsxFrag React.Fragment */
import * as T from 'three';
import * as React from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  OrbitControls,
  PerspectiveCamera,
  OrthographicCamera,
} from '@react-three/drei/core';
import { proxy, useSnapshot } from 'valtio';

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

export default function () {
  const { cw, ch } = useCanvas();
  const cam_ = React.useRef(null);
  return (
    <>
      <section>
        <Canvas
          dpr={[dpr.min, dpr.max]}
          style={{
            width: cw + 'px',
            height: ch + 'px',
            backgroundColor: 'black',
          }}
        >
          <PerspectiveCamera
            ref={cam_}
            position={[2, 0, 2]}
            fov={100}
            // auto updates the viewport
            manual={false}
            makeDefault={true}
          />
          <OrbitControls enableDamping={true} makeDefault={true} />
          <group>
            <CustomGeo />
          </group>

          <axesHelper args={[4]} />
        </Canvas>
      </section>
    </>
  );
}

var arrPos = [
  ...[Math.random(), Math.random(), Math.random()],
  ...[Math.random(), Math.random(), Math.random()],
  ...[Math.random(), Math.random(), Math.random()],
];

// https://threejs.org/manual/#en/custom-buffergeometry
var positions = new Float32Array(
  (() => {
    const vertices = 3;
    const xyz = 3;
    const triangles = vertices * xyz * 800;
    const arr = [];
    for (let i = 0; i < triangles; i++) {
      arr.push((Math.random() - 0.5) * 3);
    }
    return arr;
  })()
);

function CustomGeo({}) {
  const mesh_ = React.useRef<T.Mesh>(null);

  return (
    <mesh>
      <meshBasicMaterial wireframe={true} color={'royalblue'} />
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={1}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
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
    document.querySelector('canvas').requestFullscreen();
  } else {
    document.exitFullscreen();
  }
});
