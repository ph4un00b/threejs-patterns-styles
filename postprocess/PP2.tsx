import * as T from "three";
import * as React from "react";
import {
  Canvas,
  LightProps,
  MeshProps,
  useFrame,
  useLoader,
  useThree,
} from "@react-three/fiber";
import {
  OrbitControls,
  PerspectiveCamera,
  OrthographicCamera,
  Center,
  Text3D,
  useHelper,
  useTexture,
} from "@react-three/drei/core";
import { proxy, useSnapshot } from "valtio";
import { useControls } from "leva";
import { useSpring, config, a } from "@react-spring/three";
import { useDrag } from "@use-gesture/react";
import {
  Debug,
  Physics,
  PlaneProps,
  SphereProps,
  useContactMaterial,
  usePlane,
  useSphere,
  useBox,
  BoxProps,
  CollideEvent,
} from "@react-three/cannon";
import nice_colors from "../utils/colors";
import {
  EffectComposer,
  DepthOfField,
  Bloom,
  Noise,
  Vignette,
  DotScreen,
  Selection,
  Select,
  Glitch,
  SMAA,
} from "@react-three/postprocessing";

import * as PP from "postprocessing";
import {
  MyCustomEffect,
  MyCustomTintPurpleEffect,
  MyCustomSinEffect,
  MyCustomNormalEffect,
} from "../effects/primer";

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
            /**
             * - SAPBroadphase : ideal (performance)
             * if your objects are not traveling too fast
             * - NaiveBroadphase
             *  */
            broadphase={"SAP"}
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

              <PPEffects />
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

function PPEffects() {
  const [{ pp, randomFactors, leverA, leverB, leverC, leverD }, set] =
    useControls(() => ({
      pp: {
        options: [
          "bloom",
          "glitch",
          "custom",
          "antialias",
          "dots",
          "tint",
          "sin",
          "normal",
        ],
      },
      randomFactors: [1, 1],
      leverA: { value: 0.5, min: 0.1, step: 0.1, max: 5.0 },
      leverB: { value: 0.5, min: 0.1, step: 0.1, max: 5.0 },
      leverC: { value: 0.5, min: 0.1, step: 0.1, max: 5.0 },
      leverD: { value: 0.5, min: 0.1, step: 0.1, max: 5.0 },
    }));

  const { normal } = useTexture({ normal: "/public/NormalMap.png" });
  return (
    <Selection>
      <EffectComposer>
        {pp == "dots" ? (
          <DotScreen blendFunction={PP.BlendFunction.NORMAL} />
        ) : (
          <></>
        )}
        {pp == "glitch" ? (
          <Glitch active={true} mode={PP.GlitchMode.SPORADIC} />
        ) : (
          <></>
        )}
        {pp == "custom" ? (
          <MyCustomEffect wx={leverA} wy={leverB} wz={leverC} />
        ) : (
          <></>
        )}
        {pp == "antialias" ? <SMAA /> : <></>}
        {pp == "tint" ? <MyCustomTintPurpleEffect /> : <></>}
        {pp == "sin" ? <MyCustomSinEffect /> : <></>}
        {pp == "normal" ? <MyCustomNormalEffect normalMap={normal} /> : <></>}
        {pp == "bloom" ? (
          <Bloom
            luminanceThreshold={leverA}
            luminanceSmoothing={leverB}
            mipmapBlur={true}
            intensity={leverC}
            radius={leverD}
            // intensity={1.0} // The bloom intensity.
            // blurPass={true} // A blur pass.
            // width={PP.Resizer.AUTO_SIZE} // render width
            // height={PP.Resizer.AUTO_SIZE} // render height
            kernelSize={PP.KernelSize.LARGE} // blur kernel size
            // luminanceThreshold={0.9} // luminance threshold. Raise this value to mask out darker elements in the scene.
            // luminanceSmoothing={0.025} // smoothness of the luminance threshold. Range is [0, 1]
          />
        ) : (
          <></>
        )}
      </EffectComposer>

      <Select enabled={true}>
        <Cubo castShadow={true} />
      </Select>
    </Selection>
  );
}

