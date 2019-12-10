import {Color, CompoundPath, Group, Item, Path, Point, PointText, Rectangle} from 'paper';
import {Observable, Subject, Subscription} from "rxjs";
import {distinctUntilChanged, map} from "rxjs/operators";
import Angle from '../../utlis/angle';
import Arc from "../../utlis/arc";
import Settings from "../settings";
import * as fontawesome from '@fortawesome/free-solid-svg-icons';
import {IconDefinition, IconName} from '@fortawesome/fontawesome-common-types';
import {camelCase, upperFirst} from 'lodash';
import ColorFactory from "../../utlis/color-factory";
import {ClickState, DragState, Groups, ItemState, MenuItemEventType, SettingsGroup} from "../enums";
import Animation, {AnimationGroup} from "../../utlis/animation";
import {DEFAULT_SCALE, REFERENCE_POINT, ZERO_POINT as CENTER} from "../constants";
import {ArcDefinition, DragDefinition, MenuData, MenuEventDefinition, MenuIdentifier} from "../interfaces";
import MenuEvent from "./menu-event";
import Base from "./base";

/**
 * Class representing a single Menu Entry
 * Can contain one or more Child Menus
 */
export default class MenuItem extends Base implements MenuIdentifier {
    /**
     * Icon opacity if item is active and text is displayed
     */
    protected static readonly ICON_BG_OPACITY: number = 0.4;

    /**
     * Text scaling if text is bigger than the geometry
     */
    protected static readonly TEXT_OVERFLOW_SCALE: number = 0.8;

    /**
     * Item ID should be unique
     */
    public readonly itemId: string;

    /**
     * Content of the label
     */
    public readonly textContent: string;

    /**
     * The items angle in radians on the parent in child/dot state
     */
    public readonly angle: number;

    /**
     * Font Awesome iconName identifier
     * Access via getter/setter
     */
    protected _iconName: string | undefined;

    /**
     * Automatically set on the first MenuItem
     */
    public readonly isRoot: boolean;

    /**
     * Current item state
     * Access via getter/setter
     */
    protected _state: ItemState = ItemState.NONE;

    /**
     * Removes unnecessary draw calls.
     * A re-draw should only occur is the state has changed.
     *
     * @see {redraw}
     * @see {drawItem}
     */
    protected needsReDraw: boolean = true;

    /**
     * True if item has been setup
     */
    protected ready: boolean = false;

    /**
     * Geometries
     */
    protected readonly geometryGroup: Group;
    protected readonly arcGroup: Group;
    protected readonly lineGroup: Group;
    protected arcs: Array<ArcDefinition>;
    protected _text: PointText | undefined;
    protected _geometry: Path | undefined;
    protected _selectionRadius: Path | undefined;
    protected _connector: Path.Line | undefined;
    protected _icon: CompoundPath | undefined;

    /**
     * True if input device is in back navigation arc
     */
    protected isInBackNavigationArc: boolean = false;
    protected activeChild: MenuItem | undefined;
    protected hoveredChild: MenuItem | undefined;
    protected parentArc: ArcDefinition | undefined;

    /**
     * @see {addSubscriptions}
     */
    protected subscription: Subscription | undefined;

    protected readonly _selectionSubject$: Subject<MenuEventDefinition>;
    protected readonly _selectionObservable$: Observable<MenuEventDefinition>;

    protected _inputAngle$: Observable<number> | undefined;

    /**
     * Group containing one or multiple animations
     * Allows simultaneous execution of multiple animations
     */
    protected readonly _animations: AnimationGroup;

    /**
     * MouseEvents Observables from Menu
     */
    protected _menu: MenuData | undefined;

    /**
     * Menu Settings object
     */
    protected _settings: Settings | undefined;

    /**
     * Position if item is in 'child' state.
     * Object is frozen
     */
    protected _positionChild: Point | undefined;

    /**
     * Position if item is in 'dot' state.
     * Object is frozen
     */
    protected _positionDot: Point | undefined;

    /**
     * The event previous send on the event menu Subject
     */
    protected _prevEvent: MenuEventDefinition | undefined;

    /**
     * Menu Item Constructor
     *
     * @constructor
     * @param {string} id Menu Entry Identifier
     * @param {number} angle Angle on which the menu item is displayed
     * @param {string} text Label text
     * @param {string|undefined} icon Label iconName
     * @param {boolean} isRoot=false True for the upper most item
     */
    public constructor(id: string, angle: number, text: string, icon?: string, isRoot: boolean = false) {
        super();

        this.textContent = text;
        this.itemId = id;
        this.angle = Angle.toRad(angle % Angle.FULL_CIRCLE_DEG);
        this.iconName = icon;
        this.isRoot = isRoot;

        // Paper.js Objects
        this.geometryGroup = new Group();
        this.arcGroup = new Group();
        this.lineGroup = new Group();
        this.pivot = CENTER;

        this.arcs = new Array<ArcDefinition>();

        this._animations = new AnimationGroup();

        this._selectionSubject$ = new Subject<MenuEventDefinition>();
        this._selectionObservable$ = this._selectionSubject$.asObservable();
    }

