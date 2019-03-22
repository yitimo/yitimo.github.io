import * as React from 'react';

import './Avatar.scss';

export class Avatar extends React.Component<{src: string}> {
    render() {
        return (
            <a className="nav-avatar" href="/">
                <img src={this.props.src} alt="nav-avatar of yitimo" />
                <div>
                    Yitimo's Blog
                </div>
            </a>
        )
    }
}
