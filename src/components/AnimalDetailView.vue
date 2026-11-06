<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { Animal, MemorialCommentRecord, PublicMemoryRecord, Species } from "../types";
import AhangIcon from "./AhangIcon.vue";
import AnimalImage from "./AnimalImage.vue";
import StatusBadge from "./StatusBadge.vue";
import UiImageIcon from "./UiImageIcon.vue";

const props = defineProps<{
  animal: Animal;
  animals: Animal[];
  species?: Species;
  memories: PublicMemoryRecord[];
  comments: MemorialCommentRecord[];
  favorited: boolean;
  loggedIn: boolean;
  candled?: boolean;
  candleCount?: number;
}>();

const emit = defineEmits<{
  back: [];
  share: [animalId: string];
  correction: [animalId: string];
  observe: [animalId: string];
  openAnimal: [animalId: string];
  notify: [message: string];
  likeMemory: [memoryId: string];
  toggleFavorite: [animalId: string];
  lightCandle: [animalId: string];
  addComment: [animalId: string, text: string];
  flowerComment: [commentId: string, flowered: boolean];
  likeObservation: [animalId: string, observationId: string, liked: boolean];
  loginRequired: [];
}>();

const observationFilter = ref<"all" | "resting" | "feeding" | "playing" | "moving">("all");
const newCommentText = ref("");

watch(
  () => props.animal.id,
  () => {
    observationFilter.value = "all";
    newCommentText.value = "";
  },
);

const filteredObservations = computed(() =>
  props.animal.observations.filter(
    (item) => observationFilter.value === "all" || item.category === observationFilter.value,
  ),
);

const animalMemories = computed(() =>
  props.memories.filter((memory) => memory.animalIds.includes(props.animal.id)),
);

const animalComments = computed(() =>
  props.comments.filter((comment) => comment.animalId === props.animal.id),
);

const relatedAnimal = computed(() => {
  const relation = props.animal.relationships?.[0];
  const relatedId = relation?.animalId || props.animal.relationship?.partnerId;
  return relatedId ? props.animals.find((item) => item.id === relatedId) : undefined;
});

const relationshipLabel = computed(() => {
  return props.animal.relationships?.[0]?.label || props.animal.relationship?.relationType || "生命伙伴";
});

const relationshipDescription = computed(() => {
  return (
    props.animal.relationships?.[0]?.description ||
    props.animal.relationship?.description ||
    "共同构成它生命历程中的重要关系。"
  );
});

function requireLogin(): boolean {
  if (props.loggedIn) return true;
  emit("loginRequired");
  return false;
}

function protectedEmit(event: "back"): void;
function protectedEmit(event: "correction" | "observe" | "openAnimal" | "likeMemory" | "lightCandle" | "toggleFavorite", value: string): void;
function protectedEmit(event: "notify", value: string): void;
function protectedEmit(event: "flowerComment", value: string, state: boolean): void;
function protectedEmit(event: "likeObservation", animalId: string, observationId: string, state: boolean): void;
function protectedEmit(event: "back" | "correction" | "observe" | "openAnimal" | "likeMemory" | "lightCandle" | "toggleFavorite" | "notify" | "flowerComment" | "likeObservation", ...args: any[]) {
  if (!requireLogin()) return;
  (emit as (...values: any[]) => void)(event, ...args);
}

const basicArchive = computed(() => [
  { label: "名字", value: props.animal.name, source: "官方来源" },
  {
    label: "昵称",
    value: props.animal.nickname || "暂无公开昵称",
    source: "档案记录",
  },
  {
    label: "物种",
    value: `${props.animal.species}${props.animal.commonName ? `（${props.animal.commonName}）` : ""}`,
    source: "官方来源",
  },
  { label: "性别", value: props.animal.gender, source: "官方来源" },
  {
    label: "出生",
    value: props.animal.birthDate || props.animal.birthYear || props.animal.lifeSpan,
    source: "官方来源",
  },
  {
    label: "所在城市",
    value: props.animal.city,
    source: "官方来源",
  },
  { label: "所在机构", value: props.animal.institution, source: "官方来源" },
  {
    label: "状态",
    value: `${props.animal.statusLabel} · ${props.animal.lifeSpan}`,
    source: "官方来源",
  },
]);

const storySections = computed(() => [{ title: "生命故事", text: props.animal.description }]);

const observationFilters = [
  { id: "all", label: "全部" },
  { id: "resting", label: "休息" },
  { id: "feeding", label: "进食" },
  { id: "playing", label: "嬉戏" },
  { id: "moving", label: "散步" },
] as const;

