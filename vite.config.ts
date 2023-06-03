import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  base: '/Cashier-App/',
	plugins: [react()],
	build: {
		emptyOutDir: true,
		outDir: "./docs",
	},
});
