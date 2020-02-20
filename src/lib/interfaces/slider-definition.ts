
/**
 * Slider configuration data
 * min: Min value
 * max: Max value
 * initial: Initial slider value | default: min
 * stepSize: Step size of values | default: 1
 * stepDist: Distance of steps in px | default: 100
 */
export interface SliderDefinition {
  min: number;
  max: number;
  initial: number;
  precision: number;
  stepDist: number;
  stepSize?: number;
}
