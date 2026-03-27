import { defineType, defineField } from "sanity";

export default defineType({
  name: "artistBio",
  title: "Artist Bio",
  type: "document",
  fields: [
    defineField({ name: "name", title: "Artist Name", type: "string", initialValue: "Carolyn Jenkins" }),
    defineField({ name: "tagline", title: "Tagline", type: "string", description: "e.g. Artist & Designer" }),
    defineField({ name: "portrait", title: "Portrait Photo", type: "image", options: { hotspot: true } }),
    defineField({ name: "studioLocation", title: "Studio Location", type: "string", initialValue: "Deltona, FL" }),
    defineField({ name: "phone", title: "Phone", type: "string" }),
    defineField({ name: "email", title: "Email", type: "string" }),
    defineField({ name: "quote", title: "Artist Quote", type: "text", rows: 3 }),
    defineField({ name: "bioShort", title: "Short Bio (Hero)", type: "text", rows: 3 }),
    defineField({ name: "bio", title: "Full Bio", type: "array", of: [{ type: "block" }] }),
    defineField({
      name: "credentials",
      title: "Credentials",
      type: "array",
      of: [{
        type: "object",
        fields: [
          defineField({ name: "number", title: "Number", type: "string" }),
          defineField({ name: "label", title: "Label", type: "string" }),
        ],
      }],
    }),
    defineField({
      name: "commercialClients",
      title: "Commercial Clients",
      type: "array",
      of: [{
        type: "object",
        fields: [
          defineField({ name: "name", title: "Client Name", type: "string" }),
          defineField({ name: "description", title: "Work Description", type: "string" }),
          defineField({ name: "logo", title: "Client Logo", type: "image" }),
        ],
      }],
    }),
    defineField({
      name: "socialLinks",
      title: "Social Links",
      type: "array",
      of: [{
        type: "object",
        fields: [
          defineField({ name: "platform", title: "Platform", type: "string" }),
          defineField({ name: "url", title: "URL", type: "url" }),
          defineField({ name: "label", title: "Short Label", type: "string", description: "e.g. TT, IG, SA" }),
        ],
      }],
    }),
  ],
});
