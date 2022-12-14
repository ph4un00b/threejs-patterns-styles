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
import nice_colors from '../utils/colors';
import useCapture from 'use-capture';

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

/** @link https://overreacted.io/making-setinterval-declarative-with-react-hooks/ */
function useTimeout(callback: () => void, delay: number) {
  const savedCallback = React.useRef<() => void>(null!);

  React.useEffect(() => {
    savedCallback.current = callback;
  });

  React.useEffect(() => {
    function tick() {
      savedCallback.current();
    }

    let id = window.setTimeout(tick, delay);
    return () => window.clearTimeout(id);
  }, [delay]);
}

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

  const [bind, startRecording] = useCapture({ duration: 10, fps: 60 });

  // quitar para iniciar grabacion
  // useTimeout(() => {
  //   startRecording();
  // }, 5000);

  return (
    <>
      <section>
        <Canvas
          // ???? preserveDrawingBuffer is mandatory
          gl={{
            preserveDrawingBuffer: true,
          }}
          onCreated={bind}
          shadows={true} /** enable shadowMap */
          dpr={[dpr.min, dpr.max]}
          style={{
            width: cw + 'px',
            height: ch + 'px',
            backgroundColor: fondo,
          }}
        >
          {/* ???? not having a clear color would glitch the recording */}
          <color attach="background" args={['#000']} />
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

function useNiceColors({
  quantity,
  preset = Math.floor(Math.random() * 900),
}: {
  quantity: number;
  preset?: number;
}) {
  return React.useState(() => {
    const c = new T.Color();

    const colors = Array.from(
      { length: quantity },
      () => nice_colors[preset][Math.floor(Math.random() * 4)]
    );

    const colorsRGB = Float32Array.from(
      Array.from({ length: quantity }, (_, i) =>
        c.set(colors[i]).convertSRGBToLinear().toArray()
      ).flat()
    );

    return [colorsRGB, colors] as const;
  });
}

function MyGalaxy() {
  const geo = React.useRef<T.BufferGeometry>(null!);
  const points = React.useRef<T.Points>(null!);

  const {
    pointsSize,
    pointsAtenuation,
    offset,
    mul,
    particles,
    radius,
    ramas,
    curva,
    noise,
    noiseCurva,
  } = useControls({
    pointsSize: { value: 0.01, min: 0, max: 1, step: 0.01 },
    offset: { value: 0.5, min: 0, max: 1, step: 0.01 },
    mul: { value: 9, min: 1, max: 20, step: 1 },
    ramas: { value: 3, min: 2, max: 20, step: 1 },
    curva: { value: 1, min: -5, max: 5, step: 0.001 },
    radius: { value: 5, min: 0.01, max: 20, step: 0.01 },
    noise: { value: 0.2, min: 0, max: 2, step: 0.001 },
    noiseCurva: { value: 3, min: 1, max: 10, strep: 0.001 },
    particles: { value: 100_000, min: 100, max: 100_000, step: 1_000 },
    pointsAtenuation: { value: true },
  });

  const mat = React.useMemo(
    () =>
      new T.PointsMaterial({
        // color: '#ff5588',
        depthWrite: false,
        vertexColors: true,
        blending: T.AdditiveBlending,
        size: pointsSize,
        sizeAttenuation: pointsAtenuation,
      }),
    [pointsSize, pointsAtenuation /** color */]
  );

  const { scene } = useThree();
  React.useLayoutEffect(() => {
    if (points.current) {
      geo.current.dispose();
      mat.dispose();
      // scene.remove(points.current);
    }
  }, [particles, offset, mul, radius, ramas, curva, noise, noiseCurva]);

  const [[, niceColors]] = useNiceColors({ quantity: 2 });
  // console.log({ colors });

  const arrays = React.useMemo(() => {
    const positions = new Float32Array(particles * 3);
    const colors = new Float32Array(particles * 3);
    const colorIn = new T.Color(niceColors[0]);
    const colorOut = new T.Color(niceColors[1]);

    for (let i = 0; i < particles * 3; i++) {
      const xyz = i * 3;
      const [x, y, z] = [xyz, xyz + 1, xyz + 2];
      const random_radius = Math.random() * radius;
      const random_noise = Math.random() * noise;
      const ramaAngle = ((i % ramas) / ramas) * Math.PI * 2;
      const curveAngle = random_radius * curva;
      const angle = ramaAngle + curveAngle;

      const [rx, ry, rz] = [
        Math.pow(Math.random(), noiseCurva) * (Math.random() < 0.5 ? 1 : -1),
        Math.pow(Math.random(), noiseCurva) * (Math.random() < 0.5 ? 1 : -1),
        Math.pow(Math.random(), noiseCurva) * (Math.random() < 0.5 ? 1 : -1),
      ];

      positions[x] = Math.cos(angle) * random_radius + rx;
      positions[y] = ry;
      positions[z] = Math.sin(angle) * random_radius + rz;

      fusion_colors: {
        const mixedColor = colorIn.clone();
        mixedColor.lerp(colorOut, random_radius / radius);
        colors[x] = mixedColor.r;
        colors[y] = mixedColor.g;
        colors[z] = mixedColor.b;
      }
    }
    return [positions, colors] as const;
  }, [particles, offset, mul, radius, ramas, curva, noise, noiseCurva]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    geo.current.attributes.position.needsUpdate = true;
    points.current.rotation.y = t * 0.2;
  });

  return (
    <points
      rotation={[Math.PI / 2, 0, 0]}
      // position={[0, 0, 0]}
      ref={points}
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
          array={arrays[1]}
          count={arrays[1].length / 3}
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
