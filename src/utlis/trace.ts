import {Point} from 'paper';
import {merge, Observable, Subject} from "rxjs";
import {ZERO_POINT} from "../lib/constants";
import {SettingsDefinition} from "../lib/interfaces";
import {SettingsGroup} from "../lib/enums";

/**
 * Trace class representing a gesture
 */
export default class Trace {
    private static readonly THRESHOLD: number = 30;

    /**
     * Minimum length of a gesture
     *
     * @type {number}
     * @readonly
     */
    private readonly MINIMUM_DISTANCE: number = 100;

    /**
     * Sampling distance
     *
     * @type {number}
     * @readonly
     */
    private readonly SAMPLING_DISTANCE: number = 20;

    /**
     * Threshold angle for 'onDirectionChanged' decision points
     *
     * @type {number}
     * @readonly
     */
    private readonly THRESHOLD_ANGLE: number = Math.PI / Trace.THRESHOLD;

    /**
     * Delay in ms after an 'onStutter' decision point is emitted
     *
     * @type {number}
     * @readonly
     */
    private readonly PAUSE_DELAY: number = 100;

    /**
     * Subject to push decision points onto
     *
     * @type {Subject<Point>}
     * @readonly
     */
    private readonly _onDirectionChanged$: Subject<Point>;

    /**
     * Subject to push decision points onto
     *
     * @type {Subject<Point>}
     * @readonly
     */
    private readonly _onStutter$: Subject<Point>;

    /**
     * Array containing all stroke points
     *
     * @type Array<Point>
     */
    private _stroke: Array<Point>;

    /**
     * Timeout ID for onStutter
     *
     * @type {number}
     */
    private _timoutId: NodeJS.Timeout | undefined;

    /**
     * @constructor
     */
    public constructor(settings: SettingsDefinition) {
        this._stroke = Array<Point>();
        this._onDirectionChanged$ = new Subject<Point>();
        this._onStutter$ = new Subject<Point>();
        this.MINIMUM_DISTANCE = settings[SettingsGroup.MAIN].minTraceDistance;
    }

    /**
     * Combination Observable of 'onStutter' and 'onDirectionChanged'
     *
     * @see {_onStutter$}
     * @see {_onDirectionChanged$}
     * @return {Observable<Point>}
     */
    public get onDecisionPoint$(): Observable<Point> {
        return merge(
            this.onStutter$,
            this.onDirectionChanged$
        );
    }

    /**
     * 'onStutter' Observable
     *
     * @see {_onStutter$}
     * @return {Observable<Point>}
     */
    public get onStutter$(): Observable<Point> {
        return this._onStutter$.asObservable();
    }

    /**
     * 'onDirectionChanged' Observable
     *
     * @see {_onDirectionChanged$}
     * @return {Observable<Point>}
     */
    public get onDirectionChanged$(): Observable<Point> {
        return this._onDirectionChanged$.asObservable();
    }

    /**
     * Resets the stroke array
     */
    public reset(): void {
        this._stroke = Array<Point>();
    }

    /**
     * Updates the gesture with a new position point
     *
     * @param {Point} position
     */
    public update(position: Point): void {
        if (this._stroke.length == 0) {
            this._stroke.push(position);

            return;
        }

        const lastPosition = this._stroke[this._stroke.length - 1];
        let dist: number = position.getDistance(lastPosition);

        if (dist > this.SAMPLING_DISTANCE) {
            const insertSamples: number = dist / this.SAMPLING_DISTANCE;
            const last = this._stroke[this._stroke.length - 1];

            if (typeof this._timoutId === "object") {
                clearTimeout(this._timoutId);
                delete this._timoutId;
            }

            for (let i = 1; i <= dist / this.SAMPLING_DISTANCE; ++i) {
                let t: number = i / insertSamples;
                this._stroke.push(new Point(t * position.x + (1 - t) * last.x, t * position.y + (1 - t) * last.y));
            }

            const strokes = this._stroke.length;

            this._timoutId = setTimeout((): void => {
                if (strokes === this._stroke.length && position.getDistance(this._stroke[0]) > this.MINIMUM_DISTANCE) {
                    this._onStutter$.next(position);
                    this.reset();
                }
            }, this.PAUSE_DELAY);
        }

        if (this._stroke.length >= 2) {
            const angle: number = Trace.angle(this.getStrokeDirection(), position.subtract(this._stroke[0]));

            if (angle > this.THRESHOLD_ANGLE && position.getDistance(this._stroke[0]) > this.MINIMUM_DISTANCE) {
                this._onDirectionChanged$.next(lastPosition);
                this.reset();
            }
        }
    }

    /**
     * Calculates the normalized direction of the stroke
     *
     * @return {Point}
     */
    private getStrokeDirection(): Point {
        return this._stroke.reduce((total: Point, current: Point, currentIndex: number): Point => {
            if (currentIndex > 0) {
                total.x += current.x / (this._stroke.length - 1);
                total.y += current.y / (this._stroke.length - 1);
            }

            return total;
        }, ZERO_POINT.clone()).subtract(this._stroke[0]);
    }

    /**
     * Calculates the angle of two points
     *
     * @param {Point} p1
     * @param {Point} p2
     */
    private static angle(p1: Point, p2: Point): number {
        return Math.acos(p1.dot(p2) / (p1.length * p2.length));
    }
}
