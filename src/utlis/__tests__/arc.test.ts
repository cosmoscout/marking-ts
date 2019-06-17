import Arc from "../arc";
import Angle from "../angle";
import {ArcDefinition} from "../../lib/interfaces";

test('Arc: fromAngles', () => {
    const testAngles = [
        [0, 90, 180, 270],
        [180, 270],
        [0, 180],
        [0, 45, 180],
        [0, 20, 40, 60, 80, 100, 120, 140, 160, 180],
    ];

    const results = [
        [
            [0, 315, 0, 45],
            [90, 45, 90, 135],
            [180, 135, 180, 225],
            [270, 225, 270, 315],
        ],
        [
            [180, 45, 135, 225],
            [270, 225, 315, 45],
        ],
        [
            [0, 270, 0, 90],
            [180, 90, 180, 270],
        ],
        [
            [0, 270, 326.25, 22.5],
            [45, 22.5, 67.5, 112.5],
            [180, 112.5, 191.25, 270],
        ],
        [
            [0, 270, 320, 10],
            [20, 10, 20, 30],
            [40, 30, 40, 50],
            [60, 50, 60, 70],
            [80, 70, 80, 90],
            [100, 90, 100, 110],
            [120, 110, 120, 130],
            [140, 130, 140, 150],
            [160, 150, 160, 170],
            [180, 170, 220, 270],
        ]
    ];

    testAngles.forEach((angles, index) => {
        const transform = angles.map(a => Angle.toRad(a));

        const result = new Array<ArcDefinition>();

        results[index].forEach((val: Array<number>) => {
            result.push({
                origAngle: Angle.toRad(val[0]),
                from: Angle.toRad(val[1]),
                through: Angle.toRad(val[2]),
                to: Angle.toRad(val[3]),
            });
        });

        Arc.fromAngles(transform).forEach((arc, index) => {
            expect(arc.origAngle).toBeCloseTo(result[index].origAngle);
            expect(arc.from).toBeCloseTo(result[index].from);
            expect(arc.through).toBeCloseTo(result[index].through);
            expect(arc.to).toBeCloseTo(result[index].to);
        });
    });
});
