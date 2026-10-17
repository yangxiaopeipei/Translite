const raycastConfig = require("@raycast/eslint-config");
module.exports = [
  ...raycastConfig,
  { ignores: ["node_modules/**", "dist/**"] },
];
