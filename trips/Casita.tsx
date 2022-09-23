import * as T from 'three';
import * as React from 'react';
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import {
  OrbitControls,
  PerspectiveCamera,
  OrthographicCamera,
  Text3D,
  Center,
  useHelper,
  // useHelper,
} from '@react-three/drei/core';
import { proxy, useSnapshot } from 'valtio';
import { Leva, useControls } from 'leva';
import { RectAreaLightHelper, RectAreaLightUniformsLib } from 'three-stdlib';
import { mergeRefs } from '../utils/merge_refs';

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

/** @link https://threejs.org/examples/?q=shadow#webgl_shadowmap_viewer */
export default function () {
  const { cw, ch } = useCanvas();
  const camera = React.useRef(null!);
  const cubo = React.useRef<T.Mesh>(null!);

  const matcaps = useLoader(T.TextureLoader, [
    `${baseUrl}/matcaps/1.png`,
    `${baseUrl}/matcaps/2.png`,
    `${baseUrl}/matcaps/3.png`,
    `${baseUrl}/matcaps/4.png`,
    `${baseUrl}/matcaps/5.png`,
    `${baseUrl}/matcaps/6.png`,
    `${baseUrl}/matcaps/7.png`,
    `${baseUrl}/matcaps/8.png`,
  ]);

  const textures = useLoader(T.TextureLoader, [
    `${baseUrl}/textures/bakedShadow.jpg`,
    `${baseUrl}/textures/simpleShadow.jpg`,
  ]);

  const { ambientIntensity, position } = useControls({
    ambientIntensity: { value: 0.3, min: 0, max: 1, step: 0.001 },
    position: { min: -30, max: 30, step: 0.1, value: { x: 0, y: 5, z: 10 } },
  });

  var geo = React.useMemo(() => new T.SphereBufferGeometry(1, 16, 16), []);
  var mat = React.useMemo(
    () => new T.MeshStandardMaterial({ color: 'green' }),
    []
  );
  var geoGrave = React.useMemo(
    () => new T.BoxBufferGeometry(0.6, 0.8, 0.2),
    []
  );
  var matGrave = React.useMemo(
    () => new T.MeshStandardMaterial({ color: 'DimGrey' }),
    []
  );

  return (
    <>
      <section>
        <Canvas
          shadows={true} /** enable shadowMap */
          dpr={[dpr.min, dpr.max]}
          style={{
            width: cw + 'px',
            height: ch + 'px',
            backgroundColor: global.fog,
          }}
        >
          <OrbitControls enableDamping={true} makeDefault={true} />

          {/* <React.Suspense> */}
          <group position={[0, 4, 0]}>
            <Center>
              <Text3D castShadow={true} font={global.font1}>
                phau!
                <meshStandardMaterial metalness={0} roughness={0} />
              </Text3D>
            </Center>
          </group>

          <group>
            <mesh>{/* haus */}</mesh>

            <Walls />

            <mesh rotation-y={Math.PI * 0.25} position-y={2.5 + 0.5}>
              <coneBufferGeometry args={[3.5, 1, 4]} />
              <meshStandardMaterial
                color={'#ac8eaff'}
                metalness={0}
                roughness={0}
              />
            </mesh>

            <Door />

            <mesh
              castShadow={true}
              scale={[0.5, 0.5, 0.5]}
              position={[0.8, 0.2, 2.2]}
              geometry={geo}
              material={mat}
            />
            <mesh
              castShadow={true}
              scale={[0.25, 0.25, 0.25]}
              position={[1.4, 0.1, 2]}
              geometry={geo}
              material={mat}
            />
            <mesh
              castShadow={true}
              scale={[0.4, 0.4, 0.4]}
              position={[-0.8, 0.1, 2.2]}
              geometry={geo}
              material={mat}
            />
            <mesh
              castShadow={true}
              scale={[0.15, 0.15, 0.15]}
              position={[-1, 0.05, 2.6]}
              geometry={geo}
              material={mat}
            />
          </group>

          <group>
            {Array.from({ length: 50 }, () => {
              const angle = Math.random() * Math.PI * 2;
              const radius = /** from [3,9]*/ 3 + Math.random() * 6;
              const positionXZ = [
                Math.sin(angle) * radius,
                Math.cos(angle) * radius,
              ];
              return positionXZ;
            }).map(([x, z]) => {
              return (
                <React.Fragment key={x + z}>
                  <mesh
                    castShadow={true}
                    position={[x, Math.random() * 0.3, z]}
                    rotation-y={(Math.random() - 0.5) * 0.7}
                    rotation-z={(Math.random() - 0.5) * 0.7}
                    geometry={geoGrave}
                    material={matGrave}
                  />
                </React.Fragment>
              );
            })}
          </group>

          <Fog />

          <Floor textures={textures} />

          <Ghosts />

          <PerspectiveCamera
            ref={camera}
            position={[position.x, position.y, position.z]}
            fov={75}
            // auto updates the viewport
            manual={false}
            makeDefault={true}
          />

          <DirectionalLight color={'#b9d5ff'} />
          <PointLight colour={'Coral'} intensity={1} fadeDistance={7} />
          <ambientLight args={['PowderBlue', ambientIntensity]} />

          <axesHelper args={[4]} />
        </Canvas>
      </section>
    </>
  );
}

