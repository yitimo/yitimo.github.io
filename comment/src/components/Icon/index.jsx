import React, { Component } from 'react'

import './index.scss'
import svgs from '../../assets/svgs.json'

export default class Icon extends Component {
    render() {
        const {
            name,
        } = this.props
        return (
            <i className="comment-icon" dangerouslySetInnerHTML={{__html: svgs[name]}}></i>
        )
    }
}
