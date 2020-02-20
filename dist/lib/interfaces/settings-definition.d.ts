import { SettingsGroup } from '../enums';
import { StrokeSettings } from './stroke-settings';
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
