const path = require('path');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

module.exports = {
    entry: path.resolve(__dirname, 'src'),
    output: {
        filename: 'tasty.js',
        path: path.resolve(__dirname, 'dist'),
        library: 'tasty',
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
    plugins: [
        new ForkTsCheckerWebpackPlugin(),
    ],
    externals: [
        {
            lodash: {
                commonjs: 'lodash',
                commonjs2: 'lodash',
                amd: 'lodash',
                root: '_'
            },
            paper: 'paper',
            fontawesome: 'fontawesome',
            '@fortawesome/free-solid-svg-icons': '@fortawesome/free-solid-svg-icons',
        },
    ]
};
