import * as T from 'three';
import * as React from 'react';
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import {
  OrbitControls,
  PerspectiveCamera,
  OrthographicCamera,
} from '@react-three/drei/core';
import { proxy, useSnapshot } from 'valtio';
// import { useControls } from 'leva';

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
            position={[0, 0, 3]}
            fov={75}
            // auto updates the viewport
            manual={false}
            makeDefault={true}
          />
          <OrbitControls enableDamping={true} makeDefault={true} />
          <group>
            <Cubo />
          </group>
          <axesHelper args={[4]} />
        </Canvas>
      </section>
    </>
  );
}

var params = {
  color: '#c1467d',
};

var baseUrl = 'https://ph4un00b.github.io/data/door/';
var textureAssets = [
  `${baseUrl}/color.jpg`,
  `${baseUrl}/alpha.jpg`,
  `${baseUrl}/height.jpg`,
  `${baseUrl}/normal.jpg`,
  `${baseUrl}/ambientOcclusion.jpg`,
  `${baseUrl}/metalness.jpg`,
  `${baseUrl}/roughness.jpg`,
];

function Cubo() {
  // const { position, wireframe, boxColor } = useControls({
  //   boxColor: params.color,
  //   wireframe: false,
  //   position: { min: -3, max: 3, value: { x: 0, y: 0, z: 0 }, step: 0.1 },
  // });
  const [color] = useLoader(T.TextureLoader, textureAssets);

  React.useLayoutEffect(() => {
    color.repeat.x = 2;
    color.repeat.y = 3;
    // color.wrapS = T.RepeatWrapping;
    // color.wrapT = T.RepeatWrapping;
    color.wrapS = T.MirroredRepeatWrapping;
    color.wrapT = T.MirroredRepeatWrapping;

    color.offset.x = 0.5;
    color.offset.y = 0.5;

    color.center.x = 0.5;
    color.center.y = 0.5;

    color.generateMipmaps = false;

    color.minFilter = T.NearestFilter;
    color.magFilter = T.NearestFilter;

    // weight- low  pls, https://tinypng.com/
    // size - divided by 2 = best performance
    // data - normal (lossless compression, ala png)
    // https://www.arroway-textures.ch/
    // https://www.poliigon.com/textures/free
    // https://www.instagram.com/3dtextures.me/
    // https://www.substance3d.com/ now by adobe
  }, []);

  useFrame(() => {
    color.rotation += Math.PI * 0.25 * 0.01;
  });
  const mesh_ = React.useRef<T.Mesh>(null);

  return (
    <mesh position-x={0} position-y={0} position-z={0} ref={mesh_}>
      <boxBufferGeometry args={[1, 1, 1]} />
      {/* <sphereBufferGeometry args={[1, 32, 32]} /> */}
      {/* <coneBufferGeometry args={[1, 1, 32]} /> */}
      {/* <torusBufferGeometry args={[1, 0.35, 32, 100]} /> */}
      <meshBasicMaterial map={color} wireframe={false} color={params.color} />
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
