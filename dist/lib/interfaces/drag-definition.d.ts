import { DragState } from '../enums';
export interface DragDefinition {
    readonly position: paper.Point;
    readonly state: DragState;
}
