import { Chart } from '@antv/g2';
export function bullet({ container, percent, colorFill, color }) {
  const chart = new Chart({
    container: container,
    autoFit: true,
    margin: 0,
    paddingRight: 160,
    paddingLeft: 71,
    paddingBottom: 16,
    paddingTop: 16,
  });

  const data = [
    {
      title: '抖音',
      ranges: 100,
      measures: 40,
      color: '#3F56F0',
      colorFill: '#EBEEFD',
      total: 100022201111
    },
    {
      title: '天猫',
      ranges: 100,
      measures: 80,
      color: '#FE6301',
      colorFill: '#FEEFE5'
    },
    {
      title: '拼多多',
      ranges: 100.00,
      measures: 99.99,
      color: '#BB5799',
      colorFill: '#F8EEF4'
    },
    {
      title: '小红书',
      ranges: 100,
      measures: 30,
      color: '#F91D3B',
      colorFill: '#FEE8EB'
    },
    {
      title: '快手',
      ranges: 100,
      measures: 30,
      color: '#87E534',
      colorFill: '#F3FCEA'
    },
    {
      title: '京东',
      ranges: 100,
      measures: 30,
      color: '#D4A373',
      colorFill: '#FAF5F1'
    },
    {
      title: '得物',
      ranges: 100,
      measures: 30,
      color: '#81D8D0',
      colorFill: '#F2FBFA'
    },
  ];

  chart.coordinate({ transform: [{ type: 'transpose' }] });

  chart.data(data);

  chart
    .interval()
    .encode('x', 'title')
    .encode('y', 'ranges')
    .encode('color', 'colorFill')
    .scale('color', { type: 'identity' }) // ⭐关键
    .style('fillOpacity', 1)
    .style('maxWidth', 12)
    .style('radius', 12)
    .axis('y', false)
    .label({
      position: 'top-right',
      innerHTML: ({ total, measures }) => {
        return `<div class="bullet-box">
        <div class="bullet-box-inner">${measures || 0}%</div>
        <div class="bullet-box-inner-r">${total || 0}</div>
        <div>条</div>
       </div>`
      },

      style: {
        fill: 'rgba(0,0,0,0)',
        height: 0,
        lineHeight: 0,
        labelOpacity: 1,
      },


    })
    .tooltip(false);

  chart
    .interval()
    .encode('x', 'title')
    .encode('y', 'measures')
    .encode('color', 'color')
    .scale('color', { type: 'identity' }) // ⭐关键
    .style('fillOpacity', 1)
    .style('maxWidth', 12).axis('x', {
      labelTextAlign: 'left',
      labelFormatter: (text) => text,
      title: false,
      tick: false,
      labelSpacing: 55,
      labelFontSize: 14,
      labelFontFamily: 'PingFangSC, PingFang SC',
      labelFill: 'rgba(0,0,0,0.85)',
      labelOpacity: 1,
    })
    .style('radius', 12).tooltip(false);


  chart.render();

}

