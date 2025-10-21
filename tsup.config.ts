import { defineConfig } from "tsup";

export default defineConfig({
    entry: ["create-repo.ts"],
    format: ["esm"],
    target: "node20",
    splitting: false,
    sourcemap: true,
    clean: true,
    shims: true
});