    /**
     * Initializes the Menu
     * Sets up:
     *  Groups
     *  Item Connector
     *  Geometry
     *  Icon
     *  Text
     *
     * @throws {Error} If no events object was set on root
     */
    public init(): void {
        if (this.ready) {
            return;
        }

        if (this.isRoot) {
            this.project.activeLayer.addChild(this);
        } else {
            (this.parent as MenuItem).addChild(this);
        }

        this._inputAngle$ = this.menu.inputPosition$.pipe(
            map(this.angleToReferencePoint.bind(this)),
            distinctUntilChanged((previousAngle: number, currentAngle: number): boolean => {
                return Math.round(Angle.toDeg(previousAngle)) === Math.round(Angle.toDeg(currentAngle));
            })
        );

        this._positionChild = new Point(
            Angle.toX(this.angle, this.settings[SettingsGroup.RADII].child),
            Angle.toY(this.angle, this.settings[SettingsGroup.RADII].child)
        ).floor();
        Object.freeze(this._positionChild);

        this._positionDot = new Point(
            Angle.toX(this.angle, this.settings[SettingsGroup.RADII].dot),
            Angle.toY(this.angle, this.settings[SettingsGroup.RADII].dot)
        ).floor();
        Object.freeze(this._positionDot);

        this._animations.duration = this.settings[SettingsGroup.MAIN].animationDuration;

        this.preSetup();
        this.setupGroups();
        this.setupConnector();
        this.setupGeometry();
        this.setupIcon();
        this.setupText();
        this.setupSelectionRadius();
        this.afterSetup();

        this.addChild(this.connector);

        this.addChild(this.geometryGroup);
        this.geometryGroup.addChild(this.arcGroup);
        this.geometryGroup.addChild(this.geometry);
        this.geometryGroup.addChild(this.selectionRadius);
        this.geometryGroup.addChild(this.icon);
        this.geometryGroup.addChild(this.text);
        this.geometryGroup.addChild(this.lineGroup);

        this.getChildren().forEach((child: MenuItem): void => {
            child.init();
        });

        this.collectArcAngles();
        this.createArcs();

        this.itemReady();
    }

    /**
     * Observable for menu item events
     *
     * @return {Observable<MenuEventDefinition>}
     */
    public get selection$(): Observable<MenuEventDefinition> {
        return this._selectionObservable$;
    }

    /**
     * Return the set menu events
     *
     * @return {MenuData}
     * @throws {Error} If no events were set
     */
    public get menu(): MenuData {
        if (typeof this.root._menu === "undefined") {
            throw new Error('Events object missing on root');
        }

        return this.root._menu;
    }

    /**
     * Sets the global mouse move and click observables
     *
     * @param {MenuData} events
     * @throws {Error} If menu item is not root
     */
    public set menu(events: MenuData) {
        if (!this.isRoot) {
            throw new Error('Events can only be set on root');
        }

        this._menu = events;
    }

    /**
     * Return set settings, throws error if settings are missing
     *
     * @return {Settings}
     * @throws {Error} If no settings were set
     */
    public get settings(): Settings {
        if (typeof this.root._settings === "undefined") {
            throw new Error('Settings object missing on root');
        }

        return this.root._settings;
    }

    /**
     * Setter for the settings object
     *
     * @param {Settings} settings
     * @throws {Error} If menu item is not root
     */
    public set settings(settings: Settings) {
        if (!this.isRoot) {
            throw new Error('Settings can only be set on root');
        }

        this._settings = settings;
    }

    /**
     * Accessor for the menu item state
     *
     * @return {ItemState}
     */
    public get state(): ItemState {
        return this._state;
    }

    /**
     * Setter for the menu item state
     *
     * @param {ItemState} state
     */
    public set state(state: ItemState) {
        if (this._state === state) {
            return;
        }

        this.needsReDraw = true;

        let newChildState: ItemState = ItemState.NONE;
        this._state = state;

        switch (state) {
            case ItemState.HIDDEN:
                newChildState = ItemState.HIDDEN;
                break;

            case ItemState.ACTIVE:
                newChildState = ItemState.CHILD;
                break;

            case ItemState.SELECTED:
                this.selectedEvent();
                break;

            case ItemState.CHILD:
                newChildState = ItemState.DOT;
                break;

            case ItemState.DOT:
                newChildState = ItemState.HIDDEN;
                break;

            case ItemState.BACK:
                newChildState = ItemState.BACK_CHILD;
                break;

            case ItemState.BACK_CHILD:
                newChildState = ItemState.HIDDEN;
                break;

            case ItemState.SUBMENU:
                newChildState = ItemState.DOT;
                break;
        }

        if (newChildState !== ItemState.NONE) {
            this.getChildren().forEach((child: MenuItem): void => {
                child.state = newChildState;
            });
        }

        this.stateChanged();
    }

    /**
     * Returns true if the item has no children
     *
     * @return {boolean}
     */
    public get isLeaf(): boolean {
        return this.getChildren().length === 0;
    }

    /**
     * Returns the number of children (recursively)
     *
     * @return {number}
     */
    public get childCount(): number {
        return this.getChildren().reduce((prev: number, cur: MenuItem): number => {
            if (cur.getChildren().length > 0) {
                return prev + cur.childCount;
            }

            return prev;
        }, this.getChildren().length);
    }

    /**
     * Recursively redraws the item and all its children
     */
    public redraw(): void {
        if (this._animations !== undefined) {
            this.stopAnimations();
        }

        // Re draw only if state changed
        if (this.needsReDraw) {
            this.drawItem();
            this.needsReDraw = false;
        }

        this.getChildren().forEach((child: MenuItem): void => {
            child.redraw();
        });
    }

    /**
     * Called after a state change occurred
     */
    protected stateChanged(): void {
        this.isInBackNavigationArc = false;

        this.geometryGroup.position = CENTER;
        this.geometryGroup.visible = true;
        this.setColorDefault();

        this.icon.visible = true;
        this.icon.opacity = 1;

        this.arcGroup.visible = false;
        this.arcGroup.opacity = 0;

        this.text.visible = false;
        this.lineGroup.visible = false;

        this.connector.visible = false;
        this.selectionRadius.visible = false;

        if (this.state === ItemState.ACTIVE || this.state === ItemState.ACTIVE_SELECTION) {
            this.addSubscriptions();
            this.icon.opacity = MenuItem.ICON_BG_OPACITY;
            this.updateText(this.textContent);
        } else {
            this.subscription && this.subscription.unsubscribe();
            (this.arcGroup.children as Item[]).forEach((arc: Item): void => {
                arc.opacity = 0;
            });
        }

        this.setGroupsVisibility();

        if (this.state === ItemState.HIDDEN) {
            const parent: MenuItem = this.parent as MenuItem;
            const activeChild = parent.activeChild;

            let isParentParent = false;
            const isBack = parent.parent !== null && (parent.parent as MenuItem).state === ItemState.BACK;
            const parentHiddenOrDot = parent.state === ItemState.HIDDEN || parent.state === ItemState.DOT;

            if (typeof activeChild !== "undefined") {
                isParentParent = activeChild.state === ItemState.PARENT || activeChild.state === ItemState.SUBMENU;
            }

            if (parentHiddenOrDot || isParentParent || isBack) {
                this.geometryGroup.visible = false;
            }

            this.reset();
        }


        if (this.state !== ItemState.SUBMENU) {
            this.connector.opacity = 1;
            this.geometry.opacity = 1;
            this.getChildren().forEach(child => {
                child.geometry.opacity = 1;
            });
        }
    }

