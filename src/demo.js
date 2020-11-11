'use strict';

import React, {Component} from 'react';
import moment from 'moment';
import _ from 'lodash';

import Timeline from './timeline';
import {customItemRenderer, customGroupRenderer} from 'demo/customRenderers';

import {Layout, Form, InputNumber, Button, DatePicker, Checkbox, Switch} from 'antd';
import 'antd/dist/antd.css';
import './style.css';
import {TimeSeries, Index, TimeRangeEvent, TimeRange} from 'pondjs';
import {
  Resizable,
  Charts,
  ChartContainer,
  ChartRow,
  YAxis,
  LineChart,
  styler,
  EventChart
} from 'react-timeseries-charts';
import data from './speedData.js';

const {TIMELINE_MODES} = Timeline;

const ITEM_DURATIONS = [moment.duration(6, 'hours'), moment.duration(12, 'hours'), moment.duration(18, 'hours')];

const COLORS = ['#0099cc', '#f03a36', '#06ad96', '#fce05b', '#dd5900', '#cc6699'];

// Moment timezones can be enabled using the following
// import moment from 'moment-timezone';
// moment.locale('en-au');
// moment.tz.setDefault('Australia/Perth');

export default class DemoTimeline extends Component {
  constructor(props) {
    super(props);

    const series = new TimeSeries({
      name: 'hilo_rainfall',
      columns: ['index', 'speed'],
      points: data.values.map(([d, value]) => [Index.getIndexString('1h', new Date(d)), value])
    });
    const startDate = moment('2018-08-31T00:00z');
    //const endDate = startDate.clone().add(4, 'days');
    const endDate = moment('2018-09-01T00:00z');
    this.state = {
      selectedItems: [],
      rows: 2,
      items_per_row: 2,
      snap: 1,
      startDate,
      endDate,
      message: '',
      timelineMode: TIMELINE_MODES.SELECT | TIMELINE_MODES.DRAG | TIMELINE_MODES.RESIZE,
      series: series
    };
    this.reRender = this.reRender.bind(this);
    this.zoomIn = this.zoomIn.bind(this);
    this.zoomOut = this.zoomOut.bind(this);
    this.toggleCustomRenderers = this.toggleCustomRenderers.bind(this);
    this.toggleSelectable = this.toggleSelectable.bind(this);
    this.toggleDraggable = this.toggleDraggable.bind(this);
    this.toggleResizable = this.toggleResizable.bind(this);
  }

  componentWillMount() {
    this.reRender();
  }

  reRender() {
    const list = [
      {
        key: '0',
        title: 'Night shift',
        color: COLORS[0],
        row: '0',
        start: moment('2018-08-31T00:00z'),
        end: moment('2018-08-31T10:00z')
      },
      {
        key: '1',
        title: 'Downtime',
        color: COLORS[1],
        row: '1',
        start: moment('2018-08-31T00:00z'),
        end: moment('2018-08-31T01:15z')
      },
      {
        key: '3',
        title: 'Running',
        color: COLORS[2],
        row: '1',
        start: moment('2018-08-31T01:16z'),
        end: moment('2018-08-31T10:00z')
      },
      {
        key: '4',
        title: 'Setup',
        color: COLORS[2],
        row: '1',
        start: moment('2018-08-31T12:00z'),
        end: moment('2018-08-31T14:00z')
      }
    ];
    const groups = [
      {id: '0', title: `Shift`},
      {id: '1', title: `Machine Status`}
    ];

    const {snap} = this.state;

    this.key = 0;

    this.forceUpdate();
    this.setState({items: list, groups});
  }

  handleRowClick = (e, rowNumber, clickedTime, snappedClickedTime) => {
    const message = `Row Click row=${rowNumber} @ time/snapped=${clickedTime.toString()}/${snappedClickedTime.toString()}`;
    this.setState({selectedItems: [], message});
  };
  zoomIn() {
    //   console.log(new Date(this.state.startDate) + '   ' + new Date(this.state.endDate))
    //   console.log(new Date(this.state.startDate.clone().add(1,"hours")) + '   ' + new Date(this.state.endDate.clone().subtract(1, 'hours')))

    // this.setState({startDate:this.state.startDate.clone().add(1,"hours"), endDate: this.state.startDate.clone().subtract(1, 'hours')});

    let currentMins = this.state.endDate.diff(this.state.startDate, 'minutes');
    let newMins = currentMins / 2;
    this.setState({endDate: this.state.startDate.clone().add(newMins, 'minutes')});
  }
  zoomOut() {
    let currentMins = this.state.endDate.diff(this.state.startDate, 'minutes');
    let newMins = currentMins * 2;
    this.setState({endDate: this.state.startDate.clone().add(newMins, 'minutes')});
  }

