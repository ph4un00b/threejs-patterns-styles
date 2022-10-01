import * as T from "three";
import * as React from "react";
import {
  Canvas,
  extend,
  LightProps,
  MeshProps,
  useFrame,
  useThree,
} from "@react-three/fiber";
import {
  Center,
  OrbitControls,
  OrthographicCamera,
  PerspectiveCamera,
  shaderMaterial,
  Text3D,
  useHelper,
  useTexture,
} from "@react-three/drei/core";
import { proxy, useSnapshot } from "valtio";
import { useControls } from "leva";
import { a, config, useSpring } from "@react-spring/three";
import { useDrag } from "@use-gesture/react";
import {
  BoxProps,
  CollideEvent,
  Debug,
  Physics,
  PlaneProps,
  SphereProps,
  useBox,
  useContactMaterial,
  usePlane,
  useSphere,
} from "@react-three/cannon";
import nice_colors from "../utils/colors";
/** @ts-ignore */
import vertex from "../shaders/second.vertex.glsl";
/** @ts-ignore */
import frag from "../shaders/second.frag.glsl";

var dpr = { min: 1, max: 2 };
var baseUrl = "https://ph4un00b.github.io/data";
var global = {
  bg: "red",
  fog: "#262837",
  mat: "#e83abf",
  font1: `${baseUrl}/typeface/press-start-2p.json`,
};

/** FREE! @link https://kenney.nl/assets */
export default function () {
  const { cw, ch } = useCanvas();
  const cam_ = React.useRef(null);
  const { fondo, ambientIntensity, ambient } = useControls({
    ambientIntensity: { value: 0.3, min: 0, max: 1, step: 0.001 },
    ambient: { value: "#ffffff" },
    fondo: { value: global.fog },
  });

  return (
    <>
      <section>
        <Canvas
          shadows={true} /** enable shadowMap */
          dpr={[dpr.min, dpr.max]}
          style={{
            width: cw + "px",
            height: ch + "px",
            backgroundColor: fondo,
          }}
        >
          {/* 💡 not having a clear color would glitch the recording */}
          <color attach="background" args={["#000"]} />
          {/* <React.Suspense> */}

          <PerspectiveCamera
            ref={cam_}
            position={[-1, 1, 7]}
            fov={75}
            near={0.1}
            far={100}
            // auto updates the viewport
            // manual={false}
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

          <RawPlane />
          <axesHelper args={[4]} />
          <ambientLight color={ambient} intensity={ambientIntensity} />
          {/* </React.Suspense> */}
        </Canvas>
      </section>
    </>
  );
}

/** it uses ShaderMaterial instead of RawShaderMaterial
 * we do all this below in order
 * to make rerenders to take effect on the shader
 */
const MyMaterial = shaderMaterial(
  {
    ufreq: new T.Vector2(0.1, 0.1),
    uTime: 0,
    uAmp: 0.1,
    uColor: new T.Color('peru'),
    uTexture: new T.Texture(),
  },
  vertex,
  frag,
);

extend({ MyMaterial });

function RawPlane() {
  console.log("hola");
  const geo = React.useRef<T.PlaneGeometry>(null!);
  const shader = React.useRef<T.ShaderMaterial>(null!);
  //   const mat = React.useRef<T.RawShaderMaterial>(null!);

  React.useLayoutEffect(() => {
    const count = geo.current.attributes.position.count;
    const randoms = new Float32Array(count);

    for (let index = 0; index < count; index++) {
      randoms[index] = Math.random();
    }

    geo.current.setAttribute("aRandom", new T.BufferAttribute(randoms, 1));
  }, []);

  const { ufreqX, ufreqY, uAmp,uColor } = useControls({
    ufreqX: {
      value: 10.1,
      min: 0.1,
      max: 20,
      step: 0.01,
    },
    ufreqY: {
      value: 0.1,
      min: 0.1,
      max: 20,
      step: 0.01,
    },
    uAmp: {
      value: 0.1,
      min: 0.1,
      max: 5,
      step: 0.01,
    },
    uColor: {
        value: "#ff00bc"
    }
  });

  useFrame(({clock}) => {
    /** do not use large numbers f.i. Date.now() */
    shader.current.uTime = clock.elapsedTime
  })

  const pow2img = useTexture(`${baseUrl}/pow2img.webp`)
  return (
    <mesh>
      <planeBufferGeometry ref={geo} args={[1, 1, 32, 32]} />
      <myMaterial
        ref={shader}
        ufreq={new T.Vector2(ufreqX, ufreqY)}
        uAmp={uAmp}
        uColor={uColor}
        uTexture={pow2img}
        wireframe={!true}
        side={T.DoubleSide}
        transparent={!true}
      />
      {
        /* <rawShaderMaterial
        ref={mat}
        uniforms={{
          ufreq: {
            value: new T.Vector2(ufreqX, ufreqY)
          },
        }}
        vertexShader={vertex}
        fragmentShader={frag}

        wireframe={!true}
        side={T.DoubleSide}
        transparent={true}

      /> */
      }
    </mesh>
  );
}

/** suports shadows! */
function DirectionalLight(props: LightProps) {
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
    /** @ts-ignore */
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

window.addEventListener("resize", () => {
  CanvasProxy.w = window.innerWidth;
  CanvasProxy.h = window.innerHeight;
});

window.addEventListener("dblclick", () => {
  // todo: verify on safari!
  if (!document.fullscreenElement) {
    document.querySelector("canvas")!.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
});