    /**
     * Set the visibility of the graphical elements based on the item state
     */
    protected setGroupsVisibility(): void {
        switch (this.state) {
            case ItemState.ACTIVE:
                this.text.visible = true;
                this.arcGroup.visible = true;
                this.lineGroup.visible = true;
                this.selectionRadius.visible = this.settings[SettingsGroup.MAIN].enableMaxClickRadius;
                break;

            case ItemState.ACTIVE_SELECTION:
                this.text.visible = true;
                this.arcGroup.visible = true;
                break;

            case ItemState.DOT:
                this.icon.visible = false;
                break;

            case ItemState.PARENT:
                this.connector.visible = true;
                break;

            case ItemState.HIDDEN:
            case ItemState.BACK_CHILD:
                this.icon.visible = false;
                break;

            case ItemState.SUBMENU:
                this.connector.firstSegment.point = CENTER;
                this.connector.lastSegment.point = CENTER;
                this.connector.visible = true;
                break;

            case ItemState.SELECTED:
                this.text.visible = true;
                break;
        }
    }

    /**
     * Subscribes to input, click, drag and trace observables
     */
    protected addSubscriptions(): void {
        this.subscription = new Subscription();
        this.subscription.add(this.inputAngle$.subscribe(this.selectionLogic.bind(this)));
        this.subscription.add(this.menu.click$.subscribe(this.clickLogic.bind(this)));
        this.subscription.add(this.menu.trace$.onDecisionPoint$.subscribe(this.traceLogic.bind(this)));
        this.subscription.add(this.menu.dragging$.subscribe(this.dragLogic.bind(this)));
    }

    /**
     * Converts a font awesome iconName name into an import name
     * e.g compass -> faCompass | angle-double-right -> faAngleDoubleRight
     *
     * @param {string | undefined} icon
     */
    protected set iconName(icon: string | undefined) {
        if (icon !== undefined) {
            this._iconName = `fa${upperFirst(camelCase(icon))}`;
        }
    }

    /**
     * Accessor for the iconName name
     *
     * @return {string | undefined}
     */
    protected get iconName(): string | undefined {
        return this._iconName;
    }

    /**
     * Accessor for the connecting line geometry
     *
     * @return {Path.Line}
     */
    public get connector(): Path.Line {
        if (typeof this._connector === "undefined") {
            throw new Error(`Connector missing on ${this.itemId}`);
        }

        return this._connector;
    }

    /**
     * Accessor for the Input Angle Observable from input position to reference point
     *
     * @return {Observable<number>}
     */
    protected get inputAngle$(): Observable<number> {
        if (typeof this._inputAngle$ === "undefined") {
            throw new Error(`Mouse angle observable not initialized on ${this.itemId}`);
        }

        return this._inputAngle$;
    }

    /**
     * Accessor for the root menu item
     *
     * @return {MenuItem} Root menu item
     */
    protected get root(): MenuItem {
        if (this.isRoot) {
            return this;
        }

        return (this.parent as MenuItem).root;
    }

    /**
     * Accessor for geometry
     *
     * @return {Path.Circle}
     * @throws {Error}
     */
    protected get geometry(): Path.Circle {
        if (typeof this._geometry === "undefined") {
            throw new Error(`Geometry missing on ${this.itemId}`);
        }

        return this._geometry;
    }

    /**
     * Accessor for icon
     * If no iconName is set an empty CompoundPath will be returned
     *
     * @return {CompoundPath}
     * @throws {Error}
     */
    protected get icon(): CompoundPath {
        if (typeof this._icon === "undefined") {
            throw new Error(`Icon missing on ${this.itemId}`);
        }

        return this._icon;
    }

    /**
     * Accessor for text
     *
     * @return {PointText}
     * @throws {Error}
     */
    protected get text(): PointText {
        if (typeof this._text === "undefined") {
            throw new Error(`Text missing on ${this.itemId}`);
        }

        return this._text;
    }

    /**
     * @return {Point}
     * @throws {Error}
     */
    protected get positionChild(): Point {
        if (typeof this._positionChild === "undefined") {
            throw new Error(`Child Position missing on ${this.itemId}`);
        }

        return this._positionChild;
    }

    /**
     * @return {Point}
     * @throws {Error}
     */
    protected get positionDot(): Point {
        if (typeof this._positionDot === "undefined") {
            throw new Error(`Dot Position missing on ${this.itemId}`);
        }

        return this._positionDot;
    }

    /**
     * @return {Path.Circle}
     * @throws {Error}
     */
    protected get selectionRadius(): Path.Circle {
        if (typeof this._selectionRadius === "undefined") {
            throw new Error(`Selection Radius not initialized on ${this.itemId}`);
        }

        return this._selectionRadius;
    }

    /**
     * Sets up Geometry, Arc and Text group
     */
    protected setupGroups(): void {
        this.geometryGroup.name = Groups.GEOMETRY;
        this.geometryGroup.pivot = CENTER;
        this.geometryGroup.applyMatrix = false;

        this.arcGroup.name = Groups.ARC;
    }

