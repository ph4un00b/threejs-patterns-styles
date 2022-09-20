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

/** @link https://polyhaven.com/ */

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

  const { position, wireframe } = useControls({
    wireframe: false,
    position: { min: -3, max: 3, value: { x: 0, y: -4, z: -2 }, step: 0.1 },
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
          {/* <React.Suspense fallback={<p>cargando...</p>}> */}
          <group
            position-x={position.x}
            position-y={position.y}
            position-z={position.z}
          >
            <MyMaterials />
          </group>
          {/* </React.Suspense> */}
          <axesHelper args={[5]} />
          <ambientLight args={[0xffffff, 0.5]} />
          <pointLight args={[0xffffff, 2.5]} />
        </Canvas>
      </section>
    </>
  );
}

var baseUrl = 'https://ph4un00b.github.io/data';

var textureAssets = [
  `${baseUrl}/door/color.jpg`,
  `${baseUrl}/door/alpha.jpg`,
  `${baseUrl}/door/height.jpg`,
  `${baseUrl}/door/normal.jpg`,
  `${baseUrl}/door/ambientOcclusion.jpg`,
  `${baseUrl}/door/metalness.jpg`,
  `${baseUrl}/door/roughness.jpg`,
];

function MyMaterials() {
  const [plane, sphere, torus, torusPhong] = [
    React.useRef<T.Mesh>(null!),
    React.useRef<T.Mesh>(null!),
    React.useRef<T.Mesh>(null!),
    React.useRef<T.Mesh>(null!),
  ];

  const [grad, cap, t1, t2] = useLoader(T.TextureLoader, [
    `${baseUrl}/gradients/3.jpg`,
    `${baseUrl}/matcaps/3.png`,
    ...textureAssets,
  ]);

  toon: {
    /** for ToonMaterial s */
    grad.minFilter = T.NearestFilter;
    grad.magFilter = T.NearestFilter;
    grad.generateMipmaps = false; /** since we manually set above */
  }

  useFrame(({ clock }) => {
    const elap = clock.getElapsedTime();
    plane.current.rotation.y = 0.1 * elap;
    sphere.current.rotation.y = 0.1 * elap;
    torus.current.rotation.y = 0.1 * elap;

    plane.current.rotation.y = 0.15 * elap;
    sphere.current.rotation.y = 0.15 * elap;
    torus.current.rotation.y = 0.15 * elap;
  });

  React.useLayoutEffect(() => {
    /** imperative */
    globalMaterial.map = t2;
    globalMaterial.color.set(0x00ff00);
    globalMaterial.color = new T.Color('green');

    alpha: {
      globalMaterial.transparent = true; /** always needed! */
      globalMaterial.opacity = 0.5;
      globalMaterial.alphaMap = t2;
    }
    globalMaterial.side = T.DoubleSide; /** more compute! */

    // torusPhong.current.material.specular = new T.Color(0xff0000);
  }, []);

  const { metalness, roughness } = useControls({
    metalness: {
      value: 0,
      min: 0,
      max: 1,
      step: 0.001,
    },
    roughness: {
      value: 0,
      min: 0,
      max: 1,
      step: 0.001,
    },
  });
  return (
    <>
      <mesh ref={sphere} position-x={-1.5}>
        <sphereBufferGeometry args={[0.5, 16, 16]} />
        <meshBasicMaterial transparent={true} map={t1} alphaMap={t2} />
      </mesh>

      <mesh ref={plane} material={globalMaterial}>
        <planeBufferGeometry args={[1, 1]} />
      </mesh>

      <mesh ref={torus} material={globalMaterial} position-x={1.5}>
        <torusBufferGeometry args={[0.3, 0.2, 16, 32]} />
      </mesh>

      <mesh ref={sphere} position-x={-1.5} position-y={1}>
        <sphereBufferGeometry args={[0.5, 16, 16]} />
        {/* Normal used to debug normally */}
        <meshNormalMaterial flatShading transparent={true} />
      </mesh>

      <mesh ref={plane} position-y={1}>
        <planeBufferGeometry args={[1, 1]} />
        <meshNormalMaterial side={T.DoubleSide} />
      </mesh>

      <mesh ref={torus} position-x={1.5} position-y={1}>
        <torusBufferGeometry args={[0.3, 0.2, 16, 32]} />
        <meshNormalMaterial side={T.DoubleSide} />
      </mesh>

      <mesh ref={sphere} position-x={-1.5} position-y={-1}>
        <sphereBufferGeometry args={[0.5, 16, 16]} />
        {/* matcap are ilusion of light */}
        <meshMatcapMaterial matcap={cap} />
      </mesh>

      <mesh ref={plane} position-y={-1}>
        <planeBufferGeometry args={[1, 1]} />
        <meshMatcapMaterial matcap={cap} side={T.DoubleSide} />
      </mesh>

      <mesh ref={torus} position-x={1.5} position-y={-1}>
        <torusBufferGeometry args={[0.3, 0.2, 16, 32]} />
        <meshMatcapMaterial matcap={cap} />
      </mesh>

      <mesh ref={sphere} position-x={-1.5} position-y={-2}>
        <sphereBufferGeometry args={[0.5, 16, 16]} />
        {/* if it is close to NEAR it lights */}
        <meshDepthMaterial />
      </mesh>

      <mesh ref={plane} position-y={-2}>
        <planeBufferGeometry args={[1, 1]} />
        {/* if it is close to FAr it darks */}
        <meshDepthMaterial side={T.DoubleSide} />
      </mesh>

      <mesh ref={torus} position-x={1.5} position-y={-2}>
        <torusBufferGeometry args={[0.3, 0.2, 16, 32]} />
        <meshDepthMaterial />
      </mesh>

      <mesh ref={sphere} position-x={-1.5} position-y={2}>
        <sphereBufferGeometry args={[0.5, 16, 16]} />
        {/* lamber reaact to light */}
        <meshLambertMaterial />
      </mesh>

      <mesh ref={plane} position-y={2}>
        <planeBufferGeometry args={[1, 1]} />
        <meshLambertMaterial side={T.DoubleSide} />
      </mesh>

      <mesh ref={torus} position-x={1.5} position-y={2}>
        <torusBufferGeometry args={[0.3, 0.2, 16, 32]} />
        <meshLambertMaterial />
      </mesh>

      <mesh ref={sphere} position-x={-1.5} position-y={3}>
        <sphereBufferGeometry args={[0.5, 16, 16]} />
        {/* lamber reaact to light */}
        <meshPhongMaterial shininess={100} />
      </mesh>

      <mesh ref={plane} position-y={3}>
        <planeBufferGeometry args={[1, 1]} />
        <meshPhongMaterial side={T.DoubleSide} />
      </mesh>

      <mesh ref={torusPhong} position-x={1.5} position-y={3}>
        <torusBufferGeometry args={[0.3, 0.2, 16, 32]} />
        {/* todo: why specular is not working? */}
        <meshPhongMaterial shininess={100} specular={new T.Color(0xff0000)} />
      </mesh>

      <mesh ref={sphere} position-x={-1.5} position-y={4}>
        <sphereBufferGeometry args={[0.5, 16, 16]} />
        {/* lamber reaact to light */}
        <meshToonMaterial gradientMap={grad} />
      </mesh>

      <mesh ref={plane} position-y={4}>
        <planeBufferGeometry args={[1, 1]} />
        <meshToonMaterial gradientMap={grad} side={T.DoubleSide} />
      </mesh>

      <mesh ref={torus} position-x={1.5} position-y={4}>
        <torusBufferGeometry args={[0.3, 0.2, 16, 32]} />
        {/* todo: why specular is not working? */}
        <meshToonMaterial attach={'material'} gradientMap={grad} />
      </mesh>

      <mesh ref={sphere} position-x={-1.5} position-y={5}>
        <sphereBufferGeometry args={[0.5, 16, 16]} />
        {/* it uses PBR principles algos */}
        <meshStandardMaterial metalness={metalness} roughness={roughness} />
      </mesh>

      <mesh ref={plane} position-y={5}>
        <planeBufferGeometry args={[1, 1]} />
        <meshStandardMaterial
          map={t1}
          metalness={metalness}
          roughness={roughness}
          side={T.DoubleSide}
        />
      </mesh>

      <mesh ref={torus} position-x={1.5} position-y={5}>
        <torusBufferGeometry args={[0.3, 0.2, 16, 32]} />
        {/* todo: why specular is not working? */}
        <meshStandardMaterial
          attach={'material'}
          metalness={metalness}
          roughness={roughness}
        />
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
