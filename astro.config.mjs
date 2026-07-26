import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://boscohgit.github.io",
  base: "/m365-help-center",
  output: "static",
  integrations: [sitemap()],
});
