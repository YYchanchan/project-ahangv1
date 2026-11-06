<script setup lang="ts">
import { onLoad, onResize, onShareAppMessage, onShareTimeline } from "@dcloudio/uni-app";
import { computed, nextTick, onMounted, reactive, ref } from "vue";
import AhangIcon from "../../components/AhangIcon.vue";
import AnimalDetailView from "../../components/AnimalDetailView.vue";
import AnimalImage from "../../components/AnimalImage.vue";
import MemorialPlazaView from "../../components/MemorialPlazaView.vue";
import ProfileView from "../../components/ProfileView.vue";
import RecordHubView from "../../components/RecordHubView.vue";
import StatusBadge from "../../components/StatusBadge.vue";
import UiImageIcon from "../../components/UiImageIcon.vue";
import type {
  Animal,
  CandleStat,
  DetailedSubmissionRecord,
  MemorialCommentRecord,
  ProfileStats,
  PublicMemoryRecord,
  Species,
  TaskChallenge,
} from "../../types";
import { useAuthStore } from "../../stores/auth";
import { getApi, postApi, putApi, resolveMediaUrl, uploadMedia } from "../../services/api";
import ahangOnboardingMain from "../../assets/optimized/ahang-onboarding-main.jpg";

type MainTab = "home" | "archives" | "record" | "memorial" | "my";
type ViewType =
  | "onboarding"
  | "main"
  | "animal_detail"
  | "recommend_animal"
  | "my_submissions"
  | "about_project"
  | "task_center"
  | "form_task"
  | "form_task_contribution"
  | "form_observation"
  | "form_memory"
  | "form_correction"
  | "ai_helper"
  | "my_favorites";

type DetailTab = "story" | "observations" | "memories" | "species";
type UiImageIconName = "home" | "archive" | "memorial" | "profile";

type SubmissionItem = DetailedSubmissionRecord;

interface ApiSubmission {
  id: string;
  type: "recommend" | "observation" | "memory" | "correction" | "archive" | "task";
  animalName: string;
  title: string;
  details: string;
  mediaUrl?: string;
  source?: string;
  copyright?: string;
  status: "pending" | "approved" | "need_supplement" | "rejected";
  statusLabel: string;
  adminComment: string;
  submittedAt: string;
}

const auth = useAuthStore();
const { currentUser, wechatLoginLoading } = auth;

const viewType = ref<ViewType>("onboarding");
const mainTab = ref<MainTab>("home");
const onboardingStep = ref(1);
const recommendStep = ref(1);
const recommendSubmitted = ref(false);
const observationStep = ref(1);
const observationSubmitted = ref(false);
const observationSearch = ref("");
const selectedAnimalId = ref("");
const detailTab = ref<DetailTab>("story");
const archiveFilter = ref("all");
const archiveSearch = ref("");
const memorialFilter = ref("all");
const toastText = ref("");
const toastVisible = ref(false);
const showSettings = ref(false);
const showWechatLoginSheet = ref(false);
const wechatProfileNickname = ref("");
const wechatProfileAvatarPath = ref("");
const wechatProfileAvatarRemote = ref("");
const enterHomeAfterWechatLogin = ref(false);
const wechatProfileSaving = ref(false);
const showMemoryUploader = ref(false);
const showSubmissionDetail = ref(false);
const selectedSubmission = ref<SubmissionItem | null>(null);
const pageScrollTop = ref(0);
const safeAreaTop = ref(0);
const safeAreaBottom = ref(0);
const onboardingHeaderActionTop = ref(10);
const appHeaderSafeTop = ref(0);
const onboardingSwiperHeight = ref(520);
const phoneShellStyle = computed(
  () => [
    `--app-safe-top: ${safeAreaTop.value}px`,
    `--app-safe-bottom: ${safeAreaBottom.value}px`,
    `--onboarding-header-action-top: ${onboardingHeaderActionTop.value}px`,
    `--app-header-safe-top: ${appHeaderSafeTop.value}px`,
    `--onboarding-swiper-height: ${onboardingSwiperHeight.value}px`,
  ].join("; "),
);
const correctionReturnsToDetail = ref(false);
const sharedAnimalId = ref("");

let toastTimer: ReturnType<typeof setTimeout> | undefined;

const animals = ref<Animal[]>([]);
const speciesItems = ref<Species[]>([]);
const favoriteAnimals = ref<Animal[]>([]);
const collaborationTasks = ref<TaskChallenge[]>([]);
const selectedTask = ref<TaskChallenge | null>(null);
const publicMemories = ref<PublicMemoryRecord[]>([]);
const memorialComments = ref<MemorialCommentRecord[]>([]);
const animalCandles = reactive<Record<string, number>>({});
const candledAnimals = reactive<Record<string, boolean>>({});
const profileStats = ref<ProfileStats>({
  submissionCount: 0,
  pendingCount: 0,
  approvedContributionCount: 0,
  favoriteCount: 0,
});

const recommendForm = reactive({
  province: "广东省",
  zoo: "广州动物园",
  city: "广州市",
  area: "狮虎山区",
  specificPoint: "",
  uncertainLocation: false,
  name: "",
  nickname: "",
  dontKnowName: false,
  species: "",
  gender: "未知",
  reasons: [] as string[],
  otherReason: "",
  story: "",
  sourceLink: "",
  citation: "",
  copyright: "self",
  authorized: false,
  photo: "",
});

const observationForm = reactive({
  animalId: "",
  date: new Date().toISOString().slice(0, 10),
  time: "14:30",
  location: "广州动物园 狮虎山",
  behaviors: ["睡觉"] as string[],
  enrichment: "no",
  interaction: "no",
  description: "",
  photo: "",
  archiveOnly: false,
  publicWelfare: false,
  copyrightSelf: false,
});

const memoryForm = reactive({
  animalId: "",
  customAnimalName: "",
  date: "",
  title: "",
  text: "",
  photo: "",
});

const correctionForm = reactive({
  animalId: "",
  field: "timeline",
  text: "",
  evidence: "",
  citation: "",
});

const memoryUploadForm = reactive({
  belongingAnimal: "",
  platform: "",
  publishTime: "",
  description: "",
  originalLink: "",
  authorizationStatus: "research",
});

const taskForm = reactive({
  animalId: "",
  title: "",
  description: "",
  expectedInfo: "",
  rewardLabel: "共同完善动物档案",
});

const taskContributionForm = reactive({
  details: "",
  source: "",
  photo: "",
  copyrightConfirmed: false,
});

const aiState = reactive({
  status: "idle" as "idle" | "scanning" | "done",
  image: "",
  resultName: "",
  confidence: "",
});

const submissions = ref<SubmissionItem[]>([]);
const submissionStatusFilter = ref("all");

const selectedAnimal = computed(
  () => animals.value.find((animal) => animal.id === selectedAnimalId.value) || animals.value[0],
);

const featuredAnimal = computed(() => animals.value[0]);

const selectedSpecies = computed(() => {
  const animal = selectedAnimal.value;
  if (!animal) return undefined;
  return speciesItems.value.find(
    (species) =>
      species.id === animal.speciesCode ||
      species.biologicalProfile.englishName === animal.species,
  );
});

const filteredAnimals = computed(() => {
  const query = archiveSearch.value.trim().toLowerCase();
  return animals.value.filter((animal) => {
    const matchesFilter = archiveFilter.value === "all" || animal.status === archiveFilter.value;
    const haystack = [
      animal.name,
      animal.nickname,
      animal.species,
      animal.commonName,
      animal.institution,
      animal.city,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return matchesFilter && (!query || haystack.includes(query));
  });
});

const filteredMemories = computed(() =>
  publicMemories.value.filter(
    (memory) => memorialFilter.value === "all" || memory.animalIds.includes(memorialFilter.value),
  ),
);

const filteredSubmissions = computed(() =>
  submissions.value.filter(
    (item) =>
      submissionStatusFilter.value === "all" || item.status === submissionStatusFilter.value,
  ),
);

const filteredObservationAnimals = computed(() => {
  const query = observationSearch.value.trim().toLowerCase();
  return animals.value.filter((animal) =>
    [animal.name, animal.nickname, animal.species, animal.commonName]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(query),
  );
});

const memoryAnimalOptions = computed(() => [
  { id: "custom", name: "-- 档案中没有它，输入新名字 --" },
  ...animals.value.map((animal) => ({
    id: animal.id,
    name: `${animal.name}（${animal.species} · ${animal.institution}）`,
  })),
]);

const taskAnimalOptions = computed(() => [
  { id: "", name: "不限特定动物" },
  ...animals.value.map((animal) => ({ id: animal.id, name: animal.name })),
]);

const bottomNavVisible = computed(() => viewType.value !== "onboarding");
const wechatProfileAvatarPreview = computed(() =>
  wechatProfileAvatarPath.value || resolveMediaUrl(wechatProfileAvatarRemote.value),
);
const wechatAuthLoading = computed(() => wechatLoginLoading.value || wechatProfileSaving.value);
const selectedAnimalFavorited = computed(() =>
  Boolean(selectedAnimal.value && favoriteAnimals.value.some((animal) => animal.id === selectedAnimal.value!.id)),
);

function normalizeAnimalMedia(animal: Animal): Animal {
  return {
    ...animal,
    image: resolveMediaUrl(animal.image),
    coverUrl: resolveMediaUrl(animal.coverUrl),
    gallery: animal.gallery?.map((item) => resolveMediaUrl(item)),
    observations: animal.observations.map((observation) => ({
      ...observation,
      image: resolveMediaUrl(observation.image) || undefined,
      avatar: resolveMediaUrl(observation.avatar),
    })),
  };
}

function normalizeMemoryMedia(memory: PublicMemoryRecord): PublicMemoryRecord {
  return { ...memory, image: resolveMediaUrl(memory.image) || undefined };
}

function updateSafeAreaBottom() {
  try {
    const system = uni.getSystemInfoSync() as UniApp.GetSystemInfoResult & {
      safeAreaInsets?: { top?: number; bottom?: number };
    };
    const safeTop = system.safeAreaInsets?.top
      ?? (system.safeArea ? Math.max(0, Number(system.safeArea.top) || 0) : 0);
    const measured = system.safeAreaInsets?.bottom
      ?? (system.safeArea ? Math.max(0, system.screenHeight - system.safeArea.bottom) : 0);
    safeAreaTop.value = Math.max(0, Number(safeTop) || 0);
    safeAreaBottom.value = Math.max(0, Number(measured) || 0);
    appHeaderSafeTop.value = safeAreaTop.value;

    // 微信原生 swiper 在部分真机上不会可靠继承 flex 高度，必须给出明确高度。
    // 这里按当前可用窗口和上下安全区计算，保证首屏头像不会被 150px 默认高度裁掉。
    const windowHeight = Number(system.windowHeight || system.screenHeight || 667);
    onboardingSwiperHeight.value = Math.max(
      360,
      Math.floor(windowHeight - Math.max(0, Number(safeTop) || 0) - safeAreaBottom.value - 140),
    );
  } catch {
    safeAreaTop.value = 0;
    safeAreaBottom.value = 0;
    appHeaderSafeTop.value = 0;
    onboardingSwiperHeight.value = 500;
  }

  // 微信小程序右上角胶囊会覆盖页面内容，跳过按钮必须放到胶囊下方。
  // #ifdef MP-WEIXIN
  try {
    const menuButton = uni.getMenuButtonBoundingClientRect();
    onboardingHeaderActionTop.value = Math.max(10, Math.ceil(menuButton.bottom + 8));
    appHeaderSafeTop.value = Math.max(safeAreaTop.value, onboardingHeaderActionTop.value);
  } catch {
    onboardingHeaderActionTop.value = 72;
    appHeaderSafeTop.value = Math.max(safeAreaTop.value, 72);
  }
  // #endif
}

function toSubmissionItem(item: ApiSubmission): SubmissionItem {
  const type: SubmissionItem["type"] =
    item.type === "memory" || item.type === "archive" || item.type === "task" ? "supplement" : item.type;
  const status: SubmissionItem["status"] =
    item.status === "approved" ? "official" : item.status;
  return {
    id: item.id,
    type,
    title: item.title,
    submittedAt: item.submittedAt.slice(0, 10),
    status,
    statusLabel: item.statusLabel,
    details: item.details,
    adminComment: item.adminComment,
    animalName: item.animalName,
    photo: resolveMediaUrl(item.mediaUrl) || undefined,
    source: item.source,
    copyright: item.copyright,
  };
}

async function loadPublicData() {
  try {
    const [animalResponse, speciesResponse, memoryResponse, taskResponse, commentResponse, candleResponse] = await Promise.all([
      getApi<{ items: Animal[] }>("/api/animals"),
      getApi<{ items: Species[] }>("/api/species"),
      getApi<{ items: PublicMemoryRecord[] }>("/api/memories"),
      getApi<{ items: TaskChallenge[] }>("/api/tasks"),
      getApi<{ items: MemorialCommentRecord[] }>("/api/memorial-comments"),
      getApi<{ items: CandleStat[] }>("/api/candles"),
    ]);
    animals.value = animalResponse.items.map(normalizeAnimalMedia);
    speciesItems.value = speciesResponse.items;
    publicMemories.value = memoryResponse.items.map(normalizeMemoryMedia);
    collaborationTasks.value = taskResponse.items;
    memorialComments.value = commentResponse.items;
    candleResponse.items.forEach((item) => {
      animalCandles[item.animalId] = item.count;
      candledAnimals[item.animalId] = item.hasLitToday;
    });
    const firstAnimalId = animals.value[0]?.id || "";
    if (!animals.value.some((item) => item.id === selectedAnimalId.value)) selectedAnimalId.value = firstAnimalId;
    if (!animals.value.some((item) => item.id === observationForm.animalId)) observationForm.animalId = firstAnimalId;
    if (!animals.value.some((item) => item.id === memoryForm.animalId)) memoryForm.animalId = firstAnimalId;
    if (!animals.value.some((item) => item.id === correctionForm.animalId)) correctionForm.animalId = firstAnimalId;
    if (!animals.value.some((item) => item.id === memoryUploadForm.belongingAnimal)) memoryUploadForm.belongingAnimal = firstAnimalId;
  } catch (error) {
    triggerToast(error instanceof Error ? `后端数据加载失败：${error.message}` : "后端数据加载失败");
  }
}

async function loadPrivateData() {
  if (currentUser.value.role === "guest") {
    favoriteAnimals.value = [];
    submissions.value = [];
    profileStats.value = { submissionCount: 0, pendingCount: 0, approvedContributionCount: 0, favoriteCount: 0 };
    return;
  }
  try {
    const [favoritesResponse, submissionsResponse, statsResponse] = await Promise.all([
      getApi<{ items: Animal[] }>("/api/favorites"),
      getApi<{ items: ApiSubmission[] }>("/api/submissions/mine"),
      getApi<{ stats: ProfileStats }>("/api/profile/stats"),
    ]);
    favoriteAnimals.value = favoritesResponse.items.map(normalizeAnimalMedia);
    submissions.value = submissionsResponse.items.map(toSubmissionItem);
    profileStats.value = statsResponse.stats;
  } catch (error) {
    triggerToast(error instanceof Error ? error.message : "个人数据加载失败");
  }
}

function ensureLoggedIn(): boolean {
  if (currentUser.value.role !== "guest") return true;
  openWechatProfileSheet(false);
  return false;
}

function skipOnboarding() {
  const isGuest = currentUser.value.role === "guest";
  goMain("home", isGuest);
  if (isGuest) openWechatProfileSheet(false);
}

function nextOnboardingStep() {
  onboardingStep.value = Math.min(4, onboardingStep.value + 1);
}

function handleOnboardingSwiperChange(event: any) {
  const current = Number(event.detail?.current ?? 0);
  onboardingStep.value = Math.min(4, Math.max(1, current + 1));
}

function handleOnboardingWheel(event: WheelEvent) {
  if (onboardingStep.value >= 4) return;
  if (event.deltaX >= 36 && Math.abs(event.deltaX) > Math.abs(event.deltaY)) nextOnboardingStep();
}

function sharedAnimalIdFromLocation(): string {
  let value = "";
  // #ifdef H5
  const queryText = window.location.hash.split("?")[1] || window.location.search.slice(1);
  value = new URLSearchParams(queryText).get("animalId") || "";
  // #endif
  return value;
}

onLoad((query) => {
  sharedAnimalId.value = typeof query?.animalId === "string" ? query.animalId : "";
});

onResize(() => {
  updateSafeAreaBottom();
});

onMounted(async () => {
  updateSafeAreaBottom();
  if (!sharedAnimalId.value) sharedAnimalId.value = sharedAnimalIdFromLocation();
  await auth.initializeAuth();
  if (currentUser.value.role !== "guest") showWechatLoginSheet.value = false;
  await Promise.all([loadPublicData(), loadPrivateData()]);
  if (sharedAnimalId.value && animals.value.some((animal) => animal.id === sharedAnimalId.value)) {
    openAnimal(sharedAnimalId.value, "story", true);
  }
});

function triggerToast(message: string) {
  toastText.value = message;
  toastVisible.value = true;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastVisible.value = false;
  }, 2400);
}

async function resetScroll() {
  pageScrollTop.value = 1;
  await nextTick();
  pageScrollTop.value = 0;
}

function goMain(tab: MainTab, allowGuest = false) {
  if (!allowGuest && !ensureLoggedIn()) return;
  viewType.value = "main";
  mainTab.value = tab;
  resetScroll();
}

function openAnimal(id: string, tab: DetailTab = "story", allowGuest = false) {
  if (!allowGuest && !ensureLoggedIn()) return;
  if (!animals.value.some((animal) => animal.id === id)) {
    triggerToast("该动物档案不存在或尚未公开");
    return;
  }
  selectedAnimalId.value = id;
  detailTab.value = tab;
  viewType.value = "animal_detail";
  resetScroll();
}

function openView(type: ViewType) {
  if (!ensureLoggedIn()) return;
  viewType.value = type;
  resetScroll();
}

function openCorrection(animalId = animals.value[0]?.id || "", returnToDetail = false) {
  if (!ensureLoggedIn()) return;
  if (animalId) correctionForm.animalId = animalId;
  correctionReturnsToDetail.value = returnToDetail;
  openView("form_correction");
}

function startRecommend() {
  if (!ensureLoggedIn()) return;
  recommendStep.value = 1;
  recommendSubmitted.value = false;
  openView("recommend_animal");
}

function startTask() {
  if (!ensureLoggedIn()) return;
  Object.assign(taskForm, {
    animalId: "",
    title: "",
    description: "",
    expectedInfo: "",
    rewardLabel: "共同完善动物档案",
  });
  openView("form_task");
}

function openTaskContribution(task: TaskChallenge) {
  if (!ensureLoggedIn()) return;
  selectedTask.value = task;
  Object.assign(taskContributionForm, {
    details: "",
    source: "",
    photo: "",
    copyrightConfirmed: false,
  });
  openView("form_task_contribution");
}

function toggleRecommendReason(reason: string) {
  const index = recommendForm.reasons.indexOf(reason);
  if (index >= 0) recommendForm.reasons.splice(index, 1);
  else recommendForm.reasons.push(reason);
}

function nextRecommendStep() {
  if (recommendStep.value === 1 && !recommendForm.uncertainLocation) {
    if (!recommendForm.city.trim() || !recommendForm.zoo.trim() || !recommendForm.area.trim()) {
      triggerToast("请完整填写城市、动物园和具体展区，或勾选地点不确定");
      return;
    }
  }
  if (
    recommendStep.value === 2 &&
    !recommendForm.dontKnowName &&
    !recommendForm.species.trim()
  ) {
    triggerToast("请填写物种名称，或勾选完全不知道");
    return;
  }
  if (recommendStep.value === 3) {
    if (!recommendForm.reasons.length) {
      triggerToast("请至少选择一项希望为它建档的缘由");
      return;
    }
    if (recommendForm.story.trim().length < 5) {
      triggerToast("请至少写下 5 个字的故事或习性见闻");
      return;
    }
  }
  recommendStep.value += 1;
}

function startObservation(animalId = animals.value[0]?.id || "") {
  if (!ensureLoggedIn()) return;
  if (!animalId) {
    triggerToast("当前没有可选择的动物档案");
    return;
  }
  observationForm.animalId = animalId;
  const animal = animals.value.find((item) => item.id === animalId);
  observationForm.location =
    animal?.observations[0]?.location || `${animal?.institution || "广州动物园"} 观察区`;
  observationSearch.value = "";
  observationStep.value = 1;
  observationSubmitted.value = false;
  openView("form_observation");
}

