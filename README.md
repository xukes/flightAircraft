# Flight Aircraft (Refactored)

This project has been refactored to use React, TypeScript, and Phaser.

## Setup

1.  Install dependencies:
    ```bash
    npm install
    ```

2.  Start the development server:
    ```bash
    npm run dev
    ```

## Structure

-   `src/App.tsx`: React component that initializes the Phaser game.
-   `src/game/scenes/MainScene.ts`: The main game scene containing the game logic (ported from the original `game.js`).

## Controls

-   **Move**: Mouse / Touch
-   **Shoot**: Automatic
-   **Game Over**: Click to restart
-   **Use Powerups**: Q (Upgrade), E (Lightning), R (Heal)
-   **Laser**: Hold Space
-   **Mute/Unmute**: M

## Audio Features

The game now includes a comprehensive audio system:

### Sound Effects
- Player shooting (with pitch variation)
- Enemy shooting
- Hit effects
- Explosions
- Powerup collection
- Laser weapon
- Lightning attack
- Game over sound

### Background Music
- Looping background music during gameplay

### Audio Controls
- Press **M** to mute/unmute all sounds
- Volume can be adjusted programmatically via AudioManager

### Audio Files Required
To enable audio, place sound files in `assets/sounds/`:
- `shoot.wav` - Player shooting
- `laser.wav` - Laser weapon
- `enemy_shoot.wav` - Enemy shooting
- `hit.wav` - Hit effects
- `explosion.wav` - Explosions
- `powerup.wav` - Powerup collection
- `lightning.wav` - Lightning attack
- `game_over.wav` - Game over
- `background_music.mp3` - Background music

See `assets/sounds/README.md` for detailed audio requirements.

## Legacy Code

The original game code has been moved to the `legacy/` directory.
