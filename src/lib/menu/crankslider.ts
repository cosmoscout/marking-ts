import MenuItem from "./menu-item";
import {Group, Path, Point, PointText} from 'paper';
import Angle from "../../utlis/angle";
import {DragDefinition} from "../interfaces";
import {REFERENCE_POINT, ZERO_POINT} from "../constants";
import {ClickState, DragState, ItemState, SettingsGroup} from "../enums";
import Animation from "../../utlis/animation";


export default class Crankslider extends MenuItem {
    public STEP_SIZE: number = 1;

    private valueGroup: Group;
    private indicator: Path;
    private indicatorDot: Path;

    public constructor(id: string, angle: number, text: string, icon?: string) {
        super(id, angle, text, icon);


        //@ts-ignore
        document.querySelector('body').addEventListener("wheel", (e: WheelEvent): void => {
            this.geometryGroup.rotate(1 * Math.sign(e.deltaY));

            //this.geometry.scaling = this.geometry.scaling.add(new Point(-0.1 * Math.sign(e.deltaY), -0.1 * Math.sign(e.deltaY)));
            this.updateText();
            this.text.rotation = -this.geometryGroup.rotation;
            this.valueGroup.rotation = -this.geometryGroup.rotation;
        });

        //@ts-ignore
        document.querySelector('body').addEventListener('dblclick', (e: MouseEvent): void => {
            const point = new Point(e.clientX, e.clientY);

            if (this.state === ItemState.ACTIVE && ZERO_POINT.getDistance(this.globalToLocal(point)) <= this.settings[SettingsGroup.GEOMETRY].size) {
                this.navigateBack();
            }
        });

    }


    protected setupGeometry(): void {
        super.setupGeometry();

        //const indicator = new Path.Circle(this.geometry.bounds.topCenter, 10);
        this.indicator = new Path.Line(this.geometry.bounds.topCenter, this.geometry.bounds.topCenter.multiply(1.25));
        this.indicator.strokeWidth = 2;

        this.geometryGroup.addChild(this.indicator);

        this.valueGroup = new Group();
        this.valueGroup.pivot = ZERO_POINT;
        for (let i = 0; i < 2 * Angle.HALF_CIRCLE_RAD; i += Angle.HALF_CIRCLE_RAD / 2) {
            const pos = new Point(Angle.toX(i, 90), Angle.toY(i, 90));
            const text = new PointText(pos);
            text.content = Angle.toDeg(i).toString();
            text.justification = 'center';
            text.strokeWidth = 0;
            text.fontWeight = 'bold';
            text.bounds.center = pos;

            this.valueGroup.addChild(text);
        }
        for (let i = 0; i < 2 * Angle.HALF_CIRCLE_RAD; i += Angle.HALF_CIRCLE_RAD / 8) {
            let from = 65;
            let to: number;

            if (Angle.toDeg(i) % Angle.toDeg(Angle.HALF_CIRCLE_RAD / 4) === 0) {
                to = 75;
            } else {
                to = 70;
            }


            const line = new Path.Line(
                new Point(Angle.toX(i, from), Angle.toY(i, from)),
                new Point(Angle.toX(i, to), Angle.toY(i, to))
            );

            line.strokeWidth = 1;

            this.valueGroup.addChild(line);
        }

        this.geometryGroup.addChild(this.valueGroup);

        this.indicatorDot = new Path.Circle(this.geometry.bounds.topCenter, 5);
        this.indicatorDot.visible = false;
        this.geometryGroup.addChild(this.indicatorDot);

    }

    public get isLeaf(): boolean {
        return false;
    }


    protected getNearestChild(): MenuItem {
        return this;
    }

    protected navigateBack(): void {
        this.parent.connector.strokeColor = '#393a3c';
        this.parent.connector.strokeWidth = 10;
        super.navigateBack();
    }

    protected setGroupsVisibility(): void {
        super.setGroupsVisibility();
        this.lineGroup.visible = false;
        this.arcGroup.visible = false;
        this.text.visible = true;
        this.icon.opacity = MenuItem.ICON_BG_OPACITY;

        this.valueGroup.visible = this.state === ItemState.ACTIVE;
        this.indicator.visible = this.state === ItemState.ACTIVE;
        this.indicatorDot.visible = this.state === ItemState.ACTIVE;



        if (this.state === ItemState.DOT) {
            this.text.visible = false;
        }
    }

    protected updateText(): void {
        const angle = Math.round(((this.geometryGroup.rotation) + Angle.FULL_CIRCLE_DEG) % Angle.FULL_CIRCLE_DEG);

        super.updateText(angle + '');
    }

    protected dragLogic(drag: DragDefinition): void {
        const scale = 1;//ZERO_POINT.getDistance(this.globalToLocal(drag.position)) / 100;

        this.geometryGroup.rotation = -this.globalToLocal(drag.position).getDirectedAngle(REFERENCE_POINT) / scale;

        this.updateText();
        this.text.rotation = -this.geometryGroup.rotation;
        this.valueGroup.rotation = -this.geometryGroup.rotation;
        this.indicatorDot.rotation = -this.geometryGroup.rotation;

        this.connector.visible = drag.state !== DragState.END;
        this.connector.lastSegment.point = this.globalToLocal(drag.position);
        this.connector.strokeWidth = 2;
        this.indicatorDot.position.length =  ZERO_POINT.getDistance(this.globalToLocal(drag.position));

        if (drag.state === DragState.END) {
            this.indicatorDot.position.length =  this.geometry.bounds.topCenter.getDistance(ZERO_POINT);
            //this.navigateBack();
        }
    }

    protected traceLogic(): void {
        return;
    }

    protected clickLogic(state: ClickState): void {
        const localPos = this.globalToLocal(this.menu.inputPosition);

        if (state === ClickState.RIGHT_CLICK) {
            this.navigateBack();
        } else if(ZERO_POINT.getDistance(localPos) >= this.settings[SettingsGroup.GEOMETRY].size) {
            const scale = 1;//ZERO_POINT.getDistance(this.globalToLocal(drag.position)) / 100;

            this.geometryGroup.rotation = -this.globalToLocal(this.menu.inputPosition).getDirectedAngle(REFERENCE_POINT) / scale;

            this.updateText();
            this.text.rotation = -this.geometryGroup.rotation;
            this.valueGroup.rotation = -this.geometryGroup.rotation;


            this.connector.lastSegment.point = this.globalToLocal(this.menu.inputPosition);
            this.connector.strokeWidth = 2;
        }
    }

    protected animateStateBack(): void {
        super.animateStateBack();
        this._animations.remove(this.root);
        this._animations.push(new Animation({
            target: this.geometry,
            to: {
                scaling: new Point(1, 1)
            }
        }));
    }

    protected animateStateActive(): void {
        super.animateStateActive();
        this.parent.connector.strokeWidth = 2;
        this.parent.connector.strokeColor = 'rgba(57,58,60,0.2)';

        /*        this._animations.push(new Animation({
                    target: this.geometry,
                    to: {
                        scaling: new Point(10, 0.51)
                    }
                }));*/
    }
}