function nextObservationStep() {
  if (observationStep.value === 1 && !observationForm.animalId) {
    triggerToast("请先选择本次观察的动物");
    return;
  }
  if (observationStep.value === 2) {
    if (!observationForm.date || !observationForm.time || !observationForm.location.trim()) {
      triggerToast("请完整填写观察日期、时间和地点");
      return;
    }
    if (!observationForm.behaviors.length) {
      triggerToast("请至少选择一个行为标签");
      return;
    }
  }
  if (observationStep.value === 4) {
    if (!observationForm.description.trim()) {
      triggerToast("请填写一句话日常描述");
      return;
    }
    if (observationForm.description.length > 300) {
      triggerToast("观察描述不能超过 300 字");
      return;
    }
  }
  observationStep.value += 1;
}

function chooseImage(target: "recommend" | "observation" | "memory" | "task_contribution") {
  if (!ensureLoggedIn()) return;
  uni.chooseImage({
    count: 1,
    sizeType: ["compressed"],
    sourceType: ["album", "camera"],
    success(result) {
      const path = result.tempFilePaths[0] || "";
      if (target === "recommend") recommendForm.photo = path;
      if (target === "observation") observationForm.photo = path;
      if (target === "memory") memoryForm.photo = path;
      if (target === "task_contribution") taskContributionForm.photo = path;
      triggerToast("图片已载入，可继续填写");
    },
    fail(error) {
      if (!error.errMsg.includes("cancel")) triggerToast("未能读取图片");
    },
  });
}

function toggleBehavior(behavior: string) {
  const index = observationForm.behaviors.indexOf(behavior);
  if (index >= 0) {
    observationForm.behaviors.splice(index, 1);
  } else {
    observationForm.behaviors.push(behavior);
  }
}

async function submitObservation() {
  if (!ensureLoggedIn()) return;
  if (!observationForm.description.trim()) {
    triggerToast("请先填写观察描述");
    return;
  }
  if (
    !observationForm.copyrightSelf ||
    !observationForm.archiveOnly ||
    !observationForm.publicWelfare
  ) {
    triggerToast("请逐项确认三条版权与公益授权条款");
    return;
  }

  try {
    const animal = animals.value.find((item) => item.id === observationForm.animalId);
    const mediaUrl = observationForm.photo ? await uploadMedia(observationForm.photo) : undefined;
    const response = await postApi<{ submission: ApiSubmission }>("/api/submissions", {
      type: "observation",
      animalId: observationForm.animalId,
      animalName: animal?.name || "待确认动物",
      title: `观察记录：${animal?.name || "动物"}的最新日常`,
      details: observationForm.description,
      mediaUrl,
      source: `${observationForm.location} · ${observationForm.date} ${observationForm.time}`,
      copyright: "本人拍摄 · 档案展示 · 公益科普授权",
      payload: {
        dateTime: `${observationForm.date} ${observationForm.time}`,
        location: observationForm.location,
        behaviors: [...observationForm.behaviors],
        enrichment: observationForm.enrichment,
        interaction: observationForm.interaction,
      },
    });
    submissions.value.unshift(toSubmissionItem(response.submission));
    observationSubmitted.value = true;
    triggerToast("观察记录已提交，审核通过后才会公开");
  } catch (error) {
    triggerToast(error instanceof Error ? error.message : "观察记录提交失败");
  }
}

async function submitRecommendation() {
  if (!ensureLoggedIn()) return;
  if (!recommendForm.photo) {
    triggerToast("请上传一张动物实拍图作为建档佐证");
    return;
  }
  if (!recommendForm.authorized) {
    triggerToast("请先确认资料授权与真实性声明");
    return;
  }

  try {
    const mediaUrl = await uploadMedia(recommendForm.photo);
    const id = `candidate-${Date.now()}`;
    const candidate: Animal = {
      id,
      name: recommendForm.dontKnowName ? "待确认名字" : recommendForm.name || "未命名个体",
      nickname: recommendForm.dontKnowName ? "未命名" : recommendForm.nickname,
      species: recommendForm.dontKnowName ? "待核实物种" : recommendForm.species || "Unknown",
      scientificName: "",
      speciesCode: "",
      image: mediaUrl,
      imageType: "real",
      status: "need_info",
      institution: recommendForm.uncertainLocation ? "未知机构" : recommendForm.zoo,
      city: recommendForm.city,
      gender: recommendForm.gender as Animal["gender"],
      lifeSpan: "待补充",
      statusLabel: "资料待补充",
      tags: recommendForm.reasons.length ? [...recommendForm.reasons] : ["公众推荐"],
      description: recommendForm.story || "由公众推荐建档，资料正在核验中。",
      timeline: [{ year: new Date().getFullYear().toString(), title: "公众推荐建档", description: "首条线索审核通过，档案正式建立。" }],
      observations: [],
      verified: false,
      verifiedCount: 1,
      summary: recommendForm.story || "资料待补充",
      recordCount: 1,
      isTestData: false,
    };
    const response = await postApi<{ submission: ApiSubmission }>("/api/submissions", {
      type: "recommend",
      animalName: candidate.name,
      title: `推荐设立：${candidate.name}档案`,
      details: recommendForm.story || "公众推荐的新动物个体档案。",
      mediaUrl,
      source: recommendForm.sourceLink || "未提供公开来源链接",
      copyright: recommendForm.copyright === "self" ? "本人原创自拍" : recommendForm.copyright === "authorized" ? "已获作者授权" : "仅后台线索",
      payload: { animal: candidate, citation: recommendForm.citation },
    });
    submissions.value.unshift(toSubmissionItem(response.submission));
    recommendSubmitted.value = true;
    triggerToast("推荐已提交，审核通过后才会生成公开档案");
  } catch (error) {
    triggerToast(error instanceof Error ? error.message : "推荐提交失败");
  }
}

async function submitMemory() {
  if (!ensureLoggedIn()) return;
  if (memoryForm.animalId === "custom" && !memoryForm.customAnimalName.trim()) {
    triggerToast("请填写追忆对象的名字");
    return;
  }
  if (!memoryForm.text.trim()) {
    triggerToast("请写下想保存的回忆");
    return;
  }
  const targetAnimal = animals.value.find((item) => item.id === memoryForm.animalId);
  const animalName = targetAnimal?.name || memoryForm.customAnimalName.trim() || "离散老友";
  try {
    const mediaUrl = memoryForm.photo ? await uploadMedia(memoryForm.photo) : undefined;
    const response = await postApi<{ submission: ApiSubmission }>("/api/submissions", {
      type: "memory",
      animalId: memoryForm.animalId === "custom" ? undefined : memoryForm.animalId,
      animalName,
      title: memoryForm.title || `${animalName}的回忆`,
      details: memoryForm.text,
      mediaUrl,
      copyright: "用户原创回忆 · 公益展示授权",
      payload: { date: memoryForm.date || new Date().toISOString().slice(0, 10) },
    });
    submissions.value.unshift(toSubmissionItem(response.submission));
    triggerToast("回忆已提交，审核通过后将在纪念页公开 🕯️");
    goMain("record");
  } catch (error) {
    triggerToast(error instanceof Error ? error.message : "回忆提交失败");
  }
}

async function submitCorrection() {
  if (!ensureLoggedIn()) return;
  if (!correctionForm.text.trim()) {
    triggerToast("请填写纠错或补充的具体内容");
    return;
  }
  if (!correctionForm.evidence.trim()) {
    triggerToast("请填写核对佐证说明（如：新闻报道、原园方图鉴等）");
    return;
  }
  const animalName =
    animals.value.find((item) => item.id === correctionForm.animalId)?.name || "未知个体";
  const fieldLabel =
    correctionForm.field === "gender"
      ? "性别纠错"
      : correctionForm.field === "age"
        ? "出生年份/寿命纠错"
        : correctionForm.field === "timeline"
          ? "时间线大事件修正"
          : "其他资料修正";
  try {
    const details = `纠错详情：${correctionForm.text} | 佐证证据：${correctionForm.evidence} | 参考文献/来源：${correctionForm.citation || "暂无"}`;
    const response = await postApi<{ submission: ApiSubmission }>("/api/submissions", {
      type: "correction",
      animalId: correctionForm.animalId,
      animalName,
      title: `纠错申请：对“${animalName}”进行[${fieldLabel}]`,
      details,
      source: correctionForm.citation || correctionForm.evidence,
      payload: { field: correctionForm.field, evidence: correctionForm.evidence },
    });
    submissions.value.unshift(toSubmissionItem(response.submission));
    triggerToast("资料纠错已进入人工复核队列 🔍");
    goMain("record");
  } catch (error) {
    triggerToast(error instanceof Error ? error.message : "纠错提交失败");
  }
}

async function toggleMemoryLikeById(id: string) {
  if (!ensureLoggedIn()) return;
  const memory = publicMemories.value.find((item) => item.id === id);
  if (!memory) return;
  try {
    const result = await putApi<{ likes: number; hasLiked: boolean }>(`/api/memories/${id}/like`, { liked: !memory.hasLiked });
    memory.likes = result.likes;
    memory.hasLiked = result.hasLiked;
  } catch (error) {
    triggerToast(error instanceof Error ? error.message : "回忆点赞失败");
  }
}

async function addMemorialComment(animalId: string, content: string) {
  if (!ensureLoggedIn()) return;
  try {
    const result = await postApi<{ comment: MemorialCommentRecord }>("/api/memorial-comments", { animalId, content });
    memorialComments.value.unshift(result.comment);
    triggerToast("纪念寄语已保存");
  } catch (error) {
    triggerToast(error instanceof Error ? error.message : "寄语提交失败");
  }
}

async function toggleCommentFlower(commentId: string, flowered: boolean) {
  if (!ensureLoggedIn()) return;
  const comment = memorialComments.value.find((item) => item.id === commentId);
  if (!comment) return;
  try {
    const result = await putApi<{ flowers: number; hasFlowered: boolean }>(`/api/memorial-comments/${commentId}/flower`, { flowered });
    comment.flowers = result.flowers;
    comment.hasFlowered = result.hasFlowered;
    triggerToast(result.hasFlowered ? "献花成功" : "已取消献花");
  } catch (error) {
    triggerToast(error instanceof Error ? error.message : "献花操作失败");
  }
}

async function toggleObservationLike(animalId: string, observationId: string, liked: boolean) {
  if (!ensureLoggedIn()) return;
  const animal = animals.value.find((item) => item.id === animalId);
  const observation = animal?.observations.find((item) => item.id === observationId);
  if (!observation) return;
  try {
    const result = await putApi<{ likes: number; hasLiked: boolean }>(
      `/api/animals/${animalId}/observations/${observationId}/like`,
      { liked },
    );
    observation.likes = result.likes;
    observation.hasLiked = result.hasLiked;
  } catch (error) {
    triggerToast(error instanceof Error ? error.message : "观察点赞失败");
  }
}

async function lightCandle(animalId: string) {
  if (!ensureLoggedIn()) return;
  try {
    const result = await postApi<{ count: number; alreadyLit: boolean }>(`/api/animals/${animalId}/candles`);
    candledAnimals[animalId] = true;
    animalCandles[animalId] = result.count;
    triggerToast(result.alreadyLit ? "你今天已经为它点亮过烛光" : "一束温柔的烛光已点亮");
  } catch (error) {
    triggerToast(error instanceof Error ? error.message : "烛光点亮失败");
  }
}

async function toggleFavorite(animalId: string) {
  if (!ensureLoggedIn()) return;
  const currentlyFavorite = favoriteAnimals.value.some((item) => item.id === animalId);
  try {
    await putApi<{ favorite: boolean }>(`/api/favorites/${animalId}`, { favorite: !currentlyFavorite });
    if (currentlyFavorite) favoriteAnimals.value = favoriteAnimals.value.filter((item) => item.id !== animalId);
    else {
      const animal = animals.value.find((item) => item.id === animalId);
      if (animal) favoriteAnimals.value.unshift(animal);
    }
    triggerToast(currentlyFavorite ? "已取消收藏" : "已收藏这只动物");
  } catch (error) {
    triggerToast(error instanceof Error ? error.message : "收藏操作失败");
  }
}

function openWechatProfileSheet(enterHomeAfterLogin = false) {
  enterHomeAfterWechatLogin.value = enterHomeAfterLogin;
  if (currentUser.value.role !== "guest") {
    wechatProfileNickname.value = currentUser.value.nickname === "微信用户" ? "" : currentUser.value.nickname;
    wechatProfileAvatarRemote.value = currentUser.value.avatarUrl;
    wechatProfileAvatarPath.value = "";
  }
  showWechatLoginSheet.value = true;
}

function handleWechatAvatarChosen(event: any) {
  const avatarUrl = typeof event.detail?.avatarUrl === "string" ? event.detail.avatarUrl : "";
  if (!avatarUrl) {
    triggerToast("未能读取选择的微信头像，请重试");
    return;
  }
  wechatProfileAvatarPath.value = avatarUrl;
  wechatProfileAvatarRemote.value = "";
}

function downloadWechatAvatar(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    uni.downloadFile({
      url,
      timeout: 20000,
      success(result) {
        if (result.statusCode >= 200 && result.statusCode < 300 && result.tempFilePath) {
          resolve(result.tempFilePath);
          return;
        }
        reject(new Error(`微信头像下载失败（${result.statusCode}）`));
      },
      fail(error) {
        reject(new Error(error.errMsg || "微信头像下载失败"));
      },
    });
  });
}

async function uploadWechatAvatar(source: string): Promise<string> {
  if (source.startsWith("/uploads/")) return source;
  const isRemote = /^https?:\/\//i.test(source);
  const isWechatTemp = /^(wxfile:|file:)|^https?:\/\/tmp\//i.test(source);
  const filePath = isRemote && !isWechatTemp ? await downloadWechatAvatar(source) : source;
  return uploadMedia(filePath);
}

async function completeWechatLogin() {
  if (wechatAuthLoading.value) return;
  wechatProfileSaving.value = true;
  try {
    const wasGuest = currentUser.value.role === "guest";
    const nickname = wechatProfileNickname.value.trim();
    const avatarSource = wechatProfileAvatarPath.value || wechatProfileAvatarRemote.value;

    if (!nickname || !avatarSource) {
      triggerToast("请先选择微信头像并填写微信昵称");
      return;
    }

    let user = currentUser.value;
    if (user.role === "guest") {
      user = await auth.loginWithWechat({ nickname });
    }

    let storedAvatarUrl = user.avatarUrl;
    const shouldPersistAvatar = !avatarSource.startsWith("/uploads/");
    if (shouldPersistAvatar) {
      storedAvatarUrl = await uploadWechatAvatar(avatarSource);
    }

    user = await auth.updateWechatProfile({ nickname, avatarUrl: storedAvatarUrl });
    await Promise.all([loadPublicData(), loadPrivateData()]);
    showWechatLoginSheet.value = false;
    wechatProfileAvatarPath.value = "";
    wechatProfileAvatarRemote.value = user.avatarUrl;
    if (enterHomeAfterWechatLogin.value) goMain("home");
    enterHomeAfterWechatLogin.value = false;
    triggerToast(wasGuest ? `微信登录成功，欢迎 ${user.nickname}` : "微信头像和昵称已同步到后端");
  } catch (error) {
    triggerToast(error instanceof Error ? error.message : "微信登录或资料同步失败");
  } finally {
    wechatProfileSaving.value = false;
  }
}

function handleLogout() {
  auth.logout();
  favoriteAnimals.value = [];
  submissions.value = [];
  showWechatLoginSheet.value = false;
  triggerToast("已退出登录，请重新使用微信登录");
}

function shareCurrentAnimal(animalId: string) {
  const animal = animals.value.find((item) => item.id === animalId);
  if (!animal || !ensureLoggedIn()) return;
  selectedAnimalId.value = animalId;

  // #ifdef H5
  const shareUrl = `${window.location.origin}${window.location.pathname}#/?animalId=${encodeURIComponent(animal.id)}`;
  const shareData = {
    title: `${animal.name}的动物档案｜白狮阿杭计划`,
    text: animal.summary || animal.description,
    url: shareUrl,
  };
  if (navigator.share) {
    navigator.share(shareData).catch((error) => {
      if ((error as Error).name !== "AbortError") triggerToast("分享未完成，请稍后重试");
    });
  } else {
    uni.setClipboardData({
      data: shareUrl,
      success: () => triggerToast("档案链接已复制，可以分享给好友"),
      fail: () => triggerToast("未能复制分享链接，请稍后重试"),
    });
  }
  // #endif

  // #ifdef APP-PLUS
  uni.share({
    provider: "weixin",
    scene: "WXSceneSession",
    type: 0,
    href: `/pages/index/index?animalId=${encodeURIComponent(animal.id)}`,
    title: `${animal.name}的动物档案｜白狮阿杭计划`,
    summary: animal.summary || animal.description,
    imageUrl: animal.image || animal.coverUrl,
    fail: () => triggerToast("微信分享未完成，请稍后重试"),
  });
  // #endif
}

onShareAppMessage(() => {
  const animal = selectedAnimal.value;
  if (viewType.value === "animal_detail" && animal) {
    return {
      title: `${animal.name}的动物档案｜白狮阿杭计划`,
      path: `/pages/index/index?animalId=${encodeURIComponent(animal.id)}`,
      imageUrl: animal.image || animal.coverUrl,
    };
  }
  return { title: "白狮阿杭计划｜公众共建的动物个体数字档案馆", path: "/pages/index/index" };
});

onShareTimeline(() => {
  const animal = selectedAnimal.value;
  if (viewType.value === "animal_detail" && animal) {
    return {
      title: `${animal.name}的动物档案｜白狮阿杭计划`,
      query: `animalId=${encodeURIComponent(animal.id)}`,
      imageUrl: animal.image || animal.coverUrl,
    };
  }
  return { title: "白狮阿杭计划｜公众共建的动物个体数字档案馆" };
});

function openSubmission(item: SubmissionItem) {
  if (!ensureLoggedIn()) return;
  selectedSubmission.value = item;
  showSubmissionDetail.value = true;
}

function submissionStatusDescription(status: SubmissionItem["status"]) {
  const descriptions: Record<SubmissionItem["status"], string> = {
    submitted:
      "该投稿已安全录入，AI名录预识别系统正在提取文字中的时空标记、照片特征，随后将分发至对应动物展区的协作者队列。",
    pending:
      "系统正在等待人工审核。高级审核员将根据“双重排重数据库”与园方志书，核验图片出处、水印与版权状态。",
    need_supplement:
      "资料审核遇到卡点：由于该生命事件的时间戳或常驻馆舍与园方出入较大，急需补充票根翻拍、游客自拍或报纸电子版佐证。",
    candidate:
      "该条线索已经成功审核并计入“候选纪念大类”。一旦公众共建线索达到5条，将自动激活其数字纪念卡。",
    official:
      "恭喜！您上传的历史细节、见闻或图片，已顺利成为阿杭计划的正式守护档案时间轴。",
    rejected:
      "该条投稿由于不符合收录标准（如包含敏感环境照、明显版权风险、广告信息或非该动物园个体）未予采用。",
  };
  return descriptions[status];
}

function runAiScan(image: string, resultName: string, confidence: string) {
  if (!ensureLoggedIn()) return;
  aiState.status = "scanning";
  aiState.image = image;
  aiState.resultName = "";
  aiState.confidence = "";
  setTimeout(() => {
    aiState.status = "done";
    aiState.resultName = resultName;
    aiState.confidence = confidence;
    triggerToast("AI 识别比对完成");
  }, 900);
}

function useAiResultForRecommendation() {
  if (!ensureLoggedIn()) return;
  recommendForm.photo = aiState.image;
  recommendForm.name = aiState.resultName.replace(/[“”]/g, "").replace(/幼年记录|生日记录/g, "");
  recommendForm.species = "小熊猫";
  recommendForm.reasons.splice(0, recommendForm.reasons.length, "外貌特别");
  startRecommend();
  recommendStep.value = 2;
  triggerToast("识别线索已带入推荐建档表单，请继续核对");
}

async function submitExternalMemory() {
  if (!ensureLoggedIn()) return;
  if (!memoryUploadForm.description.trim()) {
    triggerToast("请填写内容说明");
    return;
  }
  try {
    const animal = animals.value.find((item) => item.id === memoryUploadForm.belongingAnimal);
    const response = await postApi<{ submission: ApiSubmission }>("/api/submissions", {
      type: "archive",
      animalId: memoryUploadForm.belongingAnimal,
      animalName: animal?.name || "待确认动物",
      title: memoryUploadForm.platform || "公众提供的历史资料",
      details: `${memoryUploadForm.platform ? `来自${memoryUploadForm.platform}：` : ""}${memoryUploadForm.description}`,
      source: memoryUploadForm.originalLink,
      copyright: memoryUploadForm.authorizationStatus,
      payload: { date: memoryUploadForm.publishTime || new Date().toISOString().slice(0, 10) },
    });
    submissions.value.unshift(toSubmissionItem(response.submission));
    showMemoryUploader.value = false;
    triggerToast("历史资料已进入版权与来源核验队列");
  } catch (error) {
    triggerToast(error instanceof Error ? error.message : "历史资料提交失败");
  }
}

