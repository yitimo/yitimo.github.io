import React from 'react'

import Nav from './containers/Nav'
import List from './containers/List'

export default class App extends React.Component {
  render() {
    return (
      <>
        <Nav />
        <List />
      </>
    )
  }
}
