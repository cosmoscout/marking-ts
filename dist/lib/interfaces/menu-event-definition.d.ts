import { MenuItemEventType } from '../enums';
import { MenuIdentifier } from './menu-identifier';
export interface MenuEventDefinition {
    type: MenuItemEventType;
    source: MenuIdentifier;
    target?: MenuIdentifier;
    data?: Record<string, string | number | boolean>;
}
