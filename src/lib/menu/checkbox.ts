import MenuItem from './menu-item';
import { MenuItemEventType, SettingsGroup } from '../enums';
import ColorFactory from '../../utlis/color-factory';
import { ZERO_POINT as CENTER } from '../constants';
import { MenuItemDefinition } from '../interfaces/menu-item-definition';

/**
 * A Checkbox is either selected or not
 */
export default class Checkbox extends MenuItem {
  public readonly TYPE = 'checkbox';

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
    if (typeof data.selected === 'boolean') {
      this.itemSelected = data.selected;
    }
  }

  /**
   * Set the checkbox state to deselected
   */
  public deselect(): void {
    this.itemSelected = false;
  }

  /**
   * Set the checkbox state to selected
   */
  public select(): void {
    this.itemSelected = true;
  }

  /**
   * True if checkbox is selected
   */
  public isSelected(): boolean {
    return this.itemSelected;
  }

  /**
   * @inheritDoc
   */
  public toJSON(): MenuItemDefinition {
    const json = super.toJSON();
    json.type = this.TYPE;
    json.data = {
      selected: this.itemSelected,
    };
    delete json.children;

    return json;
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
    this.event(MenuItemEventType.SELECTION, this, { selected: this.itemSelected });
  }

  /**
   * Square with rounded corners
   */
  protected setupGeometry(): void {
    const rectangleSize = this.settings[SettingsGroup.GEOMETRY].size * 1.75;

    const rectangle = new paper.Rectangle(
      CENTER,
      new paper.Size(rectangleSize, rectangleSize),
    );
    rectangle.center = CENTER;

    const { cornerRadius } = this.settings[SettingsGroup.CHECKBOX];
    const cornerSize = new paper.Size(cornerRadius, cornerRadius);

    this._geometry = new paper.Path.Rectangle(rectangle, cornerSize);

    this.setGeometryColorDefault();
    this.geometry.strokeScaling = false;
  }
}
