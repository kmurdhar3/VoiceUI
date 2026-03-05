const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Add ngrok-skip-browser-warning header to bypass Ngrok's free-tier
// interstitial page which causes "Cannot read properties of undefined (reading 'body')" errors
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      req.headers["ngrok-skip-browser-warning"] = "true";
      return middleware(req, res, next);
    };
  },
};

module.exports = withNativeWind(config, { input: "./global.css" });
