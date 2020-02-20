import { AnimatableData } from './animatable-data';
import { AnimationOptions } from './animation-options';

/**
 * Animation Definition
 * target - The target object to animate
 * from - From state
 * to - To state
 */
export interface AnimationDefinition {
  target: paper.Item;
  from?: AnimatableData;
  to?: AnimatableData;
  options?: AnimationOptions;
}
