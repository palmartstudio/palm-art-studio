import { groq } from "next-sanity";

export const siteSettingsQuery = groq`*[_type == "siteSettings"][0]`;

export const artistBioQuery = groq`*[_type == "artistBio"][0]{
  ...,
  "portraitUrl": portrait.asset->url
}`;

export const featuredArtworkQuery = groq`*[_type == "artwork" && featured == true] | order(order asc){
  ...,
  "imageUrl": image.asset->url
}`;

export const allArtworkQuery = groq`*[_type == "artwork"] | order(order asc){
  ...,
  "imageUrl": image.asset->url
}`;

export const artworkBySlugQuery = groq`*[_type == "artwork" && slug.current == $slug][0]{
  ...,
  "imageUrl": image.asset->url,
  "additionalImageUrls": additionalImages[].asset->url
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
