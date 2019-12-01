import axios from 'axios'
import { apiDomain } from '../../utils/consts'
import storage from '../../utils/storage'

export default {
    async get(id: string, force = false): Promise<any> {
        if (!force) {
            const cachedData = storage.get(`comment_${id}`)
            if (cachedData) {
                return cachedData
            }
        }
        const {
            status,
            data: {
                code = '0',
                data = null,
                message = '请求失败',
            } = {},
            statusText,
        } = await axios.request({
            url: `${apiDomain}/comment/get/${id}`,
            method: 'GET',
        })
        if (status === 200) {
            // @ts-ignore
            if (code === '200') {
                storage.set(`comment_${id}`, data, 120000)
                return data
            } else {
                throw new Error(`${code}:${message}`)
            }
        }
        throw new Error(`${status}:${statusText}`)
    }
}
