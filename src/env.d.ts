// Ambient type for process.env.NODE_ENV — used for dev-only warnings.
// Bundlers replace process.env.NODE_ENV at build time; no Node.js dependency needed.
declare const process: undefined | { env: { NODE_ENV?: string } };
