import {DEFAULT_SCALE} from "../lib/constants";
import {AnimatableData, AnimationDefinition, AnimationOptions} from "../lib/interfaces";

export abstract class IAnimation {
    /**
     * Callback to run on Animation stop
     *
     * @param callback
     */
    public abstract onStop$(callback: Function): void;

    /**
     * Callback to run on Animation finish
     *
     * @param callback
     */
    public abstract onFinish$(callback: Function): void;

    /**
     * Set the animation duration
     *
     * @param {number} duration
     */
    public abstract set duration(duration: number | undefined);

    /**
     * Duration Accessor
     */
    public abstract get duration(): number | undefined;

    /**
     * Animation target
     */
    public abstract get target(): paper.Item | undefined;

    /**
     * Set the animation duration
     *
     * @param {string | Function} easing
     */
    public abstract set easing(easing: string | Function | undefined);

    /**
     * Accessor for running state
     */
    public abstract get running(): boolean;

    /**
     * Start the animation
     */
    public abstract start(): void;

    /**
     * Stop the animation. Optional Parameter goToEnd sets the objects state to "to"
     *
     * @param {boolean} [goToEnd=true] Set the objects state to "to"
     */
    public abstract stop(goToEnd: boolean): void;
}


/**
 * Class representing an animation
 *
 * @extends {IAnimation}
 */
export default class Animation implements IAnimation {
    // Data
    protected _options: AnimationOptions = {};
    private _target: paper.Item | undefined;
    private _from: AnimatableData | undefined;
    private _to: AnimatableData | undefined;

    protected onFinishCallbacks = new Array<Function>();
    protected onStopCallbacks = new Array<Function>();

    // Tween instance
    private _tween: paper.Tween | undefined;

    // Ready flag
    private _initialized: boolean = false;

    /**
     * @constructor
     *
     * @param {AnimationDefinition} animation
     */
    public constructor(animation?: AnimationDefinition) {
        if (typeof animation !== "undefined") {
            this.initialize(animation);
        }
    }

    /**
     * Set the animation duration
     *
     * @param {number} duration
     */
    public set duration(duration: number | undefined) {
        if (typeof this._options !== "undefined") {
            this._options.duration = duration;
        }

        if (typeof this._tween !== "undefined") {
            // @ts-ignore
            this._tween.duration = duration;
        }
    }

    /**
     * Duration Accessor
     *
     * @return {number}
     */
    public get duration(): number | undefined {
        return this._options && this._options.duration;
    }

    /**
     * Set the animation easing function
     *
     * @param {string | Function} easing
     */
    public set easing(easing: string | Function | undefined) {
        if (typeof this._options !== "undefined") {
            this._options.easing = easing;
        }

        if (typeof this._tween !== "undefined") {
            // @ts-ignore
            this._tween.easing = easing;
        }
    }

    /**
     * Accessor for running state
     *
     * @return {boolean}
     */
    public get running(): boolean {
        if (typeof this._tween !== "undefined") {
            // @ts-ignore
            return this._tween.running;
        }

        return false;
    }

    /**
     * @inheritDoc
     */
    public get target(): paper.Item | undefined {
        return this._target;
    }

    /**
     * Initialize the animation with data
     *
     * @param {AnimationDefinition} animation The animation data
     */
    public initialize(animation: AnimationDefinition): void {
        this._target = animation.target;

        this._from = Animation.normalize(animation.from || {});
        this._to = Animation.normalize(animation.to || {});

        this._options = Animation.parseOptions(animation.options || {});

        this._tween = this.createTween(animation);

        this._tween.then((): void => {
            this.runOnFinish();
        });

        this._initialized = true;
    }

    /**
     * Start the animation
     *
     * @throws {Error} If animation is not initialized
     */
    public start(): void {
        if (!this._initialized) {
            throw new Error("Animation not initialized");
        }

        if (typeof this._tween !== "undefined") {
            this._tween.start();
        }
    }

    /**
     * Stop the animation. Optional Parameter goToEnd sets the objects state to "to"
     *
     * @param {boolean} [goToEnd=true] Set the objects state to "to"
     */
    public stop(goToEnd: boolean = true): void {
        // @ts-ignore
        if (typeof this._tween !== "undefined" && this._tween.running) {
            this._tween.stop();

            if (goToEnd && typeof this._to !== "undefined") {
                if (typeof this._to['lastSegment.point'] !== "undefined") {
                    this._to['lastSegment'] = {
                        'point': <paper.Point>this._to['lastSegment.point']
                    };
                    delete this._to['lastSegment.point'];
                }
                (<paper.Item>this._target).set(this._to);
            }
        }

        this.runOnStop();
    }

    /**
     * @inheritDoc
     */
    public onFinish$(callback: Function): void {
        this.onFinishCallbacks.push(callback);
    }

    /**
     * @inheritDoc
     */
    public onStop$(callback: Function): void {
        this.onStopCallbacks.push(callback);
    }

    /**
     * Creates the actual Tween
     *
     * @param {AnimationDefinition} animation
     * @return {Tween}
     * @throws {Error} If neither a 'from' or 'to' state is set
     */
    private createTween(animation: AnimationDefinition): paper.Tween {
        if (typeof animation.from === "undefined" && typeof animation.to === "undefined") {
            throw new Error('Animation is missing "from" and "to" data.');
        }

        let tween;

        if (typeof animation.from === "undefined") {
            // @ts-ignore
            tween = this._target.tweenTo(
                <object>this._to,
                {
                    duration: this._options.duration,
                    easing: this._options.easing,
                    start: false,
                }
            );
        } else if (typeof animation.to === "undefined") {
            // @ts-ignore
            tween = this._target.tweenFrom(
                <object>this._from,
                {
                    duration: this._options.duration,
                    easing: this._options.easing,
                    start: false,
                }
            );
        } else {
            // @ts-ignore
            tween = this._target.tween(
                <object>this._from,
                <object>this._to,
                {
                    duration: this._options.duration,
                    easing: this._options.easing,
                    start: false,
                }
            );
        }

        return tween;
    }