    /**
     * Creates the connecting line
     */
    protected setupConnector(): void {
        this._connector = new Path.Line(CENTER, CENTER);

        this.connector.strokeColor = ColorFactory.fromString(this.settings[SettingsGroup.CONNECTOR].color);
        this.connector.strokeWidth = this.settings[SettingsGroup.CONNECTOR].width;
        this.connector.strokeCap = 'round';
        this.connector.name = Groups.CONNECTOR;

        this.connector.visible = false;
    }

    /**
     * Creates the geometry
     */
    protected setupGeometry(): void {
        this._geometry = new Path.Circle(CENTER, this.settings[SettingsGroup.GEOMETRY].size);

        if (this.childCount === 0 && this.settings[SettingsGroup.GEOMETRY].useActionShape) {
            this.geometry.segments[2].handleIn = new Point(0, -this.settings[SettingsGroup.GEOMETRY].size / 4);
            this.geometry.segments[2].handleOut = new Point(0, this.settings[SettingsGroup.GEOMETRY].size / 4);
            this.geometry.segments[2].point = this.geometry.segments[2].point.add(new Point(this.settings[SettingsGroup.GEOMETRY].size / 3, 0));
            this.geometry.pivot = CENTER;
            this.geometry.rotate(this.positionChild.angle);
        }

        this.setGeometryColorDefault();
        this.geometry.strokeScaling = false;
    }

    /**
     * Creates the icon path
     */
    protected setupIcon(): void {
        if (typeof this.iconName === "undefined") {
            this._icon = new CompoundPath('');
        } else {
            // @ts-ignore
            const icon: IconDefinition = fontawesome[this._iconName as IconName];

            if (typeof icon === "undefined") {
                console.error(`Icon '${this.iconName}' does not exist.`);
                this._icon = new CompoundPath('');
            } else {
                this._icon = new CompoundPath((icon.icon[4] as string));

                this.icon.scale(this.settings[SettingsGroup.SCALES].icon.base * this.settings[SettingsGroup.SCALES].icon.solo); // Default Size = 512px   1/16 = 0.0625 = 32px
                this.setIconColorDefault();
                this.icon.strokeWidth = 0;
                this.icon.position = CENTER;
            }
        }
    }

    /**
     * Sets up the text
     */
    protected setupText(): void {
        this._text = new PointText(CENTER.clone());

        this.text.justification = 'center';
        this.text.fontSize = '16px';
        this.text.fontWeight = 'bold';
        this.setTextColorDefault();
        this.text.strokeWidth = 0;
        this.updateText(this.textContent || '');
        this.text.position = CENTER;
    }

    /**
     * Sets up a max radius for menu interactions
     * Clicking outside the radius will hide the menu
     */
    protected setupSelectionRadius(): void {
        this._selectionRadius = new Path.Circle(CENTER, this.settings[SettingsGroup.RADII].maxClickRadius);
        this.selectionRadius.fillColor = null;
        this.selectionRadius.strokeWidth = 1;
        this.selectionRadius.strokeColor = ColorFactory.fromString(this.settings[SettingsGroup.GEOMETRY].color);
        this.selectionRadius.strokeColor.alpha = 0.25;
        this.selectionRadius.visible = false;
    }

    /**
     * Get all menu item children
     *
     * @return {Array<MenuItem>}
     */
    protected getChildren(): Array<MenuItem> {
        return (this.children as Item[]).filter((child: Item): boolean => {
            return child instanceof MenuItem;
        }) as Array<MenuItem>;
    }

    /**
     * Returns the child nearest to a given angle
     *
     * @param {number} angle
     */
    protected getNearestChild(angle: number): MenuItem {
        return this.getChildren().reduce((c1: MenuItem, c2: MenuItem): MenuItem => {
            const delta1 = Math.abs(Angle.difference(c1.angle, angle));
            const delta2 = Math.abs(Angle.difference(c2.angle, angle));

            return delta1 > delta2 ? c2 : c1;
        });
    }

    /**
     * Updates the text object with new content.
     * Used to display hovered child names
     * Will fit the text to the geometry's bounds if it would overflow
     *
     * @param {string} content The new text content
     */
    protected updateText(content: string): void {
        if (content === this.text.content) {
            return;
        }

        this.text.scaling = DEFAULT_SCALE;
        this.text.content = content;

        if (this.text.bounds.size.width + 10 > this.geometry.bounds.size.width) {
            this.text.fitBounds((this.geometry.bounds as Rectangle).scale(MenuItem.TEXT_OVERFLOW_SCALE));
        }

        this.text.position = CENTER;
    }

    /**
     * Calculates the angle in radians of a point to the reference point (0, -1)
     *
     * @param {Point} point
     */
    protected angleToReferencePoint(point: Point): number {
        let angle: number = REFERENCE_POINT.getDirectedAngle(this.globalToLocal(point));

        if (angle < 0) {
            angle += Angle.FULL_CIRCLE_DEG;
        }

        return Angle.toRad(angle);
    }

    /**
     * Navigate back to this item's parent
     */
    protected navigateBack(): void {
        if (!(this.parent instanceof MenuItem)) {
            return;
        }

        this.menu.trace$.reset();
        this.resetActiveHovered();

        this.event(MenuItemEventType.BACK, this.parent);

        this.parent.state = ItemState.ACTIVE;
        this.state = ItemState.BACK;

        this.connector.strokeWidth = this.settings[SettingsGroup.CONNECTOR].width;
        this.connector.strokeColor = ColorFactory.fromString(this.settings[SettingsGroup.CONNECTOR].color);

        this.root.redraw();
    }

    /**
     * Navigate to currently active child
     */
    protected changeActive(): void {
        this.activeChild = this.getNearestChild(this.angleToReferencePoint(this.menu.inputPosition));

        this.state = ItemState.SUBMENU;

        this.menu.trace$.reset();
        if (this.activeChild.isLeaf) {
            if (this.menu.markingMode) {
                this.activeChild.state = ItemState.ACTIVE_SELECTION;
                this.event(MenuItemEventType.HOVER_SELECTION, this.activeChild);
            } else {
                this.activeChild.state = ItemState.SELECTED;
            }
        } else {
            this.activeChild.state = ItemState.ACTIVE;
            this.event(MenuItemEventType.SUBMENU, this.activeChild);
        }

        this.root.redraw();
    }

