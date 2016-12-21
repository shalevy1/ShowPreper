'use strict'

let React = require('react')
let _ = require('lodash')
import EditableComponent from 'components/widgets/editableComponent'
import AutoScale from 'components/mixins/autoScale'
import Draggable from 'components/mixins/draggable'
import Scalable from 'components/mixins/scalable'
import Selectable from 'components/mixins/selectable'
import Rotatable from 'components/mixins/rotatable'
import Killable from 'components/mixins/killable'
import lang from 'i18n/lang'
require('./operatingTable.less')

let OperatingTable = React.createClass({
  mixins: [AutoScale, Selectable, Draggable(function () {
      return this.props.selectedWidgets
    }, function (e) {
      return {
        x: this.props.component.components[e].x || 0,
        y: this.props.component.components[e].y || 0,
        z: this.props.component.components[e].z || 0
      }
    },
    function (e, x, y) {
      this.props.onSelectedWidgetUpdated && this.props.onSelectedWidgetUpdated({
        container: this.props.component,
        index: e
      }, {
        x: x,
        y: y
      })
    }, function (e, x, y) {
      this.props.onSelectedWidgetUpdated && this.props.onSelectedWidgetUpdated({
          container: this.props.component,
          index: e
        }, {
          x: x,
          y: y
        }, lang.moveComponents
      )
    }), Scalable, Rotatable, Killable],
  getInitialState: function () {
    return {draggable: true}
  },
  componentWillMount: function () {
    this.mouseDownHdlrs = []
    this.mouseUpHdlrs = []
  },
  componentDidMount: function () {
    this._resized()
    window.addEventListener('resize', this._resized)
  },
  _resized: function () {
    let deck = this.props.deck
    let slideWidth = deck.slideWidth
    let slideHeight = deck.slideHeight
    this._scale({width: slideWidth, height: slideHeight})
  },
  onMouseUp: function () {
    this.mouseUpHdlrs.forEach(e=>e.apply(this, arguments))
  },
  onMouseDown: function () {
    this.mouseDownHdlrs.forEach(e=>e.apply(this, arguments))
  },
  setDraggable: function (draggable) {
    this.setState({draggable: draggable})
  },
  componentWillUnmount: function () {
    window.removeEventListener('resize', this._resized)
  },
  render: function () {
    try {
      let slide = this.props.deck.getActiveSlide()
      let selectedWidgets = slide.components.reduce((pv, e, i, a)=> {
        if (e.selected) pv.push(i)
        return pv
      }, [])
      let componentsView = slide.components.map((component, index) => {
        return (
          <EditableComponent
            component={component}
            container={slide}
            onSelectedWidgetUpdated={this.props.onSelectedWidgetUpdated}
            key={index}
            idx={index}
            ref={index}
            scale={this.state.scale}
            selected={selectedWidgets.indexOf(index) >= 0}
            onMouseDown={this.onMouseDown}
            onMouseUp={this.onMouseUp}
            onScaleMouseDown={this.onScaleMouseDown}
            onRotateMouseDown={this.onRotateMouseDown}
            onKillMouseDown={this.onKillMouseDown}
            setDraggable={this.setDraggable}
          />
        )
      })
      let otSlideStyle = _.merge({}, this.state.scaleStyle, this.props.thisSlideStyle || this.props.component.style || this.props.defaultSlideStyle || this.props.deck.defaultSlideStyle)
      if (this.props.deck.perspective) {
        otSlideStyle.perspective = (this.props.deck.perspective / this.state.scale) + 'px'
      }
      return (
        <div className="sp-operating-table"
             onMouseDown={this.onSelectionMouseDown}
        >
          <div className="sp-ot-slide"
               style={otSlideStyle}>
            {componentsView}
          </div>
        </div>
      )
    }
    catch (ex) {
      return <div/>
    }
  }
})

module.exports = OperatingTable
