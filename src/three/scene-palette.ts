/* CSS theme variables are the only source of scene colour values. */
export interface IScenePalette {
  world: string;
  shadow: string;
  reflectionBackground: string;
  reflectionWarm: string;
  reflectionCool: string;
  jellyTint: string;
  glassBottom: string;
  glassClear: string;
  glassMetal: string;
}

export const readScenePalette = (): IScenePalette => {
  // Headless geometry tests need neutral values; the browser reads theme CSS.
  const styles =
    typeof document === 'undefined' ? null : getComputedStyle(document.documentElement);
  const read = (token: string) => styles?.getPropertyValue(token).trim() || '#ffffff';
  return {
    world: read('--color-world'),
    shadow: read('--scene-shadow'),
    reflectionBackground: read('--scene-reflection-background'),
    reflectionWarm: read('--scene-reflection-warm'),
    reflectionCool: read('--scene-reflection-cool'),
    jellyTint: read('--scene-jelly-tint'),
    glassBottom: read('--scene-glass-bottom'),
    glassClear: read('--scene-glass-clear'),
    glassMetal: read('--scene-glass-metal'),
  };
};
