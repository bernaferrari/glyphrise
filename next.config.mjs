/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep local dev and automated browser tests from writing agent instruction
  // files into the project root.
  agentRules: false,
}

export default nextConfig
