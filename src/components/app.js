import 'normalize.css'
import 'bootstrap'
import './app.less'
import { langs, getDefaultLang } from 'i18n/lang'
import React from 'react'
import Header from './header'
import Slides from './slides'
import Overview from './overview'
import DeckStore from 'stores/deck'
import _ from 'lodash'
import $script from 'scriptjs'
let key = require('mousetrap')
let App = class extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      deck: DeckStore.getDefaultDeck(undefined, getDefaultLang()),
      view: 'slides',
      presentationFormat: 'impress',
      presentationStyle: null,
      defaultSlideStyle: null,
      selectedSlidesStyle: null,
      thisSlideStyle: null,
      clipboard: null,
      language: getDefaultLang()
    }
  }
  setLanguage = lang => {
    if (typeof Storage !== 'undefined') {
      localStorage.setItem('language', lang)
    }
    this.setState({ language: lang })
  }
  setDocTitle(t) {
    document.title = 'ShowPreper - ' + t
  }
  UNSAFE_componentWillMount() {
    super.UNSAFE_componentWillMount && super.UNSAFE_componentWillMount()
    this.setDocTitle(this.state.deck._fn)
    $script('//cdn.ckeditor.com/4.5.7/full-all/ckeditor.js', 'ckeditor')
  }
  componentDidMount() {
    super.componentDidMount && super.componentDidMount()
    key.bind('ctrl+c', this.onCopy)
    key.bind('ctrl+x', this.onCut)
    key.bind('ctrl+v', this.onPaste)
    key.bind('ctrl+z', this.onUndo)
    key.bind('ctrl+y', this.onRedo)
    key.bind('del', this.deleteWidgets)
    key.bind('left', () => this.panBy('x', -1), 'keydown')
    key.bind(
      'left',
      () => this.panBy('x', 0, langs[this.state.language].moveComponents),
      'keyup'
    )
    key.bind('shift+left', () => this.panBy('x', -10), 'keydown')
    key.bind(
      'shift+left',
      () => {
        this.panBy('x', 0, langs[this.state.language].moveComponents)
      },
      'keyup'
    )
    key.bind('right', () => this.panBy('x', 1), 'keydown')
    key.bind(
      'right',
      () => this.panBy('x', 0, langs[this.state.language].moveComponents),
      'keyup'
    )
    key.bind('shift+right', () => this.panBy('x', 10), 'keydown')
    key.bind(
      'shift+right',
      () => {
        this.panBy('x', 0, langs[this.state.language].moveComponents)
      },
      'keyup'
    )
    key.bind('up', () => this.panBy('y', -1), 'keydown')
    key.bind(
      'up',
      () => this.panBy('y', 0, langs[this.state.language].moveComponents),
      'keyup'
    )
    key.bind('shift+up', () => this.panBy('y', -10), 'keydown')
    key.bind(
      'shift+up',
      () => {
        this.panBy('y', 0, langs[this.state.language].moveComponents)
      },
      'keyup'
    )
    key.bind('down', () => this.panBy('y', 1), 'keydown')
    key.bind(
      'down',
      () => this.panBy('y', 0, langs[this.state.language].moveComponents),
      'keyup'
    )
    key.bind('shift+down', () => this.panBy('y', 10), 'keydown')
    key.bind(
      'shift+down',
      () => {
        this.panBy('y', 0, langs[this.state.language].moveComponents)
      },
      'keyup'
    )
  }
  changeView = newView => {
    this.setState({
      view: newView
    })
  }
  changePresentationFormat = newFormat => {
    this.setState({
      presentationFormat: newFormat
    })
  }
  onSlideClicked = i => {
    let deck = this.state.deck
    deck.activateSlide(i)
    deck.save()
    this.setState({
      deck: deck
    })
  }

  onNewWidget = (container, index, newProps, markUndoDesc) => {
    let startIdx = Number.isInteger(index) ? index : container.components.length
    container.components.splice(startIdx, 0, newProps || {})
    let deck = this.state.deck
    deck.save()
    if (markUndoDesc) {
      deck.markUndo(markUndoDesc)
    }
    this.setState({
      deck: deck
    })
  }
  onSelectedWidgetUpdated = (widget, newProps, markUndoDesc, cb) => {
    let component, widgetIdx
    let deck = this.state.deck
    switch (typeof widget) {
      case 'number':
        component = deck.getActiveSlide()
        widgetIdx = widget
        break
      case 'object':
        component = widget.container
        widgetIdx = widget.index
        break
    }
    let selectedWidget =
      widgetIdx >= 0 ? component.components[widgetIdx] : component
    switch (typeof newProps) {
      case 'object':
        if (newProps) {
          _.assign(selectedWidget, newProps)
        } else {
          // null
          component.components.splice(widgetIdx, 1)
        }
        break
      case 'string':
        delete selectedWidget[newProps]
        break
      case 'undefined':
        component.components.splice(widgetIdx, 1)
        break
    }
    deck.save()
    if (markUndoDesc) {
      deck.markUndo(markUndoDesc)
    }
    this.setState(
      {
        deck: deck
      },
      cb
    )
  }
  onNewDeck = (nm, props, override) => {
    let deck = new DeckStore.Deck(nm, props, this.state.language, override)
    deck.save()
    this.setState({
      deck: deck
    })
  }
  onDeleteDeck = () => {
    this.state.deck.delete()
    let deck = DeckStore.getDefaultDeck(undefined, this.state.language)
    deck.save()
    this.setState({
      deck: deck
    })
  }
  onUndo = () => {
    let deck = this.state.deck
    deck.undo()
    deck.save()
    this.setState({
      deck: deck
    })
  }

  onRedo = () => {
    let deck = this.state.deck
    deck.redo()
    deck.save()
    this.setState({
      deck: deck
    })
  }
  onCopy = (ev, key, preserveSelectProp) => {
    let deck = this.state.deck
    let component
    switch (this.state.view) {
      case 'slides':
        component = deck.getActiveSlide()
        break
      case 'overview':
        if (this.state.presentationFormat === 'impress') {
          component = deck
        }
        break
    }
    if (!component) return
    let selectedComponents = component.components.reduce((pv, cv) => {
      if (cv.selected) {
        pv.push(cv)
      }
      return pv
    }, [])
    let clipboardItems = _.cloneDeep(selectedComponents)
    if (!preserveSelectProp) {
      clipboardItems.forEach(e => {
        e.selected = false
      })
    }
    this.setState({
      clipboard: {
        items: clipboardItems,
        view: this.state.view,
        presentationFormat: this.state.presentationFormat
      }
    })
  }
  onCut = () => {
    this.onCopy(null, null, true)
    this.deleteWidgets(langs[this.state.language].cut)
  }
  onPaste = () => {
    if (this.state.clipboard.view !== this.state.view) {
      return
    }
    if (
      this.state.clipboard.view === 'overview' &&
      this.state.clipboard.presentationFormat !== this.state.presentationFormat
    ) {
      return
    }
    let deck = this.state.deck
    let component
    switch (this.state.view) {
      case 'slides':
        component = deck.getActiveSlide()
        break
      case 'overview':
        component = deck
        break
    }
    this.state.clipboard.items.forEach((e, i) => {
      let markUndoDesc
      if (i === this.state.clipboard.items.length - 1) {
        markUndoDesc = langs[this.state.language].paste
      }
      this.onNewWidget(component, null, _.cloneDeep(e), markUndoDesc)
    })
  }
  onSlideMoved = (from, to) => {
    let deck = this.state.deck
    let slides = deck.getSlides()
    let indexOfFrom = deck.components.indexOf(slides[from])
    let indexOfTo = deck.components.indexOf(slides[to])
    let slidesBeingMoved = deck.components.splice(indexOfFrom, 1)
    deck.components.splice(indexOfTo, 0, slidesBeingMoved[0])
    deck.save()
    this.setState({
      deck: deck
    })
  }
  deleteWidgets = (...args) => {
    let deck = this.state.deck
    let component
    switch (this.state.view) {
      case 'slides':
        component = deck.getActiveSlide()
        break
      case 'overview':
        component = deck
        break
    }
    let i = component.components.length
    let hasDeletedSomething = false
    while (i > 0) {
      --i
      let e = component.components[i]
      if (e.selected) {
        this.onSelectedWidgetUpdated({
          container: component,
          index: i
        })
        hasDeletedSomething = true
      }
    }
    if (hasDeletedSomething) {
      deck.markUndo(
        typeof args[0] == 'string' ? args[0] : langs[this.state.language].delete
      )
      this.setState({
        deck: deck
      })
    }
  }
  panBy = (axis, delta, markUndoDesc) => {
    let deck = this.state.deck
    let component
    switch (this.state.view) {
      case 'slides':
        component = deck.getActiveSlide()
        break
      case 'overview':
        component = deck
        break
    }
    let selectedWidgets = component.components.reduce((pv, e, i) => {
      if (e.selected) pv.push(i)
      return pv
    }, [])
    selectedWidgets.forEach(e => {
      let newProp = {}
      newProp[axis] = component.components[e][axis] + delta
      this.onSelectedWidgetUpdated(
        { container: component, index: e },
        newProp,
        markUndoDesc
      )
    })
  }
  UNSAFE_componentWillUpdate(nextProps, nextState) {
    super.UNSAFE_componentWillUpdate && super.UNSAFE_componentWillUpdate()
    if (nextState.deck._fn !== this.state.deck._fn) {
      this.setDocTitle(nextState.deck._fn)
    }
  }
  setTargetStyle = (target, style) => {
    let tmp = {}
    // have to double apply style because react seems cannot
    // handle background and background-color together correctly
    tmp[target] = {}
    this.setState(tmp, () => {
      tmp[target] = style
      this.setState(tmp)
    })
  }
  render() {
    var Main
    switch (this.state.view) {
      case 'slides':
        Main = (
          <Slides
            deck={this.state.deck}
            language={this.state.language}
            onSlideClicked={this.onSlideClicked}
            onSelectedWidgetUpdated={this.onSelectedWidgetUpdated}
            onNewWidget={this.onNewWidget}
            onSlideMoved={this.onSlideMoved}
            defaultSlideStyle={this.state.defaultSlideStyle}
            thisSlideStyle={this.state.thisSlideStyle}
          />
        )
        break
      case 'overview':
        let selectedWidgets = this.state.deck.components.reduce((pv, e, i) => {
          if (e.selected) pv.push(i)
          return pv
        }, [])
        Main = (
          <Overview
            presentationFormat={this.state.presentationFormat}
            deck={this.state.deck}
            language={this.state.language}
            component={this.state.deck}
            selectedWidgets={selectedWidgets}
            onSelectedWidgetUpdated={this.onSelectedWidgetUpdated}
            presentationStyle={this.state.presentationStyle}
            defaultSlideStyle={this.state.defaultSlideStyle}
            selectedSlidesStyle={this.state.selectedSlidesStyle}
            thisSlideStyle={this.state.thisSlideStyle}
          />
        )
    }
    return (
      <div className="sp-main-container">
        <Header
          deck={this.state.deck}
          language={this.state.language}
          setLanguage={this.setLanguage}
          onUndo={this.onUndo}
          onRedo={this.onRedo}
          changeView={this.changeView}
          currentView={this.state.view}
          changePresentationFormat={this.changePresentationFormat}
          presentationFormat={this.state.presentationFormat}
          onNewWidget={this.onNewWidget}
          onNewDeck={this.onNewDeck}
          onDeleteDeck={this.onDeleteDeck}
          presentationStyle={this.state.presentationStyle}
          defaultSlideStyle={this.state.defaultSlideStyle}
          selectedSlidesStyle={this.state.selectedSlidesStyle}
          thisSlideStyle={this.state.thisSlideStyle}
          setTargetStyle={this.setTargetStyle}
          onSelectedWidgetUpdated={this.onSelectedWidgetUpdated}
        />
        {Main}
      </div>
    )
  }
}

module.exports = App
