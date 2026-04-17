import { defineType, defineField } from "sanity";

export default defineType({
  name: "artwork",
  title: "Artwork",
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
    defineField({
      name: "processTimeline",
      title: "Creation Timeline",
      description: "Progress photos showing this piece being created. Shown on the artwork detail lightbox and on the Process page.",
      type: "array",
      of: [
        {
          type: "object",
          name: "timelineStep",
          title: "Timeline Step",
          fields: [
            defineField({
              name: "image",
              title: "Progress Photo",
              type: "image",
              options: { hotspot: true },
              validation: (r) => r.required(),
            }),
            defineField({
              name: "stage",
              title: "Stage",
              type: "string",
              options: {
                list: [
                  { title: "Blank Canvas / Reference", value: "blank" },
                  { title: "Underpainting / Sketch", value: "underpainting" },
                  { title: "Early Progress", value: "early" },
                  { title: "Mid Progress", value: "mid" },
                  { title: "Late Progress", value: "late" },
                  { title: "Finished Piece", value: "finished" },
                  { title: "Detail Shot", value: "detail" },
                  { title: "In Studio", value: "studio" },
                  { title: "Other", value: "other" },
                ],
                layout: "dropdown",
              },
            }),
            defineField({
              name: "caption",
              title: "Caption",
              type: "text",
              rows: 2,
              description: "Optional note about this stage.",
            }),
            defineField({
              name: "capturedAt",
              title: "Photo Date",
              type: "date",
              options: { dateFormat: "YYYY-MM-DD" },
            }),
          ],
          preview: {
            select: { media: "image", title: "stage", subtitle: "caption" },
            prepare({ media, title, subtitle }) {
              const stageLabels: Record<string, string> = {
                blank: "Blank Canvas",
                underpainting: "Underpainting",
                early: "Early",
                mid: "Mid Progress",
                late: "Late",
                finished: "Finished",
                detail: "Detail",
                studio: "In Studio",
                other: "Other",
              };
              return { media, title: stageLabels[title as string] || title || "Step", subtitle };
            },
          },
        },
      ],
    }),
    defineField({
      name: "medium",
      title: "Medium",
      type: "string",
      options: {
        list: [
          { title: "Watercolor", value: "watercolor" },
          { title: "Acrylic", value: "acrylic" },
          { title: "Mixed Media", value: "mixed-media" },
          { title: "Oil", value: "oil" },
          { title: "Digital", value: "digital" },
          { title: "Other", value: "other" },
        ],
      },
    }),
    defineField({ name: "dimensions", title: "Dimensions", type: "string", description: "e.g. 18 × 24 in" }),
    defineField({ name: "year", title: "Year Created", type: "number" }),
    defineField({ name: "description", title: "Description", type: "text", rows: 4 }),
    defineField({
      name: "status",
      title: "Status",
      type: "string",
      options: {
        list: [
          { title: "Available", value: "available" },
          { title: "Sold", value: "sold" },
          { title: "Not For Sale", value: "nfs" },
          { title: "Print Only", value: "print-only" },
        ],
      },
      initialValue: "available",
    }),
    defineField({ name: "price", title: "Price ($)", type: "number" }),
    defineField({ name: "printPrice", title: "Print Price ($)", type: "number" }),
    defineField({ name: "featured", title: "Featured on Homepage", type: "boolean", initialValue: false }),
    defineField({
      name: "category",
      title: "Category",
      type: "string",
      options: {
        list: [
          { title: "Fine Art", value: "fine-art" },
          { title: "Commercial", value: "commercial" },
          { title: "Daily Painting", value: "daily" },
          { title: "Commission", value: "commission" },
        ],
      },
    }),
    defineField({ name: "order", title: "Sort Order", type: "number", initialValue: 0 }),
  ],
  orderings: [
    { title: "Sort Order", name: "orderAsc", by: [{ field: "order", direction: "asc" }] },
    { title: "Newest", name: "yearDesc", by: [{ field: "year", direction: "desc" }] },
  ],
  preview: {
    select: { title: "title", media: "image", subtitle: "medium" },
  },
});
