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

## Legacy Code

The original game code has been moved to the `legacy/` directory.