function useUV2(geometry: React.MutableRefObject<T.BufferGeometry>) {
  React.useLayoutEffect(() => {
    geometry.current.setAttribute(
      'uv2',
      new T.Float32BufferAttribute(geometry.current.attributes.uv.array, 2)
    );
  }, []);
}

function Ghosts() {
  const [g1, g2, g3] = [
    React.useRef(null!),
    React.useRef(null!),
    React.useRef(null!),
  ];

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const angle = t * 0.5;
    g1.current.position.x = Math.cos(angle) * 4;
    g1.current.position.z = Math.sin(angle) * 4;
    g1.current.position.y = Math.sin(t * 3);

    const angle3 = -t * 0.18;
    g3.current.position.x = Math.cos(angle3) * (7 + Math.sin(t * 0.3));
    g3.current.position.z = Math.sin(angle3) * (7 + Math.sin(t * 0.5));
    g3.current.position.y = Math.sin(t * 3);

    const angle2 = -t * 0.32;
    g2.current.position.x = Math.cos(angle2) * 5;
    g2.current.position.z = Math.sin(angle2) * 5;
    g2.current.position.y = Math.sin(t * 3) + Math.sin(t * 2.5);
  });

  return (
    <>
      <PointLight ref={g1} colour={'#ff00ff'} intensity={3} fadeDistance={3} />
      <PointLight ref={g2} colour={'#00ffff'} intensity={3} fadeDistance={3} />
      <PointLight ref={g3} colour={'#ffff00'} intensity={3} fadeDistance={3} />
    </>
  );
}

function Walls() {
  const geo = React.useRef(null!);

  useUV2(geo);

  const bricks = useLoader(T.TextureLoader, [
    `${baseUrl}/bricks/color.jpg`,
    `${baseUrl}/bricks/ambientOcclusion.jpg`,
    `${baseUrl}/bricks/normal.jpg`,
    `${baseUrl}/bricks/roughness.jpg`,
  ]);

  return (
    <mesh castShadow={true} position-y={2.5 / 2}>
      <boxBufferGeometry ref={geo} args={[4, 2.5, 4]} />
      <meshStandardMaterial
        map={bricks[0]}
        aoMap={bricks[1]}
        aoMapIntensity={5}
        roughnessMap={bricks[3]}
      />
    </mesh>
  );
}

function Door() {
  var door = [
    `${baseUrl}/door/color.jpg`,
    `${baseUrl}/door/alpha.jpg`,
    `${baseUrl}/door/ambientOcclusion.jpg`,
    `${baseUrl}/door/height.jpg`,
    `${baseUrl}/door/normal.jpg`,
    `${baseUrl}/door/metalness.jpg`,
    `${baseUrl}/door/roughness.jpg`,
  ];

  const doorT = useLoader(T.TextureLoader, door);
  const geo = React.useRef(null!);

  useUV2(geo);

  return (
    <mesh position-z={2 + 0.01} position-y={1}>
      <planeBufferGeometry ref={geo} args={[2.2, 2.2, 100, 100]} />

      <meshStandardMaterial
        map={doorT[0]}
        //
        transparent={true}
        alphaMap={doorT[1]}
        // ?? todo: working?
        aoMap={doorT[2]}
        // aoMapIntensity={1}
        //
        displacementMap={doorT[3]}
        displacementScale={0.1}
        //
        normalMap={doorT[4]}
        //
        metalnessMap={doorT[5]}
        //
        roughnessMap={doorT[6]}
        // wireframe={!true}
        // metalness={0}
        // roughness={10}
      />
    </mesh>
  );
}

