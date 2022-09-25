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

          {/* <OrbitControls enableDamping={true} makeDefault={true} /> */}

          <group position={[0, 4, 0]}>
            <Center>
              <Text3D castShadow={true} font={global.font1}>
                phau!
                <meshStandardMaterial metalness={0} roughness={0} />
              </Text3D>
            </Center>
          </group>

          <Cubo color={material} />
          <Cube color={'yellow'} />

          <axesHelper args={[4]} />
          <ambientLight color={ambient} intensity={ambientIntensity} />
          <DirectionalLight color={ambient} />
          {/* </React.Suspense> */}
        </Canvas>
      </section>
    </>
  );
}

function Cube({ color }: { color: string }) {
  const [active, setActive] = React.useState(0);
  const { scale } = useSpring({ scale: active ? 4 : 1 });
  // const { rotation } = useSpring({ rotation: active ? Math.PI : 0 });
  const { colorA } = useSpring({ colorA: active ? 'royalblue' : color });
  const { viewport } = useThree();
  const { width, height, factor } = viewport;
  const [{ x, y }, api] = useSpring(() => ({ x: 0, y: -4 }));

  // useScroll(({ xy: [, y] }) => api.start({ width: (y / height) * 100 + '%' }), {
  //   target: window,
  // });
  const dragHandlers = useDrag(
    function ({
      active: isGestureActive,
      movement: [mx, my],
      cancel: cancelDrag,
      event,
      offset: [xOffset, yOffset],
    }) {
      event.stopPropagation();
      /** only drag and pinch gestures are cancellable  */
      if (mx > 4) cancelDrag();
      const props = {
        x: isGestureActive ? mx : 0,
        y: yOffset,
        immediate: isGestureActive,
      };
      api.start(props);
    },
    {
      // threshold: 10,
      preventScroll: false, //default
      preventScrollAxis: 'y', //default
      preventDefault: false,
      filterTaps: true,
      keys: true, // default
      modifierKey: 'ctrlKey' /** 'ctrlKey' | 'altKey' | 'metaKey' | null */,
      enabled: true, // default
      axis: 'lock', // just move on a single axis detected
      // delay: 1000
      // filterTaps: true,
      /**
       * in some situations you may want
       * the drag to persist while scrolling
       * then use touch events.
       */
      // pointer: { touch: false }
      // pointer: { buttons: [1, 2, 4] },
      // pointer: { capture: true }
      /**
       * in a way that capture works on mobile,
       * you'd probably have to use
       * document.elementFromPoint.
       * @link https://developer.mozilla.org/en-US/docs/Web/API/Document/elementFromPoint
       */
      lock: false,
      bounds: {
        /**
         * Since v10 and for the drag gesture only,
         * bounds can be a React ref or an HTMLElement
         * */
        left: -4,
        right: 4,
        top: -4,
        bottom: 4,
      },
      rubberband: true, // adds friction on bounds
      transform: ([x, y]) => {
        /** bounds, mx, my, offset.... */
        return [x / factor, -y / factor];
      },
      from: () => [x.get(), y.get()],
    }
  );

  return (
    <a.mesh
      {...dragHandlers()}
      onClick={(e) => {
        e.stopPropagation();
        setActive(Number(!active));
      }}
      // rotation-x={rotation}
      scale={scale}
      position-x={x}
      position-y={y}
      // position-z={pos}
    >
      <boxGeometry />
      <a.meshStandardMaterial color={colorA} wireframe={!true} />
    </a.mesh>
  );
}

function Cubo({ color }: { color: string }) {
  const [active, setActive] = React.useState(0);
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

  const dragHandlers = useDrag(function ({ event, offset: [x, y] }) {
    event.stopPropagation();
    const aspect = viewport.getCurrentViewport().factor;
    return api.start({ x: x / aspect, y: -y / aspect });
  });

  return (
    <a.mesh
      {...dragHandlers()}
      // onClick={(e) => {
      //   e.stopPropagation();
      //   setActive(Number(!active));
      // }}
      // rotation-x={rotation}
      // scale={scale}
      position-x={x}
      position-y={y}
      position-z={pos}
    >
      <planeBufferGeometry args={[4, 4]} />
      <a.meshStandardMaterial color={colorA} wireframe={!true} />
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
