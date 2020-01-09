import MenuItem from "./menu-item";
import {
    Color,
    Gradient,
    Group,
    Item,
    MouseEvent as PaperMouseEvent,
    Path,
    Point,
    PointText,
    SymbolDefinition
} from 'paper';
import {ZERO_POINT as CENTER, ZERO_POINT} from "../constants";
import {ClickState, DragState, ItemState, MenuItemEventType, SettingsGroup} from "../enums";
import {ArcDefinition, DragDefinition, SliderDefinition} from "../interfaces";
import ColorFactory from "../../utlis/color-factory";
import throttle from 'lodash/throttle'
import Animation from "../../utlis/animation";
import Angle from "../../utlis/angle";
import Arc from "../../utlis/arc";
import {precision, roundNumber} from "../../utlis/numbers";

export default class Ribbonslider extends MenuItem {
    /**
     * Group holding
     * - Ribbon
     * - Texts
     * - GrabDots
     */
    private _ribbonGroup: Group | undefined;

    /**
     * The main ribbon
     */
    private _ribbon: Path.Rectangle | undefined;

    /**
     * Gradient over indicator
     */
    private _gradient: Path.Rectangle | undefined;

    /**
     * 2x3 Grab dots
     * Use as grabDot.place(Position)
     */
    private _grabDot: SymbolDefinition | undefined;

    /**
     * Group holding the fade out mask and ribbon group
     */
    private _ribbonMaskGroup: Group | undefined;

    /**
     * The slide configuration
     */
    private _configuration: SliderDefinition | undefined;

    /**
     * Current slider value
     */
    private _value = 0;

    /**
     * Previous input position while dragging
     */
    private prevDragPosition: Point | undefined;

    /**
     * Flag if currently dragging
     */
    private dragging: boolean = false;

    /**
     * Bar indicating item is a slider while in child state
     */
    private childIndicator: Path | undefined;

    /**
     * Flag is input is over "done" arc
     */
    private done: boolean = false;

    public constructor(id: string, angle: number, text: string, icon?: string) {
        super(id, angle, text, icon);
    }

    /**
     * False to allow navigation into element
     */
    public get isLeaf(): boolean {
        return false;
    }

    /**
     * Call after setting data
     *
     * @return SliderDefinition
     */
    public get configuration(): SliderDefinition {
        if (typeof this._configuration === "undefined") {
            throw new Error(`Slider (${this.itemId}): configuration not set`);
        }

        return this._configuration;
    }

    /**
     * Checks validity of slider configuration
     * @param data
     */
    public set data(data: any) {
        const typeMin = typeof data.min;
        const typeMax = typeof data.max;
        const typeInitial = typeof data.initial;
        const typeStepSize = typeof data.stepSize;
        const typeStepDist = typeof data.stepDist;

        if (typeMin === "undefined" || typeMax === "undefined") {
            throw new Error(`Slider (${this.itemId}): configuration is missing 'min' and/or 'max' value`);
        }

        if (typeMin !== "number" || typeMax !== "number") {
            throw new Error(`Slider (${this.itemId}): min/max values have to be of type number`);
        }

        if (data.min > data.max || data.min === data.max) {
            throw new Error(`Slider (${this.itemId}): 'min' value is greater than or equal to 'max' value`);
        }

        if (typeInitial !== "undefined" && (data.initial < data.min || data.initial > data.max)) {
            throw new Error(`Slider (${this.itemId}): 'initial' value is not in min/max range`);
        } else if (typeInitial === "undefined") {
            data.initial = data.min;
        }

        if (Math.floor(data.initial % data.precision) !== 0) {
            throw new Error(`Slider (${this.itemId}): 'initial' is not achievable with 'precision'`);
        }

        if (typeStepSize === "undefined") {
            data.stepSize = 1;
        } else if (data.max - data.min <= data.stepSize) {
            throw new Error(`Slider (${this.itemId}): 'stepSize' is greater or equal to slider range`);
        }

        if (typeStepDist === "undefined") {
            data.stepDist = 100;
        }

        this._configuration = data;
    }

