import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Playwright ships native bindings and dynamically loads browser binaries
  // at runtime - bundling it (the default for anything imported by an API
  // route) can break that. This tells Next to `require()` it normally
  // instead, which is what lib/pdf/generateResumePdf.ts (used by
  // /api/resumes/[id]/pdf) needs to work in a production build.
  serverExternalPackages: ["playwright", "better-sqlite3"],
};

export default nextConfig;
