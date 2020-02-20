import { Observable } from "rxjs";
import { SettingsDefinition } from "../lib/interfaces";
export default class Trace {
    private static readonly THRESHOLD;
    private readonly MINIMUM_DISTANCE;
    private readonly SAMPLING_DISTANCE;
    private readonly THRESHOLD_ANGLE;
    private readonly PAUSE_DELAY;
    private readonly _onDirectionChanged$;
    private readonly _onStutter$;
    private _stroke;
    private _timoutId;
    constructor(settings: SettingsDefinition);
    get onDecisionPoint$(): Observable<paper.Point>;
    get onStutter$(): Observable<paper.Point>;
    get onDirectionChanged$(): Observable<paper.Point>;
    reset(): void;
    update(position: paper.Point): void;
    private getStrokeDirection;
    private static angle;
}