    /**
     * Sets the slider value and updates the slider text at max once per frame
     *
     * @param value number Slider value
     * @see {throttledTextUpdate}
     */
    public set value(value: number) {
        if (this._value === value) {
            return;
        }

        this._value = value;

        this.throttledTextUpdate('' + value);
    }

    /**
     * Accessor
     *
     * @see {_value}
     */
    public get value(): number {
        return this._value;
    }

    /**
     * Accessor
     *
     * @see {_ribbonGroup}
     */
    private get ribbonGroup(): Group {
        if (typeof this._ribbonGroup === "undefined") {
            throw new Error("Ribbon group not initialized");
        }

        return this._ribbonGroup;
    }

    /**
     * Accessor
     *
     * @see {_ribbon}
     */
    private get ribbon(): Path.Rectangle {
        if (typeof this._ribbon === "undefined") {
            throw new Error("Ribbon not initialized");
        }

        return this._ribbon;
    }

    /**
     * Accessor
     *
     * @see {_grabDot}
     */
    private get grabDot(): SymbolDefinition {
        if (typeof this._grabDot === "undefined") {
            throw new Error("Grab Dot Group not initialized");
        }

        return this._grabDot;
    }

    /**
     * Accessor
     *
     * @see {_gradient}
     */
    private get gradient(): Path.Rectangle {
        if (typeof this._gradient === "undefined") {
            throw new Error("Gradient not initialized");
        }

        return this._gradient;
    }

    /**
     * Accessor
     *
     * @see {_ribbonGroup}
     */
    private get ribbonMaskGroup(): Group {
        if (typeof this._ribbonMaskGroup === "undefined") {
            throw new Error("Ribbon Mask Group not initialized");
        }

        return this._ribbonMaskGroup;
    }

    /**
     * Moves the Ribbon to a given position of a slider value
     * @param value
     * @param animated True if movement should be animated
     */
    public moveRibbonToValuePosition(value: number, animated = false): void {
        if (value > this.configuration.max || value < this.configuration.min) {
            throw RangeError(`Slider (${this.itemId}): 'value' out of slider range`);
        }

        const percentage = (value - this.configuration.min) / (this.configuration.max - this.configuration.min);
        const pos = -((!Number.isNaN(percentage)) ? percentage * this.getRibbonLength() : 0);

        // Todo consolidate into separate method
        if (animated) {
            new Animation({
                target: this.ribbonGroup,
                to: {
                    'position.x': pos
                },
                options: {
                    duration: this.settings[SettingsGroup.MAIN].animationDuration,
                    easing: 'easeInCubic'
                }
            }).start();
        } else {
            this.ribbonGroup.position.x = pos;
        }

        let eventType = MenuItemEventType.SLIDER_VALUE_CHANGING;

        if (!this.dragging) {
            eventType = MenuItemEventType.SLIDER_VALUE_FINAL;
        }

        this.event(eventType, this, {
            'value': value,
        });
    }

    protected setupGeometry(): void {
        this._geometry = new Path.Circle(CENTER, this.settings[SettingsGroup.GEOMETRY].size);

        this.setGeometryColorDefault();
        this.geometry.strokeScaling = false;
    }

    /**
     * Creates the little box visible in child state, denoting the items slider class.
     * Created pre setup to utilize setGeometryColorDefault & setGeometryColorSelected
     */
    protected preSetup(): void {
        this.childIndicator = new Path.Rectangle(
            ZERO_POINT,
            new Point(
                this.settings[SettingsGroup.RIBBONSLIDER].gradientLength * 0.8,
                this.settings[SettingsGroup.RIBBONSLIDER].ribbonHeight * 0.8
            )
        );

        this.childIndicator.position = ZERO_POINT;
        this.childIndicator.strokeScaling = false;
    }

