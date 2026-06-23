import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

const ignores = {
  ignores: [
    ".next/**",
    ".tmp-test/**",
    "node_modules/**",
    "output/**",
    "test-results/**"
  ]
};

const localRules = {
  rules: {
    "@typescript-eslint/no-explicit-any": "off",
    "react-hooks/refs": "off",
    "react-hooks/set-state-in-effect": "off",
    "import/no-anonymous-default-export": "off"
  }
};

const config = [
  ignores,
  ...nextVitals,
  ...nextTypeScript,
  localRules
];

export default config;
