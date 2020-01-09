import MenuItem from "./menu-item";
import Checkbox from "./checkbox";
import {ItemState, MenuItemEventType} from "../enums";

/**
 * A Radio group contains >=2 Checkboxes of which only one can be active at a given time
 */
export default class RadioGroup extends MenuItem {
    public readonly TYPE = 'radiogroup';

    /**
     * Selects a single child from the radio group
     *
     * @param {string} itemId
     */
    public select(itemId: string) {
        const toSelect = <Checkbox | undefined>this.getChildren().find(item => {
            return item.itemId === itemId;
        });

        if (typeof toSelect === "undefined") {
            return;
        }

        this.deselectChildren();
        toSelect.select();
    }

    /**
     * Deselect all children to ensure only one is active
     *
     * @inheritDoc
     */
    protected changeActive(): void {
        if (this.state !== ItemState.ACTIVE) {
            return;
        }

        this.deselectChildren();

        this.activeChild = this.getNearestChild(this.angleToReferencePoint(this.menu.inputPosition));

        this.state = ItemState.SUBMENU;

        this.menu.trace$.reset();
        if (this.activeChild.isLeaf) {
            if (this.menu.markingMode) {
                this.activeChild.state = ItemState.ACTIVE_SELECTION;
                this.event(MenuItemEventType.HOVER_SELECTION, this.activeChild);
            } else {
                this.activeChild.state = ItemState.SELECTED;
                (<Checkbox>this.activeChild).select();
            }
        }

        this.root.redraw();
    }

    /**
     * Set checkbox state to deselect
     */
    private deselectChildren(): void {
        (<Checkbox[]>this.getChildren()).forEach(child => {
            child.deselect();
        });
    }
}