import * as React from 'react';
import * as ReactDOM from 'react-dom';

import './global.css';
import './App.scss';

export class App extends React.Component {
    render() {
      return (
        <div className="nav">
    <a className="nav-avatar" href="/">
        <img src="/assets/images/yitimo.jpg" alt="nav-avatar of yitimo" />
        <div>
            Yitimo's Blog
        </div>
    </a>
    <div className="nav-body">
        <a className="nav-body-block" href="https://github.com/yitimo" target="_blank">
            <img src="/assets/images/github.png" alt="Github" title="Github" />
        </a>
        <div id="blog-nav"></div>
    </div>
    <div className="nav-foot">
        <a href="javascript:void(0);">
            关于我
            <img src="/assets/images/arrow_right.png" className="icon" />
        </a>
        <div id="nav-concact">
            联系我
            <img src="/assets/images/arrow_right.png" className="icon" />
            <div id="nav-publish-popup" style={{display: "none"}}>
                <a href="mailto:admin@yitimo.com">个人邮箱</a>
                <a href="mailto:yitimohu@gmail.com">Gmail</a>
            </div>
        </div>
        <div id="nav-publish">
            此博客同时部署在
            <img src="/assets/images/arrow_right.png" className="icon" />
            <div id="nav-concact-popup" style={{display: "none"}}>
                <a href="https://yitiblog.netlify.com/" target="_blank">Netlify</a>
                <a href="https://yitimo.github.io/" target="_blank">Github Page</a>
            </div>
        </div>
    </div>
</div>
      )
    }
}

ReactDOM.render(
    <App />,
    document.getElementById("blog-nav")
);
