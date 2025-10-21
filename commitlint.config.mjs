export default {
    extends: ["@commitlint/config-conventional"],
    rules: {
        "type-enum": [
            2,
            "always",
            ["feat", "fix", "docs", "style", "refactor", "perf", "test", "chore", "ci", "build", "revert"]
        ],
        "scope-case": [2, "always", "lower-case"],
        "subject-case": [0], // Allow any case for subject
        "subject-empty": [2, "never"],
        "subject-full-stop": [2, "never", "."],
        "header-max-length": [2, "always", 100],
        "body-leading-blank": [2, "always"],
        "footer-leading-blank": [2, "always"]
    }
};
