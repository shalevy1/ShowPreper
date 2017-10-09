import { mount } from 'enzyme'
import Main from 'components/app'
import React from 'react'

describe('Header', () => {
  it('should add a text widget when clicking insert object button', () => {
    const wrapper = mount(<Main />, { attachTo: app })
    expect(wrapper.state().deck.getActiveSlide().components.length).to.equal(1)
    wrapper
      .find(
        '.sp-main-container .navbar .container-fluid #sp-navbar-collapse-1 .navbar-left button'
      )
      .first()
      .simulate('click')
    expect(wrapper.state().deck.getActiveSlide().components.length).to.equal(2)
  })
})
