/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep local dev and automated browser tests from writing agent instruction
  // files into the project root.
  agentRules: false,
  // The floating dev button covers the first phone navigation control.
  devIndicators: false,
}

export default nextConfig