const speciesBasicInfo = computed(() => {
  if (!props.species) return [];
  const info = props.species.basicInfo;
  return [
    { icon: "🏡", label: "平均寿命（动物园）", value: info.captiveLifespan },
    { icon: "⚖️", label: "成年体重", value: info.weight },
    { icon: "📏", label: "体型特征", value: info.sizeHeight },
    { icon: "🥩", label: "食性", value: info.diet },
    { icon: "👥", label: "社会结构", value: info.socialStructure },
    { icon: "🌙", label: "活动时间", value: info.activityTime },
    { icon: "🐾", label: "繁殖方式", value: info.reproduction },
    { icon: "🗺️", label: "分布区域", value: info.distribution },
    { icon: "🌿", label: "栖息环境", value: info.habitat },
    { icon: "🛡️", label: "IUCN 保护等级", value: info.iucnStatus },
    { icon: "📜", label: "CITES 等级", value: info.citesStatus },
  ].filter((item) => item.value);
});

const taxonomyCards = computed(() => {
  if (!props.species) return [];
  const profile = props.species.biologicalProfile;
  return [
    { label: "界 Kingdom", value: profile.kingdom },
    { label: "门 Phylum", value: profile.phylum },
    { label: "纲 Class", value: profile.className },
    { label: "目 Order", value: profile.order },
    { label: "科 Family", value: profile.family },
    { label: "属 Genus", value: profile.genus },
    { label: "种 Species", value: profile.species, highlighted: true },
  ];
});

const taxonomyTree = computed(() => {
  if (!props.species) return [];
  const profile = props.species.biologicalProfile;
  return [
    { symbol: "★", label: "个体", name: props.animal.name, description: `${props.animal.institution}记录档案`, primary: "red" },
    { symbol: "v", label: "物种", name: profile.chineseName, description: profile.latinName, primary: "green" },
    { symbol: "2", label: "属 Genus", name: profile.genus.split(" ")[0], description: "亲缘属级分类" },
    { symbol: "3", label: "科 Family", name: profile.family.split(" ")[0], description: "特化科级门类" },
    { symbol: "4", label: "目 Order", name: profile.order.split(" ")[0], description: "动物分类目级" },
    { symbol: "5", label: "纲 Class", name: profile.className.split(" ")[0], description: "恒温胎生哺乳" },
    { symbol: "6", label: "门 Phylum", name: profile.phylum.split(" ")[0], description: "背侧脊索大类" },
    { symbol: "7", label: "界 Kingdom", name: profile.kingdom.split(" ")[0], description: "多细胞真核生物" },
  ];
});

function toggleFollow() {
  protectedEmit("toggleFavorite", props.animal.id);
}

function shareAnimal() {
  if (!requireLogin()) return;
  emit("share", props.animal.id);
}

function lightCandle() {
  protectedEmit("lightCandle", props.animal.id);
}

function addComment() {
  if (!requireLogin()) return;
  const text = newCommentText.value.trim();
  if (!text) {
    emit("notify", "请先写下一句纪念寄语");
    return;
  }
  emit("addComment", props.animal.id, text);
  newCommentText.value = "";
}

function offerFlower(commentId: string) {
  if (!requireLogin()) return;
  const comment = props.comments.find((item) => item.id === commentId);
  if (comment) emit("flowerComment", commentId, !comment.hasFlowered);
}

function memoryAnimalNames(memory: PublicMemoryRecord): string {
  return memory.animalIds
    .map((id) => props.animals.find((item) => item.id === id)?.name)
    .filter(Boolean)
    .join(" × ");
}
</script>

