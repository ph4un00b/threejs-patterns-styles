import * as T from 'three';
import * as React from 'react';
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import {
  OrbitControls,
  PerspectiveCamera,
  OrthographicCamera,
  Center,
  Text3D,
  useHelper,
  PointMaterial,
} from '@react-three/drei/core';
import { proxy, useSnapshot } from 'valtio';
import { useControls } from 'leva';
import nice_colors from '../utils/colors';

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
  const { fondo, material, ambientIntensity, ambient } = useControls({
    ambientIntensity: { value: 0.3, min: 0, max: 1, step: 0.001 },
    ambient: { value: '#ffffff' },
    fondo: { value: global.fog },
    material: { value: global.mat },
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
            backgroundColor: fondo,
          }}
        >
          {/* <React.Suspense> */}
          <PerspectiveCamera
            ref={cam_}
            position={[0, 0, 10]}
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

          <Particles color={'green'} />
          <MyParticles color={material} />
          {/* <Cubo /> */}

          <axesHelper args={[4]} />
          <ambientLight color={ambient} intensity={ambientIntensity} />
          <DirectionalLight color={ambient} />
          {/* </React.Suspense> */}
        </Canvas>
      </section>
    </>
  );
}

function MyParticles({ quantity = 20_000, color = 'red' }) {
  const [colorArray] = React.useState(() => {
    const c = new T.Color();
    const colors = Array.from(
      { length: quantity },
      () =>
        nice_colors[Math.floor(Math.random() * 900)][
          Math.floor(Math.random() * 5)
        ]
    );

    return Float32Array.from(
      Array.from({ length: quantity }, (_, i) =>
        c.set(colors[i]).convertSRGBToLinear().toArray()
      ).flat()
    );
  });

  const { pointsSize, pointsAtenuation } = useControls({
    pointsSize: { value: 0.1, min: 0, max: 1, step: 0.01 },
    pointsAtenuation: { value: true },
  });

  const p = useLoader(T.TextureLoader, [
    `${baseUrl}/particles/1.png`,
    `${baseUrl}/particles/2.png`,
    `${baseUrl}/particles/3.png`,
    `${baseUrl}/particles/4.png`,
    `${baseUrl}/particles/5.png`,
    `${baseUrl}/particles/6.png`,
    `${baseUrl}/particles/7.png`,
    `${baseUrl}/particles/8.png`,
    `${baseUrl}/particles/9.png`,
    `${baseUrl}/particles/10.png`,
    `${baseUrl}/particles/11.png`,
    `${baseUrl}/particles/12.png`,
    `${baseUrl}/particles/13.png`,
  ]);

  const arrays = React.useMemo(() => {
    const positions = new Float32Array(quantity * 3);
    for (let i = 0; i < quantity * 3; i++) {
      positions[i] = (Math.random() - 0.5) * 9;
    }
    return [positions] as const;
  }, [quantity]);

  const mat = React.useMemo(
    () =>
      new T.PointsMaterial({
        // color: color,
        size: pointsSize,
        sizeAttenuation: pointsAtenuation,
        transparent: true,
        alphaMap: p[Math.floor(Math.random() * 12)],
        /** testing ways of eliminate border
         * we can mix and match
         */
        // alphaTest: 0.001,
        // depthTest: false,
        depthWrite: false,
        //
        /** watch out for perf! */
        blending: T.AdditiveBlending,
        vertexColors: true,
      }),
    [pointsSize, pointsAtenuation, color]
  );

  const particles = React.useRef<T.Light>(null!);
  const geo = React.useRef<T.BufferGeometry>(null!);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    // particles.current.rotation.y = t * 0.2;
    // particles.current.position.y = -t * 0.02;
    performane_killer: {
      for (let i = 0; i < quantity; i++) {
        const ixyz = 3 * i;
        const x = geo.current.attributes.position.array[ixyz];
        geo.current.attributes.position.array[ixyz + 1] = Math.sin(t + x);
      }
    }
    geo.current.attributes.position.needsUpdate = true;
  });

  return (
    <points
      // ref={particles}
      // castShadow={true}
      material={mat}
    >
      <bufferGeometry ref={geo}>
        <bufferAttribute
          attach="attributes-position"
          array={arrays[0]}
          count={arrays[0].length / 3}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          array={colorArray}
          count={colorArray.length / 3}
          itemSize={3}
        />
      </bufferGeometry>
      {/* from drei */}
      {/* <PointMaterial
        // transparent
        // vertexColors
        size={pointsSize}
        sizeAttenuation={pointsAtenuation}
        // depthWrite={false}
      /> */}

      {/* atenuation is not working on toggle controls */}
      {/* <pointsMaterial size={pointsSize} sizeAttenuation={pointsAtenuation} /> */}
    </points>
  );
}

function Particles({ color = 'red' }) {
  return (
    <points>
      <sphereBufferGeometry args={[1, 32, 32]} />
      {/* from drei */}
      <PointMaterial
        color={color}
        // transparent
        // vertexColors
        size={1}
        sizeAttenuation={false}
        // depthWrite={false}
      />
      {/* <pointsMaterial size={pointsSize} sizeAttenuation={pointsAtenuation} /> */}
    </points>
  );
}
/** suports shadows! */
function DirectionalLight({ color }: { color: string }) {
  const light = React.useRef<T.DirectionalLight>(null!);
  const camera = React.useRef<T.OrthographicCamera>(null!);
  useHelper(light, T.DirectionalLightHelper, 0.5);
  useHelper(camera, T.CameraHelper);

  React.useLayoutEffect(() => {
    camera.current = light.current.shadow.camera;
    // light.current.shadow.radius = 10;
    // alert(JSON.stringify(light.current.shadow.mapSize, null, 2));
  }, []);

  useFrame(() => {
    camera.current.updateProjectionMatrix();
  });

  return (
    <directionalLight
      ref={light}
      castShadow={true}
      // power of 2 due to bitmapping
      shadow-mapSize-width={256}
      shadow-mapSize-height={256}
      shadow-camera-near={1}
      shadow-camera-far={15}
      // shadow-camera-top={top}
      // shadow-camera-bottom={bottom}
      // shadow-camera-left={left}
      // shadow-camera-right={right}
      /** @link https://github.com/pmndrs/react-three-fiber/blob/master/packages/fiber/tests/core/renderer.test.tsx#L571
       *
       * types:
       *
       * T.BasicShadowMap
       * T.PCFShadowMap
       * T.VSMShadowMap
       *
       * 3RF set PCFSoftShadowMap as the default shadow map
       */
      shadow-radius={10}
      // position={[directional.x, directional.y, directional.z]}
      position={[0, 15, -20]}
      args={[color, 0.5 /** intensity */]}
    />
  );
}

function Cubo({ color = 'white' }: { color?: string }) {
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
