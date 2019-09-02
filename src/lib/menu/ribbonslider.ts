import MenuItem from "./menu-item";
import {Color, Gradient, Group, MouseEvent, Path, Point, PointText, Symbol} from 'paper';
import {ZERO_POINT} from "../constants";
import {ClickState, DragState, ItemState, SettingsGroup} from "../enums";
import {DragDefinition, SliderDefinition} from "../interfaces";
import ColorFactory from "../../utlis/color-factory";
import throttle from 'lodash/throttle'
import Animation from "../../utlis/animation";
import Angle from "../../utlis/angle";

export default class Ribbonslider extends MenuItem {
    /**
     * The length in px of the dark gradient
     */
    private static GRADIENT_LENGTH: number = 150;
    /**
     * Ribbon height in px
     */
    private static RIBBON_HEIGHT: number = 60;

    /**
     * Multiplier for the fade out mask
     * Width = canvas width * multiplier
     */
    private static MASK_LENGTH_MULTIPLIER = 0.6;

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
     * 3x4 Grab dots
     * Use as grabDot.place(Position)
     */
    private _grabDot: Symbol | undefined;

    /**
     * Group holding the fade out mask and ribbon group
     */
    private _ribbonMaskGroup: Group | undefined;

    private _configuration: SliderDefinition | undefined;

    /**
     * Current slider value
     */
    private _value = 0;

    /**
     * True if PointerLock is engaged
     */
    private hasLock: boolean = false;


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