<template>
  <view class="detail-page">
    <view class="hero">
      <AnimalImage
        class="hero__image"
        :species="animal.species"
        :src="animal.image || animal.coverUrl"
        :alt="animal.name"
      />
      <view class="hero__actions">
        <button aria-label="返回" @click="protectedEmit('back')"><UiImageIcon name="back" :size="20" tone="dark" /></button>
        <view>
          <button aria-label="收藏" :class="{ active: favorited }" @click="toggleFollow"><UiImageIcon name="favorite" :size="19" :tone="favorited ? 'active' : 'dark'" /></button>
          <button v-if="loggedIn" aria-label="分享当前档案" open-type="share" @click="shareAnimal"><UiImageIcon name="share" :size="18" tone="dark" /></button>
          <button v-else aria-label="登录后分享当前档案" @click="shareAnimal"><UiImageIcon name="share" :size="18" tone="dark" /></button>
          <button aria-label="纠错" @click="protectedEmit('correction', animal.id)"><AhangIcon name="edit" :size="18" /></button>
        </view>
      </view>
      <view class="hero__identity">
        <view class="hero__name-row">
          <text>{{ animal.name }}</text>
          <StatusBadge :status="animal.status" :label="animal.statusLabel" />
        </view>
        <text>{{ animal.species }} · {{ animal.gender }} · {{ animal.lifeSpan }}</text>
      </view>
    </view>

    <view v-if="animal.isTestData" class="test-notice">
      <text>测试档案</text>
      <text>本档案用于产品功能演示，内容不代表真实动物资料。</text>
    </view>

    <view class="summary-card">
      <text>一句话认识它</text>
      <text>“{{ animal.summary || animal.description }}”</text>
    </view>

    <view class="tag-row">
      <text v-for="tag in animal.tags" :key="tag">#{{ tag }}</text>
    </view>

    <view class="detail-section">
      <view class="section-title"><text>📁</text><text>基础档案</text><text>ID: #{{ animal.id }}</text></view>
      <view class="archive-grid">
        <view v-for="item in basicArchive" :key="item.label" class="archive-item">
          <text>{{ item.label }}</text>
          <text>{{ item.value }}</text>
          <text>{{ item.source }}</text>
        </view>
      </view>
    </view>

    <view class="detail-section">
      <view class="section-title"><text>⏳</text><text>生命时间线</text></view>
      <view class="timeline">
        <view v-for="event in animal.timeline" :key="`${event.year}-${event.title}`" class="timeline-item">
          <view class="timeline-item__year">{{ event.year }}</view>
          <view><text>{{ event.title }}</text><text>{{ event.description }}</text></view>
        </view>
      </view>
    </view>

    <view class="detail-section">
      <view class="section-title"><text>📖</text><text>它的故事</text></view>
      <view class="story-copy">
        <text v-for="section in storySections" :key="section.title">
          【{{ section.title }}】 {{ section.text }}
        </text>
      </view>
    </view>

    <view class="detail-section">
      <view class="section-title section-title--split">
        <view><text>👁️</text><text>日常观察记录</text></view>
        <text>{{ animal.observations.length }} 条公众目击</text>
      </view>
      <scroll-view class="filter-bar" scroll-x :show-scrollbar="false">
        <view class="filter-bar__inner">
          <button
            v-for="filter in observationFilters"
            :key="filter.id"
            :class="{ active: observationFilter === filter.id }"
            @click="requireLogin() && (observationFilter = filter.id)"
          >
            {{ filter.label }}
          </button>
        </view>
      </scroll-view>
      <view v-if="filteredObservations.length" class="observation-list">
        <view v-for="observation in filteredObservations" :key="observation.id" class="observation-card">
          <view class="observation-card__author">
            <view>{{ observation.username.charAt(0) }}</view>
            <view>
              <text>{{ observation.username }}</text>
              <text>{{ observation.date }} · {{ observation.location }}</text>
            </view>
            <text>{{ observation.category === "resting" ? "🦁 休息" : observation.category === "feeding" ? "🥩 进食" : observation.category === "playing" ? "🐾 嬉戏" : "🐾 散步" }}</text>
          </view>
          <text class="observation-card__copy">{{ observation.text }}</text>
          <image v-if="observation.image" class="observation-card__image" :src="observation.image" mode="aspectFill" />
          <view class="observation-card__actions">
            <button @click="protectedEmit('likeObservation', animal.id, observation.id, !observation.hasLiked)"><AhangIcon name="like" :size="15" /> {{ observation.likes }}</button>
            <button @click="protectedEmit('notify', '评论模块已唤醒，请在下个迭代继续体验')"><AhangIcon name="comment" :size="15" /> {{ observation.commentsCount }}</button>
          </view>
        </view>
      </view>
      <view v-else class="empty-copy">
        <text>暂无日常观察记录</text>
        <text>欢迎各位观察员上传此动物的相关日常习性观察日志。</text>
      </view>
      <button class="primary-button primary-button--green" @click="protectedEmit('observe', animal.id)">上传一次观察</button>
    </view>

    <view class="detail-section memory-section">
      <view class="memory-heading">
        <text>🕯️</text>
        <view><text>公众回忆 (Public Memories)</text><text>COMMUNITY REMEMBRANCE</text></view>
      </view>
      <view v-if="animalMemories.length" class="memory-list">
        <view v-for="memory in animalMemories" :key="memory.id" class="memory-item">
          <view class="memory-item__top">
            <view><text>{{ memory.title }}</text><text v-if="memory.animalIds.length > 1">{{ memoryAnimalNames(memory) }}</text></view>
            <text>{{ memory.categoryLabel }}</text>
          </view>
          <text class="memory-item__copy">{{ memory.text }}</text>
          <image v-if="memory.image" class="memory-item__image" :src="memory.image" mode="aspectFill" />
          <button :class="{ active: memory.hasLiked }" @click="protectedEmit('likeMemory', memory.id)"><AhangIcon name="heart" :size="15" /> {{ memory.likes }}</button>
        </view>
      </view>
      <view v-else class="empty-copy">
        <text>暂无关于该动物的公众回忆</text>
        <text>欢迎您提供历史资料或在下方留下感言。</text>
      </view>
    </view>

    <view class="detail-section memorial-section">
      <view class="section-title"><text>🕯️</text><text>纪念它</text></view>
      <text class="memorial-intro">每一句留言、每一朵花和每一盏烛光，都让它继续被记得。</text>
      <view class="candle-card">
        <text>🕯️</text>
        <text>已点亮 {{ candleCount || 0 }} 盏纪念烛光</text>
        <button :class="{ active: candled }" @click="lightCandle">{{ candled ? "已点亮" : "点亮一盏蜡烛" }}</button>
      </view>
      <view class="comment-composer">
        <input v-model="newCommentText" :placeholder="`写下一句想对${animal.name}说的话……`" />
        <button @click="addComment">提交寄语</button>
      </view>
      <view v-if="animalComments.length" class="comment-list">
        <view v-for="comment in animalComments" :key="comment.id" class="comment-item">
          <view><text>{{ comment.username }}</text><text>{{ comment.timestamp }}</text></view>
          <text>{{ comment.text }}</text>
          <button :class="{ active: comment.hasFlowered }" @click="offerFlower(comment.id)">
            🌻 {{ comment.hasFlowered ? "已献花" : "献花" }} · {{ comment.flowers }}
          </button>
        </view>
      </view>
      <view v-else class="empty-copy"><text>还没有寄语</text><text>写下第一句想对它说的话吧。</text></view>
    </view>

    <view v-if="relatedAnimal" class="detail-section relationship-section">
      <view class="section-title"><text>🌿</text><text>生命关系</text><text>Life Relationship</text></view>
      <view class="relationship-current">
        <AnimalImage :species="animal.species" :src="animal.image || animal.coverUrl" :alt="animal.name" />
        <view><text>当前</text><text>{{ animal.name }}</text><text>{{ animal.commonName || animal.species }}</text></view>
      </view>
      <view class="relationship-label"><text>{{ relationshipLabel }}</text><text>🌿 {{ relationshipDescription }}</text></view>
      <button class="relationship-target" @click="protectedEmit('openAnimal', relatedAnimal.id)">
        <AnimalImage :species="relatedAnimal.species" :src="relatedAnimal.image || relatedAnimal.coverUrl" :alt="relatedAnimal.name" />
        <view><text>{{ relatedAnimal.name }}</text><text>{{ relatedAnimal.commonName || relatedAnimal.species }}</text></view>
        <text>查看档案 ›</text>
      </button>
    </view>

    <view v-if="species" class="detail-section species-section">
      <view class="species-heading">
        <text>🔬</text>
        <view><text>认识它的物种</text><text>通过 {{ animal.name }}，认识 {{ species.biologicalProfile.chineseName }}。</text></view>
      </view>

      <view class="subsection-title"><text>📄 生物身份证 (Biological Profile)</text><text>SPECIES ID CARD</text></view>
      <view class="species-id-card">
        <view class="species-id-card__primary">
          <view><text>中文名称</text><text>{{ species.biologicalProfile.chineseName }}</text></view>
          <view><text>英文名称</text><text>{{ species.biologicalProfile.englishName }}</text></view>
          <view><text>学名 (拉丁文)</text><text>{{ species.biologicalProfile.latinName }}</text></view>
        </view>
        <view class="taxonomy-grid">
          <view v-for="tax in taxonomyCards" :key="tax.label" :class="{ highlighted: tax.highlighted }">
            <text>{{ tax.label }}</text><text>{{ tax.value }}</text>
          </view>
        </view>
      </view>

      <view class="subsection-title"><text>📊 基本资料 (Species Specifications)</text></view>
      <view class="species-info-grid">
        <view v-for="info in speciesBasicInfo" :key="info.label">
          <text>{{ info.icon }}</text>
          <view><text>{{ info.label }}</text><text>{{ info.value }}</text></view>
        </view>
      </view>

      <view v-if="species.characteristics.length" class="species-block">
        <view class="subsection-title"><text>✨ 物种独特习性 (Evolutionary Trait)</text></view>
        <view v-for="(trait, index) in species.characteristics" :key="trait.title" class="trait-card">
          <view class="trait-card__title"><text>0{{ index + 1 }}</text><text>{{ trait.title }}</text></view>
          <text>{{ trait.description }}</text>
        </view>
      </view>

      <view class="species-block">
        <view class="subsection-title"><text>🌱 分类关系 (Taxonomy)</text></view>
        <view class="taxonomy-tree">
          <text>从个体到自然分类界限。点击各节点可进行学术追溯。</text>
          <button
            v-for="node in taxonomyTree"
            :key="node.label"
            @click="protectedEmit('notify', `【${node.label}】${node.name} - 系统发育学知识树页面研发中`)"
          >
            <text :class="[`primary-${node.primary || 'plain'}`]">{{ node.symbol }}</text>
            <view><view class="taxonomy-node__name"><text>{{ node.name }}</text><text>({{ node.label }})</text></view><text>{{ node.description }}</text></view>
            <text>›</text>
          </button>
        </view>
      </view>

      <view v-if="species.wildVsZoo?.length" class="species-block wild-zoo">
        <view class="subsection-title"><text>🦁 野外 vs 动物园 (Wild vs Zoo)</text></view>
        <view v-for="item in species.wildVsZoo" :key="item.title" class="wild-zoo__card">
          <text>{{ item.title }}</text>
          <view>
            <view><text>🌲 野外 (Wild)</text><text>{{ item.wild }}</text></view>
            <view><text>🏡 动物园 (Zoo)</text><text>{{ item.zoo }}</text></view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped>
