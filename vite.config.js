import { defineConfig } from "vite";
import { minifyTemplateLiterals } from "rollup-plugin-minify-template-literals";

export default defineConfig({
    root: "src",
    plugins: [minifyTemplateLiterals()],
    base: "./",
    build: {
        rollupOptions: {},
        outDir: "../dist",
    },
});
