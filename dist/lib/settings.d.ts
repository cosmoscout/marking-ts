import { SettingsGroup } from './enums';
import { SettingsDefinition } from './interfaces/settings-definition';
export default class Settings implements SettingsDefinition {
    private readonly _defaultSettings;
    private readonly _settings;
    constructor(settings?: Record<string, any> | SettingsDefinition);
    get defaultSettings(): SettingsDefinition;
    get [SettingsGroup.MAIN](): SettingsDefinition[SettingsGroup.MAIN];
    get [SettingsGroup.GEOMETRY](): SettingsDefinition[SettingsGroup.GEOMETRY];
    get [SettingsGroup.CONNECTOR](): SettingsDefinition[SettingsGroup.CONNECTOR];
    get [SettingsGroup.ARC](): SettingsDefinition[SettingsGroup.ARC];
    get [SettingsGroup.SCALES](): SettingsDefinition[SettingsGroup.SCALES];
    get [SettingsGroup.RADII](): SettingsDefinition[SettingsGroup.RADII];
    get [SettingsGroup.CHECKBOX](): SettingsDefinition[SettingsGroup.CHECKBOX];
    get [SettingsGroup.RIBBONSLIDER](): SettingsDefinition[SettingsGroup.RIBBONSLIDER];
    get projectStyle(): Record<string, string | number>;
}
