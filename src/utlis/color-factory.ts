export default class ColorFactory {
  /**
   * Transparent white color
   *
   * @type {Color}
   */
  public static readonly TRANSPARENT = new paper.Color(255, 255, 255, 0);

  /**
   * Creates a single color or gradients from a settings object
   *
   * @param {Array<string | Array<string | number>> | string} color
   * @return {Color | Gradient}
   */
  public static fromSettings(color: Array<string | Array<string | number>> | string): paper.Color | paper.Gradient {
    if (typeof color === 'string') {
      return ColorFactory.fromString(color);
    } if (Array.isArray(color)) {
      return ColorFactory.fromArray(color);
    }
    throw new Error('Invalid color. Accepted formats are string | array');
  }

  /**
   * Creates a color from string
   *
   * @param {string} color Color definition. CSS-String RGB(A)-String or Name
   * @return {Color}
   */
  public static fromString(color: string): paper.Color {
    if (ColorFactory.isTransparent(color)) {
      return ColorFactory.TRANSPARENT;
    }

    return new paper.Color(color);
  }

  /**
   * Creates a gradient from array
   *
   * @param {Array<string | Array<string | number>>} color
   * @return {Gradient | Color}
   */
  public static fromArray(color: Array<string | Array<string | number>>): paper.Gradient | paper.Color {
    const stops = new Array<paper.GradientStop>();

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
          // eslint-disable-next-line max-len
          throw new Error(`Invalid gradient settings. [${firstType}, ${secondType}] does not match expected format [string, number].`);
        }

        if (firstType === 'string') {
          colorDefinition = <string>gradient[0];
          stop = <number>gradient[1];
        } else {
          colorDefinition = <string>gradient[1];
          stop = <number>gradient[0];
        }

        if (ColorFactory.isTransparent(colorDefinition)) {
          colorDefinition = 'rgba(255, 255, 255, 0)';
        }

        stops.push(new paper.GradientStop(ColorFactory.fromString(colorDefinition), stop));
      } else {
        if (ColorFactory.isTransparent(gradient)) {
          stops.push(new paper.GradientStop(ColorFactory.TRANSPARENT));

          return;
        }

        stops.push(new paper.GradientStop(ColorFactory.fromString(gradient)));
      }
    });

    if (color.length === 1) {
      return stops[0].color;
    }

    const gradient = new paper.Gradient();
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
