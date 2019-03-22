import * as React from 'react';
import './Menu.scss';

export interface MenuProps {
    name: string,
    link?: string
    children?: MenuProps[]
}

export class Menu extends React.Component<MenuProps, {opened: boolean}> {
    constructor(props) {
        super(props);
        this.state = {
            opened: false
        };
    }
    private enter(isSwitch: boolean, link?: string) {
        console.log(isSwitch, link);
        if (isSwitch) {
            this.setState({opened: !this.state.opened});
        } else if (!link || !link.length) {
            return;
        } else {
            window.location.href = link;
        }
    }
    render() {
        return (
            <div className="nav-menu">
                <a className={this.state.opened ? "active" : ""} onClick={() => this.enter(this.props.children && !!this.props.children.length, this.props.link)}>
                    {this.props.name}
                    <img src="/assets/images/arrow_right.png" className="icon" />
                </a>
                { this.props.children && this.props.children.length && 
                    <div style={{ display: this.props.children.length && this.state.opened ? "block" : "none" }}>
                        {this.props.children.map((menu) => <a href={menu.link} onClick={() => this.enter(false, menu.link)}>{menu.name}</a>)}
                    </div>
                }
            </div>
        )
    }
}
