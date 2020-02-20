import { AnimationDefinition, AnimationOptions } from "../lib/interfaces";
export declare abstract class IAnimation {
    abstract onStop$(callback: Function): void;
    abstract onFinish$(callback: Function): void;
    abstract set duration(duration: number | undefined);
    abstract get duration(): number | undefined;
    abstract get target(): paper.Item | undefined;
    abstract set easing(easing: string | Function | undefined);
    abstract get running(): boolean;
    abstract start(): void;
    abstract stop(goToEnd: boolean): void;
}
export default class Animation implements IAnimation {
    protected _options: AnimationOptions;
    private _target;
    private _from;
    private _to;
    protected onFinishCallbacks: Function[];
    protected onStopCallbacks: Function[];
    private _tween;
    private _initialized;
    constructor(animation?: AnimationDefinition);
    set duration(duration: number | undefined);
    get duration(): number | undefined;
    set easing(easing: string | Function | undefined);
    get running(): boolean;
    get target(): paper.Item | undefined;
    initialize(animation: AnimationDefinition): void;
    start(): void;
    stop(goToEnd?: boolean): void;
    onFinish$(callback: Function): void;
    onStop$(callback: Function): void;
    private createTween;
    private static normalize;
    private static parseOptions;
    protected runOnFinish(): void;
    protected runOnStop(): void;
}
export declare class AnimationGroup extends Animation {
    private _animations;
    private finCount;
    private stopCount;
    constructor(...animations: Array<IAnimation>);
    get length(): number;
    get running(): boolean;
    set duration(duration: number);
    set easing(easing: string | Function);
    push(...animations: Array<IAnimation>): void;
    reset(): void;
    private resetChildren;
    start(): void;
    stop(goToEnd?: boolean): void;
    remove(item: paper.Item): void;
    protected runOnStop(): void;
    protected runOnFinish(): void;
    private onFinishIntern;
    private onStopIntern;
}