button {
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  line-height: 1.2;
}

button::after {
  display: none;
}

.detail-page {
  padding: 16px 20px 100px;
  color: #292524;
}

.hero {
  position: relative;
  height: 360px;
  overflow: hidden;
  border-radius: 18px;
  background: #e7e5e4;
  box-shadow: 0 8px 24px rgba(41, 37, 36, 0.12);
}

.hero__image {
  width: 100%;
  height: 100%;
}

.hero::after {
  position: absolute;
  inset: 45% 0 0;
  content: "";
  background: linear-gradient(transparent, rgba(28, 25, 23, 0.88));
  pointer-events: none;
}

.hero__actions {
  position: absolute;
  z-index: 2;
  top: 12px;
  right: 12px;
  left: 12px;
  display: flex;
  justify-content: space-between;
}

.hero__actions > view {
  display: flex;
  gap: 7px;
}

.hero__actions button {
  display: flex;
  width: 36px;
  height: 36px;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.48);
  border-radius: 50%;
  background: rgba(250, 248, 245, 0.92);
  color: #44403c;
  box-shadow: 0 3px 10px rgba(28, 25, 23, 0.16);
}

.hero__identity {
  position: absolute;
  z-index: 2;
  right: 18px;
  bottom: 18px;
  left: 18px;
  color: #fff;
}

