import { Observable, Subject } from "rxjs";
import { ClickState, DragState, MenuItemEventType, SettingsGroup } from "./enums";
import Trace from "../utlis/trace";
export interface MenuData {
    inputPosition$: Subject<paper.Point>;
    inputPosition: paper.Point;
    inputActivation$: Subject<Input>;
    inputDeactivation$: Subject<Input>;
    dragging$: Observable<DragDefinition>;
    click$: Observable<ClickState>;
    trace$: Trace;
    markingMode: boolean;
    canvas: HTMLCanvasElement;
}
export interface Input {
    readonly button: number;
    readonly buttons: number;
    readonly x: number;
    readonly y: number;
}
export interface DragDefinition {
    readonly position: paper.Point;
    readonly state: DragState;
}
export interface MenuIdentifier {
    itemId: string;
    angle: number;
}
export interface MenuItemDefinition {
    id: string;
    text: string;
    icon?: string;
    direction: number;
    children?: Array<MenuItemDefinition>;
    type?: string;
    data?: any;
}
export interface MenuEventDefinition {
    type: MenuItemEventType;
    source: MenuIdentifier;
    target?: MenuIdentifier;
    data?: Record<string, string | number | boolean>;
}
export interface AnimationDefinition {
    target: paper.Item;
    from?: AnimatableData;
    to?: AnimatableData;
    options?: AnimationOptions;
}
export interface AnimationOptions {
    duration?: number;
    easing?: string | Function;
}
export interface AnimatableData {
    [key: string]: paper.Point | paper.Color | number | string | null | undefined | Record<string, string | number | paper.Point>;
    position?: paper.Point | number;
    scaling?: paper.Point | number;
    opacity?: number;
    fillColor?: string | paper.Color | null;
}
export interface AnimationProgress {
    id?: number | string;
    progress: number;
    factor: number;
}
export interface SettingsDefinition {
    readonly [SettingsGroup.MAIN]: {
        minDistance: number;
        minTraceDistance: number;
        animationDuration: number;
        enableMaxClickRadius: boolean;
        enableAutoResize: boolean;
        inputTimeout: number;
        canvasId: string;
    };
    readonly [SettingsGroup.GEOMETRY]: {
        size: number;
        sizeDeadZone: number;
        color: string;
        selectionColor: string;
        stroke: StrokeSettings;
        useActionShape: boolean;
        text: {
            color: string;
            selectionColor: string;
        };
        icon: {
            color: string;
            selectionColor: string;
        };
    };
    readonly [SettingsGroup.CHECKBOX]: {
        selectionColor: string;
        selectionColorSelected: string;
        cornerRadius: number;
    };
    readonly [SettingsGroup.RIBBONSLIDER]: {
        gradientColor: string;
        gradientColorSides: string;
        gradientLength: number;
        ribbonHeight: number;
        maskStart: number;
        maskLengthMultiplier: number;
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
export interface StrokeSettings {
    enabled: boolean;
    color: string;
    width: number;
}
export interface ArcDefinition {
    from: number;
    through: number;
    to: number;
    origAngle: number;
}
export interface SliderDefinition {
    min: number;
    max: number;
    initial: number;
    precision: number;
    stepDist: number;
    stepSize?: number;
}
