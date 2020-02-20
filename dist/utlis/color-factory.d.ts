export default class ColorFactory {
    static readonly TRANSPARENT: paper.Color;
    static fromSettings(color: Array<string | Array<string | number>> | string): paper.Color | paper.Gradient;
    static fromString(color: string): paper.Color;
    static fromArray(color: Array<string | Array<string | number>>): paper.Gradient | paper.Color;
    private static isTransparent;
}