async function submitTask() {
  if (!ensureLoggedIn()) return;
  if (taskForm.title.trim().length < 6) {
    triggerToast("请用至少 6 个字说明要共同寻找的问题");
    return;
  }
  if (taskForm.description.trim().length < 10 || taskForm.expectedInfo.trim().length < 5) {
    triggerToast("请补充任务背景和希望其他用户提供的资料");
    return;
  }
  try {
    const animal = animals.value.find((item) => item.id === taskForm.animalId);
    const response = await postApi<{ submission: ApiSubmission }>("/api/submissions", {
      type: "task",
      animalId: animal?.id,
      animalName: animal?.name || "不限特定动物",
      title: taskForm.title.trim(),
      details: taskForm.description.trim(),
      source: "用户发起的公开协作请求",
      copyright: "任务说明由发起人原创",
      payload: {
        expectedInfo: taskForm.expectedInfo.trim(),
        rewardLabel: taskForm.rewardLabel.trim() || "共同完善动物档案",
      },
    });
    submissions.value.unshift(toSubmissionItem(response.submission));
    openView("task_center");
    triggerToast("协作任务已提交，审核通过后其他用户即可看到并填写");
  } catch (error) {
    triggerToast(error instanceof Error ? error.message : "协作任务提交失败");
  }
}

async function submitTaskContribution() {
  if (!ensureLoggedIn() || !selectedTask.value) return;
  if (taskContributionForm.details.trim().length < 5) {
    triggerToast("请至少填写 5 个字的线索内容");
    return;
  }
  if (!taskContributionForm.copyrightConfirmed) {
    triggerToast("请确认资料真实性与公开使用授权");
    return;
  }
  try {
    const task = selectedTask.value;
    const mediaUrl = taskContributionForm.photo
      ? await uploadMedia(taskContributionForm.photo)
      : undefined;
    const response = await postApi<{ submission: ApiSubmission }>("/api/submissions", {
      type: "archive",
      animalId: task.animalId,
      animalName: task.animalName || "协作任务",
      title: `协作线索：${task.title}`,
      details: taskContributionForm.details.trim(),
      mediaUrl,
      source: taskContributionForm.source.trim() || "用户现场观察或个人资料",
      copyright: "提交者确认可用于非营利档案核验",
      payload: {
        taskId: task.id,
        taskTitle: task.title,
        date: new Date().toISOString().slice(0, 10),
      },
    });
    submissions.value.unshift(toSubmissionItem(response.submission));
    openView("task_center");
    triggerToast("线索已提交，审核通过后会计入任务进度");
  } catch (error) {
    triggerToast(error instanceof Error ? error.message : "协作线索提交失败");
  }
}

function backFromNested() {
  if (!ensureLoggedIn()) return;
  if (viewType.value === "animal_detail") {
    goMain(mainTab.value === "archives" ? "archives" : "home");
    return;
  }
  if (viewType.value === "my_submissions") {
    goMain("my");
    return;
  }
  if (viewType.value === "form_correction" && correctionReturnsToDetail.value) {
    correctionReturnsToDetail.value = false;
    viewType.value = "animal_detail";
    resetScroll();
    return;
  }
  goMain("record");
}

function protectedNotify(message: string) {
  if (!ensureLoggedIn()) return;
  triggerToast(message);
}

function openArchiveSearch() {
  if (!ensureLoggedIn()) return;
  triggerToast("已为您切换至档案列表，可在此搜索所有记录");
  goMain("archives");
}

function openSettings() {
  if (!ensureLoggedIn()) return;
  showSettings.value = true;
}

function openMemoryUploader() {
  if (!ensureLoggedIn()) return;
  showMemoryUploader.value = true;
}

const archiveFilters = [
  { id: "all", label: "全部" },
  { id: "in_zoo", label: "在园" },
  { id: "retired", label: "退休" },
  { id: "transferred", label: "转园" },
  { id: "deceased", label: "离世" },
  { id: "on_trip", label: "出差" },
  { id: "need_info", label: "资料待补充" },
];

const bottomTabs: Array<{ id: MainTab; label: string; icon?: UiImageIconName }> = [
  { id: "home", label: "首页", icon: "home" },
  { id: "archives", label: "动物档案", icon: "archive" },
  { id: "record", label: "" },
  { id: "memorial", label: "纪念广场", icon: "memorial" },
  { id: "my", label: "我的", icon: "profile" },
];

const observationBehaviors = [
  { id: "睡觉", label: "💤 睡觉" },
  { id: "进食", label: "🥩 进食" },
  { id: "行走", label: "🐾 行走" },
  { id: "玩耍", label: "⚽ 玩耍" },
  { id: "梳理", label: "✨ 梳理" },
  { id: "鸣叫", label: "📢 鸣叫" },
  { id: "与同伴互动", label: "👥 同伴互动" },
  { id: "与保育员互动", label: "👨‍🌾 保育员互动" },
  { id: "其他", label: "❓ 其他" },
];
</script>

