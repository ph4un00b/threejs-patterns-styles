import * as T from 'three';
import * as React from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  OrbitControls,
  PerspectiveCamera,
  OrthographicCamera,
  Center,
  Text3D,
  useHelper,
} from '@react-three/drei/core';
import { proxy, useSnapshot } from 'valtio';
import { useControls } from 'leva';
import { useSpring, animated, config, a } from '@react-spring/three';
import { useDrag } from '@use-gesture/react';

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

/** FREE! @link https://kenney.nl/assets */
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

          <Cubo color={material} />
          <MyGalaxy />

          <axesHelper args={[4]} />
          <ambientLight color={ambient} intensity={ambientIntensity} />
          <DirectionalLight color={ambient} />
          {/* </React.Suspense> */}
        </Canvas>
      </section>
    </>
  );
}

function Cubo({ color }: { color: string }) {
  const [active, setActive] = React.useState(0);
  const { position, wireframe } = useControls({
    wireframe: false,
    position: { min: -3, max: 3, value: { x: 0, y: 0, z: 0 }, step: 0.1 },
  });
  const cubo = React.useRef<T.Mesh>(null);
  const { pos } = useSpring({
    to: {
      pos: 0,
    },
    from: { pos: -20 },
    config: config.gentle,
  });
  const { scale } = useSpring({ scale: active ? 4 : 1 });
  const { rotation } = useSpring({ rotation: active ? Math.PI : 0 });
  const { colorA } = useSpring({ colorA: active ? 'royalblue' : color });
  /** interpolate values from common spring */
  // const { spring } = useSpring({
  //   spring: active,
  //   config: config.molasses,
  // });
  // const { pos } = useSpring({ pos: active ? -2 : 0 });
  // const scale = spring.to([0, 1], [1, 4]);
  // const rotation = spring.to([0, 1], [0, Math.PI]);
  // const colorA = spring.to([0, 1], ['#6246ea', 'royalblue']);

  const { viewport } = useThree();
  const [{ x, y }, api] = useSpring(() => ({ x: 0, y: 0 }));

  const handlers = useDrag(function ({ event, offset: [x, y] }) {
    event.stopPropagation();
    const aspect = viewport.getCurrentViewport().factor;
    console.log(x, y);
    return api.start({ x: x / aspect, y: -y / aspect });
  });

  return (
    <a.mesh
      {...handlers()}
      onClick={(e) => {
        e.stopPropagation();
        setActive(Number(!active));
      }}
      rotation-x={rotation}
      scale={scale}
      position-x={x}
      position-y={y}
      position-z={pos}
    >
      <boxGeometry />
      <a.meshStandardMaterial color={colorA} wireframe={wireframe} />
    </a.mesh>
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

function MyGalaxy() {
  const { pointsSize, pointsAtenuation, offset, mul, particles } = useControls({
    pointsSize: { value: 0.1, min: 0, max: 1, step: 0.01 },
    offset: { value: 0.5, min: 0, max: 1, step: 0.01 },
    mul: { value: 3, min: 1, max: 20, step: 1 },
    particles: { value: 1_000, min: 100, max: 100_000, step: 1_000 },
    pointsAtenuation: { value: true },
  });

  const arrays = React.useMemo(() => {
    const positions = new Float32Array(particles * 3);
    for (let i = 0; i < particles * 3; i++) {
      const [x, y, z] = [i, i + 1, i + 2];
      positions[x] = Math.sin(Math.random() - offset) * mul;
      positions[y] = Math.cos(Math.random() - offset) * mul;
      positions[z] = Math.sin(Math.random() - offset) * mul;
    }
    return [positions] as const;
  }, [particles, offset, mul]);

  const mat = React.useMemo(
    () =>
      new T.PointsMaterial({
        // color: color,
        size: pointsSize,
        sizeAttenuation: pointsAtenuation,
        // transparent: true,
        // alphaMap: p[Math.floor(Math.random() * 12)],
        // /** testing ways of eliminate border
        //  * we can mix and match
        //  */
        // // alphaTest: 0.001,
        // // depthTest: false,
        // depthWrite: false,
        // //
        // /** watch out for perf! */
        // blending: T.AdditiveBlending,
        // vertexColors: true,
      }),
    [pointsSize, pointsAtenuation /** color */]
  );

  const geo = React.useRef<T.BufferGeometry>(null!);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
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
        {/* <bufferAttribute
          attach="attributes-color"
          array={colorArray}
          count={colorArray.length / 3}
          itemSize={3}
        /> */}
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