    protected selectedEvent(): void {
        this.event(MenuItemEventType.SELECTION, this);
    }

    /**
     * Generate an event on the root Event Subject
     *
     * @param {MenuItemEventType} type The event type
     * @param {MenuItem} target Target menu item
     * @param {Record} data Event Data
     */
    protected event(type: MenuItemEventType, target?: MenuItem, data?: Record<string, string | number | boolean>): void {
        const event = new MenuEvent(type, this, target, data);

        if (typeof this._prevEvent === "undefined" || !event.equals(this._prevEvent)) {
            this.root._selectionSubject$.next(event);
        }

        this._prevEvent = event;
    }

    /**
     * Reset text, iconName and connector position
     *
     * @see {resetActiveHovered}
     */
    protected reset(): void {
        this.resetActiveHovered();
        this._prevEvent = undefined;

        this.geometryGroup.position = CENTER;

        (this.arcGroup.children as Item[]).forEach((arc: Item): void => {
            arc.opacity = 0;
        });

        this.connector.visible = false;
        this.connector.firstSegment.point = CENTER;
        this.connector.lastSegment.point = CENTER;
        this.connector.strokeColor = ColorFactory.fromString(this.settings[SettingsGroup.CONNECTOR].color);
        this.connector.strokeWidth = this.settings[SettingsGroup.CONNECTOR].width;

        this.getChildren().forEach((child: MenuItem): void => child.reset());
    }

    /**
     * Stops all animations
     */
    protected stopAnimations(): void {
        this._animations.stop();
        this._animations.reset();
        this._animations.easing = 'easeOutCubic';
    }

    /**
     * Reset active and hovered child members
     */
    protected resetActiveHovered(): void {
        this.activeChild = undefined;
        this.hoveredChild = undefined;
    }

    /**
     * Collect child angles for arc creation
     */
    protected collectArcAngles(): void {
        let angles: Array<number> = new Array<number>();

        const parentWedgeAngle = Angle.opposite(this.angle);

        if (!this.isRoot) {
            angles.push(parentWedgeAngle);
        }

        this.getChildren().forEach((child: MenuItem): void => {
            angles.push(child.angle);
        });

        if (angles.length === 1) {
            angles.push(Angle.opposite(angles[0]));
        }

        this.arcs = Arc.fromAngles(angles);

        if (!this.isRoot) {
            this.parentArc = this.arcs.find((arc: ArcDefinition): boolean => arc.origAngle === parentWedgeAngle);
        }
    }

    /**
     * Create arcs from arc definition
     */
    protected createArcs(): void {
        this.arcGroup.children.length = 0;

        this.arcs.forEach((arc: ArcDefinition): void => {
            const arcGeometry = Arc.fromDefinition(arc, this.settings);
            this.arcGroup.addChild(arcGeometry);

            if (this.settings[SettingsGroup.ARC].stroke.enabled) {
                this.lineGroup.addChild(
                    Arc.arcStroke(
                        arcGeometry.firstSegment.point as Point,
                        arcGeometry.fillColor as Color,
                        this.settings
                    )
                );
            }
        });
    }

    protected resetChildColor(): void {
        this.getChildren().forEach((child: MenuItem): void => {
            child.setColorDefault();

            child.getChildren().forEach((childChild: MenuItem): void => {
                childChild.setColorDefault();
            });
        });
    };

    /**
     * Function that gets attached to the inputAngle Observable
     *
     * @see {inputAngle$}
     * @param {number} angle
     */
    protected selectionLogic(angle: number): void {
        const dist: number = CENTER.getDistance(this.globalToLocal(this.menu.inputPosition));

        if (!this.isRoot) {
            this.isInBackNavigationArc = Angle.between(angle, (this.parentArc as ArcDefinition).from, (this.parentArc as ArcDefinition).to);
        }

        if (dist < this.settings[SettingsGroup.GEOMETRY].sizeDeadZone) {
            this.selectionLogicInGeometryOperations();
            return;
        }

        if (this.isInBackNavigationArc) {
            this.resetActiveHovered();
            this.selectionLogicBackOperations();
        } else {
            if (this.isLeaf) {
                return;
            }

            const nearestChild = this.getNearestChild(angle);

            if (this.hoveredChild === nearestChild) {
                //return;
            }

            this.selectionLogicHoverOperations(nearestChild);
        }

        this.animateArcs(angle);
    }

    /**
     * Method gets run if input device is in geometry object
     */
    protected selectionLogicInGeometryOperations(): void {
        this.resetActiveHovered();

        (this.arcGroup.children as Item[]).forEach((arc: Item): void => {
            arc.opacity = 0;
        });

        this.updateText(this.textContent);

        this.resetChildColor();
    }

    /**
     * Gets run if {selectionLogic} determines that the user wants to navigate back
     */
    protected selectionLogicBackOperations() {
        this.resetChildColor();
        this.event(MenuItemEventType.BACK_HOVER, this.parent as MenuItem);
        this.updateText('Back');
    }

    /**
     * Gets run if back is false
     * @see {selectionLogicBackOperations}
     */
    protected selectionLogicHoverOperations(nearestChild: MenuItem) {
        this.resetChildColor();

        this.hoveredChild = nearestChild;
        this.hoveredChild.setColorHovered();
        this.hoveredChild.getChildren().forEach((child: MenuItem): void => {
            child.setColorHovered();
        });

        if (this.hoveredChild.isLeaf) {
            this.event(MenuItemEventType.HOVER_SELECTION, this.hoveredChild);
        } else {
            this.event(MenuItemEventType.HOVER, this.hoveredChild);
        }

        this.updateText(this.hoveredChild.textContent);
    }

