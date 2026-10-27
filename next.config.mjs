/** @type {import('next').NextConfig} */
const nextConfig = {
  // The admin panel lives under /admin (backend emails link to
  // /admin/reset-password and /admin/accept-invite), so send the bare domain there.
  async redirects() {
    return [{ source: "/", destination: "/admin/dashboard", permanent: false }];
  },
};

export default nextConfig;
