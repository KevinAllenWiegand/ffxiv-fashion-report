const path = require('path');
const webpack = require("webpack");
const CopyPlugin = require('copy-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = env => {
    console.log(`ENVIRONMENT: ${JSON.stringify(env)}`);
    if (!env.ENVIRONMENT) {
        env.ENVIRONMENT = 'dev';
    }

    return {
        entry: './src/app.js',
        output: {
            filename: 'app.js',
            path: path.resolve(__dirname, 'dist')
        },
        module: {
            rules: [{
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader'
                }
            }]
        },
        devServer: {
            contentBase: path.join(__dirname, 'dist'),
            compress: true,
            port: 8010,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
                "Access-Control-Allow-Headers": "X-Requested-With, content-type, Authorization"
            }
        },
        plugins: [
            new CleanWebpackPlugin(),
            new CopyPlugin([
                {from: './static', to: 'static'},
                {from: './index.html', to: 'index.html'},
                {from: './favicon.ico', to: 'favicon.ico'},
            ]),
            new webpack.ProvidePlugin({
                $: "jquery",
                jQuery: "jquery"
            }),
            new webpack.DefinePlugin({
                'process.env': {
                    'ENVIRONMENT': `'${env.ENVIRONMENT}'`
                }
            })
        ],
        node: {
            fs: "empty"
        },
        stats: {
            colors: true
        },
        devtool: 'source-map'
    }
};