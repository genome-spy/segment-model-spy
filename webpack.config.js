const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
    mode: "development",
    devtool: "inline-source-map",

    entry: {
        main: "./src/index.js"
    },

    plugins: [
        new HtmlWebpackPlugin({
            template: "index.html"
        })
    ],

    resolve: {
        symlinks: false
    },

    module: {
        rules: [
            {
                test: /\.(s*)css$/,
                use: ["style-loader", "css-loader", "sass-loader"]
            },
            {
                test: /\.glsl$/,
                use: "webpack-glsl-loader"
            },
            {
                test: /\.(txt|[ct]sv)$/,
                use: "raw-loader"
            }
        ]
    }
};
