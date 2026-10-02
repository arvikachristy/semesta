export enum FlagPatternType {
  Stripes = 'stripes',
  Svg = 'svg',
}
export enum StripeOrientation {
  Horizontal = 'horizontal',
  Vertical = 'vertical',
}

export interface IStripePattern {
  type: FlagPatternType.Stripes;
  orientation: StripeOrientation;
  // Top to bottom for horizontal stripes; left to right for vertical stripes.
  colors: readonly [string, string, ...string[]];
}

export interface ISvgPattern {
  type: FlagPatternType.Svg;
  src: string;
  background: string;
  // Fraction of the canvas size reserved on each side (0 means edge to edge).
  inset: number;
}

export type TFlagPattern = IStripePattern | ISvgPattern;
