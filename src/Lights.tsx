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
  const {
    fondo,
    material,
    metalness,
    roughness,
    ambient,
    intensity,
    directional,
    fadeDistance,
    decayDistance,
  } = useControls({
    directional: { min: -30, max: 30, step: 0.1, value: { x: 2, y: 0, z: 0 } },
    fondo: {
      value: global.bg,
    },
    material: {
      value: global.mat,
    },
    ambient: {
      value: '#ffffff',
    },
    intensity: {
      value: 0.1,
      max: 1,
      min: 0,
      step: 0.001,
    },
    metalness: {
      value: 0,
      max: 1,
      min: 0,
      step: 0.001,
    },
    roughness: {
      value: 0,
      max: 1,
      min: 0,
      step: 0.001,
    },
    fadeDistance: {
      value: 5,
      max: 10,
      min: 0,
      step: 1,
    },
    decayDistance: {
      value: 5,
      max: 10,
      min: 0,
      step: 1,
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
          <group position={[0, 2, 0]}>
            <Center>
              <Text3D font={global.font1}>
                phau!
                <meshMatcapMaterial matcap={matcaps[3]} />
              </Text3D>
            </Center>
          </group>

          {Array.from({ length: 10 }).map((_, i) => {
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

          <mesh position-x={-2} position-y={0}>
            <sphereBufferGeometry args={[0.5, 16, 16]} />
            {/* it uses PBR principles algos */}
            <meshStandardMaterial metalness={metalness} roughness={roughness} />
          </mesh>

          <mesh position-y={0}>
            <boxBufferGeometry args={[1, 1]} />
            <meshStandardMaterial
              metalness={metalness}
              roughness={roughness}
              side={T.DoubleSide}
            />
          </mesh>

          <Floor metalness={metalness} roughness={roughness} />

          <mesh position-x={2} position-y={0}>
            <torusBufferGeometry args={[0.3, 0.2, 16, 32]} />
            {/* todo: why specular is not working? */}
            <meshStandardMaterial
              attach={'material'}
              metalness={metalness}
              roughness={roughness}
            />
          </mesh>
          {/* </React.Suspense> */}
          <PerspectiveCamera
            ref={cam_}
            position={[0, 0, 8]}
            fov={75}
            // auto updates the viewport
            manual={false}
            makeDefault={true}
          />
          <axesHelper args={[4]} />
          {/* omni-directional */}
          <ambientLight args={[ambient, intensity /** intensity */]} />
          <directionalLight
            position={[directional.x, directional.y, directional.z]}
            args={['red', 0.3 /** intensity */]}
          />
          {/* cheap performance */}
          <hemisphereLight
            args={['royalblue' /** top */, 'green' /**bottom */, 0.8]}
          />
          <pointLight
            position={[2, 0.5, 0]}
            args={[
              ambient,
              intensity /** intensity */,
              fadeDistance,
              decayDistance,
            ]}
          />
        </Canvas>
      </section>
    </>
  );
}

function Floor({ metalness, roughness }) {
  const mesh = React.useRef<T.Mesh>(null!);

  React.useLayoutEffect(() => {
    mesh.current.rotation.x = Math.PI * 0.5;
  }, []);

  return (
    <mesh ref={mesh} position-y={-1}>
      <planeBufferGeometry args={[10, 10]} />
      <meshStandardMaterial
        metalness={metalness}
        roughness={roughness}
        side={T.DoubleSide}
      />
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
