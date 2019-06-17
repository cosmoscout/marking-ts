import Angle from "../angle";

const rad = Angle.toRad;
const deg = Angle.toDeg;

/**
 * Test Radians to Degree Conversion
 */
test('Angle: toDeg', () => {
    expect(deg(Angle.HALF_CIRCLE_RAD)).toBe(Angle.HALF_CIRCLE_DEG);
    expect(deg(Angle.FULL_CIRCLE_RAD)).toBe(Angle.FULL_CIRCLE_DEG);

    expect(deg(Angle.HALF_CIRCLE_RAD / 2)).toBe(Angle.HALF_CIRCLE_DEG / 2);
    expect(deg(Angle.HALF_CIRCLE_RAD / 4)).toBe(Angle.HALF_CIRCLE_DEG / 4);
});

/**
 * Test Degree to Radians Conversion
 */
test('Angle: toRad', () => {
    expect(rad(Angle.HALF_CIRCLE_DEG)).toBe(Angle.HALF_CIRCLE_RAD);
    expect(rad(Angle.FULL_CIRCLE_DEG)).toBe(Angle.FULL_CIRCLE_RAD);

    expect(rad(Angle.HALF_CIRCLE_DEG / 2)).toBe(Angle.HALF_CIRCLE_RAD / 2);
    expect(rad(Angle.HALF_CIRCLE_DEG / 4)).toBe(Angle.HALF_CIRCLE_RAD / 4);
});

/**
 * Test Calculation of Angle difference
 */
test('Angle: difference', () => {
    // 180° - 0° = 180° (Smallest Angle)
    expect(Angle.difference(Angle.HALF_CIRCLE_RAD, 0)).toBe(Angle.HALF_CIRCLE_RAD);
    // 180° - 0° = 180° (Biggest Angle)
    expect(Angle.difference(Angle.HALF_CIRCLE_RAD, 0, true)).toBe(Angle.HALF_CIRCLE_RAD);

    // 180° - 360° = 180° (Smallest Angle)
    expect(Angle.difference(Angle.HALF_CIRCLE_RAD, Angle.FULL_CIRCLE_RAD)).toBe(Angle.HALF_CIRCLE_RAD);
    // 180° - 360° = 180° (Biggest Angle)
    expect(Angle.difference(Angle.HALF_CIRCLE_RAD, Angle.FULL_CIRCLE_RAD, true)).toBe(Angle.HALF_CIRCLE_RAD);

    // 45° - 90° = 45° (Smallest Angle)
    expect(Angle.difference(Angle.HALF_CIRCLE_RAD / 4, Angle.HALF_CIRCLE_RAD / 2)).toBe(Angle.HALF_CIRCLE_RAD / 4);
    // 45° - 90° = 315° (Biggest Angle)
    expect(Angle.difference(Angle.HALF_CIRCLE_RAD / 4, Angle.HALF_CIRCLE_RAD / 2, true)).toBe(rad(315));

    // 0° - 1° = 1° (Smallest Angle)
    expect(Angle.difference(rad(0), rad(1))).toBe(rad(1));
    // 0° - 1° = 359° (Biggest Angle)
    expect(Angle.difference(rad(0), rad(1), true)).toBe(rad(359));

    // 0° - 0° = 0° (Smallest Angle)
    expect(Angle.difference(rad(0), rad(0))).toBe(rad(0));
    // 0° - 0° = 360° (Biggest Angle)
    expect(Angle.difference(rad(0), rad(0), true)).toBe(Angle.FULL_CIRCLE_RAD);

    // 360° - 360° = 0° (Smallest Angle)
    expect(Angle.difference(Angle.FULL_CIRCLE_RAD, Angle.FULL_CIRCLE_RAD)).toBe(rad(0));
    // 360° - 360° = 360° (Biggest Angle)
    expect(Angle.difference(Angle.FULL_CIRCLE_RAD, Angle.FULL_CIRCLE_RAD, true)).toBe(Angle.FULL_CIRCLE_RAD);
});

/**
 * Test Calculation of Bisecting Angles
 */
test('Angle: bisecting', () => {
    expect(Angle.bisecting(0, 0)).toBe(0);
    expect(Angle.bisecting(rad(360), rad(360))).toBe(0);


    expect(Angle.bisecting(rad(0), rad(45))).toBe(rad(22.5));
    expect(Angle.bisecting(rad(0), rad(45), true)).toBe(22.5);


    expect(Angle.bisecting(rad(45), rad(0))).toBe(rad(202.5));
    expect(Angle.bisecting(rad(45), rad(0), true)).toBe(202.5);


    expect(Angle.bisecting(rad(0), rad(90))).toBe(rad(45));
    expect(Angle.bisecting(rad(0), rad(90), true)).toBe(45);


    expect(Angle.bisecting(rad(0), rad(180))).toBe(rad(90));
    expect(Angle.bisecting(rad(0), rad(180), true)).toBe(90);


    expect(Angle.bisecting(rad(180), rad(270))).toBe(rad(225));
    expect(Angle.bisecting(rad(270), rad(180))).toBe(rad(45));

    expect(Angle.bisecting(rad(90), rad(90))).toBe(rad(45));
});

/**
 * Test Calculation of X-Coordinate on a Circle
 * 0° = N | 90° = E | 180° = S | 270° = W
 */
test('Angle: toX', () => {
    expect(Angle.toX(0)).toBeCloseTo(0);
    expect(Angle.toX(rad(360))).toBeCloseTo(0);
    expect(Angle.toX(rad(720))).toBeCloseTo(0);

    expect(Angle.toX(rad(90))).toBeCloseTo(1);
    expect(Angle.toX(rad(450))).toBeCloseTo(1);

    expect(Angle.toX(rad(180))).toBeCloseTo(0);
    expect(Angle.toX(rad(540))).toBeCloseTo(0);

    expect(Angle.toX(rad(270))).toBeCloseTo(-1);
    expect(Angle.toX(rad(630))).toBeCloseTo(-1);
});

/**
 * Test Calculation of Y-Coordinate on a Circle
 * 0° = N | 90° = E | 180° = S | 270° = W
 */
test('Angle: toY', () => {
    expect(Angle.toY(0)).toBeCloseTo(-1);
    expect(Angle.toY(rad(360))).toBeCloseTo(-1);
    expect(Angle.toY(rad(720))).toBeCloseTo(-1);

    expect(Angle.toY(rad(90))).toBeCloseTo(0);
    expect(Angle.toY(rad(450))).toBeCloseTo(0);

    expect(Angle.toY(rad(180))).toBeCloseTo(1);
    expect(Angle.toY(rad(540))).toBeCloseTo(1);

    expect(Angle.toY(rad(270))).toBeCloseTo(0);
    expect(Angle.toY(rad(630))).toBeCloseTo(0);
});
