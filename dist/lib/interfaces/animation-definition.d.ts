import { AnimatableData } from './animatable-data';
import { AnimationOptions } from './animation-options';
export interface AnimationDefinition {
    target: paper.Item;
    from?: AnimatableData;
    to?: AnimatableData;
    options?: AnimationOptions;
}
