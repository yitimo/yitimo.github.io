import React from 'react'
import ReactDOM from 'react-dom'
import './styles/global.scss'
import App from './App'
import * as serviceWorker from './serviceWorker'
import { CommentContext } from './utils'

const commentRoot = document.getElementById('comment-root')
const commentId = (commentRoot && commentRoot.getAttribute('data-comment-id')) || ''

ReactDOM.render(
    <CommentContext.Provider value={commentId}>
        <App />
    </CommentContext.Provider>
, commentRoot)

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
