export default class Angle {
  /**
   * Full circle rotation in degrees
   */
  public static readonly FULL_CIRCLE_DEG: number = 360;

  /**
   * Half circle rotation in degrees
   */
  public static readonly HALF_CIRCLE_DEG: number = Angle.FULL_CIRCLE_DEG / 2;

  /**
   * Full circle rotation in radians
   */
  public static readonly FULL_CIRCLE_RAD: number = 2 * Math.PI;

  /**
   * Half circle rotation in radians
   */
  public static readonly HALF_CIRCLE_RAD: number = Angle.FULL_CIRCLE_RAD / 2;

  /**
   * Converts an angle from Radians to Degree
   *
   * @param {number} rad Angle in radians
   * @return {number}
   */
  public static toDeg(rad: number): number {
    return rad * (Angle.HALF_CIRCLE_DEG / Math.PI);
  }

  /**
   *Converts an angle from Degree to Radians
   *
   * @param {number} deg Angle in degrees
   * @return {number}
   */
  public static toRad(deg: number): number {
    return deg * (Math.PI / Angle.HALF_CIRCLE_DEG);
  }

  /**
   * Calculates the difference between two angles
   *
   * @param {number} radAngleA First angle in radians
   * @param {number} radAngleB Second angle in radians
   * @param {boolean} [biggest=false] Return the biggest difference
   * @return {number}
   */
  public static difference(radAngleA: number, radAngleB: number, biggest: boolean = false): number {
    const abs = Math.abs(radAngleA - radAngleB);
    const absReflex = 2 * Math.PI - Math.abs(radAngleA - radAngleB);

    if (biggest) {
      return Math.max(abs, absReflex);
    }

    return Math.min(abs, absReflex);
  }

  /**
   * Calculates the bisecting angle of two angles
   *
   * @param {number} startAngleRad Starting angle in radians
   * @param {number} endAngleRad Ending angle in radians
   * @param {boolean} inDegrees=true Return the angle in degrees
   * @return {number}
   */
  public static bisecting(startAngleRad: number, endAngleRad: number, inDegrees: boolean = false): number {
    // eslint-disable-next-line max-len
    const result = (startAngleRad + Math.abs((endAngleRad < startAngleRad ? Angle.HALF_CIRCLE_RAD : 0) - Math.abs(startAngleRad - endAngleRad) / 2)) % Angle.FULL_CIRCLE_RAD;

    if (inDegrees) {
      return Angle.toDeg(result);
    }

    return result;
  }

  /**
   * Calculates the opposite Angle of an angle
   *  0   - 180
   *  90  - 270
   *  360 - 180
   *  ...
   *
   * @param {number} angleRad Angle in radians
   */
  public static opposite(angleRad: number): number {
    return (Math.PI + angleRad) % (2 * Math.PI);
  }

  /**
   * Returns the x-coordinate of an angle on a circle
   * 0° = N | 90° = E | 180° = S | 270° = W
   *
   * @param {number} rad Angle in radians
   * @param {number} [radius=1] Circle radius
   * @return {number}
   */
  public static toX(rad: number, radius: number = 1): number {
    const result = Math.sin(rad);

    if (Math.abs(result) < Number.EPSILON) {
      return 0;
    }

    return Angle.normalizeNumber(result * radius);
  }

  /**
   * Returns the y-coordinate of an angle on a circle
   * 0° = N | 90° = E | 180° = S | 270° = W
   *
   * @param {number} rad Angle in radians
   * @param {number} [radius=1] Circle radius
   * @return {number}
   */
  public static toY(rad: number, radius: number = 1): number {
    const result = -Math.cos(rad);

    if (Math.abs(result) < Number.EPSILON) {
      return 0;
    }

    return Angle.normalizeNumber(result * radius);
  }

  /**
   * Checks if an angle is between two angles
   *
   * @param {number} angle
   * @param {number} minAngle
   * @param {number} maxAngle
   * @return {boolean} True if angle is between min and max
   */
  public static between(angle: number, minAngle: number, maxAngle: number): boolean {
    if (maxAngle > minAngle) {
      return angle < maxAngle && angle > minAngle;
    }

    return angle > minAngle || angle < maxAngle;
  }

  /**
   * Normalizes a number. Ceils it if < 0; Floors it if > 0
   *
   * @param {number} number
   */
  private static normalizeNumber(number: number): number {
    if (number < 0) {
      return Math.ceil(number);
    }

    return Math.floor(number);
  }
}