    /**
     * Setup more things
     */
    protected afterSetup(): void {
        this.setupGrabDotSymbol();
        this.setupGradient();
        this.setupRibbon();
    }

    /**
     * Since this item has no children remove the logic
     */
    protected getNearestChild(): MenuItem {
        this.hoveredChild = this;
        return this;
    }

    /**
     * Disable traces
     */
    protected traceLogic(): void {
        return;
    }

    /**
     * Enable pointer lock upon dragging
     * @param drag
     */
    protected dragLogic(drag: DragDefinition): void {
        if (drag.state === DragState.END) {
            this.moveRibbonToValuePosition(this.value, true);
            this.prevDragPosition = undefined;
            this.dragging = false;
            this.ribbon.fillColor = ColorFactory.fromString(this.settings[SettingsGroup.GEOMETRY].color);

            this.event(MenuItemEventType.SLIDER_VALUE_FINAL, this, {
                value: this.value,
            });

            return;
        }

        this.dragging = true;

        if (this.prevDragPosition === undefined) {
            this.updateText('' + this.value);
            this.prevDragPosition = drag.position;
        }

        this.ribbon.fillColor = ColorFactory.fromString(this.settings[SettingsGroup.GEOMETRY].selectionColor);

        const percentage = (Math.abs(this.ribbonGroup.position.x) / (this.getRibbonLength() || 1));

        let value = this.configuration.precision * Math.round(percentage * (this.configuration.max - this.configuration.min) / this.configuration.precision) + this.configuration.min;
        value = roundNumber(value, precision(this.configuration.precision));

        this.value = Math.min(Math.max(value, this.configuration.min), this.configuration.max);

        if (this.inSnappingRange()) {
            this.updateRibbonPosition(this.prevDragPosition.y - drag.position.y);
        } else {
            this.updateRibbonPosition(drag.position.x - this.prevDragPosition.x);
        }

        this.prevDragPosition = drag.position;
    }

    /**
     * @inheritDoc
     */
    protected clickLogic(clickState: ClickState): void {
        this.hoveredChild = undefined;

        if (this.getPositionToTest() > this.settings[SettingsGroup.GEOMETRY].sizeDeadZone) {
            if (this.done) {
                this.state = ItemState.SELECTED;
                this.root.redraw();
            } else {
                super.clickLogic(clickState);
            }
        }
    }

    protected selectionLogic(angle: number): void {
        if (this.dragging) {
            return;
        }

        if (this.getPositionToTest() > this.settings[SettingsGroup.GEOMETRY].sizeDeadZone) {
            super.selectionLogic(angle);
        } else {
            this.updateText('' + this.value);
            (this.arcGroup.children as Item[])
                .forEach((a: Item): void => {
                    if (typeof a.data.fx !== "undefined" && a.data.fx.running) {
                        a.data.fx.stop();
                    }
                    a.opacity = 0;
                });
        }
    }

    /**
     * Position to test the dead zone against.
     * Horizontal State = Y-Position
     * Vertical State = X-Position
     */
    private getPositionToTest(): number {
        let pos: number;

        if (this.inSnappingRange()) {
            pos = Math.abs(this.globalToLocal(this.menu.inputPosition).x);
        } else {
            pos = Math.abs(this.globalToLocal(this.menu.inputPosition).y);
        }

        return pos;
    }

    protected selectionLogicHoverOperations() {
        if (this.dragging) {
            return;
        }

        this.updateText('Done');
        this.done = true;
    }

    /**
     * @inheritDoc
     */
    protected setGroupsVisibility(): void {
        super.setGroupsVisibility();

        this.text.visible = true;
        this.icon.opacity = 0;

        if (this.state === ItemState.DOT) {
            this.text.visible = false;
        }
    }

