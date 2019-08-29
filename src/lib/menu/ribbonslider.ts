import MenuItem from "./menu-item";
import {Group, Path, Point, MouseEvent} from 'paper';
import {ZERO_POINT as CENTER, ZERO_POINT} from "../constants";
import {ClickState, SettingsGroup} from "../enums";

export default class Ribbonslider extends MenuItem{
    private ribbonGroup: Group;
    private ribbon: Path.Rectangle;
    private gradient: Path.Rectangle;

    private grabDotGroup: Group;



    get isLeaf(): boolean {
        return false;
    }

    protected setupGeometry(): void {
        super.setupGeometry();
        this.setupGradient();
        this.setupRibbon();
        this.setupGrabDotGroup();

    }

    private setupGradient(): void {
        this.gradient = new Path.Rectangle(ZERO_POINT, new Point(300, 60));
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
        this.grabDotGroup = new Group();
        this.grabDotGroup.pivot = CENTER;
        this.grabDotGroup.applyMatrix = false;

        let circle = new Path.Circle(ZERO_POINT, 3);
        circle.fillColor = this.settings[SettingsGroup.GEOMETRY].stroke.color;
        circle.strokeWidth = 0;

        for (let i = 0 ; i < 4; i++) {
            let c1 = circle.clone();
            c1.position = ZERO_POINT.add(new Point(0, i*10));

            let c2 = circle.clone();
            c2.position = ZERO_POINT.add(new Point(10, i*10));

            let c3 = circle.clone();
            c3.position = ZERO_POINT.add(new Point(20, i*10));

             this.grabDotGroup.addChild(c1);
             this.grabDotGroup.addChild(c2);
             this.grabDotGroup.addChild(c3);
        }
    }

    private setupMaskGroup(): Path.Rectangle {
        let mask = new Path.Rectangle(ZERO_POINT, new Point(1200, 62));
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
        this.ribbonGroup = new Group({blendMode: 'source-in'});
        this.ribbon = new Path.Rectangle(ZERO_POINT, new Point(2000, 60));
        this.ribbon.bounds.center = ZERO_POINT;
        this.ribbonGroup.addChild(this.ribbon);

        this.ribbon.onMouseDrag = (e: MouseEvent) => {
            console.log((e));
            this.ribbonGroup.position.x += (e.delta.x);
        }
    }

    protected getNearestChild(): MenuItem {
        this.hoveredChild = this;
        return this;
    }

    protected traceLogic(): void {
        return;
    }

    protected dragLogic(): void {
        return;
    }

    protected clickLogic(clickState: ClickState): void {
        this.hoveredChild = undefined;
        super.clickLogic(clickState);
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
        let group =  new Group({children: [this.setupMaskGroup(), this.ribbonGroup], blendMode: 'source-over'});
        this.geometryGroup.addChild(group);
        this.geometryGroup.addChild(this.gradient);
        this.text.bringToFront();
        this.ribbonGroup.addChild(this.grabDotGroup);
        this.grabDotGroup.position = this.grabDotGroup.position.add(new Point(200, -13));
        this.grabDotGroup.bringToFront();
    }
}