  toggleCustomRenderers(checked) {
    this.setState({useCustomRenderers: checked});
  }

  toggleSelectable() {
    const {timelineMode} = this.state;
    let newMode = timelineMode ^ TIMELINE_MODES.SELECT;
    this.setState({timelineMode: newMode, message: 'Timeline mode change: ' + timelineMode + ' -> ' + newMode});
  }
  toggleDraggable() {
    const {timelineMode} = this.state;
    let newMode = timelineMode ^ TIMELINE_MODES.DRAG;
    this.setState({timelineMode: newMode, message: 'Timeline mode change: ' + timelineMode + ' -> ' + newMode});
  }
  toggleResizable() {
    const {timelineMode} = this.state;
    let newMode = timelineMode ^ TIMELINE_MODES.RESIZE;
    this.setState({timelineMode: newMode, message: 'Timeline mode change: ' + timelineMode + ' -> ' + newMode});
  }
  handleItemClick = (e, key) => {
    const message = `Item Click ${key}`;
    const {selectedItems} = this.state;

    let newSelection = selectedItems.slice();

    // If the item is already selected, then unselected
    const idx = selectedItems.indexOf(key);
    if (idx > -1) {
      // Splice modifies in place and returns removed elements
      newSelection.splice(idx, 1);
    } else {
      newSelection.push(Number(key));
    }

    this.setState({selectedItems: newSelection, message});
  };

  handleItemDoubleClick = (e, key) => {
    const message = `Item Double Click ${key}`;
    this.setState({message});
  };

  handleItemContextClick = (e, key) => {
    const message = `Item Context ${key}`;
    this.setState({message});
  };

  handleRowDoubleClick = (e, rowNumber, clickedTime, snappedClickedTime) => {
    const message = `Row Double Click row=${rowNumber} time/snapped=${clickedTime.toString()}/${snappedClickedTime.toString()}`;

    const randomIndex = Math.floor(Math.random() * Math.floor(ITEM_DURATIONS.length));

    let start = snappedClickedTime.clone();
    let end = snappedClickedTime.clone().add(ITEM_DURATIONS[randomIndex]);
    this.key++;

    const item = {
      key: this.key++,
      title: 'New item',
      color: 'yellow',
      row: rowNumber,
      start: start,
      end: end
    };

    const newItems = _.clone(this.state.items);
    newItems.push(item);

    this.setState({items: newItems, message});
  };

  handleRowContextClick = (e, rowNumber, clickedTime, snappedClickedTime) => {
    const message = `Row Click row=${rowNumber} @ time/snapped=${clickedTime.toString()}/${snappedClickedTime.toString()}`;
    this.setState({message});
  };

  handleInteraction = (type, changes, items) => {
    /**
     * this is to appease the codefactor gods,
     * whose wrath condemns those who dare
     * repeat code beyond the sacred 5 lines...
     */
    function absorbChange(itemList, selectedItems) {
      console.log(JSON.stringify(itemList));
      itemList.forEach(item => {
        let i = selectedItems.find(i => {
          return i.key == item.key;
        });
        // console.log(JSON.stringify(i))
        if (i) {
          item = i;
          item.title = i.title;
        }
      });
    }

    switch (type) {
      case Timeline.changeTypes.dragStart: {
        return this.state.selectedItems;
      }
      case Timeline.changeTypes.dragEnd: {
        const newItems = _.clone(this.state.items);

        absorbChange(newItems, items);
        this.setState({items: newItems});
        break;
      }
      case Timeline.changeTypes.resizeStart: {
        return this.state.selectedItems;
      }
      case Timeline.changeTypes.resizeEnd: {
        const newItems = _.clone(this.state.items);

        // Fold the changes into the item list
        absorbChange(newItems, items);

        this.setState({items: newItems});
        break;
      }
      case Timeline.changeTypes.itemsSelected: {
        this.setState({selectedItems: _.map(changes, 'key')});
        break;
      }
      default:
        return changes;
    }
  };

