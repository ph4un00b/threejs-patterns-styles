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
import { useSpring, config, a } from '@react-spring/three';
import { useDrag } from '@use-gesture/react';
import {
  Debug,
  Physics,
  PlaneProps,
  SphereProps,
  useContactMaterial,
  usePlane,
  useSphere,
  useBox,
} from '@react-three/cannon';
import nice_colors from '../utils/colors';
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
  const cam_ = React.useRef(null);
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

          <PerspectiveCamera
            ref={cam_}
            position={[-6, 6, 6]}
            fov={75}
            near={0.1}
            far={100}
            // auto updates the viewport
            // manual={false}
            makeDefault={true}
          />

          <OrbitControls enableDamping={true} makeDefault={true} />

          {/* @link https://pmndrs.github.io/cannon-es/docs/ */}
          <Physics
            /** SAPBroadphase : ideal (performance) if your objects are not traveling too fast
             * NaiveBroadphase
             *  */
            broadphase={'SAP'}
            /** does not update quiet objects */
            allowSleep={true}
          >
            <Debug color="black" scale={1.1}>
              <group position={[0, 4, 0]}>
                <Center>
                  <Text3D castShadow={true} font={global.font1}>
                    phau!
                    <meshStandardMaterial metalness={0} roughness={0} />
                  </Text3D>
                </Center>
              </group>

              <Cubo castShadow={true} />
              <World items={4} />
            </Debug>
          </Physics>

          <axesHelper args={[4]} />
          <ambientLight color={ambient} intensity={ambientIntensity} />
          <DirectionalLight
            castShadow={true}
            position={[5, 5, 5]}
            intensity={0.2}
            color={ambient}
          />
          {/* </React.Suspense> */}
        </Canvas>
      </section>
    </>
  );
}

var hitSound = new window.Audio(`${baseUrl}/sounds/hit.mp3`);

function playHit({ contact: { impactVelocity } }) {
  if (impactVelocity < 1.9) return;
  /** todo:
   * - change the  volume in relation to impact
   * - add a little delay since hitting the floor
   * fires multiple events (4?)
   */
  hitSound.volume = Math.random();
  hitSound.currentTime = 0;
  hitSound.play();
}

function World({ items }) {
  const [circulos, setCirculos] = React.useState(items);
  const [preset] = React.useState(Math.floor(Math.random() * 900));

  const bouncyMat = {
    name: 'plastic',
  };

  const groundMat = {
    name: 'concreto',
  };

  useContactMaterial(groundMat, bouncyMat, {
    friction: 0.1,
    restitution: 0.7 /** bouncing! */,
  });

  useControls({
    circulos: {
      value: circulos,
      min: 0,
      max: 100,
      step: 1,
      onEditEnd: (value, path, context) => {
        // alert(path);
        // alert(JSON.stringify(context, null, 2));
        setCirculos((p) => value);
      },
    },
  });

  const colors = React.useMemo(() => {
    const array = new Float32Array(items * 3);
    const color = new T.Color();
    for (let i = 0; i < items; i++) {
      color
        .set(nice_colors[preset][Math.floor(Math.random() * 4)])
        .convertSRGBToLinear()
        .toArray(array, i * 3);
    }
    return array;
  }, [items]);

  return (
    <>
      {/* using position instead of granular ones 'position-x' */}
      <Esfera castShadow={true} material={bouncyMat} position={[-2, 5, 0]} />

      {/* using rotation instead of granular ones 'rotation-x' */}
      <Piso
        receiveShadow={true}
        material={groundMat}
        rotation={[-Math.PI * 0.5, 0, 0]}
      />

      <Spheres
        material={bouncyMat}
        colors={colors}
        number={10}
        size={Math.random()}
      />

      {Array.from({ length: circulos }).map((_, i) => {
        return <Cuadrados key={i} material={bouncyMat} />;
      })}
      {Array.from({ length: circulos }).map((_, i) => {
        return <Cuadrados key={i} material={bouncyMat} />;
      })}
      {Array.from({ length: circulos }).map((_, i) => {
        return <Cuadrados key={i} material={bouncyMat} />;
      })}
    </>
  );
}

type InstancedGeometryProps = {
  colors: Float32Array;
  number: number;
  size: number;
};

