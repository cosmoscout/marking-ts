import Angle from './angle';
import { ZERO_POINT } from '../lib/constants';
import ColorFactory from './color-factory';
import Animation from './animation';
import { ArcDefinition } from '../lib/interfaces/arc-definition';
import { SettingsDefinition } from '../lib/interfaces/settings-definition';

export default class Arc {
  /**
   * Create ArcDefinition definitions from given angles.
   * Calculates From - Through - To angles
   *
   * @param {Array<number>} angles Array Angles
   *
   * @return {Array<ArcDefinition>}
   */
  public static fromAngles(angles: Array<number>): Array<ArcDefinition> {
    const arcs: Array<ArcDefinition> = new Array<ArcDefinition>();
    const bisectingAngles: Array<number> = new Array<number>();

    const returnAngles = angles.sort((a: number, b: number): number => a - b);

    returnAngles.forEach((angle: number, index: number): void => {
      let prevAngle: number;

      if (index === 0) {
        prevAngle = returnAngles[returnAngles.length - 1];
      } else {
        prevAngle = returnAngles[index - 1];
      }

      const through = Angle.bisecting(prevAngle, angle);

      bisectingAngles.push(through);
    });

    bisectingAngles.forEach((angle: number, index: number): void => {
      let endAngle: number;

      if (index === returnAngles.length - 1) {
        [endAngle] = bisectingAngles;
      } else {
        endAngle = bisectingAngles[index + 1];
      }

      const through = Angle.bisecting(angle, endAngle);

      arcs.push({
        from: angle,
        through,
        to: endAngle,
        origAngle: returnAngles[index],
      });
    });

    return arcs;
  }

  /**
   * Create Arc from arc definition
   *
   * @param {ArcDefinition} arcDefinition Arc definition
   * @param {SettingsDefinition} settings
   */
  public static fromDefinition(arcDefinition: ArcDefinition, settings: SettingsDefinition): paper.Path.Arc {
    const arcPoint = (angle: number): paper.Point => new paper.Point(
      Angle.toX(angle, settings.radii.arc),
      Angle.toY(angle, settings.radii.arc),
    );

    const from = arcPoint(arcDefinition.from);
    const through = arcPoint(arcDefinition.through);
    const to = arcPoint(arcDefinition.to);

    const arc = new paper.Path.Arc(from, through, to);

    arc.add(ZERO_POINT);

    arc.data = arcDefinition;
    arc.strokeWidth = 0;
    arc.closed = true;

    const fillColor: paper.Color | paper.Gradient = ColorFactory.fromSettings(settings.arc.color);

    if (fillColor instanceof paper.Color) {
      arc.fillColor = fillColor;
    } else {
      fillColor.radial = settings.arc.radial;
      arc.fillColor = new paper.Color(fillColor, ZERO_POINT, through);
    }

    arc.opacity = 0;
    arc.data.fx = new Animation();

    return arc;
  }

  /**
   * Creates a small stroke line
   *
   * @param {Point} to End Point
   * @param {Color} color Stroke Color
   * @param settings
   */
  public static arcStroke(to: paper.Point, color: paper.Color, settings: SettingsDefinition): paper.Path.Line {
    const line = new paper.Path.Line(ZERO_POINT, to);
    line.strokeWidth = settings.arc.stroke.width;
    line.scale(1 / 2);
    // eslint-disable-next-line max-len
    line.strokeColor = typeof settings.arc.stroke.color === 'undefined' ? color : ColorFactory.fromString(settings.arc.stroke.color);

    return line;
  }
}
