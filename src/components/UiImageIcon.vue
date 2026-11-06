<script setup lang="ts">
import { computed } from "vue";
import archiveIcon from "../assets/ui/archive.png";
import backIcon from "../assets/ui/back.png";
import favoriteIcon from "../assets/ui/favorite.png";
import homeIcon from "../assets/ui/home.png";
import memorialIcon from "../assets/ui/memorial.png";
import profileIcon from "../assets/ui/profile.png";
import shareIcon from "../assets/ui/share.png";

type UiImageIconName =
  | "home"
  | "archive"
  | "memorial"
  | "profile"
  | "back"
  | "favorite"
  | "share";

const props = withDefaults(
  defineProps<{
    name: UiImageIconName;
    size?: number;
    tone?: "muted" | "dark" | "active" | "light";
  }>(),
  {
    size: 20,
    tone: "dark",
  },
);

const iconRatios: Record<UiImageIconName, number> = {
  home: 3213 / 3409,
  archive: 2417 / 2234,
  memorial: 3201 / 2596,
  profile: 2838 / 3174,
  back: 2981 / 2984,
  favorite: 3434 / 3267,
  share: 1,
};

const iconSources: Record<UiImageIconName, string> = {
  home: homeIcon,
  archive: archiveIcon,
  memorial: memorialIcon,
  profile: profileIcon,
  back: backIcon,
  favorite: favoriteIcon,
  share: shareIcon,
};

const iconSrc = computed(() => iconSources[props.name]);

const iconStyle = computed(() => ({
  width: `${props.size * iconRatios[props.name]}px`,
  height: `${props.size}px`,
}));
</script>

<template>
  <image
    class="ui-image-icon"
    :class="`ui-image-icon--${tone}`"
    :src="iconSrc"
    :style="iconStyle"
    mode="scaleToFill"
  />
</template>

<style scoped>
.ui-image-icon {
  display: block;
  flex: 0 0 auto;
}

.ui-image-icon--muted {
  opacity: 0.72;
}

.ui-image-icon--dark {
  filter: brightness(0.58);
}

.ui-image-icon--active {
  filter: brightness(0) saturate(100%) invert(28%) sepia(18%) saturate(1120%) hue-rotate(78deg) brightness(91%);
}

.ui-image-icon--light {
  filter: brightness(0) invert(1);
}
</style>
