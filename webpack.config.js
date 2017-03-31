//var webpackUglifyJsPlugin = require('webpack-uglify-js-plugin');
var webpack = require("webpack");
const NODE_ENV = process.env.NODE_ENV || 'development';


module.exports = {
    entry: {
        main: './src/main.js',
    },
    output: {
        path: __dirname + '/bundle',
        filename: '[name].js',
        publicPath: "/bundle/",
    },
    watch: NODE_ENV == 'development',
    plugins: [

        new webpack.optimize.UglifyJsPlugin({
            compress: {
                warnings: false
            },
            sourceMap: false,
        })

    ],
    module: {
        loaders: [{
            exclude: /node_modules/,
            loader: 'babel',
            query: {
                presets: ["react", "es2015", "stage-1"]
            }
        },{
            test: /\.svg$/,
            loader: 'svg-inline'
        },{
            test: /\.json$/,
            loader: 'json'
        },]
    },
    //devtool: NODE_ENV == 'development' ? "cheap-inline-module-source-map" : null,
    devtool: null,
    resolve: {
        extensions: ['', '.js']
    },
    devServer: {
        contentBase: './',
        publicPath: "/bundle/",
    }
};