/* eslint class-methods-use-this: 0 */
/* eslint @typescript-eslint/no-unused-vars: 0 */
/**
 * This class removes the automatic hitTest calls from paper.js as they are not needed
 */
export default class Base extends paper.Group {
  // @ts-ignore
  public hitTestAll(_point: paper.Point, _options?: object): paper.HitResult[] {
    return [];
  }

  // @ts-ignore
  public hitTest(_point: paper.Point, _options?: object): paper.HitResult {
    return new paper.HitResult();
  }

  // @ts-ignore
  public hitTestChildren(): null {
    return null;
  }

  // @ts-ignore
  private _hitTest(): null {
    return null;
  }

  // @ts-ignore
  private _hitTestChildren(): null {
    return null;
  }
}