        if (Math.floor(data.initial % data.stepSize) !== 0) {
            throw new Error(`Slider (${this.itemId}): 'initial' is not achievable with 'stepSize'`);
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

    public get configuration(): SliderDefinition {
        if (typeof this._configuration === "undefined") {
            throw new Error(`Slider (${this.itemId}): configuration not set`);
        }

        return this._configuration;
    }

    /**
     * Sets the slider value and updates the slider text at max once per frame
     *
     * @param value number Slider value
     * @see {throttledTextUpdate}
     */
    private set value(value: number) {
        if (this._value === value) {
            return;
        }

        this._value = value;

        this.throttledTextUpdate('' + value);
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
    private get grabDot(): Symbol {
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
     * @{see} _ribbonGroup
     */
    private get ribbonMaskGroup(): Group {
        if (typeof this._ribbonMaskGroup === "undefined") {
            throw new Error("Ribbon Mask Group not initialized");
        }

        return this._ribbonMaskGroup;
    }

    /**
     * Throttles text updates to once per frame
     *
     * @see {updateText}
     */
    private throttledTextUpdate = throttle(this.updateText, 16, {
        leading: true
    });

    /**
     * Accessor
     *
     * @see {_value}
     */
    private get value(): number {
        return this._value;
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
     * Creates the darkened gradient to hide slider values
     * @see {_gradient}
     */
    private setupGradient(): void {
        this._gradient = new Path.Rectangle(ZERO_POINT, new Point(Ribbonslider.GRADIENT_LENGTH, Ribbonslider.RIBBON_HEIGHT));
        this.gradient.bounds.center = ZERO_POINT;
        this.gradient.strokeWidth = 0;

        let gradient = ColorFactory.fromArray([
            'rgba(32, 32, 32, 0)',
            [this.settings[SettingsGroup.GEOMETRY].stroke.color, 0.3], // 30%
            [this.settings[SettingsGroup.GEOMETRY].stroke.color, 0.7], // 70%
            'rgba(32, 32, 32, 0)',
        ]) as Gradient;

        this.gradient.fillColor = new Color(gradient, this.gradient.bounds.leftCenter, this.gradient.bounds.rightCenter);
    }

    /**
     * Creates the grab dot symbol
     * @see {_grabDot}
     */
    private setupGrabDotSymbol(): void {
        let grabDotGroup = new Group();
        let dots = Array<Path.Circle>();

        let circle = new Path.Circle(ZERO_POINT, 3);
        circle.fillColor = this.settings[SettingsGroup.GEOMETRY].stroke.color;
        circle.strokeWidth = 0;

        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 3; j++) {
                let c = circle.clone();
                c.position = ZERO_POINT.add(new Point(j * 10, i * 10));
                dots.push(c);
            }

            grabDotGroup.addChildren(dots);
            dots.length = 0;
        }
        grabDotGroup.pivot = grabDotGroup.bounds.center;

        this._grabDot = new Symbol(grabDotGroup);
    }

    /**
     * Creates the fade out mask
     * @see {itemReady}
     */
    private createMask(): Path.Rectangle {
        let mask = new Path.Rectangle(ZERO_POINT, new Point(this.menu.canvas.width * Ribbonslider.MASK_LENGTH_MULTIPLIER, Ribbonslider.RIBBON_HEIGHT + 2));
        mask.bounds.center = ZERO_POINT;
        mask.strokeWidth = 0;

        let gradient = ColorFactory.fromArray([
            'rgba(0, 0, 0, 0)',
            ['#000', 0.1], // 10%
            ['#000', 0.9], // 90%
            'rgba(0, 0, 0, 0)',
        ]) as Gradient;

        mask.fillColor = new Color(gradient, mask.bounds.leftCenter, mask.bounds.rightCenter);

        return mask;
    }

    /**
     * Creates the main ribbon and sets up the content
     * @see {_ribbon}
     * @see {setupRibbonContent}
     */
    private setupRibbon(): void {
        this._ribbonGroup = new Group({blendMode: 'source-in'});
        this._ribbon = new Path.Rectangle(ZERO_POINT, new Point(this.getRibbonLength() + Ribbonslider.GRADIENT_LENGTH, Ribbonslider.RIBBON_HEIGHT));

        this.ribbonGroup.addChild(this.ribbon);
        this.ribbonGroup.pivot = this.ribbonGroup.bounds.leftCenter.add(new Point(Ribbonslider.GRADIENT_LENGTH / 2, 0));
        this.ribbonGroup.position = ZERO_POINT;

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
        const onMouseEnterPointer = (e: MouseEvent) => {
            e.target.fillColor = this.settings[SettingsGroup.GEOMETRY].selectionColor;
            this.menu.canvas.style.cursor = "pointer";
        };
        const onMouseLeave = () => {
            this.menu.canvas.style.cursor = "default";
        };
        const onMouseEnterResize = () => {
            this.menu.canvas.style.cursor = "ew-resize";
        };
        const textOnClick = (e: MouseEvent) => {
            this.updateRibbonPosition(-(e.target.position.x + this.ribbonGroup.position.x - Ribbonslider.GRADIENT_LENGTH / 2), true);
            this.value = e.target.data.value;
        };

        for (let i = 0; i <= this.getRibbonLength() / (this.configuration.stepDist / 2); i++) {
            if (i % 2 === 0) {
                let valueText = (this.text.clone() as PointText);
                let stepValue = Math.round((this.configuration.min + i * this.configuration.stepSize / 2) * 100) / 100;
                valueText.position = new Point(i * (this.configuration.stepDist / 2) + Ribbonslider.GRADIENT_LENGTH / 2, Ribbonslider.RIBBON_HEIGHT / 2);
                valueText.content = '' + stepValue;
                valueText.data.value = stepValue;
                valueText.onMouseEnter = onMouseEnterPointer;
                valueText.onMouseLeave = (e: MouseEvent) => {
                    onMouseLeave();
                    e.target.fillColor = this.settings[SettingsGroup.GEOMETRY].text.color;
                };
                valueText.onClick = textOnClick;
                this.ribbonGroup.addChild(valueText);
            } else {
                let dots = this.grabDot.place(new Point(i * (this.configuration.stepDist / 2) + Ribbonslider.GRADIENT_LENGTH / 2, Ribbonslider.RIBBON_HEIGHT / 2));
                dots.onMouseEnter = onMouseEnterResize;

                this.ribbonGroup.addChild(dots);
            }
        }
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
     * @see {pointerLockListener}
     */
    protected dragLogic(drag: DragDefinition): void {
        if (!this.hasLock) {
            // @ts-ignore
            this.menu.canvas.requestPointerLock();
            this.ribbon.fillColor = this.settings[SettingsGroup.GEOMETRY].selectionColor;
            document.addEventListener('mousemove', this.pointerLockListener);
            this.hasLock = true;
        }

        if (drag.state === DragState.END && this.hasLock) {
            // @ts-ignore
            document.exitPointerLock();
            this.ribbon.fillColor = this.settings[SettingsGroup.GEOMETRY].color;
            document.removeEventListener('mousemove', this.pointerLockListener);
            this.hasLock = false;
        }

        return;
    }

    /**
     * Pointer Lock Listener
     * Updates the Ribbon Position and updates the text
     * @param event
     * @see {updateRibbonPosition}
     * @see {value}
     */
    private pointerLockListener = (event: NativeMouseEvent) => {
        if (event.movementX != 0) {
            const value = this.configuration.min - (this.ribbonGroup.position.x / this.configuration.stepDist) * this.configuration.stepSize;
            this.value =  Math.round((value * 100) *this.configuration.stepSize);
            this.updateRibbonPosition(event.movementX);
        }
    };

    /**
     * Updates the ribbon position
     * Positive values = Move to right
     *
     * @param deltaX The amount to move
     * @param animated True if movement should be animated
     */
    private updateRibbonPosition(deltaX: number, animated: boolean = false): void {
        let positionX: number = 0;

        if (deltaX > 0) {
            if (this.ribbonGroup.bounds.leftCenter.x + (Ribbonslider.GRADIENT_LENGTH / 2) + deltaX <= 0) {
                positionX = this.ribbonGroup.position.x + deltaX;
            } else {
                positionX = 0;
            }
        } else if (deltaX < 0) {
            if (this.ribbonGroup.bounds.rightCenter.x - (Ribbonslider.GRADIENT_LENGTH / 2) + deltaX >= 0) {
                positionX = this.ribbonGroup.position.x + deltaX;
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
    }

    /**
     * Moves the
     * @param value
     */
    public moveRibbonToValuePosition(value: number): void {
        if (value > this.configuration.max || value < this.configuration.min) {
            throw RangeError(`Slider (${this.itemId}): 'value' out of slider range`);
        }

        this.ribbonGroup.position.x = -(this.configuration.stepDist * ((value - this.configuration.min) / this.configuration.stepSize));
    }

    /**
     * TODO
     * Only listens to right clicks atm
     * @param clickState
     */
    protected clickLogic(clickState: ClickState): void {
        this.hoveredChild = undefined;
        if (clickState === ClickState.RIGHT_CLICK) {
            super.clickLogic(clickState);
        }
    }

    protected setGroupsVisibility(): void {
        super.setGroupsVisibility();
        this.lineGroup.visible = false;
        this.arcGroup.visible = false;
        this.text.visible = true;
        this.icon.opacity = 0;
    }

    protected animateStateActive(): void {
        super.animateStateActive();
        this.geometry.fillColor = this.settings[SettingsGroup.GEOMETRY].color;
        (this.parent as MenuItem).connector.strokeWidth = 2;
        (this.parent as MenuItem).connector.strokeColor = 'rgba(57,58,60,0.2)';
    }

    protected selectionLogicBackOperations() {
        return;
    }

    protected itemReady(): void {
        this._ribbonMaskGroup = new Group({
            children: [this.createMask(), this.ribbonGroup],
            blendMode: 'source-over'
        });
        this.geometryGroup.addChild(this.ribbonMaskGroup);
        this.geometryGroup.addChild(this.gradient);
        this.text.bringToFront();

        this.text.fontSize = '20px';

        this.value = this.configuration.initial;
        this.moveRibbonToValuePosition(this.value);
        this.geometryGroup.addChild(this.createIndicatorCaret());
    }

    /**
     * Creates a triangle
     */
    private createIndicatorCaret(): Path.RegularPolygon {
        const caret = new Path.RegularPolygon(ZERO_POINT, 3, 10);
        caret.pivot = caret.bounds.bottomCenter;
        caret.rotate(Angle.toDeg(Math.PI));
        caret.segments[1].point = caret.segments[1].point.add(new Point(0, 3));
        caret.strokeWidth = 0;
        caret.fillColor = this.settings[SettingsGroup.GEOMETRY].stroke.color;
        caret.position = (this.geometry.bounds.topCenter.add(new Point(0, 1)));

        return caret;
    }

    /**
     * Calculate the ribbon length
     */
    private getRibbonLength(): number {
        return ((this.configuration.max - this.configuration.min) / this.configuration.stepSize) * this.configuration.stepDist;
    }

    /**
     * Remove operation logic if input device is in geometry
     */
    protected selectionLogicInGeometryOperations(): void {
        return;
    }

    protected stateChanged(): void {
        super.stateChanged();
        if (this.state === ItemState.ACTIVE) {
            this.updateText('' + this.value);
            this.moveRibbonToValuePosition(this.value);
            this.ribbonMaskGroup.visible = true;
            this.gradient.visible = true;
        } else {
            this.ribbonMaskGroup.visible = false;
            this.gradient.visible = false;
        }
    }
}