<template>
  <view class="app-viewport">
    <view class="phone-shell" :style="phoneShellStyle">
      <view class="status-bar">
        <text>05:09</text>
        <view class="status-bar__right"><text>▥</text><text>5G</text><text>▰</text></view>
      </view>

      <view v-if="toastVisible" class="toast">
        <AhangIcon name="sparkle" :size="14" />
        <text>{{ toastText }}</text>
      </view>

      <scroll-view
        class="app-scroll"
        scroll-y
        :scroll-top="pageScrollTop"
        :show-scrollbar="false"
      >
        <view
          v-if="viewType === 'onboarding'"
          class="onboarding"
          @wheel="handleOnboardingWheel"
        >
          <button class="onboarding-skip" @click.stop="skipOnboarding">跳过</button>
          <swiper
            class="onboarding__swiper"
            :style="{ height: `${onboardingSwiperHeight}px` }"
            :current="onboardingStep - 1"
            :duration="280"
            :circular="false"
            @change="handleOnboardingSwiperChange"
          >
          <swiper-item class="onboarding__slide">
          <view class="onboarding__stage">
            <view class="onboarding-portrait">
              <image :src="ahangOnboardingMain" mode="aspectFill" />
            </view>
            <text class="brand-title brand-title--large">PROJECT AHANG</text>
            <text class="brand-cn brand-cn--red">白狮阿杭计划</text>
            <text class="onboarding-copy">一个公众共建的动物个体数字档案馆</text>
            <text class="onboarding-quote">“你的每一次遇见，都在帮助它们被记住。”</text>
          </view>
          </swiper-item>

          <swiper-item class="onboarding__slide">
          <view class="onboarding__stage">
            <view class="onboarding-symbol onboarding-symbol--green">
              <AhangIcon name="compass" :size="48" />
            </view>
            <text class="onboarding-heading">01. 认识</text>
            <text class="onboarding-copy onboarding-copy--wide">
              它们不只是冷冰冰的“非洲狮”或“黑熊”物种名，每一只在园动物都有属于自己的名字、独特经历和脾气习惯。
            </text>
            <view class="onboarding-preview-row">
              <view v-for="animal in animals.slice(0, 2)" :key="animal.id" class="mini-profile">
                <view class="mini-profile__avatar">{{ animal.name.charAt(0) }}</view>
                <view class="mini-profile__name"><text>{{ animal.name }}</text><text>({{ animal.species }})</text></view>
                <text class="mini-profile__meta">{{ animal.institution }} · {{ animal.statusLabel }}</text>
              </view>
            </view>
          </view>
          </swiper-item>

          <swiper-item class="onboarding__slide">
          <view class="onboarding__stage">
            <view class="onboarding-symbol onboarding-symbol--champagne">
              <AhangIcon name="camera" :size="48" />
            </view>
            <text class="onboarding-heading">02. 记录</text>
            <text class="onboarding-copy onboarding-copy--wide">
              随手拍下的日常照片、一次投喂的记录、或是它睡觉的位置，汇聚在一起，就是最珍贵的野生历史。
            </text>
            <view v-if="featuredAnimal" class="observation-preview">
              <view class="observation-preview__image">
                <AnimalImage :species="featuredAnimal.species" :src="featuredAnimal.image" />
              </view>
              <view>
                <text class="observation-preview__title">记录 {{ featuredAnimal.name }} 的一次真实相遇</text>
                <text class="observation-preview__meta">观察内容提交后进入审核</text>
              </view>
            </view>
          </view>
          </swiper-item>

          <swiper-item class="onboarding__slide">
          <view class="onboarding__stage">
            <view class="onboarding-symbol onboarding-symbol--red">
              <AhangIcon name="heart" :size="48" />
            </view>
            <text class="onboarding-heading">03. 共建</text>
            <text class="onboarding-copy onboarding-copy--wide">
              一个人记住，是回忆；很多人记住，就是充满温度的城市动物共同记忆。
            </text>
            <view class="onboarding-actions">
              <button class="button button--wechat" :loading="wechatAuthLoading" @click="openWechatProfileSheet(true)">
                <text class="wechat-mark">微</text>
                微信登录
              </button>
            </view>
          </view>
          </swiper-item>
          </swiper>

          <view class="onboarding__bottom">
            <view class="progress-dots">
              <view
                v-for="step in 4"
                :key="step"
                class="progress-dot"
                :class="{ 'progress-dot--active': onboardingStep === step }"
              />
            </view>
            <button
              v-if="onboardingStep < 4"
              class="button button--red"
              @click="nextOnboardingStep"
            >
              下一步
            </button>
          </view>
        </view>

        <view
          v-else
          class="page-stage"
        >
          <view v-if="viewType === 'main' && mainTab === 'home'" class="page page--home">
            <view class="home-header">
              <view>
                <text class="brand-title">PROJECT AHANG</text>
                <text class="brand-cn">白狮阿杭计划</text>
              </view>
              <view class="icon-actions">
                <button
                  class="icon-button"
                  aria-label="搜索"
                  @click="openArchiveSearch"
                >
                  <AhangIcon name="search" :size="18" />
                </button>
                <button
                  class="icon-button icon-button--notification"
                  aria-label="消息"
                  @click="protectedNotify(collaborationTasks.length ? `当前有 ${collaborationTasks.length} 个公开协作任务` : '当前没有新的协作消息')"
                >
                  <AhangIcon name="bell" :size="17" />
                  <view class="notification-dot" />
                </button>
              </view>
            </view>

            <button v-if="featuredAnimal" class="featured-card" @click="openAnimal(featuredAnimal.id)">
              <view class="featured-card__image">
                <AnimalImage
                  :species="featuredAnimal.species"
                  :src="featuredAnimal.image"
                  :alt="`今日认识一只动物 - ${featuredAnimal.name}`"
                />
                <text class="featured-label">今日推荐</text>
              </view>
              <view class="featured-card__body">
                <view class="featured-card__title-row">
                  <view class="inline">
                    <text class="featured-name">{{ featuredAnimal.name }}</text>
                    <text class="soft-tag">{{ featuredAnimal.species }}</text>
                    <text class="soft-tag">{{ featuredAnimal.gender }}</text>
                  </view>
                  <text class="life-span">{{ featuredAnimal.lifeSpan }}</text>
                </view>
                <view class="metadata-row">
                  <AhangIcon name="pin" :size="13" />
                  <text>{{ featuredAnimal.institution }}</text>
                </view>
                <text class="featured-summary">{{ featuredAnimal.summary || featuredAnimal.description }}</text>
                <view class="button button--red button--compact">进入它的档案</view>
              </view>
            </button>

            <view class="action-grid">
              <button class="action-card" @click="startRecommend">
                <view class="action-card__icon"><AhangIcon name="plus" :size="22" /></view>
                <view>
                  <text class="action-card__title">推荐一只动物</text>
                  <text class="action-card__copy">让更多人认识它</text>
                </view>
              </button>
              <button class="action-card" @click="startObservation()">
                <view class="action-card__icon"><AhangIcon name="camera" :size="21" /></view>
                <view>
                  <text class="action-card__title">上传一次观察</text>
                  <text class="action-card__copy">记录今天的相遇</text>
                </view>
              </button>
            </view>

            <view class="section">
              <view class="section-heading-row">
                <text class="section-kicker">最近新增记录</text>
                <button class="section-link" @click="goMain('archives')">全部 ›</button>
              </view>
              <scroll-view class="recent-row" scroll-x :show-scrollbar="false">
                <view class="recent-row__inner">
                  <button
                    v-for="animal in animals.slice(1, 4)"
                    :key="animal.id"
                    class="recent-card"
                    @click="openAnimal(animal.id)"
                  >
                    <view class="recent-card__image">
                      <AnimalImage :species="animal.species" :src="animal.image || animal.coverUrl" :alt="animal.name" />
                      <view class="recent-card__badge">
                        <StatusBadge :status="animal.status" :label="animal.statusLabel" />
                      </view>
                    </view>
                    <view class="recent-card__body">
                      <view class="inline">
                        <text class="recent-card__name">{{ animal.name }}</text>
                        <text v-if="animal.isTestData" class="test-tag">测试</text>
                      </view>
                      <text class="recent-card__species">{{ animal.species }}</text>
                    </view>
                  </button>
                </view>
              </scroll-view>
            </view>

            <view class="task-panel">
              <view class="task-panel__header">
                <view class="inline">
                  <AhangIcon name="help" :size="16" />
                  <text>正在寻找资料 (协作任务)</text>
                </view>
                <text class="urgent-tag">急需线索</text>
              </view>
              <button
                v-for="task in collaborationTasks.slice(0, 3)"
                :key="task.id"
                class="task-row"
                @click="openView('task_center')"
              >
                <view class="task-dot" />
                <view>
                  <text class="task-row__title">{{ task.title }}</text>
                  <text class="task-row__copy">{{ task.description }}</text>
                </view>
              </button>
            </view>

            <button v-if="animals.find((item) => item.memorialEnabled || item.status === 'deceased')" class="memorial-banner" @click="goMain('memorial')">
              <view>
                <text class="memorial-banner__title">🕯️ {{ animals.find((item) => item.memorialEnabled || item.status === 'deceased')?.name }} · 纪念页</text>
                <text class="memorial-banner__copy">每一份真实记录，都让它继续被记得</text>
              </view>
              <view class="memorial-banner__action">进入纪念广场</view>
            </button>
          </view>

          <view v-else-if="viewType === 'main' && mainTab === 'archives'" class="page">
            <view class="page-title-block">
              <text class="page-title">认识它们</text>
              <text class="page-subtitle">每一只动物，都有属于自己的故事。</text>
            </view>
            <view class="search-field">
              <AhangIcon name="search" :size="17" />
              <input
                v-model="archiveSearch"
                class="search-field__input"
                placeholder="搜索名字、物种、动物园或城市..."
                confirm-type="search"
              />
              <button v-if="archiveSearch" class="search-clear" @click="archiveSearch = ''">×</button>
            </view>
            <scroll-view class="filter-scroll" scroll-x :show-scrollbar="false">
              <view class="filter-scroll__inner">
                <button
                  v-for="filter in archiveFilters"
                  :key="filter.id"
                  class="filter-chip"
                  :class="{ 'filter-chip--active': archiveFilter === filter.id }"
                  @click="archiveFilter = filter.id"
                >
                  {{ filter.label }}
                </button>
              </view>
            </scroll-view>

            <view v-if="filteredAnimals.length" class="animal-list">
              <button
                v-for="animal in filteredAnimals"
                :key="animal.id"
                class="animal-list-card"
                @click="openAnimal(animal.id)"
              >
                <view class="animal-list-card__image">
                  <AnimalImage :species="animal.species" :src="animal.image || animal.coverUrl" :alt="animal.name" />
                  <view v-if="animal.verified" class="verified-mark">✓</view>
                </view>
                <view class="animal-list-card__body">
                  <view class="animal-list-card__top">
                    <view class="inline">
                      <text class="animal-list-card__name">{{ animal.name }}</text>
                      <text v-if="animal.isTestData" class="test-tag">测试</text>
                    </view>
                    <StatusBadge :status="animal.status" :label="animal.statusLabel" />
                  </view>
                  <view class="metadata-row">
                    <text>{{ animal.species }}</text>
                    <text>｜</text>
                    <AhangIcon name="pin" :size="12" />
                    <text>{{ animal.institution }}</text>
                  </view>
                  <text class="animal-list-card__summary">“{{ animal.summary || animal.description }}”</text>
                </view>
              </button>
            </view>
            <view v-else class="empty-state">
              <text class="empty-state__icon">⌕</text>
              <text class="empty-state__title">没有找到匹配档案</text>
              <text class="empty-state__copy">可以清除关键字或切换分类，也可以推荐一只新动物。</text>
              <button class="button button--red button--small" @click="startRecommend">推荐新动物</button>
            </view>
          </view>

          <RecordHubView
            v-else-if="viewType === 'main' && mainTab === 'record'"
            @recommend="startRecommend"
            @observe="startObservation()"
            @memory="openView('form_memory')"
            @correction="openCorrection()"
            @ai="openView('ai_helper')"
          />

          <MemorialPlazaView
            v-else-if="viewType === 'main' && mainTab === 'memorial'"
            :animals="animals"
            :comments="memorialComments"
            :candle-counts="animalCandles"
            @open-animal="openAnimal"
            @upload="openMemoryUploader"
            @notify="protectedNotify"
          />

          <ProfileView
            v-else-if="viewType === 'main' && mainTab === 'my'"
            :user="currentUser"
            :wechat-loading="wechatLoginLoading"
            :profile-stats="profileStats"
            :task-count="collaborationTasks.length"
            @wechat-login="openWechatProfileSheet(false)"
            @logout="handleLogout"
            @submissions="openView('my_submissions')"
            @favorites="openView('my_favorites')"
            @tasks="openView('task_center')"
            @settings="openSettings"
            @notify="protectedNotify"
          />

          <AnimalDetailView
            v-else-if="viewType === 'animal_detail' && selectedAnimal"
            :animal="selectedAnimal"
            :animals="animals"
            :species="selectedSpecies"
            :memories="publicMemories"
            :comments="memorialComments"
            :favorited="selectedAnimalFavorited"
            :logged-in="currentUser.role !== 'guest'"
            :candled="Boolean(candledAnimals[selectedAnimal.id])"
            :candle-count="animalCandles[selectedAnimal.id] || 0"
            @back="backFromNested"
            @correction="(id) => openCorrection(id, true)"
            @share="shareCurrentAnimal"
            @observe="startObservation"
            @open-animal="openAnimal"
            @notify="protectedNotify"
            @like-memory="toggleMemoryLikeById"
            @toggle-favorite="toggleFavorite"
            @light-candle="lightCandle"
            @add-comment="addMemorialComment"
            @flower-comment="toggleCommentFlower"
            @like-observation="toggleObservationLike"
          />

          <view v-else-if="viewType === 'recommend_animal'" class="page page--form">
            <view class="nested-header">
              <button @click="recommendSubmitted ? goMain('archives') : recommendStep > 1 ? recommendStep-- : goMain('record')"><UiImageIcon name="back" :size="24" tone="dark" /></button>
              <view><text>推荐新动物建档</text><text v-if="!recommendSubmitted">步骤 {{ recommendStep }} / 4</text></view>
              <button class="header-close" @click="goMain('record')">×</button>
            </view>
            <view v-if="recommendSubmitted" class="success-state">
              <view class="success-state__icon">✓</view>
              <text class="success-state__title">推荐资料已成功提交</text>
              <text class="success-state__copy">感谢您的认真记录！这只动物已进入候选档案，审核志愿者会核验地点、物种、照片与来源。</text>
              <view class="recommend-summary">
                <view><text>拟用名称 / 昵称</text><text>{{ recommendForm.dontKnowName ? "待核实" : (recommendForm.name || "未定") }}{{ recommendForm.nickname && !recommendForm.dontKnowName ? ` (${recommendForm.nickname})` : "" }}</text></view>
                <view><text>推荐物种</text><text>{{ recommendForm.dontKnowName ? "未知/待确定" : (recommendForm.species || "待核实") }}</text></view>
                <view><text>见到地点</text><text>{{ recommendForm.uncertainLocation ? "不确定地点" : `${recommendForm.city} · ${recommendForm.zoo} (${recommendForm.area})` }}</text></view>
                <view><text>推荐缘由</text><text>{{ recommendForm.reasons.join("、") }}</text></view>
              </view>
              <button class="button button--green" @click="goMain('archives')">查看候选动物档案</button>
              <button class="outline-button outline-button--full" @click="startRecommend">继续推荐另一只动物</button>
            </view>
            <view v-else class="step-progress">
              <view v-for="step in 4" :key="step" :class="{ active: recommendStep >= step }" />
            </view>

            <view v-if="!recommendSubmitted && recommendStep === 1" class="form-section">
              <text class="form-title">第一步：填写它的所在地</text>
              <text class="form-intro">输入地理定位，能帮助我们更精确地把观察数据归并在同一个动物园、同一展区中。</text>
              <button class="checkbox-row" @click="recommendForm.uncertainLocation = !recommendForm.uncertainLocation">
                <view :class="{ checked: recommendForm.uncertainLocation }">{{ recommendForm.uncertainLocation ? "✓" : "" }}</view>
                <view class="checkbox-copy"><text>我不确定具体地点 / 忘记在哪个园区了</text><text>勾选后将不强制填写下方地点字段，由审核志愿者核实</text></view>
              </button>
              <label class="field"><text>城市 {{ recommendForm.uncertainLocation ? "" : "*" }}</text><input v-model="recommendForm.city" :disabled="recommendForm.uncertainLocation" placeholder="如：广州市、深圳市、上海市" /></label>
              <label class="field"><text>动物园或机构名称 {{ recommendForm.uncertainLocation ? "" : "*" }}</text><input v-model="recommendForm.zoo" :disabled="recommendForm.uncertainLocation" placeholder="如：广州动物园、深圳野生动物园、越秀公园" /></label>
              <label class="field"><text>具体生活展区 / 馆舍名 {{ recommendForm.uncertainLocation ? "" : "*" }}</text><input v-model="recommendForm.area" :disabled="recommendForm.uncertainLocation" placeholder="如：熊区、狮虎山、大熊猫馆、东门水禽湖" /></label>
            </view>

            <view v-else-if="!recommendSubmitted && recommendStep === 2" class="form-section">
              <text class="form-title">第二步：它是谁？</text>
              <text class="form-intro">如果知道它的名字、物种等信息请尽量提供，如完全不了解，也可以一键标记为不知道。</text>
              <button class="checkbox-row" @click="recommendForm.dontKnowName = !recommendForm.dontKnowName">
                <view :class="{ checked: recommendForm.dontKnowName }">{{ recommendForm.dontKnowName ? "✓" : "" }}</view>
                <view class="checkbox-copy"><text>我不知道它是哪种动物，也没有任何名字线索</text><text>勾选后下方信息非必填，我们将交由专家和社区观察员帮您核实鉴定</text></view>
              </button>
              <label class="field"><text>它的名字 / 称呼</text><input v-model="recommendForm.name" :disabled="recommendForm.dontKnowName" placeholder="如：迪迪、老大、大耳朵（若无固定称呼可不填）" /></label>
              <label class="field"><text>它的昵称 / 别名</text><input v-model="recommendForm.nickname" :disabled="recommendForm.dontKnowName" placeholder="如：齐刘海熊、偏分帅哥、广州一哥" /></label>
              <label class="field"><text>物种名称 {{ recommendForm.dontKnowName ? "" : "*" }}</text><input v-model="recommendForm.species" :disabled="recommendForm.dontKnowName" placeholder="如：亚洲黑熊、金丝猴、华南虎、非洲狮" /></label>
              <view class="field">
                <text>性别</text>
                <view class="choice-row">
                  <button v-for="gender in ['雄性', '雌性', '未知']" :key="gender" :disabled="recommendForm.dontKnowName" :class="{ active: recommendForm.dontKnowName ? gender === '未知' : recommendForm.gender === gender }" @click="recommendForm.gender = gender">{{ gender }}</button>
                </view>
              </view>
              <view class="duplicate-hint">
                <text>发现可能重复的候选档案</text>
                <text>系统检索到您推荐的地区「{{ recommendForm.zoo || "广州动物园" }}」可能已有符合描述的动物。推荐前建议先核实，避免数据重复。</text>
              </view>
            </view>

            <view v-else-if="!recommendSubmitted && recommendStep === 3" class="form-section">
              <text class="form-title">第三步：为什么希望大家认识它</text>
              <text class="form-intro">选择希望为它建档的特殊缘由，并写下你们的故事或它的独特个性。</text>
              <view class="field">
                <text>它有什么特别之处？（可多选）</text>
                <view class="reason-list">
                  <button
                    v-for="item in [
                      { label: '外貌特别', desc: '外观极其独特（如偏分发型、不对称斑纹等）' },
                      { label: '行为特别', desc: '有特殊行为习惯或标志性绝活' },
                      { label: '有特别经历', desc: '有家喻户晓的繁育故事或救助经历' },
                      { label: '陪伴城市很多年', desc: '见证了几代游客的成长，拥有深厚街坊情结' },
                      { label: '正在退休或养老', desc: '高龄退休动物，属于需要安静重点呵护对象' },
                      { label: '很少有人关注', desc: '在偏僻展区，平日缺乏游客来访与关注' },
                      { label: '其他', desc: '具有独特的建档研究科普价值' },
                    ]"
                    :key="item.label"
                    :class="{ active: recommendForm.reasons.includes(item.label) }"
                    @click="toggleRecommendReason(item.label)"
                  >
                    <view class="checkbox-mark">{{ recommendForm.reasons.includes(item.label) ? "✓" : "" }}</view>
                    <view><text>{{ item.label }}</text><text>{{ item.desc }}</text></view>
                  </button>
                </view>
              </view>
              <label class="field">
                <view class="field-label-row"><text>写写你和它的故事 / 习性见闻（必填）</text><text>{{ recommendForm.story.length }} / 500 字</text></view>
                <textarea v-model="recommendForm.story" placeholder="如：它下午三点喜欢在木架上打哈欠；左耳朵有一个小小的豁口；它陪伴了我们很久，希望大家去熊区的时候能认出它……" maxlength="500" />
              </label>
            </view>

            <view v-else-if="!recommendSubmitted" class="form-section">
              <text class="form-title">第四步：上传佐证与版权确认</text>
              <text class="form-intro">上传第一张建立该档案的基础实拍佐证照，并附带公开新闻、版权等保障声明。</text>
              <label class="field">
                <text>动物实拍图（必选）</text>
                <button class="upload-zone" @click="chooseImage('recommend')">
                  <image v-if="recommendForm.photo" :src="recommendForm.photo" mode="aspectFill" />
                  <view v-else><AhangIcon name="upload" :size="28" /><text>拍摄或选择该动物的实拍图</text><text>支持相册选择或现场拍摄</text></view>
                </button>
              </label>
              <label class="field"><text>公开来源 / 新闻线索（选填）</text><input v-model="recommendForm.sourceLink" placeholder="如：微信公众号推文链接、官方微博报道、新闻网址" /></label>
              <view class="license-options">
                <button v-for="item in [
                  { id: 'self', title: '本人原创自拍', copy: '由本人拍摄，可用于非营利档案展示' },
                  { id: 'authorized', title: '已获作者授权', copy: '已取得原作者公开展示许可' },
                  { id: 'cue_only', title: '仅后台线索', copy: '只供审核核验，不公开展示原图' },
                ]" :key="item.id" :class="{ active: recommendForm.copyright === item.id }" @click="recommendForm.copyright = item.id">
                  <view class="radio-dot" /><view><text>{{ item.title }}</text><text>{{ item.copy }}</text></view>
                </button>
              </view>
              <button class="checkbox-row" @click="recommendForm.authorized = !recommendForm.authorized">
                <view :class="{ checked: recommendForm.authorized }">{{ recommendForm.authorized ? "✓" : "" }}</view>
                <text>我承诺资料符合客观事实，并授权「阿杭计划」按上述范围用于非营利动物档案与科普。</text>
              </button>
              <view class="recommend-summary">
                <text class="recommend-summary__title">请核对建档完整摘要（提交前预览）</text>
                <view><text>1. 地点位置</text><text>{{ recommendForm.uncertainLocation ? "地点不确定（待核实）" : `${recommendForm.city} · ${recommendForm.zoo} (${recommendForm.area})` }}</text></view>
                <view><text>2. 拟定名称</text><text>{{ recommendForm.dontKnowName ? "待核实" : `${recommendForm.name || "未命名"} (${recommendForm.nickname || "无昵称"})` }}</text></view>
                <view><text>3. 物种及性别</text><text>{{ recommendForm.dontKnowName ? "待鉴定" : `${recommendForm.species} · ${recommendForm.gender}` }}</text></view>
                <view><text>4. 建档标签</text><text>{{ recommendForm.reasons.join("、") || "未勾选" }}</text></view>
                <view><text>5. 故事/见闻（{{ recommendForm.story.length }}字）</text><text>“{{ recommendForm.story || "暂未填写故事描述..." }}”</text></view>
                <view><text>6. 佐证照片</text><text>{{ recommendForm.photo ? "● 已上传（预览可用）" : "● 未上传" }}</text></view>
                <view><text>7. 版权归属 & 协议</text><text>{{ recommendForm.copyright === "self" ? "本人原创自拍" : recommendForm.copyright === "authorized" ? "已获作者授权" : "仅后台线索" }}{{ recommendForm.authorized ? "（协议已同意）" : "（未同意协议）" }}</text></view>
              </view>
            </view>

            <view v-if="!recommendSubmitted" class="form-footer">
              <button v-if="recommendStep < 4" class="button button--red" @click="nextRecommendStep">继续</button>
              <button v-else class="button button--green" @click="submitRecommendation">提交推荐</button>
            </view>
          </view>

          <view v-else-if="viewType === 'form_observation'" class="page page--form">
            <view class="nested-header">
              <button @click="observationStep > 1 && !observationSubmitted ? observationStep-- : goMain('record')"><UiImageIcon name="back" :size="24" tone="dark" /></button>
              <view><text>上传一次观察</text><text v-if="!observationSubmitted">记录大自然老朋友们每日的生活印记 · 步骤 {{ observationStep }} / 5</text></view>
              <button class="header-close" @click="goMain('record')">×</button>
            </view>
            <view v-if="!observationSubmitted" class="step-progress">
              <view v-for="step in 5" :key="step" :class="{ active: observationStep >= step }" />
            </view>

            <view v-if="observationSubmitted" class="success-state">
              <view class="success-state__icon">✓</view>
              <text class="success-state__title">观察记录已提交</text>
              <text class="success-state__copy">资料已进入审核队列，并同步保存到“我的投稿”。</text>
              <button class="button button--green" @click="openAnimal(observationForm.animalId, 'observations')">查看动物档案</button>
              <button class="outline-button outline-button--full" @click="goMain('record')">返回记录页</button>
            </view>

            <view v-else-if="observationStep === 1" class="form-section">
              <text class="form-title">最近查看的动物</text>
              <text class="form-intro">先从最近查看中快速选择，也可以搜索全部在园动物。</text>
              <view class="animal-choice-list">
                <button v-for="animal in animals.slice(0, 3)" :key="animal.id" :class="{ active: observationForm.animalId === animal.id }" @click="observationForm.animalId = animal.id">
                  <view class="animal-choice-list__image"><AnimalImage :species="animal.species" :src="animal.image" /></view>
                  <view><text>{{ animal.name }}</text><text>{{ animal.species }} · {{ animal.institution }}</text></view>
                  <view class="radio-dot" />
                </button>
              </view>
              <text class="form-subtitle">搜索或选择在园动物</text>
              <view class="search-field">
                <AhangIcon name="search" :size="16" />
                <input v-model="observationSearch" class="search-field__input" placeholder="输入动物名称或物种进行快速检索..." />
              </view>
              <view class="animal-choice-list animal-choice-list--compact">
                <button v-for="animal in filteredObservationAnimals" :key="`all-${animal.id}`" :class="{ active: observationForm.animalId === animal.id }" @click="observationForm.animalId = animal.id">
                  <view class="animal-choice-list__image"><AnimalImage :species="animal.species" :src="animal.image" /></view>
                  <view><view class="animal-choice-name"><text>{{ animal.name }}</text><text v-if="animal.isTestData">测试</text></view><text>{{ animal.species }} · {{ animal.institution }}</text></view>
                  <view class="radio-dot" />
                </button>
              </view>
            </view>

            <view v-else-if="observationStep === 2" class="form-section">
              <text class="form-title">什么时候、在哪里？</text>
              <view class="two-column-fields">
                <label class="field"><text>观察日期</text><input v-model="observationForm.date" type="date" /></label>
                <label class="field"><text>大约时间</text><input v-model="observationForm.time" type="time" /></label>
              </view>
              <view class="field">
                <text>快捷选择时间段</text>
                <view class="choice-row choice-row--wrap">
                  <button v-for="time in [
                    { value: '10:00', label: '上午游园' },
                    { value: '12:30', label: '中午开饭' },
                    { value: '15:00', label: '下午活跃' },
                    { value: '18:00', label: '傍晚闭馆' },
                  ]" :key="time.value" :class="{ active: observationForm.time === time.value }" @click="observationForm.time = time.value; triggerToast(`时间已设置为 ${time.value}`)">{{ time.label }} ({{ time.value }})</button>
                </view>
              </view>
              <label class="field"><text>观察地点</text><input v-model="observationForm.location" placeholder="例如：广州动物园 狮虎山斜坡下" /><text class="field-hint">系统已根据选定个体自动匹配推荐场馆</text></label>
              <view class="field">
                <text>行为标签（可多选）</text>
                <view class="choice-row choice-row--wrap">
                  <button v-for="behavior in observationBehaviors" :key="behavior.id" :class="{ active: observationForm.behaviors.includes(behavior.id) }" @click="toggleBehavior(behavior.id)">{{ behavior.label }}</button>
                </view>
              </view>
            </view>

            <view v-else-if="observationStep === 3" class="form-section">
              <text class="form-title">补充现场细节</text>
              <view class="question-card">
                <text>1. 是否看到丰容设施？</text>
                <text>丰容包括：木头、枯树枝、栖架、水池、玩具、冰块等物理或食物丰容设施。</text>
                <view class="choice-row"><button :class="{ active: observationForm.enrichment === 'yes' }" @click="observationForm.enrichment = 'yes'"><text>是（看到了）</text><text>有玩具或专门架设的玩乐设施</text></button><button :class="{ active: observationForm.enrichment === 'no' }" @click="observationForm.enrichment = 'no'"><text>否（没有看到）</text><text>未见明显的丰容玩具</text></button></view>
              </view>
              <view class="question-card">
                <text>2. 是否与其他动物互动？</text>
                <text>包括与其他同伴个体的打闹、对视、追逐、依偎等亲密或警惕行为。</text>
                <view class="choice-row"><button :class="{ active: observationForm.interaction === 'yes' }" @click="observationForm.interaction = 'yes'"><text>是（有互动）</text><text>与同馆伙伴有交流或依偎对视</text></button><button :class="{ active: observationForm.interaction === 'no' }" @click="observationForm.interaction = 'no'"><text>否（各自活动）</text><text>独处休息或各自散步</text></button></view>
              </view>
            </view>

            <view v-else-if="observationStep === 4" class="form-section">
              <text class="form-title">一句话描述与照片</text>
              <label class="field"><view class="field-label-row"><text>1. 一句话日常描述（不超过300字）</text><text>{{ observationForm.description.length }} / 300</text></view><textarea v-model="observationForm.description" placeholder="用一两句话描述今天看到它时的神态、活动细节，或有趣的小动作……" maxlength="300" /></label>
              <text class="form-subtitle">2. 上传今天在现场拍的照片（支持预览）</text>
              <button class="upload-zone upload-zone--short" @click="chooseImage('observation')">
                <image v-if="observationForm.photo" :src="observationForm.photo" mode="aspectFill" />
                <view v-else><AhangIcon name="camera" :size="26" /><text>点击上传现场照片或选择相册</text><text>支持实时预览</text></view>
              </button>
            </view>

            <view v-else class="form-section">
              <view class="observation-summary">
                <view class="section-heading-row"><text>观察投稿摘要预览</text><text>待确认提交</text></view>
                <view><text>观察个体</text><text>{{ animals.find((item) => item.id === observationForm.animalId)?.name }}</text></view>
                <view><text>时间</text><text>{{ observationForm.date }} {{ observationForm.time }}</text></view>
                <view><text>观察地点</text><text>{{ observationForm.location }}</text></view>
                <view><text>行为标签</text><text>{{ observationForm.behaviors.join("、") }}</text></view>
                <view><text>丰容设施</text><text>{{ observationForm.enrichment === "yes" ? "✓ 看到丰容设施" : "✗ 未看到" }}</text></view>
                <view><text>同伴互动</text><text>{{ observationForm.interaction === "yes" ? "✓ 有与其他动物互动" : "✗ 独自活动" }}</text></view>
                <view><text>一句话描述</text><text>“{{ observationForm.description }}”</text></view>
              </view>
              <text class="form-title">3. 确认版权条款（必选）</text>
              <button class="checkbox-row" @click="observationForm.copyrightSelf = !observationForm.copyrightSelf">
                <view :class="{ checked: observationForm.copyrightSelf }">{{ observationForm.copyrightSelf ? "✓" : "" }}</view>
                <view class="checkbox-copy"><text>确认本人拍摄</text><text>该照片及文字资料为我亲自在动物园实地采集，享有完整的合法版权权益。</text></view>
              </button>
              <button class="checkbox-row" @click="observationForm.archiveOnly = !observationForm.archiveOnly">
                <view :class="{ checked: observationForm.archiveOnly }">{{ observationForm.archiveOnly ? "✓" : "" }}</view>
                <view class="checkbox-copy"><text>仅用于档案展示授权</text><text>授权本平台将其收录并免费对外展示，不转授权他人，不用于任何直接商业用途。</text></view>
              </button>
              <button class="checkbox-row" @click="observationForm.publicWelfare = !observationForm.publicWelfare">
                <view :class="{ checked: observationForm.publicWelfare }">{{ observationForm.publicWelfare ? "✓" : "" }}</view>
                <view class="checkbox-copy"><text>允许公益与科普宣传</text><text>授权阿杭计划和有关保护组织免费用于非营利性的动物保护与公益科普宣传。</text></view>
              </button>
            </view>

            <view v-if="!observationSubmitted" class="form-footer">
              <button v-if="observationStep < 5" class="button button--red" @click="nextObservationStep">继续</button>
              <button v-else class="button button--green" @click="submitObservation">提交观察记录</button>
            </view>
          </view>

          <view v-else-if="viewType === 'form_memory'" class="page page--form">
            <view class="nested-header">
              <button @click="backFromNested"><UiImageIcon name="back" :size="24" tone="dark" /></button>
              <view><text>分享一段回忆</text><text>上传过去的照片或故事</text></view>
              <view />
            </view>
            <view class="form-section">
              <label class="field">
                <text>1. 追忆的个体对象</text>
                <picker :range="memoryAnimalOptions" range-key="name" @change="memoryForm.animalId = memoryAnimalOptions[$event.detail.value].id">
                  <view class="picker-field">{{ memoryAnimalOptions.find((item) => item.id === memoryForm.animalId)?.name || "请选择" }} ›</view>
                </picker>
              </label>
              <label v-if="memoryForm.animalId === 'custom'" class="field"><text>自定义对象名字</text><input v-model="memoryForm.customAnimalName" placeholder="如：白狮“阿杭”、小熊猫“迪迪”" /></label>
              <label class="field"><text>2. 回忆发生的大致时间</text><input v-model="memoryForm.date" type="month" /></label>
              <label class="field"><text>3. 故事标题</text><input v-model="memoryForm.title" placeholder="如：九十年代去广州动物园，那只难忘的大熊猫" /></label>
              <label class="field"><text>4. 温情故事 / 游园旧事</text><textarea v-model="memoryForm.text" placeholder="写下它给您留下的深刻印象、旧时趣事或它离去对您的感触。那些压在箱底的故事，都是生命温存的证言……" maxlength="1000" /></label>
              <text class="form-subtitle">5. 珍贵旧照/老门票（点击选择）</text>
              <button class="upload-zone upload-zone--short" @click="chooseImage('memory')">
                <image v-if="memoryForm.photo" :src="memoryForm.photo" mode="aspectFill" />
                <view v-else><AhangIcon name="heart" :size="26" /><text>选择历史照片 / 纸质照片翻拍</text><text>泛黄的游园回忆同样珍贵</text></view>
              </button>
              <button class="button button--amber" @click="submitMemory">发布回忆，让爱留存 🕯️</button>
            </view>
          </view>

          <view v-else-if="viewType === 'form_correction'" class="page page--form">
            <view class="nested-header">
              <button @click="backFromNested"><UiImageIcon name="back" :size="24" tone="dark" /></button>
              <view><text>补充或纠正资料</text><text>让已有档案更加准确</text></view>
              <view />
            </view>
            <view class="form-section">
              <label class="field">
                <text>1. 指向的已有档案个体</text>
                <picker :range="animals" range-key="name" @change="correctionForm.animalId = animals[$event.detail.value].id">
                  <view class="picker-field">{{ animals.find((item) => item.id === correctionForm.animalId)?.name || "请选择" }} ›</view>
                </picker>
              </label>
              <view class="field">
                <text>2. 纠错/补充的版块分类</text>
                <view class="choice-row choice-row--wrap">
                  <button v-for="field in [
                    { id: 'gender', label: '性别有误' },
                    { id: 'age', label: '寿命/生卒年份' },
                    { id: 'timeline', label: '时间线大事件' },
                    { id: 'other', label: '名称或常驻习性' },
                  ]" :key="field.id" :class="{ active: correctionForm.field === field.id }" @click="correctionForm.field = field.id">{{ field.label }}</button>
                </view>
              </view>
              <label class="field"><text>3. 请指出具体谬误并提供正确表述</text><textarea v-model="correctionForm.text" placeholder="例如：时间线上写的2026年3月阿杭转院是错的，应为2026年1月，并且它是退休而不是转院。" maxlength="800" /></label>
              <label class="field"><text>4. 佐证依据 / 核实说明（必填）</text><textarea v-model="correctionForm.evidence" placeholder="例如：我这里有2026年1月原园方公众号发布的退休公告推文截图……" maxlength="500" /></label>
              <label class="field"><text>5. 参考文献或推文链接（选填）</text><input v-model="correctionForm.citation" placeholder="如：http://mp.weixin.qq.com/..." /></label>
              <button class="button button--green" @click="submitCorrection">提交纠错申请，开启众包复核</button>
            </view>
          </view>

          <view v-else-if="viewType === 'ai_helper'" class="page page--ai">
            <view class="nested-header">
              <button @click="goMain('record')"><UiImageIcon name="back" :size="24" tone="dark" /></button>
              <view><text>AI 辅助识别判断</text><text>上传一张照片，让系统自动识别</text></view>
              <view />
            </view>
            <view class="ai-intro">
              <view class="ai-intro__mark"><AhangIcon name="ai" :size="32" /></view>
              <view>
                <text>💡 体验指南：</text>
                <text>我们收集了各大动物园明星个体的局部特写数据。您可以点击下方示例照片，我们将通过局部条纹、脸部特征和耳朵缺口帮您智能比对。</text>
              </view>
            </view>
            <text class="form-subtitle">点击下方实拍照片体验 AI 识别：</text>
            <view class="ai-samples">
              <button v-for="animal in animals.slice(0, 3)" :key="animal.id" @click="runAiScan(animal.image, animal.name, '档案图片')"><image :src="animal.image" mode="aspectFill" /><text>{{ animal.name }} · 档案图片</text></button>
            </view>
            <view v-if="aiState.status !== 'idle'" class="ai-result">
              <image :src="aiState.image" mode="aspectFill" />
              <view v-if="aiState.status === 'scanning'" class="ai-result__scanning">
                <view class="scan-line" />
                <text>正在比对毛色、脸部斑纹与历史档案...</text>
              </view>
              <view v-else class="ai-result__done">
                <view class="section-heading-row"><text class="ai-result__label">智能比对报告</text><text>置信度: {{ aiState.confidence }}</text></view>
                <text class="ai-result__name">{{ aiState.resultName }}</text>
                <text class="ai-result__confidence">常驻馆舍：广州动物园 · 小熊猫馆</text>
                <text class="ai-result__note">核心特征识别：眼周白斑、耳缘毛色与面部斑纹高度吻合历史档案。结果只作为审核线索，最终结论仍需结合拍摄时间、地点与人工复核。</text>
                <button class="button button--green button--small" @click="useAiResultForRecommendation">将识别结果用于推荐建档</button>
              </view>
            </view>
          </view>

          <view v-else-if="viewType === 'my_submissions'" class="page">
            <view class="nested-header">
              <button @click="goMain('my')"><UiImageIcon name="back" :size="24" tone="dark" /></button>
              <view><text>我的投稿</text><text>查看审核进度与反馈</text></view>
              <text class="submission-total">共 {{ submissions.length }} 笔投稿</text>
            </view>
            <view class="submission-filter">
              <text>状态分类</text>
              <scroll-view class="filter-scroll" scroll-x :show-scrollbar="false">
                <view class="filter-scroll__inner">
                  <button
                    v-for="filter in [
                      { id: 'all', label: '全部' },
                      { id: 'submitted', label: '已提交' },
                      { id: 'pending', label: '等待人工审核' },
                      { id: 'need_supplement', label: '需要补充' },
                      { id: 'candidate', label: '已收入候选档案' },
                      { id: 'official', label: '已成为正式记录' },
                      { id: 'rejected', label: '未采用' },
                    ]"
                    :key="filter.id"
                    class="filter-chip"
                    :class="{ 'filter-chip--active': submissionStatusFilter === filter.id }"
                    @click="submissionStatusFilter = filter.id"
                  >
                    {{ filter.label }}
                    <text>{{ filter.id === "all" ? submissions.length : submissions.filter((item) => item.status === filter.id).length }}</text>
                  </button>
                </view>
              </scroll-view>
            </view>
            <view class="submission-list">
              <button v-for="item in filteredSubmissions" :key="item.id" class="submission-card" @click="openSubmission(item)">
                <view class="submission-card__top">
                  <text class="submission-type">单号: {{ item.id }} · {{ item.submittedAt }}</text>
                  <text class="submission-status" :class="`submission-status--${item.status}`">{{ item.statusLabel }}</text>
                </view>
                <view class="submission-card__main">
                  <image v-if="item.photo" class="submission-card__photo" :src="item.photo" mode="aspectFill" />
                  <view>
                    <text class="submission-card__title">{{ item.title }}</text>
                    <text class="submission-card__copy">{{ item.details }}</text>
                    <text class="submission-card__animal">对应动物: {{ item.animalName }}</text>
                  </view>
                </view>
                <view v-if="item.adminComment" class="admin-comment">
                  <text>管理员反馈:</text><text>{{ item.adminComment }}</text>
                </view>
                <view class="submission-card__footer">
                  <text>版权: {{ item.copyright || "待核验" }}</text>
                  <text>点击查看详情 ›</text>
                </view>
              </button>
              <view v-if="!filteredSubmissions.length" class="empty-state empty-state--small">
                <text>🌱</text>
                <text>该分类下暂无您的投稿历史</text>
              </view>
            </view>
          </view>

          <view v-else-if="viewType === 'my_favorites'" class="page">
            <view class="nested-header">
              <button @click="goMain('my')"><UiImageIcon name="back" :size="24" tone="dark" /></button>
              <view><text>我的收藏</text><text>随时回到牵挂的动物档案</text></view>
              <text class="submission-total">共 {{ favoriteAnimals.length }} 只</text>
            </view>
            <view v-if="favoriteAnimals.length" class="animal-list favorites-list">
              <button v-for="animal in favoriteAnimals" :key="animal.id" class="animal-list-card" @click="openAnimal(animal.id)">
                <view class="animal-list-card__image"><AnimalImage :species="animal.species" :src="animal.image" :alt="animal.name" /></view>
                <view class="animal-list-card__body">
                  <view class="animal-list-card__top"><text class="animal-list-card__name">{{ animal.name }}</text><StatusBadge :status="animal.status" :label="animal.statusLabel" /></view>
                  <text class="animal-list-card__summary">{{ animal.species }} · {{ animal.institution }}</text>
                </view>
              </button>
            </view>
            <view v-else class="empty-state"><text class="empty-state__icon">♡</text><text class="empty-state__title">还没有收藏动物</text><text class="empty-state__copy">进入动物档案后，点击右上角爱心即可收藏。</text><button class="button button--green button--small" @click="goMain('archives')">浏览动物档案</button></view>
          </view>

          <view v-else-if="viewType === 'task_center'" class="page">
            <view class="nested-header nested-header--action">
              <button @click="goMain('home')"><UiImageIcon name="back" :size="24" tone="dark" /></button>
              <view><text>待补充线索任务中心</text></view>
              <button class="header-text-action" @click="startTask">发起任务</button>
            </view>
            <view class="task-center-intro">
              <text>一起找答案 🔍</text>
              <text>任何登录用户都可以发起协作任务；审核通过后其他用户即可填写线索，线索也会经过审核再计入进度。</text>
              <button class="button button--green button--small" @click="startTask">＋ 发起新的协作任务</button>
            </view>
            <view class="task-center-list">
              <view v-for="task in collaborationTasks" :key="task.id" class="task-center-card">
                <view class="task-center-card__top"><text class="task-center-tag">用户协作</text><text>由 {{ task.creatorName || '公众协作者' }} 发起</text></view>
                <text class="task-center-card__title">{{ task.title }}</text>
                <text class="task-center-card__copy">{{ task.description }}</text>
                <view v-if="task.expectedInfo" class="task-expected"><text>希望获得</text><text>{{ task.expectedInfo }}</text></view>
                <view class="task-center-card__stats">
                  <view><text>奖励</text><text>{{ task.rewardLabel }}</text></view>
                  <view><text>进度</text><text>{{ task.progressText }}</text></view>
                </view>
                <button class="button button--green button--small" @click="openTaskContribution(task)">{{ task.actionText }}</button>
              </view>
            </view>
          </view>

          <view v-else-if="viewType === 'form_task'" class="page page--form page--single-form">
            <view class="nested-header">
              <button @click="openView('task_center')"><UiImageIcon name="back" :size="24" tone="dark" /></button>
              <view><text>发起协作任务</text><text>邀请其他用户共同补全资料</text></view>
              <button class="header-close" @click="openView('task_center')">×</button>
            </view>
            <view class="form-section">
              <view class="collaboration-form-note"><text>发起后不会立即公开</text><text>管理端会先核对任务是否清晰、合法且与动物档案相关，通过后才会出现在任务中心。</text></view>
              <label class="field">
                <text>关联动物（选填）</text>
                <picker :range="taskAnimalOptions" range-key="name" @change="taskForm.animalId = taskAnimalOptions[$event.detail.value].id">
                  <view class="picker-field">{{ animals.find((item) => item.id === taskForm.animalId)?.name || '不限特定动物' }} ›</view>
                </picker>
              </label>
              <label class="field"><text>任务标题 *</text><input v-model="taskForm.title" placeholder="例如：寻找阿杭初到广州的准确日期" maxlength="80" /></label>
              <label class="field"><text>背景说明 *</text><textarea v-model="taskForm.description" placeholder="说明目前已知的信息、仍存在的疑问，以及为什么需要大家协助。" maxlength="600" /></label>
              <label class="field"><text>希望其他用户提供什么 *</text><textarea v-model="taskForm.expectedInfo" placeholder="例如：带日期的新闻截图、旧门票、照片原图或公开资料链接。" maxlength="300" /></label>
              <label class="field"><text>协作奖励说明</text><input v-model="taskForm.rewardLabel" placeholder="例如：共同署名、贡献度 +20" maxlength="60" /></label>
              <button class="button button--green" @click="submitTask">提交任务等待审核</button>
            </view>
          </view>

          <view v-else-if="viewType === 'form_task_contribution'" class="page page--form page--single-form">
            <view class="nested-header">
              <button @click="openView('task_center')"><UiImageIcon name="back" :size="24" tone="dark" /></button>
              <view><text>填写协作线索</text><text>{{ selectedTask?.title || '协作任务' }}</text></view>
              <button class="header-close" @click="openView('task_center')">×</button>
            </view>
            <view v-if="selectedTask" class="form-section">
              <view class="task-context-card"><text>{{ selectedTask.title }}</text><text>{{ selectedTask.expectedInfo || selectedTask.description }}</text></view>
              <label class="field"><text>你掌握的线索 *</text><textarea v-model="taskContributionForm.details" placeholder="请写清时间、地点、人物或能够帮助核验的细节。" maxlength="1000" /></label>
              <label class="field"><text>资料来源（选填）</text><input v-model="taskContributionForm.source" placeholder="公开网页、报刊名称、现场观察或个人收藏" /></label>
              <view class="field">
                <text>佐证照片（选填）</text>
                <button class="upload-zone upload-zone--short" @click="chooseImage('task_contribution')">
                  <image v-if="taskContributionForm.photo" :src="taskContributionForm.photo" mode="aspectFill" />
                  <view v-else><AhangIcon name="upload" :size="26" /><text>拍摄或选择佐证图片</text><text>照片会随线索进入审核队列</text></view>
                </button>
              </view>
              <button class="checkbox-row" @click="taskContributionForm.copyrightConfirmed = !taskContributionForm.copyrightConfirmed">
                <view :class="{ checked: taskContributionForm.copyrightConfirmed }">{{ taskContributionForm.copyrightConfirmed ? '✓' : '' }}</view>
                <view class="checkbox-copy"><text>确认资料真实且可以用于非营利档案核验</text><text>如使用他人资料，请在来源中注明作者或公开出处。</text></view>
              </button>
              <button class="button button--green" @click="submitTaskContribution">提交线索等待审核</button>
            </view>
          </view>

          <view v-else-if="viewType === 'about_project'" class="page">
            <view class="nested-header">
              <button @click="goMain('my')"><UiImageIcon name="back" :size="24" tone="dark" /></button>
              <view><text>关于阿杭计划</text><text>PROJECT AHANG</text></view>
              <view />
            </view>
            <view class="about-banner">
              <text>让更多动物被看见、被记住、被理解。</text>
              <text>“每一个生命都值得被记录。动物园不只是展示动物的橱窗，这里更生活着一群鲜活的、拥有个性的市民老友。”</text>
            </view>
            <view class="about-section"><text>我们是谁？</text><text>白狮阿杭计划是由众多自然爱好者、常驻动物园观察员、以及致力于野生动物科普教育的数字科研人员，在2026年共同发起建设的公众共建数字平台。</text></view>
            <view class="about-section"><text>我们为什么做这个？</text><text>以前，人们游览动物园时只看到一个笼子和写着“非洲狮”的牌子。但动物们是群居的、个性的，拥有漫长的生命周期。阿杭的离世，让我们意识到，建立一个公众共建、非营利性的在园动物“数字户口本/日记本”有多么必要。</text></view>
            <view class="about-section">
              <text>我们不是什么？</text>
              <text>- 我们不是官方机构，我们保持第三方的科学记录与人文纪念立场。</text>
              <text>- 我们不是炒作动物福利的极端社区，我们秉持理性观察、温柔科普态度。</text>
              <text>- 我们不是宠物娱乐秀，我们记录真实而生动的生命足迹。</text>
            </view>
          </view>

        </view>
      </scroll-view>

      <view
        v-if="bottomNavVisible"
        class="bottom-nav"
      >
        <button
          v-for="tab in bottomTabs"
          :key="tab.id"
          class="bottom-nav__item"
          :class="{
            'bottom-nav__item--active': viewType === 'main' && mainTab === tab.id,
            'bottom-nav__item--primary': tab.id === 'record',
          }"
          :aria-label="tab.label || '记录'"
          @click="goMain(tab.id)"
        >
          <view v-if="tab.id === 'record'" class="bottom-nav__primary">
            <view class="bottom-nav__primary-mark" />
          </view>
          <template v-else>
            <view class="bottom-nav__icon-box">
              <UiImageIcon
                v-if="tab.icon"
                :name="tab.icon"
                :size="21"
                :tone="viewType === 'main' && mainTab === tab.id ? 'active' : 'muted'"
              />
            </view>
            <text>{{ tab.label }}</text>
          </template>
        </button>
      </view>

      <view v-if="showWechatLoginSheet" class="modal-backdrop login-sheet-backdrop" @click="showWechatLoginSheet = false">
        <view class="modal-card login-sheet" @click.stop>
          <view class="login-sheet__handle" />
          <view class="login-sheet__header">
            <view>
              <text>{{ currentUser.role === 'guest' ? '微信登录并注册' : '同步微信资料' }}</text>
              <text>头像保存到后端 uploads，昵称同步写入 MySQL 用户资料</text>
            </view>
            <button aria-label="关闭登录弹框" @click="showWechatLoginSheet = false">×</button>
          </view>

          <view class="wechat-profile-editor">
            <button
              class="wechat-avatar-picker"
              open-type="chooseAvatar"
              aria-label="选择微信头像"
              @chooseavatar="handleWechatAvatarChosen"
            >
              <image v-if="wechatProfileAvatarPreview" :src="wechatProfileAvatarPreview" mode="aspectFill" />
              <view v-else><text>＋</text><text>微信头像</text></view>
            </button>
            <label class="wechat-nickname-field">
              <text>微信昵称</text>
              <input
                v-model="wechatProfileNickname"
                type="nickname"
                maxlength="40"
                placeholder="点击填写或选择微信昵称"
                confirm-type="done"
              />
              <text>头像昵称仅用于账号、投稿署名和管理后台识别</text>
            </label>
          </view>

          <button class="button button--wechat" :loading="wechatAuthLoading" @click="completeWechatLogin">
            <text class="wechat-mark">微</text>
            {{ currentUser.role === 'guest' ? '微信登录并注册' : '保存微信头像和昵称' }}
          </button>
        </view>
      </view>

      <view v-if="showSettings" class="modal-backdrop" @click="showSettings = false">
        <view class="modal-card" @click.stop>
          <view class="modal-card__header"><text>设置与帮助</text><button @click="showSettings = false">×</button></view>
          <button class="menu-row" @click="triggerToast('消息通知设置已保存')"><view class="menu-row__left"><AhangIcon name="bell" :size="18" /><text>消息通知</text></view><text>已开启</text></button>
          <button class="menu-row" @click="triggerToast('隐私与授权记录已打开')"><view class="menu-row__left"><AhangIcon name="shield" :size="18" /><text>隐私与授权记录</text></view><AhangIcon name="next" :size="18" /></button>
          <button class="menu-row" @click="openView('about_project'); showSettings = false"><view class="menu-row__left"><AhangIcon name="info" :size="18" /><text>项目说明</text></view><AhangIcon name="next" :size="18" /></button>
          <button v-if="currentUser.role !== 'guest'" class="button button--red button--small" @click="handleLogout(); showSettings = false">退出登录</button>
        </view>
      </view>

      <view v-if="showMemoryUploader" class="modal-backdrop" @click="showMemoryUploader = false">
        <view class="modal-card modal-card--scroll" @click.stop>
          <view class="modal-card__header"><text>上传历史资料</text><button @click="showMemoryUploader = false">×</button></view>
          <label class="field">
            <text>属于哪只动物</text>
            <picker :range="animals" range-key="name" @change="memoryUploadForm.belongingAnimal = animals[$event.detail.value].id">
              <view class="picker-field">{{ animals.find((item) => item.id === memoryUploadForm.belongingAnimal)?.name || "请选择" }} ›</view>
            </picker>
          </label>
          <label class="field"><text>原发布平台</text><input v-model="memoryUploadForm.platform" placeholder="微信朋友圈、微博、报纸等" /></label>
          <label class="field"><text>发布时间</text><input v-model="memoryUploadForm.publishTime" type="date" /></label>
          <label class="field"><text>原始链接</text><input v-model="memoryUploadForm.originalLink" placeholder="https://..." /></label>
          <label class="field"><text>资料说明</text><textarea v-model="memoryUploadForm.description" placeholder="请说明资料内容、来源与人物关系" maxlength="600" /></label>
          <button class="button button--green" @click="submitExternalMemory">提交核验</button>
        </view>
      </view>

      <view v-if="showSubmissionDetail && selectedSubmission" class="modal-backdrop" @click="showSubmissionDetail = false">
        <scroll-view class="modal-card modal-card--scroll modal-card--submission" scroll-y @click.stop>
          <view class="modal-card__header">
            <view><text>投稿详情</text><text>单号: {{ selectedSubmission.id }} · 提交于 {{ selectedSubmission.submittedAt }}</text></view>
            <button @click="showSubmissionDetail = false">×</button>
          </view>
          <image v-if="selectedSubmission.photo" class="submission-modal__photo" :src="selectedSubmission.photo" mode="aspectFill" />
          <text class="modal-title">{{ selectedSubmission.title }}</text>
          <view class="modal-meta"><text>{{ selectedSubmission.animalName }}</text><text>{{ selectedSubmission.submittedAt }}</text></view>
          <view class="submission-modal__status">
            <view><text>处理状态</text><text class="submission-status" :class="`submission-status--${selectedSubmission.status}`">{{ selectedSubmission.statusLabel }}</text></view>
            <text>{{ submissionStatusDescription(selectedSubmission.status) }}</text>
          </view>
          <view class="submission-modal__section"><text>投稿内容详情</text><text class="modal-copy">{{ selectedSubmission.details }}</text></view>
          <view class="admin-comment"><text>管理员审核评语与要求：</text><text>{{ selectedSubmission.adminComment }}</text></view>
          <view class="submission-modal__metadata">
            <view><text>资料出处与载体</text><text>{{ selectedSubmission.source || "未提供" }}</text></view>
            <view><text>授权与版权范围</text><text>{{ selectedSubmission.copyright || "待核验" }}</text></view>
          </view>
          <button class="button button--dark button--small" @click="showSubmissionDetail = false">返回列表</button>
        </scroll-view>
      </view>
    </view>

    <view class="desktop-hint">
      <text>💡 HBuilderX / uni-app 桌面预览</text>
      <text>移动端、小程序与 App 共用同一套页面状态和接口层。</text>
    </view>
  </view>
