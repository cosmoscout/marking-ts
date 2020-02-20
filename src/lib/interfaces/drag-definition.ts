import { DragState } from '../enums';

/**
 * DragDefinition state data
 */
export interface DragDefinition {
  readonly position: paper.Point;
  readonly state: DragState;
}
