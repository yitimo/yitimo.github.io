import React, { Component } from 'react'
import service from './service'
import { CommentContext } from '../../utils'
import Comment from '../../components/Comment'

import './index.scss'

export default class List extends Component {
    constructor(props) {
        super(props)

        this.state = {
            data: [],
        }
    }
    static contextType = CommentContext
    componentDidMount() {
        service.get(this.context).then((res) => {
            console.log(res)
            this.setState({
                data: res,
            })
        }).catch((err) => {
            console.error(err)
        })
    }
    render() {
        const {
            data: {
                comments = []
            } = {},
        } = this.state
        return (
            <div className="comment-list">
                {
                    comments.map((comment, index) => (
                        <Comment key={comment.id} data={comment} floor={index+1} />
                    ))
                }
                <textarea
                    className="create"
                    readOnly
                    placeholder="添加评论..."
                    name="comment"
                    rows="5"
                />
            </div>
        )
    }
}