</template>

<style scoped>
:global(body) {
  margin: 0;
  overflow: hidden;
  background: #f7f7f6;
}

.app-viewport {
  display: flex;
  min-height: 100vh;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  overflow: hidden;
  padding-top: 24px;
  background: #f7f7f6;
  box-sizing: border-box;
  color: #2a2825;
}

.phone-shell {
  --app-safe-bottom: 0px;
  position: relative;
  display: flex;
  width: 430px;
  height: min(880px, calc(100vh - 32px));
  flex-direction: column;
  overflow: hidden;
  border: 10px solid #292623;
  border-radius: 54px;
  background: #faf8f5;
  box-shadow: 0 28px 70px rgba(41, 37, 36, 0.18);
  box-sizing: border-box;
}

.phone-shell uni-button,
.phone-shell button {
  margin: 0;
  line-height: 1.35;
}

.phone-shell uni-button::after,
.phone-shell button::after {
  border: 0;
}

.phone-shell::before {
  position: absolute;
  z-index: 60;
  top: -1px;
  left: 50%;
  width: 128px;
  height: 20px;
  border-radius: 0 0 16px 16px;
  background: #292623;
  content: "";
  transform: translateX(-50%);
}

.status-bar {
  position: relative;
  z-index: 45;
  display: flex;
  height: 33px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: space-between;
  padding: 7px 20px 0;
  color: #57534e;
  font-size: 10px;
  font-weight: 700;
}

