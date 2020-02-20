import { MenuItemEventType } from '../enums';
import { MenuEventDefinition } from '../interfaces/menu-event-definition';
import { MenuIdentifier } from '../interfaces/menu-identifier';
export default class MenuEvent implements MenuEventDefinition {
    readonly type: MenuItemEventType;
    readonly source: MenuIdentifier;
    readonly target: MenuIdentifier | undefined;
    readonly data: Record<string, string | number | boolean> | undefined;
    constructor(type: MenuItemEventType, source: MenuIdentifier, target?: MenuIdentifier, data?: Record<string, string | number | boolean>);
    equals(event?: MenuEventDefinition): boolean;
}
