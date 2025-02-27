declare module '*.js' {
  const content: any;
  export default content;
}

// Add specific module resolution for MultiplayerPlatformer.js
declare module '../game/MultiplayerPlatformer' {
  import { MultiplayerPlatformerInterface } from '../game/MultiplayerPlatformer.d';
  const MultiplayerPlatformer: {
    new (container: HTMLElement): MultiplayerPlatformerInterface;
  };
  export default MultiplayerPlatformer;
  export { MultiplayerPlatformerInterface } from '../game/MultiplayerPlatformer.d';
}