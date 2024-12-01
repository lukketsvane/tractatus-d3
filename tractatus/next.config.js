/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true, // Enable React strict mode for improved error handling
  swcMinify: true,      // Use SWC for minification instead of Terser for faster builds
  images: {
    domains: ['cdn.filestackcontent.com'], // Allow images from filestackcontent.com
  },
  i18n: {
    locales: ['en', 'de'],  // Define the locales for the project
    defaultLocale: 'en',    // Set the default locale
  },
  // Remove the experimental.appDir option as it's no longer needed
  typescript: {
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
  eslint: {
    // Allow production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  // Add custom webpack config if needed
  webpack: (config, { isServer }) => {
    // Add custom webpack configurations here if required
    return config
  },
}

module.exports = nextConfig
