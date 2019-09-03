// @ts-ignore
import {Item, Point, Tween} from 'paper';
import {DEFAULT_SCALE} from "../lib/constants";
import {combineLatest, forkJoin, from, fromEvent, Observable, Subject} from "rxjs";
import {map, mergeAll} from "rxjs/operators";
import {AnimatableData, AnimationDefinition, AnimationOptions, AnimationProgress} from "../lib/interfaces";

export abstract class IAnimation {
    /**
     * Observable which emits if the animation starts
     *
     * @return {Observable<Tween>}
     */
    public abstract get onStart$(): Observable<Tween>;

    /**
     * Observable which emits if the animation stops
     *
     * @return {Observable<Tween>}
     */
    public abstract get onStop$(): Observable<Tween>;

    /**
     * Observable which emits after the animation finishes
     *
     * @return {Observable<Tween>}
     */
    public abstract get onFinish$(): Observable<Tween>;

    /**
     * Observable which emits the animation progress
     *
     * @return {Observable<AnimationProgress>}
     */
    public abstract get onUpdate$(): Observable<AnimationProgress> | undefined;

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

    public abstract get target(): Item | undefined;

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
    // Observables
    protected _onStart$: Subject<Tween> = new Subject<Tween>();
    protected _onStop$: Subject<Tween> = new Subject<Tween>();
    protected _onFinish$: Subject<Tween> = new Subject<Tween>();
    protected _onUpdate$: Observable<AnimationProgress> | undefined;

    // Data
    protected _options: AnimationOptions = {};
    private _target: Item | undefined;
    private _from: AnimatableData | undefined;
    private _to: AnimatableData | undefined;

    // Tween instance
    private _tween: Tween;

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
     * Observable which emits if the animation starts
     *
     * @return {Observable<Tween>}
     */
    public get onStart$(): Observable<Tween> {
        return this._onStart$.asObservable();
    }

    /**
     * Observable which emits if the animation stops
     *
     * @return {Observable<Tween>}
     */
    public get onStop$(): Observable<Tween> {
        return this._onStop$.asObservable();
    }

    /**
     * Observable which emits after the animation finishes
     *
     * @return {Observable<Tween>}
     */
    public get onFinish$(): Observable<Tween> {
        return this._onFinish$.asObservable();
    }

    /**
     * Observable which emits the animation progress
     *
     * @return {Observable<AnimationProgress>}
     */
    public get onUpdate$(): Observable<AnimationProgress> | undefined {
        if (this._initialized) {
            return this._onUpdate$;
        }

        return;
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
            return this._tween.running;
        }

