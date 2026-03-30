import siteSettings from "./siteSettings";
import artistBio from "./artistBio";
import artwork from "./artwork";
import event from "./event";
import shopItem from "./shopItem";
import pageContent from "./pageContent";

export const schemaTypes = [
  // Singletons
  siteSettings,
  artistBio,
  pageContent,

  // Documents
  artwork,
  event,
  shopItem,
];
