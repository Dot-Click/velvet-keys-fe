/**
 * Centralized Luxury Imagery Asset Registry
 * All image slots are configurable here so real client photography
 * and custom estate assets can easily swap in later without code changes.
 */

export interface LuxuryEstateImage {
  id: string;
  name: string;
  unit: string;
  url: string;
  thumbnailUrl: string;
}

export const LUXURY_IMAGERY = {
  hero: {
    url: "/images/hero-penthouse-dusk.jpg",
    alt: "The Aurora Penthouse interior at dusk with ambient warm lighting",
  },
  login: {
    url: "/images/hero-penthouse-dusk.jpg",
    alt: "Private executive residence at dusk",
  },
  landingHero: "/images/hero-penthouse-dusk.jpg",
  roleOwner: "/images/executive-interior.jpg",
  roleConcierge: "/images/concierge-hub.jpg",
  darkMarble: "/images/dark-marble.jpg",
  riadNight: "/images/riad-courtyard-night.jpg",
  executiveMockup: {
    url: "/images/executive-interior.jpg",
    alt: "Private penthouse master bath in Nero Marquina black marble with brushed brass",
  },
  conciergeMockup: {
    url: "/images/concierge-hub.jpg",
    alt: "Executive bedroom suite with graphite linen and dark bronze accents",
  },
  properties: [
    {
      id: "harbour",
      name: "Harbour House",
      unit: "Penthouse 14",
      url: "/images/property-harbour.jpg",
      thumbnailUrl: "/images/property-harbour.jpg",
    },
    {
      id: "aurora",
      name: "The Aurora",
      unit: "Penthouse 4A",
      url: "/images/property-aurora.jpg",
      thumbnailUrl: "/images/property-aurora.jpg",
    },
    {
      id: "palm",
      name: "Palm Residences",
      unit: "Villa Oasis",
      url: "/images/property-palm.jpg",
      thumbnailUrl: "/images/property-palm.jpg",
    },
    {
      id: "marina",
      name: "Marina House",
      unit: "Residence 12",
      url: "/images/property-marina.jpg",
      thumbnailUrl: "/images/property-marina.jpg",
    },
    {
      id: "skyline",
      name: "Skyline Tower",
      unit: "Penthouse 21",
      url: "/images/property-skyline.jpg",
      thumbnailUrl: "/images/property-skyline.jpg",
    },
    {
      id: "garden",
      name: "Garden Court",
      unit: "Suite 8",
      url: "/images/property-gardencourt.jpg",
      thumbnailUrl: "/images/property-gardencourt.jpg",
    },
  ],
};
