import MenuItem from './menu-item';
import { MenuItemDefinition } from '../interfaces/menu-item-definition';
export default class MenuParser {
    private _itemIds;
    private _duplicateIds;
    parse(structure: MenuItemDefinition, parent?: MenuItem | null): MenuItem;
    static parseItem(structure: MenuItemDefinition): MenuItem;
    get map(): Map<string, MenuItem>;
    hasDuplicateIds(): boolean;
    get duplicateIds(): Array<string>;
    private checkIds;
    private static checkAngles;
}