    /**
     * @inheritDoc
     */
    protected animateStateActive(): void {
        super.animateStateActive();
        this.geometry.fillColor = ColorFactory.fromString(this.settings[SettingsGroup.GEOMETRY].color);
    }

    /**
     * @inheritDoc
     */
    protected selectionLogicBackOperations() {
        if (this.dragging) {
            return;
        }

        super.selectionLogicBackOperations();
        this.done = false;
    }

    /**
     * @inheritDoc
     */
    protected itemReady(): void {
        super.itemReady();

        this._ribbonMaskGroup = new Group({
            children: [this.createMask(), this.ribbonGroup],
            blendMode: 'source-over'
        });
        this.ribbonMaskGroup.addChild(this.gradient);
        this.geometryGroup.addChild(this.ribbonMaskGroup);

        this.geometryGroup.addChild(this.childIndicator);

        if (this.inSnappingRange()) {
            this.ribbonMaskGroup.pivot = CENTER;
            this.ribbonMaskGroup.rotate(-90);
        }

        this.text.bringToFront();

        this.text.fontSize = '20px';

        this.value = this.configuration.initial;
        this.moveRibbonToValuePosition(this.value);

        this.collectArcAngles();
        this.createArcs();
    }

    /**
     * Collect child angles for arc creation
     * @TODO somewhat messy
     */
    protected collectArcAngles(): void {
        let angles: Array<number> = new Array<number>();

        let newAngle: number;

        const angle = Angle.toDeg(this.angle);

        if (angle > 45 && angle < 135) {
            newAngle = 90;
        }

        if (angle > 235 && angle < 315) {
            newAngle = 270;
        }

        if (Angle.between(angle, 315, 45)) {
            newAngle = 0;
        } else if (Angle.between(angle, 135, 235)) {
            newAngle = 180;
        }

        const parentWedgeAngle = Angle.opposite(Angle.toRad(newAngle));

        angles.push(parentWedgeAngle);

        if (angles.length === 1) {
            angles.push(Angle.toRad(newAngle));
        }

        this.arcs = Arc.fromAngles(angles);

        this.parentArc = this.arcs.find((arc: ArcDefinition): boolean => arc.origAngle === parentWedgeAngle);
    }

    /**
     * @inheritDoc
     */
    protected stateChanged(): void {
        super.stateChanged();
        if (this.state === ItemState.ACTIVE) {
            this.updateText('' + this.value);
            this.moveRibbonToValuePosition(this.value);
            this.ribbonMaskGroup.visible = true;
            this.childIndicator.visible = false;
            this.gradient.visible = true;

        } else if (this.state === ItemState.SELECTED) {

        } else {
            this.ribbonMaskGroup.visible = false;
            this.childIndicator.visible = true;
            this.gradient.visible = false;
            this.updateText('' + this.value);

        }

        if (this.state === ItemState.DOT) {
            this.childIndicator.visible = false;
        }
    }

    /**
     * Remove operation logic if input device is in geometry
     */
    protected selectionLogicInGeometryOperations(): void {
        return;
    }

    protected setGeometryColorDefault(): void {
        super.setGeometryColorDefault();
        this.childIndicator.fillColor = ColorFactory.fromString(this.settings[SettingsGroup.GEOMETRY].color);
    }

    protected setGeometryColorSelected(): void {
        this.childIndicator.fillColor = ColorFactory.fromString(this.settings[SettingsGroup.GEOMETRY].selectionColor);
    }

    /**
     * Can't have children
     */
    protected getChildren(): Array<MenuItem> {
        return [];
    }

    /**
     * Slider is horizontal per default.
     * If item angle is between >45° && <135° || >235° && <315°, rotate the slider to a vertical position.
     *
     * @return boolean
     */
    private inSnappingRange(): boolean {
        const angle = Angle.toDeg(this.angle);

        return (angle > 45 && angle < 135) || (angle > 235 && angle < 315);
    }

