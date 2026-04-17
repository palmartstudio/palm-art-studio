import type { Metadata } from "next";
import {
  JsonLdScript,
  artistPerson,
  breadcrumbList,
} from "../../components/StructuredData";

const SITE_URL = "https://palmartstudio.com";
const TITLE = "About Carolyn Jenkins — Florida Watercolor & Mixed-Media Artist";
const DESC =
  "From pre-digital design studios in Winter Park to AOL, Disney, and 14+ years of exhibiting across Florida — the story and practice behind Palm Art Studio.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: `${SITE_URL}/about` },
  openGraph: {
    title: TITLE,
    description: DESC,
    url: `${SITE_URL}/about`,
    type: "profile",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESC,
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLdScript id="ld-person-about" data={artistPerson} />
      <JsonLdScript
        id="ld-breadcrumb-about"
        data={breadcrumbList([
          { name: "Home", url: `${SITE_URL}/` },
          { name: "About", url: `${SITE_URL}/about` },
        ])}
      />
      {children}
    </>
  );
}
