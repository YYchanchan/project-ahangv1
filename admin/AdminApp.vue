<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import type { Animal, PublicMemoryRecord, Species, TaskChallenge, User, UserRole, UserStatus } from "../src/types";
import AdminIcon from "./AdminIcon.vue";

type TabId = "review" | "animals" | "species" | "memories" | "tasks" | "users" | "logs";
type SubmissionType = "recommend" | "observation" | "memory" | "correction" | "archive" | "task";
type SubmissionStatus = "pending" | "approved" | "need_supplement" | "rejected";

interface LoginResponse { token: string; user: User }
interface Submission {
  id: string;
  submitterName: string;
  type: SubmissionType;
  animalId?: string;
  animalName: string;
  title: string;
  details: string;
  mediaUrl?: string;
  source?: string;
  copyright?: string;
  status: SubmissionStatus;
  statusLabel: string;
  adminComment: string;
  submittedAt: string;
}
interface Stats { pending: number; today: number; approvedThisMonth: number; animalCount: number }
interface ReviewLog { id: string; operator: string; action: string; targetType: string; targetId: string; createdAt: string }

const TOKEN_KEY = "ahang_admin_token";
const currentUser = ref<User | null>(null);
const token = ref(localStorage.getItem(TOKEN_KEY) || "");
const loading = ref(false);
const loginLoading = ref(false);
const activeTab = ref<TabId>("review");
const toast = ref("");
const errorMessage = ref("");
const stats = ref<Stats>({ pending: 0, today: 0, approvedThisMonth: 0, animalCount: 0 });
const submissions = ref<Submission[]>([]);
const animals = ref<Animal[]>([]);
const species = ref<Species[]>([]);
const memories = ref<PublicMemoryRecord[]>([]);
const tasks = ref<TaskChallenge[]>([]);
const users = ref<User[]>([]);
const logs = ref<ReviewLog[]>([]);
const search = ref("");
const typeFilter = ref<SubmissionType | "all">("all");
const statusFilter = ref<SubmissionStatus | "all">("pending");
const reviewTarget = ref<Submission | null>(null);
const reviewDecision = ref<Exclude<SubmissionStatus, "pending">>("approved");
const reviewComment = ref("");
const editingAnimal = ref<Animal | null>(null);
const editingSpecies = ref<Species | null>(null);
const editingMemory = ref<PublicMemoryRecord | null>(null);
const editingTask = ref<TaskChallenge | null>(null);
const imageUploading = ref(false);
const loginForm = reactive({ username: "", password: "" });
let toastTimer: number | undefined;

const tabs: Array<{ id: TabId; label: string; icon: string }> = [
  { id: "review", label: "审核中心", icon: "review" },
  { id: "animals", label: "动物档案", icon: "animal" },
  { id: "species", label: "物种知识", icon: "book" },
  { id: "memories", label: "公众回忆", icon: "review" },
  { id: "tasks", label: "协作任务", icon: "log" },
  { id: "users", label: "用户管理", icon: "users" },
  { id: "logs", label: "审核日志", icon: "log" },
];

const typeLabels: Record<SubmissionType, string> = {
  recommend: "推荐建档",
  observation: "观察记录",
  memory: "纪念回忆",
  correction: "纠错补充",
  archive: "历史资料",
  task: "协作任务",
};

const filteredSubmissions = computed(() => {
  const query = search.value.trim().toLowerCase();
  return submissions.value.filter((item) =>
    (typeFilter.value === "all" || item.type === typeFilter.value) &&
    (statusFilter.value === "all" || item.status === statusFilter.value) &&
    (!query || [item.title, item.animalName, item.submitterName].join(" ").toLowerCase().includes(query)),
  );
});

const filteredAnimals = computed(() => {
  const query = search.value.trim().toLowerCase();
  return animals.value.filter((item) => !query || [item.name, item.nickname, item.species, item.institution, item.city].join(" ").toLowerCase().includes(query));
});

const filteredSpecies = computed(() => {
  const query = search.value.trim().toLowerCase();
  return species.value.filter((item) => {
    const profile = item.biologicalProfile;
    return !query || [profile.chineseName, profile.englishName, profile.latinName].join(" ").toLowerCase().includes(query);
  });
});

const filteredUsers = computed(() => {
  const query = search.value.trim().toLowerCase();
  return users.value.filter((item) => !query || `${item.nickname} ${item.id}`.toLowerCase().includes(query));
});

