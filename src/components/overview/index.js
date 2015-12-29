'use strict'
import React from 'react'
import './index.less'
var DisplayableComponent = require('components/widgets/displayableComponent')
import AutoScale from 'components/mixins/autoScale'
let Overview = React.createClass({
  mixins: [AutoScale],
  componentDidMount: function () {
    this._resized()
    window.addEventListener('resize', this._resized)
  },
  getInitialState: function () {
    return {}
  },
  _resized: function () {
    let bb = this.props.deck.boundingBox || this.props.deck.getDefaultDeckBoundingBox()
    this._scale({width: bb.right - bb.left, height: bb.bottom - bb.top})
  },
  render: function () {
    let deckView = this.props.deck.slides.map((slide, index) => {
      let bb = this.props.deck.getSlideBoundingBox(slide, index)
      slide.y = bb.top
      slide.x = bb.left
      slide.width = bb.right - bb.left
      slide.height = bb.bottom - bb.top
      slide.type || (slide.type = "Slide")
      return (
        <DisplayableComponent
          className="sp-overview-slide"
          key={index}
          component={slide}
        />
      )
    })
    return (
      <div
        className="sp-overview">
        <div
          className="sp-overview-deck"
          style={this.state.scaleStyle}>
          {deckView}
        </div>
      </div>
    )
  }
})

module.exports = Overview
