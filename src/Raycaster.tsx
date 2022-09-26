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
import { mergeRefs } from '../utils/merge_refs';
import { useEventListener } from '../utils/useListener';

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
  const cam_ = React.useRef(null!);

  const { fondo, ambientIntensity, ambient } = useControls({
    ambientIntensity: { value: 0.3, min: 0, max: 1, step: 0.001 },
    ambient: { value: '#ffffff' },
    fondo: { value: global.fog },
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

          {/* <PerspectiveCamera
            ref={cam_}
            position={[0, 0, 10]}
            fov={75}
            // auto updates the viewport
            manual={false}
            makeDefault={!true}
          /> */}

          {/* <OrbitControls enableDamping={true} makeDefault={true} /> */}

          <group position={[0, 4, 0]}>
            <Center>
              <Text3D castShadow={true} font={global.font1}>
                phau!
                <meshStandardMaterial metalness={0} roughness={0} />
              </Text3D>
            </Center>
          </group>

          <TestObjects position-y={1.9} />
          <TestObjectsMouse position-y={-1} />

          <axesHelper args={[4]} />
          <ambientLight color={ambient} intensity={ambientIntensity} />
          <DirectionalLight color={ambient} />
          {/* </React.Suspense> */}
        </Canvas>
      </section>
    </>
  );
}

var mouse = new T.Vector2();
var raycasterMouse = new T.Raycaster();
var currentOnHover = null;

function TestObjectsMouse(props) {
  const { scene } = useThree();
  const object1 = React.useRef<T.Mesh>(null!);
  const object2 = React.useRef<T.Mesh>(null!);

  useEventListener('mousemove', (event: React.MouseEvent) => {
    mouse.x = /** normalized [-1,1] */ (event.clientX / CanvasProxy.w) * 2 - 1;
    // todo: ray xy seems a bit out of bounds
    // maybe try aspect from viewport
    mouse.y = /** normalized [-1,1] */ -(event.clientY / CanvasProxy.h) * 2 + 1;
  });

  const { camera } = useThree();
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const tests = [object1.current, object2.current];

    tests.forEach((ref, i) => {
      ref.position.y = 1.5 * Math.sin(t * (i + 0.5));
    });

    raycasterMouse.setFromCamera(mouse, camera);

    /** casting ray */
    const intersects = raycasterMouse.intersectObjects(tests);

    for (let obj of tests) {
      obj.material.color.set('royalblue');
    }

    for (let obj of intersects) {
      obj.object.material.color.set('yellow');
    }

    /** nothing on hover */
    if (intersects.length == 0) {
      if (currentOnHover) {
        console.log('on leave');
      }
      currentOnHover = null;
    } else {
      if (!currentOnHover) {
        console.log('on enter');
      }
      [currentOnHover] = intersects;
    }
  });

  return (
    <group {...props}>
      <mesh ref={object1} position-x={-2}>
        <sphereBufferGeometry args={[0.5, 16, 16]} />
        <meshBasicMaterial color={'red'} />
      </mesh>

      <Cubo />

      <mesh ref={object2} position-x={2}>
        <sphereBufferGeometry args={[0.5, 16, 16]} />
        <meshBasicMaterial color={'red'} />
      </mesh>
    </group>
  );
}

function TestObjects(props) {
  const { scene } = useThree();
  const object1 = React.useRef<T.Mesh>(null!);
  const object2 = React.useRef<T.Mesh>(null!);

  React.useLayoutEffect(() => {
    rayDirection.normalize();
    raycaster.set(rayOrigin, rayDirection);

    /** casting ray */
    const intersect = raycaster.intersectObject(object1.current);
    const intersects = raycaster.intersectObjects([
      object1.current,
      object2.current,
    ]);
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const tests = [object1.current, object2.current];

    tests.forEach((ref, i) => {
      ref.position.y = 1.5 * Math.sin(t * (i + 0.5));
    });

    /** casting ray */
    const intersects = raycaster.intersectObjects(tests);

    for (let obj of tests) {
      obj.material.color.set('red');
    }

    for (let obj of intersects) {
      obj.object.material.color.set('green');
    }
  });

  return (
    <group {...props}>
      <mesh ref={object1} position-x={-2}>
        <sphereBufferGeometry args={[0.5, 16, 16]} />
        <meshBasicMaterial color={'red'} />
      </mesh>

      <Cubo />

      <mesh ref={object2} position-x={2}>
        <sphereBufferGeometry args={[0.5, 16, 16]} />
        <meshBasicMaterial color={'red'} />
      </mesh>
    </group>
  );
}

var raycaster = new T.Raycaster();
var rayOrigin = new T.Vector3(-3, 0, 0);
var rayDirection = new T.Vector3(10, 0, 0);

function Cubo({ color = '#e83abf' }: { color?: string }) {
  const [active, setActive] = React.useState(0);
  const { wireframe } = useControls({
    wireframe: false,
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
