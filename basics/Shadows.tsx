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

/** @link https://threejs.org/examples/?q=shadow#webgl_shadowmap_viewer */
export default function () {
  const { cw, ch } = useCanvas();
  const camera = React.useRef(null!);
  const cubo = React.useRef<T.Mesh>(null!);

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
    shadows,
  } = useControls({
    shadows: {
      value: true,
    },
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
      value: 0.4,
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
      value: 6,
      max: 10,
      min: 0,
      step: 1,
    },
    decayDistance: {
      value: 1,
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
    `${baseUrl}/matcaps/6.png`,
    `${baseUrl}/matcaps/7.png`,
    `${baseUrl}/matcaps/8.png`,
  ]);

  const textures = useLoader(T.TextureLoader, [
    `${baseUrl}/textures/bakedShadow.jpg`,
    `${baseUrl}/textures/simpleShadow.jpg`,
  ]);

  var geo = React.useMemo(
    () => new T.TorusBufferGeometry(0.3, 0.2, 20, 45),
    []
  );
  var mat = React.useMemo(() => new T.MeshStandardMaterial(), []);

  return (
    <>
      <section>
        <Canvas
          // control shadow does not work!
          shadows={false} /** enable shadowMap */
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
              <Text3D castShadow={true} font={global.font1}>
                phau!
                <meshStandardMaterial
                  metalness={metalness}
                  roughness={roughness}
                />
              </Text3D>
            </Center>
          </group>

          {Array.from({ length: 10 }).map((_, i) => {
            return (
              <React.Fragment key={i}>
                <mesh
                  castShadow={true}
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

          <mesh castShadow={true} position-x={-2} position-y={0}>
            <sphereBufferGeometry args={[0.5, 16, 16]} />
            {/* it uses PBR principles algos */}
            <meshStandardMaterial metalness={metalness} roughness={roughness} />
          </mesh>

          <Cubo ref={cubo} metalness={metalness} roughness={roughness} />

          <Floor
            cubo={cubo}
            textures={textures}
            metalness={metalness}
            roughness={roughness}
          />

          <mesh castShadow={true} position-x={2} position-y={0}>
            <torusBufferGeometry args={[0.3, 0.2, 16, 32]} />
            {/* todo: why specular is not working? */}
            <meshStandardMaterial
              attach={'material'}
              metalness={metalness}
              roughness={roughness}
            />
          </mesh>

          <mesh position-y={0}>
            <boxBufferGeometry args={[1, 1]} />
            <meshStandardMaterial
              metalness={0.0}
              roughness={0.0}
              side={T.DoubleSide}
            />
          </mesh>

          {/* <DirectionalLight /> */}

          {/* <SpotLight
            ambient={ambient}
            intensity={intensity}
            fadeDistance={fadeDistance}
          /> */}

          <PointLight
            ambient={ambient}
            intensity={intensity}
            fadeDistance={fadeDistance}
            decayDistance={decayDistance}
          />
          <axesHelper args={[4]} />
          <ambientLight args={[0xffffff, 0.2]} />
          <PerspectiveCamera
            ref={camera}
            position={[0, 7, 2]}
            fov={75}
            // auto updates the viewport
            manual={false}
            makeDefault={true}
          />
        </Canvas>
        <Leva />
      </section>
    </>
  );
}

var Cubo = React.forwardRef(function Cubo({ metalness, roughness }, ref) {
  const delta = 1.5;
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    ref.current.position.x = Math.cos(t) * delta;
    ref.current.position.z = Math.sin(t) * delta;
    ref.current.position.y = Math.abs(Math.sin(t * delta * 2));
  });

  return (
    <mesh ref={ref} castShadow={true} position-y={0}>
      <boxBufferGeometry args={[1, 1]} />
      <meshStandardMaterial
        metalness={metalness}
        roughness={roughness}
        side={T.DoubleSide}
      />
    </mesh>
  );
});

/** suports shadows! */
function DirectionalLight() {
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
      shadow-mapSize-width={1024}
      shadow-mapSize-height={1024}
      shadow-camera-near={near}
      shadow-camera-far={far}
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
      position={[2, 2, -1]}
      args={[0xffffff, 0.5 /** intensity */]}
    />
  );
}

/** suports shadows! */
function SpotLight({ ambient, intensity, fadeDistance }) {
  const light = React.useRef(null!);
  const camera = React.useRef(null!);
  useHelper(light, T.SpotLightHelper, 'pink');
  useHelper(camera, T.CameraHelper);

  React.useLayoutEffect(() => {
    camera.current = light.current.shadow.camera;

    // alert(JSON.stringify(light.current.shadow.mapSize, null, 2));
  }, []);

  const { far, near, top, bottom, left, right } = useControls({
    far: {
      value: 1,
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

  useFrame(() => {
    camera.current.updateProjectionMatrix();
  });

  return (
    <>
      <spotLight
        castShadow={true}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-fov={30}
        shadow-camera-near={near}
        // todo: far is not working!
        shadow-camera-far={1}
        ref={light}
        // spotlight.target needs to be added to scene
        position={[-5, 3.5, 1]}
        args={[
          ambient,
          0.4 /** intensity */,
          10,
          Math.PI * 0.2 /**angle */,
          0.25 /** penumbra */,
          1 /**decay */,
        ]}
      />
    </>
  );
}

/** suports shadows! */
function PointLight({ ambient, intensity, fadeDistance, decayDistance }) {
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
        castShadow={true}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={1}
        // todo: far is not working!
        shadow-camera-far={0.2}
        ref={light}
        position={[2, 2, 1]}
        args={[
          ambient,
          intensity /** intensity */,
          fadeDistance,
          decayDistance,
        ]}
      />
    </>
  );
}

function Floor({ cubo, textures, metalness, roughness }) {
  const floor = React.useRef<T.Mesh>(null!);
  const shadow = React.useRef<T.Mesh>(null!);

  React.useLayoutEffect(() => {
    /** avoid overlapping (glicht effect) with delta */
    shadow.current.position.y = floor.current.position.y + 0.01;
  }, []);

  useFrame(() => {
    dynamic_baked_shadow: {
      shadow.current.position.x = cubo.current.position.x;
      shadow.current.position.z = cubo.current.position.z;
      shadow.current.material.opacity = (1 - cubo.current.position.y) * 0.3;
    }
  });

  return (
    <>
      <mesh
        ref={floor}
        rotation-x={Math.PI * 0.5}
        receiveShadow={false}
        position-y={-1}
      >
        <planeBufferGeometry args={[20, 20]} />
        <meshStandardMaterial
          metalness={metalness}
          roughness={roughness}
          side={T.DoubleSide}
        />
        {/* baked shadow! */}
        {/* <meshBasicMaterial side={T.DoubleSide} map={textures[0]} /> */}
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
