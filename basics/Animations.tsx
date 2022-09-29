import * as T from 'three';
import * as React from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';

pov: {
  var sizes = {
    width: 400,
    height: 250,
  };

  var [degrees, aspect_ratio] = [75, sizes.width / sizes.height];
}

export default function Animations() {
  return (
    <Canvas
      style={{ width: '400px', height: '250px', backgroundColor: 'black' }}
      camera-fov={degrees}
      camera-aspect={aspect_ratio}
    >
      <group>
        <Cube color={0xff0000} position={[0, 0, 2]} />
      </group>
      <axesHelper args={[3]} />
    </Canvas>
  );
}

function Cube({ position, color }) {
  const mesh_ = React.useRef<T.Mesh>(null);
  let last = Date.now();

  useFrame(({ clock, camera }, delta) => {
    prevents_fps_effetcs: {
      const now = Date.now();
      const deltaCustom = now - last;
      last = now;
      // mesh_.current.rotation.y += 0.01 * deltaCustom;
    }

    delta_provided_by_the_hook: {
      // mesh_.current.rotation.y += 100 * delta;
    }

    with_clock_revolutions_per_sec: {
      var rev = Math.PI * 2 * 0.3;
      mesh_.current.rotation.y = clock.getElapsedTime() * rev;
    }
    mesh_.current.position.y = Math.sin(clock.getElapsedTime() * rev);
    mesh_.current.position.x = Math.cos(clock.getElapsedTime() * rev);

    camera.lookAt(mesh_.current.position);
  });

  return (
    <mesh ref={mesh_} position={position}>
      <meshBasicMaterial color={color} />
      <boxGeometry args={[1, 1, 1]} />
    </mesh>
  );
}
