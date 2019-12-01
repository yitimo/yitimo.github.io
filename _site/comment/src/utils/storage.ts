export default {
    get<T = any>(key: string): (T | null) {
        try {
            const rs = JSON.parse(window.localStorage.getItem(key) || 'null')
            const expired = JSON.parse(window.localStorage.getItem(`${key}_expired`) || 'null')
            if (!expired || expired > new Date().getTime()) {
                return rs
            }
            return null
        } catch (e) {
            return null
        }
    },
    set(key: string, value: any, expired: number = 0) {
        window.localStorage.setItem(key, JSON.stringify(value))
        window.localStorage.setItem(`${key}_expired`, JSON.stringify(new Date().getTime() + expired))
    },
    remove(key: string) {
        window.localStorage.removeItem(key)
    },
    clear() {
        window.localStorage.clear()
    },
}
