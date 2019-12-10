import MenuItem from "./menu-item";
import Checkbox from "./checkbox";
import {ItemState, MenuItemEventType} from "../enums";

export default class RadioGroup extends MenuItem {
    protected changeActive(): void {
        if (this.state !== ItemState.ACTIVE) {
            return;
        }

        (<Checkbox[]>this.getChildren()).forEach(child => {
            child.deselect();
        });

        this.activeChild = this.getNearestChild(this.angleToReferencePoint(this.menu.inputPosition));

        this.state = ItemState.SUBMENU;

        this.menu.trace$.reset();
        if (this.activeChild.isLeaf) {
            if (this.menu.markingMode) {
                this.activeChild.state = ItemState.ACTIVE_SELECTION;
                this.event(MenuItemEventType.HOVER_SELECTION, this.activeChild);
            } else {
                this.activeChild.state = ItemState.SELECTED;
                (this.activeChild as Checkbox).select();
            }
        }

        this.root.redraw();
    }
}