.status-bar__right {
  display: flex;
  align-items: center;
  gap: 5px;
}

.app-scroll {
  width: 100%;
  height: 0;
  min-height: 0;
  flex: 1 1 auto;
  touch-action: pan-y;
}

.page-stage {
  position: relative;
  min-height: 100%;
  padding-bottom: calc(76px + var(--app-safe-bottom));
}

.page {
  min-height: 100%;
  padding: 18px 20px 30px;
  animation: fade-in 0.28s ease both;
}

.page--home,
.page--memorial {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.onboarding {
  position: relative;
  display: flex;
  min-height: calc(min(880px, calc(100vh - 48px)) - 113px);
  flex-direction: column;
  justify-content: space-between;
  padding: 18px 24px 24px;
}

.onboarding-skip {
  position: absolute;
  z-index: 3;
  top: var(--onboarding-header-action-top);
  right: 18px;
  width: auto;
  min-height: 32px;
  border-radius: 999px;
  padding: 6px 10px;
  background: rgba(255, 255, 255, 0.84);
  color: #78716c;
  font-size: 11px;
  box-shadow: 0 3px 10px rgba(41, 37, 36, 0.06);
}

.onboarding__stage {
  display: flex;
  width: 100%;
  height: 100%;
  flex: 1 1 auto;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px 0 12px;
  text-align: center;
  box-sizing: border-box;
}

.onboarding__swiper {
  width: 100%;
  height: var(--onboarding-swiper-height);
  min-height: var(--onboarding-swiper-height);
  flex: 0 0 var(--onboarding-swiper-height);
}

.onboarding__slide {
  height: 100%;
}

.onboarding-portrait {
  width: 192px;
  height: 192px;
  flex: 0 0 auto;
  overflow: hidden;
  border: 4px solid rgba(217, 195, 176, 0.3);
  border-radius: 50%;
  margin-bottom: 24px;
  padding: 7px;
  background: #faf8f5;
  box-shadow: 0 8px 20px rgba(87, 83, 78, 0.13);
}

.onboarding-portrait image {
  width: 100%;
  height: 100%;
  border-radius: 50%;
}

.brand-title {
  display: block;
  color: #292524;
  font-family: Georgia, "Times New Roman", serif;
  font-size: 18px;
  font-weight: 800;
  letter-spacing: 0.04em;
  line-height: 1.25;
}

.brand-title--large {
  font-size: 30px;
  white-space: nowrap;
}

.brand-cn {
  display: block;
  margin-top: 3px;
  color: #78716c;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.brand-cn--red {
  margin-top: 2px;
  color: #b83b26;
  font-size: 20px;
}

.onboarding-copy {
  display: block;
  max-width: 310px;
  margin-top: 18px;
  color: #57534e;
  font-size: 14px;
  line-height: 1.75;
}

.onboarding-copy--wide {
  max-width: 320px;
}

.onboarding-quote {
  display: block;
  margin-top: 7px;
  color: #78716c;
  font-size: 12px;
}

.onboarding-symbol {
  display: flex;
  width: 90px;
  height: 90px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  margin-bottom: 22px;
}

.onboarding-symbol--green {
  background: rgba(47, 82, 51, 0.09);
  color: #2f5233;
}

.onboarding-symbol--champagne {
  background: rgba(217, 195, 176, 0.15);
  color: #9a7b63;
}

.onboarding-symbol--red {
  background: rgba(184, 59, 38, 0.09);
  color: #b83b26;
}

.onboarding-heading {
  display: block;
  color: #292524;
  font-family: Georgia, "Noto Serif SC", serif;
  font-size: 22px;
  font-weight: 800;
}

.onboarding-preview-row {
  display: flex;
  width: 100%;
  max-width: 300px;
  gap: 10px;
  margin-top: 28px;
}

.mini-profile {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: flex-start;
  border: 1px solid #e7e5e4;
  border-radius: 12px;
  padding: 10px;
  background: #fff;
  box-shadow: 0 4px 12px rgba(41, 37, 36, 0.06);
}

.mini-profile__avatar {
  display: flex;
  width: 34px;
  height: 34px;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  margin-bottom: 6px;
  background: rgba(47, 82, 51, 0.12);
  color: #2f5233;
  font-family: Georgia, serif;
  font-weight: 700;
}

.mini-profile__avatar--red {
  background: rgba(217, 195, 176, 0.2);
  color: #b83b26;
}

.mini-profile__name {
  display: flex;
  align-items: baseline;
  gap: 3px;
  color: #292524;
  font-size: 15px;
  font-weight: 700;
}

.mini-profile__name text:last-child {
  color: #78716c;
  font-size: 12px;
  font-weight: 500;
}

.mini-profile__meta,
.observation-preview__meta {
  display: block;
  margin-top: 3px;
  color: #a8a29e;
  font-size: 10px;
}

.observation-preview {
  display: flex;
  width: 280px;
  align-items: flex-start;
  gap: 10px;
  border: 1px solid #e7e5e4;
  border-radius: 14px;
  margin-top: 26px;
  padding: 12px;
  background: #fff;
  text-align: left;
  box-shadow: 0 4px 12px rgba(41, 37, 36, 0.06);
}

.observation-preview__image {
  width: 52px;
  height: 52px;
  flex: 0 0 auto;
  overflow: hidden;
  border-radius: 9px;
}

.observation-preview__title {
  display: block;
  color: #44403c;
  font-size: 13px;
  font-weight: 700;
}

.onboarding-actions {
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: 9px;
  margin-top: 28px;
}

.onboarding__bottom {
  display: flex;
  flex-direction: column;
  gap: 23px;
}

.progress-dots {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
}

.progress-dot {
  width: 6px;
  height: 6px;
  border-radius: 99px;
  background: #d6d3d1;
  transition: width 0.25s ease;
}

.progress-dot--active {
  width: 24px;
  background: #2f5233;
}

.button {
  display: flex;
  width: 100%;
  min-height: 44px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: 13px;
  padding: 11px 16px;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.3;
}

.button--red {
  background: #c53a25;
  box-shadow: 0 4px 10px rgba(184, 59, 38, 0.16);
}

.button--green {
  background: #2f5233;
}

.button--dark {
  background: #292524;
}

.button--amber {
  background: #d97706;
}

.button--wechat {
  background: #07c160;
  color: #fff;
}

.button--compact {
  min-height: 40px;
  margin-top: 16px;
}

.button--small {
  width: auto;
  min-height: 38px;
  padding: 8px 16px;
  font-size: 12px;
}

.wechat-mark {
  display: inline-flex;
  width: 23px;
  height: 23px;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  font-size: 10px;
}

.text-button {
  padding: 6px;
  color: #78716c;
  font-size: 12px;
}

.home-header,
.section-heading-row,
.featured-card__title-row,
.animal-list-card__top,
.memorial-toolbar,
.profile-card__top,
.submission-card__top,
.admin-card__top,
.modal-card__header,
.modal-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.icon-actions,
.inline,
.metadata-row,
.menu-row__left,
.status-bar__right {
  display: flex;
  align-items: center;
}

.inline {
  gap: 8px;
}

.icon-actions {
  gap: 9px;
}

.icon-button {
  position: relative;
  display: flex;
  width: 39px;
  height: 39px;
  align-items: center;
  justify-content: center;
  border: 1px solid #e7e5e4;
  border-radius: 50%;
  background: #fff;
  color: #57534e;
  box-shadow: 0 3px 9px rgba(41, 37, 36, 0.08);
}

.notification-dot {
  position: absolute;
  top: 5px;
  right: 5px;
  width: 7px;
  height: 7px;
  border: 2px solid #fff;
  border-radius: 50%;
  background: #b83b26;
}

.featured-card {
  display: block;
  width: 100%;
  overflow: hidden;
  border: 1px solid rgba(214, 211, 209, 0.85);
  border-radius: 18px;
  background: #fff;
  box-shadow: 0 3px 8px rgba(41, 37, 36, 0.08);
  text-align: left;
}

.featured-card__image {
  position: relative;
  width: 100%;
  height: 194px;
  overflow: hidden;
}

.featured-label {
  position: absolute;
  top: 13px;
  left: 13px;
  border-radius: 999px;
  padding: 5px 13px;
  background: #c53a25;
  color: #fff;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.05em;
}

.featured-card__body {
  padding: 18px 18px 22px;
}

.featured-name {
  font-family: Georgia, "Noto Serif SC", serif;
  font-size: 20px;
  font-weight: 800;
}

.soft-tag,
.test-tag {
  border-radius: 5px;
  padding: 2px 7px;
  background: #f5f5f4;
  color: #78716c;
  font-size: 10px;
}

.life-span {
  color: #b83b26;
  font-family: "Courier New", monospace;
  font-size: 11px;
  font-weight: 700;
}

.metadata-row {
  gap: 4px;
  margin-top: 12px;
  color: #8d8782;
  font-size: 10px;
}

.featured-summary {
  display: block;
  border-left: 2px solid rgba(184, 59, 38, 0.25);
  margin-top: 13px;
  padding-left: 10px;
  color: #57534e;
  font-size: 11px;
  line-height: 1.7;
}

.action-grid,
.record-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.action-card {
  display: flex;
  width: 100%;
  height: 110px;
  flex-direction: column;
  align-items: flex-start;
  justify-content: space-between;
  border: 1px solid #e7e5e4;
  border-radius: 16px;
  padding: 15px;
  background: #fff;
  box-shadow: 0 3px 8px rgba(41, 37, 36, 0.07);
  text-align: left;
}

.action-card__icon {
  display: flex;
  width: 39px;
  height: 39px;
  align-items: center;
  justify-content: center;
  border-radius: 11px;
  background: rgba(184, 59, 38, 0.05);
  color: #b83b26;
}

.action-card__title,
.recent-card__name,
.task-row__title {
  display: block;
  color: #292524;
  font-size: 12px;
  font-weight: 800;
}

.action-card__copy,
.recent-card__species,
.task-row__copy {
  display: block;
  margin-top: 2px;
  color: #a8a29e;
  font-size: 9px;
  line-height: 1.45;
}

.section {
  display: flex;
  flex-direction: column;
  gap: 11px;
}

.section-kicker {
  color: #a8a29e;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.08em;
}

.section-link {
  color: #b83b26;
  font-size: 11px;
  font-weight: 700;
}

.recent-row {
  width: 100%;
}

.recent-row__inner {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.recent-card {
  display: block;
  width: 100%;
  min-width: 0;
  overflow: hidden;
  border: 1px solid #e7e5e4;
  border-radius: 15px;
  background: #fff;
  box-shadow: 0 2px 7px rgba(41, 37, 36, 0.06);
  text-align: left;
}

.recent-card__image {
  position: relative;
  height: 82px;
  overflow: hidden;
}

.recent-card__badge {
  position: absolute;
  right: 4px;
  bottom: 4px;
  transform: scale(0.78);
  transform-origin: right bottom;
}

.recent-card__body {
  padding: 8px 9px 9px;
}

.recent-card__body .inline {
  min-width: 0;
  flex-wrap: nowrap;
  justify-content: space-between;
  gap: 3px;
}

.recent-card__name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.task-panel {
  overflow: hidden;
  border: 1px solid #e7e5e4;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 3px 8px rgba(41, 37, 36, 0.06);
}

.task-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #f5f5f4;
  padding: 13px 14px 10px;
  color: #44403c;
  font-size: 11px;
  font-weight: 800;
}

.urgent-tag {
  border-radius: 5px;
  padding: 3px 7px;
  background: #fef2f2;
  color: #b83b26;
  font-size: 9px;
}

.task-row {
  display: flex;
  width: 100%;
  align-items: flex-start;
  gap: 9px;
  padding: 10px 14px;
  text-align: left;
}

.task-dot {
  width: 6px;
  height: 6px;
  flex: 0 0 auto;
  border-radius: 50%;
  margin-top: 5px;
  background: #b83b26;
}

.memorial-banner {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  border-radius: 17px;
  padding: 18px;
  background: #292524;
  color: #fff;
  text-align: left;
  box-shadow: 0 6px 16px rgba(41, 37, 36, 0.16);
}

.memorial-banner__title,
.memorial-banner__copy {
  display: block;
}

.memorial-banner__title {
  font-family: Georgia, "Noto Serif SC", serif;
  font-size: 14px;
  font-weight: 800;
}

.memorial-banner__copy {
  margin-top: 5px;
  color: #a8a29e;
  font-size: 10px;
}

.memorial-banner__action {
  border-radius: 10px;
  padding: 9px 13px;
  background: #b83b26;
  font-size: 10px;
  font-weight: 800;
}

.page-title-block {
  margin-bottom: 16px;
}

.page-title,
.page-subtitle {
  display: block;
}

.page-title {
  color: #292524;
  font-family: Georgia, "Noto Serif SC", serif;
  font-size: 27px;
  font-weight: 800;
  line-height: 1.2;
}

.page-subtitle {
  margin-top: 2px;
  color: #78716c;
  font-size: 11px;
}

.search-field {
  display: flex;
  height: 42px;
  align-items: center;
  gap: 8px;
  border: 1px solid #e7e5e4;
  border-radius: 12px;
  margin-bottom: 13px;
  padding: 0 12px;
  background: #fff;
  color: #a8a29e;
}

.search-field__input {
  height: 100%;
  flex: 1;
  color: #44403c;
  font-size: 12px;
}

.search-clear {
  color: #a8a29e;
  font-size: 18px;
}

.filter-scroll {
  width: calc(100% + 20px);
  margin-bottom: 16px;
}

.filter-scroll--grow {
  width: 0;
  flex: 1;
  margin-bottom: 0;
}

.filter-scroll__inner {
  display: flex;
  gap: 8px;
  padding-right: 20px;
}

.filter-chip {
  flex: 0 0 auto;
  border: 1px solid #e7e5e4;
  border-radius: 999px;
  padding: 7px 13px;
  background: #fff;
  color: #57534e;
  font-size: 11px;
}

.filter-chip--active {
  border-color: #c53a25;
  background: #c53a25;
  color: #fff;
  box-shadow: 0 3px 7px rgba(184, 59, 38, 0.15);
}

.animal-list,
.memory-feed,
.submission-list,
.task-center-list,
.admin-list,
.observation-feed {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.animal-list-card {
  display: flex;
  width: 100%;
  min-height: 111px;
  overflow: hidden;
  border: 1px solid #e7e5e4;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 3px 8px rgba(41, 37, 36, 0.07);
  text-align: left;
}

.animal-list-card__image {
  position: relative;
  width: 112px;
  flex: 0 0 auto;
}

.verified-mark {
  position: absolute;
  top: 7px;
  left: 7px;
  display: flex;
  width: 19px;
  height: 19px;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #c53a25;
  color: #fff;
  font-size: 11px;
  font-weight: 800;
}

.animal-list-card__body {
  min-width: 0;
  flex: 1;
  padding: 13px 13px 11px;
}

.animal-list-card__name {
  max-width: 138px;
  overflow: hidden;
  font-family: Georgia, "Noto Serif SC", serif;
  font-size: 15px;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.animal-list-card__summary {
  display: -webkit-box;
  overflow: hidden;
  margin-top: 9px;
  color: #57534e;
  font-family: Georgia, "Noto Serif SC", serif;
  font-size: 10px;
  font-style: italic;
  line-height: 1.55;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.empty-state,
.success-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 58px 28px;
  color: #78716c;
  text-align: center;
}

.empty-state--small {
  min-height: 120px;
  padding: 28px;
}

.empty-state__icon {
  color: #d6d3d1;
  font-family: Georgia, serif;
  font-size: 46px;
}

.empty-state__title {
  margin-top: 9px;
  color: #44403c;
  font-size: 15px;
  font-weight: 800;
}

.empty-state__copy {
  margin: 7px 0 16px;
  font-size: 11px;
  line-height: 1.7;
}

.record-card {
  display: flex;
  width: 100%;
  min-height: 155px;
  flex-direction: column;
  align-items: flex-start;
  border: 1px solid #e7e5e4;
  border-radius: 17px;
  padding: 17px;
  background: #fff;
  box-shadow: 0 3px 9px rgba(41, 37, 36, 0.06);
  text-align: left;
}

.record-card--disabled {
  opacity: 0.62;
}

.record-card__icon {
  display: flex;
  width: 44px;
  height: 44px;
  align-items: center;
  justify-content: center;
  border-radius: 13px;
  margin-bottom: 16px;
}

.record-card__icon--red {
  background: rgba(184, 59, 38, 0.08);
  color: #b83b26;
}

.record-card__icon--green {
  background: rgba(47, 82, 51, 0.09);
  color: #2f5233;
}

.record-card__icon--dark {
  background: #292524;
  color: #fff;
}

.record-card__icon--blue {
  background: rgba(90, 107, 124, 0.1);
  color: #5a6b7c;
}

.record-card__title,
.record-card__copy {
  display: block;
}

.record-card__title {
  font-size: 13px;
  font-weight: 800;
}

.record-card__copy {
  margin-top: 5px;
  color: #8d8782;
  font-size: 10px;
  line-height: 1.55;
}

.ai-banner {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 13px;
  border-radius: 17px;
  margin-top: 18px;
  padding: 16px;
  background: linear-gradient(135deg, #2f5233, #203a24);
  color: #fff;
  text-align: left;
  box-shadow: 0 7px 18px rgba(47, 82, 51, 0.18);
}

.ai-banner__icon {
  display: flex;
  width: 48px;
  height: 48px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.1);
  color: #d9c3b0;
}

.ai-banner__body {
  min-width: 0;
  flex: 1;
}

.ai-banner__title,
.ai-banner__copy {
  display: block;
}

.ai-banner__title {
  font-size: 13px;
  font-weight: 800;
}

.ai-banner__copy {
  margin-top: 4px;
  color: rgba(255, 255, 255, 0.68);
  font-size: 9px;
  line-height: 1.45;
}

.principle-panel {
  border: 1px solid #e7e5e4;
  border-radius: 17px;
  margin-top: 18px;
  padding: 16px;
  background: #fff;
}

.principle-panel__title {
  display: block;
  margin-bottom: 10px;
  font-size: 12px;
  font-weight: 800;
}

.principle-row {
  display: flex;
  align-items: baseline;
  gap: 10px;
  padding: 7px 0;
  color: #57534e;
  font-size: 10px;
}

.principle-row > text:first-child {
  color: #b83b26;
  font-family: "Courier New", monospace;
  font-weight: 800;
}

.memorial-hero {
  overflow: hidden;
  border-radius: 18px;
  background: #292524;
  color: #fff;
  box-shadow: 0 8px 22px rgba(41, 37, 36, 0.18);
}

.memorial-hero__image {
  position: relative;
  height: 250px;
}

.memorial-hero__veil,
.detail-hero__gradient {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(20, 18, 17, 0.88), transparent 62%);
}

.memorial-hero__content {
  position: absolute;
  right: 18px;
  bottom: 18px;
  left: 18px;
}

.memorial-hero__name {
  font-family: Georgia, "Noto Serif SC", serif;
  font-size: 28px;
  font-weight: 800;
}

.memorial-hero__years {
  margin-left: 9px;
  color: #d9c3b0;
  font-family: "Courier New", monospace;
  font-size: 12px;
}

.memorial-hero__quote {
  display: block;
  margin-top: 5px;
  color: rgba(255, 255, 255, 0.72);
  font-size: 10px;
}

.memorial-hero__actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 13px 16px;
}

.candle-button {
  display: flex;
  align-items: center;
  gap: 7px;
  border-radius: 999px;
  padding: 8px 13px;
  background: #b83b26;
  color: #fff;
  font-size: 11px;
  font-weight: 800;
}

.candle-button--active {
  background: rgba(255, 255, 255, 0.12);
  color: #d9c3b0;
}

.candle-count {
  color: #a8a29e;
  font-size: 10px;
}

.round-add {
  display: flex;
  width: 35px;
  height: 35px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #b83b26;
  color: #fff;
  font-size: 20px;
}

.memory-card,
.observation-card,
.submission-card,
.task-center-card,
.admin-card {
  border: 1px solid #e7e5e4;
  border-radius: 16px;
  padding: 15px;
  background: #fff;
  box-shadow: 0 3px 9px rgba(41, 37, 36, 0.06);
}

.memory-card__header,
.observation-card__header {
  display: flex;
  align-items: center;
  gap: 9px;
}

.memory-card__avatar {
  display: flex;
  width: 34px;
  height: 34px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(217, 195, 176, 0.25);
  color: #7c5d48;
  font-family: Georgia, serif;
  font-size: 12px;
  font-weight: 800;
}

.memory-card__author text,
.observation-card__header text {
  display: block;
}

.memory-card__author text:first-child,
.observation-card__header text:first-child {
  color: #44403c;
  font-size: 11px;
  font-weight: 800;
}

.memory-card__author text:last-child,
.observation-card__header text:last-child {
  margin-top: 2px;
  color: #a8a29e;
  font-size: 9px;
}

.memory-card__text,
.observation-card__text {
  display: block;
  margin-top: 12px;
  color: #57534e;
  font-family: Georgia, "Noto Serif SC", serif;
  font-size: 12px;
  line-height: 1.8;
}

.memory-card__image {
  width: 100%;
  height: 190px;
  border-radius: 12px;
  margin-top: 12px;
}

.memory-card__footer {
  display: flex;
  justify-content: flex-end;
  gap: 18px;
  border-top: 1px solid #f5f5f4;
  margin-top: 13px;
  padding-top: 10px;
}

.memory-card__footer button {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #78716c;
  font-size: 10px;
}

.memory-card__footer button.liked {
  color: #b83b26;
}

.profile-card {
  border-radius: 18px;
  padding: 18px;
  background: #292524;
  color: #fff;
  box-shadow: 0 8px 22px rgba(41, 37, 36, 0.17);
}

.profile-avatar {
  width: 56px;
  height: 56px;
  flex: 0 0 auto;
  border: 2px solid rgba(255, 255, 255, 0.22);
  border-radius: 50%;
}

.profile-avatar--fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #d9c3b0;
  color: #292524;
  font-family: Georgia, serif;
  font-size: 22px;
  font-weight: 800;
}

