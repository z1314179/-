import { Chart } from '@antv/g2';

export function pie({ container, percent, colorFill, color }) {
  if (!container) return;
  const chart = new Chart({
    container,
    autoFit: true,
    margin: 0,
    padding: 5
  });

  chart.coordinate({
    type: 'theta',
    innerRadius: 0.75,
  });

  // 背景圆环
  chart.interval()
    .data([{ value: 100, color: colorFill }])
    .encode('y', 'value')
    .encode('color', 'color')
    .scale('color', { type: 'identity' })
    .animate(false)
    .tooltip(false);

  // 进度圆环
  chart.interval()
    .data([{ value: percent, color: color }])
    .encode('y', 'value')
    .encode('color', 'color')
    .scale('color', { type: 'identity' })
    .style({ radius: 80, lineWidth: 0 })
    .animate('enter', { type: 'waveIn', duration: 400 })
    .tooltip(false);

  // 中心文本
  chart.text()
    .data([{ percent }])
    .encode('text', d => `${d.percent}%`)
    .style({
      x: '50%',
      y: '50%',
      textAlign: 'center',
      textBaseline: 'middle',
      fontSize: 20,
      fontWeight: 500,
      fontFamily: 'DINAlternate',
      fill: color == '#fff' ? '#fff' : '#000',
    });

  chart.axis(false);
  chart.legend(false);
  chart.interaction('tooltip', false);

  chart.render();
}
