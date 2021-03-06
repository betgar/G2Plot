import { each, get, deepMix, clone } from '@antv/util';
import { Element, IShape } from '../../../dependents';
import BaseLabel, { registerLabelComponent } from '../../../components/label/base';
import { rgb2arr, mappingColor } from '../../../util/color';
import BBox from '../../../util/bbox';
import { TextStyle } from '../../../interface/config';

export const DEFAULT_OFFSET = 8;

export default class BarLabel extends BaseLabel {
  protected getLabelItemAttrs(element: Element, idx: number): TextStyle {
    const { style, formatter } = this.options;
    const { shape } = element;
    const value = this.getValue(element);

    return deepMix({}, style, {
      ...this.getPosition(element),
      text: formatter ? formatter(value, shape, idx) : value,
      fill: this.getTextFill(element),
      stroke: this.getTextStroke(element),
      textAlign: this.getTextAlign(element),
      textBaseline: this.getTextBaseline(element),
    });
  }

  protected adjustLabel(label: IShape, element: Element): void {
    const { adjustPosition, style } = this.options;
    if (adjustPosition) {
      const labelRange = label.getBBox();
      const shapeRange = this.getElementShapeBBox(element);
      if (shapeRange.width <= labelRange.width) {
        const xPosition = shapeRange.maxX + this.options.offsetX;
        label.attr('x', xPosition);
        label.attr('fill', style.fill);
      }
    }
  }

  protected getDefaultOptions() {
    const { theme } = this.layer;
    const labelStyle = theme.label.style;
    return {
      offsetX: DEFAULT_OFFSET,
      offsetY: 0,
      style: clone(labelStyle),
      adjustPosition: true,
    };
  }

  protected getValue(element: Element): number | undefined | null {
    return get(element.getData(), this.layer.options.xField);
  }

  protected getPosition(element: Element): { x: number; y: number } {
    const value = this.getValue(element);
    const bbox = this.getElementShapeBBox(element);
    const { minX, maxX, minY, height, width } = bbox;
    const { offsetX, offsetY, position } = this.options;
    const y = minY + height / 2 + offsetY;
    const dir = value < 0 ? -1 : 1;
    let x;
    if (position === 'left') {
      const root = value > 0 ? minX : maxX;
      x = root + offsetX * dir;
    } else if (position === 'right') {
      x = maxX + offsetX * dir;
    } else {
      x = minX + width / 2;
    }

    return { x, y };
  }

  protected getTextFill(element: Element) {
    const { shape } = element;
    if (this.options.adjustColor && this.options.position !== 'right') {
      const shapeColor = shape.attr('fill');
      const shapeOpacity = shape.attr('opacity') ? shape.attr('opacity') : 1;
      const rgb = rgb2arr(shapeColor);
      const gray = Math.round(rgb[0] * 0.299 + rgb[1] * 0.587 + rgb[2] * 0.114) / shapeOpacity;
      const colorBand = [
        { from: 0, to: 85, color: 'white' },
        { from: 85, to: 170, color: '#F6F6F6' },
        { from: 170, to: 255, color: 'black' },
      ];
      const reflect = mappingColor(colorBand, gray);
      return reflect;
    }
    const defaultColor = this.options.style.fill;
    return defaultColor;
  }

  protected getTextStroke(element: Element) {
    const fill = this.getTextFill(element);
    const { position, adjustColor } = this.options;
    return position !== 'right' && adjustColor && fill !== 'black' ? null : undefined;
  }

  protected getTextAlign(element: Element) {
    const value = this.getValue(element);
    const { position } = this.options;
    const alignOptions = {
      right: 'left',
      left: 'left',
      middle: 'center',
    };
    const alignOptionsReverse = {
      right: 'right',
      left: 'right',
      middle: 'center',
    };
    if (value < 0) {
      return alignOptionsReverse[position];
    }
    return alignOptions[position];
  }

  protected getTextBaseline(element: Element) {//eslint-disable-line
    return 'middle';
  }

  protected getElementShapeBBox(element: Element): BBox {
    const { shape } = element;
    const points = [];
    each(shape.get('origin').points, (p) => {
      points.push(this.coord.convertPoint(p));
    });
    const bbox = new BBox(
      points[0].x,
      points[2].y,
      Math.abs(points[1].x - points[0].x),
      Math.abs(points[0].y - points[2].y)
    );
    return bbox;
  }
}

registerLabelComponent('bar', BarLabel);
