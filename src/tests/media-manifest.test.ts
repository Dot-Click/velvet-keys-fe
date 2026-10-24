import { describe, expect, it } from "vitest";
import { ILLUSTRATION_NAMES, illustrations, propertyImages, unitImages } from "@/assets/manifest";
import { initialsOf, isUploadedImage } from "@/lib/media";
import { MOCK_PROPERTIES, MOCK_UNITS } from "@/mocks/properties";

describe("media manifest", () => {
  it("has one entry per mock property and unit", () => {
    expect(Object.keys(propertyImages).sort()).toEqual(MOCK_PROPERTIES.map((p) => p.id).sort());
    expect(Object.keys(unitImages).sort()).toEqual(MOCK_UNITS.map((u) => u.id).sort());
  });

  it("has one entry per illustration name", () => {
    expect(Object.keys(illustrations).sort()).toEqual([...ILLUSTRATION_NAMES].sort());
  });
});

describe("media helpers", () => {
  it("builds initials from the meaningful words of a name", () => {
    expect(initialsOf("The Aurora")).toBe("A");
    expect(initialsOf("Riad Oudaya")).toBe("RO");
    expect(initialsOf("Résidence d'Anfa")).toBe("RA");
    expect(initialsOf("Penthouse 4A")).toBe("P4A");
    expect(initialsOf("")).toBe("");
  });

  it("treats only data and blob URLs as uploads", () => {
    expect(isUploadedImage("data:image/webp;base64,AAAA")).toBe(true);
    expect(isUploadedImage("blob:http://localhost/123")).toBe(true);
    expect(isUploadedImage("/images/villa.jpg")).toBe(false);
    expect(isUploadedImage("")).toBe(false);
    expect(isUploadedImage(undefined)).toBe(false);
  });
});
