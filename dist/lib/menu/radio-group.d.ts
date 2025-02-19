import MenuItem from './menu-item';
import { MenuItemDefinition } from '../interfaces/menu-item-definition';
export default class RadioGroup extends MenuItem {
    readonly TYPE = "radiogroup";
    select(itemId: string): void;
    toJSON(): MenuItemDefinition;
    protected changeActive(): void;
    private deselectChildren;
}
