export interface IStripePattern {
  type: 'stripes';
  orientation: 'horizontal' | 'vertical';
  // Top to bottom for horizontal stripes; left to right for vertical stripes.
  colors: readonly [string, string, ...string[]];
}

export interface ISvgPattern {
  type: 'svg';
  src: string;
  background: string;
  // Fraction of the canvas size reserved on each side (0 means edge to edge).
  inset: number;
}

export type TFlagPattern = IStripePattern | ISvgPattern;
