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
            backgroundColor: 'royalblue',
          }}
        >
          <PerspectiveCamera
            ref={cam_}
            position={[0, 0, 2]}
            fov={80}
            // auto updates the viewport
            manual={false}
            makeDefault={true}
          />
          {/* predefined controls */}
          <OrbitControls enableDamping={true} makeDefault={true} />
          <group>
            <CubeWithOrbitControls
              theCam={cam_}
              color={'hotpink'}
              position={[0, 0, 0]}
            />
          </group>

          <axesHelper args={[4]} />
        </Canvas>
      </section>
    </>
  );
}

function CubeWithOrbitControls({ theCam, position, color }) {
  const mesh_ = React.useRef<T.Mesh>(null);
  manual_viewport_update: {
    // const viewport = useThree((state) => state.viewport);
    // React.useLayoutEffect(() => {
    //   console.log(viewport);
    //   theCam.current.aspect = viewport.width / viewport.height;
    //   theCam.current.updateProjectionMatrix();
    // }, [viewport]);
  }

  return (
    <mesh ref={mesh_} position={position}>
      <meshBasicMaterial color={color} />
      <boxGeometry args={[1, 1, 1, 5, 5, 5]} />
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
