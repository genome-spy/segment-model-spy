const meta = require("./package.json");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const webpack = require("webpack");
const path = require("path");

module.exports = {
    mode: "production",
    devtool: "source-map",

    entry: {
        main: "./src/index.js"
    },

    output: {
        path: path.resolve(__dirname, "dist")
    },

    plugins: [
        new CleanWebpackPlugin(),
        new MiniCssExtractPlugin({
            filename: "[name].css"
        }),
        new webpack.BannerPlugin({
            banner: `${meta.name} v${
                meta.version
            } - Copyright ${new Date().getFullYear()} ${meta.author.name}`
        }),
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
                use: [MiniCssExtractPlugin.loader, "css-loader", "sass-loader"]
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