    /**
     * Normalizes 0 scales to Number.EPSILON
     *
     * @param {AnimatableData} data
     * @return {AnimatableData}
     */
    private static normalize(data: AnimatableData): AnimatableData {
        if (typeof data.scaling === "number") {
            if (data.scaling === 0) {
                data.scaling = Number.EPSILON;
            } else {
                data.scaling = DEFAULT_SCALE.multiply(data.scaling);
            }
        }

        return data;
    }

    /**
     * Sets the easing function to 'linear' if no function is provided
     * Sets the duration to Epsilon if no or a 0 duration is provided
     *
     * @see {AnimationOptions}
     * @param {AnimationOptions} options
     * @return {AnimationOptions}
     */
    private static parseOptions(options: AnimationOptions): AnimationOptions {
        if (typeof options === "undefined") {
            options = {};
        }

        if (typeof options.duration === "undefined") {
            options.duration = Number.EPSILON;
        } else {
            if (options.duration === 0) {
                options.duration = Number.EPSILON;
            }
        }

        if (typeof options.easing === "undefined") {
            options.easing = 'easeOutCubic';
        }

        return options;
    }

    /**
     * Run all added callbacks
     */
    protected runOnFinish(): void {
        this.onFinishCallbacks.forEach(callback => callback());

        this.onFinishCallbacks.length = 0;
    }

    /**
     * Run all added callbacks
     */
    protected runOnStop(): void {
        this.onStopCallbacks.forEach(callback => callback());

        this.onStopCallbacks.length = 0;
    }
}

/**
 * An AnimationGroup can hold 0-n Animations
 *
 * @extends Animation
 */
export class AnimationGroup extends Animation {
    // Data
    private _animations: Array<IAnimation>;

    /**
     * Finish function count from animations
     */
    private finCount: number = 0;

    /**
     * Stop function count from animations
     */
    private stopCount: number = 0;

    /**
     * Group Constructor
     *
     * @constructor
     * @param {Array<IAnimation>} [animations]
     */
    public constructor(...animations: Array<IAnimation>) {
        super();

        if (animations.length > 0) {
            this._animations = animations;
        } else {
            this._animations = new Array<IAnimation>();
        }
    }

    /**
     * Returns the animation count
     *
     * @return {number}
     */
    public get length(): number {
        return this._animations.length;
    }

    /**
     * @return {boolean} If at least one animation is running
     */
    public get running(): boolean {
        return typeof this._animations.find((animation: IAnimation): boolean => {
            return animation.running;
        }) !== "undefined";
    }

    /**
     * Set the group animation duration
     *
     * @param {number} duration
     */
    public set duration(duration: number) {
        this._options.duration = duration;

        this._animations.forEach((animation: IAnimation): void => {
            animation.duration = duration;
        });
    }

    /**
     * Set the groups easing function
     *
     * @param {string | Function} easing
     */
    public set easing(easing: string | Function) {
        this._options.easing = easing;

        this._animations.forEach((animation: IAnimation): void => {
            animation.easing = easing;
        });
    }

    /**
     * Push new animations to the group
     *
     * @param {Array<IAnimation>} animations
     */
    public push(...animations: Array<IAnimation>): void {
        animations.forEach((animation: IAnimation): void => {
            if (typeof this._options.duration !== "undefined" && animation.duration === Number.EPSILON) {
                animation.duration = this._options.duration;
            }

            if (typeof this._options.easing !== "undefined") {
                // @ts-ignore
                animation.easing = typeof this._options.easing === "function" ? this._options.easing : paper.Tween.easings[this._options.easing];
            }

            animation.onFinish$(() => {
                this.onFinishIntern();
            });

            animation.onStop$(() => {
                this.onStopIntern();
            });

            this._animations.push(animation);
        });
    }

    /**
     * Clears all animations from the group and resets the subjects
     */
    public reset(): void {
        this.resetChildren();
        this.finCount = 0;
        this.stopCount = 0;
        this.onFinishCallbacks.length = 0;
        this.onStopCallbacks.length = 0;
    }

    /**
     * @see {reset}
     */
    private resetChildren(): void {
        this._animations.length = 0;
    }

    /**
     * Start all animations
     */
    public start(): void {

        this._animations.forEach((animation: IAnimation): void => {
            animation.start();
        });
    }

    /**
     * Stop all animations
     *
     * @param {boolean} [goToEnd=true]
     */
    public stop(goToEnd: boolean = true): void {
        this._animations.forEach((animation: IAnimation): void => {
            animation.stop(goToEnd);
        });
    }

    /**
     * Remove an item from the animation group
     *
     * @param {Item} item
     */
    public remove(item: paper.Item): void {
        this._animations = this._animations.filter((animation: IAnimation): boolean => {
            return animation.target !== item;
        });
    }

    /**
     * @inheritDoc
     */
    protected runOnStop(): void {
        super.runOnStop();
        this.stopCount = 0;
    }

    /**
     * @inheritDoc
     */
    protected runOnFinish(): void {
        super.runOnFinish();
        this.finCount = 0;
    }

    /**
     * Call runOnFinish if all animations finished
     */
    private onFinishIntern(): void {
        this.finCount++;
        if (this.finCount === this.length) {
            this.runOnFinish();
        }
    }

    /**
     * Call runOnStop if all animations stopped
     */
    private onStopIntern(): void {
        this.stopCount++;
        if (this.stopCount === this.length) {
            this.runOnStop();
        }
    }
}
