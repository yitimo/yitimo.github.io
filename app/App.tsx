import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { Avatar } from './Avatar/Avatar';
import { Cube } from './Cube/Cube';
import { Menu, MenuProps } from './Menu/Menu';

import './global.css';
import './App.scss';

export class App extends React.Component {
    private menus: MenuProps[] = [{
        name: "关于我",
        children: [{
            name: "个人简历",
            link: "/hidden/2019/03/25/yitimo-curriculum-vitae.html"
        }]
    }, {
        name: "联系我",
        children: [{
            name: "个人邮箱",
            link: "mailto:admin@yitimo.com"
        }, {
            name: "Gmail",
            link: "mailto:yitimohu@gmail.com"
        }]
    }, {
        name: "此博客同时部署在",
        children: [{
            name: "Netlify",
            link: "https://yitiblog.netlify.com/"
        }, {
            name: "Github Page",
            link: "https://yitimo.github.io/"
        }]
    }];
    render() {
        return (
            <div className="nav">
                <Avatar src="/assets/images/yitimo.jpg" />
                <div className="nav-body">
                    <Cube link="https://github.com/yitimo" icon="/assets/images/github.png" name="Github" />
                </div>
                <div className="nav-foot">
                    {this.menus.map((menu) => <Menu name={menu.name} link={menu.link} children={menu.children} />)}
                </div>
            </div>
        )
    }
}

ReactDOM.render(
    <App />,
    document.getElementById("blog-nav")
);
