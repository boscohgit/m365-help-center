import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://help.incorp-int.com",
  base: "/",
  output: "static",
  integrations: [sitemap()],
});
