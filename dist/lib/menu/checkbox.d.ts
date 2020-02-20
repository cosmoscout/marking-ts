import MenuItem from "./menu-item";
import { MenuItemDefinition } from "../interfaces";
export default class Checkbox extends MenuItem {
    readonly TYPE = "checkbox";
    protected itemSelected: boolean;
    set data(data: any);
    deselect(): void;
    select(): void;
    isSelected(): boolean;
    toJSON(): MenuItemDefinition;
    protected setGeometryColorDefault(): void;
    protected setGeometryColorSelected(): void;
    protected setGeometryColorActiveSelected(): void;
    protected setGeometryColorHovered(): void;
    protected selectedEvent(): void;
    protected setupGeometry(): void;
}
