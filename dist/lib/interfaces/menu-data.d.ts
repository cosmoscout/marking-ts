import { Observable, Subject } from 'rxjs';
import { ClickState } from '../enums';
import Trace from '../../utlis/trace';
import { DragDefinition } from './drag-definition';
import { Input } from './input';
export interface MenuData {
    inputPosition$: Subject<paper.Point>;
    inputPosition: paper.Point;
    inputActivation$: Subject<Input>;
    inputDeactivation$: Subject<Input>;
    dragging$: Observable<DragDefinition>;
    click$: Observable<ClickState>;
    trace$: Trace;
    markingMode: boolean;
    canvas: HTMLCanvasElement;
}