.hero__name-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.hero__name-row > text {
  font-family: Georgia, "Songti SC", serif;
  font-size: 27px;
  font-weight: 700;
}

.hero__identity > text {
  display: block;
  margin-top: 5px;
  color: #d6d3d1;
  font-size: 12px;
}

.test-notice {
  display: flex;
  flex-direction: column;
  gap: 3px;
  margin-top: 14px;
  padding: 11px 13px;
  border: 1px solid #fde68a;
  border-radius: 12px;
  background: #fffbeb;
}

.test-notice text:first-child {
  color: #92400e;
  font-size: 11px;
  font-weight: 700;
}

.test-notice text:last-child {
  color: #a16207;
  font-size: 10px;
}

.summary-card,
.detail-section {
  margin-top: 16px;
  border: 1px solid rgba(214, 211, 209, 0.75);
  border-radius: 18px;
  background: #fff;
  box-shadow: 0 3px 12px rgba(41, 37, 36, 0.05);
}

.summary-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 15px 16px;
}

.summary-card text:first-child {
  color: #78716c;
  font-size: 10px;
  font-weight: 700;
}

.summary-card text:last-child {
  color: #44403c;
  font-family: Georgia, "Songti SC", serif;
  font-size: 13px;
  line-height: 1.75;
}

.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding-top: 12px;
}

.tag-row text {
  padding: 4px 9px;
  border: 1px solid #e7e5e4;
  border-radius: 999px;
  background: #fafaf9;
  color: #78716c;
  font-size: 10px;
}

.detail-section {
  padding: 17px;
}

.section-title,
.section-title > view {
  display: flex;
  align-items: center;
  gap: 7px;
}

.section-title {
  padding-bottom: 12px;
  border-bottom: 1px solid #f5f5f4;
}

.section-title > text:first-child,
.section-title > view > text:first-child,
.species-heading > text:first-child {
  font-size: 14px;
  line-height: 1;
}

.section-title text:nth-child(2),
.section-title > view text:nth-child(2) {
  color: #1c1917;
  font-family: Georgia, "Songti SC", serif;
  font-size: 14px;
  font-weight: 700;
}

.section-title > text:nth-child(3),
.section-title--split > text:last-child {
  margin-left: auto;
  color: #a8a29e;
  font-family: monospace;
  font-size: 9px;
}

.section-title--split {
  justify-content: space-between;
}

.section-title--split > text {
  margin-left: 0;
}

.archive-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  padding-top: 12px;
}