    /**
     * Function that gets attached to the click$ Observable
     *
     * @see {Menu}
     * @param {ClickState} clickState
     */
    protected clickLogic(clickState: ClickState): void {
        const dist: number = CENTER.getDistance(this.globalToLocal(this.menu.inputPosition));

        if (dist >= this.settings[SettingsGroup.RADII].maxClickRadius && this.settings[SettingsGroup.MAIN].enableMaxClickRadius) {
            this.root.state = ItemState.HIDDEN;
            this.root.redraw();
            return;
        }

        if (clickState === ClickState.RIGHT_CLICK) {
            if (this.isRoot) {
                this.root.state = ItemState.HIDDEN;
                this.root.visible = false;
            } else {
                this.navigateBack();
            }
            return;
        }

        if (this.isInBackNavigationArc && dist > this.settings[SettingsGroup.GEOMETRY].sizeDeadZone) {
            this.navigateBack();
            return;
        }

        if (this.hoveredChild !== undefined) {
            this.changeActive();
        }
    }

    /**
     * Function that gets attached to the trace$ Observable
     *
     * @see {Menu}
     * @param {Point} decisionPoint
     */
    protected traceLogic(decisionPoint: Point): void {
        const angle = this.angleToReferencePoint(decisionPoint);
        const localPos = this.globalToLocal(decisionPoint);

        if (!this.isRoot && this.isInBackNavigationArc && CENTER.getDistance(localPos) >= this.settings[SettingsGroup.MAIN].minTraceDistance) {
            this.connector.visible = false;
            this.navigateBack();
            return;
        }

        if (this.isLeaf) {
            return;
        }

        this.hoveredChild = this.getNearestChild(angle);
        this.hoveredChild.position = localPos;
        this.changeActive();
    }

    /**
     * Function that gets attached to the dragging$ Observables
     *
     * @see {Menu}
     * @param {DragDefinition} drag
     */
    protected dragLogic(drag: DragDefinition): void {
        this.connector.visible = false;
        const localPos = this.globalToLocal(drag.position);

        if (this.isLeaf) {
            if (drag.state === DragState.END) {
                this.menu.trace$.reset();
                this.state = ItemState.SELECTED;
                this.root.redraw();
            }
            return;
        } else if (drag.state === DragState.END && localPos.getDistance(CENTER) > this.settings[SettingsGroup.MAIN].minTraceDistance) {
            this.changeActive();
            return;
        }

        const nearestChild = this.getNearestChild(this.angleToReferencePoint(drag.position));

        if (CENTER.getDistance(localPos) >= this.settings[SettingsGroup.MAIN].minTraceDistance && !this.isInBackNavigationArc) {
            nearestChild.stopAnimations();
            nearestChild.position = localPos;
            this.connector.visible = true;
            this.connector.lastSegment.point = localPos;
        } else {
            nearestChild.position = nearestChild.positionChild;
        }

        this.getChildren()
            .filter((child: MenuItem): boolean => child !== nearestChild)
            .forEach((child: MenuItem): void => {
                child.position = child.positionChild;
            });
    }

    /**
     * Draws the item based on state
     */
    protected drawItem(): void {
        switch (this.state) {
            case ItemState.HIDDEN:
                this.animateStateHidden();
                break;

            case ItemState.ACTIVE:
                this.animateStateActive();
                break;

            case ItemState.ACTIVE_SELECTION:
                this.animateStateActiveSelection();
                break;

            case ItemState.CHILD:
                this.animateStateChild();
                break;

            case ItemState.PARENT:
                this.animateStateParent();
                break;

            case ItemState.DOT:
                this.animateStateDot();
                break;

            case ItemState.BACK:
                this.animateStateBack();
                break;

            case ItemState.BACK_CHILD:
                this.animateStateBackChild();
                break;

            case ItemState.SUBMENU:
                this.animateStateSubmenu();
                break;

            case ItemState.SELECTED:
                this.animateStateSelected();
                break;
        }

        this._animations.start();
    }

    /**
     * Called before init end
     * @see init
     */
    protected itemReady(): void {
        this.ready = true;
    }

    /**
     * Called pre setup methods
     */
    protected preSetup(): void {
    }

    /**
     * Called after setup methods
     */
    protected afterSetup(): void {
    }

    /**
     * Set geometry fill color to default.
     * Default fill color.
     */
    protected setGeometryColorDefault(): void {
        this.geometry.fillColor = ColorFactory.fromString(this.settings[SettingsGroup.GEOMETRY].color);
    }

    /**
     * Set geometry fill color to selected.
     * This is the color upon a final selection.
     */
    protected setGeometryColorSelected(): void {
        this.geometry.fillColor = ColorFactory.fromString(this.settings[SettingsGroup.GEOMETRY].selectionColor);
    }

    /**
     * Set geometry fill color to active selected
     * This is the color if the item is actively selected. (User can still navigate back).
     */
    protected setGeometryColorActiveSelected(): void {
        this.setGeometryColorSelected();
    }

    /**
     * Set geometry fill color to hovered.
     * This is the color if the input device hovers over the item.
     */
    protected setGeometryColorHovered(): void {
        this.setGeometryColorSelected();
    }

    /**
     * Set geometry fill color to default.
     * Default fill color.
     */
    protected setTextColorDefault(): void {
        this.text.fillColor = ColorFactory.fromString(this.settings[SettingsGroup.GEOMETRY].text.color);
    }

    /**
     * Set geometry fill color to selected.
     * This is the color upon a final selection.
     */
    protected setTextColorSelected(): void {
        this.text.fillColor = ColorFactory.fromString(this.settings[SettingsGroup.GEOMETRY].text.selectionColor);
    }

    /**
     * Set geometry fill color to active selected
     * This is the color if the item is actively selected. (User can still navigate back).
     */
    protected setTextColorActiveSelected(): void {
        this.setTextColorSelected();
    }

    /**
     * Set geometry fill color to hovered.
     * This is the color if the input device hovers over the item.
     */
    protected setTextColorHovered(): void {
        this.setTextColorSelected();
    }

