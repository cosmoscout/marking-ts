import MenuItem from "./menu-item";
import {MenuItemEventType, SettingsGroup} from "../enums";
import ColorFactory from "../../utlis/color-factory";
import {Path, Rectangle, Size} from "paper";
import {ZERO_POINT as CENTER} from "../constants";

export default class Checkbox extends MenuItem {
    /**
     * Selection Flag
     */
    protected itemSelected: boolean = false;

    /**
     * Optionally mark item active on initialization
     *
     * @param data
     */
    public set data(data: any) {
        if (typeof data.selected === "boolean") {
            this.itemSelected = data.selected;
        }
    }

    public deselect(): void {
        this.itemSelected = false;
    }

    public select(): void {
        this.itemSelected = true;
    }

    /**
     * @see setGeometryColorSelected
     */
    protected setGeometryColorDefault() {
        this.setGeometryColorSelected();
    }

    /**
     * Green if item is selected/active
     * Default color else
     */
    protected setGeometryColorSelected() {
        if (this.itemSelected) {
            this.geometry.fillColor = ColorFactory.fromString(this.settings[SettingsGroup.CHECKBOX].selectionColor);
        } else {
            super.setGeometryColorDefault();
        }
    }

    /**
     * Actively holding if selected = deselect (normal color)
     */
    protected setGeometryColorActiveSelected() {
        if (this.itemSelected) {
            super.setGeometryColorDefault();
        } else {
            this.geometry.fillColor = ColorFactory.fromString(this.settings[SettingsGroup.CHECKBOX].selectionColor);
        }
    }

    /**
     * Hover color
     * Remove some saturation on hover if selected
     */
    protected setGeometryColorHovered() {
        if (this.itemSelected) {
            this.geometry.fillColor = ColorFactory.fromString(this.settings[SettingsGroup.CHECKBOX].selectionColorSelected);
        } else {
            super.setGeometryColorSelected();
        }
    }

    /**
     * Add selected flag to selection event
     */
    protected selectedEvent(): void {
        this.itemSelected = !this.itemSelected;
        this.event(MenuItemEventType.SELECTION, this, {selected: this.itemSelected});
    }

    /**
     * Square with rounded corners
     */
    protected setupGeometry(): void {
        let rectangleSize = this.settings[SettingsGroup.GEOMETRY].size * 1.75;

        let rectangle = new Rectangle(
            CENTER,
            new Size(rectangleSize, rectangleSize)
        );
        rectangle.center = CENTER;

        let cornerRadius = this.settings[SettingsGroup.CHECKBOX].cornerRadius;
        let cornerSize = new Size(cornerRadius, cornerRadius);

        this._geometry = new Path.Rectangle(rectangle, cornerSize);

        this.setGeometryColorDefault();
        this.geometry.strokeScaling = false;
    }
}
