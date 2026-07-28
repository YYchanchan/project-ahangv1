import africanLion from "../assets/species-placeholders/african-lion.svg";
import asianElephant from "../assets/species-placeholders/asian-elephant.svg";
import hippopotamus from "../assets/species-placeholders/hippopotamus.svg";
import macaque from "../assets/species-placeholders/macaque.svg";
import asianBlackBear from "../assets/species-placeholders/asian-black-bear.svg";
import giraffe from "../assets/species-placeholders/giraffe.svg";
import giantPanda from "../assets/species-placeholders/giant-panda.svg";
import southChinaTiger from "../assets/species-placeholders/south-china-tiger.svg";
import whiteRhinoceros from "../assets/species-placeholders/white-rhinoceros.svg";
import redPanda from "../assets/species-placeholders/red-panda.svg";

export const SPECIES_DEFAULT_IMAGES: Record<string, string> = {
  "African Lion": africanLion,
  "Asian Elephant": asianElephant,
  "Hippopotamus": redPanda,
  "Red Panda": redPanda,
  "Japanese Macaque": macaque,
  "Giant Panda": giantPanda,
  "South China Tiger": southChinaTiger,
  "Asian Black Bear": asianBlackBear,
  "Giraffe": giraffe,
  "White Rhinoceros": whiteRhinoceros,
  "Pallas's Cat": redPanda,
};

// Map of species codes (lowercase kebab-case) to standard species English name
export const SPECIES_CODE_TO_NAME: Record<string, string> = {
  "african-lion": "African Lion",
  "asian-elephant": "Asian Elephant",
  "hippopotamus": "Red Panda",
  "red-panda": "Red Panda",
  "japanese-macaque": "Japanese Macaque",
  "rhesus-macaque": "Japanese Macaque",
  "giant-panda": "Giant Panda",
  "south-china-tiger": "South China Tiger",
  "asiatic-black-bear": "Asian Black Bear",
  "giraffe": "Giraffe",
  "white-rhinoceros": "White Rhinoceros",
  "pallas-cat": "Pallas's Cat",
};

// Map of Chinese names to standard English species key
export const CHINESE_SPECIES_TO_NAME: Record<string, string> = {
  "非洲狮": "African Lion",
  "狮": "African Lion",
  "狮子": "African Lion",
  "亚洲象": "Asian Elephant",
  "大象": "Asian Elephant",
  "河马": "Red Panda",
  "小熊猫": "Red Panda",
  "日本猕猴": "Japanese Macaque",
  "猕猴": "Japanese Macaque",
  "大熊猫": "Giant Panda",
  "熊猫": "Giant Panda",
  "华南虎": "South China Tiger",
  "老虎": "South China Tiger",
  "亚洲黑熊": "Asian Black Bear",
  "黑熊": "Asian Black Bear",
  "长颈鹿": "Giraffe",
  "白犀牛": "White Rhinoceros",
  "兔狲": "Pallas's Cat",
};

/**
 * Resolves standard English species name from any species input.
 */
export function resolveStandardSpeciesName(speciesInput: string | undefined | null): string {
  if (!speciesInput) return "Unknown";
  const trimmed = speciesInput.trim();
  
  // Try Chinese map
  if (CHINESE_SPECIES_TO_NAME[trimmed]) {
    return CHINESE_SPECIES_TO_NAME[trimmed];
  }
  
  // Try lowercase code map
  const normalizedCode = trimmed.toLowerCase().replace(/\s+/g, "-");
  if (SPECIES_CODE_TO_NAME[normalizedCode]) {
    return SPECIES_CODE_TO_NAME[normalizedCode];
  }

  // Check direct matches in SPECIES_DEFAULT_IMAGES keys
  for (const key of Object.keys(SPECIES_DEFAULT_IMAGES)) {
    if (key.toLowerCase() === trimmed.toLowerCase()) {
      return key;
    }
  }

  return trimmed;
}

/**
 * Retrieves the default image for a given species name, code, or Chinese translation.
 */
export function getSpeciesDefaultImage(speciesInput: string | undefined | null): string {
  const stdName = resolveStandardSpeciesName(speciesInput);
  return SPECIES_DEFAULT_IMAGES[stdName] || whiteRhinoceros; // fallback to whiteRhinoceros SVG
}