    /**
     * Set geometry fill color to default.
     * Default fill color.
     */
    protected setIconColorDefault(): void {
        this.icon.fillColor = ColorFactory.fromString(this.settings[SettingsGroup.GEOMETRY].icon.color);
    }

    /**
     * Set geometry fill color to selected.
     * This is the color upon a final selection.
     */
    protected setIconColorSelected(): void {
        this.icon.fillColor = ColorFactory.fromString(this.settings[SettingsGroup.GEOMETRY].icon.selectionColor);
    }

    /**
     * Set geometry fill color to active selected
     * This is the color if the item is actively selected. (User can still navigate back).
     */
    protected setIconColorActiveSelected(): void {
        this.setIconColorSelected();
    }

    /**
     * Set geometry fill color to hovered.
     * This is the color if the input device hovers over the item.
     */
    protected setIconColorHovered(): void {
        this.setIconColorSelected();
    }

    /**
     * Calls set default color on geometry, text and icon
     */
    protected setColorDefault() {
        this.setGeometryColorDefault();
        this.setTextColorDefault();
        this.setIconColorDefault();
    }

    /**
     * Calls set selected color on geometry, text and icon
     */
    protected setColorSelected() {
        this.setGeometryColorSelected();
        this.setTextColorSelected();
        this.setIconColorSelected();
    }

    /**
     * Calls set active selected color on geometry, text and icon
     */
    protected setColorActiveSelected() {
        this.setGeometryColorActiveSelected();
        this.setTextColorActiveSelected();
        this.setIconColorActiveSelected();
    }

    /**
     * Calls set hover color on geometry, text and icon
     */
    protected setColorHovered() {
        this.setGeometryColorHovered();
        this.setTextColorHovered();
        this.setIconColorHovered();
    }

    /**
     * @return {string}
     */
    public toString(): string {
        let parentId = 'None';
        if (this.parent instanceof MenuItem) {
            parentId = this.parent.itemId;
        }

        return `${this.itemId} (${Angle.toDeg(this.angle)}°) | Parent: ${parentId} | Root: ${this.isRoot} | Pos: ${this.position} | State: ${this.state} | Children: ${this.getChildren().length}`;
    }


    /*
    *******************************************
    Animations
    *******************************************
     */
    /**
     * Animation to hidden
     */
    protected animateStateHidden(): void {
        let to;

        if (this.isRoot) {
            to = {
                scaling: 0
            }
        } else {
            to = {
                scaling: 0,
                position: CENTER.subtract(this.position as Point).add((this.position as Point).multiply(this.settings[SettingsGroup.SCALES].dot))
            };
        }

        this._animations.push(
            new Animation({
                target: this.geometryGroup,
                to,
            }),
        );
    }

    /**
     * Animation to Active
     */
    protected animateStateActive(): void {
        this._animations.push(
            new Animation({
                target: this.geometryGroup,
                to: {
                    scaling: 1
                },
            })
        );

        this._animations.onFinish$((): void => {
            (new Animation({
                target: this.arcGroup,
                from: {
                    opacity: 0
                },
                to: {
                    opacity: 1
                },
                options: {
                    duration: this.settings[SettingsGroup.MAIN].animationDuration
                }
            })).start();
        });
    }

    /**
     * Animation to Child
     */
    protected animateStateChild(): void {
        this.geometryGroup.position = CENTER;

        this._animations.push(
            new Animation({
                target: this,
                from: {
                    position: this.positionChild.normalize(this.settings[SettingsGroup.RADII].dot),
                },
                to: {
                    position: this.positionChild,
                }
            }),
            new Animation({
                target: this.geometryGroup,
                from: {
                    scaling: this.settings[SettingsGroup.SCALES].dot
                },
                to: {
                    scaling: this.settings[SettingsGroup.SCALES].child
                }
            }),
        );
    }

    /**
     * Animation from Active to Parent
     */
    protected animateStateParent(): void {
        this._animations.push(
            new Animation({
                target: this.geometryGroup,
                to: {
                    scaling: this.settings[SettingsGroup.SCALES].parent
                }
            }),
        );
    }

    /**
     * Animation to Dot
     */
    protected animateStateDot(): void {
        if ((this.parent as MenuItem).state === ItemState.PARENT) {
            //this.geometryGroup.visible = false;
            this._animations.push(
                new Animation({
                    target: this,
                    from: {
                        position: this.position as Point,
                    },
                    to: {
                        position: this.positionDot,
                    }
                }),
                new Animation({
                    target: this.geometryGroup,
                    to: {
                        scaling: this.settings[SettingsGroup.SCALES].dot,
                    }
                })
            );

            return;
        }

        this._animations.push(
            new Animation({
                target: this,
                from: {
                    position: this.parent.position as Point,
                },
                to: {
                    position: this.positionDot,
                }
            }),
            new Animation({
                target: this.geometryGroup,
                from: {
                    position: CENTER.subtract((this.parent as Item).position as Point),
                    scaling: 0,
                },
                to: {
                    position: CENTER,
                    scaling: this.settings[SettingsGroup.SCALES].dot,
                }
            })
        );
    }