const Spheres = ({ colors, number = 3, size = 1 }: InstancedGeometryProps) => {
  const [ref, world] = useSphere(
    () => ({
      args: [size],
      mass: 1,
      position: [
        Math.floor(Math.random() * 8),
        18,
        Math.floor(Math.random() * 8),
      ],
    }),
    React.useRef<T.InstancedMesh>(null!)
  );

  // useFrame(() =>
  //   world
  //     .at(Math.floor(Math.random() * number))
  //     .position.set(0, Math.random() * 2, 0)
  // );
  return (
    <instancedMesh
      receiveShadow
      castShadow
      ref={ref}
      args={[undefined, undefined, number]}
    >
      <sphereBufferGeometry args={[size, 20, 20]}>
        <instancedBufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
      </sphereBufferGeometry>
      <meshLambertMaterial vertexColors />
    </instancedMesh>
  );
};

var mat = new T.MeshStandardMaterial({ metalness: 0.3, roughness: 0.4 });
var geo = new T.BoxGeometry(1);

function Cuadrados({
  w = 1,
  h = 1,
  d = 1,
  position,
  ...props
}: SphereProps & { radius: number; w: number; h: number; d: number }) {
  const [ref, world] = useBox(
    () => ({
      mass: 1,
      /** fix size */
      args: [w, h, d],
      position: [
        1 + Math.floor(Math.random() * 3),
        3,
        Math.floor(Math.random() * 3),
      ],
      onCollide: (e) => {
        playHit(e);
      },
      ...props,
    }),
    React.useRef<T.Mesh>(null!)
  );

  // useEventListener('collide', playHit, ref.current!);

  return (
    <mesh
      scale={Math.random()}
      ref={ref}
      castShadow
      material={mat}
      geometry={geo}
    ></mesh>
  );
}

function Piso({
  receiveShadow,
  ...props
}: PlaneProps & { receiveShadow?: boolean }) {
  // infinite grid floor
  const [piso, api] = usePlane(
    () => ({ mass: 0, ...props }),
    React.useRef<T.Mesh>(null!)
  );

  return (
    <mesh ref={piso} receiveShadow>
      <planeBufferGeometry args={[16, 16]} />
      <meshStandardMaterial
        color={'#777777'}
        roughness={0.4}
        metalness={0.3}
        side={T.DoubleSide}
      />
    </mesh>
  );
}

function Esfera({
  receiveShadow,
  castShadow,
  ...props
}: SphereProps & { receiveShadow?: boolean; castShadow?: boolean }) {
  const [esfera, world] = useSphere(
    () => ({ mass: 1, ...props }),
    React.useRef<T.Mesh>(null!)
  );

  React.useEffect(() => {
    world.applyLocalForce([150, 0, 0], [0, 0, 0]);
  }, []);

  useFrame(({ clock }) => {
    // api.position.set(Math.sin(clock.getElapsedTime()) * 5, 1, 0)
    world.applyForce([-0.05, 0, 0], esfera.current!.position.toArray());
  });

  return (
    // shall we spread the props again?
    <mesh ref={esfera} castShadow>
      <sphereBufferGeometry args={[1, 32, 32]} />
      <meshStandardMaterial roughness={0.4} metalness={0.3} />
    </mesh>
  );
}

function Cubo(props) {
  const [active, setActive] = React.useState(0);
  const { position, wireframe } = useControls({
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
  const { colorA } = useSpring({ colorA: active ? 'royalblue' : '#e83abf' });
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
  const [{ x, y }, api] = useSpring(() => ({ x: 0, y: 1 }));

  const handlers = useDrag(function ({ event, offset: [x, y] }) {
    event.stopPropagation();
    const aspect = viewport.getCurrentViewport().factor;
    console.log(x, y);
    return api.start({ x: x / aspect, y: -y / aspect });
  });

  return (
    <a.mesh
      {...handlers()}
      {...props}
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
function DirectionalLight(props) {
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
      {...props}
      ref={light}
      // power of 2 due to bitmapping
      shadow-mapSize-width={1024}
      shadow-mapSize-height={1024}
      shadow-camera-far={15}
      shadow-camera-near={1}
      shadow-camera-top={7}
      shadow-camera-bottom={-7}
      shadow-camera-left={-7}
      shadow-camera-right={7}
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
      // args={[color, 0.5 /** intensity */]}
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
