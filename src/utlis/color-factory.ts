import {Color, Gradient, GradientStop} from 'paper';

export default class ColorFactory {
    /**
     * Transparent white color
     *
     * @type {Color}
     */
    public static readonly TRANSPARENT = new Color(255, 255, 255, 0);

    /**
     * Creates a single color or gradients from a settings object
     *
     * @param {Array<string | Array<string | number>> | string} color
     * @return {Color | Gradient}
     */
    public static fromSettings(color: Array<string | Array<string | number>> | string): Color | Gradient {
        if (typeof color === "string") {
            return ColorFactory.fromString(color);
        } else if (Array.isArray(color)) {
            return ColorFactory.fromArray(color);
        } else {
            throw new Error("Invalid color. Accepted formats are string | array");
        }
    }

    /**
     * Creates a color from string
     *
     * @param {string} color Color definition. CSS-String RGB(A)-String or Name
     * @return {Color}
     */
    public static fromString(color: string): Color {
        if (ColorFactory.isTransparent(color)) {
            return ColorFactory.TRANSPARENT;
        }

        return new Color(color);
    }

    /**
     * Creates a gradient from array
     *
     * @param {Array<string | Array<string | number>>} color
     * @return {Gradient | Color}
     */
    public static fromArray(color: Array<string | Array<string | number>>): Gradient | Color {
        let stops = new Array<GradientStop>();

        color.forEach((gradient): void => {
            if (Array.isArray(gradient)) {
                const firstType: string = typeof gradient[0];
                const secondType: string = typeof gradient[1];

                let colorDefinition: string;
                let stop: number;

                if (gradient.length !== 2) {
                    throw new Error(`Invalid number of gradient settings. Expected 2 got ${gradient.length}.`);
                }

                if (firstType === secondType) {
                    throw new Error(`Invalid gradient settings. [${firstType}, ${secondType}] does not match expected format [string, number].`);
                }

                if (firstType === "string") {
                    colorDefinition = gradient[0] as string;
                    stop = gradient[1] as number;
                } else {
                    colorDefinition = gradient[1] as string;
                    stop = gradient[0] as number;
                }

                if (ColorFactory.isTransparent(colorDefinition)) {
                    colorDefinition = 'rgba(255, 255, 255, 0)';
                }

                stops.push(new GradientStop(ColorFactory.fromString(colorDefinition), stop));
            } else {
                if (ColorFactory.isTransparent(gradient)) {
                    stops.push(new GradientStop(ColorFactory.TRANSPARENT));

                    return;
                }

                stops.push(new GradientStop(ColorFactory.fromString(gradient)));
            }
        });

        if (color.length === 1) {
            return stops[0].color as Color;
        }

        const gradient = new Gradient();
        gradient.stops = stops;

        return gradient;
    }

    /**
     * Checks if color string is transparent
     * TODO Expand
     *
     * @param {string} color
     * @return {boolean}
     */
    private static isTransparent(color: string): boolean {
        return color.toLowerCase() === 'transparent';
    }
}
