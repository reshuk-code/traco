/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  // Pin the workspace root; a stray lockfile in the home directory otherwise
  // makes Turbopack infer the wrong one.
  turbopack: {
    root: import.meta.dirname,
  },
  // Digital Asset Links has to sit at this exact path for Android to find it,
  // and a dot-prefixed folder is not routable, so it is rewritten to a handler.
  async rewrites() {
    return [
      { source: '/.well-known/assetlinks.json', destination: '/api/assetlinks' },
    ];
  },
  experimental: {
    // Keeps navigations and Server Actions pending instead of throwing when the
    // network drops, and retries them once it returns. Also enables `useOffline`.
    useOffline: true,
  },
};

export default nextConfig;
