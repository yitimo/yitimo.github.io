(function (window) {
    var bgDOM = document.getElementById('background');
    doResize(window.innerWidth > window.innerHeight);
    function doResize(wth) {
        if (wth) {
            bgDOM.style.width = '100%';
            bgDOM.style.height = undefined;
        } else {
            bgDOM.style.height = '100%';
            bgDOM.style.width = undefined;
        }
    }
})(window);