const filteredMemories = computed(() => {
  const query = search.value.trim().toLowerCase();
  return memories.value.filter((item) => !query || [item.title, item.author, item.text].join(" ").toLowerCase().includes(query));
});

const filteredTasks = computed(() => {
  const query = search.value.trim().toLowerCase();
  return tasks.value.filter((item) => !query || [item.title, item.description, item.animalName].join(" ").toLowerCase().includes(query));
});

function clone<T>(value: T): T { return JSON.parse(JSON.stringify(value)) as T; }
function formatTime(value: string) { return value ? value.replace("T", " ").slice(0, 16) : "--"; }
function showToast(message: string) {
  toast.value = message;
  if (toastTimer) window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => { toast.value = ""; }, 2600);
}

async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const isFormData = options.body instanceof FormData;
  const response = await fetch(path, {
    ...options,
    headers: {
      ...(!isFormData ? { "Content-Type": "application/json" } : {}),
      ...(token.value ? { Authorization: `Bearer ${token.value}` } : {}),
      ...(options.headers || {}),
    },
  });
  const body = await response.json().catch(() => ({})) as { error?: string } & T;
  if (!response.ok) {
    if (response.status === 401 && token.value) logout(false);
    throw new Error(body.error || `请求失败（${response.status}）`);
  }
  return body;
}

function resolveAdminMediaUrl(source?: string): string {
  if (!source) return "";
  if (/^(https?:|data:|blob:)/i.test(source)) return source;
  return new URL(source, window.location.origin).href;
}

async function uploadAdminImage(event: Event, target: "animal" | "memory") {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  imageUploading.value = true;
  errorMessage.value = "";
  try {
    const form = new FormData();
    form.append("file", file);
    const result = await api<{ url: string }>("/api/uploads", { method: "POST", body: form });
    if (target === "animal" && editingAnimal.value) {
      const previousImage = editingAnimal.value.image;
      const gallery = [...(editingAnimal.value.gallery || [])];
      const previousIndex = gallery.indexOf(previousImage);
      if (previousIndex >= 0) gallery[previousIndex] = result.url;
      else gallery.unshift(result.url);
      editingAnimal.value.image = result.url;
      editingAnimal.value.coverUrl = result.url;
      editingAnimal.value.gallery = [...new Set(gallery.filter(Boolean))];
      editingAnimal.value.imageType = "official_photo";
    }
    if (target === "memory" && editingMemory.value) editingMemory.value.image = result.url;
    showToast("图片已上传到服务器 uploads，保存内容后同步到用户端");
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : "图片上传失败";
  } finally {
    imageUploading.value = false;
    input.value = "";
  }
}

async function login() {
  if (!loginForm.username.trim() || !loginForm.password) {
    errorMessage.value = "请输入管理员账号和密码";
    return;
  }
  loginLoading.value = true;
  errorMessage.value = "";
  try {
    const result = await api<LoginResponse>("/api/auth/admin", {
      method: "POST",
      body: JSON.stringify(loginForm),
    });
    token.value = result.token;
    localStorage.setItem(TOKEN_KEY, result.token);
    currentUser.value = result.user;
    loginForm.password = "";
    await loadAll();
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : "登录失败";
  } finally {
    loginLoading.value = false;
  }
}

function logout(notify = true) {
  token.value = "";
  currentUser.value = null;
  localStorage.removeItem(TOKEN_KEY);
  if (notify) showToast("已安全退出管理后台");
}

async function loadAll() {
  loading.value = true;
  errorMessage.value = "";
  try {
    const userRequest = currentUser.value?.role === "admin"
      ? api<{ items: User[] }>("/api/admin/users")
      : Promise.resolve({ items: [] as User[] });
    const [statsResult, submissionResult, animalResult, speciesResult, memoryResult, taskResult, userResult, logResult] = await Promise.all([
      api<{ stats: Stats }>("/api/admin/stats"),
      api<{ items: Submission[] }>("/api/admin/submissions"),
      api<{ items: Animal[] }>("/api/admin/animals"),
      api<{ items: Species[] }>("/api/admin/species"),
      api<{ items: PublicMemoryRecord[] }>("/api/admin/memories"),
      api<{ items: TaskChallenge[] }>("/api/admin/tasks"),
      userRequest,
      api<{ items: ReviewLog[] }>("/api/admin/logs"),
    ]);
    stats.value = statsResult.stats;
    submissions.value = submissionResult.items;
    animals.value = animalResult.items;
    species.value = speciesResult.items;
    memories.value = memoryResult.items;
    tasks.value = taskResult.items;
    users.value = userResult.items;
    logs.value = logResult.items;
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : "管理数据加载失败";
  } finally {
    loading.value = false;
  }
}