        return false;
    }

    public get target(): Item | undefined {
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

        this._onUpdate$ = fromEvent(this._tween, 'update');

        this._tween.then((): void => {
            this._onFinish$.next(this._tween);
            this._onFinish$.complete();
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

        this._onStart$.next(this._tween);

        this._tween.start();

        this._onStart$.complete();
    }

    /**
     * Stop the animation. Optional Parameter goToEnd sets the objects state to "to"
     *
     * @param {boolean} [goToEnd=true] Set the objects state to "to"
     */
    public stop(goToEnd: boolean = true): void {
        if (typeof this._tween !== "undefined" && this._tween.running) {
            this._onStop$.next(this._tween);
            this._tween.stop();
            this._onStop$.complete();

            if (goToEnd && typeof this._to !== "undefined") {
                if (typeof this._to['lastSegment.point'] !== "undefined") {
                    this._to['lastSegment'] = {
                        'point': this._to['lastSegment.point'] as Point
                    };
                    delete this._to['lastSegment.point'];
                }
                (this._target as Item).set(this._to);
            }
        }
    }

    /**
     * Creates the actual Tween
     *
     * @param {AnimationDefinition} animation
     * @return {Tween}
     * @throws {Error} If neither a 'from' or 'to' state is set
     */
    private createTween(animation: AnimationDefinition): Tween {
        if (typeof animation.from === "undefined" && typeof animation.to === "undefined") {
            throw new Error('Animation is missing "from" and "to" data.');
        }

        if (typeof animation.from === "undefined") {
            // @ts-ignore
            return this._target.tweenTo(
                this._to as object,
                {
                    duration: this._options.duration,
                    easing: this._options.easing,
                    start: false,
                }
            );
        } else if (typeof animation.to === "undefined") {
            // @ts-ignore
            return this._target.tweenFrom(
                this._from as object,
                {
                    duration: this._options.duration,
                    easing: this._options.easing,
                    start: false,
                }
            );
        } else {
            // @ts-ignore
            return this._target.tween(
                this._from as object,
                this._to as object,
                {
                    duration: this._options.duration,
                    easing: this._options.easing,
                    start: false,
                }
            );
        }
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
}

/**
 * An AnimationGroup can hold 0-n Animations
 *
 * @extends Animation
 *
 * @member {Observable<Array<Tween>>} onStart
 * @member {Observable<Array<Tween>>} onStop
 * @member {Observable<Array<Tween>>} onFinish
 * @property {Observable<Array<Tween>>} test
 */
export class AnimationGroup extends Animation {
    // Observables
    protected _onStart$: Subject<Array<Tween>> = new Subject<Array<Tween>>();
    protected _onStop$: Subject<Array<Tween>> = new Subject<Array<Tween>>();
    protected _onFinish$: Subject<Array<Tween>> = new Subject<Array<Tween>>();
    protected _onUpdate$: Subject<AnimationProgress> = new Subject<AnimationProgress>();
    private _onUpdateGroup$: Subject<AnimationProgress> = new Subject<AnimationProgress>();

    // Child observables
    private readonly _onStartChildren: Array<Observable<Tween>>;
    private readonly _onStopChildren: Array<Observable<Tween>>;
    private readonly _onFinishChildren: Array<Observable<Tween>>;
    private readonly _onUpdateChildren: Array<Observable<AnimationProgress>>;

    // Data
    private _animations: Array<IAnimation>;

    /**
     * Group Constructor
     *
     * @constructor
     * @param {Array<IAnimation>} [animations]
     */
    public constructor(...animations: Array<IAnimation>) {
        super();
        this._onStartChildren = new Array<Observable<Tween>>();
        this._onStopChildren = new Array<Observable<Tween>>();
        this._onFinishChildren = new Array<Observable<Tween>>();
        this._onUpdateChildren = new Array<Observable<AnimationProgress>>();

        if (animations.length > 0) {
            this._animations = animations;
            this._animations.forEach(this.addObservables);
            this.subscribeSubjects();
        } else {
            this._animations = new Array<IAnimation>();
        }
    }

    /**
     * Observable which emits if the animation starts
     *
     * @return {Observable<Array<Tween>>}
     */
    public get onStart$(): Observable<Array<Tween>> {
        return this._onStart$.asObservable();
    }

    /**
     * Observable which emits if the animation stops
     *
     * @return {Observable<Array<Tween>>}
     */
    public get onStop$(): Observable<Array<Tween>> {
        return this._onStop$.asObservable();
    }

    /**
     * Observable which emits after the animation finishes
     *
     * @return {Observable<Array<Tween>>}
     */
    public get onFinish$(): Observable<Array<Tween>> {
        return this._onFinish$.asObservable();
    }

    /**
     * Observable which emits the animation progress
     *
     * @return {Observable<AnimationProgress>}
     */
    public get onUpdate$(): Observable<AnimationProgress> {
        return this._onUpdate$.asObservable();
    }

    /**
     * Calculates the average progress from all running animations
     *
     * @return {Observable<AnimationProgress>}
     */
    public get onUpdateGroup$(): Observable<AnimationProgress> {
        return this._onUpdateGroup$.asObservable();
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
                animation.easing = typeof this._options.easing === "function" ? this._options.easing : Tween.easings[this._options.easing];

            }

            this._animations.push(animation);
            this.addObservables(animation);
        });
    }

    /**
     * Clears all animations from the group and resets the subjects
     */
    public reset(): void {
        this.resetChildren();
        this.resetSubjects();
    }

    /**
     * @see {reset}
     */
    private resetChildren(): void {
        this._animations.length = 0;

        this._onStartChildren.length = 0;
        this._onStopChildren.length = 0;
        this._onUpdateChildren.length = 0;
        this._onFinishChildren.length = 0;
    }

    /**
     * @see {reset}
     */
    private resetSubjects(): void {
        this._onStart$ = new Subject<Array<Tween>>();
        this._onStop$ = new Subject<Array<Tween>>();
        this._onFinish$ = new Subject<Array<Tween>>();
        this._onUpdate$ = new Subject<AnimationProgress>();
        this._onUpdateGroup$ = new Subject<AnimationProgress>();
    }

    /**
     * Start all animations
     */
    public start(): void {
        this.subscribeSubjects();

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
    public remove(item: Item): void {
        this._animations = this._animations.filter((animation: IAnimation): boolean => {
            return animation.target !== item;
        });
    }

    /**
     * Pushes the child's observables to the group
     *
     * @param {IAnimation} animation
     */
    private addObservables(animation: IAnimation): void {
        this._onStartChildren.push(animation.onStart$);
        this._onStopChildren.push(animation.onStop$);
        this._onFinishChildren.push(animation.onFinish$);
        this._onUpdateChildren.push(animation.onUpdate$ as Observable<AnimationProgress>);
    }

    /**
     * Subscribes the public subjects to the added child events
     */
    private subscribeSubjects(): void {
        // forkJoin = Emit after every Observable emits one
        forkJoin(this._onStartChildren).subscribe(this._onStart$);

        forkJoin(this._onStopChildren).subscribe(this._onStop$);

        forkJoin(this._onFinishChildren).subscribe(this._onFinish$);

        from(this._onUpdateChildren).pipe(mergeAll()).subscribe(this._onUpdate$);

        combineLatest(this._onUpdateChildren).pipe(
            map((updates: Array<AnimationProgress>): AnimationProgress => {
                return {
                    progress: updates.reduce((progress, next): number => progress + next.progress, 0) / this._onUpdateChildren.length,
                    factor: updates.reduce((factor, next): number => factor + next.factor, 0) / this._onUpdateChildren.length,
                };
            })
        ).subscribe(this._onUpdateGroup$);
    }
}
