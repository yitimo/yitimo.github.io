var themeIsDark = window.localStorage.getItem('isDark') === '1'
var themeStyleDom = document.createElement('link')
themeStyleDom.rel = 'stylesheet'
themeStyleDom.href = `/assets/theme-${themeIsDark ? 'dark' : 'light'}.css`

document.head.insertBefore(themeStyleDom, document.head.childNodes[0])

document.addEventListener('DOMContentLoaded', function() {
    var testBtnDom = document.getElementById('theme-switch-test-btn')
    if (testBtnDom) {
        testBtnDom.innerText = themeIsDark ? '起床!' : '睡觉!'
    }
})

function switchTheme(target) {
    themeIsDark = !themeIsDark
    themeStyleDom.href = `/assets/theme-${themeIsDark ? 'dark' : 'light'}.css`
    window.localStorage.setItem('isDark', themeIsDark ? '1' : '0')

    if (target && target.id === 'theme-switch-test-btn') {
        target.innerText = themeIsDark ? '起床!' : '睡觉!'
    }
}
