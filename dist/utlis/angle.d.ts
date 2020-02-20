export default class Angle {
    static readonly FULL_CIRCLE_DEG: number;
    static readonly HALF_CIRCLE_DEG: number;
    static readonly FULL_CIRCLE_RAD: number;
    static readonly HALF_CIRCLE_RAD: number;
    static toDeg(rad: number): number;
    static toRad(deg: number): number;
    static difference(radAngleA: number, radAngleB: number, biggest?: boolean): number;
    static bisecting(startAngleRad: number, endAngleRad: number, inDegrees?: boolean): number;
    static opposite(angleRad: number): number;
    static toX(rad: number, radius?: number): number;
    static toY(rad: number, radius?: number): number;
    static between(angle: number, minAngle: number, maxAngle: number): boolean;
    private static normalizeNumber;
}