function selectTab(id: TabId) {
  activeTab.value = id;
  search.value = "";
  errorMessage.value = "";
}

function openReview(item: Submission, decision: Exclude<SubmissionStatus, "pending">) {
  reviewTarget.value = item;
  reviewDecision.value = decision;
  reviewComment.value = decision === "approved"
    ? "资料核验通过，现已公开。"
    : decision === "need_supplement"
      ? "请补充可核对的时间、地点、拍摄原图或公开来源。"
      : "资料不符合公开收录标准，已退回。";
}

async function submitReview() {
  if (!reviewTarget.value || !reviewComment.value.trim()) return;
  loading.value = true;
  try {
    await api(`/api/admin/submissions/${reviewTarget.value.id}/review`, {
      method: "PUT",
      body: JSON.stringify({ status: reviewDecision.value, comment: reviewComment.value.trim() }),
    });
    showToast("审核结果已保存，公开数据已同步");
    reviewTarget.value = null;
    await loadAll();
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : "审核失败";
  } finally {
    loading.value = false;
  }
}

async function saveAnimal() {
  if (!editingAnimal.value?.id.trim() || !editingAnimal.value.name.trim()) return;
  loading.value = true;
  try {
    await api(`/api/admin/animals/${encodeURIComponent(editingAnimal.value.id)}`, { method: "PUT", body: JSON.stringify({ animal: editingAnimal.value }) });
    editingAnimal.value = null;
    showToast("动物档案已保存并同步到用户端");
    await loadAll();
  } catch (error) { errorMessage.value = error instanceof Error ? error.message : "保存失败"; }
  finally { loading.value = false; }
}

async function saveSpecies() {
  if (!editingSpecies.value?.id.trim() || !editingSpecies.value.biologicalProfile.chineseName.trim()) return;
  loading.value = true;
  try {
    await api(`/api/admin/species/${encodeURIComponent(editingSpecies.value.id)}`, { method: "PUT", body: JSON.stringify({ species: editingSpecies.value }) });
    editingSpecies.value = null;
    showToast("物种知识已保存并同步到用户端");
    await loadAll();
  } catch (error) { errorMessage.value = error instanceof Error ? error.message : "保存失败"; }
  finally { loading.value = false; }
}

async function saveMemory() {
  if (!editingMemory.value?.id.trim() || !editingMemory.value.title.trim()) return;
  loading.value = true;
  try {
    const memory = { ...editingMemory.value, animalIds: editingMemory.value.animalIds.filter(Boolean) };
    await api(`/api/admin/memories/${encodeURIComponent(memory.id)}`, { method: "PUT", body: JSON.stringify({ memory }) });
    editingMemory.value = null;
    showToast("公众回忆已保存并同步到用户端");
    await loadAll();
  } catch (error) { errorMessage.value = error instanceof Error ? error.message : "保存失败"; }
  finally { loading.value = false; }
}

async function saveTask() {
  if (!editingTask.value?.id.trim() || !editingTask.value.title.trim()) return;
  loading.value = true;
  try {
    await api(`/api/admin/tasks/${encodeURIComponent(editingTask.value.id)}`, { method: "PUT", body: JSON.stringify({ task: editingTask.value }) });
    editingTask.value = null;
    showToast("协作任务已保存并同步到用户端");
    await loadAll();
  } catch (error) { errorMessage.value = error instanceof Error ? error.message : "保存失败"; }
  finally { loading.value = false; }
}

async function deleteContent(kind: "animals" | "species" | "memories" | "tasks", id: string, name: string) {
  if (!window.confirm(`确定删除“${name}”吗？此操作会同步到用户端。`)) return;
  loading.value = true;
  try {
    await api(`/api/admin/${kind}/${encodeURIComponent(id)}`, { method: "DELETE" });
    showToast("内容已从 MySQL 删除");
    await loadAll();
  } catch (error) { errorMessage.value = error instanceof Error ? error.message : "删除失败"; }
  finally { loading.value = false; }
}

