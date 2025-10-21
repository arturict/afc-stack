export default {
    "*.{js,jsx,ts,tsx,mjs,cjs}": ["eslint --fix", "prettier --write"],
    "*.{json,md,yml,yaml}": ["prettier --write"],
    "*.{css,scss}": ["prettier --write"],
    // Run type check on changed TypeScript files
    "*.{ts,tsx}": () => "npx tsc -b --force"
};
