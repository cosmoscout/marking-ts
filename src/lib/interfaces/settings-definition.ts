import { SettingsGroup } from '../enums';
import { StrokeSettings } from './stroke-settings';

/**
 * Settings structure
 */
export interface SettingsDefinition {
  /**
   * minDistance: Min distance in px between parent to child
   * minTraceDistance: Min length of a trace in px
   * animationDuration: Animation duration in ms
   * enableMaxClickRadius: True to disable item selection on the whole display
   * enableAutoResize: Flag to automatically resize the canvas to screen size
   * inputTimeout: Time in ms between MouseDown and MouseUp to generate a click event
   */
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
  /**
   * gradientColor: Color of the inner gradient
   * gradientColorSides: Side Colors (Side Color | Gradient Color | Side Color)
   * gradientLength: Gradient Length in px
   * ribbonHeight: Height in px of the ribbon
   * maskStart: Start (0 - 0.49)
   * maskLengthMultiplier: Window width * multiplier = Mask Length
   */
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