function Fog() {
  useFrame(({ gl }) => {
    gl.setClearColor(global.fog);
  });
  return (
    <>
      <fog attach="fog" args={[global.fog, 1 /**near */, 15 /**far */]} />
    </>
  );
}

function Floor({ textures, metalness = 0, roughness = 0 }) {
  const floor = React.useRef<T.Mesh>(null!);
  const shadow = React.useRef<T.Mesh>(null!);
  const geo = React.useRef(null!);

  const grass = useLoader(T.TextureLoader, [
    `${baseUrl}/grass/color.jpg`,
    `${baseUrl}/grass/ambientOcclusion.jpg`,
    `${baseUrl}/grass/normal.jpg`,
    `${baseUrl}/grass/roughness.jpg`,
  ]);

  React.useLayoutEffect(() => {
    /** avoid overlapping (glicht effect) with delta */
    shadow.current.position.y = floor.current.position.y + 0.01;

    grass.forEach((t) => {
      t.repeat.set(8, 8); /** vector2 */
      t.wrapS = T.RepeatWrapping;
      t.wrapT = T.RepeatWrapping;
    });
  }, []);

  useUV2(geo);

  return (
    <>
      <mesh
        ref={floor}
        rotation-x={-Math.PI * 0.5}
        receiveShadow={true}
        position-y={0}
      >
        <planeBufferGeometry ref={geo} args={[20, 20]} />
        <meshStandardMaterial
          // color={'#a9c388'}
          map={grass[0]}
          aoMap={grass[1]}
          normalMap={grass[2]}
          roughnessMap={grass[3]}
          metalness={metalness}
          roughness={roughness}
          // side={T.DoubleSide}
        />
      </mesh>

      {/* dynamic baked shadow */}
      <mesh ref={shadow} rotation-x={-Math.PI * 0.5}>
        <planeBufferGeometry args={[1.5, 1.5]} />
        <meshBasicMaterial
          transparent={true}
          alphaMap={textures[1]}
          args={[{ color: 0x000000 }]}
        />
      </mesh>
    </>
  );
}

/** suports shadows! */
var PointLight = React.forwardRef(function PointLight(
  {
    colour,
    intensity,
    fadeDistance,
    decayDistance = 0,
  }: {
    colour: string;
    intensity: number;
    fadeDistance: number;
    decayDistance: number;
  },
  ref: React.MutableRefObject<never>
) {
  const light = React.useRef(null!);
  const camera = React.useRef(null!);

  useHelper(light, T.PointLightHelper, 0.2);
  useHelper(camera, T.CameraHelper);

  React.useLayoutEffect(() => {
    camera.current = light.current.shadow.camera;

    // alert(JSON.stringify(light.current.shadow.mapSize, null, 2));
  }, []);

  useFrame(() => {
    camera.current.updateProjectionMatrix();
  });
  return (
    <>
      <pointLight
        ref={mergeRefs([ref, light])}
        intensity={intensity}
        distance={fadeDistance}
        color={colour}
        castShadow={true}
        shadow-mapSize-width={256}
        shadow-mapSize-height={256}
        // shadow-camera-near={1}
        // todo: far is not working!
        shadow-camera-far={7}
        position={[0, 2.2, 2.7]}
      />
    </>
  );
});

/** suports shadows! */
function DirectionalLight({ color }) {
  const light = React.useRef(null!);
  const camera = React.useRef(null!);
  useHelper(light, T.DirectionalLightHelper, 0.5);
  useHelper(camera, T.CameraHelper);

  const { far, near, top, bottom, left, right } = useControls({
    far: {
      value: 11,
      max: 30,
      min: -30,
      step: 1,
    },
    near: {
      value: 1,
      max: 30,
      min: -30,
      step: 1,
    },
    top: {
      value: 2,
      max: 30,
      min: -30,
      step: 1,
    },
    bottom: {
      value: -2,
      max: 30,
      min: -30,
      step: 1,
    },
    right: {
      value: 2,
      max: 30,
      min: -30,
      step: 1,
    },
    left: {
      value: -2,
      max: 30,
      min: -30,
      step: 1,
    },
  });

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
      shadow-camera-top={top}
      shadow-camera-bottom={bottom}
      shadow-camera-left={left}
      shadow-camera-right={right}
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
      position={[4, 5, -21]}
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