    /**
     * Animation from Active to Child
     */
    protected animateStateBack(): void {
        this._state = ItemState.CHILD;

        const parent = this.parent as MenuItem;

        let rootPos = this.menu.inputPosition;
        if (!parent.isRoot) {
            rootPos = (this.root.position as Point).add(parent.globalToLocal(this.menu.inputPosition)).floor();
            ((this.parent as MenuItem).parent as MenuItem).connector.strokeWidth = this.settings[SettingsGroup.CONNECTOR].width;
            ((this.parent as MenuItem).parent as MenuItem).connector.strokeColor = ColorFactory.fromString(this.settings[SettingsGroup.CONNECTOR].color);
            ((this.parent as MenuItem).parent as MenuItem).geometry.opacity = 1;
            ((this.parent as MenuItem).parent as MenuItem).getChildren().forEach((child: MenuItem) => {
                child.geometry.opacity = 1;
            });
        }

        this._animations.easing = 'easeInCubic';

        this._animations.push(
            new Animation({
                target: this.root,
                to: {
                    position: rootPos
                }
            }),
            new Animation({
                target: this,
                to: {
                    position: this.positionChild
                },
            }),
            new Animation({
                target: parent.connector,
                to: {
                    'lastSegment.point': CENTER
                }
            }),
            new Animation({
                target: this.geometryGroup,
                to: {
                    scaling: this.settings[SettingsGroup.SCALES].child
                },
            }),
        );

        this._animations.onStop$((): void => {
            parent.connector.lastSegment.point = CENTER;
            parent.connector.strokeColor = ColorFactory.fromString(this.settings[SettingsGroup.CONNECTOR].color);
            parent.connector.strokeWidth = this.settings[SettingsGroup.CONNECTOR].width;
        });

        this._animations.onFinish$((): void => {
            parent.connector.visible = false;
            parent.connector.strokeColor = ColorFactory.fromString(this.settings[SettingsGroup.CONNECTOR].color);
            parent.connector.strokeWidth = this.settings[SettingsGroup.CONNECTOR].width;
        });
    }

    /**
     * Animation from Child to Dot
     */
    protected animateStateBackChild(): void {
        this._state = ItemState.DOT;

        this._animations.push(
            new Animation({
                target: this,
                to: {
                    position: this.position.normalize(this.settings[SettingsGroup.RADII].dot),
                }
            }),
            new Animation({
                target: this.geometryGroup,
                to: {
                    scaling: this.settings[SettingsGroup.SCALES].dot,
                }
            }),
        );
    }

    /**
     * State Animation to a Submenu
     */
    protected animateStateSubmenu(): void {
        this._state = ItemState.PARENT;

        const localMousePos = this.globalToLocal(this.menu.inputPosition).floor();
        const activeChild = this.activeChild;

        if (typeof activeChild === "undefined") {
            throw new Error('State is missing active Child');
        }

        activeChild.bringToFront();

        let itemPos = REFERENCE_POINT.clone();
        itemPos.angleInRadians = activeChild.angle - Angle.HALF_CIRCLE_RAD / 2;

        itemPos.x = Math.abs(itemPos.x as number) < Number.EPSILON ? 0 : itemPos.x;
        itemPos.y = Math.abs(itemPos.y as number) < Number.EPSILON ? 0 : itemPos.y;

        itemPos.length = localMousePos.multiply(itemPos).length;

        if ((itemPos.length as number) < this.settings[SettingsGroup.MAIN].minDistance) {
            itemPos.length = this.settings[SettingsGroup.MAIN].minDistance;
        }

        let parentDelta = localMousePos.subtract(itemPos);

        this._animations.push(
            new Animation({
                target: this.root,
                to: {
                    position: (this.root.position as Point).add(parentDelta).floor()
                }
            }),
            new Animation({
                target: activeChild,
                from: {
                    position: activeChild.position as Point,
                },
                to: {
                    position: itemPos,
                }
            }),
            new Animation({
                target: this.connector,
                to: {
                    'lastSegment.point': itemPos
                }
            }),
            new Animation({
                target: this.geometryGroup,
                to: {
                    scaling: this.settings[SettingsGroup.SCALES].parent
                }
            }),
        );

        this._animations.onStop$((): void => {
            this.connector.lastSegment.point = itemPos;
        });

        if (this.state === ItemState.PARENT && typeof this.activeChild !== "undefined" && this.parent instanceof MenuItem) {
            this.parent.connector.strokeWidth = 2;
            this.parent.connector.strokeColor = ColorFactory.fromString('rgba(57,58,60,0.2)');
            this.parent.geometry.opacity = 0.25;
            this.parent.getChildren().filter(child => child !== this).forEach(child => {
                child.geometry.opacity = 0.25;
            });
        }
    }

    /**
     * Animation to Selected
     */
    protected animateStateSelected(): void {
        this.setColorSelected();
        this.icon.opacity = MenuItem.ICON_BG_OPACITY;

        this._animations.push(
            new Animation({
                target: this.geometryGroup,
                from: {
                    scaling: 0.9
                },
                to: {
                    scaling: 1.15
                },
            })
        );

        this._animations.onFinish$((): void => {
            this.root.state = ItemState.HIDDEN;
            this.root.visible = false;
        });
    }

    /**
     * Animation to Active Selection
     */
    protected animateStateActiveSelection(): void {
        this.setColorActiveSelected();

        this._animations.push(
            new Animation({
                target: this.geometryGroup,
                to: {
                    scaling: 1
                },
            })
        );

        this._animations.onFinish$((): void => {
            (new Animation({
                target: this.arcGroup,
                from: {
                    opacity: 0
                },
                to: {
                    opacity: 1
                },
                options: {
                    duration: this.settings[SettingsGroup.MAIN].animationDuration
                }
            })).start();
        });
    }

    /**
     * Fades in the Selection Arcs
     * @param angle
     */
    protected animateArcs(angle: number): void {
        (this.arcGroup.children as Item[]).forEach((arc: Item): void => {
            if (Angle.between(angle, arc.data.from, arc.data.to)) {
                (this.arcGroup.children as Item[])
                    .filter((a: Item): boolean => a !== arc)
                    .forEach((a: Item): void => {
                        if (typeof a.data.fx !== "undefined" && a.data.fx.running) {
                            a.data.fx.stop();
                        }
                        a.opacity = 0;
                    });

                if ((arc.opacity as number) < 1 && !arc.data.fx.running) {
                    arc.data.fx.initialize({
                        target: arc,
                        to: {
                            opacity: 1
                        },
                        options: {
                            duration: this.settings[SettingsGroup.MAIN].animationDuration,
                            easing: 'easeInCubic'
                        }
                    });
                    arc.data.fx.start();
                }
            }
        });
    }
}
