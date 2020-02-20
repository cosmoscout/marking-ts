export default class Base extends paper.Group {
    hitTestAll(_point: paper.Point, _options?: object): paper.HitResult[];
    hitTest(_point: paper.Point, _options?: object): paper.HitResult;
    hitTestChildren(): null;
    private _hitTest;
    private _hitTestChildren;
}
