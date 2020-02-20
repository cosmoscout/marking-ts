/**
 * Animatable Data
 */
export interface AnimatableData {
  /* eslint-disable-next-line */
    [key: string]: paper.Point | paper.Color | number | string | null | undefined | Record<string, string | number | paper.Point>;

  position?: paper.Point | number;
  scaling?: paper.Point | number;
  opacity?: number;
  fillColor?: string | paper.Color | null;
}
