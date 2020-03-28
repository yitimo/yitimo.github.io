import ReactDOM from 'react-dom'
import React from 'react'

const mtaOutlet = document.getElementById('core-mta')

if (mtaOutlet) {
    initMTA(mtaOutlet)
}

async function initMTA(dom: HTMLElement) {
    const Component = await import('./MTA')
    return ReactDOM.render(
        <Component.default />,
        dom
    )
}
