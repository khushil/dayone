import { useMemo } from 'react';
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  MarkLineComponent,
  AxisPointerComponent,
} from 'echarts/components';
import { SVGRenderer } from 'echarts/renderers';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import { useAppStore } from '../store';
import { formatMonth } from '../lib/format';
import type { SectorView } from '../lib/view';

echarts.use([
  LineChart,
  GridComponent,
  TooltipComponent,
  MarkLineComponent,
  AxisPointerComponent,
  SVGRenderer,
]);

interface PerformanceChartProps {
  views: SectorView[];
}

// Chart chrome colors, mirroring the CSS tokens. Resolved from `theme` (not the
// DOM) so the chart never lags a theme toggle by a frame.
const CHART_THEME = {
  dark: {
    line: '#222a33',
    muted: '#8a93a0',
    text: '#e6edf3',
    surface: '#161b22',
  },
  light: {
    line: '#e4e1d8',
    muted: '#5d6671',
    text: '#1b2027',
    surface: '#ffffff',
  },
} as const;

/** Rebased-to-100 performance lines for the selected sectors (FR-2). */
export function PerformanceChart({
  views,
}: PerformanceChartProps): React.JSX.Element {
  const theme = useAppStore((s) => s.theme);

  const option = useMemo(() => {
    const { line, muted, text, surface } = CHART_THEME[theme];
    const months = views[0]?.months ?? [];

    return {
      animationDuration: 450,
      grid: { left: 44, right: 18, top: 18, bottom: 28 },
      tooltip: {
        trigger: 'axis',
        backgroundColor: surface,
        borderColor: line,
        textStyle: { color: text, fontSize: 12 },
        valueFormatter: (value: number) => value.toFixed(1),
      },
      axisPointer: { lineStyle: { color: muted, type: 'dashed' } },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: months,
        axisLine: { lineStyle: { color: line } },
        axisTick: { show: false },
        axisLabel: {
          color: muted,
          fontSize: 11,
          formatter: (m: string) => formatMonth(m).slice(0, 3),
        },
      },
      yAxis: {
        type: 'value',
        scale: true,
        splitLine: { lineStyle: { color: line, opacity: 0.5 } },
        axisLabel: { color: muted, fontSize: 11 },
      },
      series: views.map((view) => ({
        name: view.sector.name,
        type: 'line',
        smooth: true,
        showSymbol: false,
        emphasis: { focus: 'series' },
        lineStyle: { width: 2, color: view.sector.color },
        itemStyle: { color: view.sector.color },
        data: view.rebased.map((v) => Math.round(v * 100) / 100),
        ...(view === views[0]
          ? {
              markLine: {
                silent: true,
                symbol: 'none',
                lineStyle: { color: muted, type: 'dashed', opacity: 0.7 },
                label: {
                  color: muted,
                  formatter: 'Start = 100',
                  position: 'insideEndTop',
                },
                data: [{ yAxis: 100 }],
              },
            }
          : {}),
      })),
    };
  }, [views, theme]);

  return (
    <ReactEChartsCore
      echarts={echarts}
      option={option}
      notMerge
      style={{ height: '100%', width: '100%' }}
      opts={{ renderer: 'svg' }}
    />
  );
}
