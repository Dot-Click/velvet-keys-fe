/**
 * Media slots for the Conciergerie panel. Every value starts as null, which renders the
 * designed fallback; set a value to the public URL once the file is delivered.
 *
 * File conventions (served from /public, so the URL drops the "/public" prefix):
 * - /media/properties/{propertyId}/hero.webp (2400×1500), card.webp (1200×750), thumb.webp (160×160)
 * - /media/units/{unitId}/card.webp (800×1000), thumb.webp (160×160)
 * - /media/illustrations/{name}.svg (line art; paths use pathLength="1")
 *
 * `lqip` is a tiny blurred preview, typically a base64 data URL, shown while the image loads.
 * Keys are the ids in src/mocks/properties.ts; src/tests/media-manifest.test.ts keeps them in step.
 */

export interface PropertyMedia {
  hero: string | null;
  card: string | null;
  thumb: string | null;
  lqip: string | null;
}

export interface UnitMedia {
  card: string | null;
  thumb: string | null;
  lqip: string | null;
}

export const ILLUSTRATION_NAMES = [
  "empty-today",
  "empty-bookings",
  "empty-calendar",
  "empty-leases",
  "empty-rent",
  "empty-maintenance",
  "empty-expenses",
  "empty-owners",
  "empty-channels",
  "empty-properties",
  "empty-commission",
  "empty-billing",
  "kpi-arrivals",
  "kpi-departures",
  "kpi-housekeeping",
  "kpi-repairs",
  "kpi-rent",
  "channels-sync-hero",
  "invite-envelope",
  "chip-broom",
  "chip-coin",
  "chip-wrench",
] as const;

export type IllustrationName = (typeof ILLUSTRATION_NAMES)[number];

