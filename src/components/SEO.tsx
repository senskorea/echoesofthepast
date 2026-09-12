import { Helmet } from "react-helmet-async";

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  canonicalUrl?: string;
}

export const SEO = ({
  title = "GeoStories - Mapping History, One Story at a Time",
  description = "Transform static archives into an immersive, map-based storytelling experience. Explore historical postcards, AI narratives, and an interactive learning hub.",
  keywords = "history, maps, postcards, storytelling, historical archive, interactive map, AI learning, heritage preservation, MOOC",
  ogImage = "https://geostories.eu/og-image.png",
  canonicalUrl = "https://geostories.eu/",
}: SEOProps) => {
  const fullTitle = title.includes("GeoStories") ? title : `${title} | GeoStories`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:url" content={canonicalUrl} />

      {/* Twitter */}
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
    </Helmet>
  );
};

export default SEO;
