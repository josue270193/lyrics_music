/** @type {import('vite').UserConfig} */

import basicSsl from '@vitejs/plugin-basic-ssl'

export default {

    // plugins: [
    //     basicSsl({
    //         /** name of certification */
    //         name: 'test',
    //         /** custom trust domains */
    //         domains: ['*.custom.com'],
    //         /** custom certification directory */
    //         certDir: '/Users/.../.devServer/cert'
    //     })
    // ],

    server: {
        port: 3000,
    }
}