.archive-item {
  display: flex;
  min-height: 78px;
  flex-direction: column;
  gap: 4px;
  padding: 11px;
  border: 1px solid #eeeae6;
  border-radius: 12px;
  background: #faf8f5;
}

.archive-item text:first-child {
  color: #a8a29e;
  font-size: 9px;
}

.archive-item text:nth-child(2) {
  color: #292524;
  font-size: 11px;
  font-weight: 700;
  line-height: 1.45;
}

.archive-item text:last-child {
  margin-top: auto;
  color: #2f5233;
  font-size: 8px;
}

.timeline {
  padding-top: 14px;
}

.timeline-item {
  position: relative;
  display: grid;
  grid-template-columns: 64px 1fr;
  gap: 13px;
  padding-bottom: 18px;
}

.timeline-item:not(:last-child)::before {
  position: absolute;
  top: 21px;
  bottom: 0;
  left: 30px;
  width: 1px;
  content: "";
  background: #d9c3b0;
}

.timeline-item__year {
  position: relative;
  z-index: 1;
  align-self: start;
  padding: 5px 3px;
  border-radius: 999px;
  background: #2f5233;
  color: #fff;
  font-family: monospace;
  font-size: 11px;
  text-align: center;
}

.timeline-item > view:last-child {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.timeline-item > view:last-child text:first-child {
  color: #292524;
  font-size: 13px;
  font-weight: 700;
}

.timeline-item > view:last-child text:last-child {
  color: #78716c;
  font-size: 12px;
  line-height: 1.7;
}

.story-copy {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 13px;
}

.story-copy text {
  color: #57534e;
  font-family: Georgia, "Songti SC", serif;
  font-size: 11px;
  line-height: 1.85;
}

.filter-bar {
  width: 100%;
  padding-top: 12px;
  white-space: nowrap;
}

.filter-bar__inner {
  display: inline-flex;
  gap: 7px;
}

.filter-bar button {
  padding: 6px 12px;
  border: 1px solid #e7e5e4;
  border-radius: 999px;
  background: #fff;
  color: #78716c;
  font-size: 10px;
}

.filter-bar button.active {
  border-color: #2f5233;
  background: #2f5233;
  color: #fff;
}

.observation-list,
.memory-list,
.comment-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 12px;
}

.observation-card,
.memory-item,
.comment-item {
  padding: 12px;
  border: 1px solid #eeeae6;
  border-radius: 13px;
  background: #fafaf9;
}

.observation-card__author {
  display: flex;
  align-items: center;
  gap: 8px;
}

.observation-card__author > view:first-child {
  display: flex;
  width: 30px;
  height: 30px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #2f5233;
  color: #fff;
  font-size: 10px;
}

.observation-card__author > view:nth-child(2) {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 2px;
}

.observation-card__author > view:nth-child(2) text:first-child {
  color: #292524;
  font-size: 10px;
  font-weight: 700;
}