    /**
     * Creates the main ribbon and sets up the content
     * @see {_ribbon}
     * @see {setupRibbonContent}
     */
    private setupRibbon(): void {
        this._ribbonGroup = new Group({blendMode: 'source-in'});
        this._ribbon = new Path.Rectangle(
            ZERO_POINT,
            new Point(
                this.getRibbonLength() + this.settings[SettingsGroup.RIBBONSLIDER].gradientLength,
                this.settings[SettingsGroup.RIBBONSLIDER].ribbonHeight
            )
        );

        this.ribbonGroup.addChild(this.ribbon);
        this.ribbonGroup.pivot = this.ribbonGroup.bounds.leftCenter.add(
            new Point(
                this.settings[SettingsGroup.RIBBONSLIDER].gradientLength / 2,
                0
            )
        );
        this.ribbonGroup.position = CENTER;

        this.ribbon.onMouseEnter = () => {
            this.menu.canvas.style.cursor = "ew-resize";
        };

        this.ribbon.onMouseLeave = () => {
            this.menu.canvas.style.cursor = "default";
        };

        this.setupRibbonContent();
    }

    /**
     * Adds the grab dots and value texts to the ribbon
     */
    private setupRibbonContent(): void {
        const onMouseLeave = () => {
            this.menu.canvas.style.cursor = "default";
        };
        const onMouseEnterResize = () => {
            this.menu.canvas.style.cursor = "ew-resize";
        };
        const textOnClick = (e: PaperMouseEvent) => {
            this.value = e.target.data.value;
            this.moveRibbonToValuePosition(this.value, true);
        };


        for (let i = 0; i <= this.getRibbonLength() / (this.configuration.stepDist / 2); i++) {
            const position = new Point(
                i * (this.configuration.stepDist / 2) + this.settings[SettingsGroup.RIBBONSLIDER].gradientLength / 2,
                this.settings[SettingsGroup.RIBBONSLIDER].ribbonHeight / 2
            );

            if (i % 2 === 0) {

                let valueText = (this.text.clone() as PointText);
                if (this.inSnappingRange()) {
                    valueText.rotate(90);
                }

                let stepValue = Math.round((this.configuration.min + i * this.getPrecision() / 2) * 100) / 100;

                valueText.position = position;

                valueText.content = '' + stepValue;
                valueText.data.value = stepValue;

                valueText.onMouseLeave = (e: PaperMouseEvent) => {
                    onMouseLeave();
                    e.target.fillColor = ColorFactory.fromString(this.settings[SettingsGroup.GEOMETRY].text.color);
                };
                valueText.onClick = textOnClick;
                this.ribbonGroup.addChild(valueText);
            } else {
                let dots = this.grabDot.place(position);
                dots.onMouseEnter = onMouseEnterResize;

                this.ribbonGroup.addChild(dots);
            }
        }
    }

    /**
     * Creates the darkened gradient to hide slider values
     * @see {_gradient}
     */
    private setupGradient(): void {
        this._gradient = new Path.Rectangle(
            ZERO_POINT,
            new Point(
                this.settings[SettingsGroup.RIBBONSLIDER].gradientLength,
                this.settings[SettingsGroup.RIBBONSLIDER].ribbonHeight - this.settings[SettingsGroup.GEOMETRY].stroke.width
            )
        );
        this.gradient.bounds.center = CENTER;
        this.gradient.strokeWidth = 0;

        let gradient = ColorFactory.fromArray([
            this.settings[SettingsGroup.RIBBONSLIDER].gradientColorSides,
            [this.settings[SettingsGroup.RIBBONSLIDER].gradientColor, 0.3], // 30%
            [this.settings[SettingsGroup.RIBBONSLIDER].gradientColor, 0.7], // 70%
            this.settings[SettingsGroup.RIBBONSLIDER].gradientColorSides,
        ]) as Gradient;

        this.gradient.fillColor = new Color(
            gradient,
            this.gradient.bounds.leftCenter,
            this.gradient.bounds.rightCenter
        );
    }

