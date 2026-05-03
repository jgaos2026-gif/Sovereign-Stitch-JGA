/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    // Use the build-scoped tsconfig that excludes scripts/, brics/, and tests/
    // directories (which have their own type-checking contexts and contain
    // pre-existing errors unrelated to the Next.js app).
    tsconfigPath: './tsconfig.build.json',
  },
  eslint: {
    dirs: ['app', 'components', 'lib', 'tests'],
  },
  // Static export for GitHub Pages
  output: 'export',
  basePath: '/Sovereign-Stitch-JGA',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