.observation-card__author > view:nth-child(2) text:last-child {
  overflow: hidden;
  color: #a8a29e;
  font-size: 8px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.observation-card__author > text {
  color: #2f5233;
  font-size: 9px;
}

.observation-card__copy,
.memory-item__copy {
  display: block;
  padding-top: 10px;
  color: #57534e;
  font-size: 10px;
  line-height: 1.7;
}

.observation-card__image,
.memory-item__image {
  width: 100%;
  height: 150px;
  margin-top: 9px;
  border-radius: 10px;
}

.observation-card__actions {
  display: flex;
  gap: 14px;
  padding-top: 9px;
}

.observation-card__actions button,
.memory-item > button {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #78716c;
  font-size: 9px;
}

.primary-button {
  width: 100%;
  margin-top: 12px;
  padding: 11px;
  border-radius: 11px;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
}

.primary-button--green {
  background: #2f5233;
}

.empty-copy {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 20px 8px 8px;
  color: #a8a29e;
  font-size: 10px;
  text-align: center;
}

.empty-copy text:first-child {
  color: #78716c;
  font-weight: 700;
}

.memory-section {
  background: #fffdf9;
}

.memory-heading,
.species-heading {
  display: flex;
  gap: 9px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0ece7;
}

.memory-heading > view,
.species-heading > view {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.memory-heading > view text:first-child,
.species-heading > view text:first-child {
  color: #292524;
  font-family: Georgia, "Songti SC", serif;
  font-size: 14px;
  font-weight: 700;
}

.memory-heading > view text:last-child {
  color: #b83b26;
  font-family: monospace;
  font-size: 8px;
  letter-spacing: 1px;
}

.memory-item__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.memory-item__top > view {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.memory-item__top > view text:first-child {
  color: #292524;
  font-size: 10px;
  font-weight: 700;
}

.memory-item__top > view text:last-child {
  color: #b83b26;
  font-size: 8px;
}

.memory-item__top > text {
  color: #2f5233;
  font-size: 9px;
}

.memory-item > button {
  margin-top: 9px;
}

.memorial-section {
  background: #1c1917;
  color: #fff;
}

.memorial-section .section-title {
  border-color: #44403c;
}

.memorial-section .section-title text:nth-child(2) {
  color: #fff;
}

.memorial-intro {
  display: block;
  padding-top: 10px;
  color: #a8a29e;
  font-size: 10px;
  line-height: 1.6;
}

.candle-card {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 8px;
  align-items: center;
  margin-top: 12px;
  padding: 11px;
  border: 1px solid #57534e;
  border-radius: 12px;
  background: #292524;
}

.candle-card > text:nth-child(2) {
  color: #d6d3d1;
  font-size: 9px;
}

.candle-card button,
.comment-composer button {
  padding: 7px 10px;
  border-radius: 9px;
  background: #b83b26;
  color: #fff;
  font-size: 9px;
}

.candle-card button.active {
  background: #2f5233;
}

.comment-composer {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 7px;
  margin-top: 10px;
}

.comment-composer input {
  height: 34px;
  padding: 0 10px;
  border: 1px solid #57534e;
  border-radius: 9px;
  background: #292524;
  color: #fff;
  font-size: 10px;
}

.comment-item {
  border-color: #44403c;
  background: #292524;
}

.comment-item > view {
  display: flex;
  justify-content: space-between;
}

.comment-item > view text:first-child {
  color: #fafaf9;
  font-size: 10px;
  font-weight: 700;
}

.comment-item > view text:last-child {
  color: #78716c;
  font-size: 8px;
}

.comment-item > text {
  display: block;
  padding-top: 7px;
  color: #d6d3d1;
  font-size: 10px;
  line-height: 1.6;
}

.comment-item > button {
  margin-top: 8px;
  color: #d9c3b0;
  font-size: 9px;
}

.comment-item > button.active {
  color: #fbbf24;
}

.relationship-current,
.relationship-target {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 12px;
}

.relationship-current > :deep(.animal-image),
.relationship-target > :deep(.animal-image) {
  width: 54px;
  height: 54px;
  flex: 0 0 auto;
  border-radius: 13px;
}

.relationship-current > view,
.relationship-target > view {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 3px;
}

.relationship-current > view text:first-child {
  color: #b83b26;
  font-size: 8px;
}

.relationship-current > view text:nth-child(2),
.relationship-target > view text:first-child {
  color: #292524;
  font-size: 12px;
  font-weight: 700;
}

.relationship-current > view text:last-child,
.relationship-target > view text:last-child {
  color: #a8a29e;
  font-size: 9px;
}

.relationship-label {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin: 12px 0;
  padding: 10px 12px;
  border-left: 3px solid #2f5233;
  background: #faf8f5;
}

.relationship-label text:first-child {
  color: #2f5233;
  font-size: 10px;
  font-weight: 700;
}

.relationship-label text:last-child {
  color: #78716c;
  font-size: 9px;
}

.relationship-target {
  width: 100%;
  padding: 10px;
  border: 1px solid #e7e5e4;
  border-radius: 13px;
  background: #fff;
  text-align: left;
}

.relationship-target > text {
  color: #b83b26;
  font-size: 9px;
}

.species-heading > view text:last-child {
  color: #78716c;
  font-family: Georgia, "Songti SC", serif;
  font-size: 9px;
}

.subsection-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 18px;
  color: #44403c;
  font-family: Georgia, "Songti SC", serif;
  font-size: 14px;
  font-weight: 700;
}

.subsection-title text:last-child:not(:first-child) {
  padding: 2px 5px;
  border-radius: 4px;
  background: #f1f5f9;
  color: #5a6b7c;
  font-family: monospace;
  font-size: 7px;
  letter-spacing: 1px;
}

.species-id-card {
  position: relative;
  margin-top: 9px;
  padding: 14px;
  border: 1px solid rgba(217, 195, 176, 0.55);
  border-radius: 15px;
  background: #faf8f5;
}

.species-id-card__primary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 7px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e7e5e4;
}

.species-id-card__primary > view {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 4px;
  padding: 8px 5px;
  border: 1px solid #e7e5e4;
  border-radius: 10px;
  background: #fff;
  text-align: center;
}

.species-id-card__primary text:first-child,
.taxonomy-grid text:first-child {
  color: #a8a29e;
  font-size: 9px;
  line-height: 1.35;
}

.species-id-card__primary text:last-child {
  overflow-wrap: anywhere;
  color: #292524;
  font-size: 11px;
  font-weight: 700;
  line-height: 1.4;
}

.species-id-card__primary > view:last-child text:last-child {
  color: #b83b26;
  font-family: Georgia, serif;
  font-style: italic;
}

.taxonomy-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
  padding-top: 10px;
}

