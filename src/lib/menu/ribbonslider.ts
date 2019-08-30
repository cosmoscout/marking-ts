import MenuItem from "./menu-item";
import {Group, Path, Point, Symbol, PointText} from 'paper';
import {ZERO_POINT} from "../constants";
import {ClickState, SettingsGroup} from "../enums";
import {DragDefinition} from "../interfaces";
import ColorFactory from "../../utlis/color-factory";


export default class Ribbonslider extends MenuItem {
    private static GRADIENT_LENGTH: number = 150;
    private static RIBBON_HEIGHT: number = 60;

    private static MASK_LENGTH_MULTIPLIER = 0.6;

    private ribbonGroup: Group;
    private ribbon: Path.Rectangle;
    private gradient: Path.Rectangle;

    private grabDotGroup: Symbol;

    private value = 0;

    private lastPos: Point;


    get isLeaf(): boolean {
        return false;
    }

    protected setupGeometry(): void {
        super.setupGeometry();
        this.setupGrabDotGroup();
        this.setupGradient();
        this.setupRibbon();

    }

    private setupGradient(): void {
        this.gradient = new Path.Rectangle(ZERO_POINT, new Point(Ribbonslider.GRADIENT_LENGTH, Ribbonslider.RIBBON_HEIGHT));
        this.gradient.bounds.center = ZERO_POINT;
        this.gradient.strokeWidth = 0;
        this.gradient.fillColor = {
            gradient: {
                stops: [
                    ['rgba(32, 32, 32, 0)'],
                    ['#202020', 0.3],
                    ['#202020', 0.7],
                    ['rgba(32, 32, 32, 0)'],
                ]
            },
            origin: this.gradient.bounds.leftCenter,
            destination: this.gradient.bounds.rightCenter
        };
    }

    private setupGrabDotGroup(): void {
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

        this.grabDotGroup = new Symbol(grabDotGroup);
    }

    private setupMaskGroup(): Path.Rectangle {
        let mask = new Path.Rectangle(ZERO_POINT, new Point(this.menu.canvas.width * Ribbonslider.MASK_LENGTH_MULTIPLIER, Ribbonslider.RIBBON_HEIGHT + 2));
        mask.bounds.center = ZERO_POINT;
        mask.strokeWidth = 0;
        mask.fillColor = {
            gradient: {
                stops: [
                    ['rgba(0, 0, 0, 0)'],
                    ['black', 0.1],
                    ['black', 0.9],
                    ['rgba(0, 0, 0, 0)'],
                ]
            },
            origin: mask.bounds.leftCenter,
            destination: mask.bounds.rightCenter
        };

        return mask;
    }

    private setupRibbon(): void {
        const pointerLockListener = (event) => {
            if (event.movementX != 0) {
                this.updateRibbonPosition(event.movementX);
                this.updateText('' + Math.round((this.ribbonGroup.position.x/this.data.stepDist)*this.data.stepSize));
            }
        };

        this.ribbonGroup = new Group({blendMode: 'source-in'});
        this.ribbon = new Path.Rectangle(ZERO_POINT, new Point(this.getRibbonLength() + Ribbonslider.GRADIENT_LENGTH, Ribbonslider.RIBBON_HEIGHT));
        //this.ribbon.bounds.center = ZERO_POINT;
        this.ribbonGroup.addChild(this.ribbon);

        this.ribbonGroup.pivot = this.ribbonGroup.bounds.leftCenter.add(new Point(Ribbonslider.GRADIENT_LENGTH / 2, 0));
        this.ribbonGroup.position = ZERO_POINT;

        this.ribbonGroup.onMouseDown = () => {
            this.menu.canvas.requestPointerLock();
            document.addEventListener('mousemove', pointerLockListener)
        };

        document.onmouseup = () => {
            document.exitPointerLock();
            document.removeEventListener('mousemove', pointerLockListener);
        };


        this.ribbonGroup.onMouseEnter = () => {
            this.menu.canvas.style.cursor = "ew-resize";
        };

        this.ribbonGroup.onMouseLeave = () => {
            this.menu.canvas.style.cursor = "default";
        };

        for (let i = 0; i <= this.getRibbonLength(); i += this.data.stepDist) {
            let value = new PointText(new Point(i+Ribbonslider.GRADIENT_LENGTH/2, 34));
            value.justification = 'center';
            value.fontSize = '16px';
            value.fontWeight = 'bold';
            value.fillColor = ColorFactory.fromString(this.settings[SettingsGroup.GEOMETRY].text.color);
            value.strokeWidth = 0;
            value.content = '' + (this.data.min + (i/this.data.stepDist) * this.data.stepSize);

            if (i > 0) {
                let dots = this.grabDotGroup.place(new Point(i+22, 30));
                this.ribbonGroup.addChild(dots);
            }
            this.ribbonGroup.addChild(value);
        }
    }

    protected getNearestChild(): MenuItem {
        this.hoveredChild = this;
        return this;
    }

    protected traceLogic(): void {
        return;
    }

    protected dragLogic(drag: DragDefinition): void {
        if (typeof this.lastPos === "undefined") {
            this.lastPos = drag.position;
            return;
        }

        const delta = drag.position.subtract(this.lastPos);

        this.updateRibbonPosition(delta.x);

        this.value -= (delta.x);
        //this.text.content = '' + this.value;


        this.lastPos = drag.position;

        return;
    }

    private updateRibbonPosition(deltaX: number): void {
        if (deltaX > 0) {
            // +10 removes deltaX fluctuations so that the ribbon won't snap back and forth
            if (this.ribbonGroup.bounds.leftCenter.x + (Ribbonslider.GRADIENT_LENGTH / 2) + deltaX + 10 < 0) {
                this.ribbonGroup.position.x += deltaX;
            } else {
                this.ribbonGroup.position.x = 0;
            }
        } else if(deltaX < 0) {
            if (this.ribbonGroup.bounds.rightCenter.x - (Ribbonslider.GRADIENT_LENGTH / 2) - deltaX - 30 > 0) {
                this.ribbonGroup.position.x += deltaX;
            } else {
                this.ribbonGroup.position.x = -this.getRibbonLength();
            }
        }

    }

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
        this.parent.connector.strokeWidth = 2;
        this.parent.connector.strokeColor = 'rgba(57,58,60,0.2)';
    }

    protected selectionLogicBackOperations() {
        return;
    }

    protected itemReady(): void {
        let group = new Group({children: [this.setupMaskGroup(), this.ribbonGroup], blendMode: 'source-over'});
        this.geometryGroup.addChild(group);
        this.geometryGroup.addChild(this.gradient);
        this.text.bringToFront();

        this.text.fontSize = 20;
    }

    private getRibbonLength(): number {
        if (typeof this.data === "undefined") {
            throw new Error("Slider data missing");
        }

        let max = this.data.max || 100;
        let min = this.data.min || 0;
        let stepSize = this.data.stepSize || 10;
        let stepDist = this.data.stepDist || 100;

        return ((max - min) / stepSize) * stepDist;
    }
}