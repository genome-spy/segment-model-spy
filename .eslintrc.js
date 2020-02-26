module.exports = {
    env: {
        browser: true,
        es6: true
    },
    extends: ["eslint:recommended", "prettier"],
    parserOptions: {
        ecmaVersion: 2019,
        sourceType: "module"
    },
    rules: {
        "no-undefined": "off",
        "no-nested-ternary": "off",
        "dot-notation": "off",
        "no-unused-vars": ["error", { args: "none" }]
    }
};