export const propertyImages: Record<string, PropertyMedia> = {
  "prop-aurora": { hero: "/media/properties/prop-aurora/hero.webp", card: "/media/properties/prop-aurora/card.webp", thumb: "/media/properties/prop-aurora/thumb.webp", lqip: "data:image/webp;base64,UklGRkQAAABXRUJQVlA4IDgAAACwAQCdASoQAAoAAoBCJZwC7ADBHv4AAP753BwsrIncNzD5arwNt8oDHP7vR37KrSN3KDKhJayQAA==" },
  "prop-garden": { hero: "/media/properties/prop-garden/hero.webp", card: "/media/properties/prop-garden/card.webp", thumb: "/media/properties/prop-garden/thumb.webp", lqip: "data:image/webp;base64,UklGRkQAAABXRUJQVlA4IDgAAAAwAgCdASoQAAoAAoBCJZQCdAD0uqyzcQrhAAD++GR+OkW+0duZrVK9nLNqXHfup6fCDOYIPBlAAA==" },
  "prop-zitouna": { hero: "/media/properties/prop-zitouna/hero.webp", card: "/media/properties/prop-zitouna/card.webp", thumb: "/media/properties/prop-zitouna/thumb.webp", lqip: "data:image/webp;base64,UklGRlIAAABXRUJQVlA4IEYAAAAQAgCdASoQAAoAAoBCJYgCsAELM8qmatoAAP74qMRM4PaXxPqdPMaNh82CvAvRDajQVKiuJceJQc8Tc/lUbqezOJIYaAAA" },
  "prop-palmeraie": { hero: "/media/properties/prop-palmeraie/hero.webp", card: "/media/properties/prop-palmeraie/card.webp", thumb: "/media/properties/prop-palmeraie/thumb.webp", lqip: "data:image/webp;base64,UklGRmIAAABXRUJQVlA4IFYAAABQAgCdASoQAAoAAoBCJYgCdH8AFN72WNatIJwA/vXwuv8e4Ubc9Zylh/5ahyYq1A+TFe574B9k1V4jkIxmBQhy1GsXsZc2cZrxKa8MmFx3L44r8yAAAA==" },
  "prop-mimouna": { hero: "/media/properties/prop-mimouna/hero.webp", card: "/media/properties/prop-mimouna/card.webp", thumb: "/media/properties/prop-mimouna/thumb.webp", lqip: "data:image/webp;base64,UklGRmQAAABXRUJQVlA4IFgAAADQAQCdASoQAAoAAoBCJQBOgB6GIIZeIAD+8SF9aPYNP1Dam3R9a8H/6JH2UmDzHjPPmw+VITibTfau3CG70jPLgd0q0Tj3HB9UuE5C2W9GfsxGO5XCrAAA" },
  "prop-gueliz": { hero: "/media/properties/prop-gueliz/hero.webp", card: "/media/properties/prop-gueliz/card.webp", thumb: "/media/properties/prop-gueliz/thumb.webp", lqip: "data:image/webp;base64,UklGRkQAAABXRUJQVlA4IDgAAAAwAgCdASoQAAoAAoBCJZQCdAD0uqyzcQrhAAD++GR+OkW+0duZrVK9nLNqXHfup6fCDOYIPBlAAA==" },
  "prop-marina": { hero: "/media/properties/prop-marina/hero.webp", card: "/media/properties/prop-marina/card.webp", thumb: "/media/properties/prop-marina/thumb.webp", lqip: "data:image/webp;base64,UklGRlYAAABXRUJQVlA4IEoAAABQAgCdASoQAAoAAoBCJYgCdH8AF76N9yCaT4AA/voEQk058/27WNkKeqVr3y7OGPh+NqBzGuQYvnvQqVXQYWMEt2MMosTlDSUAAA==" },
  "prop-anfa": { hero: "/media/properties/prop-anfa/hero.webp", card: "/media/properties/prop-anfa/card.webp", thumb: "/media/properties/prop-anfa/thumb.webp", lqip: "data:image/webp;base64,UklGRmYAAABXRUJQVlA4IFoAAABQAgCdASoQAAoAAoBCJYgCdH8AGX2whoDqMAAA/gtGdn7jUbXBY86NNJWSIyKdVRcxzWffV9wvui2L3nTEbeqvGtO2cfrx5Vx7aMdCQzNni5QZS6q1hjbPoAA=" },
  "prop-skyline": { hero: "/media/properties/prop-skyline/hero.webp", card: "/media/properties/prop-skyline/card.webp", thumb: "/media/properties/prop-skyline/thumb.webp", lqip: "data:image/webp;base64,UklGRkwAAABXRUJQVlA4IEAAAAAQAgCdASoQAAoAAoBCJZQCdAEO+D0G+KIAAP71m6fiviomMDB3c9iTe+EHb6lEE4g0A841c0sDi0tKz/E3EAAA" },
  "prop-casa-port": { hero: "/media/properties/prop-casa-port/hero.webp", card: "/media/properties/prop-casa-port/card.webp", thumb: "/media/properties/prop-casa-port/thumb.webp", lqip: "data:image/webp;base64,UklGRkwAAABXRUJQVlA4IEAAAAAQAgCdASoQAAoAAoBCJZQCdAEO+D0G+KIAAP71m6fiviomMDB3c9iTe+EHb6lEE4g0A841c0sDi0tKz/E3EAAA" },
  "prop-maarif": { hero: "/media/properties/prop-maarif/hero.webp", card: "/media/properties/prop-maarif/card.webp", thumb: "/media/properties/prop-maarif/thumb.webp", lqip: "data:image/webp;base64,UklGRmAAAABXRUJQVlA4IFQAAAAwAgCdASoQAAoAAoBCJQBOja/gWWRbTtYUAAD++JGutWjS1SAbuXwOEOzN8hR2oCmskowzWLtyD4PTRh93aD05de462CyFvPiKN0L9sVu+pA0oAAA=" },
  "prop-oudaya": { hero: "/media/properties/prop-oudaya/hero.webp", card: "/media/properties/prop-oudaya/card.webp", thumb: "/media/properties/prop-oudaya/thumb.webp", lqip: "data:image/webp;base64,UklGRmAAAABXRUJQVlA4IFQAAADwAQCdASoQAAoAAoBCJQBOgCFUW1ThkAAA/u0J28AedU640QhSozlYsEQhmG/TbkfWv+JgSRZlkcsiA4dMxxBio8QRie7mOh/yIxiMNkmRjRVMIAA=" },
  "prop-agdal": { hero: "/media/properties/prop-agdal/hero.webp", card: "/media/properties/prop-agdal/card.webp", thumb: "/media/properties/prop-agdal/thumb.webp", lqip: "data:image/webp;base64,UklGRkAAAABXRUJQVlA4IDQAAADwAQCdASoQAAoAAoBCJYwCdAD2OC14pYAA+Wf/bPl1WpRW3eSmzzq7ML3CtnYhU27kAAAA" },
  "prop-hassan": { hero: "/media/properties/prop-hassan/hero.webp", card: "/media/properties/prop-hassan/card.webp", thumb: "/media/properties/prop-hassan/thumb.webp", lqip: "data:image/webp;base64,UklGRjwAAABXRUJQVlA4IDAAAACQAQCdASoQAAoAAoBCJY2DrRgAiwAA/vScJz1PT2XHwijeBvhbxJleLwyyhXhAAAA=" },
  "prop-malabata": { hero: "/media/properties/prop-malabata/hero.webp", card: "/media/properties/prop-malabata/card.webp", thumb: "/media/properties/prop-malabata/thumb.webp", lqip: "data:image/webp;base64,UklGRmgAAABXRUJQVlA4IFwAAAAQAgCdASoQAAoAAoBCJbACdAEf5ZLtioiYAP75YJ6ccySgy/5gz55FMA3d+liHQox10wQCe3iEZej9qmBdbIBYRLGQ1K+skWVUtFtlEXsFnfwrbXYGcWx9ggAAAA==" },
  "prop-dar-benali": { hero: "/media/properties/prop-dar-benali/hero.webp", card: "/media/properties/prop-dar-benali/card.webp", thumb: "/media/properties/prop-dar-benali/thumb.webp", lqip: "data:image/webp;base64,UklGRkoAAABXRUJQVlA4ID4AAAAQAgCdASoQAAoAAoBCJYwCdAEPEM+BF0zgAP7tL3cjq592fV6OGqy3T5anp73Dl0mPuiowdcbsxOyslgAAAA==" },
  "prop-tanja": { hero: "/media/properties/prop-tanja/hero.webp", card: "/media/properties/prop-tanja/card.webp", thumb: "/media/properties/prop-tanja/thumb.webp", lqip: "data:image/webp;base64,UklGRlgAAABXRUJQVlA4IEwAAADQAQCdASoQAAoAAoBCJQBOgB6P15o8uAD+9e7pUM8r2f3El1UPJ4jgwJ/fBdwygxuIDisi/ZH6u/4Zk7p0ccXxq/1sMIkm3Rz+T4AA" },
  "prop-taghazout": { hero: "/media/properties/prop-taghazout/hero.webp", card: "/media/properties/prop-taghazout/card.webp", thumb: "/media/properties/prop-taghazout/thumb.webp", lqip: "data:image/webp;base64,UklGRk4AAABXRUJQVlA4IEIAAADwAQCdASoQAAoAAoBCJZQCdAEfa7T9nQAA/vGuY4VMpVdt4+HY/liu6Zpop4UwnT4T/ZGsMXRmWNX418TpyilUAAA=" },
  "prop-agadir-marina": { hero: "/media/properties/prop-agadir-marina/hero.webp", card: "/media/properties/prop-agadir-marina/card.webp", thumb: "/media/properties/prop-agadir-marina/thumb.webp", lqip: "data:image/webp;base64,UklGRlYAAABXRUJQVlA4IEoAAABQAgCdASoQAAoAAoBCJYgCdH8AF76N9yCaT4AA/voEQk058/27WNkKeqVr3y7OGPh+NqBzGuQYvnvQqVXQYWMEt2MMosTlDSUAAA==" },
  "prop-mogador": { hero: "/media/properties/prop-mogador/hero.webp", card: "/media/properties/prop-mogador/card.webp", thumb: "/media/properties/prop-mogador/thumb.webp", lqip: "data:image/webp;base64,UklGRlIAAABXRUJQVlA4IEYAAAAQAgCdASoQAAoAAoBCJYgCsAELM8qmatoAAP74qMRM4PaXxPqdPMaNh82CvAvRDajQVKiuJceJQc8Tc/lUbqezOJIYaAAA" },
};