.profile-card__identity {
  min-width: 0;
  flex: 1;
  margin-left: 12px;
}

.profile-name,
.profile-role,
.profile-hint {
  display: block;
}

.profile-name {
  font-family: Georgia, "Noto Serif SC", serif;
  font-size: 18px;
  font-weight: 800;
}

.profile-role {
  margin-top: 3px;
  color: #d6d3d1;
  font-size: 10px;
}

.profile-settings {
  color: #d6d3d1;
}

.profile-hint {
  margin: 14px 0 12px;
  color: #a8a29e;
  font-size: 10px;
}

.profile-card .button--wechat {
  min-height: 39px;
  font-size: 11px;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  border: 1px solid #e7e5e4;
  border-radius: 16px;
  margin: 14px 0;
  background: #fff;
}

.stats-row button {
  position: relative;
  padding: 14px 6px;
}

.stats-row button + button::before {
  position: absolute;
  top: 14px;
  bottom: 14px;
  left: 0;
  width: 1px;
  background: #f0eeee;
  content: "";
}

.stats-row text {
  display: block;
}

.stats-row text:first-child {
  color: #292524;
  font-family: Georgia, serif;
  font-size: 18px;
  font-weight: 800;
}

.stats-row text:last-child {
  margin-top: 2px;
  color: #a8a29e;
  font-size: 9px;
}

.menu-group {
  overflow: hidden;
  border: 1px solid #e7e5e4;
  border-radius: 16px;
  background: #fff;
}

.menu-row {
  display: flex;
  width: 100%;
  min-height: 49px;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #f5f5f4;
  padding: 10px 14px;
  color: #78716c;
  font-size: 11px;
}

.menu-row:last-child {
  border-bottom: 0;
}

.menu-row__left {
  gap: 10px;
  color: #44403c;
  font-size: 12px;
  font-weight: 700;
}

.role-demo {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border: 1px dashed #d6d3d1;
  border-radius: 15px;
  margin-top: 14px;
  padding: 14px;
}

.role-demo__title,
.role-demo__copy {
  display: block;
}

.role-demo__title {
  font-size: 11px;
  font-weight: 800;
}

.role-demo__copy {
  max-width: 205px;
  margin-top: 3px;
  color: #a8a29e;
  font-size: 9px;
}

.outline-button {
  flex: 0 0 auto;
  border: 1px solid #d6d3d1;
  border-radius: 10px;
  padding: 8px 11px;
  background: #fff;
  color: #57534e;
  font-size: 10px;
  font-weight: 700;
}

.outline-button--full {
  width: 100%;
}

.role-options {
  position: absolute;
  z-index: 20;
  top: 58px;
  right: 12px;
  display: flex;
  width: 150px;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid #e7e5e4;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 12px 28px rgba(41, 37, 36, 0.16);
}

.role-options button {
  padding: 10px 12px;
  color: #57534e;
  font-size: 10px;
  text-align: left;
}

.role-options button.active {
  background: #2f5233;
  color: #fff;
}

.logout-button {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: center;
  gap: 7px;
  margin-top: 14px;
  padding: 12px;
  color: #b83b26;
  font-size: 11px;
}

.nested-header {
  display: grid;
  min-height: 47px;
  grid-template-columns: 38px 1fr 38px;
  align-items: center;
  border-bottom: 1px solid #f0eeee;
  margin: -4px -2px 15px;
  padding-bottom: 10px;
}

.nested-header > button,
.nested-header > view:last-child {
  display: flex;
  min-height: 34px;
  align-items: center;
  justify-content: center;
}

.nested-header > view:nth-child(2) {
  text-align: center;
}

.nested-header > view:nth-child(2) text {
  display: block;
}

.nested-header > view:nth-child(2) text:first-child {
  font-size: 13px;
  font-weight: 800;
}

.nested-header > view:nth-child(2) text:last-child {
  margin-top: 2px;
  color: #a8a29e;
  font-size: 9px;
}

.nested-header > view:nth-child(2) text:only-child {
  margin-top: 0;
  color: #292524;
  font-size: 13px;
  font-weight: 800;
}

.nested-header--action {
  grid-template-columns: 38px minmax(0, 1fr) 72px;
}

.header-text-action {
  color: #2f5233;
  font-size: 10px;
  font-weight: 800;
  white-space: nowrap;
}

.nested-header--overlay {
  position: absolute;
  z-index: 15;
  top: 12px;
  right: 16px;
  left: 16px;
  border: 0;
  color: #fff;
}

.nested-header--overlay > view:nth-child(2) text:first-child {
  text-shadow: 0 2px 6px rgba(0, 0, 0, 0.35);
}

.nested-header--dark {
  border-radius: 14px;
  margin: 0 0 14px;
  padding: 8px 6px;
  background: #292524;
  color: #fff;
}

.page--detail {
  position: relative;
  padding: 0 0 30px;
}

.detail-hero {
  position: relative;
  height: 310px;
}

.detail-hero__content {
  position: absolute;
  right: 20px;
  bottom: 22px;
  left: 20px;
  color: #fff;
}

.detail-hero__name {
  font-family: Georgia, "Noto Serif SC", serif;
  font-size: 30px;
  font-weight: 800;
}

.detail-hero__species {
  display: block;
  margin-top: 5px;
  color: rgba(255, 255, 255, 0.72);
  font-size: 10px;
}

.detail-summary-card {
  position: relative;
  z-index: 5;
  border-radius: 19px 19px 0 0;
  margin-top: -14px;
  padding: 18px 20px 14px;
  background: #faf8f5;
}

.detail-facts {
  display: grid;
  grid-template-columns: 0.8fr 1.15fr 1.35fr;
  border: 1px solid #e7e5e4;
  border-radius: 13px;
  background: #fff;
}

.detail-facts view {
  padding: 10px 7px;
  text-align: center;
}

.detail-facts view + view {
  border-left: 1px solid #f0eeee;
}

.detail-facts text {
  display: block;
}

.detail-facts text:first-child {
  color: #a8a29e;
  font-size: 8px;
}

.detail-facts text:last-child {
  margin-top: 2px;
  color: #44403c;
  font-size: 10px;
  font-weight: 700;
}

.detail-description {
  display: block;
  margin-top: 14px;
  color: #57534e;
  font-size: 11px;
  line-height: 1.8;
}

.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 12px;
}

.tag-row text {
  border-radius: 999px;
  padding: 4px 8px;
  background: rgba(217, 195, 176, 0.18);
  color: #7c5d48;
  font-size: 9px;
}

.detail-actions {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 7px;
  margin-top: 14px;
}

.detail-actions button {
  display: flex;
  min-height: 37px;
  align-items: center;
  justify-content: center;
  gap: 5px;
  border: 1px solid #e7e5e4;
  border-radius: 10px;
  background: #fff;
  color: #57534e;
  font-size: 9px;
  font-weight: 700;
}

.detail-tabs,
.admin-tabs {
  border-top: 1px solid #f0eeee;
  border-bottom: 1px solid #f0eeee;
  background: #faf8f5;
}

.detail-tabs__inner,
.admin-tabs__inner {
  display: flex;
  padding: 0 14px;
}

.detail-tabs button,
.admin-tabs button {
  flex: 0 0 auto;
  border-bottom: 2px solid transparent;
  padding: 11px 13px;
  color: #8d8782;
  font-size: 10px;
}

.detail-tabs button.active,
.admin-tabs button.active {
  border-color: #b83b26;
  color: #b83b26;
  font-weight: 800;
}

.detail-section {
  padding: 18px 20px 0;
}

.detail-section__title {
  color: #292524;
  font-family: Georgia, "Noto Serif SC", serif;
  font-size: 15px;
  font-weight: 800;
}

.timeline {
  margin-top: 14px;
}

.timeline-row {
  display: grid;
  grid-template-columns: 76px 1fr;
  min-height: 92px;
}

.timeline-row__rail {
  position: relative;
  border-right: 1px solid #d6d3d1;
  padding-right: 18px;
  color: #b83b26;
  font-family: "Courier New", monospace;
  font-size: 10px;
  font-weight: 800;
  text-align: right;
}

.timeline-row__rail view {
  position: absolute;
  top: 2px;
  right: -5px;
  width: 9px;
  height: 9px;
  border: 2px solid #faf8f5;
  border-radius: 50%;
  background: #b83b26;
}

.timeline-row__body {
  padding: 0 0 20px 19px;
}

.timeline-row__title,
.timeline-row__copy {
  display: block;
}

.timeline-row__title {
  font-size: 11px;
  font-weight: 800;
}

.timeline-row__copy {
  margin-top: 5px;
  color: #78716c;
  font-size: 10px;
  line-height: 1.65;
}

.relationship-panel {
  display: flex;
  flex-direction: column;
  gap: 9px;
  border-top: 1px solid #e7e5e4;
  padding-top: 16px;
}

.relationship-panel button {
  border: 1px solid #e7e5e4;
  border-radius: 12px;
  padding: 11px;
  background: #fff;
  text-align: left;
}

.relationship-panel button text {
  display: block;
}

.relationship-panel button text:first-child {
  font-size: 11px;
  font-weight: 800;
}

.relationship-panel button text:last-child {
  margin-top: 3px;
  color: #8d8782;
  font-size: 9px;
}

.species-profile__latin {
  display: block;
  margin: 8px 0 12px;
  color: #b83b26;
  font-family: Georgia, serif;
  font-size: 13px;
  font-style: italic;
}

.species-facts {
  overflow: hidden;
  border: 1px solid #e7e5e4;
  border-radius: 13px;
  background: #fff;
}

.species-facts view {
  display: grid;
  grid-template-columns: 80px 1fr;
  border-bottom: 1px solid #f5f5f4;
  padding: 9px 11px;
  font-size: 10px;
}

.species-facts text:first-child {
  color: #a8a29e;
}

.knowledge-card {
  border-left: 3px solid #2f5233;
  border-radius: 0 11px 11px 0;
  margin-top: 10px;
  padding: 11px 12px;
  background: #fff;
}

.knowledge-card text {
  display: block;
}

.knowledge-card text:first-child {
  font-size: 11px;
  font-weight: 800;
}

.knowledge-card text:last-child {
  margin-top: 4px;
  color: #78716c;
  font-size: 9px;
  line-height: 1.65;
}

.page--form {
  padding-bottom: 30px;
}

.page--single-form {
  padding-bottom: calc(112px + var(--app-safe-bottom));
}

.step-progress {
  display: flex;
  gap: 5px;
  margin: 4px 2px 20px;
}

.step-progress view {
  height: 4px;
  flex: 1;
  border-radius: 99px;
  background: #e7e5e4;
}

