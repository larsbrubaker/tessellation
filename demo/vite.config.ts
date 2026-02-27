import { defineConfig } from "vite";

export default defineConfig({
  root: ".",
  publicDir: "public",
  base: process.env.CI ? "/tessellation/" : "/",
});
