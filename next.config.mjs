/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  // Pin the workspace root; a stray lockfile in the home directory otherwise
  // makes Turbopack infer the wrong one.
  turbopack: {
    root: import.meta.dirname,
  },
  experimental: {
    // Keeps navigations and Server Actions pending instead of throwing when the
    // network drops, and retries them once it returns. Also enables `useOffline`.
    useOffline: true,
  },
};

export default nextConfig;