.step-progress view.active {
  background: #2f5233;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.form-title,
.form-intro {
  display: block;
}

.form-title {
  color: #292524;
  font-family: Georgia, "Noto Serif SC", serif;
  font-size: 22px;
  font-weight: 800;
}

.form-intro {
  margin-top: -9px;
  color: #78716c;
  font-size: 10px;
  line-height: 1.65;
}

.form-subtitle {
  display: block;
  color: #57534e;
  font-size: 10px;
  font-weight: 800;
}

.field {
  display: block;
}

.field > text:first-child,
.field-label-row {
  display: block;
  margin-bottom: 6px;
  color: #57534e;
  font-size: 10px;
  font-weight: 800;
}

.field-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.field-label-row text:last-child,
.field-hint {
  color: #a8a29e;
  font-size: 8px;
  font-weight: 500;
}

.field-hint {
  display: block;
  margin-top: 4px;
}

.field input:disabled {
  background: #f5f5f4;
  color: #a8a29e;
}

.field input,
.field textarea,
.picker-field {
  width: 100%;
  border: 1px solid #e7e5e4;
  border-radius: 11px;
  background: #fff;
  color: #44403c;
  font-size: 11px;
}

.field input,
.picker-field {
  height: 43px;
  padding: 0 12px;
  line-height: 43px;
}

.field textarea {
  min-height: 122px;
  padding: 11px 12px;
  line-height: 1.65;
}

.two-column-fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.choice-row {
  display: flex;
  gap: 8px;
}

.choice-row--wrap {
  flex-wrap: wrap;
}

.choice-row button {
  flex: 1;
  border: 1px solid #e7e5e4;
  border-radius: 10px;
  padding: 8px 11px;
  background: #fff;
  color: #78716c;
  font-size: 10px;
}

.choice-row--wrap button {
  flex: 0 0 auto;
}

.choice-row button.active {
  border-color: #2f5233;
  background: #2f5233;
  color: #fff;
}

.question-card .choice-row button text {
  display: block;
}

.question-card .choice-row button text:last-child,
.checkbox-copy text:last-child {
  display: block;
  margin-top: 3px;
  color: inherit;
  font-size: 8px;
  font-weight: 400;
  line-height: 1.45;
  opacity: 0.72;
}

.checkbox-copy {
  display: flex;
  flex: 1;
  flex-direction: column;
  color: #57534e;
}

.checkbox-copy text:first-child {
  font-weight: 800;
}

.animal-choice-name {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 5px;
}

.animal-choice-name text:first-child {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.animal-choice-name text:last-child:not(:first-child) {
  flex: 0 0 auto;
  border: 1px solid #e7e5e4;
  border-radius: 999px;
  padding: 1px 4px;
  background: #f5f5f4;
  color: #78716c;
  font-size: 8px;
}

.duplicate-hint {
  display: flex;
  flex-direction: column;
  gap: 5px;
  border: 1px solid #fde68a;
  border-radius: 12px;
  padding: 11px;
  background: #fffbeb;
  color: #78716c;
  font-size: 9px;
  line-height: 1.55;
}

.duplicate-hint text:first-child {
  color: #92400e;
  font-size: 10px;
  font-weight: 800;
}

.reason-list {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.reason-list > button {
  display: flex;
  width: 100%;
  align-items: flex-start;
  gap: 9px;
  border: 1px solid #e7e5e4;
  border-radius: 11px;
  padding: 9px;
  background: #fafaf9;
  text-align: left;
}

.reason-list > button.active {
  border-color: #2f5233;
  background: rgba(47, 82, 51, 0.05);
}

.checkbox-mark {
  display: flex;
  width: 16px;
  height: 16px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  border: 1px solid #d6d3d1;
  border-radius: 4px;
  color: #fff;
  font-size: 9px;
}

.reason-list > button.active .checkbox-mark {
  border-color: #2f5233;
  background: #2f5233;
}

.reason-list > button > view:last-child {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.reason-list > button > view:last-child text:first-child {
  color: #292524;
  font-size: 10px;
  font-weight: 800;
}

.reason-list > button > view:last-child text:last-child {
  color: #a8a29e;
  font-size: 8px;
  line-height: 1.45;
}

.recommend-summary,
.observation-summary {
  display: flex;
  flex-direction: column;
  gap: 8px;
  border: 1px solid #e7e5e4;
  border-radius: 14px;
  padding: 13px;
  background: #fff;
}

.recommend-summary__title {
  color: #292524;
  font-family: Georgia, "Noto Serif SC", serif;
  font-size: 11px;
  font-weight: 800;
}

.recommend-summary > view,
.observation-summary > view:not(.section-heading-row) {
  display: grid;
  grid-template-columns: minmax(90px, 0.8fr) minmax(0, 1.4fr);
  gap: 8px;
  border-top: 1px solid #f5f5f4;
  padding-top: 7px;
  font-size: 9px;
  line-height: 1.5;
}

.recommend-summary > view > text:first-child,
.observation-summary > view > text:first-child {
  color: #a8a29e;
  font-weight: 800;
}

.recommend-summary > view > text:last-child,
.observation-summary > view > text:last-child {
  color: #44403c;
  overflow-wrap: anywhere;
}

.animal-choice-list--compact {
  max-height: none;
  overflow: visible;
  gap: 12px;
}

.animal-choice-list--compact > button {
  min-height: 72px;
  flex: 0 0 auto;
  padding: 10px 12px;
}

.animal-choice-list--compact .animal-choice-list__image {
  width: 48px;
  height: 48px;
}

.upload-zone {
  display: flex;
  height: 190px;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 1px dashed #d6d3d1;
  border-radius: 14px;
  background: #fff;
  color: #8d8782;
}

.upload-zone--short {
  height: 130px;
}

.upload-zone image {
  width: 100%;
  height: 100%;
}

.upload-zone view {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  font-size: 10px;
}

.license-options,
.animal-choice-list {
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.license-options > button,
.animal-choice-list > button,
.checkbox-row,
.question-card {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 10px;
  border: 1px solid #e7e5e4;
  border-radius: 12px;
  padding: 11px;
  background: #fff;
  text-align: left;
}

.license-options > button.active,
.animal-choice-list > button.active {
  border-color: #2f5233;
  box-shadow: 0 0 0 2px rgba(47, 82, 51, 0.08);
}

.radio-dot {
  width: 14px;
  height: 14px;
  flex: 0 0 auto;
  border: 1px solid #a8a29e;
  border-radius: 50%;
}

.license-options > button.active .radio-dot,
.animal-choice-list > button.active .radio-dot {
  border: 4px solid #2f5233;
}

.license-options text,
.animal-choice-list text {
  display: block;
}

.license-options text:first-child,
.animal-choice-list text:first-child {
  font-size: 11px;
  font-weight: 800;
}

.license-options text:last-child,
.animal-choice-list text:last-child {
  margin-top: 3px;
  color: #8d8782;
  font-size: 9px;
}

.checkbox-row {
  align-items: flex-start;
  color: #57534e;
  font-size: 10px;
  line-height: 1.6;
}

.checkbox-row > view:first-child {
  display: flex;
  width: 18px;
  height: 18px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  border: 1px solid #d6d3d1;
  border-radius: 5px;
  color: #fff;
  font-size: 10px;
}

.checkbox-row > view.checked {
  border-color: #2f5233;
  background: #2f5233;
}

.animal-choice-list__image {
  width: 52px;
  height: 52px;
  flex: 0 0 auto;
  overflow: hidden;
  border-radius: 10px;
}

.animal-choice-list > button > view:nth-child(2) {
  min-width: 0;
  flex: 1;
}

.question-card {
  flex-direction: column;
  align-items: stretch;
  color: #44403c;
  font-size: 11px;
  font-weight: 700;
}

.form-footer {
  position: sticky;
  z-index: 25;
  bottom: calc(66px + var(--app-safe-bottom));
  border-top: 1px solid #e7e5e4;
  margin: 22px -20px -30px;
  padding: 11px 20px;
  background: rgba(250, 248, 245, 0.96);
  backdrop-filter: blur(10px);
}

.success-state {
  min-height: 570px;
}

.success-state__icon {
  display: flex;
  width: 72px;
  height: 72px;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #2f5233;
  color: #fff;
  font-size: 31px;
}

.success-state__title {
  margin-top: 18px;
  color: #292524;
  font-family: Georgia, "Noto Serif SC", serif;
  font-size: 21px;
  font-weight: 800;
}

.success-state__copy {
  max-width: 270px;
  margin: 8px 0 22px;
  font-size: 10px;
  line-height: 1.7;
}

.success-state .button,
.success-state .outline-button {
  max-width: 280px;
  margin-top: 9px;
}

.page--ai {
  min-height: 100%;
}

.ai-intro {
  display: flex;
  align-items: center;
  gap: 12px;
  border-radius: 14px;
  padding: 14px;
  background: #2f5233;
  color: rgba(255, 255, 255, 0.78);
  font-size: 10px;
  line-height: 1.6;
}

.ai-intro__mark {
  color: #d9c3b0;
}

.ai-intro > view:last-child {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.ai-intro > view:last-child text:first-child {
  color: #fff;
  font-weight: 800;
}

.ai-samples {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin-top: 16px;
}

.ai-samples button {
  overflow: hidden;
  border: 1px solid #e7e5e4;
  border-radius: 12px;
  background: #fff;
}

.ai-samples image {
  width: 100%;
  height: 82px;
}

.ai-samples text {
  display: block;
  padding: 7px;
  color: #57534e;
  font-size: 8px;
  font-weight: 700;
}

.ai-result {
  position: relative;
  overflow: hidden;
  border: 1px solid #e7e5e4;
  border-radius: 17px;
  margin-top: 18px;
  background: #fff;
}

.ai-result > image {
  width: 100%;
  height: 250px;
}

.ai-result__scanning {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(32, 58, 36, 0.54);
  color: #fff;
  font-size: 10px;
}

.scan-line {
  position: absolute;
  top: 28%;
  right: 0;
  left: 0;
  height: 2px;
  background: #d9c3b0;
  box-shadow: 0 0 12px #d9c3b0;
  animation: scan 0.9s ease-in-out infinite alternate;
}

.ai-result__done {
  padding: 15px;
}

.ai-result__done text {
  display: block;
}

.ai-result__label {
  color: #a8a29e;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.08em;
}

.ai-result__name {
  margin-top: 5px;
  font-family: Georgia, "Noto Serif SC", serif;
  font-size: 18px;
  font-weight: 800;
}

.ai-result__confidence {
  margin-top: 4px;
  color: #2f5233;
  font-size: 11px;
  font-weight: 800;
}

.ai-result__note {
  margin-top: 9px;
  color: #8d8782;
  font-size: 9px;
  line-height: 1.6;
}

.submission-card {
  display: block;
  text-align: left;
}

.submission-total {
  border-radius: 999px;
  padding: 3px 7px;
  background: rgba(47, 82, 51, 0.1);
  color: #2f5233;
  font-size: 8px;
  font-weight: 800;
}

.submission-filter {
  margin-bottom: 14px;
}

.submission-filter > text {
  display: block;
  margin-bottom: 6px;
  color: #a8a29e;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.08em;
}

.submission-filter .filter-chip {
  display: flex;
  align-items: center;
  gap: 5px;
}

.submission-filter .filter-chip text {
  border-radius: 999px;
  padding: 1px 4px;
  background: #f5f5f4;
  color: #78716c;
  font-size: 8px;
}

.submission-filter .filter-chip--active text {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
}

.submission-type {
  color: #8d8782;
  font-size: 9px;
  font-weight: 800;
}

.submission-status {
  border-radius: 999px;
  padding: 3px 8px;
  background: #fef3c7;
  color: #92400e;
  font-size: 9px;
}

.submission-status--official {
  background: rgba(47, 82, 51, 0.09);
  color: #2f5233;
}

.submission-status--candidate {
  background: #eff6ff;
  color: #1d4ed8;
}

.submission-status--need_supplement {
  background: #fef2f2;
  color: #b91c1c;
}

.submission-status--submitted {
  background: #f5f5f4;
  color: #57534e;
}

.submission-status--rejected {
  background: #fafaf9;
  color: #a8a29e;
}

.submission-card__title,
.submission-card__date,
.submission-card__copy {
  display: block;
}

.submission-card__main {
  display: flex;
  gap: 11px;
  margin-top: 9px;
}

.submission-card__main > view {
  min-width: 0;
  flex: 1;
}

.submission-card__photo {
  width: 64px;
  height: 64px;
  flex: 0 0 auto;
  border-radius: 11px;
  background: #f5f5f4;
}

.submission-card__main .submission-card__title {
  margin-top: 0;
}

.submission-card__animal {
  display: block;
  margin-top: 6px;
  color: #57534e;
  font-size: 8px;
  font-weight: 700;
}

.submission-card .admin-comment {
  display: flex;
  flex-direction: column;
  gap: 3px;
  border-radius: 10px;
  margin-top: 10px;
  padding: 8px;
  background: #fafaf9;
  color: #78716c;
  font-size: 9px;
  line-height: 1.5;
}

.submission-card .admin-comment text:first-child {
  color: #2f5233;
  font-weight: 800;
}

.submission-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1px solid #f5f5f4;
  margin-top: 10px;
  padding-top: 8px;
  color: #a8a29e;
  font-size: 8px;
}

.submission-card__footer text:last-child {
  color: #2f5233;
  font-weight: 800;
}

.submission-card__title {
  margin-top: 9px;
  color: #292524;
  font-size: 12px;
  font-weight: 800;
}

.submission-card__date {
  margin-top: 4px;
  color: #a8a29e;
  font-size: 9px;
}

.submission-card__copy {
  display: -webkit-box;
  overflow: hidden;
  margin-top: 8px;
  color: #78716c;
  font-size: 10px;
  line-height: 1.55;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.task-center-card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #b83b26;
  font-size: 9px;
  font-weight: 800;
}

.task-center-card__top > text:last-child {
  max-width: 68%;
  overflow: hidden;
  color: #a8a29e;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.task-center-intro {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 14px;
}

.task-center-intro text:first-child {
  color: #b83b26;
  font-size: 11px;
  font-weight: 800;
}

.task-center-intro text:last-child {
  color: #78716c;
  font-size: 9px;
  line-height: 1.55;
}

.task-center-intro .button {
  width: 100%;
  margin-top: 8px;
}

.task-center-tag {
  align-self: flex-start;
  border-radius: 4px;
  padding: 3px 7px;
  background: #fef2f2;
  color: #b83b26;
  font-size: 8px;
  font-weight: 800;
}

.task-center-card__title,
.task-center-card__copy {
  display: block;
}

.task-expected {
  display: flex;
  flex-direction: column;
  gap: 3px;
  border-left: 3px solid #d9c3b0;
  margin: 0 0 12px;
  padding: 8px 10px;
  background: #faf8f5;
}

.task-expected text:first-child {
  color: #8d6e58;
  font-size: 8px;
  font-weight: 800;
  letter-spacing: 0.08em;
}

.task-expected text:last-child {
  color: #57534e;
  font-size: 9px;
  line-height: 1.55;
}

.collaboration-form-note,
.task-context-card {
  display: flex;
  flex-direction: column;
  gap: 5px;
  border: 1px solid rgba(47, 82, 51, 0.16);
  border-radius: 13px;
  padding: 13px;
  background: rgba(47, 82, 51, 0.05);
}

.collaboration-form-note text:first-child,
.task-context-card text:first-child {
  color: #2f5233;
  font-size: 11px;
  font-weight: 800;
}

.collaboration-form-note text:last-child,
.task-context-card text:last-child {
  color: #78716c;
  font-size: 9px;
  line-height: 1.65;
}

.task-center-card__title {
  margin-top: 10px;
  font-size: 13px;
  font-weight: 800;
}

.task-center-card__copy {
  margin: 7px 0 12px;
  color: #78716c;
  font-size: 10px;
  line-height: 1.6;
}

.task-center-card__stats {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-radius: 10px;
  margin-bottom: 11px;
  padding: 9px;
  background: #fafaf9;
}

.task-center-card__stats view {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.task-center-card__stats view:last-child {
  text-align: right;
}

.task-center-card__stats view text:first-child {
  color: #a8a29e;
  font-size: 8px;
}

.task-center-card__stats view text:last-child {
  color: #44403c;
  font-size: 9px;
  font-weight: 800;
}

.task-center-card .button {
  width: 100%;
}

.about-banner {
  border-radius: 17px;
  padding: 20px;
  background: #2f5233;
  color: #fff;
}

.about-banner text {
  display: block;
}

.about-banner text:first-child {
  font-family: Georgia, "Noto Serif SC", serif;
  font-size: 16px;
  font-weight: 800;
}

.about-banner text:last-child {
  margin-top: 8px;
  color: #d6d3d1;
  font-size: 10px;
}

.about-section {
  border-left: 3px solid #d9c3b0;
  margin-top: 17px;
  padding-left: 13px;
}

.about-section text {
  display: block;
}

.about-section text:first-child {
  font-size: 12px;
  font-weight: 800;
}

.about-section text:not(:first-child) {
  margin-top: 6px;
  color: #57534e;
  font-size: 10px;
  line-height: 1.8;
}

.admin-tabs {
  margin: 0 -20px 15px;
}

.admin-card__top {
  color: #b83b26;
  font-size: 9px;
  font-weight: 800;
}

.admin-card__title,
.admin-card__meta,
.admin-card__copy {
  display: block;
}

.admin-card__title {
  margin-top: 9px;
  font-size: 13px;
  font-weight: 800;
}

.admin-card__meta {
  margin-top: 3px;
  color: #a8a29e;
  font-size: 9px;
}

.admin-card__copy {
  margin-top: 9px;
  color: #78716c;
  font-size: 10px;
  line-height: 1.6;
}

.admin-card--row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 11px;
  font-weight: 700;
}

.admin-actions {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
  margin-top: 12px;
}

.admin-actions button {
  border-radius: 8px;
  padding: 7px 5px;
  background: #f5f5f4;
  color: #57534e;
  font-size: 9px;
  font-weight: 700;
}

.admin-actions button:first-child {
  background: #2f5233;
  color: #fff;
}

.log-row {
  border-left: 2px solid #d9c3b0;
  padding: 8px 10px;
  color: #57534e;
  font-size: 10px;
}

.bottom-nav {
  position: absolute;
  z-index: 40;
  right: 0;
  bottom: 0;
  left: 0;
  display: grid;
  height: calc(66px + var(--app-safe-bottom));
  grid-template-columns: repeat(5, minmax(0, 1fr));
  border-top: 1px solid #e7e5e4;
  padding: 5px 6px calc(5px + var(--app-safe-bottom));
  background: rgba(250, 248, 245, 0.97);
  box-shadow: 0 -4px 14px rgba(41, 37, 36, 0.04);
  box-sizing: border-box;
  overflow: visible;
}

.bottom-nav__item {
  display: flex;
  width: 100%;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  color: #a8a29e;
  background: transparent;
  font-size: 8px;
  font-weight: 700;
  overflow: visible;
}

.bottom-nav__item--active {
  color: #2f5233;
}

.bottom-nav__item text {
  display: block;
  line-height: 1.2;
  white-space: nowrap;
}

.bottom-nav__icon-box {
  display: flex;
  width: 25px;
  height: 23px;
  align-items: center;
  justify-content: center;
  flex: 0 0 23px;
}

.bottom-nav__item--primary {
  position: relative;
  overflow: visible;
}

.bottom-nav__primary {
  position: absolute;
  z-index: 2;
  top: -24px;
  left: 50%;
  display: flex;
  width: 52px;
  height: 52px;
  align-items: center;
  justify-content: center;
  border: 4px solid #faf8f5;
  border-radius: 50%;
  background: #c75c49;
  box-shadow: 0 6px 14px rgba(184, 59, 38, 0.22);
  box-sizing: border-box;
  transform: translateX(-50%);
}

.bottom-nav__primary-mark,
.bottom-nav__primary-mark::after {
  position: absolute;
  width: 22px;
  height: 3px;
  border-radius: 99px;
  content: "";
  background: #fff;
}

.bottom-nav__primary-mark::after {
  top: 0;
  left: 0;
  transform: rotate(90deg);
}

.bottom-nav__item--active .bottom-nav__primary {
  background: #b83b26;
  box-shadow: 0 0 0 4px rgba(184, 59, 38, 0.18), 0 6px 14px rgba(184, 59, 38, 0.22);
}

.toast {
  position: absolute;
  z-index: 100;
  top: 52px;
  left: 50%;
  display: flex;
  max-width: calc(100% - 36px);
  align-items: center;
  gap: 7px;
  border-radius: 999px;
  padding: 9px 14px;
  background: rgba(41, 37, 36, 0.94);
  color: #fff;
  font-size: 10px;
  line-height: 1.4;
  box-shadow: 0 9px 24px rgba(41, 37, 36, 0.2);
  transform: translateX(-50%);
  animation: toast-in 0.25s ease both;
}

.modal-backdrop {
  position: absolute;
  z-index: 90;
  inset: 0;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 18px 18px calc(18px + var(--app-safe-bottom));
  background: rgba(41, 37, 36, 0.55);
}

.modal-card {
  width: 100%;
  max-height: 76%;
  overflow: hidden;
  border-radius: 19px;
  padding: 17px;
  background: #faf8f5;
  box-shadow: 0 18px 44px rgba(41, 37, 36, 0.3);
}

.login-sheet-backdrop {
  z-index: 120;
  padding: 0;
}

.login-sheet {
  width: 100%;
  max-height: none;
  border-radius: 24px 24px 0 0;
  padding: 10px 20px calc(22px + var(--app-safe-bottom));
}

.login-sheet__handle {
  width: 38px;
  height: 4px;
  border-radius: 999px;
  margin: 0 auto 17px;
  background: #d6d3d1;
}

.login-sheet__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 18px;
}

.login-sheet__header > view {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 6px;
}

.login-sheet__header > view text:first-child {
  color: #292524;
  font-family: Georgia, "Songti SC", serif;
  font-size: 18px;
  font-weight: 800;
}

.login-sheet__header > view text:last-child {
  color: #78716c;
  font-size: 11px;
  line-height: 1.6;
}

.login-sheet__header > button {
  width: 32px;
  height: 32px;
  flex: 0 0 32px;
  border-radius: 50%;
  background: #f1efec;
  color: #78716c;
  font-size: 21px;
}

.wechat-profile-editor {
  display: flex;
  align-items: center;
  gap: 14px;
  border: 1px solid #e7e5e4;
  border-radius: 15px;
  margin-bottom: 15px;
  padding: 14px;
  background: #fff;
}

.wechat-avatar-picker {
  display: flex;
  width: 68px;
  height: 68px;
  flex: 0 0 68px;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 1px dashed #b8c8ba;
  border-radius: 50%;
  background: rgba(47, 82, 51, 0.06);
  color: #2f5233;
}

.wechat-avatar-picker image {
  width: 100%;
  height: 100%;
}

.wechat-avatar-picker > view {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
}

.wechat-avatar-picker > view text:first-child {
  font-size: 21px;
  line-height: 1;
}

.wechat-avatar-picker > view text:last-child {
  font-size: 8px;
}

.wechat-nickname-field {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 5px;
}

.wechat-nickname-field > text:first-child {
  color: #44403c;
  font-size: 11px;
  font-weight: 800;
}

.wechat-nickname-field input {
  width: 100%;
  height: 38px;
  border: 1px solid #dedbd7;
  border-radius: 9px;
  padding: 0 10px;
  background: #fafaf9;
  color: #292524;
  font-size: 11px;
}

.wechat-nickname-field > text:last-child {
  color: #a8a29e;
  font-size: 8px;
  line-height: 1.45;
}

.modal-card--scroll {
  overflow-y: auto;
}

.modal-card--submission {
  width: calc(100% + 36px);
  max-height: 85%;
  border-radius: 28px 28px 0 0;
  margin: 0 -18px -18px;
  padding: 20px;
}

.modal-card--scroll .field {
  margin-top: 12px;
}

.modal-card__header {
  border-bottom: 1px solid #e7e5e4;
  margin-bottom: 13px;
  padding-bottom: 11px;
  font-size: 13px;
  font-weight: 800;
}

.modal-card__header button {
  font-size: 22px;
}

.modal-card__header > view {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.modal-card__header > view text:last-child {
  color: #a8a29e;
  font-family: monospace;
  font-size: 8px;
  font-weight: 500;
}

.modal-title,
.modal-copy {
  display: block;
}

.modal-title {
  font-size: 13px;
  font-weight: 800;
  line-height: 1.5;
}

.modal-meta {
  margin-top: 7px;
  color: #a8a29e;
  font-size: 9px;
}

.modal-copy {
  margin-top: 13px;
  color: #57534e;
  font-size: 10px;
  line-height: 1.7;
}

.admin-comment {
  border-left: 3px solid #2f5233;
  border-radius: 0 10px 10px 0;
  margin: 14px 0;
  padding: 10px 12px;
  background: rgba(47, 82, 51, 0.06);
}

.admin-comment text {
  display: block;
}

.admin-comment text:first-child {
  color: #2f5233;
  font-size: 9px;
  font-weight: 800;
}

.admin-comment text:last-child {
  margin-top: 4px;
  color: #57534e;
  font-size: 10px;
  line-height: 1.6;
}

.submission-modal__photo {
  width: 100%;
  height: 160px;
  border-radius: 14px;
  margin-bottom: 12px;
  background: #f5f5f4;
}

.submission-modal__status {
  display: flex;
  flex-direction: column;
  gap: 7px;
  border: 1px solid #e7e5e4;
  border-radius: 11px;
  margin-top: 13px;
  padding: 10px;
  background: #fafaf9;
}

.submission-modal__status > view {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #44403c;
  font-size: 9px;
  font-weight: 800;
}

.submission-modal__status > text:last-child {
  color: #78716c;
  font-size: 9px;
  line-height: 1.55;
}

.submission-modal__section {
  margin-top: 13px;
}

.submission-modal__section > text:first-child {
  color: #a8a29e;
  font-size: 8px;
  font-weight: 800;
  letter-spacing: 0.08em;
}

.submission-modal__section .modal-copy {
  border: 1px solid #e7e5e4;
  border-radius: 11px;
  margin-top: 6px;
  padding: 10px;
  background: #fff;
}

.submission-modal__metadata {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 9px;
  border: 1px solid #e7e5e4;
  border-radius: 11px;
  margin: 12px 0;
  padding: 10px;
  background: #fafaf9;
}

.submission-modal__metadata view,
.submission-modal__metadata text {
  display: block;
}

.submission-modal__metadata view > text:first-child {
  color: #a8a29e;
  font-size: 8px;
  font-weight: 800;
}

.submission-modal__metadata view > text:last-child {
  margin-top: 4px;
  color: #44403c;
  font-size: 9px;
  line-height: 1.5;
}

.desktop-hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  margin-top: 12px;
  color: #78716c;
  font-size: 10px;
}

.desktop-hint text:first-child {
  font-weight: 800;
}

@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes toast-in {
  from {
    opacity: 0;
    transform: translate(-50%, -8px);
  }
  to {
    opacity: 1;
    transform: translate(-50%, 0);
  }
}

@keyframes scan {
  from {
    top: 20%;
  }
  to {
    top: 76%;
  }
}

@media (max-width: 767px) {
  .app-viewport {
    display: block;
    min-height: 100vh;
    min-height: 100dvh;
    overflow: visible;
    padding-top: 0;
    background: #faf8f5;
  }

  .phone-shell {
    width: 100vw;
    height: 100vh;
    height: 100dvh;
    border: 0;
    border-radius: 0;
    box-shadow: none;
  }

  .phone-shell::before,
  .status-bar,
  .desktop-hint {
    display: none;
  }

  .onboarding {
    min-height: calc(100vh - 80px);
    min-height: calc(100dvh - 80px);
    padding-top: calc(18px + var(--app-safe-top));
    padding-bottom: calc(24px + var(--app-safe-bottom));
  }

  .page-stage {
    padding-top: var(--app-header-safe-top);
  }

  .toast {
    top: calc(var(--app-header-safe-top) + 8px);
  }

  .modal-backdrop {
    position: fixed;
  }
}

@media (max-width: 350px) {
  .onboarding {
    padding-right: 20px;
    padding-left: 20px;
  }

  .brand-title--large {
    font-size: 24px;
    letter-spacing: 0.02em;
  }
}
</style>
