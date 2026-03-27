import { defineType, defineField } from "sanity";

export default defineType({
  name: "event",
  title: "Event",
  type: "document",
  fields: [
    defineField({ name: "title", title: "Event Name", type: "string", validation: (r) => r.required() }),
    defineField({ name: "date", title: "Event Date", type: "date", validation: (r) => r.required() }),
    defineField({ name: "endDate", title: "End Date (if multi-day)", type: "date" }),
    defineField({ name: "location", title: "Location", type: "string" }),
    defineField({ name: "description", title: "Description", type: "text", rows: 3 }),
    defineField({ name: "rsvpUrl", title: "RSVP / Tickets URL", type: "url" }),
    defineField({ name: "image", title: "Event Image", type: "image", options: { hotspot: true } }),
    defineField({
      name: "type",
      title: "Event Type",
      type: "string",
      options: {
        list: [
          { title: "Exhibition", value: "exhibition" },
          { title: "Art Festival", value: "festival" },
          { title: "Studio Open House", value: "open-house" },
          { title: "Workshop", value: "workshop" },
          { title: "Other", value: "other" },
        ],
      },
    }),
  ],
  orderings: [
    { title: "Date (Upcoming)", name: "dateAsc", by: [{ field: "date", direction: "asc" }] },
  ],
  preview: {
    select: { title: "title", subtitle: "location", date: "date" },
    prepare({ title, subtitle, date }) {
      return { title, subtitle: `${date || ""} · ${subtitle || ""}` };
    },
  },
});
