import mergeWith from 'lodash/mergeWith';
import isArray from 'lodash/isArray';
import {SettingsGroup} from "./enums";
import {SettingsDefinition} from "./interfaces";

/**
 * Class containing default settings
 *
 * @see {SettingsDefinition}
 */
export default class Settings implements SettingsDefinition {
    private readonly _defaultSettings: SettingsDefinition = {
        [SettingsGroup.MAIN]: {
            minDistance: 150,
            minTraceDistance: 175,
            animationDuration: 250,
            enableMaxClickRadius: true,
        },
        [SettingsGroup.GEOMETRY]: {
            size: 50,
            sizeDeadZone: 25,
            color: '#575859',
            selectionColor: '#577a85',
            stroke: {
                enabled: true,
                color: 'rgba(62, 62, 64, 1.0)',
                width: 2,
            },
            useActionShape: true,
            text: {
                color: '#fff',
            },
            icon: {
                color: '#fff',
            }
        },
        [SettingsGroup.CHECKBOX]: {
            selectionColor: '#529b1e',
            cornerRadius: 25,
        },
        [SettingsGroup.RIBBONSLIDER]: {
            gradientColor: 'rgba(62, 62, 64, 1.0)',
            gradientColorSides: 'rgba(32, 32, 32, 0)',
            maskStart: 0.1,
            maskLengthMultiplier: 0.6,
            gradientLength: 150,
            ribbonHeight: 60,
        },
        [SettingsGroup.CONNECTOR]: {
            enabled: true,
            color: '#393a3c',
            width: 10,
        },
        [SettingsGroup.ARC]: {
            enabled: true,
            color: [
                ['#575859', 0.15],
                ['rgba(87, 122, 133, 0.5)', 0.5],
                ['rgba(74, 159, 158, 0.15)', 0.8],
                'rgba(87, 88, 89, 0)'
            ],
            radial: true,
            stroke: {
                enabled: true,
                width: 1,
            }
        },
        [SettingsGroup.SCALES]: {
            parent: 0.5,
            child: 0.5,
            dot: 0.15,
            icon: {
                base: 0.0625,
                solo: 1.6,
                child: 0.7,
            }
        },
        [SettingsGroup.RADII]: {
            child: 100,
            dot: 25,
            arc: 300,
            maxClickRadius: 450,
        }
    };

    private readonly _settings: SettingsDefinition;

    public constructor(settings: Record<string, any> | SettingsDefinition = {}) {
        const mergeCopyArrays = (objValue: any, srcValue: any) => {
            if (isArray(objValue)) {
                return srcValue;
            }
        };

        this._settings = mergeWith(this._defaultSettings, settings, mergeCopyArrays);
    }

    public get defaultSettings(): SettingsDefinition {
        return this._defaultSettings;
    }

    public get [SettingsGroup.MAIN](): SettingsDefinition[SettingsGroup.MAIN] {
        return this._settings[SettingsGroup.MAIN];
    }

    public get [SettingsGroup.GEOMETRY](): SettingsDefinition[SettingsGroup.GEOMETRY] {
        return this._settings[SettingsGroup.GEOMETRY];
    }

    public get [SettingsGroup.CONNECTOR](): SettingsDefinition[SettingsGroup.CONNECTOR] {
        return this._settings[SettingsGroup.CONNECTOR];
    }

    public get [SettingsGroup.ARC](): SettingsDefinition[SettingsGroup.ARC] {
        return this._settings[SettingsGroup.ARC];
    }

    public get [SettingsGroup.SCALES](): SettingsDefinition[SettingsGroup.SCALES] {
        return this._settings[SettingsGroup.SCALES];
    }

    public get [SettingsGroup.RADII](): SettingsDefinition[SettingsGroup.RADII] {
        return this._settings[SettingsGroup.RADII];
    }

    public get [SettingsGroup.CHECKBOX](): SettingsDefinition[SettingsGroup.CHECKBOX] {
        return this._settings[SettingsGroup.CHECKBOX];
    }

    public get [SettingsGroup.RIBBONSLIDER](): SettingsDefinition[SettingsGroup.RIBBONSLIDER] {
        return this._settings[SettingsGroup.RIBBONSLIDER];
    }

    public get projectStyle(): Record<string, string | number> {
        return {
            fillColor: this.geometry.color,
            strokeColor: this.geometry.stroke.color,
            strokeWidth: this.geometry.stroke.enabled ? this.geometry.stroke.width : 0,
        };
    }
}
