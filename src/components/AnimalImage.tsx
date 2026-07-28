import React from "react";
import { 
  getSpeciesDefaultImage, 
  resolveStandardSpeciesName, 
  SPECIES_DEFAULT_IMAGES 
} from "../data/speciesImages";

interface AnimalImageProps {
  species: string;
  image?: string | null;
  imageType?: string;
  className?: string;
  alt?: string;
  id?: string;
}

// Map of species to their corresponding standard emoji icon
const SPECIES_EMOJI_MAP: Record<string, string> = {
  "African Lion": "🦁",
  "Asian Elephant": "🐘",
  "Hippopotamus": "🦊",
  "Red Panda": "🦊",
  "Japanese Macaque": "🐒",
  "Giant Panda": "🐼",
  "South China Tiger": "🐯",
  "Asian Black Bear": "🐻",
  "Giraffe": "🦒",
  "White Rhinoceros": "🦏",
  "Golden Snub-nosed Monkey": "🐵",
  "Pallas's Cat": "🐱",
};

export function getSpeciesEmoji(species: string): string {
  const stdName = resolveStandardSpeciesName(species);
  return SPECIES_EMOJI_MAP[stdName] || "🐾";
}

export const AnimalImage: React.FC<AnimalImageProps> = ({
  species,
  image,
  imageType,
  className = "w-full h-full object-cover",
  alt = "动物图片",
  id,
}) => {
  const emoji = getSpeciesEmoji(species);
  const defaultImage = getSpeciesDefaultImage(species);

  // Checks if the image is a manually uploaded local image, blob, or imported asset
  const isLocalOrUploaded = (imgUrl: string | undefined | null): boolean => {
    if (!imgUrl) return false;
    const trimmed = imgUrl.trim();
    // Exclude any external URLs
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      return false;
    }
    return true;
  };

  let finalSrc: string | null = null;

  if (isLocalOrUploaded(image)) {
    // If there is an individual local photo manually uploaded/bound, show it
    finalSrc = image || null;
  } else {
    // Otherwise show the species-specific local SVG
    finalSrc = defaultImage || null;
  }

  // If there's no matching SVG or if we have no image source, we show the beautiful premium placeholder.
  
  if (finalSrc) {
    return (
      <img
  src={finalSrc}
  alt={alt}
  className={`block w-full h-full object-cover ${className}`}
  id={id}
  onError={(event) => {
    console.error("动物图片加载失败：", finalSrc);
    event.currentTarget.style.display = "none";
  }}
/>
    );
  }

  // Beautiful brand-consistent premium placeholder ("图片待补充" / "Image pending")
  return (
    <div
      className={`flex flex-col items-center justify-center bg-[#F4F1EA] border border-stone-200/50 p-4 text-center select-none ${className}`}
      id={id}
    >
      <div className="w-12 h-12 bg-[#FAF8F5] border border-[#D9C3B0]/30 rounded-full flex items-center justify-center text-2xl shadow-sm mb-2 transform hover:scale-110 transition-transform duration-300">
        {emoji}
      </div>
      <div className="space-y-0.5">
        <span className="block text-xs font-bold text-stone-700 tracking-wider">
          {species || "未确认物种"}
        </span>
        <span className="block text-[10px] text-[#B83B26] font-medium tracking-wide">
          图片待补充
        </span>
      </div>
    </div>
  );
};


