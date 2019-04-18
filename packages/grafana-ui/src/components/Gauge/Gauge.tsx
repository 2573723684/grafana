import React, { PureComponent } from 'react';
import $ from 'jquery';
import { getColorFromHexRgbOrName } from '../../utils';
import { DisplayValue, Threshold, GrafanaThemeType, Themeable } from '../../types';

export interface Props extends Themeable {
  height: number;
  maxValue: number;
  minValue: number;
  thresholds: Threshold[];
  showThresholdMarkers: boolean;
  showThresholdLabels: boolean;
  width: number;
  value: DisplayValue;
}

const FONT_SCALE = 1;

export class Gauge extends PureComponent<Props> {
  canvasElement: any;

  static defaultProps: Partial<Props> = {
    maxValue: 100,
    minValue: 0,
    showThresholdMarkers: true,
    showThresholdLabels: false,
    thresholds: [],
  };

  componentDidMount() {
    this.draw();
  }

  componentDidUpdate() {
    this.draw();
  }

  getFormattedThresholds() {
    const { maxValue, minValue, thresholds, theme } = this.props;

    const lastThreshold = thresholds[thresholds.length - 1];

    return [
      ...thresholds.map(threshold => {
        if (threshold.index === 0) {
          return { value: minValue, color: getColorFromHexRgbOrName(threshold.color, theme.type) };
        }

        const previousThreshold = thresholds[threshold.index - 1];
        return { value: threshold.value, color: getColorFromHexRgbOrName(previousThreshold.color, theme.type) };
      }),
      { value: maxValue, color: getColorFromHexRgbOrName(lastThreshold.color, theme.type) },
    ];
  }

  getFontScale(length: number): number {
    if (length > 12) {
      return FONT_SCALE - (length * 5) / 110;
    }
    return FONT_SCALE - (length * 5) / 100;
  }

  draw() {
    const { maxValue, minValue, showThresholdLabels, showThresholdMarkers, width, height, theme, value } = this.props;

    const dimension = Math.min(width, height * 1.3);
    const backgroundColor = theme.type === GrafanaThemeType.Light ? 'rgb(230,230,230)' : theme.colors.dark3;

    const gaugeWidthReduceRatio = showThresholdLabels ? 1.5 : 1;
    const gaugeWidth = Math.min(dimension / 6, 40) / gaugeWidthReduceRatio;
    const thresholdMarkersWidth = gaugeWidth / 5;
    const fontSize = Math.min(dimension / 5.5, 100) * (value.text !== null ? this.getFontScale(value.text.length) : 1);
    const labelFontSize = Math.min(dimension / 5.5, 100) * (value.title ? this.getFontScale(value.title.length) : 1);
    const thresholdLabelFontSize = fontSize / 2.5;
    const showLabel = value.title !== null && value.title !== undefined;

    const options: any = {
      series: {
        gauges: {
          gauge: {
            min: minValue,
            max: maxValue,
            background: { color: backgroundColor },
            border: { color: null },
            shadow: { show: false },
            width: gaugeWidth,
          },
          frame: { show: false },
          label: { show: showLabel, margin: labelFontSize, size: labelFontSize },
          layout: { margin: 0, thresholdWidth: 0 },
          cell: { border: { width: 0 } },
          threshold: {
            values: this.getFormattedThresholds(),
            label: {
              show: showThresholdLabels,
              margin: thresholdMarkersWidth + 1,
              font: { size: thresholdLabelFontSize },
            },
            show: showThresholdMarkers,
            width: thresholdMarkersWidth,
          },
          value: {
            color: value.color,
            formatter: () => {
              return value.text;
            },
            font: { size: fontSize, family: '"Helvetica Neue", Helvetica, Arial, sans-serif' },
          },
          show: true,
        },
      },
    };

    const plotSeries = {
      data: [[0, value.numeric]],
      label: value.title,
    };

    try {
      $.plot(this.canvasElement, [plotSeries], options);
    } catch (err) {
      console.log('Gauge rendering error', err, options, value);
    }
  }

  render() {
    const { height, width } = this.props;

    return (
      <div
        style={{
          height: `${Math.min(height, width * 1.3)}px`,
          width: `${Math.min(width, height * 1.3)}px`,
          margin: 'auto',
        }}
        ref={element => (this.canvasElement = element)}
      />
    );
  }
}
