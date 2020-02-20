/**
 * JSON Structure for a MenuItem
 */
export interface MenuItemDefinition {
  id: string;
  text: string;
  icon?: string;
  direction: number;
  children?: Array<MenuItemDefinition>;
  type?: string;
  data?: any;
}