    /**
     * Creates the grab dot symbol
     * @see {_grabDot}
     */
    private setupGrabDotSymbol(): void {
        let grabDotGroup = new Group();
        let dots = Array<Item>();

        let circle = new Path.Circle(ZERO_POINT, 3);
        circle.fillColor = ColorFactory.fromString(this.settings[SettingsGroup.GEOMETRY].stroke.color);
        circle.strokeWidth = 0;

        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 2; j++) {
                let c = circle.clone();
                c.position = ZERO_POINT.add(new Point(j * 10, i * 10));
                dots.push(c);
            }

            grabDotGroup.addChildren(dots);
            dots.length = 0;
        }
        grabDotGroup.pivot = grabDotGroup.bounds.center;

        this._grabDot = new SymbolDefinition(grabDotGroup);
    }

    /**
     * Creates the fade out mask
     * @see {itemReady}
     */
    private createMask(): Path.Rectangle {
        let mask = new Path.Rectangle(
            ZERO_POINT,
            new Point(
                this.menu.canvas.width * this.settings[SettingsGroup.RIBBONSLIDER].maskLengthMultiplier,
                this.settings[SettingsGroup.RIBBONSLIDER].ribbonHeight + 2
            )
        );
        mask.bounds.center = CENTER;
        mask.strokeWidth = 0;

        let gradient = ColorFactory.fromArray([
            'rgba(0, 0, 0, 0)',
            ['#000', this.settings[SettingsGroup.RIBBONSLIDER].maskStart], // 10%
            ['#000', 1 - this.settings[SettingsGroup.RIBBONSLIDER].maskStart], // 90%
            'rgba(0, 0, 0, 0)',
        ]) as Gradient;

        mask.fillColor = new Color(gradient, mask.bounds.leftCenter, mask.bounds.rightCenter);

        return mask;
    }


    /**
     * Calculate the ribbon length
     */
    private getRibbonLength(): number {
        return ((this.configuration.max - this.configuration.min) / this.getPrecision()) * this.configuration.stepDist;
    }

    private getPrecision(): number {
        return (typeof this.configuration.stepSize !== "undefined") ? this.configuration.stepSize : this.configuration.precision;
    }

    /**
     * Updates the ribbon position
     * Positive values = Move to right
     *
     * @param delta The amount to move
     * @param animated True if movement should be animated
     */
    private updateRibbonPosition(delta: number, animated: boolean = false): void {
        let positionX: number = 0;

        if (delta >= 0) {
            if (this.ribbonGroup.bounds.leftCenter.x + (this.settings[SettingsGroup.RIBBONSLIDER].gradientLength / 2) + delta <= 0) {
                positionX = this.ribbonGroup.position.x + delta;
            } else {
                positionX = 0;
            }
        } else if (delta < 0) {
            if (this.ribbonGroup.bounds.rightCenter.x - (this.settings[SettingsGroup.RIBBONSLIDER].gradientLength / 2) + delta >= 0) {
                positionX = this.ribbonGroup.position.x + delta;
            } else {
                positionX = -this.getRibbonLength();
            }
        }

        if (animated) {
            new Animation({
                target: this.ribbonGroup,
                to: {
                    'position.x': positionX
                },
                options: {
                    duration: this.settings[SettingsGroup.MAIN].animationDuration,
                    easing: 'easeOutCubic'
                }
            }).start();
        } else {
            this.ribbonGroup.position.x = positionX;
        }

        this.event(MenuItemEventType.SLIDER_VALUE_CHANGING, this, {
            'value': this.value,
        });
    }

    /**
     * Throttles text updates to once per frame
     *
     * @see {updateText}
     */
    private throttledTextUpdate = throttle(this.updateText, 16, {
        leading: true
    });
}
