import Angle from "./angle";
import {Color, Gradient, Path, Point} from "paper";
import {ZERO_POINT} from "../lib/constants";
import ColorFactory from "./color-factory";
import Animation from "./animation";
import {ArcDefinition, SettingsDefinition} from "../lib/interfaces";

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

        angles = angles.sort((a: number, b: number): number => {
            return a - b;
        });

        angles.forEach((angle: number, index: number): void => {
            let prevAngle: number;

            if (index === 0) {
                prevAngle = angles[angles.length - 1];
            } else {
                prevAngle = angles[index - 1];
            }

            const through = Angle.bisecting(prevAngle, angle);

            bisectingAngles.push(through);
        });

        bisectingAngles.forEach((angle: number, index: number): void => {
            let endAngle: number;

            if (index === angles.length - 1) {
                endAngle = bisectingAngles[0];
            } else {
                endAngle = bisectingAngles[index + 1];
            }

            let through = Angle.bisecting(angle, endAngle);

            arcs.push({
                from: angle,
                through: through,
                to: endAngle,
                origAngle: angles[index]
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
    public static fromDefinition(arcDefinition: ArcDefinition, settings: SettingsDefinition): Path.Arc {
        const arcPoint = (angle: number): Point => {
            return new Point(
                Angle.toX(angle, settings.radii.arc),
                Angle.toY(angle, settings.radii.arc)
            );
        };

        const from = arcPoint(arcDefinition.from);
        const through = arcPoint(arcDefinition.through);
        const to = arcPoint(arcDefinition.to);

        let arc = new Path.Arc(from, through, to);

        arc.add(ZERO_POINT);

        arc.data = arcDefinition;
        arc.strokeWidth = 0;
        arc.closed = true;

        let fillColor: Color | Gradient = ColorFactory.fromSettings(settings.arc.color);

        if (fillColor instanceof Color) {
            arc.fillColor = fillColor;
        } else {
            fillColor.radial = settings.arc.radial;
            arc.fillColor = new Color(fillColor, ZERO_POINT, through);
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
    public static arcStroke(to: Point, color: Color, settings: SettingsDefinition): Path.Line {
        const line = new Path.Line(ZERO_POINT, to);
        line.strokeWidth = settings.arc.stroke.width;
        line.scale(1 / 2);
        line.strokeColor = typeof settings.arc.stroke.color === "undefined" ? color : ColorFactory.fromString(settings.arc.stroke.color);

        return line;
    }
}
