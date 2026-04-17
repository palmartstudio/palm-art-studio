import { defineType, defineField } from "sanity";

export default defineType({
  name: "pageContent",
  title: "Page Content",
  type: "document",
  fields: [
    // ═══════════════════════════════════════
    // HOMEPAGE SECTIONS
    // ═══════════════════════════════════════
    defineField({
      name: "homeHero",
      title: "Homepage — Hero",
      type: "object",
      fields: [
        defineField({ name: "ctaPrimary", title: "Primary CTA Text", type: "string", initialValue: "Explore the Gallery" }),
        defineField({ name: "ctaSecondary", title: "Secondary CTA Text", type: "string", initialValue: "Shop Originals & Prints" }),
      ],
    }),
    defineField({
      name: "homeGallery",
      title: "Homepage — Gallery Section",
      type: "object",
      fields: [
        defineField({ name: "eyebrow", title: "Eyebrow", type: "string", initialValue: "Featured Works" }),
        defineField({ name: "title", title: "Title", type: "string", initialValue: "The Collection" }),
        defineField({ name: "description", title: "Description", type: "text", rows: 2, initialValue: "From watercolors of historic Florida architecture to bold mixed-media explorations — each piece carries emotion, story, and soul." }),
        defineField({ name: "ctaText", title: "CTA Button Text", type: "string", initialValue: "View Full Collection" }),
      ],
    }),
    defineField({
      name: "homeAbout",
      title: "Homepage — About Section",
      type: "object",
      fields: [
        defineField({ name: "eyebrow", title: "Eyebrow", type: "string", initialValue: "The Artist" }),
        defineField({ name: "heading", title: "Heading (HTML allowed)", type: "string", initialValue: "From AOL & Disney to Fine Art" }),
        defineField({ name: "paragraph1", title: "Paragraph 1", type: "text", rows: 3, initialValue: "Born in Towson, Maryland, and raised in Winter Park, Florida, Carolyn Jenkins has been painting and creating since childhood. Her artistic journey spans from the Maitland Center of the Arts and Rollins College to founding her own design firm, Storm Hill Studio." }),
        defineField({ name: "paragraph2", title: "Paragraph 2", type: "text", rows: 3, initialValue: "Her commercial career began in the pre-digital era at Tom Griffin Commercial Art Studio in Winter Park. She went on to create original icon art for AOL's early user interface, design menus for Walt Disney World and Darden Restaurants, illustrate for the Wayne Taylor Indy Racing team, and create packaging for brands like Juice Bowl." }),
        defineField({ name: "paragraph3", title: "Paragraph 3 (use {studioLocation} for dynamic location)", type: "text", rows: 2, initialValue: "Now based in {studioLocation}, Carolyn continues to create works in acrylic and watercolor, with over fourteen years exhibiting in art festivals across Florida." }),
      ],
    }),
    defineField({
      name: "homeCommercial",
      title: "Homepage — Commercial Section",
      type: "object",
      fields: [
        defineField({ name: "eyebrow", title: "Eyebrow", type: "string", initialValue: "Commercial Work" }),
        defineField({ name: "title", title: "Title", type: "string", initialValue: "Design & Illustration" }),
        defineField({ name: "description", title: "Description", type: "text", rows: 2, initialValue: "Decades of professional design work for iconic brands." }),
      ],
    }),
    defineField({
      name: "homeShop",
      title: "Homepage — Shop Section",
      type: "object",
      fields: [
        defineField({ name: "eyebrow", title: "Eyebrow", type: "string", initialValue: "Shop" }),
        defineField({ name: "title", title: "Title", type: "string", initialValue: "Bring Art Home" }),
        defineField({ name: "description", title: "Description", type: "text", rows: 2, initialValue: "Original paintings, limited edition prints, and commissions. Each piece ships with a certificate of authenticity." }),
      ],
    }),
    defineField({
      name: "homeEvents",
      title: "Homepage — Events Section",
      type: "object",
      fields: [
        defineField({ name: "eyebrow", title: "Eyebrow", type: "string", initialValue: "Community" }),
        defineField({ name: "title", title: "Title", type: "string", initialValue: "Shows & Events" }),
        defineField({ name: "description", title: "Description", type: "text", rows: 2, initialValue: "Join Carolyn at upcoming exhibitions, art festivals, and studio events." }),
      ],
    }),
    defineField({
      name: "homeContact",
      title: "Homepage — Contact Section",
      type: "object",
      fields: [
        defineField({ name: "eyebrow", title: "Eyebrow", type: "string", initialValue: "Get in Touch" }),
        defineField({ name: "title", title: "Title", type: "string", initialValue: "Let's Connect" }),
        defineField({ name: "description", title: "Description", type: "text", rows: 2, initialValue: "Interested in a commission, a purchase, or just want to talk art? Reach out anytime." }),
      ],
    }),

    // ═══════════════════════════════════════
    // ABOUT PAGE SECTIONS
    // ═══════════════════════════════════════
    defineField({
      name: "aboutHero",
      title: "About Page — Hero",
      type: "object",
      fields: [
        defineField({ name: "eyebrow", title: "Eyebrow Tag", type: "string", initialValue: "Artist & Designer" }),
        defineField({ name: "subtitle", title: "Subtitle Paragraph", type: "text", rows: 2, initialValue: "From the pre-digital art studios of Winter Park to AOL, Disney World, and award-winning fine art exhibitions across America." }),
      ],
    }),
    defineField({
      name: "aboutOrigin",
      title: "About Page — Origin Story",
      type: "object",
      fields: [
        defineField({ name: "eyebrow", title: "Eyebrow", type: "string", initialValue: "The Beginning" }),
        defineField({ name: "heading", title: "Heading", type: "string", initialValue: "Born to Create" }),
        defineField({ name: "paragraph1", title: "Paragraph 1", type: "text", rows: 3, initialValue: "Born in Towson, Maryland, and raised in Winter Park, Florida, I have been painting and creating since childhood. My artistic journey has taken me from the Maitland Center of the Arts and Rollins College to establishing my own design firm, Storm Hill Studio." }),
        defineField({ name: "paragraph2", title: "Paragraph 2", type: "text", rows: 2, initialValue: "Now based in Deltona, I continue to create works in acrylic and watercolor, drawing inspiration from a lifetime of artistic exploration." }),
      ],
    }),
    defineField({
      name: "aboutSacrifice",
      title: "About Page — The Sacrifice",
      type: "object",
      fields: [
        defineField({ name: "heading", title: "Heading", type: "string", initialValue: "The Sacrifice" }),
        defineField({ name: "paragraph1", title: "Main Paragraph", type: "text", rows: 3, initialValue: "In 1972, I was accepted into the prestigious Ringling School of Art. However, faced with a family emergency, I chose to redirect my college funds to pay for my Godmother's life-saving open-heart surgery." }),
        defineField({ name: "highlight", title: "Highlighted Closing", type: "text", rows: 2, initialValue: "That decision blessed me with her presence for another twenty years." }),
        defineField({ name: "closing", title: "Closing Line", type: "text", rows: 2, initialValue: "Today, I create with a sense of gratitude and freedom, aiming to learn without judgment and share the joy of art with others." }),
      ],
    }),
    defineField({
      name: "aboutCareer",
      title: "About Page — Career Timeline",
      type: "object",
      fields: [
        defineField({ name: "eyebrow", title: "Eyebrow", type: "string", initialValue: "Commercial Design & Illustration" }),
        defineField({ name: "heading", title: "Heading", type: "string", initialValue: "The Professional Journey" }),
        defineField({ name: "description", title: "Description", type: "text", rows: 2, initialValue: "My career began in the pre-digital era at Tom Griffin Commercial Art Studio in Winter Park, specializing in hand-drawn designs for packaging, logos, and brochures." }),
      ],
    }),
    defineField({
      name: "aboutStats",
      title: "About Page — Stats",
      type: "array",
      of: [{
        type: "object",
        fields: [
          defineField({ name: "value", title: "Number", type: "number" }),
          defineField({ name: "suffix", title: "Suffix (e.g. +)", type: "string" }),
          defineField({ name: "label", title: "Label", type: "string" }),
        ],
      }],
    }),
    defineField({
      name: "aboutExhibitions",
      title: "About Page — Fine Art & Exhibitions",
      type: "object",
      fields: [
        defineField({ name: "eyebrow", title: "Eyebrow", type: "string", initialValue: "Fine Art & Exhibitions" }),
        defineField({ name: "heading", title: "Heading", type: "string", initialValue: "Returning to the Canvas" }),
        defineField({ name: "paragraph1", title: "Paragraph 1", type: "text", rows: 3, initialValue: "In addition to commercial work, I have spent over fourteen years exhibiting in art festivals across Florida, earning multiple awards for my watercolor paintings — including 1st, 2nd, 3rd place and Honorable Mentions for detailed watercolors of old buildings and Victorian-era houses." }),
        defineField({ name: "paragraph2", title: "Paragraph 2", type: "text", rows: 2, initialValue: "I entered a show in Orlando benefiting Harbor House, a haven for domestic abuse survivors. Out of 4,000 entries, only three hundred were chosen. My work was among them." }),
        defineField({ name: "paragraph3", title: "Paragraph 3", type: "text", rows: 2, initialValue: "My work has been featured in gallery exhibits including City Arts Orlando. I am currently an active member of the West Volusia Artists." }),
      ],
    }),
    defineField({
      name: "aboutQuote",
      title: "About Page — Quote",
      type: "object",
      fields: [
        defineField({ name: "text", title: "Quote Text", type: "text", rows: 3, initialValue: "What I tell anyone who wants to create is simple: Do it. It doesn't matter what others think — create for yourself. It is good for the soul and well-being. Feel the freedom!" }),
        defineField({ name: "attribution", title: "Attribution", type: "string", initialValue: "Carolyn Jenkins" }),
      ],
    }),
    defineField({
      name: "aboutPersonalNote",
      title: "About Page — Personal Note",
      type: "object",
      fields: [
        defineField({ name: "eyebrow", title: "Eyebrow", type: "string", initialValue: "A Personal Note" }),
        defineField({ name: "heading", title: "Heading", type: "string", initialValue: "Gratitude & Freedom" }),
        defineField({ name: "paragraph1", title: "Paragraph 1", type: "text", rows: 3, initialValue: "My path as an artist has been defined by both passion and sacrifice. The decision to forgo Ringling in 1972 shaped everything that followed — it taught me that art is not just what you put on canvas, but the choices you make with your life." }),
        defineField({ name: "paragraph2", title: "Paragraph 2", type: "text", rows: 3, initialValue: "I am not inspired by any single artist. I feel if I was, I would just be considered a copier. I proceed because it's my way naturally — to project my emotions, my method of communication, my heart and soul." }),
        defineField({ name: "paragraph3", title: "Paragraph 3", type: "text", rows: 3, initialValue: "I love to utilize recycled pieces in some of my paintings and explore as far as I can with my work. Every day I paint, I exceed my own limitations and imagination." }),
        defineField({ name: "ctaPrimary", title: "Primary CTA Text", type: "string", initialValue: "View My Work" }),
        defineField({ name: "ctaSecondary", title: "Secondary CTA Text", type: "string", initialValue: "Get in Touch" }),
      ],
    }),

    // ═══════════════════════════════════════
    // GALLERY PAGE
    // ═══════════════════════════════════════
    defineField({
      name: "galleryPage",
      title: "Gallery Page",
      type: "object",
      fields: [
        defineField({ name: "heading", title: "Page Heading", type: "string", initialValue: "The Gallery" }),
        defineField({ name: "subtitle", title: "Subtitle", type: "text", rows: 2, initialValue: "Original paintings, watercolors, and mixed-media works" }),
        defineField({ name: "ctaBannerHeading", title: "CTA Banner Heading", type: "string", initialValue: "Interested in a piece?" }),
        defineField({ name: "ctaBannerDescription", title: "CTA Banner Description", type: "text", rows: 2, initialValue: "Originals, prints, and custom commissions available. Every piece ships with a certificate of authenticity." }),
        defineField({ name: "ctaPrimary", title: "CTA Primary Button", type: "string", initialValue: "Commission a Piece" }),
        defineField({ name: "ctaSecondary", title: "CTA Secondary Button", type: "string", initialValue: "Browse the Shop" }),
      ],
    }),

    // ═══════════════════════════════════════
    // PROCESS PAGE
    // ═══════════════════════════════════════
    defineField({
      name: "processPage",
      title: "Process Page",
      type: "object",
      fields: [
        defineField({ name: "eyebrow", title: "Eyebrow Tag", type: "string", initialValue: "Behind the Canvas" }),
        defineField({ name: "heading", title: "Page Heading", type: "string", initialValue: "How the Work Gets Made" }),
        defineField({
          name: "subtitle",
          title: "Subtitle",
          type: "text",
          rows: 2,
          initialValue: "Every painting starts with a blank canvas, a reference, and an idea. These are the pieces documented stage by stage — proof of the hours behind each finished work.",
        }),
        defineField({
          name: "emptyStateMessage",
          title: "Empty State Message",
          type: "string",
          initialValue: "New process timelines coming soon. Check back shortly.",
        }),
        defineField({ name: "ctaBannerHeading", title: "CTA Banner Heading", type: "string", initialValue: "Commission a piece" }),
        defineField({
          name: "ctaBannerDescription",
          title: "CTA Banner Description",
          type: "text",
          rows: 2,
          initialValue: "Interested in commissioning a custom piece? I document the full process for every commission.",
        }),
        defineField({ name: "ctaPrimary", title: "CTA Primary Button", type: "string", initialValue: "Start a Commission" }),
        defineField({ name: "ctaSecondary", title: "CTA Secondary Button", type: "string", initialValue: "View Gallery" }),
      ],
    }),
  ],
});