var hitSound = new window.Audio(`${baseUrl}/sounds/hit.mp3`);

function playHit({ contact: { impactVelocity } }: CollideEvent) {
  if (impactVelocity < 1.5) return;
  /** todo:
   * - change the  volume in relation to impact
   * - add a little delay since hitting the floor
   * fires multiple events (4?)
   */
  hitSound.volume = Math.random();
  hitSound.currentTime = 0;
  hitSound.play();
}

type MaterialOptions =
  | string
  | {
      friction?: number | undefined;
      restitution?: number | undefined;
    }
  | undefined;

function World({ items }: { items: number }) {
  const [circulos, setCirculos] = React.useState(items);
  const [preset] = React.useState(Math.floor(Math.random() * 900));

  const bouncyMat = {
    name: "plastic",
  } as MaterialOptions;

  const groundMat = {
    name: "concreto",
  } as MaterialOptions;

  useContactMaterial(groundMat, bouncyMat, {
    friction: 0.1,
    restitution: 0.7 /** bouncing! */,
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

  const { gl } = useThree();
  // @link https://github.com/pmndrs/react-three-fiber/discussions/2494
  console.log(gl.capabilities);

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
    </>
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
        color={"#777777"}
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
    () => ({
      mass: 1,
      onCollide: (e) => {
        playHit(e);
      },
      ...props,
    }),
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
var localUniforms = {
  uTime: { value: 0 },
  uleverX: { value: 0.1 },
  uleverR: { value: 0.1 },
  uleverG: { value: 0.1 },
  uleverB: { value: 0.1 },
  uResolution: { value: new T.Vector2() },
  uPointer: { value: new T.Vector2() },
};

var textureAssets = [
  `${baseUrl}/door/color.jpg`,
  `${baseUrl}/door/alpha.jpg`,
  `${baseUrl}/door/height.jpg`,
  `${baseUrl}/door/normal.jpg`,
  `${baseUrl}/door/ambientOcclusion.jpg`,
  `${baseUrl}/door/metalness.jpg`,
  `${baseUrl}/door/roughness.jpg`,
];

function Cubo(props: BoxProps & MeshProps) {
  const shader = React.useRef<T.MeshStandardMaterial>(null!);
  const customDepth = React.useRef<T.MeshDepthMaterial>(null!);

  React.useLayoutEffect(() => {
    twistedMaterial(shader.current);
    twistedMaterial(customDepth.current);
  });

  const { leverX, leverR, leverG, leverB } = useControls({
    leverX: { value: 0.1, min: 0.0001, max: 1, step: 0.0001 },
    leverR: { value: 0.1, min: 1 / 256, max: 1.0, step: 1 / 256 },
    leverG: { value: 0.1, min: 1 / 256, max: 1.0, step: 1 / 256 },
    leverB: { value: 0.1, min: 1 / 256, max: 1.0, step: 1 / 256 },
  });

  const { pointer, viewport } = useThree();

  React.useLayoutEffect(() => {
    localUniforms.uPointer.value = pointer;
    localUniforms.uResolution.value.x = viewport.width;
    localUniforms.uResolution.value.y = viewport.height;
    // console.log({ w: viewport.width, h: viewport.height });
  }, [viewport.width, viewport.height, pointer]);

  useFrame((state) => {
    // console.log(shader.current);
    localUniforms.uTime.value = state.clock.elapsedTime;
    localUniforms.uleverX.value = leverX;
    localUniforms.uleverR.value = leverR;
    localUniforms.uleverG.value = leverG;
    localUniforms.uleverB.value = leverB;
  });

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
  const { colorA } = useSpring({ colorA: active ? "royalblue" : "#e83abf" });
  /** interpolate values from common spring */
  // const { spring } = useSpring({
  //   spring: active,
  //   config: config.molasses,
  // });
  // const { pos } = useSpring({ pos: active ? -2 : 0 });
  // const scale = spring.to([0, 1], [1, 4]);
  // const rotation = spring.to([0, 1], [0, Math.PI]);
  // const colorA = spring.to([0, 1], ['#6246ea', 'royalblue']);

  const [{ x, y }, api] = useSpring(() => ({ x: 0, y: 1 }));

  const handlers = useDrag(function ({ event, offset: [x, y] }) {
    event.stopPropagation();
    const aspect = viewport.getCurrentViewport().factor;
    console.log(x, y);
    return api.start({ x: x / aspect, y: -y / aspect });
  });

  const [t1, t2, tH, tNornal, tAO] = useLoader(T.TextureLoader, [
    ...textureAssets,
  ]);

  return (
    /* @ts-ignore infinity */
    <a.mesh
      castShadow={true}
      // {...handlers()}
      {...props}
      onClick={(e) => {
        e.stopPropagation();
        // setActive(Number(!active));
      }}
      rotation-x={rotation}
      scale={scale}
      position-x={x}
      position-y={y}
      position-z={pos}
    >
      <boxGeometry args={[1, 1, 1, 64, 64]} />
      {/* 
      // @ts-ignore */}
      <a.meshStandardMaterial
        ref={shader}
        map={t1}
        normalMap={tNornal}
        alphaMap={t2}
        transparent={!true}
        roughness={0.4}
        metalness={0.3}
        color={colorA}
      />
      <a.meshDepthMaterial
        ref={customDepth}
        attach="customDepthMaterial"
        depthPacking={T.RGBADepthPacking}
      />
    </a.mesh>
  );
}

function twistedMaterial(currentShader: T.Material) {
  currentShader.onBeforeCompile = function (shader: T.Shader) {
    console.log(shader);
    shader.uniforms.uTime = localUniforms.uTime;
    shader.uniforms.uleverX = localUniforms.uleverX;
    shader.uniforms.uleverR = localUniforms.uleverR;
    shader.uniforms.uleverG = localUniforms.uleverG;
    shader.uniforms.uleverB = localUniforms.uleverB;
    shader.uniforms.uResolution = localUniforms.uResolution;
    shader.uniforms.uPointer = localUniforms.uPointer;

    setBeforeVertex(shader, {
      from: "#include <common>",
      to: `
        #include <common>

        uniform float uTime;
        uniform float uleverX;

        mat2 rotate2D(float _angle) {
          return mat2(
            cos( _angle ), - sin( _angle ),
            sin( _angle ), + cos( _angle )
            );
        }
      `,
    });

    /**
     * aplicando rotación en los normales
     * @link https://thebookofshaders.com/08/?lan=es
     */
    setInsideVertexMain(shader, {
      from: "#include <beginnormal_vertex>",
      to: `
      #include <beginnormal_vertex>
      #define FAU_NORMAL

        float angle = position.y * uleverX;
        mat2 rotateMat = rotate2D( angle );

        objectNormal.xz = rotateMat * objectNormal.xz;
      `,
    });

    /**
     * aplicando rotación
     * @link https://thebookofshaders.com/08/?lan=es
     */
    setInsideVertexMain(shader, {
      from: "#include <begin_vertex>",
      to: `
        #include <begin_vertex>

        #ifndef FAU_NORMAL
          float angle = position.y * uleverX;
          mat2 rotateMat = rotate2D( angle );
          transformed.xz = rotateMat * transformed.xz;
        #endif

        #ifdef FAU_NORMAL
          transformed.xz = rotateMat * transformed.xz;
        #endif
      `,
    });
  };
}

function setInsideVertexMain(
  shader: T.Shader,
  { from, to }: { from: string; to: string }
) {
  const newShader = shader.vertexShader.replace(
    /**
     * this is inside void main()
     */
    from,
    to
  );

  shader.vertexShader = newShader;
}

function setBeforeVertex(
  shader: T.Shader,
  { from, to }: { from: string; to: string }
) {
  /**
   * dir: /src/renderers/shaders
   *
   * @link https://github.com/mrdoob/three.js/blob/master/src/renderers/shaders/ShaderLib/meshphysical.glsl.js
   */

  const newShaderCommon = shader.vertexShader.replace(
    /**
     * this code is setup before void main()
     */
    from,
    to
  );

  shader.vertexShader = newShaderCommon;
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
    // @ts-ignore
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
