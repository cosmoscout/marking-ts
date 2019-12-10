import {Group} from 'paper';

/**
 * This class removes the automatic hitTest calls from paper.js as they are not needed
 */
export default class Base extends Group {
    //@ts-ignore
    public hitTestAll(point: paper.Point, options?: object): paper.HitResult[] {
        return [];
    }

    //@ts-ignore
    public hitTest(point: paper.Point, options?: object): paper.HitResult {
        return undefined;
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