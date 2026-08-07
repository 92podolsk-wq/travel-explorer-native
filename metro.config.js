const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// @maplibre/maplibre-react-native ships a package.json "exports" map with a
// non-standard "source" condition; Metro's package-exports resolution trips
// over the library's own relative internal imports (e.g. UserLocation.js)
// as a result. Falling back to legacy (filesystem-based) resolution avoids
// this — the files are all present on disk, this is purely an exports-map
// interaction bug.
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
