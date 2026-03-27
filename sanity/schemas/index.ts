import siteSettings from "./siteSettings";
import artistBio from "./artistBio";
import artwork from "./artwork";
import event from "./event";
import shopItem from "./shopItem";

export const schemaTypes = [
  // Singletons
  siteSettings,
  artistBio,

  // Documents
  artwork,
  event,
  shopItem,
];