export const unitImages: Record<string, UnitMedia> = {
  "unit-aurora-ph4a": { card: "/media/units/unit-aurora-ph4a/card.webp", thumb: "/media/units/unit-aurora-ph4a/thumb.webp", lqip: "data:image/webp;base64,UklGRnIAAABXRUJQVlA4IGYAAAAQBACdASoQABQAPrVInkmnJCKhMAgA4BaJZQC1CFzDAl7TOc6Zi8fYAAD+8WmVpYz7p3vlncK7LR6Zw4DH2LAyQ8RbP3fjYugIT3ygDZJAiBbX8zcoMOEeI3O/nQh100d4JJYAAAA=" },
  "unit-aurora-2b": { card: "/media/units/unit-aurora-2b/card.webp", thumb: "/media/units/unit-aurora-2b/thumb.webp", lqip: "data:image/webp;base64,UklGRmQAAABXRUJQVlA4IFgAAACwAwCdASoQABQAPrVInkmnJCKhMAgA4BaJZQC7ACHS1fno3+posAD+hAGu8K5S340VzdnvniIQkxiEeJh6c4tK0gLEVL/5bqFsg+rIojtjfjnzF8pZTAAA" },
  "unit-aurora-1c": { card: "/media/units/unit-aurora-1c/card.webp", thumb: "/media/units/unit-aurora-1c/thumb.webp", lqip: "data:image/webp;base64,UklGRloAAABXRUJQVlA4IE4AAACwAwCdASoQABQAPrVKoEonJCMhsAgA4BaJZwAAW+j9seAXOtopgAD+9e2XbTaJ2Kx/vN8yTnUIHoTsw2eCYlU0c2T1uMOVUaoi8qNLMAA=" },
  "unit-marina-r12": { card: "/media/units/unit-marina-r12/card.webp", thumb: "/media/units/unit-marina-r12/thumb.webp", lqip: "data:image/webp;base64,UklGRlwAAABXRUJQVlA4IFAAAAAQBACdASoQABQAPrVKnkmnJCKhMAgA4BaJZwDG9B6P2TZdjFhB3kcRAAD+9sJIYlwC93IAdrgeHWaIUERfjFvn9ICilx1KVkrcv3fZS13sAA==" },
  "unit-marina-r14": { card: "/media/units/unit-marina-r14/card.webp", thumb: "/media/units/unit-marina-r14/thumb.webp", lqip: "data:image/webp;base64,UklGRnwAAABXRUJQVlA4IHAAAABQBACdASoQABQAPrVKnkonJCKhsAgA4BaJZACdACPtxViwVZ6TrzoNEGoAAP7y1gf5H0sdkA7zc3BhSC9Eb/EpXK/cDBsAW5UcWba3rmrFeLSfVnlUwyJNdEZWVhEMxe7Aa5okII8EWRaepuI2AAAA" },
  "unit-marina-apt7": { card: "/media/units/unit-marina-apt7/card.webp", thumb: "/media/units/unit-marina-apt7/thumb.webp", lqip: "data:image/webp;base64,UklGRmYAAABXRUJQVlA4IFoAAACQAwCdASoQABQAPrVInkmnJCKhMAgA4BaJZQAAUp+aGmxybWa4AP7qVrAC06mSiXuz2FhY8QM3s4TlBrxubtzzcjgCXgZfYm67oUBfALUrb5fOIfrD9R7QAAA=" },
  "unit-anfa-2a": { card: "/media/units/unit-anfa-2a/card.webp", thumb: "/media/units/unit-anfa-2a/thumb.webp", lqip: "data:image/webp;base64,UklGRnwAAABXRUJQVlA4IHAAAACwAwCdASoQABQAPrVInkmnJCKhMAgA4BaJQBOgBHoATjl5vEmAAAD+5gaYSxOB1/47CF5sJfVlG7Wk4tpT56ZX5ZE29p5BUqrVdtoASzgoJ4xER/Zgo1GAWcUW4VnQOjy6pv4AlCYGvvounwT8F8AA" },
  "unit-anfa-3b": { card: "/media/units/unit-anfa-3b/card.webp", thumb: "/media/units/unit-anfa-3b/thumb.webp", lqip: "data:image/webp;base64,UklGRmYAAABXRUJQVlA4IFoAAADQAwCdASoQABQAPrVInkmnJCKhMAgA4BaJZQC7ACHvvDhq8FQEcjAA/qZ/7AZS6sQGpDnAuafEXQY3wZGcyA1M4IqrsWHcnny0aKaM4l3ihZV7GMSgj91AMAA=" },
  "unit-anfa-4c": { card: "/media/units/unit-anfa-4c/card.webp", thumb: "/media/units/unit-anfa-4c/thumb.webp", lqip: "data:image/webp;base64,UklGRloAAABXRUJQVlA4IE4AAACwAwCdASoQABQAPrVKoEonJCMhsAgA4BaJZwAAW+j9seAXOtopgAD+9e2XbTaJ2Kx/vN8yTnUIHoTsw2eCYlU0c2T1uMOVUaoi8qNLMAA=" },
  "unit-garden-s8": { card: "/media/units/unit-garden-s8/card.webp", thumb: "/media/units/unit-garden-s8/thumb.webp", lqip: "data:image/webp;base64,UklGRmQAAABXRUJQVlA4IFgAAACwAwCdASoQABQAPrVInkmnJCKhMAgA4BaJZQC7ACHS1fno3+posAD+hAGu8K5S340VzdnvniIQkxiEeJh6c4tK0gLEVL/5bqFsg+rIojtjfjnzF8pZTAAA" },
  "unit-garden-s9": { card: "/media/units/unit-garden-s9/card.webp", thumb: "/media/units/unit-garden-s9/thumb.webp", lqip: "data:image/webp;base64,UklGRlwAAABXRUJQVlA4IFAAAADQAwCdASoQABQAPrVKn0onJCKhsAgA4BaJZwDCgCPtvt3kuB4GuLAA/vRP2/6RUFGGDWL1krmZOv+WRfszxgmiD9qT9rHdaxnebemCJ0AAAA==" },
  "unit-garden-s10": { card: "/media/units/unit-garden-s10/card.webp", thumb: "/media/units/unit-garden-s10/thumb.webp", lqip: "data:image/webp;base64,UklGRmYAAABXRUJQVlA4IFoAAACQAwCdASoQABQAPrVInkmnJCKhMAgA4BaJZQAAUp+aGmxybWa4AP7qVrAC06mSiXuz2FhY8QM3s4TlBrxubtzzcjgCXgZfYm67oUBfALUrb5fOIfrD9R7QAAA=" },
  "unit-zitouna-estate": { card: "/media/units/unit-zitouna-estate/card.webp", thumb: "/media/units/unit-zitouna-estate/thumb.webp", lqip: "data:image/webp;base64,UklGRl4AAABXRUJQVlA4IFIAAACwAwCdASoQABQAPrVInkmnJCKhMAgA4BaJZwDA3CHe2jz1mc4QQAD+9tpoP76OrLg/W0DErSJRVdfbYTFBCNuQRxU3KKRGSeDD8o/BQ1BrQAAA" },
  "unit-oudaya-andalous": { card: "/media/units/unit-oudaya-andalous/card.webp", thumb: "/media/units/unit-oudaya-andalous/thumb.webp", lqip: "data:image/webp;base64,UklGRmAAAABXRUJQVlA4IFQAAADQAwCdASoQABQAPrVInkmnJCKhMAgA4BaJZwAAOTMbjJ/+ULm0sAAA/vfGTPIqTOhD/sHx9IiLX7e+moh66vR23VtlU8HmPHdqYZZ1qZ5ODJtIDgA=" },
  "unit-oudaya-zellige": { card: "/media/units/unit-oudaya-zellige/card.webp", thumb: "/media/units/unit-oudaya-zellige/thumb.webp", lqip: "data:image/webp;base64,UklGRmQAAABXRUJQVlA4IFgAAACwAwCdASoQABQAPrVInkmnJCKhMAgA4BaJZQC7ACHS1fno3+posAD+hAGu8K5S340VzdnvniIQkxiEeJh6c4tK0gLEVL/5bqFsg+rIojtjfjnzF8pZTAAA" },
  "unit-oudaya-garden": { card: "/media/units/unit-oudaya-garden/card.webp", thumb: "/media/units/unit-oudaya-garden/thumb.webp", lqip: "data:image/webp;base64,UklGRl4AAABXRUJQVlA4IFIAAAAwBACdASoQABQAPrVMnkonJCKhsAgA4BaJZwDG9CG8aHQmptIkHP284aAA/vLm+smUpjG0g+4FsnTuVMGIL1BfIyEwejhR17PPDtb4e25kKHgA" },
  "unit-skyline-ph21": { card: "/media/units/unit-skyline-ph21/card.webp", thumb: "/media/units/unit-skyline-ph21/thumb.webp", lqip: "data:image/webp;base64,UklGRnIAAABXRUJQVlA4IGYAAAAQBACdASoQABQAPrVInkmnJCKhMAgA4BaJZQC1CFzDAl7TOc6Zi8fYAAD+8WmVpYz7p3vlncK7LR6Zw4DH2LAyQ8RbP3fjYugIT3ygDZJAiBbX8zcoMOEeI3O/nQh100d4JJYAAAA=" },
  "unit-skyline-18": { card: "/media/units/unit-skyline-18/card.webp", thumb: "/media/units/unit-skyline-18/thumb.webp", lqip: "data:image/webp;base64,UklGRooAAABXRUJQVlA4IH4AAADwAwCdASoQABQAPrVInkmnJCKhMAgA4BaJQBWABEAyOQ4A8h/AMbwAAP7RW7sWs7nmGWDFJctzU60XoSknINmA1nCqSP3XbVAErLK0vJO5CynUrguK/nyUGyUYZAcVR/PH+uCejVP4QeYDOXH9sAZE9XcrRuoLVGTzIukAAAA=" },
  "unit-skyline-15": { card: "/media/units/unit-skyline-15/card.webp", thumb: "/media/units/unit-skyline-15/thumb.webp", lqip: "data:image/webp;base64,UklGRlwAAABXRUJQVlA4IFAAAAAQBACdASoQABQAPrVKnkmnJCKhMAgA4BaJZwDG9B6P2TZdjFhB3kcRAAD+9sJIYlwC93IAdrgeHWaIUERfjFvn9ICilx1KVkrcv3fZS13sAA==" },
  "unit-skyline-9": { card: "/media/units/unit-skyline-9/card.webp", thumb: "/media/units/unit-skyline-9/thumb.webp", lqip: "data:image/webp;base64,UklGRmQAAABXRUJQVlA4IFgAAACwAwCdASoQABQAPrVInkmnJCKhMAgA4BaJZQC7ACHS1fno3+posAD+hAGu8K5S340VzdnvniIQkxiEeJh6c4tK0gLEVL/5bqFsg+rIojtjfjnzF8pZTAAA" },
  "unit-malabata-villa": { card: "/media/units/unit-malabata-villa/card.webp", thumb: "/media/units/unit-malabata-villa/thumb.webp", lqip: "data:image/webp;base64,UklGRnIAAABXRUJQVlA4IGYAAAAQBACdASoQABQAPrVInkmnJCKhMAgA4BaJZQC1CFzDAl7TOc6Zi8fYAAD+8WmVpYz7p3vlncK7LR6Zw4DH2LAyQ8RbP3fjYugIT3ygDZJAiBbX8zcoMOEeI3O/nQh100d4JJYAAAA=" },
  "unit-malabata-suite": { card: "/media/units/unit-malabata-suite/card.webp", thumb: "/media/units/unit-malabata-suite/thumb.webp", lqip: "data:image/webp;base64,UklGRmQAAABXRUJQVlA4IFgAAACwAwCdASoQABQAPrVInkmnJCKhMAgA4BaJZQC7ACHS1fno3+posAD+hAGu8K5S340VzdnvniIQkxiEeJh6c4tK0gLEVL/5bqFsg+rIojtjfjnzF8pZTAAA" },
  "unit-palmeraie-villa": { card: "/media/units/unit-palmeraie-villa/card.webp", thumb: "/media/units/unit-palmeraie-villa/thumb.webp", lqip: "data:image/webp;base64,UklGRl4AAABXRUJQVlA4IFIAAACwAwCdASoQABQAPrVInkmnJCKhMAgA4BaJZwDA3CHe2jz1mc4QQAD+9tpoP76OrLg/W0DErSJRVdfbYTFBCNuQRxU3KKRGSeDD8o/BQ1BrQAAA" },
  "unit-palmeraie-pool": { card: "/media/units/unit-palmeraie-pool/card.webp", thumb: "/media/units/unit-palmeraie-pool/thumb.webp", lqip: "data:image/webp;base64,UklGRmYAAABXRUJQVlA4IFoAAACQAwCdASoQABQAPrVInkmnJCKhMAgA4BaJZQAAUp+aGmxybWa4AP7qVrAC06mSiXuz2FhY8QM3s4TlBrxubtzzcjgCXgZfYm67oUBfALUrb5fOIfrD9R7QAAA=" },
  "unit-benali-suite": { card: "/media/units/unit-benali-suite/card.webp", thumb: "/media/units/unit-benali-suite/thumb.webp", lqip: "data:image/webp;base64,UklGRmYAAABXRUJQVlA4IFoAAABwAwCdASoQABQAPrVKn0onJCKhsAgA4BaJQAAKU+8wLWFbYUAA/vkYdhY+a0FA0OLtxTrBBgqrSE3Mwag9Olx+v5VTDJ3XrCKVlLjvSRS993cNilu4OZe8OAA=" },
  "unit-benali-apt1": { card: "/media/units/unit-benali-apt1/card.webp", thumb: "/media/units/unit-benali-apt1/thumb.webp", lqip: "data:image/webp;base64,UklGRloAAABXRUJQVlA4IE4AAACwAwCdASoQABQAPrVKoEonJCMhsAgA4BaJZwAAW+j9seAXOtopgAD+9e2XbTaJ2Kx/vN8yTnUIHoTsw2eCYlU0c2T1uMOVUaoi8qNLMAA=" },
  "unit-benali-apt2": { card: "/media/units/unit-benali-apt2/card.webp", thumb: "/media/units/unit-benali-apt2/thumb.webp", lqip: "data:image/webp;base64,UklGRmQAAABXRUJQVlA4IFgAAACwAwCdASoQABQAPrVInkmnJCKhMAgA4BaJZQC7ACHS1fno3+posAD+hAGu8K5S340VzdnvniIQkxiEeJh6c4tK0gLEVL/5bqFsg+rIojtjfjnzF8pZTAAA" },
  "unit-tanja-1": { card: "/media/units/unit-tanja-1/card.webp", thumb: "/media/units/unit-tanja-1/thumb.webp", lqip: "data:image/webp;base64,UklGRo4AAABXRUJQVlA4IIIAAACwBACdASoQABQAPrVKnkonJCKhsAgA4BaJYgCdMoRwACxkvYVkrI3XIrla99kAAP7zENxOyr38X9I+uMusfgA3nj8dZRYzSK8AWPT5kFR5Izz7s1fmPHPdqZQHK2yzffQFScR8cmcWigHgQQaX19Ukin+JBnTbhc6qNpB4Yp8SAAAA" },
  "unit-tanja-2": { card: "/media/units/unit-tanja-2/card.webp", thumb: "/media/units/unit-tanja-2/thumb.webp", lqip: "data:image/webp;base64,UklGRmQAAABXRUJQVlA4IFgAAACwAwCdASoQABQAPrVInkmnJCKhMAgA4BaJZQC7ACHS1fno3+posAD+hAGu8K5S340VzdnvniIQkxiEeJh6c4tK0gLEVL/5bqFsg+rIojtjfjnzF8pZTAAA" },
  "unit-tanja-3": { card: "/media/units/unit-tanja-3/card.webp", thumb: "/media/units/unit-tanja-3/thumb.webp", lqip: "data:image/webp;base64,UklGRogAAABXRUJQVlA4IHwAAABwBACdASoQABQAPrVInkmnJCKhMAgA4BaJYgCdMoR3ACnId9w6tbQgQCF1QAD+9DM9B7Y6F0pHG51jWD9zQ2KGUIDGC9PP2mOP83BTBEA0Fd4Z529ysQaV3xdcTi4B9wOFr5dF5Cez0TAs8i7nOuMA7O+IOWKD1Y9HGAAA" },
  "unit-tanja-4": { card: "/media/units/unit-tanja-4/card.webp", thumb: "/media/units/unit-tanja-4/thumb.webp", lqip: "data:image/webp;base64,UklGRmYAAABXRUJQVlA4IFoAAADQAwCdASoQABQAPrVInkmnJCKhMAgA4BaJZQC7ACHvvDhq8FQEcjAA/qZ/7AZS6sQGpDnAuafEXQY3wZGcyA1M4IqrsWHcnny0aKaM4l3ihZV7GMSgj91AMAA=" },
  "unit-agdal-1": { card: "/media/units/unit-agdal-1/card.webp", thumb: "/media/units/unit-agdal-1/thumb.webp", lqip: "data:image/webp;base64,UklGRlYAAABXRUJQVlA4IEoAAAAQBACdASoQABQAPrVInkmnJCKhMAgA4BaJYwCdACP/4nab6PJW0DcWAAD+8YyKytKz+0Qj7+YSL2QeCw8+GAXOnEExKpPihgAAAA==" },
  "unit-agdal-2": { card: "/media/units/unit-agdal-2/card.webp", thumb: "/media/units/unit-agdal-2/thumb.webp", lqip: "data:image/webp;base64,UklGRlwAAABXRUJQVlA4IFAAAAAwBACdASoQABQAPrVInkmnJCKhMAgA4BaJZQC06CIj6qO0BQR1O0G1B+wA/sKJSPlbn946k7b7nK/D0/q2fuT/k5a8LxRr+ID4jH33VaAAAA==" },
  "unit-agdal-3": { card: "/media/units/unit-agdal-3/card.webp", thumb: "/media/units/unit-agdal-3/thumb.webp", lqip: "data:image/webp;base64,UklGRlgAAABXRUJQVlA4IEwAAADwAwCdASoQABQAPrVInkmnJCKhMAgA4BaJYwCw7CP/3UPc93KvMO9wAP71tyHvvbte7hCoMBAOxT017jWLMzrYpVLWF/o4AzYLaAAA" },
  "unit-mimouna-1": { card: "/media/units/unit-mimouna-1/card.webp", thumb: "/media/units/unit-mimouna-1/thumb.webp", lqip: "data:image/webp;base64,UklGRmQAAABXRUJQVlA4IFgAAACwAwCdASoQABQAPrVInkmnJCKhMAgA4BaJZQC7ACHS1fno3+posAD+hAGu8K5S340VzdnvniIQkxiEeJh6c4tK0gLEVL/5bqFsg+rIojtjfjnzF8pZTAAA" },
  "unit-mimouna-2": { card: "/media/units/unit-mimouna-2/card.webp", thumb: "/media/units/unit-mimouna-2/thumb.webp", lqip: "data:image/webp;base64,UklGRloAAABXRUJQVlA4IE4AAACwAwCdASoQABQAPrVKoEonJCMhsAgA4BaJZwAAW+j9seAXOtopgAD+9e2XbTaJ2Kx/vN8yTnUIHoTsw2eCYlU0c2T1uMOVUaoi8qNLMAA=" },
  "unit-mimouna-3": { card: "/media/units/unit-mimouna-3/card.webp", thumb: "/media/units/unit-mimouna-3/thumb.webp", lqip: "data:image/webp;base64,UklGRmAAAABXRUJQVlA4IFQAAADQAwCdASoQABQAPrVInkmnJCKhMAgA4BaJZwAAOTMbjJ/+ULm0sAAA/vfGTPIqTOhD/sHx9IiLX7e+moh66vR23VtlU8HmPHdqYZZ1qZ5ODJtIDgA=" },
  "unit-gueliz-1": { card: "/media/units/unit-gueliz-1/card.webp", thumb: "/media/units/unit-gueliz-1/thumb.webp", lqip: "data:image/webp;base64,UklGRmQAAABXRUJQVlA4IFgAAACwAwCdASoQABQAPrVInkmnJCKhMAgA4BaJZQC7ACHS1fno3+posAD+hAGu8K5S340VzdnvniIQkxiEeJh6c4tK0gLEVL/5bqFsg+rIojtjfjnzF8pZTAAA" },
  "unit-hassan-1": { card: "/media/units/unit-hassan-1/card.webp", thumb: "/media/units/unit-hassan-1/thumb.webp", lqip: "data:image/webp;base64,UklGRogAAABXRUJQVlA4IHwAAAAwBACdASoQABQAPrVInkmnJCKhMAgA4BaJQBOmUGSxiDjvR9l0I3e5xAAA/tD7od9Oeprcg5mb4ddB7j+kk7oULnUyYmZbNYm56xPbuUMkThSmY5Usp3oQFf0peHMAM62MR/zumVKdP9hoH0vu9+IzAGkmZYXTwuysAAAA" },
  "unit-hassan-2": { card: "/media/units/unit-hassan-2/card.webp", thumb: "/media/units/unit-hassan-2/thumb.webp", lqip: "data:image/webp;base64,UklGRmQAAABXRUJQVlA4IFgAAACwAwCdASoQABQAPrVInkmnJCKhMAgA4BaJZQC7ACHS1fno3+posAD+hAGu8K5S340VzdnvniIQkxiEeJh6c4tK0gLEVL/5bqFsg+rIojtjfjnzF8pZTAAA" },
  "unit-casa-port-1": { card: "/media/units/unit-casa-port-1/card.webp", thumb: "/media/units/unit-casa-port-1/thumb.webp", lqip: "data:image/webp;base64,UklGRnIAAABXRUJQVlA4IGYAAAAQBACdASoQABQAPrVInkmnJCKhMAgA4BaJZQC1CFzDAl7TOc6Zi8fYAAD+8WmVpYz7p3vlncK7LR6Zw4DH2LAyQ8RbP3fjYugIT3ygDZJAiBbX8zcoMOEeI3O/nQh100d4JJYAAAA=" },
  "unit-casa-port-2": { card: "/media/units/unit-casa-port-2/card.webp", thumb: "/media/units/unit-casa-port-2/thumb.webp", lqip: "data:image/webp;base64,UklGRloAAABXRUJQVlA4IE4AAACwAwCdASoQABQAPrVKoEonJCMhsAgA4BaJZwAAW+j9seAXOtopgAD+9e2XbTaJ2Kx/vN8yTnUIHoTsw2eCYlU0c2T1uMOVUaoi8qNLMAA=" },
  "unit-casa-port-3": { card: "/media/units/unit-casa-port-3/card.webp", thumb: "/media/units/unit-casa-port-3/thumb.webp", lqip: "data:image/webp;base64,UklGRmQAAABXRUJQVlA4IFgAAACwAwCdASoQABQAPrVInkmnJCKhMAgA4BaJZQC7ACHS1fno3+posAD+hAGu8K5S340VzdnvniIQkxiEeJh6c4tK0gLEVL/5bqFsg+rIojtjfjnzF8pZTAAA" },
  "unit-maarif-1": { card: "/media/units/unit-maarif-1/card.webp", thumb: "/media/units/unit-maarif-1/thumb.webp", lqip: "data:image/webp;base64,UklGRlYAAABXRUJQVlA4IEoAAAAQBACdASoQABQAPrVInkmnJCKhMAgA4BaJYwCdACP/4nab6PJW0DcWAAD+8YyKytKz+0Qj7+YSL2QeCw8+GAXOnEExKpPihgAAAA==" },
  "unit-maarif-2": { card: "/media/units/unit-maarif-2/card.webp", thumb: "/media/units/unit-maarif-2/thumb.webp", lqip: "data:image/webp;base64,UklGRmQAAABXRUJQVlA4IFgAAACwAwCdASoQABQAPrVInkmnJCKhMAgA4BaJZQC7ACHS1fno3+posAD+hAGu8K5S340VzdnvniIQkxiEeJh6c4tK0gLEVL/5bqFsg+rIojtjfjnzF8pZTAAA" },
  "unit-taghazout-1": { card: "/media/units/unit-taghazout-1/card.webp", thumb: "/media/units/unit-taghazout-1/thumb.webp", lqip: "data:image/webp;base64,UklGRnIAAABXRUJQVlA4IGYAAAAQBACdASoQABQAPrVInkmnJCKhMAgA4BaJZQC1CFzDAl7TOc6Zi8fYAAD+8WmVpYz7p3vlncK7LR6Zw4DH2LAyQ8RbP3fjYugIT3ygDZJAiBbX8zcoMOEeI3O/nQh100d4JJYAAAA=" },
  "unit-taghazout-2": { card: "/media/units/unit-taghazout-2/card.webp", thumb: "/media/units/unit-taghazout-2/thumb.webp", lqip: "data:image/webp;base64,UklGRn4AAABXRUJQVlA4IHIAAAAwBACdASoQABQAPrVInkmnJCKhMAgA4BaJYwC/OBuoOtcqfDjFglofHwAA/u0Mf7fKvbfFDn+ISkqiz7O0xnZL2ZPipGFd5J5kjwbpXID0V7aN0+OWA7iJQom82kGmBKlqQbqPlM3rFTuEP26ewe3oAAA=" },
  "unit-agadir-marina-1": { card: "/media/units/unit-agadir-marina-1/card.webp", thumb: "/media/units/unit-agadir-marina-1/thumb.webp", lqip: "data:image/webp;base64,UklGRnwAAABXRUJQVlA4IHAAAABQBACdASoQABQAPrVKnkonJCKhsAgA4BaJZACdACPtxViwVZ6TrzoNEGoAAP7y1gf5H0sdkA7zc3BhSC9Eb/EpXK/cDBsAW5UcWba3rmrFeLSfVnlUwyJNdEZWVhEMxe7Aa5okII8EWRaepuI2AAAA" },
  "unit-mogador-1": { card: "/media/units/unit-mogador-1/card.webp", thumb: "/media/units/unit-mogador-1/thumb.webp", lqip: "data:image/webp;base64,UklGRmQAAABXRUJQVlA4IFgAAACwAwCdASoQABQAPrVInkmnJCKhMAgA4BaJZQC7ACHS1fno3+posAD+hAGu8K5S340VzdnvniIQkxiEeJh6c4tK0gLEVL/5bqFsg+rIojtjfjnzF8pZTAAA" },
};