function createAnimal() {
  editingAnimal.value = {
    id: "", name: "", nickname: "", species: "", scientificName: "", speciesCode: "", image: "",
    imageType: "placeholder", status: "need_info", institution: "", city: "", gender: "未知",
    lifeSpan: "待核实", statusLabel: "待补充", tags: [], description: "", timeline: [], observations: [],
    verified: false, verifiedCount: 0, summary: "", recordCount: 0,
  };
}

function createSpecies() {
  editingSpecies.value = {
    id: "",
    biologicalProfile: { chineseName: "", englishName: "", latinName: "", kingdom: "", phylum: "", className: "", order: "", family: "", genus: "", species: "" },
    basicInfo: { captiveLifespan: "", weight: "", sizeHeight: "", diet: "", socialStructure: "", activityTime: "", reproduction: "", distribution: "", habitat: "", iucnStatus: "", citesStatus: "" },
    characteristics: [], faqs: [], extendedReading: { congeneric: [], confamilial: [], articles: [], courses: [], videos: [], creativeProducts: [] },
  };
}

function createMemory() {
  editingMemory.value = { id: "", animalIds: [], title: "", author: "", date: "", text: "", category: "reminiscence", categoryLabel: "回忆", likes: 0, hasLiked: false };
}

function createTask() {
  editingTask.value = { id: "", title: "", description: "", rewardLabel: "共同完善动物档案", progressText: "等待第一条有效线索", actionText: "提供线索", expectedInfo: "", creatorName: currentUser.value?.nickname || "管理后台", contributionCount: 0 };
}

async function updateUser(item: User, update: { role?: UserRole; status?: UserStatus }) {
  loading.value = true;
  try {
    await api(`/api/admin/users/${item.id}`, { method: "PUT", body: JSON.stringify(update) });
    showToast(`${item.nickname} 的权限已更新`);
    await loadAll();
  } catch (error) { errorMessage.value = error instanceof Error ? error.message : "更新失败"; }
  finally { loading.value = false; }
}

onMounted(async () => {
  if (!token.value) return;
  try {
    const result = await api<{ user: User }>("/api/auth/me");
    if (!['reviewer', 'admin'].includes(result.user.role)) throw new Error("当前账号没有管理权限");
    currentUser.value = result.user;
    await loadAll();
  } catch (error) {
    logout(false);
    errorMessage.value = error instanceof Error ? error.message : "登录已失效";
  }
});
</script>

