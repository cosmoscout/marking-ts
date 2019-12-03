/**
 * Possible paper.js groups on a MenuItem
 */
export enum Groups {
    ARC = 'arcGroup',
    GEOMETRY = 'geometryGroup',
    CONNECTOR = 'connector',
}

/**
 * MenuItem States
 */
export enum ItemState {
    NONE = 'none',

    ACTIVE = 'active',
    CHILD = 'child',
    PARENT = 'parent',
    DOT = 'dot',
    HIDDEN = 'hidden',

    BACK = 'back',
    BACK_CHILD = 'backChild',

    SUBMENU = 'submenu',

    SELECTED = 'selected',
    ACTIVE_SELECTION = 'activeSelected'
}

/**
 * MenuItem event types
 */
export enum MenuItemEventType {
    SELECTION = 'itemSelection',
    SUBMENU = 'navigationSubmenu',
    BACK = 'navigationBack',
    BACK_HOVER = 'navigationBackHover',
    HOVER = 'itemHover',
    HOVER_SELECTION = 'itemSelectionHover',

    SLIDER_VALUE_CHANGED = 'sliderValueChanged'
}

/**
 * Input button states
 */
export enum ClickState {
    LEFT_CLICK = 'leftClick',
    RIGHT_CLICK = 'rightClick',
}

/**
 * Input drag states
 */
export enum DragState {
    DRAGGING = 'dragging',
    END = 'dragEnd'
}

/**
 * Settings groups
 */
export enum SettingsGroup {
    MAIN = 'main',
    GEOMETRY = 'geometry',
    CONNECTOR = 'connector',
    ARC = 'arc',
    SCALES = 'scales',
    RADII = 'radii',
    CHECKBOX = 'checkbox',
}
