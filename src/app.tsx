import { useEffect, useRef } from 'react';
import { startPlayground } from './three/playground';

export const App = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    return startPlayground(canvas);
  }, []);

  return (
    <main>
      <canvas
        ref={canvasRef}
        aria-label="Three playground: tap the box to rotate it; drag the background to move around."
      />
    </main>
  );
};