<template>
  <main v-if="!currentUser" class="login-page">
    <section class="login-card">
      <div class="brand-lockup"><span>PROJECT AHANG</span><strong>阿杭计划</strong></div>
      <div class="login-shield"><AdminIcon name="review" :size="30" /></div>
      <h1>管理后台</h1>
      <p>内容审核、动物档案与物种知识统一管理</p>
      <label><span>管理员账号</span><input v-model="loginForm.username" autocomplete="username" placeholder="请输入账号" /></label>
      <label><span>密码</span><input v-model="loginForm.password" type="password" autocomplete="current-password" placeholder="请输入密码" @keyup.enter="login" /></label>
      <div v-if="errorMessage" class="form-error">{{ errorMessage }}</div>
      <button class="primary-button" :disabled="loginLoading" @click="login">{{ loginLoading ? "正在登录…" : "登录管理后台" }}</button>
      <small>审核操作将写入操作日志。管理站与公众端相互独立。</small>
    </section>
  </main>

  <div v-else class="admin-shell">
    <aside class="sidebar">
      <div class="sidebar-brand"><span>PROJECT AHANG</span><strong>阿杭计划</strong></div>
      <div class="admin-identity"><div class="admin-avatar">{{ currentUser.nickname.charAt(0) }}</div><div><strong>{{ currentUser.nickname }}</strong><span>{{ currentUser.role === 'admin' ? '管理员' : '审核员' }}</span></div></div>
      <nav aria-label="管理目录">
        <button v-for="item in tabs" :key="item.id" :class="{ active: activeTab === item.id }" @click="selectTab(item.id)"><AdminIcon :name="item.icon" :size="19" /><span>{{ item.label }}</span><em v-if="item.id === 'review' && stats.pending">{{ stats.pending }}</em></button>
      </nav>
      <button class="logout-button" @click="logout()"><AdminIcon name="logout" :size="19" /><span>退出登录</span></button>
    </aside>

    <section class="workspace">
      <header class="workspace-header"><div><h1>{{ tabs.find((item) => item.id === activeTab)?.label }}</h1><p>阿杭计划 / {{ tabs.find((item) => item.id === activeTab)?.label }}</p></div><button class="refresh-button" :disabled="loading" @click="loadAll"><AdminIcon name="refresh" :size="17" />刷新数据</button></header>
      <div v-if="errorMessage" class="page-error">{{ errorMessage }}</div>

      <template v-if="activeTab === 'review'">
        <div class="stats-grid"><article><span>待审核内容</span><strong class="danger">{{ stats.pending }}</strong></article><article><span>今日新增</span><strong>{{ stats.today }}</strong></article><article><span>已通过（本月）</span><strong>{{ stats.approvedThisMonth }}</strong></article><article><span>档案总数</span><strong>{{ stats.animalCount }}</strong></article></div>
        <div class="filter-bar"><label><span>内容类型</span><select v-model="typeFilter"><option value="all">全部类型</option><option v-for="(label, id) in typeLabels" :key="id" :value="id">{{ label }}</option></select></label><label><span>提交状态</span><select v-model="statusFilter"><option value="all">全部状态</option><option value="pending">待审核</option><option value="need_supplement">需补充</option><option value="approved">已通过</option><option value="rejected">已退回</option></select></label><label class="search-control"><span>动物或提交者</span><div><AdminIcon name="search" :size="16" /><input v-model="search" placeholder="搜索动物、标题或提交者" /></div></label><button class="query-button">查询</button></div>
        <div class="table-panel">
          <table><thead><tr><th>类型</th><th>动物 / 内容</th><th>提交者</th><th>提交时间</th><th>版权 / 来源</th><th>状态</th><th>操作</th></tr></thead><tbody>
            <tr v-for="item in filteredSubmissions" :key="item.id"><td><span class="type-tag">{{ typeLabels[item.type] }}</span></td><td><strong>{{ item.title }}</strong><span>{{ item.animalName }}</span></td><td>{{ item.submitterName }}</td><td>{{ formatTime(item.submittedAt) }}</td><td><strong>{{ item.copyright || '待核对' }}</strong><span>{{ item.source || '未填写来源' }}</span></td><td><span class="status-tag" :class="item.status">{{ item.statusLabel }}</span></td><td><div class="row-actions"><button @click="openReview(item, 'approved')">通过</button><button @click="openReview(item, 'need_supplement')">要求补充</button><button class="danger-link" @click="openReview(item, 'rejected')">退回</button></div></td></tr>
            <tr v-if="!filteredSubmissions.length"><td colspan="7" class="empty-cell">当前筛选条件下没有投稿</td></tr>
          </tbody></table>
        </div>
      </template>

      <template v-else-if="activeTab === 'animals'">
        <div class="section-toolbar"><div class="toolbar-search"><AdminIcon name="search" :size="17" /><input v-model="search" placeholder="搜索名字、物种、城市或机构" /></div><div class="toolbar-actions"><span>共 {{ filteredAnimals.length }} 份公开档案</span><button class="primary-button" @click="createAnimal">新增档案</button></div></div>
        <div class="table-panel"><table><thead><tr><th>动物</th><th>物种</th><th>机构 / 城市</th><th>状态</th><th>记录数</th><th>操作</th></tr></thead><tbody><tr v-for="item in filteredAnimals" :key="item.id"><td><div class="animal-cell"><img :src="resolveAdminMediaUrl(item.image)" alt="" /><div><strong>{{ item.name }}</strong><span>{{ item.nickname }}</span></div></div></td><td>{{ item.species }}</td><td><strong>{{ item.institution }}</strong><span>{{ item.city }}</span></td><td><span class="status-tag approved">{{ item.statusLabel }}</span></td><td>{{ item.recordCount || item.observations.length }}</td><td><div class="row-actions"><button @click="editingAnimal = clone(item)">编辑</button><button class="danger-link" @click="deleteContent('animals', item.id, item.name)">删除</button></div></td></tr></tbody></table></div>
      </template>

      <template v-else-if="activeTab === 'species'">
        <div class="section-toolbar"><div class="toolbar-search"><AdminIcon name="search" :size="17" /><input v-model="search" placeholder="搜索中文名、英文名或拉丁名" /></div><div class="toolbar-actions"><span>共 {{ filteredSpecies.length }} 条物种知识</span><button class="primary-button" @click="createSpecies">新增物种</button></div></div>
        <div class="table-panel"><table><thead><tr><th>中文名</th><th>英文名</th><th>拉丁名</th><th>保护状态</th><th>操作</th></tr></thead><tbody><tr v-for="item in filteredSpecies" :key="item.id"><td><strong>{{ item.biologicalProfile.chineseName }}</strong></td><td>{{ item.biologicalProfile.englishName }}</td><td><i>{{ item.biologicalProfile.latinName }}</i></td><td>{{ item.basicInfo.iucnStatus }}</td><td><div class="row-actions"><button @click="editingSpecies = clone(item)">编辑</button><button class="danger-link" @click="deleteContent('species', item.id, item.biologicalProfile.chineseName)">删除</button></div></td></tr></tbody></table></div>
      </template>

      <template v-else-if="activeTab === 'memories'">
        <div class="section-toolbar"><div class="toolbar-search"><AdminIcon name="search" :size="17" /><input v-model="search" placeholder="搜索标题、作者或内容" /></div><div class="toolbar-actions"><span>共 {{ filteredMemories.length }} 条回忆</span><button class="primary-button" @click="createMemory">新增回忆</button></div></div>
        <div class="table-panel"><table><thead><tr><th>标题</th><th>作者</th><th>日期</th><th>关联动物</th><th>点赞</th><th>操作</th></tr></thead><tbody><tr v-for="item in filteredMemories" :key="item.id"><td><strong>{{ item.title }}</strong><span>{{ item.text.slice(0, 60) }}</span></td><td>{{ item.author }}</td><td>{{ item.date }}</td><td>{{ item.animalIds.join(', ') }}</td><td>{{ item.likes }}</td><td><div class="row-actions"><button @click="editingMemory = clone(item)">编辑</button><button class="danger-link" @click="deleteContent('memories', item.id, item.title)">删除</button></div></td></tr></tbody></table></div>
      </template>

      <template v-else-if="activeTab === 'tasks'">
        <div class="section-toolbar"><div class="toolbar-search"><AdminIcon name="search" :size="17" /><input v-model="search" placeholder="搜索任务、说明或动物" /></div><div class="toolbar-actions"><span>共 {{ filteredTasks.length }} 个任务</span><button class="primary-button" @click="createTask">新增任务</button></div></div>
        <div class="table-panel"><table><thead><tr><th>任务</th><th>关联动物</th><th>发起者</th><th>贡献数</th><th>操作</th></tr></thead><tbody><tr v-for="item in filteredTasks" :key="item.id"><td><strong>{{ item.title }}</strong><span>{{ item.description }}</span></td><td>{{ item.animalName || '不限' }}</td><td>{{ item.creatorName || '--' }}</td><td>{{ item.contributionCount || 0 }}</td><td><div class="row-actions"><button @click="editingTask = clone(item)">编辑</button><button class="danger-link" @click="deleteContent('tasks', item.id, item.title)">删除</button></div></td></tr></tbody></table></div>
      </template>

      <template v-else-if="activeTab === 'users'">
        <div class="section-toolbar"><div class="toolbar-search"><AdminIcon name="search" :size="17" /><input v-model="search" placeholder="搜索昵称或用户 ID" /></div><span>共 {{ filteredUsers.length }} 名用户</span></div>
        <div class="table-panel"><table><thead><tr><th>用户</th><th>角色</th><th>状态</th><th>注册时间</th><th>最近登录</th><th>操作</th></tr></thead><tbody><tr v-for="item in filteredUsers" :key="item.id"><td><div class="user-cell"><div class="user-avatar"><span>{{ item.nickname.charAt(0) || '用' }}</span><img v-if="item.avatarUrl" :src="resolveAdminMediaUrl(item.avatarUrl)" :alt="`${item.nickname}的头像`" /></div><div><strong>{{ item.nickname }}</strong><span>{{ item.id }}</span></div></div></td><td><select :value="item.role" :disabled="item.id === currentUser.id" @change="updateUser(item, { role: ($event.target as HTMLSelectElement).value as UserRole })"><option value="contributor">贡献者</option><option value="reviewer">审核员</option><option value="admin">管理员</option></select></td><td><span class="status-tag" :class="item.status === 'active' ? 'approved' : 'rejected'">{{ item.status === 'active' ? '正常' : item.status === 'pending' ? '待审核' : '已停用' }}</span></td><td>{{ formatTime(item.createdAt) }}</td><td>{{ item.lastLoginAt ? formatTime(item.lastLoginAt) : '--' }}</td><td><button class="edit-link" :disabled="item.id === currentUser.id" @click="updateUser(item, { status: item.status === 'suspended' ? 'active' : 'suspended' })">{{ item.status === 'suspended' ? '恢复账号' : '停用账号' }}</button></td></tr></tbody></table></div>
      </template>

      <template v-else>
        <div class="table-panel"><table><thead><tr><th>时间</th><th>操作员</th><th>操作内容</th><th>对象</th></tr></thead><tbody><tr v-for="item in logs" :key="item.id"><td>{{ formatTime(item.createdAt) }}</td><td>{{ item.operator }}</td><td>{{ item.action }}</td><td><code>{{ item.targetType }} / {{ item.targetId }}</code></td></tr><tr v-if="!logs.length"><td colspan="4" class="empty-cell">暂无审核日志</td></tr></tbody></table></div>
      </template>
    </section>

    <div v-if="reviewTarget" class="modal-backdrop" @click="reviewTarget = null"><section class="modal-card" @click.stop><header><div><h2>{{ reviewTarget.title }}</h2><p>{{ reviewTarget.submitterName }} · {{ formatTime(reviewTarget.submittedAt) }}</p></div><button aria-label="关闭" @click="reviewTarget = null"><AdminIcon name="close" :size="18" /></button></header><dl><div><dt>动物</dt><dd>{{ reviewTarget.animalName }}</dd></div><div><dt>版权/来源</dt><dd>{{ reviewTarget.copyright || '待核对' }} · {{ reviewTarget.source || '未填写' }}</dd></div></dl><div v-if="reviewTarget.mediaUrl" class="submission-preview"><img :src="resolveAdminMediaUrl(reviewTarget.mediaUrl)" alt="投稿图片" /><p>{{ reviewTarget.details }}</p></div><p v-else class="submission-copy">{{ reviewTarget.details }}</p><label><span>审核意见</span><textarea v-model="reviewComment" rows="4"></textarea></label><footer><button class="secondary-button" @click="reviewTarget = null">取消</button><button class="primary-button" @click="submitReview">确认{{ reviewDecision === 'approved' ? '通过并公开' : reviewDecision === 'need_supplement' ? '要求补充' : '退回' }}</button></footer></section></div>

    <div v-if="editingAnimal" class="modal-backdrop" @click="editingAnimal = null">
      <section class="modal-card modal-card-wide" @click.stop>
        <header><div><h2>动物档案</h2><p>新增或编辑后直接写入 MySQL</p></div><button aria-label="关闭" @click="editingAnimal = null"><AdminIcon name="close" :size="18" /></button></header>
        <div class="form-grid">
          <label><span>唯一 ID</span><input v-model="editingAnimal.id" /></label><label><span>名字</span><input v-model="editingAnimal.name" /></label><label><span>昵称</span><input v-model="editingAnimal.nickname" /></label><label><span>物种</span><input v-model="editingAnimal.species" /></label><label><span>机构</span><input v-model="editingAnimal.institution" /></label><label><span>城市</span><input v-model="editingAnimal.city" /></label><label><span>状态说明</span><input v-model="editingAnimal.statusLabel" /></label><label><span>图片 URL</span><input v-model="editingAnimal.image" /></label>
          <div class="image-editor full">
            <img v-if="editingAnimal.image" :src="resolveAdminMediaUrl(editingAnimal.image)" alt="动物图片预览" />
            <div><label class="file-button"><input type="file" accept="image/jpeg,image/png,image/webp" :disabled="imageUploading" @change="uploadAdminImage($event, 'animal')" /><span>{{ imageUploading ? '上传中…' : '上传或更换图片' }}</span></label><a v-if="editingAnimal.image" :href="resolveAdminMediaUrl(editingAnimal.image)" target="_blank" rel="noreferrer">在浏览器查看原图</a><small>图片文件保存到后端 uploads，保存档案后数据库会同步新地址。</small></div>
          </div>
          <label class="full"><span>档案摘要</span><textarea v-model="editingAnimal.summary" rows="4"></textarea></label>
        </div>
        <footer><button class="secondary-button" @click="editingAnimal = null">取消</button><button class="primary-button" @click="saveAnimal">保存并同步</button></footer>
      </section>
    </div>

    <div v-if="editingSpecies" class="modal-backdrop" @click="editingSpecies = null"><section class="modal-card modal-card-wide" @click.stop><header><div><h2>物种知识</h2><p>新增或编辑后直接写入 MySQL</p></div><button aria-label="关闭" @click="editingSpecies = null"><AdminIcon name="close" :size="18" /></button></header><div class="form-grid"><label><span>唯一 ID</span><input v-model="editingSpecies.id" /></label><label><span>中文名</span><input v-model="editingSpecies.biologicalProfile.chineseName" /></label><label><span>英文名</span><input v-model="editingSpecies.biologicalProfile.englishName" /></label><label><span>拉丁名</span><input v-model="editingSpecies.biologicalProfile.latinName" /></label><label><span>保护状态</span><input v-model="editingSpecies.basicInfo.iucnStatus" /></label><label class="full"><span>分布</span><textarea v-model="editingSpecies.basicInfo.distribution" rows="3"></textarea></label><label class="full"><span>栖息地</span><textarea v-model="editingSpecies.basicInfo.habitat" rows="3"></textarea></label></div><footer><button class="secondary-button" @click="editingSpecies = null">取消</button><button class="primary-button" @click="saveSpecies">保存并同步</button></footer></section></div>

    <div v-if="editingMemory" class="modal-backdrop" @click="editingMemory = null">
      <section class="modal-card modal-card-wide" @click.stop>
        <header><div><h2>公众回忆</h2><p>保存后公众端立即从 API 读取</p></div><button aria-label="关闭" @click="editingMemory = null"><AdminIcon name="close" :size="18" /></button></header>
        <div class="form-grid">
          <label><span>唯一 ID</span><input v-model="editingMemory.id" /></label><label><span>标题</span><input v-model="editingMemory.title" /></label><label><span>作者</span><input v-model="editingMemory.author" /></label><label><span>日期</span><input v-model="editingMemory.date" /></label><label><span>关联动物 ID（逗号分隔）</span><input :value="editingMemory.animalIds.join(',')" @input="editingMemory.animalIds = ($event.target as HTMLInputElement).value.split(',').map((item) => item.trim())" /></label><label><span>图片 URL</span><input v-model="editingMemory.image" /></label>
          <div class="image-editor full">
            <img v-if="editingMemory.image" :src="resolveAdminMediaUrl(editingMemory.image)" alt="回忆图片预览" />
            <div><label class="file-button"><input type="file" accept="image/jpeg,image/png,image/webp" :disabled="imageUploading" @change="uploadAdminImage($event, 'memory')" /><span>{{ imageUploading ? '上传中…' : '上传或更换图片' }}</span></label><a v-if="editingMemory.image" :href="resolveAdminMediaUrl(editingMemory.image)" target="_blank" rel="noreferrer">在浏览器查看原图</a><small>图片文件保存到后端 uploads，保存内容后数据库会同步新地址。</small></div>
          </div>
          <label class="full"><span>内容</span><textarea v-model="editingMemory.text" rows="6"></textarea></label>
        </div>
        <footer><button class="secondary-button" @click="editingMemory = null">取消</button><button class="primary-button" @click="saveMemory">保存并同步</button></footer>
      </section>
    </div>

    <div v-if="editingTask" class="modal-backdrop" @click="editingTask = null"><section class="modal-card modal-card-wide" @click.stop><header><div><h2>协作任务</h2><p>保存后公众端任务中心立即可见</p></div><button aria-label="关闭" @click="editingTask = null"><AdminIcon name="close" :size="18" /></button></header><div class="form-grid"><label><span>唯一 ID</span><input v-model="editingTask.id" /></label><label><span>任务标题</span><input v-model="editingTask.title" /></label><label><span>关联动物 ID</span><input v-model="editingTask.animalId" /></label><label><span>关联动物名称</span><input v-model="editingTask.animalName" /></label><label><span>发起者</span><input v-model="editingTask.creatorName" /></label><label><span>任务回报说明</span><input v-model="editingTask.rewardLabel" /></label><label class="full"><span>任务说明</span><textarea v-model="editingTask.description" rows="4"></textarea></label><label class="full"><span>期望资料</span><textarea v-model="editingTask.expectedInfo" rows="3"></textarea></label></div><footer><button class="secondary-button" @click="editingTask = null">取消</button><button class="primary-button" @click="saveTask">保存并同步</button></footer></section></div>

    <div v-if="toast" class="toast">{{ toast }}</div>
    <div v-if="loading" class="loading-mask"><span>正在同步数据…</span></div>
  </div>
</template>
