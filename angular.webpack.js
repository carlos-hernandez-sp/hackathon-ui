//Polyfill Node.js core modules in Webpack. This module is only needed for webpack 5+.
const NodePolyfillPlugin = require("node-polyfill-webpack-plugin");
const path = require("path");

/**
 * Custom angular webpack configuration
 */
module.exports = (config, options) => {
    config.target = 'electron-renderer';

    if (options.fileReplacements) {
        for(let fileReplacement of options.fileReplacements) {
            if (fileReplacement.replace !== 'src/environments/environment.ts') {
                continue;
            }

            let fileReplacementParts = fileReplacement['with'].split('.');
            if (fileReplacementParts.length > 1 && ['web'].indexOf(fileReplacementParts[1]) >= 0) {
                config.target = 'web';
            }
            break;
        }
    }

    config.resolve = config.resolve || {};
    config.resolve.alias = {
        ...(config.resolve.alias || {}),
        'd3-selection': path.resolve(__dirname, 'node_modules/d3-selection'),
        'd3-zoom': path.resolve(__dirname, 'node_modules/d3-zoom'),
        'd3-drag': path.resolve(__dirname, 'node_modules/d3-drag'),
    };

    // ngx-vflow and d3 submodules ship without source maps compatible with source-map-loader
    config.module.rules = config.module.rules.map((rule) => {
        if (rule.loader === 'source-map-loader' || (rule.use && rule.use.some?.((u) => u.loader === 'source-map-loader'))) {
            return {
                ...rule,
                exclude: [
                    ...(Array.isArray(rule.exclude) ? rule.exclude : rule.exclude ? [rule.exclude] : []),
                    /node_modules\/d3/,
                    /node_modules\/d3-selection/,
                    /node_modules\/d3-zoom/,
                    /node_modules\/d3-drag/,
                    /node_modules\/ngx-vflow/,
                ],
            };
        }
        return rule;
    });

    config.plugins = [
        ...config.plugins,
        new NodePolyfillPlugin({
			  excludeAliases: ["console"]
		})
    ];

    return config;
}
