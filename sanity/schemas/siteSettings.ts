import { defineType, defineField } from "sanity";

export default defineType({
  name: "siteSettings",
  title: "Site Settings",
  type: "document",
  fields: [
    defineField({ name: "siteTitle", title: "Site Title", type: "string", initialValue: "Palm Art Studio" }),
    defineField({ name: "siteDescription", title: "Meta Description", type: "text", rows: 2 }),
    defineField({ name: "ogImage", title: "Default OG Image", type: "image" }),
    defineField({ name: "heroTitle", title: "Hero Title", type: "string", initialValue: "Art from the Soul" }),
    defineField({ name: "heroSubtitle", title: "Hero Subtitle", type: "text", rows: 2 }),
    defineField({ name: "heroImage1", title: "Hero Frame 1 — Featured Artwork", type: "image", options: { hotspot: true } }),
    defineField({ name: "heroImage2", title: "Hero Frame 2 — Recent Work", type: "image", options: { hotspot: true } }),
    defineField({ name: "heroImage3", title: "Hero Frame 3 — Daily Study", type: "image", options: { hotspot: true } }),
    defineField({
      name: "announcement",
      title: "Announcement Banner",
      type: "object",
      fields: [
        defineField({ name: "enabled", title: "Show Banner", type: "boolean", initialValue: false }),
        defineField({ name: "text", title: "Banner Text", type: "string" }),
        defineField({ name: "link", title: "Banner Link", type: "url" }),
      ],
    }),
    defineField({ name: "newsletterHeading", title: "Newsletter Heading", type: "string", initialValue: "Stay in the Studio" }),
    defineField({ name: "newsletterText", title: "Newsletter Description", type: "string" }),
    defineField({ name: "footerText", title: "Footer Copyright", type: "string" }),
  ],
});
