import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { copyFileSync, mkdirSync, readdirSync, statSync } from "fs";
import { join } from "path";

const host = "localhost";
const port = 3000;

const copyAssetsPlugin = () => {
  return {
    name: "copy-assets",
    buildStart() {
      const sourceDir = join(process.cwd(), "src", "assets");
      const targetDir = join(process.cwd(), "public", "assets");
      
      try {
        if (!statSync(sourceDir).isDirectory()) return;
        
        // Recursively copy all files from src/assets/ to public/assets/
        const copyRecursive = (src: string, dest: string) => {
          mkdirSync(dest, { recursive: true });
          const entries = readdirSync(src, { withFileTypes: true });
          
          for (const entry of entries) {
            const srcPath = join(src, entry.name);
            const destPath = join(dest, entry.name);
            
            if (entry.isDirectory()) {
              copyRecursive(srcPath, destPath);
            } else if (entry.isFile() && (entry.name.endsWith('.svg') || entry.name.endsWith('.png') || entry.name.endsWith('.jpg') || entry.name.endsWith('.jpeg'))) {
              copyFileSync(srcPath, destPath);
              console.log(`[copy-assets] Copied ${entry.name} to ${destPath.replace(process.cwd(), '')}`);
            }
          }
        };
        
        copyRecursive(sourceDir, targetDir);
      } catch (error) {
        console.warn("[copy-assets] Failed to copy assets:", error);
      }
    },
  };
};


export default defineConfig({
  plugins: [react(), copyAssetsPlugin()],
  server: {
    host,
    port,
    strictPort: true,
  },
  preview: {
    port,
  },
});
