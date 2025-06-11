// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// 1️⃣ Allow `.cjs` files to be resolved (Firebase ships some code as .cjs)
config.resolver.sourceExts.push('cjs');

// 2️⃣ Disable the experimental "package exports" resolution logic
//    This forces Metro to load firebase/auth the classic way,
//    avoiding the race where the native Auth component isn't ready.
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
