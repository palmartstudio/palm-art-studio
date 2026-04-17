import { groq } from "next-sanity";

export const siteSettingsQuery = groq`*[_type == "siteSettings"][0]`;

export const artistBioQuery = groq`*[_type == "artistBio"][0]{
  ...,
  "portraitUrl": portrait.asset->url
}`;

export const pageContentQuery = groq`*[_type == "pageContent"][0]`;

const timelineProjection = `
  processTimeline[]{
    _key,
    stage,
    caption,
    capturedAt,
    mediaType,
    "imageUrl": image.asset->url,
    "imageLqip": image.asset->metadata.lqip,
    "videoUrl": video.asset->url,
    "videoMimeType": video.asset->mimeType,
    "videoSize": video.asset->size,
    "videoPosterUrl": videoPoster.asset->url,
    "videoPosterLqip": videoPoster.asset->metadata.lqip
  }
`;

export const featuredArtworkQuery = groq`*[_type == "artwork" && featured == true] | order(order asc){
  ...,
  "imageUrl": image.asset->url,
  "imageLqip": image.asset->metadata.lqip,
  ${timelineProjection}
}`;

export const allArtworkQuery = groq`*[_type == "artwork"] | order(order asc){
  ...,
  "imageUrl": image.asset->url,
  "imageLqip": image.asset->metadata.lqip,
  ${timelineProjection}
}`;

export const artworkBySlugQuery = groq`*[_type == "artwork" && slug.current == $slug][0]{
  ...,
  "imageUrl": image.asset->url,
  "imageLqip": image.asset->metadata.lqip,
  "additionalImageUrls": additionalImages[].asset->url,
  ${timelineProjection}
}`;

export const artworksWithTimelineQuery = groq`*[_type == "artwork" && count(processTimeline) > 0] | order(order asc){
  ...,
  "imageUrl": image.asset->url,
  "imageLqip": image.asset->metadata.lqip,
  ${timelineProjection}
}`;

export const shopItemsQuery = groq`*[_type == "shopItem" && inStock == true] | order(order asc){
  ...,
  "imageUrl": image.asset->url,
  "artworkRef": artwork->{title, slug}
}`;

export const upcomingEventsQuery = groq`*[_type == "event" && date >= now()] | order(date asc){
  ...,
  "imageUrl": image.asset->url
}`;

export const allEventsQuery = groq`*[_type == "event"] | order(date desc){
  ...,
  "imageUrl": image.asset->url
}`;
