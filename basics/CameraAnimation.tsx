import * as T from 'three';
import * as React from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  OrbitControls,
  PerspectiveCamera,
  OrthographicCamera,
} from '@react-three/drei/core';
import { proxy, useSnapshot } from 'valtio';

var PointersProxy = proxy({
  x: 0,
  y: 0,
});

pov: {
  var sizes = {
    width: 550,
    height: 250,
  };

  var [degrees, aspect_ratio] = [75, sizes.width / sizes.height];
}

function usePointers() {
  const snap = useSnapshot(PointersProxy);
  return { px: snap.x, py: snap.y } as const;
}

export default function () {
  const target = React.useRef();
  return (
    <div>
      <section
        style={{ backgroundColor: 'purple' }}
        onPointerMove={(e) => {
          PointersProxy.x = e.clientX / sizes.width - 0.5;
          PointersProxy.y = -(e.clientY / sizes.height - 0.5);
        }}
      >
        <Canvas
          style={{
            width: sizes.width + 'px',
            height: sizes.height + 'px',
            backgroundColor: 'black',
          }}
        >
          <PerspectiveCamera position={[0, 0, 2]} fov={70} makeDefault={true} />
          {/* predefined controls */}
          <OrbitControls enableDamping={true} makeDefault={true} />
          <group>
            <CubeWithOrbitControls color={'hotpink'} position={[0, 0, 0]} />
          </group>

          <axesHelper args={[4]} />
        </Canvas>
      </section>

      <section
        style={{ backgroundColor: 'green' }}
        onPointerMove={(e) => {
          PointersProxy.x = e.clientX / sizes.width - 0.5;
          PointersProxy.y = -(e.clientY / sizes.height - 0.5);
        }}
      >
        <Canvas
          style={{
            width: sizes.width + 'px',
            height: sizes.height + 'px',
            backgroundColor: 'royalblue',
          }}
        >
          <OrthographicCamera
            position={[0, 2, 2]}
            // fixing the streching effect by multiplying the horizontal axis
            left={-1 * aspect_ratio}
            right={1 * aspect_ratio}
            top={1}
            bottom={-1}
            near={0.1}
            far={100}
            makeDefault={true}
          />
          <group>
            <CubeWithCustomControls color={'peru'} position={[0, 0, 0]} />
          </group>

          <axesHelper args={[4]} />
        </Canvas>
      </section>
    </div>
  );
}

function CubeWithOrbitControls({ position, color }) {
  const { px, py } = usePointers();
  const mesh_ = React.useRef<T.Mesh>(null);

  useFrame(({ clock, camera }, delta) => {
    var rev = Math.PI * 2;
  });

  return (
    <mesh ref={mesh_} position={position}>
      <meshBasicMaterial color={color} />
      <boxGeometry args={[1, 1, 1, 5, 5, 5]} />
    </mesh>
  );
}

function CubeWithCustomControls({ position, color }) {
  const { px, py } = usePointers();
  const mesh_ = React.useRef<T.Mesh>(null);

  useFrame(({ clock, camera }, delta) => {
    var rev = Math.PI * 2 * 0.3;
    // Or we can use <OrbitControls makeDefault />
    camera.position.x = Math.sin(px * rev) * 3;
    camera.position.z = Math.cos(px * rev) * 3;
    camera.position.y = py * 3;
    camera.lookAt(mesh_.current.position);
  });

  return (
    <mesh ref={mesh_} position={position}>
      <meshBasicMaterial color={color} />
      <boxGeometry args={[1, 1, 1, 5, 5, 5]} />
    </mesh>
  );
}