  render() {
    const {
      selectedItems,
      snap,
      startDate,
      endDate,
      items,
      groups,
      message,
      useCustomRenderers,
      timelineMode,
      series
    } = this.state;
    const rangeValue = [startDate, endDate];

    const selectable = (TIMELINE_MODES.SELECT & timelineMode) === TIMELINE_MODES.SELECT;
    const draggable = (TIMELINE_MODES.DRAG & timelineMode) === TIMELINE_MODES.DRAG;
    const resizeable = (TIMELINE_MODES.RESIZE & timelineMode) === TIMELINE_MODES.RESIZE;

    const rowLayers = [];

    return (
      <Layout className="layout demo-layout">
        <Layout.Content className="demo-layout-content">
          <div style={{margin: 24}}>
            <Form layout="inline">
              <Form.Item label="Snap (mins)">
                <InputNumber value={snap} onChange={e => this.setState({snap: e})} />
              </Form.Item>
              <Form.Item label="Date Range">
                <DatePicker.RangePicker
                  allowClear={false}
                  value={rangeValue}
                  showTime
                  onChange={e => {
                    this.setState({startDate: e[0], endDate: e[1]}, () => this.reRender());
                  }}
                />
              </Form.Item>
              <Form.Item>
                <Button type="primary" onClick={() => this.reRender()}>
                  Regenerate
                </Button>
              </Form.Item>
              <Form.Item>
                <Button onClick={this.zoomIn}>Zoom in</Button>
              </Form.Item>
              <Form.Item>
                <Button onClick={this.zoomOut}>Zoom out</Button>
              </Form.Item>
              <Form.Item label="Custom Renderers">
                <Switch onChange={this.toggleCustomRenderers} />
              </Form.Item>
              <Form.Item>
                <Checkbox onChange={this.toggleSelectable} checked={selectable}>
                  Enable selecting
                </Checkbox>
              </Form.Item>
              <Form.Item>
                <Checkbox onChange={this.toggleDraggable} checked={draggable}>
                  Enable dragging
                </Checkbox>
              </Form.Item>
              <Form.Item>
                <Checkbox onChange={this.toggleResizable} checked={resizeable}>
                  Enable resizing
                </Checkbox>
              </Form.Item>
            </Form>
            <div>
              <span>Debug: </span>
              {message}
            </div>
          </div>
          <Timeline
            shallowUpdateCheck
            // showCursorTime={false}
            items={items}
            groups={groups}
            startDate={startDate}
            endDate={endDate}
            rowLayers={[]}
            selectedItems={selectedItems}
            timelineMode={timelineMode}
            snapMinutes={snap}
            onItemClick={this.handleItemClick}
            onItemDoubleClick={this.handleItemDoubleClick}
            onItemContextClick={this.handleItemContextClick}
            onInteraction={this.handleInteraction}
            // onRowClick={this.handleRowClick}
            // onRowContextClick={this.handleRowContextClick}
            // onRowDoubleClick={this.handleRowDoubleClick}
            itemRenderer={useCustomRenderers ? customItemRenderer : undefined}
            groupRenderer={useCustomRenderers ? customGroupRenderer : undefined}
            groupTitleRenderer={useCustomRenderers ? () => <div>Group title</div> : undefined}
          />
          <br />
          <Resizable>
            <ChartContainer
              timeRange={new TimeRange(new Date(startDate), new Date(endDate))}
              enablePanZoom={true}
              onTimeRangeChanged={this.handleTimeRangeChange}>
              <ChartRow height="150">
                <YAxis id="speed" min={0} max={1000} type="linear" />
                <Charts>
                  <LineChart axis="speed" spacing={1} columns={['speed']} series={series} minBarHeight={1} />
                </Charts>
              </ChartRow>
            </ChartContainer>
          </Resizable>
        </Layout.Content>
      </Layout>
    );
  }
}
