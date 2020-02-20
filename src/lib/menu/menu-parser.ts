import MenuItem from './menu-item';
import Angle from '../../utlis/angle';
import Ribbonslider from './ribbonslider';
import Checkbox from './checkbox';
import RadioGroup from './radio-group';
import { MenuItemDefinition } from '../interfaces/menu-item-definition';

export default class MenuParser {
  /**
   * List of already used menu item ids
   */
  private _itemIds: Map<string, MenuItem> = new Map<string, MenuItem>();

  /**
   * Duplicate ID Set
   */
  private _duplicateIds: Set<string> = new Set<string>();

  /**
   * Parses a JSON Structure to Menu Items
   *
   * @param {MenuItemDefinition} structure
   * @param {MenuItem | null} parent
   * @return {MenuItem}
   */
  public parse(structure: MenuItemDefinition, parent: MenuItem | null = null): MenuItem {
    let item: MenuItem;

    this.checkIds(structure.id);

    if (parent === null) {
      item = new MenuItem(structure.id, structure.direction, structure.text, structure.icon, true);
    } else {
      if (parent instanceof RadioGroup) {
        structure.type = 'checkbox';
      }

      item = MenuParser.parseItem(structure);

      parent.addChild(item);
      MenuParser.checkAngles(item);
    }

    this.map.set(structure.id, item);

    if (typeof structure.children !== 'undefined') {
      structure.children.forEach((child): void => {
        this.parse(child, item);
      });
    }

    return item;
  }

  public static parseItem(structure: MenuItemDefinition): MenuItem {
    let item;

    switch (structure.type) {
      case 'slider':
      case 'ribbonslider':
        item = new Ribbonslider(structure.id, structure.direction, structure.text, structure.icon);
        break;

      case 'checkbox':
        item = new Checkbox(structure.id, structure.direction, structure.text, structure.icon);
        break;

      case 'radiogroup':
      case 'radio-group':
        item = new RadioGroup(structure.id, structure.direction, structure.text, structure.icon);
        break;

      default:
        item = new MenuItem(structure.id, structure.direction, structure.text, structure.icon);
        break;
    }

    if (typeof structure.data !== 'undefined') {
      item.data = structure.data;
    }

    return item;
  }

  /**
   * Parsed menu structure accessible through the item id
   */
  public get map(): Map<string, MenuItem> {
    return this._itemIds;
  }

  /**
   * Flag if parsed structure has duplicate ids
   */
  public hasDuplicateIds(): boolean {
    return this._duplicateIds.size > 0;
  }

  /**
   * Array with found duplicate ids
   */
  public get duplicateIds(): Array<string> {
    return Array.from(this._duplicateIds.values());
  }

  /**
   * Checks if an item id is already in use by another item.
   * Writes a warning to the console
   *
   * @param {string} itemId
   */
  private checkIds(itemId: string): void {
    if (this.map.has(itemId)) {
      this._duplicateIds.add(itemId);
      console.warn(`Menu Item ID '${itemId}' already in use.`);
    }
  }

  /**
   * Checks if item angles clash with back angles.
   * Writes an error to the console
   *
   * @param {MenuItem} item
   */
  private static checkAngles(item: MenuItem): void {
    if (item.parent !== null && item.parent.parent !== null) {
      const { angle } = <MenuItem>item.parent;

      const itemAngleOpposite = Angle.opposite(item.angle);

      if (Math.abs(angle - itemAngleOpposite) < Number.EPSILON) {
        /* eslint-disable-next-line */
        console.error(`Item angle clashes with back angle! Item: ${item.itemId} (${Angle.toDeg(item.angle)}°) | Parent: ${(<MenuItem>item.parent).itemId} (${Angle.toDeg(angle)}°)`);
      }
    }
  }
}
