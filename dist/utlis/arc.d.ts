import { ArcDefinition } from '../lib/interfaces/arc-definition';
import { SettingsDefinition } from '../lib/interfaces/settings-definition';
export default class Arc {
    static fromAngles(angles: Array<number>): Array<ArcDefinition>;
    static fromDefinition(arcDefinition: ArcDefinition, settings: SettingsDefinition): paper.Path.Arc;
    static arcStroke(to: paper.Point, color: paper.Color, settings: SettingsDefinition): paper.Path.Line;
}
