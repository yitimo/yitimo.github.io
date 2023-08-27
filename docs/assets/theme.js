(function() {
    window.yitiblogTheme = {
        currentTheme: '',
        themeConfigTpl: {
            'color-background': '#ffffff',
            'color-on-background': '#0d1117',
            'color-primary': '#e6edf3',
            'color-on-primary': '#0d1117',
            'color-secondary': '#ffbe00',
            'color-on-secondary': '#ffffff',
            'color-outline': '#7d8590',
        },
        themeConfigs: {
            light: {},
            dark: {
                'color-background': '#0d1117',
                'color-on-background': '#e6edf3',
                'color-primary': '#010409',
                'color-on-primary': '#fefefe',
                'color-secondary': '#e2aa00',
                'color-on-secondary': '#e6edf3',
                'color-outline': '#7d8590',
            },
        },
        styleDOM: null,
        btnDOM: null,
        init: function(force) {
            if (force || !this.currentTheme) {
                this.currentTheme = window.localStorage.getItem('current_theme') || 'light'
            }
            if (!this.themeConfigs[this.currentTheme]) {
                switch (this.currentTheme) {
                    case 'custom':
                        try {
                            this.themeConfigs[this.currentTheme] = JSON.parse(window.localStorage.getItem('custom_theme_config') || '{}') || {}
                        } catch (e) {
                            this.currentTheme = 'light'
                        }
                        break
                    default:
                        this.currentTheme = 'light'
                        break
                }
            }
            if (!this.themeConfigs[this.currentTheme]) {
                console.warn('[theme]no config found', this.currentTheme)
                return
            }
            var styleStr = ':root { '
            var keys = Object.keys(this.themeConfigTpl)
            for (var i = 0; i < keys.length; i += 1) {
                styleStr +=
                    '--theme-'
                    + keys[i]
                    + ': '
                    + (this.themeConfigs[this.currentTheme][keys[i]] || this.themeConfigTpl[keys[i]])
                    + '; '
            }
            styleStr += '}'
            if (!this.styleDOM) {
                this.styleDOM = window.document.createElement('style')
                window.document.head.insertBefore(this.styleDOM, window.document.head.childNodes[0])
            }
            this.styleDOM.innerHTML = styleStr
        },
        initThemeEntry: function(id) {
            if (!this.btnDOM) {
                this.btnDOM = window.document.getElementById(id)
            }
            if (!this.btnDOM) {
                console.warn('[theme]no entry found')
                return
            }
            this.btnDOM.className = this.currentTheme === 'light' ? ' theme-btn iconfont icon-theme-light' : 'theme-btn iconfont icon-theme-dark'
            var that = this
            this.btnDOM.onclick = function() {
                that.switchTheme(that.currentTheme === 'light' ? 'dark' : 'light')
                that.btnDOM.className = that.currentTheme === 'light' ? 'theme-btn iconfont icon-theme-light' : 'theme-btn iconfont icon-theme-dark'
            }
        },
        switchTheme: function(name, config) {
            this.currentTheme = name
            window.localStorage.setItem('current_theme', name)
            if (name === 'custom' && config) {
                window.localStorage.setItem('custom_theme_config', JSON.stringify(config))
            }
            this.init()
        },
    }

    window.yitiblogTheme.init()
})(window)
