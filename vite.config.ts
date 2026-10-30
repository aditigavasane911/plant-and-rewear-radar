import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  // Vite natively resolves TypeScript path aliases (paths from tsconfig.json)
  // since v6. No extra plugin needed — this replaces vite-tsconfig-paths.
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [
    // TanStack Start must come first — it registers virtual server modules
    // that the other plugins resolve against.
    tanstackStart({
      server: { entry: "server" },
    }),
    react(),
    tailwindcss(),
  ],
  server: {
    port: 3000,
    strictPort: false,
  },
});
