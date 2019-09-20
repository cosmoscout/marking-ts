import {MenuItemEventType} from "../enums";
import Angle from "../../utlis/angle";
import {MenuEventDefinition, MenuIdentifier} from "../interfaces";

/**
 * An event object
 */
export default class MenuEvent implements MenuEventDefinition {
    public readonly type: MenuItemEventType;
    public readonly source: MenuIdentifier;
    public readonly target: MenuIdentifier | undefined;
    public readonly data: Record<string, string | number> | undefined;

    /**
     * @constructor
     * @param {MenuItemEventType} type The event type
     * @param {MenuIdentifier} source The source MenuItem
     * @param {MenuIdentifier} [target] The target MenuItem
     * @param data
     * @see {MenuItem}
     */
    public constructor(type: MenuItemEventType, source: MenuIdentifier, target?: MenuIdentifier, data?: Record<string, string | number>) {
        this.type = type;
        this.source = {
            itemId: source.itemId,
            angle: Angle.toDeg(source.angle),
        };

        this.data = data;

        if (typeof target !== "undefined") {
            this.target = {
                itemId: target.itemId,
                angle: Angle.toDeg(target.angle),
            };
        }
    }

    /**
     * Compares two events
     *
     * @param {MenuEventDefinition} [event]
     * @return {boolean}
     */
    public equals(event?: MenuEventDefinition): boolean {
        if (typeof event === "undefined") {
            return false;
        }

        const selectionTypeEquals = event.type === this.type;
        const sourceEquals = event.source.itemId === this.source.itemId;

        let targetEquals = false;
        if (typeof event.target !== "undefined" && typeof this.target !== "undefined") {
            targetEquals = event.target.itemId === this.target.itemId && event.target.angle === this.target.angle;
        } else {
            targetEquals = true;
        }

        return false;

        return selectionTypeEquals && targetEquals && sourceEquals;
    }
}
