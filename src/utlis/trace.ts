import { merge, Observable, Subject } from 'rxjs';
import * as paper from 'paper';
import { ZERO_POINT } from '../lib/constants';
import { SettingsGroup } from '../lib/enums';
import { SettingsDefinition } from '../lib/interfaces/settings-definition';

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
   * @type {Subject<paper.Point>}
   * @readonly
   */
  private readonly _onDirectionChanged$: Subject<paper.Point>;

  /**
   * Subject to push decision points onto
   *
   * @type {Subject<paper.Point>}
   * @readonly
   */
  private readonly _onStutter$: Subject<paper.Point>;

  /**
   * Array containing all stroke points
   *
   * @type Array<paper.Point>
   */
  private _stroke: Array<paper.Point>;

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
    this._stroke = Array<paper.Point>();
    this._onDirectionChanged$ = new Subject<paper.Point>();
    this._onStutter$ = new Subject<paper.Point>();
    this.MINIMUM_DISTANCE = settings[SettingsGroup.MAIN].minTraceDistance;
  }

  /**
   * Combination Observable of 'onStutter' and 'onDirectionChanged'
   *
   * @see {_onStutter$}
   * @see {_onDirectionChanged$}
   * @return {Observable<paper.Point>}
   */
  public get onDecisionPoint$(): Observable<paper.Point> {
    return merge(
      this.onStutter$,
      this.onDirectionChanged$,
    );
  }

  /**
   * 'onStutter' Observable
   *
   * @see {_onStutter$}
   * @return {Observable<paper.Point>}
   */
  public get onStutter$(): Observable<paper.Point> {
    return this._onStutter$.asObservable();
  }

  /**
   * 'onDirectionChanged' Observable
   *
   * @see {_onDirectionChanged$}
   * @return {Observable<paper.Point>}
   */
  public get onDirectionChanged$(): Observable<paper.Point> {
    return this._onDirectionChanged$.asObservable();
  }

  /**
   * Resets the stroke array
   */
  public reset(): void {
    this._stroke = Array<paper.Point>();
  }

  /**
   * Updates the gesture with a new position point
   *
   * @param {paper.Point} position
   */
  public update(position: paper.Point): void {
    if (this._stroke.length === 0) {
      this._stroke.push(position);

      return;
    }

    const lastPosition = this._stroke[this._stroke.length - 1];
    const dist: number = position.getDistance(lastPosition);

    if (dist > this.SAMPLING_DISTANCE) {
      const insertSamples: number = dist / this.SAMPLING_DISTANCE;
      const last = this._stroke[this._stroke.length - 1];

      if (typeof this._timoutId === 'object') {
        clearTimeout(this._timoutId);
        delete this._timoutId;
      }

      for (let i = 1; i <= dist / this.SAMPLING_DISTANCE; i += 1) {
        const t: number = i / insertSamples;
        this._stroke.push(
          new paper.Point(
            t * (position.x as number) + (1 - t) * (last.x as number),
            t * (position.y as number) + (1 - t) * (last.y as number),
          ),
        );
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
   * @return {paper.Point}
   */
  private getStrokeDirection(): paper.Point {
    return this._stroke.reduce((total: paper.Point, current: paper.Point, currentIndex: number): paper.Point => {
      if (currentIndex > 0) {
        (total.x as number) += (current.x as number) / (this._stroke.length - 1);
        (total.y as number) += (current.y as number) / (this._stroke.length - 1);
      }

      return total;
    }, ZERO_POINT.clone()).subtract(this._stroke[0]);
  }

  /**
   * Calculates the angle of two points
   *
   * @param {paper.Point} p1
   * @param {paper.Point} p2
   */
  private static angle(p1: paper.Point, p2: paper.Point): number {
    return Math.acos(p1.dot(p2) / ((p1.length as number) * (p2.length as number)));
  }
}
