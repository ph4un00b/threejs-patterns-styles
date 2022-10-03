import * as React from 'react';

/** @link https://overreacted.io/making-setinterval-declarative-with-react-hooks/ */
export function useTimeout(callback: () => void, delay: number) {
  const savedCallback = React.useRef<() => void>(null!);

  React.useEffect(() => {
    savedCallback.current = callback;
  });

  React.useEffect(() => {
    function tick() {
      savedCallback.current();
    }

    let id = window.setTimeout(tick, delay);
    return () => window.clearTimeout(id);
  }, [delay]);
}
