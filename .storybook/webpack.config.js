const tailwindcss = require('tailwindcss');
const path = require('path');
const autoPreprocess = require('svelte-preprocess');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

const testConfig = require('smelte/tailwind.config')(require('./tailwind.config'));
module.exports = ({ config, mode }) => {
    const svelteLoader = config.module.rules.find(
        r => r.loader && r.loader.includes('svelte-loader'),
    );
    svelteLoader.options = {
        ...svelteLoader.options,
        emitCss: true,
        hotReload: false,
        preprocess: autoPreprocess({
            typescript: true
        })
    };

    config.module.rules.push(
        {
            test: /\.css$/,
            loaders: [
                {
                    loader: 'postcss-loader',
                    options: {
                        sourceMap: true,
                        postcssOptions: {
                            plugins: [
                                require('postcss-import')(),
                                tailwindcss({ ...testConfig }),
                                require('autoprefixer'),
                            ]
                        }

                    },
                },
            ]
        },
        {
            test: /\.stories\.js?$/,
            loaders: [require.resolve('@storybook/source-loader')],
            include: [path.resolve(__dirname, '../scripts/spript-stories')],
            enforce: 'pre',
        },
        {
            test: /\.(jsx)$/,
            exclude: /(node_modules|bower_components)/,
            use: {
                loader: 'babel-loader',
                options: {
                    presets: ['@babel/preset-env', '@babel/preset-react']
                }
            }
        },
    );
    config.resolve.plugins.push(new TsconfigPathsPlugin({
        configFile: './tsconfig.svelte.json'
    }));
    return config;
};
