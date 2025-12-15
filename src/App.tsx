import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { gameConfig } from './game/config';

function App() {
  const gameRef = useRef<HTMLDivElement>(null);
  const gameInstance = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (gameRef.current && !gameInstance.current) {
      const config = {
        ...gameConfig,
        parent: gameRef.current,
        width: window.innerWidth > 480 ? 480 : window.innerWidth,
        height: window.innerHeight,
      };

      gameInstance.current = new Phaser.Game(config);
    }

    return () => {
      if (gameInstance.current) {
        gameInstance.current.destroy(true);
        gameInstance.current = null;
      }
    };
  }, []);

  return (
    <div ref={gameRef} style={{ width: '100%', height: '100%' }} />
  );
}

export default App;
