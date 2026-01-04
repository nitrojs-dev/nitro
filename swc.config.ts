import type { Config } from "@swc/core";

export const config: Config = {
    jsc: {
        parser: {
            tsx: true,
            syntax: "typescript",
            decorators: true
        },

        transform: {
            decoratorVersion: "2022-03",
            react: {
                runtime: "automatic",
                refresh: true
            }
        },

        target: "esnext"
    }
}

export default config;