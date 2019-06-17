import MenuItem from "./menu-item";
import Angle from "../../utlis/angle";
import {MenuItemDefinition} from "../interfaces";
import Slider from "./slider";

export default class MenuParser {
    /**
     * List of already used menu item ids
     */
    private static itemIds: Map<string, MenuItem> = new Map<string, MenuItem>();

    /**
     * Parses a JSON Structure to Menu Items
     *
     * @param {MenuItemDefinition} structure
     * @param {MenuItem | null} [parent]
     * @return {MenuItem}
     */
    public static parse(structure: MenuItemDefinition, parent: MenuItem | null = null): MenuItem {
        let item: MenuItem;

        MenuParser.checkIds(structure.id);

        if (parent === null) {
            item = new MenuItem(structure.id, structure.direction, structure.text, structure.icon ? structure.icon : undefined, true);
        } else {
            if (typeof structure.type === "undefined") {
                item = new MenuItem(structure.id, structure.direction, structure.text, structure.icon ? structure.icon : undefined);
            } else {
                item = new Slider(structure.id, structure.direction, structure.text, structure.icon ? structure.icon : undefined);
            }
            parent.addChild(item);
            MenuParser.checkAngles(item);
        }

        MenuParser.itemIds.set(structure.id, item);

        structure.children && structure.children.forEach((child): void => {
            MenuParser.parse(child, item);
        });

        return item;
    }

    /**
     * Checks if an item id is already in use by another item.
     * Writes a warning to the console
     *
     * @param {string} itemId
     */
    private static checkIds(itemId: string): void {
        if (MenuParser.itemIds.has(itemId)) {
            const item = MenuParser.itemIds.get(itemId) as MenuItem;
            console.warn(`Menu Item ID '${itemId}' already in use by Menu Item '${item.itemId}' with Parent '${(item.parent as MenuItem).itemId}'.`);
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
            const angle = (item.parent as MenuItem).angle;

            const itemAngleOpposite = Angle.opposite(item.angle);

            if (Math.abs(angle - itemAngleOpposite) < Number.EPSILON) {
                console.error(`Item angle clashes with back angle! Item: ${item.itemId} (${Angle.toDeg(item.angle)}°) | Parent: ${(item.parent as MenuItem).itemId} (${Angle.toDeg(angle)}°)`);
            }
        }
    }
}
