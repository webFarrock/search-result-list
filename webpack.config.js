//var webpackUglifyJsPlugin = require('webpack-uglify-js-plugin');
var webpack = require("webpack");
const NODE_ENV = process.env.NODE_ENV || 'development';

var plugins = [];

if(NODE_ENV != 'development'){
    plugins.push(new webpack.optimize.UglifyJsPlugin({
        beautify: false,
        comments: false,
        compress: {
            sequences     : true,
            booleans      : true,
            loops         : true,
            unused      : true,
            warnings    : false,
            drop_console: true,
            unsafe      : true
        },
        sourceMap: false,
    }));


    plugins.push(new webpack.DefinePlugin({
        "process.env": {
            NODE_ENV: JSON.stringify("production")
        }
    }));
}

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
    plugins: plugins,
    module: {
        loaders: [{
            exclude: /node_modules/,
            loader: 'babel',
            query: {
                presets: ["react", "es2015", "stage-1"],
                plugins: ["babel-plugin-object-values-to-object-keys"]
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