export const illustrations: Record<IllustrationName, string | null> = {
  "empty-today": "/media/illustrations/empty-today.svg",
  "empty-bookings": "/media/illustrations/empty-bookings.svg",
  "empty-calendar": "/media/illustrations/empty-calendar.svg",
  "empty-leases": "/media/illustrations/empty-leases.svg",
  "empty-rent": "/media/illustrations/empty-rent.svg",
  "empty-maintenance": "/media/illustrations/empty-maintenance.svg",
  "empty-expenses": "/media/illustrations/empty-expenses.svg",
  "empty-owners": "/media/illustrations/empty-owners.svg",
  "empty-channels": "/media/illustrations/empty-channels.svg",
  "empty-properties": "/media/illustrations/empty-properties.svg",
  "empty-commission": "/media/illustrations/empty-commission.svg",
  "empty-billing": "/media/illustrations/empty-billing.svg",
  "kpi-arrivals": "/media/illustrations/kpi-arrivals.svg",
  "kpi-departures": "/media/illustrations/kpi-departures.svg",
  "kpi-housekeeping": "/media/illustrations/kpi-housekeeping.svg",
  "kpi-repairs": "/media/illustrations/kpi-repairs.svg",
  "kpi-rent": "/media/illustrations/kpi-rent.svg",
  "channels-sync-hero": "/media/illustrations/channels-sync-hero.svg",
  "invite-envelope": "/media/illustrations/invite-envelope.svg",
  "chip-broom": "/media/illustrations/chip-broom.svg",
  "chip-coin": "/media/illustrations/chip-coin.svg",
  "chip-wrench": "/media/illustrations/chip-wrench.svg",
};
