import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    "/",
    "/about",
    "/help",
    "/contact",
    "/terms-of-service",
  ];

  const staticPages = staticRoutes.map((route) => ({
    url: `${process.env.BASE_URL}${route}`,
  }));

  const dynamicPages: MetadataRoute.Sitemap = []; // todo

  return [...staticPages, ...dynamicPages];
}