.taxonomy-grid > view {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 7px 9px;
  border: 1px solid #e7e5e4;
  border-radius: 9px;
  background: #fff;
}

.taxonomy-grid > view.highlighted {
  border-color: #a7f3d0;
  background: #ecfdf5;
}

.taxonomy-grid text:last-child {
  overflow-wrap: anywhere;
  color: #44403c;
  font-size: 10px;
  font-weight: 700;
  line-height: 1.4;
}

.species-info-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 7px;
  padding-top: 9px;
}

.species-info-grid > view {
  display: flex;
  gap: 7px;
  padding: 9px;
  border: 1px solid #eeeae6;
  border-radius: 10px;
  background: rgba(250, 248, 245, 0.65);
}

.species-info-grid > view > view {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 3px;
}

.species-info-grid > view > view text:first-child {
  color: #a8a29e;
  font-size: 8px;
}

.species-info-grid > view > view text:last-child {
  overflow-wrap: anywhere;
  color: #44403c;
  font-family: Georgia, "Songti SC", serif;
  font-size: 9px;
  font-weight: 700;
  line-height: 1.45;
}

.species-block {
  padding-top: 2px;
}

.trait-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 8px;
  padding: 11px;
  border: 1px solid #f0ece7;
  border-radius: 11px;
  background: #fafaf9;
}

.trait-card__title {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #2f5233;
  font-size: 10px;
  font-weight: 700;
}

.trait-card__title text:first-child {
  padding: 2px 4px;
  border-radius: 4px;
  background: rgba(47, 82, 51, 0.08);
  font-family: monospace;
  font-size: 8px;
}

.trait-card > text:last-child {
  color: #57534e;
  font-family: Georgia, "Songti SC", serif;
  font-size: 9px;
  line-height: 1.65;
}

.taxonomy-tree {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin-top: 9px;
  padding: 13px;
  border: 1px solid #e7e5e4;
  border-radius: 14px;
  background: #faf8f5;
}

.taxonomy-tree > text {
  padding-bottom: 6px;
  color: #a8a29e;
  font-family: Georgia, serif;
  font-size: 8px;
  text-align: center;
}

.taxonomy-tree button {
  display: grid;
  grid-template-columns: 28px 1fr auto;
  gap: 9px;
  align-items: center;
  width: 100%;
  padding: 5px;
  text-align: left;
}

.taxonomy-tree button > text:first-child {
  display: flex;
  width: 27px;
  height: 27px;
  align-items: center;
  justify-content: center;
  border: 1px solid #d6d3d1;
  border-radius: 50%;
  background: #fff;
  color: #57534e;
  font-family: monospace;
  font-size: 8px;
  font-weight: 700;
}

.taxonomy-tree button > text.primary-red {
  border-color: #b83b26;
  background: #b83b26;
  color: #fff;
}

.taxonomy-tree button > text.primary-green {
  border-color: #2f5233;
  background: #2f5233;
  color: #fff;
}

.taxonomy-tree button > view {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 2px;
}

.taxonomy-node__name {
  display: flex;
  align-items: baseline;
  gap: 3px;
  color: #44403c;
  font-size: 9px;
  font-weight: 700;
}

.taxonomy-node__name text:last-child {
  color: #a8a29e;
  font-family: monospace;
  font-size: 7px;
  font-weight: 400;
}

.taxonomy-tree button > view > text:last-child {
  overflow: hidden;
  color: #a8a29e;
  font-size: 8px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.taxonomy-tree button > text:last-child {
  color: #a8a29e;
  font-size: 10px;
}

.wild-zoo {
  margin-top: 15px;
  padding-top: 2px;
  border-top: 1px solid #f5f5f4;
}

.wild-zoo__card {
  margin-top: 9px;
  padding: 11px;
  border: 1px solid #eeeae6;
  border-radius: 11px;
  background: rgba(250, 248, 245, 0.65);
}

.wild-zoo__card > text {
  display: block;
  padding-bottom: 7px;
  border-bottom: 1px solid rgba(217, 195, 176, 0.45);
  color: #44403c;
  font-size: 9px;
  font-weight: 700;
}

.wild-zoo__card > view {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  padding-top: 8px;
}

.wild-zoo__card > view > view {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 8px;
  border: 1px solid #f0ece7;
  border-radius: 9px;
  background: #fff;
}

.wild-zoo__card > view > view text:first-child {
  color: #2f5233;
  font-size: 8px;
  font-weight: 700;
}

.wild-zoo__card > view > view:first-child text:first-child {
  color: #78716c;
}

.wild-zoo__card > view > view text:last-child {
  color: #57534e;
  font-family: Georgia, "Songti SC", serif;
  font-size: 8px;
  line-height: 1.55;
}
</style>
