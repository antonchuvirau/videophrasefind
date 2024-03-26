import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      disallow:
        process.env.BASE_URL !== "https://videophrasefind.com" ? "/" : [""],
    },
    sitemap: `${process.env.BASE_URL}/sitemap.xml`,
  };
}
