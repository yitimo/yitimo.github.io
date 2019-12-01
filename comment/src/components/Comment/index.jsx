import React, { Component } from 'react'
import { formatTime } from '../../utils'
import './index.scss'

export default class Comment extends Component {
    render() {
        const {
            floor,
            data: {
                content = '',
                createTime = 0,
            } = {},
        } = this.props
        return (
            <div className="comment flex">
                <span className="floor">
                    #{floor}
                </span>
                <span className="flex-1">
                    {content}
                </span>
                <span className="time">
                    {formatTime(createTime)}
                </span>
            </div>
        )
    }
}
