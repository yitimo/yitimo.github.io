import * as React from 'react';

export interface CubeProps {
    icon: string,
    link: string,
    name?: string
}

export class Cube extends React.Component<CubeProps> {
    render() {
      return (
        <a className="nav-body-block"  href={this.props.link} target="_blank">
            <img src={this.props.icon} alt={this.props.name} title={this.props.name} />
        </a>
      )
    }
}
