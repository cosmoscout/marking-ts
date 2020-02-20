export default class Base extends paper.Group {
    hitTestAll(point: paper.Point, options?: object): paper.HitResult[];
    hitTest(point: paper.Point, options?: object): paper.HitResult;
    hitTestChildren(): null;
    private _hitTest;
    private _hitTestChildren;
}
