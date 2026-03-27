import { defineType, defineField } from "sanity";

export default defineType({
  name: "shopItem",
  title: "Shop Item",
  type: "document",
  fields: [
    defineField({ name: "title", title: "Title", type: "string", validation: (r) => r.required() }),
    defineField({ name: "slug", title: "Slug", type: "slug", options: { source: "title", maxLength: 96 } }),
    defineField({ name: "image", title: "Image", type: "image", options: { hotspot: true }, validation: (r) => r.required() }),
    defineField({
      name: "additionalImages",
      title: "Additional Images",
      type: "array",
      of: [{ type: "image", options: { hotspot: true } }],
    }),
    defineField({ name: "description", title: "Description", type: "text", rows: 4 }),
    defineField({ name: "medium", title: "Medium / Details", type: "string" }),
    defineField({ name: "price", title: "Price ($)", type: "number", validation: (r) => r.required() }),
    defineField({ name: "comparePrice", title: "Compare At Price ($)", type: "number", description: "Original price for sale items" }),
    defineField({
      name: "badge",
      title: "Badge",
      type: "string",
      options: {
        list: [
          { title: "Limited Edition", value: "Limited Edition" },
          { title: "Original", value: "Original" },
          { title: "New", value: "New" },
          { title: "Sale", value: "Sale" },
          { title: "Sold Out", value: "Sold Out" },
        ],
      },
    }),
    defineField({
      name: "type",
      title: "Type",
      type: "string",
      options: {
        list: [
          { title: "Original Painting", value: "original" },
          { title: "Print", value: "print" },
          { title: "Commission", value: "commission" },
          { title: "Set / Collection", value: "set" },
          { title: "Merchandise", value: "merch" },
        ],
      },
    }),
    defineField({ name: "inStock", title: "In Stock", type: "boolean", initialValue: true }),
    defineField({ name: "stripeLink", title: "Stripe Payment Link", type: "url", description: "Direct Stripe checkout URL" }),
    defineField({ name: "artwork", title: "Related Artwork", type: "reference", to: [{ type: "artwork" }] }),
    defineField({ name: "order", title: "Sort Order", type: "number", initialValue: 0 }),
  ],
  preview: {
    select: { title: "title", media: "image", price: "price", badge: "badge" },
    prepare({ title, media, price, badge }) {
      return { title, media, subtitle: `$${price || "—"}${badge ? " · " + badge : ""}` };
    },
  },
});
