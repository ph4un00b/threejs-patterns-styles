
import * as T from "three";
import * as PP from "postprocessing";
import * as React from "react";

let _weights: any;

class CustomEffect extends PP.Effect {
  constructor({ weights = [1, 1, 1] }: { weights: T.Vector3Tuple }) {
    const frag = `
        uniform vec3 weights;
        uniform float w;

        void mainImage(const in vec4 inputColor
            , const in vec2 uv
            , out vec4 outputColor) 
            {
    	        outputColor = vec4(
                    inputColor.rgb * weights
                    , inputColor.a
                );

                // outputColor = vec4(1.0);
            }
    `;

    super("CustomEffect", frag, {
      blendFunction: PP.BlendFunction.NORMAL,
      uniforms: new Map([["weights", new T.Uniform(weights)]]),
    });

    _weights = weights;
  }

  // @ts-ignore
  update(renderer, inputBuffer, deltaTime) {
    // @ts-ignore
    this.uniforms.get("weights").value = _weights;
  }
}

// Effect component
export var MyCustomEffect = React.forwardRef(
  ({ wx, wy, wz }: { wx: number; wy: number; wz: number }, ref) => {
    const effect = React.useMemo(
      () => new CustomEffect({ weights: [wx, wy, wz] }),
      [wx, wy, wz]
    );
    return <primitive ref={ref} object={effect} />;
  }
);

class CustomTintPurpleEffect extends PP.Effect {
  constructor() {
    const frag = `
        // prev pass texture in the webgl render target
        // uniform sampler2D tDiffuse;
        // this is equivalent to inputColor below
        // or
        // inputBuffer?

        void mainImage(const in vec4 inputColor
            , const in vec2 uv
            , out vec4 outputColor) 
            {
              vec4 color = texture2D(
                inputBuffer,
                uv
              );

              color.r += 0.1;
              color.b += 0.1;
    	        outputColor = color;
            }
    `;

    super("CustomTintPurpleEffect", frag, {
      blendFunction: PP.BlendFunction.NORMAL,
    });
  }

  // @ts-ignore
  update(renderer, inputBuffer, deltaTime) {
    // @ts-ignore
    // this.uniforms.get("weights").value = _weights2;
  }
}

// Effect component
export var MyCustomTintPurpleEffect = React.forwardRef(({}, ref) => {
  const effect = React.useMemo(() => new CustomTintPurpleEffect(), []);
  return <primitive ref={ref} object={effect} />;
});

class CustomSinEffect extends PP.Effect {
  constructor() {
    const frag = `
        void mainUv(inout vec2 uv) {
          uv = vec2(
                uv.x,
                uv.y + abs(sin(uv.x * time)) * .1
              );
        }
    `;

    super("CustomSinEffect", frag, {
      blendFunction: PP.BlendFunction.NORMAL,
    });
  }

  // @ts-ignore
  update(renderer, inputBuffer, deltaTime) {
    // @ts-ignore
    // this.uniforms.get("weights").value = _weights2;
  }
}

// Effect component
export var MyCustomSinEffect = React.forwardRef(({}, ref) => {
  const effect = React.useMemo(() => new CustomSinEffect(), []);
  return <primitive ref={ref} object={effect} />;
});

let _normalMap: any;
class CustomNormalEffect extends PP.Effect {
  constructor({ normalMap }: { normalMap: T.Texture }) {
    const frag = `
        uniform sampler2D u_normalMap;

        void mainImage(const in vec4 inputColor
            , const in vec2 uv
            , out vec4 outputColor) 
            {
              // remapping -1, 1
              vec3 normalColor = texture2D(
                u_normalMap,
                uv
              ).xyz * 2.0 - 1.0;

              vec4 color = texture2D(
                inputBuffer,
                uv + normalColor.xy * 0.03
              );

    	        outputColor = color;
            }
    `;

    super("CustomNormalEffect", frag, {
      blendFunction: PP.BlendFunction.NORMAL,
      uniforms: new Map([["u_normalMap", new T.Uniform(normalMap)]]),
    });

    _normalMap = normalMap;
  }

  // @ts-ignore
  update(renderer, inputBuffer, deltaTime) {
    // @ts-ignore
    this.uniforms.get("u_normalMap").value = _normalMap;
  }
}

// Effect component
export var MyCustomNormalEffect = React.forwardRef(
  ({ normalMap }: { normalMap: T.Texture }, ref) => {
    const effect = React.useMemo(
      () => new CustomNormalEffect({ normalMap }),
      [normalMap]
    );
    return <primitive ref={ref} object={effect} />;
  }
);