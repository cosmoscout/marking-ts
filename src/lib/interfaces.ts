import {Observable, Subject} from "rxjs";
import {Color, Item, Point} from "paper";
import {ClickState, DragState, MenuItemEventType, SettingsGroup} from "./enums";
import Trace from "../utlis/trace";

/**
 * Menu data on the main Menu class
 *
 * @see {Menu}
 */
export interface MenuData {
    inputPosition$: Subject<Point>;
    inputPosition: Point;
    inputActivation$: Subject<Input>;
    inputDeactivation$: Subject<Input>;

    dragging$: Observable<DragDefinition>;

    click$: Observable<ClickState>;

    trace$: Trace;

    markingMode: boolean;
}

/**
 * Input device data
 */
export interface Input {
    readonly button: number;
    readonly buttons: number;
    readonly x: number;
    readonly y: number;
}

/**
 * DragDefinition state data
 */
export interface DragDefinition {
    readonly position: Point;
    readonly state: DragState;
}


/**
 * Identifying information of a menu item
 */
export interface MenuIdentifier {
    itemId: string;
    angle: number;
}

/**
 * JSON Structure for a MenuItem
 */
export interface MenuItemDefinition {
    id: string;
    text: string;
    icon?: string;
    direction: number;
    children?: Array<MenuItemDefinition>;
    type?: string;
}


/**
 * MenuEventDefinition object Interface
 */
export interface MenuEventDefinition {
    type: MenuItemEventType;
    source: MenuIdentifier;
    target?: MenuIdentifier;
    data?: Record<string, string | number>;
}


/**
 * Animation Definition
 * target - The target object to animate
 * from - From state
 * to - To state
 */
export interface AnimationDefinition {
    target: Item;
    from?: AnimatableData;
    to?: AnimatableData;
    options?: AnimationOptions;
}

/**
 * Animation Options
 */
export interface AnimationOptions {
    duration?: number;
    easing?: string | Function;
}

/**
 * Animatable Data
 */
export interface AnimatableData {
    [key: string]: Point | Color | number | string | null | undefined | Record<string, string | number | Point>;

    position?: Point | number;
    scaling?: Point | number;
    opacity?: number;
    fillColor?: string | Color | null;
}

/**
 * Animation Progress
 */
export interface AnimationProgress {
    id?: number | string;
    progress: number;
    factor: number;
}


/**
 * Settings structure
 */
export interface SettingsDefinition {
    readonly [SettingsGroup.MAIN]: {
        minDistance: number;
        minTraceDistance: number;
        animationDuration: number;
        enableMaxClickRadius: boolean;
    };
    readonly [SettingsGroup.GEOMETRY]: {
        size: number;
        color: string;
        selectionColor: string;
        stroke: StrokeSettings;
        text: {
            color: string;
        };
        icon: {
            color: string;
        };
    };
    readonly [SettingsGroup.CONNECTOR]: {
        enabled: boolean;
        color: string;
        width: number;
    };
    readonly [SettingsGroup.ARC]: {
        enabled: boolean;
        color: Array<string | Array<string | number>> | string;
        radial: boolean;
        stroke: {
            enabled: boolean;
            color?: string;
            width: number;
        };
    };
    readonly [SettingsGroup.SCALES]: {
        parent: number;
        child: number;
        dot: number;
        icon: {
            base: number;
            solo: number;
            child: number;
        };
    };
    readonly [SettingsGroup.RADII]: {
        child: number;
        dot: number;
        arc: number;
        maxClickRadius: number;
    };
}

/**
 * Stroke settings
 */
export interface StrokeSettings {
    enabled: boolean;
    color: string;
    width: number;
}


/**
 * Arc definition
 */
export interface ArcDefinition {
    from: number;
    through: number;
    to: number;
    origAngle: number;
}
