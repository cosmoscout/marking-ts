const path = require('path');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const HTMLWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    entry: path.resolve(__dirname, 'src'),

    output: {
        filename: 'marking-ts.js',
        path: path.resolve(__dirname, 'dist'),
        library: 'MarkingTS',
        libraryTarget: 'umd',
        umdNamedDefine: true,
        globalObject: 'this'
    },

    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.json']
    },

    module: {
        rules: [
            {
                test: /\.(ts|js)x?$/,
                loader: 'babel-loader',
                exclude: /node_modules/
            },
            {
                test: /\.html$/,
                loader: 'html-loader'
            }
        ]
    },

    optimization: {
        splitChunks: {
            cacheGroups: {
                default: false,
                vendors: false,
                // vendor chunk
                vendor: {
                    // sync + async chunks
                    chunks: 'all',
                    // import file path containing node_modules
                    test: /node_modules/
                }
            }
        }
    },

    plugins: [
        new ForkTsCheckerWebpackPlugin(),
        new HTMLWebpackPlugin({
            title: 'Marking-TS',
            template: path.resolve(__dirname, 'public/index.html')
        })
    ],
    externals: [
        {
            lodash: {
                commonjs: 'lodash',
                commonjs2: 'lodash',
                amd: 'lodash',
                root: '_'
            },
            paper: 'paper'
        },
    ]
};
