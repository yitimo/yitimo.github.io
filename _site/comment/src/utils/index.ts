import React from 'react'

export const CommentContext = React.createContext('')

export function formatTime(src: number) {
    if (!src) {
        return src
    }
    if (typeof src !== 'number') {
        return src
    }
    const time = new Date(src)
    return `${
        time.getFullYear()
    }/${
        addZero(time.getMonth()+1)
    }/${
        addZero(time.getDate())
    } ${
        addZero(time.getHours())
    }:${
        addZero(time.getMinutes())
    }:${
        addZero(time.getSeconds())
    }`
}

function addZero(src: number) {
    return src < 10 ? `0${src}` : src
}
