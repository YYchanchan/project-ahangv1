import React, { useState, useEffect } from "react";
import { useAuth } from "./context/AuthContext";
import {
  canSubmit,
  canViewReviewerWorkspace,
  canReview,
  canViewAdminPanel,
  canManageUsers,
  canEditOfficialAnimal,
  canDeleteOfficialAnimal
} from "./utils/permissions";
import {
  Home,
  BookOpen,
  PlusCircle,
  Heart,
  User,
  Search,
  Bell,
  ChevronLeft,
  ChevronRight,
  Check,
  CheckCircle2,
  AlertCircle,
  Calendar,
  MapPin,
  Sparkles,
  Share2,
  Camera,
  Compass,
  HelpCircle,
  Info,
  ThumbsUp,
  MessageSquare,
  Plus,
  Send,
  X,
  Clock,
  Shield,
  Activity,
  FileText,
  Users
} from "lucide-react";
import { MOCK_ANIMALS, MOCK_CONTRIBUTIONS, TASK_CHALLENGES } from "./data/animals";
import { MOCK_SPECIES } from "./data/species";
import { Animal, Contribution, ObservationRecord, Species } from "./types";
import { AnimalImage } from "./components/AnimalImage";
import { StatusBadge } from "./components/StatusBadge";
import { AboutProjectView } from "./components/AboutProjectView";
import { getSpeciesDefaultImage } from "./data/speciesImages";
import ahangLogo from "./assets/images/ahang_logo_1784366845833.jpg";
import ahangCartoon from "./assets/images/ahang-cartoon.jpg";
import ahangOnboardingMain from "./assets/images/ahang-onboarding-main.jpg";
import didiMain from "./assets/images/didi_main_1784708713394.jpg";
import didiBaby from "./assets/images/didi_baby_1784708723141.jpg";
import didiBirthday from "./assets/images/didi_birthday_1784708733257.jpg";

// Theme color constants for inline visual style documentation or reference
// Background: Soft off-white/sand (#FAF8F5)
// Secondary/Accent: Warm Champagne (#D9C3B0)
// Primary Accent: Grass Green (#2F5233)
// Emphasis Brand Color: Bold Red (#B83B26)
// Detail/Metadata Color: Slate/Blue-Grey (#5A6B7C)

type TabType = "home" | "archives" | "record" | "memorial" | "my";

type ViewState =
  | { type: "onboarding"; step: number }
  | { type: "main"; tab: TabType }
  | { type: "animal_detail"; animalId: string; activeSubTab: "all" | "resting" | "feeding" | "playing" | "moving" }
  | { type: "recommend_animal"; step: number }
  | { type: "my_submissions" }
  | { type: "about_project" }
  | { type: "task_center" }
  | { type: "form_observation" }
  | { type: "form_memory" }
  | { type: "form_correction" }
  | { type: "ai_helper" }
  | { type: "admin_panel"; mode?: "reviewer" | "admin" };

export interface DetailedContribution {
  id: string;
  type: "recommend" | "observation" | "supplement" | "creation" | "correction";
  title: string;
  submittedAt: string;
  status: "submitted" | "pending" | "need_supplement" | "candidate" | "official" | "rejected";
  statusLabel: string;
  details: string;
  adminComment?: string;
  animalName: string;
  photo?: string;
  source?: string;
  copyright?: string;
}

export interface MemorialItem {
  id: string;
  animalId: "ahang" | "others";
  animalName: string;
  category: "screenshot" | "media" | "creation" | "old_photo" | "message";
  platform: string;
  date: string;
  uploader: string;
  originalStatus: string;
  copyrightStatus: "本人截图且内容本人发布" | "仅作为研究线索" | "已获授权公开" | "来源待核实";
  isPublicDisplay: "是" | "有限展示（仅线索）" | "否";
  text: string;
  image?: string;
  likes: number;
  hasLiked?: boolean;
  lightUps: number;
  hasLighted?: boolean;
  originalLink?: string;
}

export interface PublicMemory {
  id: string;
  animalIds: string[];
  title: string;
  author: string;
  date: string;
  text: string;
  category: string;
  categoryLabel: string;
  image?: string;
  likes?: number;
  hasLiked?: boolean;
}

export default function App() {
  // Auth Context for User session and roles
  const { currentUser, login, logout, switchRole } = useAuth();

  // Navigation / Router State
  const [viewState, setViewState] = useState<ViewState>({ type: "onboarding", step: 1 });
  
  // App data state (stored in local memory for demo reactivity)
  const [animals, setAnimals] = useState<Animal[]>(MOCK_ANIMALS);
  const [contributions, setContributions] = useState<Contribution[]>(MOCK_CONTRIBUTIONS);
  const [currentTime, setCurrentTime] = useState("");
  
  // Filters & Searches
  const [archiveFilter, setArchiveFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState("");

  const [flowerOffered, setFlowerOffered] = useState<Record<string, boolean>>({});
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [openedKnowledge, setOpenedKnowledge] = useState<Record<string, boolean>>({});

  // Recommend animal form state
  const [recommendForm, setRecommendForm] = useState({
    province: "广东省",
    city: "广州市",
    zoo: "广州动物园",
    area: "狮虎山区",
    specificPoint: "",
    uncertainLocation: false,
    photo: null as string | null,
    name: "",
    nickname: "",
    dontKnowName: false,
    species: "",
    gender: "未知" as "雄性" | "雌性" | "未知",
    reasons: [] as string[],
    otherReason: "",
    story: "",
    morePhotos: [] as string[],
    sourceLink: "",
    citation: "",
    copyright: "self" as "self" | "authorized" | "cue_only",
    authorized: false,
    isSubmitted: false
  });

  // Simple observation upload form state
  const [showObsModal, setShowObsModal] = useState(false);
  const [obsModalAnimalId, setObsModalAnimalId] = useState("ahang");
  const [obsForm, setObsForm] = useState({
    category: "resting" as "resting" | "feeding" | "playing" | "moving",
    text: "",
    image: null as string | null
  });

  // Advanced multi-step observation page state
  const [obsUploadStep, setObsUploadStep] = useState(1);
  const [obsRecentlyViewed, setObsRecentlyViewed] = useState<string[]>(["ahang", "paopao"]);
  const [obsSearchQuery, setObsSearchQuery] = useState("");
  const [obsSelectedAnimalId, setObsSelectedAnimalId] = useState("ahang");
  const [obsDate, setObsDate] = useState(new Date().toISOString().split("T")[0]);
  const [obsTime, setObsTime] = useState("14:30");
  const [obsLocation, setObsLocation] = useState("广州动物园 狮虎山");
  const [obsSelectedBehaviors, setObsSelectedBehaviors] = useState<string[]>(["睡觉"]);
  const [obsSawEnrichment, setObsSawEnrichment] = useState<"yes" | "no">("no");
  const [obsInteracted, setObsInteracted] = useState<"yes" | "no">("no");
  const [obsDescription, setObsDescription] = useState("");
  const [obsUploadedPhoto, setObsUploadedPhoto] = useState<string | null>(null);
  const [obsCopyrightSelf, setObsCopyrightSelf] = useState(false);
  const [obsCopyrightArchiveOnly, setObsCopyrightArchiveOnly] = useState(false);
  const [obsCopyrightPublicWelfare, setObsCopyrightPublicWelfare] = useState(false);
  const [obsIsSubmitted, setObsIsSubmitted] = useState(false);

  // Memorial Hall comments wall state (Ahang Memorial Hall)
  const [memorialComments, setMemorialComments] = useState([
    { id: "mc-1", animalId: "ahang", username: "广州街坊阿德", text: "多谢你陪伴我哋十一冬，每次去越秀必睇阿杭。一路好走！🦁🌻", timestamp: "1小时前", flowers: 42 },
    { id: "mc-2", animalId: "ahang", username: "月亮邮递员", text: "永远记得那个风很大的下午，你的刘海被吹得一颤一颤的，谢谢你给无数人带来的快乐。", timestamp: "3小时前", flowers: 29 },
    { id: "mc-3", animalId: "ahang", username: "大自然的小信使", text: "生命以另一种方式延续，我们会记住你，阿杭。", timestamp: "1天前", flowers: 15 },
    { id: "mc-didi-1", animalId: "paopao", username: "竹林观察员", text: "迪迪生日快乐！看着你从小不点长成灵动的小明星，要一直健康快乐地成长呀！🐾🎋", timestamp: "2小时前", flowers: 28 },
    { id: "mc-didi-2", animalId: "paopao", username: "小雨", text: "迪迪高空走木架和用小爪子拿苹果吃的时候太萌了！每次来广州动物园必看你！", timestamp: "5小时前", flowers: 19 },
    { id: "mc-didi-3", animalId: "paopao", username: "广州街坊小陈", text: "大蓬松尾巴超级可爱！希望迪迪吃好喝好，继续活泼爱攀爬！", timestamp: "1天前", flowers: 14 }
  ]);
  const [newCommentText, setNewCommentText] = useState("");

  // Animal level candles (Ahang and Bebei)
  const [animalCandles, setAnimalCandles] = useState<Record<string, number>>({
    ahang: 845,
    bebei: 98,
    sunsimiao: 512,
    sunshangxiang: 289,
    xingguang: 418,
    hefeng: 396
  });
  const [candledAnimals, setCandledAnimals] = useState<Record<string, boolean>>({});
  // Custom states for the new record pages
  const [memoryForm, setMemoryForm] = useState({
    animalId: "ahang",
    customAnimalName: "",
    title: "",
    text: "",
    date: "2026-05",
    image: null as string | null,
    author: "Yy Chan"
  });

  const [correctionForm, setCorrectionForm] = useState({
    animalId: "paopao",
    field: "timeline" as "gender" | "age" | "timeline" | "other",
    text: "",
    evidence: "",
    citation: "",
    contact: "yy.mychan@gmail.com"
  });

  const [aiScannerState, setAiScannerState] = useState<{
    status: "idle" | "scanning" | "success";
    scannedImage: string | null;
  }>({ status: "idle", scannedImage: null });

  // Public Memories State for Deceased Animals
  const [publicMemories, setPublicMemories] = useState<PublicMemory[]>([
    {
      id: "pub-mem-1",
      animalIds: ["ahang"],
      title: "广州本地街坊 (2024年春)",
      author: "广州本地街坊",
      date: "2024年春",
      text: "“小时候春游，最期待的就是看狮虎山。那时候的阿杭还是个年轻的小伙子，一身雪白，虽然没有现在的齐刘海，但威风凛凛。后来在网上看到他因为刘海火了，专门带孩子去看他，他老了，温顺得像个大猫。他是我们三代人的广州记忆。”",
      category: "reminiscence",
      categoryLabel: "🌿 回忆",
      likes: 42,
      hasLiked: false
    },
    {
      id: "pub-mem-2",
      animalIds: ["ahang"],
      title: "越秀老街坊 (2025年冬)",
      author: "越秀老街坊",
      date: "2025年冬",
      text: "“自从听说阿杭回后台养病，我们几个天天晨练完顺路去问饲养员。听见他药吃得及时，还爱吃剁得极细的碎肉泥，悬着的心就落下了。他不仅是一个网络大明星，更是我们这些陪着他长大的街坊邻居的老友。”",
      category: "bond",
      categoryLabel: "🤝 羁绊",
      likes: 56,
      hasLiked: false
    },
    {
      id: "pub-mem-3",
      animalIds: ["ahang"],
      title: "微风拂过 (2026年夏)",
      author: "微风拂过",
      date: "2026年夏",
      text: "“收到离世的消息默默流了很久泪。我亲手画了一幅他顶着招牌齐刘海、戴墨镜梳头的卡通图画（正是我们阿杭计划现在的原型LOGO），送到了狮虎山展区外。那里已经自发摆满了街坊们自发敬献的向日葵、鲜花和手写明信片。愿天堂没有关节痛，阿杭，你已被永远记住。”",
      category: "remembrance",
      categoryLabel: "🕯️ 缅怀",
      image: ahangLogo,
      likes: 128,
      hasLiked: false
    },
    {
      id: "pub-mem-4",
      animalIds: ["ahang", "bebei"],
      title: "白狮守护者 (2024年秋)",
      author: "白狮守护者",
      date: "2024年秋",
      text: "“每次去狮虎山，最温馨的画面就是看到贝贝和阿杭并排趴在木平台上晒太阳。阿杭总是憨憨地睡着，而贝贝温和地守在旁边，用大眼睛好奇地看着游客。它们两个就像是老夫老妻，有一种不用言语的默契与宁静。”",
      category: "companionship",
      categoryLabel: "✨ 陪伴",
      likes: 34,
      hasLiked: false
    },
    {
      id: "pub-mem-5",
      animalIds: ["bebei"],
      title: "广州市民 (2025年冬)",
      author: "广州市民",
      date: "2025年冬",
      text: "“（Demo演示）白狮贝贝作为阿杭一生的伴侣，虽然没有阿杭那样标志性的齐刘海，但她那双美丽温和的大眼睛同样治愈了无数人。听到她在2025年末安详离去的消息，心中满是怀念。她和阿杭在另一个世界里也会幸福地相伴吧。”",
      category: "remembrance",
      categoryLabel: "🕯️ 缅怀",
      likes: 18,
      hasLiked: false
    },
    {
      id: "pub-mem-didi-1",
      animalIds: ["paopao"],
      title: "出生与幼年 (2022年夏)",
      author: "广州动物园观察员",
      date: "2022年夏",
      text: "“迪迪于2022年6月30日出生于广州动物园。刚出生时还是个毛茸茸的小球，由妈妈和保育员悉心照料，从小就十分机灵可爱，是许多街坊游客看着长大的‘团宠’小熊猫。”",
      category: "reminiscence",
      categoryLabel: "🌿 回忆",
      image: didiBaby,
      likes: 38,
      hasLiked: false
    },
    {
      id: "pub-mem-didi-2",
      animalIds: ["paopao"],
      title: "一周岁生日 (2023年夏)",
      author: "竹林陪伴者",
      date: "2023年夏",
      text: "“2023年6月30日，游客和园方共同为迪迪庆祝一周岁生日。园方特地准备了竹叶与水果冰蛋糕，迪迪用前爪捧着苹果吃得津津有味，现场许多游客一起送上了祝福！”",
      category: "companionship",
      categoryLabel: "✨ 陪伴",
      image: didiBirthday,
      likes: 52,
      hasLiked: false
    },
    {
      id: "pub-mem-didi-3",
      animalIds: ["paopao"],
      title: "游客成长记忆 (2024年春)",
      author: "越秀公园老朋友",
      date: "2024年春",
      text: "“看着迪迪从刚出生时的小毛球逐渐长成现在攀爬自如、毛色亮丽的小明星。每次带小朋友来广州动物园，迪迪在高空栖架上敏捷走动、摇晃着蓬松环纹尾巴的样子总能治愈所有人。”",
      category: "bond",
      categoryLabel: "🤝 羁绊",
      image: didiMain,
      likes: 45,
      hasLiked: false
    }
  ]);

  const handleLikePublicMemory = (id: string) => {
    setPublicMemories(prev =>
      prev.map(item => {
        if (item.id === id) {
          const hasLiked = !item.hasLiked;
          return {
            ...item,
            hasLiked,
            likes: (item.likes || 0) + (hasLiked ? 1 : -1)
          };
        }
        return item;
      })
    );
  };

  // Memorial Plaza States
  const [memorialAnimalFilter, setMemorialAnimalFilter] = useState<string>("all");
  const [memorialCategoryFilter, setMemorialCategoryFilter] = useState<string>("all");
  const [showUploadMemoryModal, setShowUploadMemoryModal] = useState(false);
  const [uploadMemoryForm, setUploadMemoryForm] = useState({
    contentType: "screenshot" as "screenshot" | "media" | "creation" | "old_photo" | "message",
    belongingAnimal: "ahang" as "ahang" | "others",
    platform: "",
    publishTime: "",
    screenshot: null as string | null,
    originalLink: "",
    description: "",
    isSelfAuthored: "yes" as "yes" | "no",
    authorizationStatus: "本人截图且内容本人发布" as "本人截图且内容本人发布" | "仅作为研究线索" | "已获授权公开" | "来源待核实"
  });

  const [memorialItems, setMemorialItems] = useState<MemorialItem[]>([
    {
      id: "mem-1",
      animalId: "ahang",
      animalName: "白狮“阿杭”",
      category: "screenshot",
      platform: "微信朋友圈",
      date: "2022年10月",
      uploader: "游客-小鱼",
      originalStatus: "私密/不可访问",
      copyrightStatus: "本人截图且内容本人发布",
      isPublicDisplay: "是",
      text: "今天在朋友圈刷到朋友去广州动物园拍的阿杭，这个刘海真是绝了！哈哈哈哈，真想亲眼去看看这头‘齐刘海狮子’！",
      image: "",
      likes: 88,
      lightUps: 120
    },
    {
      id: "mem-2",
      animalId: "ahang",
      animalName: "白狮“阿杭”",
      category: "screenshot",
      platform: "新浪微博",
      date: "2022年05月",
      uploader: "博主@广州身边事",
      originalStatus: "在线",
      copyrightStatus: "仅作为研究线索",
      isPublicDisplay: "是",
      text: "震惊！广州动物园的非洲狮竟然整了个齐刘海，听说是因为南方天气太湿热，鬃毛塌下来了。这也太搞笑了！#广州动物园狮子齐刘海#",
      image: "",
      likes: 154,
      lightUps: 210
    },
    {
      id: "mem-3",
      animalId: "ahang",
      animalName: "白狮“阿杭”",
      category: "media",
      platform: "微信公众号 · 羊城街坊生活",
      date: "2023年03月",
      uploader: "老广研究员",
      originalStatus: "在线",
      copyrightStatus: "已获授权公开",
      isPublicDisplay: "是",
      text: "《在广州，有一头顶流白狮叫阿杭》：作为白狮阿杭来到广州的第8个年头，他早已不只是一头网红动物，更是无数老广街坊周末休闲的温暖回忆。他的齐刘海就像老友的标志，只要看到他安详地晒太阳，就觉得生活很治愈。",
      image: "",
      likes: 112,
      lightUps: 195
    },
    {
      id: "mem-4",
      animalId: "ahang",
      animalName: "白狮“阿杭”",
      category: "media",
      platform: "南方都市报",
      date: "2026年07月15日",
      uploader: "新闻追随者",
      originalStatus: "在线",
      copyrightStatus: "已获授权公开",
      isPublicDisplay: "是",
      text: "《网红白狮‘阿杭’安详离世，享年17岁》：陪伴了广州市民十一载的老朋友阿杭因多脏器衰竭安详仙逝。作为一只曾因发型爆红全国的白狮，他的晚年得到了饲养员 and 兽医团队最温柔的尊严照护。再见，阿杭！",
      image: "",
      likes: 245,
      lightUps: 320
    },
    {
      id: "mem-6",
      animalId: "ahang",
      animalName: "白狮“阿杭”",
      category: "creation",
      platform: "小红书",
      date: "2026年07月",
      uploader: "插画师Momo",
      originalStatus: "在线",
      copyrightStatus: "已获授权公开",
      isPublicDisplay: "是",
      text: "手绘插画《星空下的阿杭》：‘谢谢你来过这世间，治愈了那么多孤独的心。现在，你去到了属于你的星空，那里的风也会为你吹拂出完美的刘海吧。’一路好走，永远的大宝贝！",
      image: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?q=80&w=600",
      likes: 198,
      lightUps: 275
    },
    {
      id: "mem-8",
      animalId: "others",
      animalName: "大熊猫“波波”",
      category: "message",
      platform: "网页留言归档",
      date: "2026年",
      uploader: "波波的老朋友",
      originalStatus: "在线",
      copyrightStatus: "来源待核实",
      isPublicDisplay: "是",
      text: "大熊猫波波，从我还是个小女孩时就看着你在熊猫馆里打滚，一转眼我都当妈妈了，你也早已长眠于地下。听闻阿杭也走的消息，突然很想念你。你们在动物世界的星空里，一定要快乐，广州街坊会一直记得你们！",
      image: "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?q=80&w=600",
      likes: 120,
      lightUps: 180
    }
  ]);

  const handleUploadMemorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadMemoryForm.platform || !uploadMemoryForm.description) {
      triggerToast("请填写平台和截图说明 📝");
      return;
    }

    let targetAnimalName = "其他动物";
    if (uploadMemoryForm.belongingAnimal === "ahang") targetAnimalName = "白狮“阿杭”";
    if (uploadMemoryForm.belongingAnimal === "others") targetAnimalName = "其他动物";

    const newMemItem: MemorialItem = {
      id: `mem-${Date.now()}`,
      animalId: uploadMemoryForm.belongingAnimal,
      animalName: targetAnimalName,
      category: uploadMemoryForm.contentType,
      platform: uploadMemoryForm.platform,
      date: uploadMemoryForm.publishTime || "未知时间",
      uploader: "游客(我)",
      originalStatus: "在线",
      copyrightStatus: uploadMemoryForm.authorizationStatus,
      isPublicDisplay: "是",
      text: uploadMemoryForm.description,
      image: uploadMemoryForm.screenshot || "",
      likes: 0,
      lightUps: 0,
      originalLink: uploadMemoryForm.originalLink
    };

    setMemorialItems([newMemItem, ...memorialItems]);
    setShowUploadMemoryModal(false);
    triggerToast("成功归档一段互联网记忆！💖");

    // Reset form
    setUploadMemoryForm({
      contentType: "screenshot",
      belongingAnimal: "ahang",
      platform: "",
      publishTime: "",
      screenshot: null,
      originalLink: "",
      description: "",
      isSelfAuthored: "yes",
      authorizationStatus: "本人截图且内容本人发布"
    });
  };

  const handleLikeMemorialItem = (id: string) => {
    setMemorialItems(prev =>
      prev.map(item => {
        if (item.id === id) {
          const liked = !item.hasLiked;
          return {
            ...item,
            hasLiked: liked,
            likes: liked ? item.likes + 1 : item.likes - 1
          };
        }
        return item;
      })
    );
    triggerToast("已点赞 💖");
  };

  const handleLightUpMemorialItem = (id: string) => {
    setMemorialItems(prev =>
      prev.map(item => {
        if (item.id === id) {
          const lighted = !item.hasLighted;
          return {
            ...item,
            hasLighted: lighted,
            lightUps: lighted ? item.lightUps + 1 : item.lightUps - 1
          };
        }
        return item;
      })
    );
    triggerToast("已点亮纪念 ✨");
  };

  // ==================== MY CONTRIBUTIONS & HIDDEN ADMIN STATE ====================
  const [selectedSub, setSelectedSub] = useState<DetailedContribution | null>(null);
  const [showSubDetailsModal, setShowSubDetailsModal] = useState(false);
  const [myDetailedContributions, setMyDetailedContributions] = useState<DetailedContribution[]>([
    {
      id: "sub-101",
      type: "recommend",
      title: "推荐设立：广州动物园的非洲狮「阿杭」纪念档案",
      submittedAt: "2026-07-16",
      status: "submitted",
      statusLabel: "已提交",
      animalName: "白狮“阿杭”",
      details: "建议为已故明星白狮阿杭建立专门的历史档案，并提供阿杭年轻时在馆里生活的相关描述以及珍贵图片。",
      adminComment: "您的投稿已成功提交到系统排队中，系统正在进行初步AI排重与敏感性检查。",
      photo: "",
      source: "个人原创素材",
      copyright: "本人自拍版权，授权给平台免费科普使用"
    },
    {
      id: "sub-103",
      type: "supplement",
      title: "补充资料：补充阿杭2015年到穗的确切日期",
      submittedAt: "2026-07-10",
      status: "need_supplement",
      statusLabel: "需要补充",
      animalName: "白狮“阿杭”",
      details: "提交的引进日期（2015年4月12日）与园方早期简报有出入，请补充当时官方通告或纸质门票印戳等可靠佐证。",
      adminComment: "请上传当时报纸截图、官方通告或者门票票根照片，以确保史料的严谨性。",
      photo: "",
      source: "网络转载/老报纸翻拍",
      copyright: "来源待核实"
    },
    {
      id: "sub-104",
      type: "creation",
      title: "推荐设立新动物：广州动物园华南虎「珊珊」",
      submittedAt: "2026-07-05",
      status: "candidate",
      statusLabel: "已收入候选档案",
      animalName: "华南虎“珊珊”",
      details: "珊珊是广州动物园曾经非常重要的一只雌性华南虎，2019年以17岁高龄寿终正寝。希望能单独为她建立一个纪念卡片。",
      adminComment: "珊珊的信息非常有价值，因华南虎数量稀少且珊珊是功臣个体，已将该条记录存入‘候选档案库’。一旦补充足够5条佐证，将自动生成珊珊的正式卡片。",
      photo: "",
      source: "老照片/新闻截图",
      copyright: "仅作为研究线索"
    },
    {
      id: "sub-105",
      type: "observation",
      title: "观察记录：阿杭在斜坡下大树荫里安详休息",
      submittedAt: "2026-07-01",
      status: "official",
      statusLabel: "已成为正式记录",
      animalName: "白狮“阿杭”",
      details: "阿杭在正午时分趴在狮虎山北侧斜坡的大树荫底下，鬃毛很柔顺，有微风，神态看起来非常安详舒服。",
      adminComment: "感谢您的观察！记录清晰、配图完整，已经同步记入白狮阿杭官方档案的时间轴与日常观察记录中，贡献度已自动发放！",
      photo: "",
      source: "实地自拍",
      copyright: "本人截图且内容本人发布"
    },
    {
      id: "sub-106",
      type: "correction",
      title: "推荐设立：大熊猫馆「雅雅」的私密产房档案",
      submittedAt: "2026-06-15",
      status: "rejected",
      statusLabel: "未采用",
      animalName: "大熊猫“雅雅”",
      details: "申请建立雅雅的非公开产房档案，并展示一些繁育细节、温控数据和内部工作照。",
      adminComment: "不予通过。经核实，大熊猫繁育产房属于非公开科研核心区域，涉及敏感数据 and 动物隐私保护，依据平台规定，不收集且不公开展示此类非公开照片。",
      photo: "",
      source: "网络转载",
      copyright: "未获授权公开"
    }
  ]);

  // Settings & Help Modal state
  const [showSettingsHelpModal, setShowSettingsHelpModal] = useState(false);

  // Admin Panel states
  const [adminTab, setAdminTab] = useState<"pending" | "candidates" | "copyright" | "reports" | "volunteers" | "logs">("pending");
  const [adminPendingContribs, setAdminPendingContribs] = useState([
    {
      id: "adm-sub-201",
      type: "补充生命史实",
      animal: "白狮“阿杭”",
      aiSummary: "上传者提供了2018年5月的一张游客票根及微博实拍，显示阿杭当时的‘齐刘海’发型已初具雏形。时间线比目前归档早3个月，具有高度佐证价值。",
      photo: "",
      source: "游客实体票根翻拍 & 新浪微博",
      copyrightStatus: "已获原作者授权公开 (CC-BY-NC)",
      duplicates: "阿杭2018年秋季时光相册 (相似度 45%)"
    },
    {
      id: "adm-sub-203",
      type: "推荐新动物建档",
      animal: "华南虎“珊珊”",
      aiSummary: "申请为已离世的华南虎珊珊建档。上传者提供了2002年至2019年在广州动物园虎山生活的大量珍贵照片与讣告。由于华南虎具有极高保护价值，建议尽快升级为正式档案。",
      photo: "",
      source: "羊城晚报报业数据库",
      copyrightStatus: "仅作为研究线索",
      duplicates: "野生华南虎科普卡片 (相似度 20%)"
    }
  ]);

  const [adminCandidateAnimals, setAdminCandidateAnimals] = useState([
    { id: "cand-1", name: "亚洲黑熊“小木头”", zoo: "广州动物园", progress: "已收集 23 条线索，差 1 个关键引进时间", tags: ["抱着木头", "胸前白V字"] },
    { id: "cand-2", name: "华南虎“珊珊”", zoo: "广州动物园", progress: "已收集 8 条历史报纸线索，正进行AI比对", tags: ["已离世", "珍稀动物"] },
    { id: "cand-3", name: "斑马“小七”", zoo: "越秀公园展区", progress: "资料缺失，急需2020年以前的展区照片", tags: ["黑白条纹", "温顺"] }
  ]);

  const [adminCopyrightAnomalies, setAdminCopyrightAnomalies] = useState([
    { id: "copy-2", target: "阿杭2015年门票截图 #mem-14", reason: "原帖作者在知乎发文要求下架其2015年拍摄的胶片照片，授权状态变更为‘仅研究线索，不公开’。", status: "待处理" }
  ]);

  const [adminCorrectionReports, setAdminCorrectionReports] = useState([
    { id: "corr-1", page: "大熊猫“波波”", type: "年代信息错误", content: "页面上写波波于2018年离世，实际园方公告是2018年11月24日。此外，波波出生地写的是野生救助，其实是1993年繁育出生的。请管理员核对志书。", reporter: "熊猫死忠粉阿华" },
    { id: "corr-2", page: "亚洲黑熊“小木头”", type: "展区位置错误", content: "小木头现在已经搬到熊山B区了，不在原来的A区。游客去A区可能会找不到他。", reporter: "观察员小张" }
  ]);

  const [selectedGuardian, setSelectedGuardian] = useState<any | null>(null);
  const [showGuardianDetailsModal, setShowGuardianDetailsModal] = useState(false);

  const [adminVolunteerReviewers, setAdminVolunteerReviewers] = useState([
    {
      id: "g-1",
      name: "Yy Chan (我)",
      city: "广州",
      level: "专家审核员",
      validReviews: 142,
      accuracy: "98.5%",
      disputeRate: "0.7%",
      avgProcessingTime: "12分钟",
      lastTrainingTime: "2026-06-10",
      status: "正常",
      tags: ["当前登录", "擅长猕猴"],
      reviewHistory: [
        { date: "2026-07-15", action: "核准白狮阿杭2018年齐刘海照片", status: "已完成" },
        { date: "2026-07-14", action: "退回非公开熊猫产房照片投稿", status: "已退回" },
        { date: "2026-07-10", action: "核准珊珊华南虎建档线索", status: "已完成" }
      ],
      errorCases: [
        { date: "2026-05-12", title: "误将斑马‘小七’判定为重复条目", reason: "由于拍摄角度极度倾斜，导致AI初筛与人工校对均未识别出腹部条纹差异，后经资深观察员复核纠正。" }
      ],
      trainingRecords: [
        { date: "2026-06-10", course: "《白狮阿杭计划：数字版权与CC协议合规培训》", score: "100分 (优秀)" },
        { date: "2026-04-15", course: "《多模态AI排重工具操作指引及置信度研判》", score: "98分" }
      ],
      permissionScope: "全展区动物生命史校核、候选档案强制发布权、版权合规申诉仲裁",
      promotionDemotionHistory: [
        { date: "2026-05-01", change: "由“城市守护人”晋升为“专家审核员”", reason: "连续三个季度审核准确率 >98% 且有效审核量超100件。" }
      ]
    },
    {
      id: "g-2",
      name: "越秀山老林",
      city: "广州",
      level: "城市守护人",
      validReviews: 85,
      accuracy: "96.2%",
      disputeRate: "1.2%",
      avgProcessingTime: "18分钟",
      lastTrainingTime: "2026-05-20",
      status: "正常",
      tags: ["猛兽史料", "老照片"],
      reviewHistory: [
        { date: "2026-07-11", action: "校对亚洲黑熊小木头搬迁历史", status: "已完成" },
        { date: "2026-07-09", action: "核准斑马小七展区线索", status: "已完成" }
      ],
      errorCases: [
        { date: "2026-06-02", title: "华南虎珊珊出生日期年份校核误差", reason: "将报纸扫描件上的油印‘2002’误读为‘2003’，被二审AI质检拦截。" }
      ],
      trainingRecords: [
        { date: "2026-05-20", course: "《物种历史档案建档规范与园方志书查阅技巧》", score: "95分" }
      ],
      permissionScope: "广州市属动物园展区日常投稿初审、生活轨迹纠错审核",
      promotionDemotionHistory: [
        { date: "2026-03-10", change: "由“档案协作者”晋升为“城市守护人”", reason: "成功主持完成越秀公园展区历史斑马数据的溯源建档。" }
      ]
    },
    {
      id: "g-3",
      name: "华农动科小陆",
      city: "广州",
      level: "专家审核员",
      validReviews: 195,
      accuracy: "99.1%",
      disputeRate: "0.2%",
      avgProcessingTime: "8分钟",
      lastTrainingTime: "2026-07-01",
      status: "试用",
      tags: ["鸟类鉴定", "专业学术"],
      reviewHistory: [
        { date: "2026-07-17", action: "鉴定涉禽馆白鹭亚种分类", status: "已完成" },
        { date: "2026-07-16", action: "核准涉禽馆丰容设施调整投稿", status: "已完成" }
      ],
      errorCases: [],
      trainingRecords: [
        { date: "2026-07-01", course: "《野生动物形态特征在园识别与分化种校核》", score: "100分" }
      ],
      permissionScope: "野生动物亚种精准鉴定、学术级考证审核、争议判例终审",
      promotionDemotionHistory: [
        { date: "2026-07-01", change: "作为专家人才直通，授予“专家审核员”试用资格", reason: "华南农业大学动物科学学院博士在读，具深厚学术背景。" }
      ]
    },
    {
      id: "g-4",
      name: "广州园林小李",
      city: "深圳",
      level: "档案协作者",
      validReviews: 54,
      accuracy: "92.6%",
      disputeRate: "4.8%",
      avgProcessingTime: "35分钟",
      lastTrainingTime: "2026-03-15",
      status: "复训中",
      tags: ["展区变迁", "兼职观察"],
      reviewHistory: [
        { date: "2026-07-02", action: "初审黑猩猩馆科普文字更新", status: "已完成" }
      ],
      errorCases: [
        { date: "2026-06-25", title: "判定某自媒体抓取图无版权风险", reason: "未仔细核查水印与版权说明，直接通过了带有外站水印 of 二传图，产生版权争议。" }
      ],
      trainingRecords: [
        { date: "2026-03-15", course: "《基础建档审核员入门指引》", score: "88分" }
      ],
      permissionScope: "基础日常见闻初筛、简单观察日记格式核对",
      promotionDemotionHistory: [
        { date: "2026-07-05", change: "状态变更为“复训中”", reason: "近期由于版权判定标准执行不力，导致争议撤销率接近5%的考核红线，暂时收回初审权，进入规则复训阶段。" }
      ]
    },
    {
      id: "g-5",
      name: "野性回归林",
      city: "成都",
      level: "城市守护人",
      validReviews: 42,
      accuracy: "88.5%",
      disputeRate: "5.5%",
      avgProcessingTime: "42分钟",
      lastTrainingTime: "2026-02-10",
      status: "暂停",
      tags: ["摄影爱好者", "大熊猫"],
      reviewHistory: [
        { date: "2026-06-20", action: "校核熊猫馆旧照", status: "已完成" }
      ],
      errorCases: [
        { date: "2026-06-15", title: "多次将其他个体照片误认为是大熊猫‘雅雅’", reason: "熊猫面部及肩带特征辨识度极高，但多次凭感觉审核通过非本个体的图，被多名观察员投诉。" }
      ],
      trainingRecords: [
        { date: "2026-02-10", course: "《物种历史档案建档规范与园方志书查阅技巧》", score: "90分" }
      ],
      permissionScope: "大熊猫展区日常投稿初审（当前暂停）",
      promotionDemotionHistory: [
        { date: "2026-06-30", change: "状态变更为“暂停”", reason: "由于对关键判定标准（如特定熊猫个体形态）多次发生错误审核，争议率超出5%且准确率低于90%红线，暂时暂停权限。" }
      ]
    },
    {
      id: "g-6",
      name: "老广记忆家",
      city: "广州",
      level: "档案协作者",
      validReviews: 12,
      accuracy: "75.0%",
      disputeRate: "12.5%",
      avgProcessingTime: "50分钟",
      lastTrainingTime: "2025-11-12",
      status: "取消资格",
      tags: ["老广州人"],
      reviewHistory: [],
      errorCases: [
        { date: "2026-05-18", title: "严重版权责任事故：私自通过带有‘未经授权严禁转载’防盗印的照片", reason: "对他人版权声明视而不见，放任高风险受版权保护作品上架，导致原作者发出法务函警告。" }
      ],
      trainingRecords: [
        { date: "2025-11-12", course: "《基础建档审核员入门指引》", score: "82分" }
      ],
      permissionScope: "无",
      promotionDemotionHistory: [
        { date: "2026-05-20", change: "直接取消志愿者守护人资格", reason: "发生严重版权事故，违反志愿者守则及免责声明底线，予以除名并列入协作者黑名单。" }
      ]
    }
  ]);

  const [adminReviewLogs, setAdminReviewLogs] = useState([
    { id: "log-1", time: "今天 10:15", operator: "Yy Chan", action: "批准了 1 条关于白狮阿杭的纪念截图投稿 (单号 mem-152)" },
    { id: "log-2", time: "昨天 16:30", operator: "华农动科小陆", action: "将“小木头”更名为“亚洲黑熊小木头”并移入候选档案" },
    { id: "log-3", time: "前天 14:12", operator: "系统 AI", action: "自动拦截了 1 条重复的小熊猫迪迪旧照片 (重复率 94.5%)" },
    { id: "log-4", time: "07-15 09:00", operator: "越秀山老林", action: "退回了 1 条模糊、无参考价值的低像素视频 (单号 mem-89)" }
  ]);

  const handleAdminAction = (contribId: string, actionName: string) => {
    const contrib = adminPendingContribs.find(c => c.id === contribId);
    if (!contrib) return;

    triggerToast(`【已进行：${actionName}】处理成功！该记录已更新并入库归档。✨`);

    setAdminPendingContribs(prev => prev.filter(c => c.id !== contribId));

    const newLog = {
      id: `log-${Date.now()}`,
      time: "刚刚",
      operator: "Yy Chan (我)",
      action: `进行了【${actionName}】操作对 "${contrib.animal}" 的 "${contrib.type}" 投稿 (单号 ${contrib.id})`
    };
    setAdminReviewLogs([newLog, ...adminReviewLogs]);
  };

  // Trigger real-time time simulation
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hrs = String(now.getHours()).padStart(2, "0");
      const mins = String(now.getMinutes()).padStart(2, "0");
      setCurrentTime(`${hrs}:${mins}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // Show quick temporary toast notification
  const triggerToast = (msg: string) => {
    setNotificationMsg(msg);
    setShowNotification(true);
    setTimeout(() => {
      setShowNotification(false);
    }, 3000);
  };

  // Like observation helper
  const handleLikeObservation = (animalId: string, obsId: string) => {
    setAnimals(prev =>
      prev.map(a => {
        if (a.id === animalId) {
          return {
            ...a,
            observations: a.observations.map(o => {
              if (o.id === obsId) {
                const liked = !o.hasLiked;
                return {
                  ...o,
                  hasLiked: liked,
                  likes: liked ? o.likes + 1 : o.likes - 1
                };
              }
              return o;
            })
          };
        }
        return a;
      })
    );
    triggerToast("操作成功");
  };

  // Submit comment in memorial hall helper
  const handleAddMemorialComment = (animalId: string) => {
    if (!newCommentText.trim()) return;
    const newComment = {
      id: `mc-${Date.now()}`,
      animalId: animalId,
      username: "游客 (我)",
      text: newCommentText,
      timestamp: "刚刚",
      flowers: 1
    };
    setMemorialComments([newComment, ...memorialComments]);
    setNewCommentText("");
    triggerToast("纪念寄语提交成功，已加入纪念墙 🕯️");
  };

  // Light candle helper
  const handleLightCandle = (animalId: string) => {
    if (candledAnimals[animalId]) {
      triggerToast("您已经为它点亮过烛光了 🕯️");
      return;
    }
    setAnimalCandles(prev => ({
      ...prev,
      [animalId]: (prev[animalId] || 0) + 1
    }));
    setCandledAnimals(prev => ({
      ...prev,
      [animalId]: true
    }));
    triggerToast("已为它点亮一盏纪念烛光 🕯️");
  };

  // Flower Offering interactive interaction
  const handleOfferFlower = (commentId: string) => {
    if (flowerOffered[commentId]) {
      triggerToast("您已经献过花了 🌻");
      return;
    }
    setMemorialComments(prev =>
      prev.map(c => {
        if (c.id === commentId) {
          return { ...c, flowers: c.flowers + 1 };
        }
        return c;
      })
    );
    setFlowerOffered(prev => ({ ...prev, [commentId]: true }));
    triggerToast("献花成功 🌻 +1");
  };

  // Multi-step Recommend animal submission handler
  const handleRecommendSubmit = () => {
    const newContribId = `contrib-${Date.now()}`;
    const newContrib: Contribution = {
      id: newContribId,
      type: "recommend",
      title: `推荐动物：${recommendForm.uncertainLocation ? "未知机构" : recommendForm.zoo}的${recommendForm.species || "未知个体"}${recommendForm.name ? `“${recommendForm.name}”` : ""}`,
      submittedAt: new Date().toISOString().split("T")[0],
      status: "pending",
      statusLabel: "等待人工审核",
      details: `在${recommendForm.city}${recommendForm.uncertainLocation ? "未知机构" : recommendForm.zoo}${recommendForm.uncertainLocation ? "" : recommendForm.area}推荐。名字: ${recommendForm.dontKnowName ? "未知" : (recommendForm.name || "未定")}。昵称: ${recommendForm.dontKnowName ? "未知" : (recommendForm.nickname || "无")}。描述: ${recommendForm.story || "暂无描述"}`
    };

    setContributions([newContrib, ...contributions]);
    
    // Auto-create animal card in need_info or in_zoo status!
    const newAnimal: Animal = {
      id: `animal-${Date.now()}`,
      name: recommendForm.dontKnowName ? "待确认名字" : (recommendForm.name || "未命名个体"),
      nickname: recommendForm.dontKnowName ? "未命名" : (recommendForm.name || "未命名"),
      species: recommendForm.dontKnowName ? "待核实物种" : (recommendForm.species || "熊类"),
      scientificName: recommendForm.dontKnowName ? "待核实" : (recommendForm.species || "熊类"),
      speciesCode: "unknown",
      image: recommendForm.photo || "",
      imageType: recommendForm.photo ? "official_photo" : "placeholder",
      status: "need_info",
      institution: recommendForm.uncertainLocation ? "未知机构" : recommendForm.zoo,
      city: "广州",
      commonName: recommendForm.dontKnowName ? "待核实物种" : (recommendForm.species || "熊类"),
      gender: recommendForm.gender,
      lifeSpan: "未知",
      statusLabel: "待补充",
      zoo: recommendForm.uncertainLocation ? "未知机构" : recommendForm.zoo,
      coverUrl: recommendForm.photo || "",
      speciesId: "unknown",
      tags: ["待补充", "群众推荐", "线索搜集"],
      description: recommendForm.story || "该个体由公众推荐建档，正在进行第一阶段材料初审与特征核实，欢迎各位经常游园的观察员补充更丰富的信息与日常照片。",
      verified: false,
      verifiedCount: 1,
      timeline: [
        {
          year: "2026",
          title: "公众推荐发起建档",
          description: `由用户提交推荐表单至阿杭计划平台，首张线索照片已载入。`
        }
      ],
      observations: []
    };
    
    setAnimals([newAnimal, ...animals]);
    triggerToast("推荐成功！资料已进入初审阶段 🌾");
    
    setRecommendForm(prev => ({
      ...prev,
      isSubmitted: true
    }));
  };

  const handleCloseRecommend = () => {
    setViewState({ type: "main", tab: "record" });
    setRecommendForm({
      province: "广东省",
      city: "广州市",
      zoo: "广州动物园",
      area: "狮虎山区",
      specificPoint: "",
      uncertainLocation: false,
      photo: null,
      name: "",
      nickname: "",
      dontKnowName: false,
      species: "",
      gender: "未知",
      reasons: [],
      otherReason: "",
      story: "",
      morePhotos: [],
      sourceLink: "",
      citation: "",
      copyright: "self",
      authorized: false,
      isSubmitted: false
    });
  };

  // Submit Observation for existing animal
  const handleAddObservationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!obsForm.text.trim()) {
      triggerToast("请填写观察到的日常行为");
      return;
    }

    const targetAnimal = animals.find(a => a.id === obsModalAnimalId);
    if (!targetAnimal) return;

    const newObs: ObservationRecord = {
      id: `obs-user-${Date.now()}`,
      username: "Yy Chan (我)",
      avatar: "",
      date: new Date().toLocaleString("zh-CN", { hour12: false }).replace(/\//g, "-").slice(0, 16),
      location: `${targetAnimal.zoo} 观察区`,
      text: obsForm.text,
      image: obsForm.image || "",
      likes: 0,
      commentsCount: 0,
      category: obsForm.category
    };

    setAnimals(prev =>
      prev.map(a => {
        if (a.id === obsModalAnimalId) {
          return {
            ...a,
            observations: [newObs, ...a.observations]
          };
        }
        return a;
      })
    );

    // Add contribution
    const newContrib: Contribution = {
      id: `contrib-obs-${Date.now()}`,
      type: "observation",
      title: `观察记录：为“${targetAnimal.name}”上传了日常记录`,
      submittedAt: new Date().toISOString().split("T")[0],
      status: "approved",
      statusLabel: "已通过",
      details: obsForm.text
    };
    setContributions([newContrib, ...contributions]);

    setShowObsModal(false);
    setViewState({ type: "main", tab: "record" });
    setObsForm({ category: "resting", text: "", image: null });
    triggerToast("日常记录发布成功，已归入时间线！✨");
  };

  // Submit Advanced Multi-step Observation
  const handleAdvancedObsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!obsDescription.trim()) {
      triggerToast("请填写一句话描述");
      return;
    }
    if (obsDescription.trim().length > 300) {
      triggerToast("描述内容不能超过300字");
      return;
    }
    if (!obsCopyrightSelf || !obsCopyrightArchiveOnly || !obsCopyrightPublicWelfare) {
      triggerToast("请阅读并勾选全部版权及授权确认条款");
      return;
    }

    const targetAnimal = animals.find(a => a.id === obsSelectedAnimalId);
    if (!targetAnimal) return;

    // Map first selected behavior to category, default to resting
    let cat: "resting" | "feeding" | "playing" | "moving" = "resting";
    if (obsSelectedBehaviors.includes("睡觉")) cat = "resting";
    else if (obsSelectedBehaviors.includes("进食")) cat = "feeding";
    else if (obsSelectedBehaviors.includes("玩耍")) cat = "playing";
    else if (obsSelectedBehaviors.includes("行走")) cat = "moving";

    const newObs: ObservationRecord = {
      id: `obs-user-${Date.now()}`,
      username: "Yy Chan (我)",
      avatar: "",
      date: `${obsDate} ${obsTime}`,
      location: obsLocation || `${targetAnimal.zoo} 观察区`,
      text: `${obsDescription} 【行为标签：${obsSelectedBehaviors.join("、")}】` + 
            (obsSawEnrichment === "yes" ? " [已见丰容设施]" : "") + 
            (obsInteracted === "yes" ? " [有与其他动物互动]" : ""),
      image: obsUploadedPhoto || "",
      likes: 0,
      commentsCount: 0,
      category: cat
    };

    setAnimals(prev =>
      prev.map(a => {
        if (a.id === obsSelectedAnimalId) {
          return {
            ...a,
            observations: [newObs, ...a.observations]
          };
        }
        return a;
      })
    );

    // Add contribution
    const newContrib: Contribution = {
      id: `contrib-obs-${Date.now()}`,
      type: "observation",
      title: `观察记录：为“${targetAnimal.name}”上传了日常记录`,
      submittedAt: new Date().toISOString().split("T")[0],
      status: "approved",
      statusLabel: "已通过",
      details: `${obsDescription} | 时间：${obsDate} ${obsTime} | 地点：${obsLocation} | 标签：${obsSelectedBehaviors.join("、")}`
    };
    setContributions([newContrib, ...contributions]);

    setObsIsSubmitted(true);
    setObsUploadStep(6); // Success step
    triggerToast("日常观察记录上传成功！✨");
  };

  const handleCloseAdvancedObs = () => {
    setViewState({ type: "main", tab: "record" });
    setObsUploadStep(1);
    setObsSelectedAnimalId("ahang");
    setObsDate(new Date().toISOString().split("T")[0]);
    setObsTime("14:30");
    setObsLocation("广州动物园 狮虎山");
    setObsSelectedBehaviors(["睡觉"]);
    setObsSawEnrichment("no");
    setObsInteracted("no");
    setObsDescription("");
    setObsUploadedPhoto(null);
    setObsCopyrightSelf(false);
    setObsCopyrightArchiveOnly(false);
    setObsCopyrightPublicWelfare(false);
    setObsIsSubmitted(false);
  };

  // Submit Memory handler
  const handleMemorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memoryForm.text.trim()) {
      triggerToast("请写下您的温情回忆内容");
      return;
    }

    const targetAnimal = animals.find(a => a.id === memoryForm.animalId);
    const animalName = targetAnimal ? targetAnimal.name : (memoryForm.customAnimalName || "离散老友");

    const newContrib: Contribution = {
      id: `contrib-mem-${Date.now()}`,
      type: "supplement",
      title: `回忆分享：讲述了关于“${animalName}”的往昔故事`,
      submittedAt: new Date().toISOString().split("T")[0],
      status: "approved",
      statusLabel: "已通过",
      details: `【回忆时间：${memoryForm.date}】${memoryForm.text}`
    };

    setContributions([newContrib, ...contributions]);
    triggerToast("回忆分享成功，已收录到其生命时光印记中！🕯️");
    setViewState({ type: "main", tab: "record" });
    // Reset
    setMemoryForm({
      animalId: "ahang",
      customAnimalName: "",
      title: "",
      text: "",
      date: "2026-05",
      image: null,
      author: "Yy Chan"
    });
  };

  // Submit Correction handler
  const handleCorrectionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctionForm.text.trim()) {
      triggerToast("请填写纠错或补充的具体内容");
      return;
    }
    if (!correctionForm.evidence.trim()) {
      triggerToast("请填写核对佐证说明（如：新闻报道、原园方图鉴等）");
      return;
    }

    const targetAnimal = animals.find(a => a.id === correctionForm.animalId);
    const animalName = targetAnimal ? targetAnimal.name : "未知个体";

    const fieldLabel = 
      correctionForm.field === "gender" ? "性别纠错" :
      correctionForm.field === "age" ? "出生年份/寿命纠错" :
      correctionForm.field === "timeline" ? "时间线大事件修正" : "其他资料修正";

    const newContrib: Contribution = {
      id: `contrib-corr-${Date.now()}`,
      type: "supplement",
      title: `纠错申请：对“${animalName}”进行[${fieldLabel}]`,
      submittedAt: new Date().toISOString().split("T")[0],
      status: "pending",
      statusLabel: "人工复核中",
      details: `纠错详情：${correctionForm.text} | 佐证证据：${correctionForm.evidence} | 参考文献/来源：${correctionForm.citation || "暂无"}`
    };

    setContributions([newContrib, ...contributions]);
    triggerToast("资料纠错提交成功！我们将联络多方观察员并在48小时内复准 🔍");
    setViewState({ type: "main", tab: "record" });
    // Reset
    setCorrectionForm({
      animalId: "paopao",
      field: "timeline",
      text: "",
      evidence: "",
      citation: "",
      contact: "yy.mychan@gmail.com"
    });
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] sm:bg-stone-100 text-stone-800 font-sans antialiased flex flex-col items-center justify-center sm:py-6 px-0 sm:px-4">
      
      {/* Desktop simulated phone frame container */}
      <div className="w-full h-screen sm:h-[880px] sm:max-w-[430px] bg-[#FAF8F5] sm:rounded-[48px] sm:shadow-2xl overflow-hidden border-0 sm:border-[11px] border-stone-800 flex flex-col relative" id="app-viewport-container">
        
        {/* Phone Notch & Status Bar (Hidden on actual mobile screens to prevent double status bar) */}
        <div className="hidden sm:flex bg-[#FAF8F5] px-6 pt-3 pb-1 justify-between items-center text-xs text-stone-600 select-none z-50 relative">
          <span className="font-semibold">{currentTime || "09:41"}</span>
          
          {/* Notch Spacer */}
          <div className="w-32 h-4 bg-stone-900 rounded-b-xl absolute left-1/2 transform -translate-x-1/2 top-0"></div>
          
          <div className="flex items-center space-x-1.5">
            {/* Status Icons */}
            <div className="flex space-x-0.5">
              <div className="w-0.5 h-1.5 bg-stone-700 rounded-full"></div>
              <div className="w-0.5 h-2.5 bg-stone-700 rounded-full"></div>
              <div className="w-0.5 h-3 bg-stone-700 rounded-full"></div>
            </div>
            <span className="text-[10px] font-bold">5G</span>
            {/* Simulated Battery */}
            <div className="w-5 h-2.5 border border-stone-600 rounded-[4px] p-[1px] flex items-center">
              <div className="h-full w-4 bg-stone-700 rounded-[2px]"></div>
            </div>
          </div>
        </div>

        {/* Global Toast Notification */}
        {showNotification && (
          <div className="absolute top-14 left-1/2 transform -translate-x-1/2 bg-stone-800 text-stone-100 text-xs px-4 py-2.5 rounded-full shadow-lg flex items-center space-x-2 z-50 animate-bounce">
            <Sparkles className="w-4.5 h-4.5 text-[#D9C3B0]" />
            <span>{notificationMsg}</span>
          </div>
        )}

        {/* Dynamic App Area (Scrollable Content) */}
        <div className="flex-1 overflow-y-auto relative pb-20 no-scrollbar" id="app-content-stage">
          
          {/* ==================== 1. ONBOARDING VIEW ==================== */}
          {viewState.type === "onboarding" && (
            <div className="h-full flex flex-col justify-between px-6 py-6 text-center bg-[#FAF8F5]">
              {/* Skip button */}
              <div className="flex justify-end">
                <button
                  onClick={() => setViewState({ type: "main", tab: "home" })}
                  className="text-stone-500 text-xs font-medium hover:text-stone-800 bg-stone-100 px-3 py-1 rounded-full"
                  id="skip-onboarding-btn"
                >
                  跳过
                </button>
              </div>

              {viewState.step === 1 && (
                <div className="flex-1 flex flex-col justify-center items-center my-auto">
                  {/* Circle layout with portrait */}
                  <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-[#D9C3B0]/30 mb-6 shadow-md bg-[#FAF8F5] flex items-center justify-center p-2">
                    <img
                      src={ahangOnboardingMain}
                      alt="阿杭"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h1 className="text-3xl font-serif font-bold tracking-wide text-stone-900 mb-1" id="app-logo-title">
                    PROJECT AHANG
                  </h1>
                  <p className="text-[19px] sm:text-[20px] tracking-tight text-[#B83B26] font-bold mb-4 whitespace-nowrap">
                    白狮阿杭计划
                  </p>
                  <p className="text-stone-600 text-sm max-w-xs leading-relaxed">
                    一个公众共建的动物个体数字档案馆
                    <br />
                    <span className="text-xs text-stone-500 mt-2 block">
                      “你的每一次遇见，都在帮助它们被记住。”
                    </span>
                  </p>
                </div>
              )}

              {viewState.step === 2 && (
                <div className="flex-1 flex flex-col justify-center items-center my-auto">
                  <div className="text-[#2F5233] bg-[#2F5233]/10 p-5 rounded-full mb-6">
                    <Compass className="w-12 h-12" />
                  </div>
                  <h2 className="text-xl font-serif font-bold text-stone-900 mb-3">01. 认识</h2>
                  <p className="text-stone-600 text-sm max-w-xs leading-relaxed">
                    它们不只是冷冰冰的“非洲狮”或“黑熊”物种名，每一只在园动物都有属于自己的名字、独特经历和脾气习惯。
                  </p>
                  
                  {/* Interactive mockup preview row */}
                  <div className="flex space-x-2.5 mt-8 w-full max-w-[280px]">
                    <div className="flex-1 p-2 bg-white rounded-lg border border-stone-200 shadow-sm text-left">
                      <div className="w-8 h-8 rounded-full bg-[#D9C3B0]/20 flex items-center justify-center text-xs font-serif text-[#B83B26] mb-1">
                        杭
                      </div>
                      <div className="flex items-baseline space-x-1 flex-wrap">
                        <span className="text-[16px] font-semibold text-stone-900">阿杭</span>
                        <span className="text-[14px] text-stone-600 font-normal">(非洲狮)</span>
                      </div>
                      <div className="text-[13px] text-stone-400">广州动物园 · 离世</div>
                    </div>
                    <div className="flex-1 p-2 bg-white rounded-lg border border-stone-200 shadow-sm text-left">
                      <div className="w-8 h-8 rounded-full bg-[#2F5233]/20 flex items-center justify-center text-xs font-serif text-[#2F5233] mb-1">
                        迪
                      </div>
                      <div className="flex items-baseline space-x-1 flex-wrap">
                        <span className="text-[16px] font-semibold text-stone-900">迪迪</span>
                        <span className="text-[14px] text-stone-600 font-normal">(小熊猫)</span>
                      </div>
                      <div className="text-[13px] text-stone-400">广州动物园 · 在园</div>
                    </div>
                  </div>
                </div>
              )}

              {viewState.step === 3 && (
                <div className="flex-1 flex flex-col justify-center items-center my-auto">
                  <div className="text-[#D9C3B0] bg-[#D9C3B0]/10 p-5 rounded-full mb-6">
                    <Camera className="w-12 h-12" />
                  </div>
                  <h2 className="text-xl font-serif font-bold text-stone-900 mb-3">02. 记录</h2>
                  <p className="text-stone-600 text-sm max-w-xs leading-relaxed">
                    随手拍下的日常照片、一次投喂的记录、或是它睡觉的位置，汇聚在一起，就是最珍贵的野生历史。
                  </p>
                  
                  <div className="mt-6 w-full max-w-[260px] bg-white border border-stone-200 rounded-xl p-3 shadow-sm text-left flex items-start space-x-2.5">
                    <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0">
                      <AnimalImage
                        species="African Lion"
                        image={null}
                        alt="obs-preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <div className="text-[16px] font-bold text-stone-700">“今天阿杭睡在大树荫下...”</div>
                      <div className="text-[13px] text-stone-400 mt-1">观察员: Yy Chan · 刚刚</div>
                    </div>
                  </div>
                </div>
              )}

              {viewState.step === 4 && (
                <div className="flex-1 flex flex-col justify-center items-center my-auto">
                  <div className="text-[#B83B26] bg-[#B83B26]/10 p-5 rounded-full mb-6 animate-pulse">
                    <Heart className="w-12 h-12" />
                  </div>
                  <h2 className="text-xl font-serif font-bold text-stone-900 mb-3">03. 共建</h2>
                  <p className="text-stone-600 text-sm max-w-xs leading-relaxed">
                    一个人记住，是回忆；
                    <br />
                    很多人记住，就是充满温度的城市动物共同记忆。
                  </p>
                  
                  <div className="mt-8 flex flex-col space-y-2 w-full px-4">
                    <button
                      onClick={() => setViewState({ type: "main", tab: "home" })}
                      className="w-full bg-[#2F5233] hover:bg-[#203a24] text-white py-3 rounded-xl font-medium text-sm transition-colors shadow-sm"
                      id="start-explore-btn"
                    >
                      开始认识它们
                    </button>
                    <button
                      onClick={() => setViewState({ type: "main", tab: "home" })}
                      className="text-stone-500 text-xs font-normal py-2 hover:underline"
                    >
                      暂不登录，先看看
                    </button>
                  </div>
                </div>
              )}

              {/* Progress Indicator Dots */}
              <div className="flex justify-center space-x-1.5 mt-4">
                {[1, 2, 3, 4].map(s => (
                  <div
                    key={s}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      viewState.step === s ? "w-6 bg-[#2F5233]" : "w-1.5 bg-stone-300"
                    }`}
                  ></div>
                ))}
              </div>

              {/* Next/Prev buttons */}
              {viewState.step < 4 && (
                <div className="mt-6">
                  <button
                    onClick={() => setViewState({ type: "onboarding", step: viewState.step + 1 })}
                    className="w-full bg-[#B83B26] hover:bg-[#9c301e] text-white py-3 rounded-xl font-medium text-sm transition-colors shadow-sm"
                    id="next-onboarding-step"
                  >
                    下一步
                  </button>
                </div>
              )}
            </div>
          )}


          {/* ==================== 2. MAIN VIEWS (TAB BED) ==================== */}
          {viewState.type === "main" && (
            <div className="px-5 py-4">
              
              {/* ==================== TAB: HOME (首页) ==================== */}
              {viewState.tab === "home" && (
                <div className="space-y-6 animate-fade-in">
                  {/* 1. 顶部品牌区 */}
                  <div className="flex justify-between items-center" id="home-header">
                    <div className="space-y-0.5">
                      <h1 className="text-2.5xl font-serif font-bold text-stone-900 tracking-wide">PROJECT AHANG</h1>
                      <p className="text-[18px] text-stone-500 tracking-wider font-semibold">白狮阿杭计划</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setViewState({ type: "main", tab: "archives" });
                          triggerToast("已为您切换至档案列表，可在此搜索所有记录");
                        }}
                        className="p-2.5 bg-white border border-stone-200 rounded-full text-stone-600 hover:bg-stone-50 shadow-sm transition-all active:scale-95"
                        id="top-search-btn"
                        title="搜索"
                      >
                        <Search className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => triggerToast("您有一条新协作消息：常驻观察员 Yy Chan 刚才更新了大象阿宝的最新档案")}
                        className="p-2.5 bg-white border border-stone-200 rounded-full text-stone-600 hover:bg-stone-50 shadow-sm relative transition-all active:scale-95"
                        id="top-bell-btn"
                        title="消息"
                      >
                        <Bell className="w-4 h-4" />
                        <span className="absolute top-1 right-1 w-2 h-2 bg-[#B83B26] rounded-full"></span>
                      </button>
                    </div>
                  </div>

                  {/* 2. 今日认识一只动物 */}
                  <div 
                    onClick={() => setViewState({ type: "animal_detail", animalId: "ahang", activeSubTab: "all" })}
                    className="bg-white border border-stone-200/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group"
                    id="today-animal-card"
                  >
                    <div className="relative h-48 overflow-hidden bg-stone-100">
                      {(() => {
                        const featured = animals.find(a => a.id === "ahang");
                        return (
                          <AnimalImage
                            species={featured?.species || "African Lion"}
                            image={featured?.image || undefined}
                            imageType={featured?.imageType || "official_photo"}
                            alt="今日认识一只动物 - 阿杭"
                            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                          />
                        );
                      })()}
                      <div className="absolute top-3 left-3 bg-[#B83B26] text-white px-3 py-1 rounded-full text-[10px] font-bold tracking-wider shadow-sm">
                        今日推荐
                      </div>
                    </div>
                    <div className="p-4.5 space-y-3">
                      <div className="flex justify-between items-baseline">
                        <div className="flex items-center space-x-2.5">
                          <h3 className="text-xl font-serif font-bold text-stone-900" id="featured-animal-title">阿杭</h3>
                          <span className="text-xs text-stone-500 bg-stone-100 px-2 py-0.5 rounded">非洲狮</span>
                          <span className="text-xs text-stone-500 bg-stone-100 px-2 py-0.5 rounded">雄性</span>
                        </div>
                        <span className="text-xs font-mono font-medium text-[#B83B26]">2009—2026</span>
                      </div>
                      
                      <div className="flex items-center space-x-1 text-xs text-stone-500">
                        <MapPin className="w-3.5 h-3.5 text-stone-400" />
                        <span>广州动物园</span>
                      </div>

                      <p className="text-stone-600 text-xs leading-relaxed border-l-2 border-[#B83B26]/30 pl-2.5">
                        因为一头会随天气变化的齐刘海，被全国网友记住。
                      </p>

                      <div className="pt-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setViewState({ type: "animal_detail", animalId: "ahang", activeSubTab: "all" });
                          }}
                          className="w-full bg-[#B83B26] hover:bg-[#a13320] text-white text-xs font-medium py-3 rounded-xl transition-colors shadow-sm"
                          id="enter-ahang-detail-btn"
                        >
                          进入它的档案
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 3. 两个核心行动按钮 */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setViewState({ type: "recommend_animal", step: 1 })}
                      className="p-4 bg-white border border-stone-200 hover:border-[#B83B26]/40 rounded-2xl text-left flex flex-col justify-between h-28 transition-all duration-300 shadow-sm group active:scale-[0.98]"
                      id="action-recommend-btn"
                    >
                      <div className="bg-[#B83B26]/5 text-[#B83B26] p-2.5 rounded-xl w-10 h-10 flex items-center justify-center group-hover:bg-[#B83B26]/10 transition-colors">
                        <Plus className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-stone-900 group-hover:text-[#B83B26] transition-colors">推荐一只动物</h4>
                        <p className="text-[10px] text-stone-400 mt-0.5">让更多人认识它</p>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setObsSelectedAnimalId("paopao");
                        setObsLocation("广州动物园 小熊猫馆");
                        setObsUploadStep(1);
                        setObsIsSubmitted(false);
                        setViewState({ type: "form_observation" });
                      }}
                      className="p-4 bg-white border border-stone-200 hover:border-[#B83B26]/40 rounded-2xl text-left flex flex-col justify-between h-28 transition-all duration-300 shadow-sm group active:scale-[0.98]"
                      id="action-observe-btn"
                    >
                      <div className="bg-[#B83B26]/5 text-[#B83B26] p-2.5 rounded-xl w-10 h-10 flex items-center justify-center group-hover:bg-[#B83B26]/10 transition-colors">
                        <Camera className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-stone-900 group-hover:text-[#B83B26] transition-colors">上传一次观察</h4>
                        <p className="text-[10px] text-stone-400 mt-0.5">记录今天的相遇</p>
                      </div>
                    </button>
                  </div>

                  {/* 4. 最近新增记录 */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400">最近新增记录</h3>
                      <button
                        onClick={() => setViewState({ type: "main", tab: "archives" })}
                        className="text-[11px] text-[#B83B26] font-medium hover:underline flex items-center"
                      >
                        全部 <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2.5" id="recent-animals-list">
                      {animals.slice(1, 4).map(item => (
                        <div
                          key={item.id}
                          onClick={() => setViewState({ type: "animal_detail", animalId: item.id, activeSubTab: "all" })}
                          className="bg-white rounded-2xl border border-stone-200/80 shadow-sm overflow-hidden cursor-pointer hover:border-[#B83B26]/30 hover:shadow-md transition-all duration-300 flex flex-col"
                        >
                          <div className="h-20 w-full relative bg-stone-50">
                            <AnimalImage species={item.species} image={item.image || item.coverUrl} imageType={item.imageType || "real"} className="w-full h-full object-cover" alt={item.name} />
                            <div className="absolute bottom-1 right-1 scale-75 origin-bottom-right">
                              <StatusBadge status={item.status} label={item.statusLabel} />
                            </div>
                          </div>
                          <div className="p-2 space-y-0.5 flex-1 flex flex-col justify-between">
                            <div className="flex items-center justify-between gap-1">
                              <h4 className="text-xs font-bold text-stone-900 truncate">{item.name}</h4>
                              {item.isTestData && (
                                <span className="text-[8px] bg-stone-100 text-stone-500 border border-stone-200 px-1 py-0.2 rounded-full font-medium shrink-0">
                                  测试
                                </span>
                              )}
                            </div>
                            <p className="text-[9px] text-stone-400 truncate">{item.species}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 5. 正在寻找资料 */}
                  <div className="bg-white border border-stone-200/80 rounded-2xl p-4.5 shadow-sm space-y-3">
                    <div className="flex justify-between items-center border-b border-stone-100 pb-2.5">
                      <h4 className="text-xs font-bold text-stone-800 flex items-center space-x-1.5">
                        <HelpCircle className="w-4 h-4 text-[#B83B26]" />
                        <span>正在寻找资料 (协作任务)</span>
                      </h4>
                      <span className="text-[10px] bg-red-50 text-[#B83B26] px-2 py-0.5 rounded font-bold">急需线索</span>
                    </div>

                    <div className="space-y-2.5">
                      <div
                        onClick={() => {
                          setViewState({ type: "task_center" });
                          triggerToast("寻找阿杭2015年来广州的准确日期 协作线索征集中");
                        }}
                        className="cursor-pointer hover:bg-stone-50 p-2 rounded-xl border border-transparent hover:border-stone-100 transition-all flex items-start space-x-2.5"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-[#B83B26] mt-1.5 flex-shrink-0"></div>
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-stone-900">寻找阿杭2015年来广州的准确日期</p>
                          <p className="text-[10px] text-stone-400">目前缺原版引进简报，期待热心网友提供线索或剪报图片。</p>
                        </div>
                      </div>

                      <div
                        onClick={() => {
                          setViewState({ type: "task_center" });
                          triggerToast("这只亚洲黑熊叫什么名字 协作线索征集中");
                        }}
                        className="cursor-pointer hover:bg-stone-50 p-2 rounded-xl border border-transparent hover:border-stone-100 transition-all flex items-start space-x-2.5"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-[#B83B26] mt-1.5 flex-shrink-0"></div>
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-stone-900">这只亚洲黑熊叫什么名字</p>
                          <p className="text-[10px] text-stone-400">广州动物园熊区，常来的游客为其起名“木头”，亟待多方印证。</p>
                        </div>
                      </div>

                      <div
                        onClick={() => {
                          setViewState({ type: "task_center" });
                          triggerToast("寻找广州动物园1990年代旧导览图 协作线索征集中");
                        }}
                        className="cursor-pointer hover:bg-stone-50 p-2 rounded-xl border border-transparent hover:border-stone-100 transition-all flex items-start space-x-2.5"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-[#B83B26] mt-1.5 flex-shrink-0"></div>
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-stone-900 font-normal">寻找广州动物园1990年代旧导览图</p>
                          <p className="text-[10px] text-stone-400">用于还原老一代动物们的常驻馆舍历史，如有旧纸质地图请分享。</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 6. 阿杭数字纪念馆入口 */}
                  <div 
                    onClick={() => setViewState({ type: "main", tab: "memorial" })}
                    className="bg-stone-900 text-stone-100 rounded-2xl p-5 shadow-md flex items-center justify-between cursor-pointer hover:bg-stone-850 transition-all duration-300 group"
                  >
                    <div className="space-y-1.5 max-w-[240px]">
                      <h4 className="text-sm font-serif font-bold text-white flex items-center space-x-1.5">
                        <span className="text-base">🕯️</span>
                        <span>阿杭 2009—2026</span>
                      </h4>
                      <p className="text-xs text-stone-400 leading-relaxed">
                        十一年相伴，温柔治愈
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setViewState({ type: "main", tab: "memorial" });
                      }}
                      className="bg-[#B83B26] hover:bg-[#a13320] text-white text-[10px] font-bold px-4 py-2.5 rounded-xl shadow-sm transition-colors"
                    >
                      去看看阿杭
                    </button>
                  </div>
                </div>
              )}


              {/* ==================== TAB: ARCHIVES (动物档案) ==================== */}
              {viewState.tab === "archives" && (
                <div className="space-y-4 animate-fade-in">
                  {/* Header Title */}
                  <div>
                    <h2 className="text-2xl font-serif font-bold text-stone-900" id="archives-page-title">认识它们</h2>
                    <p className="text-xs text-stone-500 mt-1">每一只动物，都有属于自己的故事。</p>
                  </div>

                  {/* Search Bar */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="搜索名字、物种、动物园或城市..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-white border border-stone-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-[#B83B26]"
                    />
                    <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                    {searchQuery && (
                      <button onClick={() => setSearchQuery("")} className="absolute right-3 top-2.5">
                        <X className="w-4 h-4 text-stone-400 hover:text-stone-600" />
                      </button>
                    )}
                  </div>

                  {/* Filter Sub-navigation */}
                  <div className="flex space-x-1.5 overflow-x-auto pb-1 scrollbar-none" id="archive-filter-nav">
                    {[
                      { id: "all", label: "全部" },
                      { id: "in_zoo", label: "在园" },
                      { id: "retired", label: "退休" },
                      { id: "transferred", label: "转园" },
                      { id: "deceased", label: "离世" },
                      { id: "on_trip", label: "出差" },
                      { id: "need_info", label: "资料待补充" }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setArchiveFilter(tab.id)}
                        className={`px-3 py-1.5 text-xs rounded-full border flex-shrink-0 transition-colors ${
                          archiveFilter === tab.id
                            ? "bg-[#B83B26] text-white border-[#B83B26]"
                            : "bg-white text-stone-600 border-stone-200 hover:border-[#B83B26]/30"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Animal Cards list */}
                  <div className="space-y-3" id="archives-cards-list">
                    {(() => {
                      const filteredAnimals = animals.filter(item => {
                        // Filter by tab
                        if (archiveFilter !== "all" && item.status !== archiveFilter) return false;
                        // Search by query (name, species, zoo, city/province/slogan)
                        if (searchQuery) {
                          const query = searchQuery.toLowerCase();
                          return (
                            item.name.toLowerCase().includes(query) ||
                            item.species.toLowerCase().includes(query) ||
                            item.zoo.toLowerCase().includes(query) ||
                            (item.summary && item.summary.toLowerCase().includes(query)) ||
                            (item.description && item.description.toLowerCase().includes(query))
                          );
                        }
                        return true;
                      });

                      if (filteredAnimals.length === 0) {
                        return (
                          <div className="bg-white border border-stone-200/80 rounded-2xl p-8 text-center space-y-3 shadow-sm animate-fade-in">
                            <div className="w-12 h-12 bg-stone-50 text-stone-400 rounded-full flex items-center justify-center mx-auto border border-stone-100">
                              <Search className="w-5 h-5 text-stone-300" />
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs font-bold text-stone-700">没有找到符合条件的档案</p>
                              <p className="text-[10px] text-stone-400 max-w-[240px] mx-auto leading-relaxed">
                                可以尝试清除搜索关键字或切换其他分类。若该动物暂无档案，欢迎前往“记录-推荐新动物”为其申请建档。
                              </p>
                            </div>
                          </div>
                        );
                      }

                      return filteredAnimals.map(item => (
                        <div
                          key={item.id}
                          onClick={() => setViewState({ type: "animal_detail", animalId: item.id, activeSubTab: "all" })}
                          className="bg-white border border-stone-200/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex cursor-pointer group"
                        >
                          {/* Left photo */}
                          <div className="w-28 h-28 relative flex-shrink-0 bg-stone-50 overflow-hidden">
                            <AnimalImage species={item.species} image={item.image || item.coverUrl} imageType={item.imageType || "real"} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={item.name} />
                            {item.verified && (
                              <div className="absolute top-1.5 left-1.5 bg-[#B83B26] text-white p-0.5 rounded-full shadow-sm" title="主要资料已核实">
                                <Check className="w-3 h-3" />
                              </div>
                            )}
                          </div>

                          {/* Right Meta details */}
                          <div className="p-3.5 flex-1 flex flex-col justify-between min-w-0">
                            <div className="space-y-1">
                              <div className="flex justify-between items-center gap-1.5">
                                <h3 className="text-base font-serif font-bold text-stone-900 truncate flex items-center space-x-1.5 min-w-0">
                                  <span className="truncate">{item.name}</span>
                                  {item.isTestData && (
                                    <span className="text-[9px] bg-stone-100 text-stone-500 border border-stone-200/80 px-1.5 py-0.5 rounded-full font-sans font-medium shrink-0">
                                      测试
                                    </span>
                                  )}
                                </h3>
                                <StatusBadge status={item.status} label={item.statusLabel} />
                              </div>
                              <p className="text-[10px] text-stone-500 truncate flex items-center space-x-1">
                                <span className="font-medium text-stone-700">{item.species}</span>
                                <span className="text-stone-300">｜</span>
                                <MapPin className="w-2.5 h-2.5 flex-shrink-0 text-stone-400" />
                                <span className="truncate">{item.zoo}</span>
                              </p>
                              <p className="text-xs text-stone-600 line-clamp-1 leading-relaxed italic font-serif text-[#B83B26]/80 mt-1">
                                “{item.summary || "温柔的在园老朋友"}”
                              </p>
                            </div>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              )}

              {/* ==================== TAB: RECORD (记录入口) ==================== */}
              {viewState.tab === "record" && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-xl font-serif font-bold text-stone-900" id="record-page-title">记录一次相遇</h2>
                    <p className="text-xs text-stone-500 mt-1 leading-relaxed">你的一次上传，也许会成为它生命档案的一部分。</p>
                  </div>

                  <div className="grid grid-cols-1 gap-3.5">
                    {/* Card 1: Recommend Animal */}
                    <div
                      onClick={() => setViewState({ type: "recommend_animal", step: 1 })}
                      className="bg-white border border-stone-200/80 hover:border-[#D9C3B0] p-4 rounded-2xl flex items-center space-x-4 cursor-pointer shadow-sm hover:shadow-md transition-all group"
                      id="record-opt-recommend"
                    >
                      <div className="bg-[#D9C3B0]/10 text-[#D9C3B0] p-3 rounded-2xl group-hover:bg-[#D9C3B0]/20 transition-all flex-shrink-0">
                        <PlusCircle className="w-5.5 h-5.5" />
                      </div>
                      <div className="space-y-1 min-w-0 flex-1">
                        <h3 className="text-xs font-bold text-stone-900 group-hover:text-[#D9C3B0] transition-colors flex items-center justify-between">
                          <span>推荐一只动物</span>
                          <ChevronRight className="w-3.5 h-3.5 text-stone-400 group-hover:translate-x-0.5 transition-transform" />
                        </h3>
                        <p className="text-[10px] text-stone-400">它还没有自己的档案</p>
                      </div>
                    </div>

                    {/* Card 2: Upload Observation */}
                    <div
                      onClick={() => {
                        setObsUploadStep(1);
                        setObsSelectedAnimalId("ahang");
                        setObsLocation("广州动物园 狮虎山");
                        setObsIsSubmitted(false);
                        setViewState({ type: "form_observation" });
                      }}
                      className="bg-white border border-stone-200/80 hover:border-[#2F5233] p-4 rounded-2xl flex items-center space-x-4 cursor-pointer shadow-sm hover:shadow-md transition-all group"
                      id="record-opt-observe"
                    >
                      <div className="bg-[#2F5233]/10 text-[#2F5233] p-3 rounded-2xl group-hover:bg-[#2F5233]/20 transition-all flex-shrink-0">
                        <Camera className="w-5.5 h-5.5" />
                      </div>
                      <div className="space-y-1 min-w-0 flex-1">
                        <h3 className="text-xs font-bold text-stone-900 group-hover:text-[#2F5233] transition-colors flex items-center justify-between">
                          <span>上传一次观察</span>
                          <ChevronRight className="w-3.5 h-3.5 text-stone-400 group-hover:translate-x-0.5 transition-transform" />
                        </h3>
                        <p className="text-[10px] text-stone-400">记录你今天看到的行为</p>
                      </div>
                    </div>

                    {/* Card 3: Share Memory */}
                    <div
                      onClick={() => setViewState({ type: "form_memory" })}
                      className="bg-white border border-stone-200/80 hover:border-amber-600 p-4 rounded-2xl flex items-center space-x-4 cursor-pointer shadow-sm hover:shadow-md transition-all group"
                      id="record-opt-story"
                    >
                      <div className="bg-amber-50 text-amber-600 p-3 rounded-2xl group-hover:bg-amber-100 transition-all flex-shrink-0">
                        <Heart className="w-5.5 h-5.5" />
                      </div>
                      <div className="space-y-1 min-w-0 flex-1">
                        <h3 className="text-xs font-bold text-stone-900 group-hover:text-amber-700 transition-colors flex items-center justify-between">
                          <span>分享一段回忆</span>
                          <ChevronRight className="w-3.5 h-3.5 text-stone-400 group-hover:translate-x-0.5 transition-transform" />
                        </h3>
                        <p className="text-[10px] text-stone-400">上传过去的照片或故事</p>
                      </div>
                    </div>

                    {/* Card 4: Correct data */}
                    <div
                      onClick={() => setViewState({ type: "form_correction" })}
                      className="bg-white border border-stone-200/80 hover:border-[#5A6B7C] p-4 rounded-2xl flex items-center space-x-4 cursor-pointer shadow-sm hover:shadow-md transition-all group"
                      id="record-opt-supplement"
                    >
                      <div className="bg-[#5A6B7C]/10 text-[#5A6B7C] p-3 rounded-2xl group-hover:bg-[#5A6B7C]/20 transition-all flex-shrink-0">
                        <Info className="w-5.5 h-5.5" />
                      </div>
                      <div className="space-y-1 min-w-0 flex-1">
                        <h3 className="text-xs font-bold text-stone-900 group-hover:text-[#5A6B7C] transition-colors flex items-center justify-between">
                          <span>补充或纠正资料</span>
                          <ChevronRight className="w-3.5 h-3.5 text-stone-400 group-hover:translate-x-0.5 transition-transform" />
                        </h3>
                        <p className="text-[10px] text-stone-400">让已有档案更加准确</p>
                      </div>
                    </div>
                  </div>

                  {/* Redesigned AI helper entry banner */}
                  <div className="bg-stone-900 text-stone-100 rounded-3xl p-5 shadow-lg border border-stone-800 flex flex-col space-y-3.5">
                    <div className="space-y-1.5">
                      <h4 className="text-xs font-bold text-[#D9C3B0] flex items-center space-x-1.5">
                        <Sparkles className="w-4 h-4" />
                        <span>不知道选择哪个？</span>
                      </h4>
                      <p className="text-[10px] text-stone-300 leading-relaxed">
                        上传一张照片，让系统自动识别，帮您快速匹配在园动物个体并建立观察连接。
                      </p>
                    </div>
                    <button
                      onClick={() => setViewState({ type: "ai_helper" })}
                      className="w-full bg-[#D9C3B0] hover:bg-[#D9C3B0] text-stone-950 text-[11px] font-bold py-2.5 rounded-xl transition-all shadow flex items-center justify-center space-x-1"
                    >
                      <span>上传一张照片，让系统帮助判断</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}


              {/* ==================== TAB: MEMORIAL (纪念广场) ==================== */}
              {viewState.tab === "memorial" && (
                <div className="space-y-4">
                  {/* Top Title & Header */}
                  <div className="bg-stone-50 border border-stone-200/60 rounded-2xl p-4.5 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1 pr-2">
                        <h2 className="text-base font-serif font-bold text-stone-900" id="memorial-page-title">纪念动物</h2>
                        <p className="text-[11px] text-[#B83B26] font-medium leading-tight">
                          每一只被记得的动物，都有属于它的一页。
                        </p>
                        <p className="text-[10px] text-stone-500 leading-normal">
                          这里记录的是由公众在小程序内留下的纪念，以及经审核后归档的历史资料。
                        </p>
                      </div>
                      <button
                        onClick={() => setShowUploadMemoryModal(true)}
                        className="bg-[#B83B26] hover:bg-[#973121] text-white text-[10px] font-bold py-2 px-3.5 rounded-full shadow-sm transition-all flex items-center space-x-1 flex-shrink-0 cursor-pointer"
                        id="upload-memory-btn"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>提供历史资料</span>
                      </button>
                    </div>
                  </div>

                  {/* Memorial Animals Card List */}
                  <div className="space-y-4 pt-1">
                    {animals.filter(a => a.id === "ahang" || a.id === "bebei").map(anim => {
                      // Calculate stats dynamically
                      const commentsCount = memorialComments.filter(c => c.animalId === anim.id).length;

                      const flowersCount = memorialComments.filter(c => c.animalId === anim.id).reduce((sum, c) => sum + (c.flowers || 0), 0);

                      const candlesCount = animalCandles[anim.id] || 0;

                      return (
                        <div
                          key={anim.id}
                          className="bg-[#FAF8F5] border border-[#D9C3B0]/50 rounded-2xl p-4 flex flex-col space-y-3 shadow-sm hover:shadow-md transition-all animate-fade-in"
                        >
                          {/* Upper row: Photo & info */}
                          <div className="flex space-x-3.5">
                            {/* Left: Animal Image */}
                            <div className="w-24 h-24 rounded-xl overflow-hidden border border-stone-200/60 bg-[#FAF8F5] flex-shrink-0 relative">
                              <AnimalImage
                                species={anim.species}
                                image={anim.image || anim.coverUrl}
                                imageType={anim.imageType}
                                className="w-full h-full object-cover"
                                alt={anim.name}
                              />
                            </div>
                            {/* Right: Info */}
                            <div className="flex-1 min-w-0 space-y-1.5 flex flex-col justify-center">
                              <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                                <span className="text-sm font-serif font-bold text-stone-900 truncate">{anim.name}</span>
                                <span className="text-[9px] bg-[#B83B26]/10 text-[#B83B26] px-1.5 py-0.5 rounded-full font-bold">
                                  {anim.commonName}
                                </span>
                                {anim.id === "bebei" && (
                                  <span className="text-[9px] bg-[#2F5233]/10 text-[#2F5233] px-1.5 py-0.5 rounded-full font-bold">
                                    阿杭的伴侣
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-stone-500 font-medium">
                                📍 {anim.zoo} · 🕒 {anim.lifeSpan}
                              </p>
                              <p className="text-[10px] text-[#2F5233] bg-[#2F5233]/5 px-2 py-1 rounded-lg leading-relaxed line-clamp-2 font-serif font-medium">
                                {anim.id === "ahang" 
                                  ? "因为一头会随天气变化的齐刘海，被全国网友记住的白狮。" 
                                  : "陪伴阿杭多年的白狮贝贝，共同见证了广州动物园许多人的回忆，也是阿杭生命故事中最重要的家庭成员之一。"}
                              </p>
                            </div>
                          </div>

                          {/* Stats row */}
                          <div className="grid grid-cols-3 gap-1.5 bg-white border border-stone-100 rounded-xl p-2 text-center">
                            <div>
                              <span className="block text-[8px] font-bold text-stone-400 uppercase tracking-wider">纪念留言</span>
                              <span className="block text-xs font-mono font-extrabold text-stone-700">{commentsCount} 条</span>
                            </div>
                            <div>
                              <span className="block text-[8px] font-bold text-stone-400 uppercase tracking-wider">献花总数</span>
                              <span className="block text-xs font-mono font-extrabold text-[#B83B26]">{flowersCount} 朵</span>
                            </div>
                            <div>
                              <span className="block text-[8px] font-bold text-stone-400 uppercase tracking-wider">点亮蜡烛</span>
                              <span className="block text-xs font-mono font-extrabold text-amber-500">{candlesCount} 盏</span>
                            </div>
                          </div>

                          {/* Enter Button */}
                          <button
                            onClick={() => setViewState({ type: "animal_detail", animalId: anim.id, activeSubTab: "all" })}
                            className="w-full bg-stone-800 hover:bg-stone-900 text-white text-[11px] font-bold py-2.5 px-4 rounded-xl shadow-sm transition-all text-center flex items-center justify-center space-x-1 cursor-pointer"
                          >
                            <span>进入纪念页</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}

                    {/* View more more button */}
                    <button
                      onClick={() => triggerToast("更多纪念动物档案正在整理中")}
                      className="w-full py-3 bg-stone-100 hover:bg-stone-200/80 border border-stone-200/60 rounded-2xl text-[10px] font-bold text-stone-500 transition-all text-center flex items-center justify-center space-x-1.5 cursor-pointer"
                    >
                      <span>🍂</span>
                      <span>查看更多纪念动物</span>
                    </button>
                  </div>
                </div>
              )}


              {/* ==================== TAB: MY PROFILE (我的) ==================== */}
              {viewState.tab === "my" && (
                <div className="space-y-5">
                  {/* User Header Profile Card */}
                  <div className="bg-white border border-stone-200 rounded-3xl p-5 shadow-sm flex items-center space-x-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#2F5233]/20 bg-stone-100 flex-shrink-0 flex items-center justify-center">
                      {currentUser.avatarUrl ? (
                        <img src={currentUser.avatarUrl} alt={currentUser.nickname} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-stone-100 flex items-center justify-center text-xl font-bold text-stone-600">
                          {currentUser.nickname ? currentUser.nickname.charAt(0) : "游"}
                        </div>
                      )}
                    </div>
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <h3 className="text-base font-serif font-bold text-stone-900" id="user-profile-name">
                          {currentUser.nickname}
                        </h3>
                        <span className={`px-2 py-0.5 text-[9px] rounded-full font-bold ${
                          currentUser.role === "guest"
                            ? "bg-stone-100 text-stone-500"
                            : currentUser.role === "admin"
                            ? "bg-red-100 text-[#B83B26]"
                            : currentUser.role === "reviewer"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-[#2F5233]/10 text-[#2F5233]"
                        }`}>
                          {currentUser.role === "guest"
                            ? "游客"
                            : currentUser.role === "contributor"
                            ? "公众贡献者"
                            : currentUser.role === "reviewer"
                            ? "守护人 / 审核员"
                            : "管理员"}
                        </span>
                      </div>
                      <p className="text-[10px] text-stone-500 truncate">
                        {currentUser.role === "guest" ? (
                          "尚未登录 · 点击右侧按钮快捷登录"
                        ) : (
                          <>账号状态：<span className="font-bold text-stone-700">{currentUser.status === "active" ? "正常" : currentUser.status === "pending" ? "待审核" : "已停用"}</span> · ID: {currentUser.id}</>
                        )}
                      </p>
                    </div>

                    {/* Guest Login Primary Button */}
                    {currentUser.role === "guest" && (
                      <button
                        onClick={() => {
                          login("contributor");
                          triggerToast("已模拟登录为 公众贡献者 👤");
                        }}
                        className="bg-[#2F5233] hover:bg-[#233f27] text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-sm shrink-0 cursor-pointer"
                        id="btn-login-contributor"
                      >
                        登录 / Login
                      </button>
                    )}
                  </div>

                  {/* Quick stats numbers bar */}
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div
                      onClick={() => setViewState({ type: "my_submissions" })}
                      className="bg-white border border-stone-200/60 p-3 rounded-2xl cursor-pointer hover:bg-stone-50 hover:border-[#2F5233]/30 transition-colors"
                    >
                      <p className="text-xl font-serif font-bold text-stone-900">{currentUser.role === "guest" ? "0次" : "12次"}</p>
                      <p className="text-[9px] text-stone-400 mt-1">记录</p>
                    </div>

                    <div
                      onClick={() => setViewState({ type: "my_submissions" })}
                      className="bg-white border border-stone-200/60 p-3 rounded-2xl cursor-pointer hover:bg-stone-50 hover:border-[#2F5233]/30 transition-colors"
                    >
                      <p className="text-xl font-serif font-bold text-stone-900">{currentUser.role === "guest" ? "0条" : "6条"}</p>
                      <p className="text-[9px] text-stone-400 mt-1">补充资料</p>
                    </div>

                    <div
                      onClick={() => setViewState({ type: "task_center" })}
                      className="bg-white border border-stone-200/60 p-3 rounded-2xl cursor-pointer hover:bg-stone-50 hover:border-[#2F5233]/30 transition-colors"
                    >
                      <p className="text-xl font-serif font-bold text-stone-900">{currentUser.role === "guest" ? "0只" : "3只"}</p>
                      <p className="text-[9px] text-stone-400 mt-1">帮助确认动物</p>
                    </div>
                  </div>

                  {/* Menu Options List */}
                  <div className="bg-white border border-stone-200 rounded-2xl divide-y divide-stone-100 overflow-hidden shadow-sm">
                    {/* Role Specific Entry: 守护人工作台 (Reviewer & Admin) */}
                    {(currentUser.role === "reviewer" || currentUser.role === "admin") && (
                      <div
                        onClick={() => {
                          setViewState({ type: "admin_panel" });
                          setAdminTab("pending");
                          triggerToast("已进入守护人工作台 🛡️");
                        }}
                        className="px-4 py-3.5 flex justify-between items-center hover:bg-emerald-50/80 cursor-pointer text-stone-800 group transition-all bg-emerald-50/40"
                        id="my-menu-reviewer-workbench"
                      >
                        <div className="flex items-center space-x-2">
                          <Shield className="w-4 h-4 text-[#2F5233]" />
                          <span className="text-xs font-bold text-[#2F5233]">守护人工作台</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span className="text-[9px] text-[#2F5233] bg-[#2F5233]/10 px-1.5 py-0.5 rounded-full font-bold">待质检 2</span>
                          <ChevronRight className="w-4 h-4 text-[#2F5233]/60" />
                        </div>
                      </div>
                    )}

                    {/* Role Specific Entry: 管理后台 (Admin) */}
                    {currentUser.role === "admin" && (
                      <div
                        onClick={() => {
                          setViewState({ type: "admin_panel" });
                          triggerToast("已进入管理后台 🛡️");
                        }}
                        className="px-4 py-3.5 flex justify-between items-center hover:bg-red-50/80 cursor-pointer text-stone-800 group transition-all bg-red-50/40"
                        id="my-menu-admin-panel"
                      >
                        <div className="flex items-center space-x-2">
                          <Shield className="w-4 h-4 text-[#B83B26]" />
                          <span className="text-xs font-bold text-[#B83B26]">管理后台 / Admin Panel</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span className="text-[9px] text-[#B83B26] bg-red-100 px-1.5 py-0.5 rounded-full font-bold">全权管理</span>
                          <ChevronRight className="w-4 h-4 text-[#B83B26]/60" />
                        </div>
                      </div>
                    )}

                    {/* 1. 我的投稿 */}
                    <div
                      onClick={() => setViewState({ type: "my_submissions" })}
                      className="px-4 py-3.5 flex justify-between items-center hover:bg-stone-50 cursor-pointer text-stone-700 group transition-all"
                      id="my-menu-submissions"
                    >
                      <span className="text-xs font-bold group-hover:text-[#2F5233] transition-colors">我的投稿</span>
                      <div className="flex items-center space-x-1">
                        <span className="text-[9px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full font-bold">
                          {currentUser.role === "guest" ? "0" : "待审核 1"}
                        </span>
                        <ChevronRight className="w-4 h-4 text-stone-400" />
                      </div>
                    </div>

                    {/* 2. 我的收藏 */}
                    <div
                      onClick={() => triggerToast("我的收藏：已收藏白狮‘阿杭’等 2 只动物 💖")}
                      className="px-4 py-3.5 flex justify-between items-center hover:bg-stone-50 cursor-pointer text-stone-700 group transition-all"
                      id="my-menu-favorites"
                    >
                      <span className="text-xs font-bold group-hover:text-[#2F5233] transition-colors">我的收藏</span>
                      <ChevronRight className="w-4 h-4 text-stone-400" />
                    </div>

                    {/* 3. 我的观察足迹 */}
                    <div
                      onClick={() => triggerToast("我的观察足迹：您已点亮广州动物园和某动物园的 22 次实地观察痕迹 🐾")}
                      className="px-4 py-3.5 flex justify-between items-center hover:bg-stone-50 cursor-pointer text-stone-700 group transition-all"
                      id="my-menu-footprints"
                    >
                      <span className="text-xs font-bold group-hover:text-[#2F5233] transition-colors">我的观察足迹</span>
                      <ChevronRight className="w-4 h-4 text-stone-400" />
                    </div>

                    {/* 4. 我的贡献 */}
                    <div
                      onClick={() => triggerToast("我的贡献：贡献积分 180 分，已帮助纠错及补充多次 🌟")}
                      className="px-4 py-3.5 flex justify-between items-center hover:bg-stone-50 cursor-pointer text-stone-700 group transition-all"
                      id="my-menu-contributions"
                    >
                      <span className="text-xs font-bold group-hover:text-[#2F5233] transition-colors">我的贡献</span>
                      <ChevronRight className="w-4 h-4 text-stone-400" />
                    </div>

                    {/* 5. 待我补充 */}
                    <div
                      onClick={() => {
                        setViewState({ type: "task_center" });
                        triggerToast("进入公众协作资料核对任务中心");
                      }}
                      className="px-4 py-3.5 flex justify-between items-center hover:bg-stone-50 cursor-pointer text-stone-700 group transition-all"
                      id="my-menu-tasks"
                    >
                      <span className="text-xs font-bold group-hover:text-[#2F5233] transition-colors">待我补充</span>
                      <span className="text-[10px] bg-red-100 text-[#B83B26] px-1.5 py-0.5 rounded-full font-bold">3 个急需线索</span>
                    </div>

                    {/* 6. 版权与授权 */}
                    <div
                      onClick={() => triggerToast("版权授权：您已签署《公众数字档案共享协议》，提交资料免费用于动物科普 📄")}
                      className="px-4 py-3.5 flex justify-between items-center hover:bg-stone-50 cursor-pointer text-stone-700 group transition-all"
                      id="my-menu-copyright"
                    >
                      <span className="text-xs font-bold group-hover:text-[#2F5233] transition-colors">版权与授权</span>
                      <ChevronRight className="w-4 h-4 text-stone-400" />
                    </div>

                    {/* 7. 申请档案协作者 */}
                    <div
                      onClick={() => triggerToast("协作者申请：您的资料已提交审核，审核通过后可直接编辑动物档案 ✍️")}
                      className="px-4 py-3.5 flex justify-between items-center hover:bg-stone-50 cursor-pointer text-stone-700 group transition-all"
                      id="my-menu-apply-collab"
                    >
                      <span className="text-xs font-bold group-hover:text-[#2F5233] transition-colors">申请档案协作者</span>
                      <ChevronRight className="w-4 h-4 text-stone-400" />
                    </div>

                    {/* 8. 设置与帮助 */}
                    <div
                      onClick={() => setShowSettingsHelpModal(true)}
                      className="px-4 py-3.5 flex justify-between items-center hover:bg-stone-50 cursor-pointer text-stone-700 group transition-all"
                      id="my-menu-settings-help"
                    >
                      <span className="text-xs font-bold group-hover:text-[#2F5233] transition-colors">设置与帮助</span>
                      <ChevronRight className="w-4 h-4 text-stone-400" />
                    </div>
                  </div>

                  {/* Logout Button (Only if Logged in) */}
                  {currentUser.role !== "guest" && (
                    <button
                      onClick={() => {
                        logout();
                        triggerToast("已退出登录，恢复为游客状态 🚪");
                      }}
                      className="w-full bg-white hover:bg-[#B83B26]/5 border border-stone-200 hover:border-[#B83B26]/30 text-[#B83B26] text-xs font-bold py-3 rounded-2xl transition-all shadow-sm cursor-pointer flex items-center justify-center space-x-1.5"
                      id="btn-logout"
                    >
                      <X className="w-4 h-4 text-[#B83B26]" />
                      <span>退出登录 / Log Out</span>
                    </button>
                  )}

                  {/* Dev / Test Role Switcher (仅 Demo 测试使用) */}
                  <div className="bg-stone-100/90 border border-dashed border-stone-300 rounded-2xl p-4 space-y-2.5 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-stone-700 flex items-center space-x-1.5">
                        <span>🛠️</span>
                        <span>开发测试：切换身份</span>
                      </span>
                      <span className="text-[9px] bg-amber-100 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded font-bold">
                        仅 Demo 测试使用
                      </span>
                    </div>
                    <p className="text-[10px] text-stone-500 leading-tight">
                      快捷模拟不同权限角色，实时验证“我的”页面与专属后台入口展示效果。
                    </p>
                    <div className="grid grid-cols-4 gap-1.5 pt-1">
                      {(
                        [
                          { role: "guest", label: "游客" },
                          { role: "contributor", label: "公众贡献者" },
                          { role: "reviewer", label: "审核员" },
                          { role: "admin", label: "管理员" },
                        ] as const
                      ).map((item) => {
                        const isActive = currentUser.role === item.role;
                        return (
                          <button
                            key={item.role}
                            onClick={() => {
                              switchRole(item.role);
                              triggerToast(`已切换身份为：${item.label} 🔄`);
                            }}
                            className={`py-2 px-1 rounded-xl text-[10.5px] font-bold border transition-all cursor-pointer text-center ${
                              isActive
                                ? "bg-[#2F5233] text-white border-[#2F5233] shadow-sm"
                                : "bg-white text-stone-700 border-stone-200 hover:bg-stone-50"
                            }`}
                          >
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Small credits footer */}
                  <div className="text-center py-2 space-y-1">
                    <p className="text-[9px] text-stone-400 font-bold uppercase tracking-wider">PROJECT AHANG Demo v1.0</p>
                    <p className="text-[9px] text-stone-400 leading-relaxed max-w-[240px] mx-auto">
                      公众共建的在园动物数字守护平台
                    </p>
                  </div>
                </div>
              )}

            </div>
          )}

          {viewState.type === "animal_detail" && (
            (() => {
              const animal = animals.find(a => a.id === viewState.animalId);
              if (!animal) {
                return (
                  <div className="p-8 text-center space-y-4">
                    <p className="text-xs text-stone-500">无法找到该动物的详细档案。</p>
                    <button
                      onClick={() => setViewState({ type: "main", tab: "home" })}
                      className="bg-[#B83B26] text-white px-4 py-2 rounded-xl text-xs"
                    >
                      返回首页
                    </button>
                  </div>
                );
              }

              // Determine if it is Ahang
              const isAhang = animal.id === "ahang";
              const isDeceased = animal.status === "deceased";

              return (
                <div className="pb-24 relative animate-fade-in">
                  {/* 1. 顶部大图 & 头部浮动操作栏 */}
                  <div className="relative h-64 bg-stone-900 overflow-hidden">
                    <AnimalImage 
                      species={animal.species} 
                      image={animal.image || animal.coverUrl} 
                      imageType={animal.imageType || "real"} 
                      className="w-full h-full object-cover opacity-90 transition-transform duration-700 hover:scale-105" 
                      alt={animal.name} 
                    />
                    {/* Shadow overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-transparent"></div>
                    
                    {/* Top Action Bar */}
                    <div className="absolute top-4 inset-x-4 flex justify-between items-center z-20">
                      <button
                        onClick={() => setViewState({ type: "main", tab: "archives" })}
                        className="p-2.5 bg-stone-900/60  rounded-full text-white hover:bg-stone-900/80 transition-all border border-white/10"
                        id="back-to-archives-btn"
                        title="返回"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      
                      <div className="flex space-x-2">
                        {/* 收藏 (Heart) */}
                        <button
                          onClick={() => triggerToast(`已将“${animal.name}”添加至我的关注 💖`)}
                          className="p-2.5 bg-stone-900/60  rounded-full text-white hover:bg-[#B83B26] hover:text-white transition-all border border-white/10"
                          title="收藏"
                        >
                          <Heart className="w-5 h-5" />
                        </button>
                        
                        {/* 分享 (Share2) */}
                        <button
                          onClick={() => triggerToast(`档案分享链接已生成！快邀请其他观察员来共同守护“${animal.name}”的生命记忆 🔗`)}
                          className="p-2.5 bg-stone-900/60  rounded-full text-white hover:bg-[#B83B26] hover:text-white transition-all border border-white/10"
                          title="分享"
                        >
                          <Share2 className="w-5 h-5" />
                        </button>

                        {/* 纠错 (AlertCircle) */}
                        <button
                          onClick={() => setShowCorrectionModal(true)}
                          className="p-2.5 bg-stone-900/60  rounded-full text-white hover:bg-amber-500 hover:text-stone-950 transition-all border border-white/10 flex items-center space-x-1"
                          title="纠错"
                        >
                          <AlertCircle className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {/* Bottom overlay metadata card */}
                    <div className="absolute inset-x-5 bottom-4 text-white flex justify-between items-end z-10">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                          <span className="text-2xl font-serif font-bold tracking-wide text-white">{animal.name}</span>
                          <span className="text-xs bg-white/20 px-2 py-0.5 rounded text-stone-100 font-bold">
                            {animal.species}
                          </span>
                          {animal.isTestData && (
                            <span className="text-[10px] bg-stone-800/80 text-stone-300 border border-stone-600 px-2 py-0.5 rounded-full font-medium">
                              测试档案
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-stone-300">
                          <span>{animal.gender}</span>
                          <span>·</span>
                          <span>{animal.lifeSpan}</span>
                        </div>
                      </div>
                      <div>
                        <StatusBadge status={animal.status} label={animal.statusLabel} />
                      </div>
                    </div>
                  </div>

                  {/* Body Scrollable Content Panel */}
                  <div className="px-5 pt-5 space-y-5">
                    {animal.isTestData && (
                      <div className="bg-stone-100 border border-stone-200/80 rounded-xl px-3.5 py-2 flex items-center space-x-2 text-stone-500 text-xs shadow-sm">
                        <span className="text-[10px] font-bold bg-stone-200 text-stone-600 px-1.5 py-0.5 rounded shrink-0">测试档案</span>
                        <span className="text-[11px] text-stone-500 leading-tight">本档案用于产品功能演示，内容不代表真实动物资料。</span>
                      </div>
                    )}
                    
                    {/* 2. 一句话认识它 (One-liner Bio) */}
                    <div className="bg-gradient-to-r from-[#B83B26]/10 to-[#B83B26]/2 border-l-4 border-[#B83B26] rounded-r-2xl py-3.5 px-4 shadow-sm animate-fade-in">
                      <p className="text-xs text-stone-500 font-bold tracking-wider uppercase mb-1">一句话认识它</p>
                      <p className="text-sm font-serif font-bold text-stone-900 leading-relaxed italic">
                        “{isAhang ? "因为一头会随天气变化的齐刘海，被全国网友记住的白狮。" : animal.summary || "生活在动物园里的老朋友。"}”
                      </p>
                    </div>

                    {/* 3. 标签 (Tags) */}
                    <div className="flex flex-wrap gap-2 py-1">
                      {animal.tags.map((tag, i) => (
                        <span 
                          key={i} 
                          className="px-3 py-1 text-xs bg-white border border-stone-200 text-stone-600 rounded-full font-medium hover:border-[#B83B26]/30 hover:text-[#B83B26] transition-colors shadow-sm"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>

                    {/* 4. 基础档案 (Basic Archives Grid with Verification Levels) */}
                    <div className="bg-white border border-stone-200/60 rounded-2xl p-4.5 shadow-sm space-y-4">
                      <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
                        <h3 className="text-sm font-serif font-bold text-stone-900 flex items-center space-x-1.5">
                          <span className="text-[#B83B26]">📁</span>
                          <span>基础档案</span>
                        </h3>
                        <span className="text-[10px] text-stone-400 font-mono">ID: #{animal.id}</span>
                      </div>

                      {/* Archive Table Grid */}
                      <div className="grid grid-cols-1 divide-y divide-stone-100 text-xs">
                        {[
                          { label: "名字", value: animal.name, level: "official", levelLabel: "官方来源" },
                          { label: "昵称", value: isAhang ? "齐刘海狮子、发型师" : "暂无", level: isAhang ? "verified" : "official", levelLabel: isAhang ? "多方核实" : "官方来源" },
                          { label: "物种", value: animal.species + (isAhang ? "（白狮变种）" : ""), level: "official", levelLabel: "官方来源" },
                          { label: "性别", value: animal.gender, level: "official", levelLabel: "官方来源" },
                          { label: "出生", value: isAhang ? "2009年，杭州" : "见详情", level: "official", levelLabel: "官方来源" },
                          { label: "来到广州", value: isAhang ? "2015年" : "见详情", level: "official", levelLabel: "官方来源" },
                          { label: "所在机构", value: animal.zoo, level: "official", levelLabel: "官方来源" },
                          { label: "状态", value: isAhang ? "2026年7月14日离世" : animal.statusLabel, level: "official", levelLabel: "官方来源" }
                        ].map((field, idx) => (
                          <div key={idx} className="flex justify-between items-center py-2.5">
                            <span className="text-stone-500 font-medium">{field.label}</span>
                            <div className="flex items-center space-x-2 min-w-0">
                              <span className="text-stone-900 font-bold truncate">{field.value}</span>
                              <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium flex-shrink-0 ${
                                field.level === "official"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                  : field.level === "verified"
                                    ? "bg-blue-50 text-blue-700 border border-blue-100"
                                    : "bg-amber-50 text-amber-700 border border-amber-100"
                              }`}>
                                {field.levelLabel}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 5. 生命时间线 (Life Timeline) */}
                    <div className="bg-white border border-stone-200/60 rounded-2xl p-4.5 shadow-sm space-y-4">
                      <h3 className="text-sm font-serif font-bold text-stone-900 flex items-center space-x-1.5 border-b border-stone-100 pb-2.5">
                        <span className="text-[#B83B26]">⏳</span>
                        <span>生命时间线</span>
                      </h3>
                      
                      <div className="relative border-l-2 border-stone-200 pl-4 ml-2 py-1.5 space-y-5">
                        {animal.timeline.map((evt, i) => (
                          <div key={i} className="relative animate-fade-in">
                            {/* Dot */}
                            <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-[#B83B26] ring-4 ring-[#FAF8F5]"></div>
                            <div>
                              <span className="text-xs font-serif font-bold text-[#B83B26] bg-[#B83B26]/5 px-2 py-0.5 rounded">
                                {evt.year}
                              </span>
                              <h4 className="text-xs font-bold text-stone-900 mt-1.5">{evt.title}</h4>
                              <p className="text-[11px] text-stone-500 mt-0.5 leading-relaxed">{evt.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 6. 它的故事 (The Story Section) */}
                    {isAhang && (
                      <div className="bg-white border border-stone-200/60 rounded-2xl p-4.5 shadow-sm space-y-4">
                        <h3 className="text-sm font-serif font-bold text-stone-900 flex items-center space-x-1.5 border-b border-stone-100 pb-2.5">
                          <span className="text-[#B83B26]">📖</span>
                          <span>它的故事</span>
                        </h3>
                        <div className="space-y-3.5 text-xs text-stone-700 leading-relaxed font-serif">
                          <p className="text-indent-4 bg-stone-50/50 p-3 rounded-xl border border-stone-100">
                            <b>【南下羊城】</b> 阿杭于2009年出生于杭州野生动物世界，作为罕见的克鲁格白狮变种，他自小备受瞩目。2015年，为了促进白狮物种的交流与繁育，阿杭跨越千里来到广州动物园落户，很快适应了岭南环境，成为狮虎山最亮眼的明星。
                          </p>
                          <p className="text-indent-4 bg-stone-50/50 p-3 rounded-xl border border-stone-100">
                            <b>【刘海顶流】</b> 在广州生活的十余年岁月中，由于南方天气闷热潮湿、水分重，再加上阿杭特别喜欢用舌头舔爪并抚摸额头毛发的独特习惯，使得他的鬃毛常呈现出规整的发型。2022年国庆期间，他的一头酷似“齐刘海”的呆萌发型被游客抓拍上网，照片迅速走红网络，更被称为“会随天气变发型的狮子”。
                          </p>
                          <p className="text-indent-4 bg-stone-50/50 p-3 rounded-xl border border-stone-100">
                            <b>【温柔永恒】</b> 晚年的阿杭深受骨关节炎及老年性白内障困扰，相当于人类高龄80余岁。为了他的身体健康，园方暂停了户外展出并将其转入后场舒适内舍，配以专业的安宁疗护。2026年7月14日，这位给无数人带来过温暖、欢笑和治愈的白狮老友，因身体各项机能衰竭安详离世。
                          </p>
                        </div>
                      </div>
                    )}

                    {/* 7. 观察记录 (Observations Section) */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-baseline">
                        <h3 className="text-sm font-serif font-bold text-stone-900 flex items-center space-x-1.5">
                          <span className="text-[#B83B26]">👁️</span>
                          <span>日常观察记录</span>
                        </h3>
                        <span className="text-[10px] text-stone-400 font-bold">{animal.observations.length} 条公众目击</span>
                      </div>

                      {/* Sub-tabs to filter category */}
                      <div className="flex space-x-1.5 overflow-x-auto pb-1 no-scrollbar">
                        {[
                          { id: "all", label: "全部" },
                          { id: "resting", label: "休息" },
                          { id: "feeding", label: "进食" },
                          { id: "playing", label: "嬉戏" },
                          { id: "moving", label: "散步" }
                        ].map(sub => (
                          <button
                            key={sub.id}
                            onClick={() => setViewState({ ...viewState, activeSubTab: sub.id as any })}
                            className={`px-3 py-1 rounded-full text-[10px] font-bold border flex-shrink-0 transition-colors ${
                              viewState.activeSubTab === sub.id
                                ? "bg-[#B83B26] text-white border-[#B83B26]"
                                : "bg-white text-stone-600 border-stone-200 hover:border-stone-300"
                            }`}
                          >
                            {sub.label}
                          </button>
                        ))}
                      </div>

                      {/* Observations List */}
                      <div className="space-y-3">
                        {animal.observations
                          .filter(obs => viewState.activeSubTab === "all" || obs.category === viewState.activeSubTab)
                          .map(obs => (
                            <div key={obs.id} className="bg-white border border-stone-200 rounded-2xl p-4.5 space-y-3.5 shadow-sm">
                              <div className="flex justify-between items-start">
                                <div className="flex items-center space-x-2.5">
                                  {obs.avatar ? (
                                    <img src={obs.avatar} alt={obs.username} className="w-8 h-8 rounded-full object-cover border border-stone-200" />
                                  ) : (
                                    <div className="w-8 h-8 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center text-xs font-bold text-stone-600 shrink-0">
                                      {obs.username ? obs.username.charAt(0).toUpperCase() : "U"}
                                    </div>
                                  )}
                                  <div>
                                    <h4 className="text-xs font-bold text-stone-900">{obs.username}</h4>
                                    <p className="text-[9px] text-[#5A6B7C] font-mono">{obs.date} · {obs.location}</p>
                                  </div>
                                </div>
                                <span className="text-[9px] bg-stone-100 text-stone-600 px-2.5 py-0.5 rounded-full font-bold">
                                  {obs.category === "resting" && "🦁 休息"}
                                  {obs.category === "feeding" && "🥩 进食"}
                                  {obs.category === "playing" && "⚽ 嬉戏"}
                                  {obs.category === "moving" && "🐾 散步"}
                                </span>
                              </div>

                              <p className="text-xs text-stone-700 leading-relaxed font-serif px-0.5">
                                {obs.text}
                              </p>

                              {obs.image && (
                                <div className="h-44 rounded-xl overflow-hidden shadow-sm">
                                  <img src={obs.image} alt="observation" className="w-full h-full object-cover" />
                                </div>
                              )}

                              <div className="flex items-center space-x-4 pt-2.5 text-[10px] text-stone-500 border-t border-stone-100">
                                <button
                                  onClick={() => handleLikeObservation(animal.id, obs.id)}
                                  className={`flex items-center space-x-1.5 font-mono hover:text-stone-800 ${obs.hasLiked ? "text-[#B83B26]" : ""}`}
                                >
                                  <ThumbsUp className="w-3.5 h-3.5" />
                                  <span>{obs.likes}</span>
                                </button>
                                <button
                                  onClick={() => triggerToast("评论模块已唤醒，请在下个迭代继续体验！")}
                                  className="flex items-center space-x-1.5 font-mono hover:text-stone-800"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                  <span>{obs.commentsCount}</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        {animal.observations.length === 0 && (
                          <div className="bg-white border border-stone-200/60 rounded-2xl p-6 text-center shadow-sm space-y-1">
                            <p className="text-xs text-stone-400 font-serif font-medium">暂无日常观察记录</p>
                            <p className="text-[10px] text-stone-400 leading-normal">欢迎各位观察员上传此动物的相关日常习性观察日志。</p>
                          </div>
                        )}
                      </div>

                      {/* Public Memory Cards for Deceased Animals */}
                      {isDeceased && (
                        <div className="space-y-3 pt-3 border-t border-stone-100">
                          <div className="flex justify-between items-baseline">
                            <span className="text-[11px] font-bold text-stone-800 tracking-wider flex items-center space-x-1">
                              <span>🕯️</span>
                              <span>公众回忆 (Public Memories)</span>
                            </span>
                            <span className="text-[9px] text-[#2F5233] font-serif font-bold">COMMUNITY REMEMBRANCE</span>
                          </div>

                          <div className="grid grid-cols-1 gap-3 text-left">
                            {publicMemories
                              .filter(memory => {
                                const relatedAnimalIds = memory.animalIds ?? [];
                                return relatedAnimalIds.includes(animal.id);
                              })
                              .map(memory => {
                                const isShared = memory.animalIds.includes("ahang") && memory.animalIds.includes("bebei");
                                return (
                                  <div key={memory.id} className="bg-[#FAF8F5] border border-[#D9C3B0]/30 rounded-2xl p-4 shadow-sm space-y-2.5">
                                    <div className="flex justify-between items-center text-[10px]">
                                      <div className="flex items-center space-x-1.5">
                                        <span className="font-bold text-stone-800">{memory.title}</span>
                                        {isShared && (
                                          <span className="text-[8px] bg-[#2F5233]/10 text-[#2F5233] px-1.5 py-0.5 rounded font-bold">
                                            阿杭 × 贝贝
                                          </span>
                                        )}
                                      </div>
                                      <span className={`px-1.5 py-0.5 rounded font-bold ${
                                        memory.category === "reminiscence" ? "text-[#2F5233] bg-[#2F5233]/10" :
                                        memory.category === "bond" ? "text-[#5A6B7C] bg-[#5A6B7C]/10" :
                                        memory.category === "companionship" ? "text-amber-700 bg-amber-50" :
                                        "text-[#B83B26] bg-[#B83B26]/10"
                                      }`}>
                                        {memory.categoryLabel}
                                      </span>
                                    </div>
                                    <p className="text-xs text-stone-600 leading-relaxed font-serif">
                                      {memory.text}
                                    </p>
                                    {memory.image && (
                                      <div className="h-32 rounded-xl overflow-hidden border border-stone-200">
                                        <img src={memory.image} alt="手绘插画" className="w-full h-full object-contain bg-white" />
                                      </div>
                                    )}
                                    <div className="flex items-center space-x-4 pt-2 text-[10px] text-stone-500 border-t border-stone-100/40">
                                      <button
                                        onClick={() => handleLikePublicMemory(memory.id)}
                                        className={`flex items-center space-x-1 hover:text-stone-800 cursor-pointer ${memory.hasLiked ? "text-[#B83B26]" : ""}`}
                                      >
                                        <ThumbsUp className="w-3.5 h-3.5" />
                                        <span>{memory.likes || 0}</span>
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            {publicMemories.filter(memory => (memory.animalIds ?? []).includes(animal.id)).length === 0 && (
                              <p className="text-xs text-stone-400 font-serif py-4 text-center">
                                暂无关于该动物的公众回忆，欢迎您提供历史资料或在下方留下感言。
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                  </div>

                    {/* Unified Memorial Area for Deceased Animals */}
                    {isDeceased && (
                      <div className="bg-white border border-stone-200/60 rounded-2xl p-4.5 shadow-sm space-y-4 text-left">
                        {/* Header */}
                        <div className="border-b border-stone-100 pb-2.5">
                          <h3 className="text-sm font-serif font-bold text-stone-900 flex items-center space-x-1.5">
                            <span className="text-[#B83B26]">🕯️</span>
                            <span>纪念它</span>
                          </h3>
                          <p className="text-[11px] text-[#5A6B7C] font-serif mt-1">
                            每一句留言、每一朵花和每一盏烛光，都让它继续被记得。
                          </p>
                        </div>

                        {/* 1. Candles count & lighting button */}
                        <div className="flex items-center justify-between bg-stone-50 p-3 rounded-xl border border-stone-100">
                          <div className="flex items-center space-x-2">
                            <span className="text-base">🕯️</span>
                            <span className="text-xs font-serif font-medium text-stone-700">
                              已点亮 <span className="font-mono text-stone-900 font-bold text-sm">{animalCandles[animal.id] || 0}</span> 盏纪念烛光
                            </span>
                          </div>
                          <button
                            onClick={() => handleLightCandle(animal.id)}
                            disabled={!!candledAnimals[animal.id]}
                            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all shadow-xs cursor-pointer ${
                              candledAnimals[animal.id]
                                ? "bg-stone-200 text-stone-500 cursor-not-allowed"
                                : "bg-[#B83B26] text-white hover:bg-[#B83B26]/90"
                            }`}
                          >
                            {candledAnimals[animal.id] ? "已点亮" : "点亮一盏蜡烛"}
                          </button>
                        </div>

                        {/* 2. Comment Input Section */}
                        <div className="space-y-3">
                          <textarea
                            value={newCommentText}
                            onChange={(e) => setNewCommentText(e.target.value)}
                            placeholder={`写下一句想对${animal.name}说的话……`}
                            className="w-full min-h-[80px] p-3 text-xs bg-stone-50 border border-stone-200 rounded-xl resize-none placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-[#2F5233]"
                            rows={3}
                          />
                          {/* 3. Submit Button */}
                          <div className="flex justify-end">
                            <button
                              onClick={() => handleAddMemorialComment(animal.id)}
                              className="px-4 py-1.5 bg-[#B83B26] text-white text-xs font-bold rounded-xl hover:bg-[#B83B26]/90 transition-colors shadow-sm cursor-pointer"
                            >
                              提交寄语
                            </button>
                          </div>
                        </div>

                        {/* 4. 该动物的留言列表 & 5. 每条留言的献花按钮与数量 */}
                        <div className="pt-2 divide-y divide-stone-100">
                          {memorialComments
                            .filter(comment => comment.animalId === animal.id)
                            .map((comment) => {
                              const isOffered = !!flowerOffered[comment.id];
                              return (
                                <div key={comment.id} className="py-3.5 first:pt-1 last:pb-1 space-y-2">
                                  <div className="flex justify-between items-center text-[10px]">
                                    <span className="font-bold text-stone-800">{comment.username}</span>
                                    <span className="text-stone-400 font-mono">{comment.timestamp}</span>
                                  </div>
                                  <p className="text-xs text-stone-600 leading-relaxed font-serif">
                                    {comment.text}
                                  </p>
                                  <div className="flex justify-start pt-1">
                                    <button
                                      onClick={() => handleOfferFlower(comment.id)}
                                      className={`flex items-center space-x-1.5 px-3 py-1 text-[10px] font-medium rounded-full border transition-all cursor-pointer ${
                                        isOffered
                                          ? "bg-amber-50 text-amber-700 border-amber-200"
                                          : "bg-stone-50 text-stone-500 border-stone-200 hover:bg-stone-100 hover:text-stone-700"
                                      }`}
                                    >
                                      <span>🌻</span>
                                      <span>
                                        {isOffered ? `已献花 🌻 · ${comment.flowers}` : `🌻 献花 · ${comment.flowers}`}
                                      </span>
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          {memorialComments.filter(comment => comment.animalId === animal.id).length === 0 && (
                            <p className="text-xs text-stone-400 text-center py-4 font-serif">
                              还没有寄语，写下第一句想对它说的话吧。
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* ==================== 9.5 生命关系模块 (Life Relationship Module) ==================== */}
                    {(animal.relationships?.length || animal.relationship || animal.id === "ahang" || animal.id === "bebei") && (
                      (() => {
                        let partnerId = animal.relationships?.[0]?.animalId || animal.relationship?.partnerId;
                        let relationType = animal.relationships?.[0]?.label || animal.relationship?.relationType || "伴侣 (Mate)";
                        let relDescription = animal.relationships?.[0]?.description || animal.relationship?.description || "相伴多年 · 广州动物园白狮伴侣";

                        if (!partnerId) {
                          if (animal.id === "ahang") partnerId = "bebei";
                          else if (animal.id === "bebei") partnerId = "ahang";
                        }

                        const partnerAnim = animals.find(a => a.id === partnerId);
                        
                        if (!partnerAnim) return null;

                        return (
                          <div className="bg-white border border-stone-200/60 rounded-2xl p-3.5 sm:p-4.5 shadow-sm space-y-3.5 text-left animate-fade-in w-full max-w-full overflow-hidden">
                            {/* Header */}
                            <div className="border-b border-stone-100 pb-2.5">
                              <h3 className="text-sm font-serif font-bold text-stone-900 flex items-center space-x-1.5">
                                <span className="text-[#B83B26]">
                                  {relationType.includes("兄弟") || relationType.includes("brother") ? "🤝" : relationType.includes("繁育") ? "🌱" : "🌿"}
                                </span>
                                <span className="tracking-tight text-base font-bold font-serif text-stone-950">生命关系</span>
                                <span className="text-[10px] text-stone-400 font-mono font-medium">Life Relationship</span>
                              </h3>
                            </div>

                            {/* Card Body with Relationship structure */}
                            <div className="bg-[#FAF8F5] border border-[#D9C3B0]/30 rounded-2xl p-2.5 sm:p-4 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-1.5 sm:gap-3 w-full max-w-full overflow-hidden shadow-xs">
                              
                              {/* Node 1: Current Animal (highlighted, not clickable) */}
                              <div className="flex flex-col items-center text-center space-y-1.5 min-w-0 w-full p-1">
                                <div className="relative flex-shrink-0">
                                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 border-[#B83B26] ring-3 ring-[#B83B26]/10 shadow-md mx-auto">
                                    <AnimalImage 
                                      species={animal.species} 
                                      image={animal.image || animal.coverUrl} 
                                      imageType={animal.imageType || "real"} 
                                      className="w-full h-full object-cover" 
                                      alt={animal.name} 
                                    />
                                  </div>
                                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-[#B83B26] text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full leading-none shadow-sm whitespace-nowrap">
                                    当前
                                  </span>
                                </div>
                                <div className="min-w-0 w-full pt-1">
                                  <span className="block text-xs font-bold text-stone-900 truncate">{animal.name}</span>
                                  <span className="block text-[10px] text-stone-500 truncate">{animal.commonName || animal.species}</span>
                                </div>
                              </div>

                              {/* Center Connection: Relationship Type and info */}
                              <div className="flex flex-col items-center justify-center space-y-1 px-1 sm:px-2 min-w-0 flex-shrink-0">
                                <div className="flex items-center text-[#B83B26]">
                                  <span className="text-[10px] sm:text-xs font-bold font-serif px-2 py-0.5 bg-[#B83B26]/10 rounded-full tracking-tight whitespace-nowrap">
                                    {relationType}
                                  </span>
                                </div>
                                <div className="flex flex-col items-center w-full">
                                  {/* Decorative connector */}
                                  <div className="flex items-center space-x-0.5 sm:space-x-1 my-0.5">
                                    <div className="w-1 h-1 rounded-full bg-[#B83B26]/50"></div>
                                    <div className="w-3 sm:w-6 h-[1px] bg-gradient-to-r from-stone-200 via-[#B83B26]/30 to-stone-200"></div>
                                    <span className="text-[10px] sm:text-xs text-[#B83B26]">
                                      {relationType.includes("兄弟") || relationType.includes("brother") ? "🤝" : relationType.includes("繁育") ? "🌱" : "🌿"}
                                    </span>
                                    <div className="w-3 sm:w-6 h-[1px] bg-gradient-to-r from-stone-200 via-[#B83B26]/30 to-stone-200"></div>
                                    <div className="w-1 h-1 rounded-full bg-stone-300"></div>
                                  </div>
                                  <span className="text-[9px] sm:text-[10px] text-stone-500 font-serif text-center font-medium leading-tight max-w-[110px] sm:max-w-none break-words">
                                    {relDescription}
                                  </span>
                                </div>
                              </div>

                              {/* Node 2: Partner Animal (clickable, hover effect) */}
                              <button
                                onClick={() => setViewState({ type: "animal_detail", animalId: partnerAnim.id, activeSubTab: "all" })}
                                className="flex flex-col items-center text-center space-y-1.5 min-w-0 w-full group cursor-pointer p-1 sm:p-1.5 rounded-xl hover:bg-stone-100/60 transition-all active:scale-95"
                                title={`进入 ${partnerAnim.name} 的纪念档案`}
                              >
                                <div className="relative flex-shrink-0">
                                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden border border-stone-200 group-hover:border-[#B83B26] group-hover:shadow-md transition-all mx-auto">
                                    <AnimalImage 
                                      species={partnerAnim.species} 
                                      image={partnerAnim.image || partnerAnim.coverUrl} 
                                      imageType={partnerAnim.imageType || "real"} 
                                      className="w-full h-full object-cover transition-all" 
                                      alt={partnerAnim.name} 
                                    />
                                  </div>
                                </div>
                                <div className="min-w-0 w-full pt-1">
                                  <span className="block text-xs font-bold text-stone-700 group-hover:text-[#B83B26] transition-colors truncate">
                                    {partnerAnim.name}
                                  </span>
                                  <span className="block text-[10px] text-stone-400 group-hover:text-stone-600 transition-colors truncate">
                                    {partnerAnim.commonName || partnerAnim.species}
                                  </span>
                                  <span className="inline-flex items-center space-x-0.5 text-[9px] font-bold text-[#B83B26] bg-[#B83B26]/10 px-1.5 py-0.5 rounded-full mt-1 group-hover:bg-[#B83B26] group-hover:text-white transition-colors whitespace-nowrap">
                                    <span>查看档案</span>
                                    <span className="text-[8px]">›</span>
                                  </span>
                                </div>
                              </button>

                            </div>
                          </div>
                        );
                      })()
                    )}

                    {/* ==================== 10. 物种知识模块 (Species Knowledge Module) ==================== */}
                    {(() => {
                      const speciesObj = MOCK_SPECIES.find(
                        (s) => s.id === animal.speciesId || s.biologicalProfile.chineseName === animal.species
                      ) || MOCK_SPECIES[0];

                      return (
                        <div className="bg-white border border-stone-200/60 rounded-2xl p-5 shadow-sm space-y-6 text-left">
                          
                          {/* Title & Subtitle */}
                          <div className="border-b border-stone-100 pb-3">
                            <h3 className="text-sm font-serif font-bold text-stone-900 flex items-center space-x-1.5">
                              <span className="text-[#2F5233]">🔬</span>
                              <span className="tracking-tight text-base font-bold font-serif text-stone-950">认识它的物种</span>
                            </h3>
                            <p className="text-[11px] text-stone-500 font-serif mt-1">
                              通过 {animal.name}，认识 {speciesObj.biologicalProfile.chineseName}。
                            </p>
                          </div>

                          {/* Part 1: Biological Profile / 生物身份证 */}
                          <div className="space-y-2.5">
                            <div className="flex justify-between items-center">
                              <span className="text-[11px] font-bold text-stone-800 tracking-wider flex items-center space-x-1">
                                <span>📄</span>
                                <span>生物身份证 (Biological Profile)</span>
                              </span>
                              <span className="text-[9px] text-[#5A6B7C] font-mono font-bold tracking-widest bg-[#5A6B7C]/5 px-1.5 py-0.5 rounded">SPECIES ID CARD</span>
                            </div>
                            
                            <div className="bg-[#FAF8F5] border border-[#D9C3B0]/40 rounded-2xl p-4.5 space-y-3 shadow-inner relative overflow-hidden">
                              {/* Decorative Stamp Background */}
                              <div className="absolute right-4 top-2 opacity-5 pointer-events-none select-none text-[3.5rem] font-serif font-bold text-[#2F5233] leading-none uppercase">
                                MUSEUM
                              </div>
                              
                              {/* Primary Info (Chinese, English, Latin Name) */}
                              <div className="grid grid-cols-3 gap-3 border-b border-stone-200/50 pb-3 text-xs">
                                <div className="bg-white border border-stone-200/80 p-2.5 rounded-xl text-center">
                                  <div className="text-[9px] text-stone-400 font-serif mb-0.5">中文名称</div>
                                  <div className="font-bold text-stone-900 break-words">{speciesObj.biologicalProfile.chineseName}</div>
                                </div>
                                <div className="bg-white border border-stone-200/80 p-2.5 rounded-xl text-center">
                                  <div className="text-[9px] text-stone-400 font-serif mb-0.5">英文名称</div>
                                  <div className="font-bold text-stone-800 text-[10px] leading-tight break-words">{speciesObj.biologicalProfile.englishName}</div>
                                </div>
                                <div className="bg-white border border-stone-200/80 p-2.5 rounded-xl text-center">
                                  <div className="text-[9px] text-stone-400 font-serif mb-0.5">学名 (拉丁文)</div>
                                  <div className="font-serif italic font-medium text-[#B83B26] text-[9.5px] leading-tight break-words">{speciesObj.biologicalProfile.latinName}</div>
                                </div>
                              </div>

                              {/* Taxonomy hierarchy (Linné hierarchy) */}
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
                                {[
                                  { label: "界 Kingdom", value: speciesObj.biologicalProfile.kingdom },
                                  { label: "门 Phylum", value: speciesObj.biologicalProfile.phylum },
                                  { label: "纲 Class", value: speciesObj.biologicalProfile.className },
                                  { label: "目 Order", value: speciesObj.biologicalProfile.order },
                                  { label: "科 Family", value: speciesObj.biologicalProfile.family },
                                  { label: "属 Genus", value: speciesObj.biologicalProfile.genus },
                                  { label: "种 Species", value: speciesObj.biologicalProfile.species, isHighlighted: true }
                                ].map((tax, index) => (
                                  <div 
                                    key={index}
                                    className={`border px-3 py-2 rounded-xl flex justify-between items-center transition-all ${
                                      tax.isHighlighted 
                                        ? "bg-emerald-50/60 border-emerald-200/50" 
                                        : "bg-white border-stone-200/60"
                                    }`}
                                  >
                                    <div className="min-w-0 flex-1">
                                      <div className="text-[8px] text-stone-400 uppercase tracking-wider">{tax.label}</div>
                                      <div className={`font-bold text-stone-800 text-[10px] mt-0.5 leading-tight break-words ${tax.isHighlighted ? "text-emerald-900" : ""}`}>
                                        {tax.value}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Part 2: Basic Info / 基本资料 */}
                          <div className="space-y-2.5">
                            <span className="text-[11px] font-bold text-stone-800 tracking-wider flex items-center space-x-1">
                              <span>📊</span>
                              <span>基本资料 (Species Specifications)</span>
                            </span>
                            
                            <div className="grid grid-cols-2 gap-2.5 text-[11px]">
                              {[
                                { label: "平均寿命（动物园）", value: speciesObj.basicInfo.captiveLifespan, icon: "🏡" },
                                { label: "成年体重", value: speciesObj.basicInfo.weight, icon: "⚖️" },
                                { label: "体型特征", value: speciesObj.basicInfo.sizeHeight, icon: "📏" },
                                { label: "食性", value: speciesObj.basicInfo.diet, icon: "🥩" },
                                { label: "社会结构", value: speciesObj.basicInfo.socialStructure, icon: "👥" },
                                { label: "活动时间", value: speciesObj.basicInfo.activityTime, icon: "🌙" },
                                { label: "繁殖方式", value: speciesObj.basicInfo.reproduction, icon: "🐾" },
                                { label: "分布区域", value: speciesObj.basicInfo.distribution, icon: "🗺️" },
                                { label: "栖息环境", value: speciesObj.basicInfo.habitat, icon: "🌿" },
                                { label: "IUCN 保护等级", value: speciesObj.basicInfo.iucnStatus, icon: "🛡️" },
                                { label: "CITES 等级", value: speciesObj.basicInfo.citesStatus, icon: "📜" }
                              ].filter(info => info.value).map((info, index) => (
                                <div key={index} className="bg-[#FAF8F5]/60 border border-stone-200/40 hover:border-stone-200 p-2.5 rounded-xl flex items-start space-x-2">
                                  <span className="text-xs mt-0.5">{info.icon}</span>
                                  <div className="min-w-0">
                                    <div className="text-[9px] text-stone-400 font-medium">{info.label}</div>
                                    <div className="text-stone-800 font-bold font-serif text-[10px] mt-0.5 leading-snug break-words">{info.value}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Part 3: Species Characteristics / 物种特点 */}
                          {speciesObj.characteristics && speciesObj.characteristics.length > 0 && (
                            <div className="space-y-2.5">
                              <span className="text-[11px] font-bold text-stone-800 tracking-wider flex items-center space-x-1">
                                <span>✨</span>
                                <span>物种独特习性 (Evolutionary Trait)</span>
                              </span>
                              
                              <div className="space-y-2">
                                {speciesObj.characteristics.map((trait, index) => (
                                  <div key={index} className="bg-stone-50 border border-stone-100 p-3 rounded-xl space-y-1">
                                    <h4 className="text-[10.5px] font-bold text-[#2F5233] flex items-center space-x-1">
                                      <span className="text-[8px] bg-[#2F5233]/10 px-1 py-0.5 rounded font-mono">0{index + 1}</span>
                                      <span>{trait.title}</span>
                                    </h4>
                                    <p className="text-[10px] text-stone-600 font-serif leading-relaxed">{trait.description}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Part 4: Taxonomy / 分类关系 */}
                          <div className="space-y-3 pt-1">
                            <span className="text-[11px] font-bold text-stone-800 tracking-wider flex items-center space-x-1">
                              <span>🌱</span>
                              <span>分类关系 (Taxonomy)</span>
                            </span>
                            
                            <div className="bg-[#FAF8F5] border border-stone-200/50 rounded-2xl p-4 flex flex-col items-center">
                              <p className="text-[9px] text-stone-400 font-serif mb-4 text-center">
                                从个体到自然分类界限。点击各节点可进行学术追溯。
                              </p>
                              
                              <div className="flex flex-col items-stretch space-y-1.5 w-full max-w-xs relative">
                                {/* Vertical line connector background */}
                                <div className="absolute top-4 bottom-4 left-[14px] w-0.5 bg-dashed border-l border-stone-200 pointer-events-none"></div>

                                {[
                                  { label: "个体", name: `${animal.name}`, desc: `${animal.zoo}记录档案`, id: "indiv", color: "bg-[#B83B26] text-white" },
                                  { label: "物种", name: `${speciesObj.biologicalProfile.chineseName}`, desc: `${speciesObj.biologicalProfile.latinName}`, id: "spec", color: "bg-[#2F5233] text-white" },
                                  { label: "属 Genus", name: `${speciesObj.biologicalProfile.genus.split(' ')[0]}`, desc: "亲缘豹属分类", id: "genus", color: "bg-white text-stone-800 border border-stone-200 hover:border-[#2F5233]" },
                                  { label: "科 Family", name: `${speciesObj.biologicalProfile.family.split(' ')[0]}`, desc: "特化猫科门类", id: "family", color: "bg-white text-stone-800 border border-stone-200 hover:border-[#2F5233]" },
                                  { label: "目 Order", name: `${speciesObj.biologicalProfile.order.split(' ')[0]}`, desc: "食肉猛兽门类", id: "order", color: "bg-white text-stone-800 border border-stone-200 hover:border-[#2F5233]" },
                                  { label: "纲 Class", name: `${speciesObj.biologicalProfile.className.split(' ')[0]}`, desc: "恒温胎生哺乳", id: "class", color: "bg-white text-stone-800 border border-stone-200 hover:border-[#2F5233]" },
                                  { label: "门 Phylum", name: `${speciesObj.biologicalProfile.phylum.split(' ')[0]}`, desc: "背侧脊索大类", id: "phylum", color: "bg-white text-stone-800 border border-stone-200 hover:border-[#2F5233]" },
                                  { label: "界 Kingdom", name: `${speciesObj.biologicalProfile.kingdom.split(' ')[0]}`, desc: "多细胞真核生物", id: "kingdom", color: "bg-white text-stone-800 border border-stone-200 hover:border-[#2F5233]" }
                                ].map((node, i) => (
                                  <div 
                                    key={node.id} 
                                    onClick={() => triggerToast(`【${node.label}】${node.name} - 点击进入该节点的系统发育学知识树页面（研发中）。`)}
                                    className={`flex items-center space-x-3 p-1.5 rounded-xl transition-all cursor-pointer select-none group relative ${
                                      i > 1 ? "hover:bg-white hover:shadow-sm" : ""
                                    }`}
                                  >
                                    {/* Circle counter */}
                                    <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-[9px] font-bold font-mono shadow-sm transition-all z-10 ${node.color} ${
                                      i > 1 ? "group-hover:bg-[#2F5233] group-hover:text-white" : ""
                                    }`}>
                                      {i === 0 ? "★" : i === 1 ? "v" : i}
                                    </div>
                                    
                                    {/* Node description text */}
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-baseline space-x-1.5">
                                        <span className="text-[10px] font-bold text-stone-800 group-hover:text-[#2F5233] transition-colors">{node.name}</span>
                                        <span className="text-[7.5px] text-stone-400 font-mono tracking-wider uppercase">({node.label})</span>
                                      </div>
                                      <div className="text-[8.5px] text-stone-400 font-serif truncate mt-0.5">{node.desc}</div>
                                    </div>
                                    
                                    <span className="text-[8px] text-stone-300 group-hover:text-[#2F5233] pr-1 font-mono">›</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Part 5: Wild vs Zoo / 野外 vs 动物园 */}
                          {speciesObj.wildVsZoo && speciesObj.wildVsZoo.length > 0 && (
                            <div className="space-y-3 pt-2 border-t border-stone-100">
                              <span className="text-[11px] font-bold text-stone-800 tracking-wider flex items-center space-x-1">
                                <span>🦁</span>
                                <span>野外 vs 动物园 (Wild vs Zoo)</span>
                              </span>
                              
                              <div className="space-y-3">
                                {speciesObj.wildVsZoo.map((item, index) => (
                                  <div key={index} className="bg-[#FAF8F5]/60 border border-stone-200/40 rounded-xl p-3.5 space-y-2">
                                    <div className="text-[10.5px] font-bold text-stone-800 flex items-center space-x-1.5 border-b border-[#D9C3B0]/30 pb-1.5">
                                      <span className="w-1.5 h-1.5 bg-[#2F5233] rounded-full"></span>
                                      <span>{item.title}</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 text-[10px]">
                                      <div className="space-y-1 bg-white p-2 rounded-lg border border-stone-100">
                                        <div className="font-bold text-stone-400 flex items-center space-x-1">
                                          <span>🌲</span>
                                          <span>野外 (Wild)</span>
                                        </div>
                                        <p className="text-stone-600 font-serif leading-relaxed">{item.wild}</p>
                                      </div>
                                      <div className="space-y-1 bg-white p-2 rounded-lg border border-stone-100">
                                        <div className="font-bold text-[#2F5233] flex items-center space-x-1">
                                          <span>🏡</span>
                                          <span>动物园 (Zoo)</span>
                                        </div>
                                        <p className="text-stone-600 font-serif leading-relaxed">{item.zoo}</p>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                        </div>
                      );
                    })()}
                  </div>
                </div>
              );
            })()
          )}

            {/* ==================== 4. NESTED VIEW: RECOMMEND ANIMAL MULTI-STEP FORM (推荐建档表单) ==================== */}
          {viewState.type === "recommend_animal" && (
            <div className="px-5 py-4 space-y-5">
              {/* If submitted, show success page */}
              {recommendForm.isSubmitted ? (
                <div className="py-6 text-center space-y-5">
                  <div className="flex justify-center">
                    <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center border border-green-200 shadow-sm">
                      <CheckCircle2 className="w-10 h-10" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-base font-serif font-bold text-stone-900 px-2">
                      已收到，它会先进入候选档案，等待更多资料。
                    </h2>
                    <p className="text-[11px] text-stone-500 leading-relaxed px-4">
                      感谢您对守护城市野生及圈养动物所做的贡献！该个体已成功载入我们的「候选库」。我们正在通过各大公开报道、园方历史发布以及资深观察员的影像记录进行比对审核。在有新进展时，我们会第一时间更新在您的投稿记录中。
                    </p>
                  </div>

                  {/* Summary of submitted data */}
                  <div className="bg-white border border-stone-200 rounded-2xl p-4 text-left space-y-3 shadow-sm mx-2">
                    <h3 className="text-xs font-bold text-[#2F5233] border-b border-stone-100 pb-1.5 flex items-center space-x-1">
                      <span>📄 候选个体基本信息</span>
                    </h3>
                    <div className="grid grid-cols-2 gap-2 text-[10px] text-stone-600">
                      <div>
                        <span className="font-bold text-stone-400 block uppercase">拟用名称 / 昵称</span>
                        <span className="text-stone-800 font-medium">
                          {recommendForm.dontKnowName ? "待核实" : (recommendForm.name || "未定")}
                          {recommendForm.nickname && !recommendForm.dontKnowName ? ` (${recommendForm.nickname})` : ""}
                        </span>
                      </div>
                      <div>
                        <span className="font-bold text-stone-400 block uppercase">推荐物种</span>
                        <span className="text-stone-800 font-medium">
                          {recommendForm.dontKnowName ? "未知/待确定" : (recommendForm.species || "熊类")}
                        </span>
                      </div>
                      <div className="mt-1">
                        <span className="font-bold text-stone-400 block uppercase">见到地点</span>
                        <span className="text-stone-800 font-medium leading-tight block">
                          {recommendForm.uncertainLocation ? "不确定地点" : `${recommendForm.city} · ${recommendForm.zoo} (${recommendForm.area})`}
                        </span>
                      </div>
                      <div className="mt-1">
                        <span className="font-bold text-stone-400 block uppercase">推荐缘由</span>
                        <span className="text-stone-800 font-medium leading-tight block">
                          {recommendForm.reasons.length > 0 ? recommendForm.reasons.join("、") : "未选"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 px-2">
                    <button
                      onClick={handleCloseRecommend}
                      className="w-full bg-[#2F5233] hover:bg-[#203a24] text-white text-xs font-semibold py-3 rounded-xl transition-all shadow-sm"
                    >
                      返回动物时间线首页
                    </button>
                    <button
                      onClick={() => {
                        setRecommendForm({
                          province: "广东省",
                          city: "广州市",
                          zoo: "广州动物园",
                          area: "熊区",
                          specificPoint: "",
                          uncertainLocation: false,
                          photo: null,
                          name: "",
                          nickname: "",
                          dontKnowName: false,
                          species: "",
                          gender: "未知",
                          reasons: [],
                          otherReason: "",
                          story: "",
                          morePhotos: [],
                          sourceLink: "",
                          citation: "",
                          copyright: "self",
                          authorized: false,
                          isSubmitted: false
                        });
                        setViewState({ type: "recommend_animal", step: 1 });
                        triggerToast("已为您重置表单，可以继续推荐新个体！");
                      }}
                      className="w-full bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold py-2.5 rounded-xl transition-all"
                    >
                      继续推荐其他个体
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Back header */}
                  <div className="flex items-center space-x-3 pb-2 border-b border-stone-100">
                    <button
                      onClick={() => {
                        if (viewState.step > 1) {
                          setViewState({ type: "recommend_animal", step: viewState.step - 1 });
                        } else {
                          setViewState({ type: "main", tab: "record" });
                        }
                      }}
                      className="p-1.5 bg-stone-100 rounded-full text-stone-600 hover:bg-stone-200"
                      title={viewState.step > 1 ? "上一步" : "返回"}
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div>
                      <h2 className="text-sm font-serif font-bold text-stone-950">推荐新动物建档</h2>
                      <p className="text-[10px] text-stone-400">步骤 {viewState.step} / 4</p>
                    </div>
                  </div>

                  {/* Progress Indicator line */}
                  <div className="flex flex-col space-y-1.5">
                    <div className="flex justify-between items-center text-[10px] font-bold text-stone-500">
                      <span>建档指引进度</span>
                      <span className="font-mono bg-[#2F5233]/10 text-[#2F5233] px-2 py-0.5 rounded-full text-[9px]">
                        {viewState.step}/4 步
                      </span>
                    </div>
                    <div className="flex space-x-1.5">
                      {[1, 2, 3, 4].map(s => (
                        <div
                          key={s}
                          onClick={() => {
                            // Validate previous steps before jumping forward
                            if (s > viewState.step) {
                              if (viewState.step === 1) {
                                if (!recommendForm.uncertainLocation) {
                                  if (!recommendForm.city.trim() || !recommendForm.zoo.trim() || !recommendForm.area.trim()) {
                                    triggerToast("请先完成当前步骤必填项，或选择「我不确定具体地点」");
                                    return;
                                  }
                                }
                              } else if (viewState.step === 2) {
                                if (!recommendForm.dontKnowName && !recommendForm.species.trim()) {
                                  triggerToast("请先填写物种名称，或选择「不知道」");
                                  return;
                                }
                              } else if (viewState.step === 3) {
                                if (!recommendForm.story.trim() || recommendForm.story.trim().length < 5) {
                                  triggerToast("请先填写至少5个字的推荐见闻/故事");
                                  return;
                                }
                              }
                            }
                            setViewState({ type: "recommend_animal", step: s });
                          }}
                          className={`h-1.5 flex-1 rounded-full cursor-pointer transition-all duration-300 ${
                            viewState.step >= s ? "bg-[#2F5233]" : "bg-stone-200 hover:bg-stone-300"
                          }`}
                          title={`前往步骤 ${s}`}
                        ></div>
                      ))}
                    </div>
                  </div>

                  {/* Step 1: Where did you meet it */}
                  {viewState.step === 1 && (
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <h3 className="text-xs font-serif font-bold text-stone-900 flex items-center space-x-1">
                          <MapPin className="w-3.5 h-3.5 text-[#2F5233]" />
                          <span>第一步：在哪里见到它</span>
                        </h3>
                        <p className="text-[10px] text-stone-500">输入地理定位，能帮助我们更精确地把观察数据归并在同一个动物园、同一展区中。</p>
                      </div>

                      <div className="space-y-3.5 bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
                        {/* Uncertain Location Option */}
                        <div className="pb-3 border-b border-stone-100">
                          <label className="flex items-center space-x-2.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={recommendForm.uncertainLocation}
                              onChange={(e) => {
                                setRecommendForm({
                                  ...recommendForm,
                                  uncertainLocation: e.target.checked
                                });
                                if (e.target.checked) {
                                  triggerToast("已选择「不确定地点」，可以跳过地点必填约束 🗺️");
                                }
                              }}
                              className="rounded text-[#2F5233] focus:ring-[#2F5233] w-4 h-4"
                            />
                            <div className="space-y-0.5">
                              <span className="text-[11px] font-bold text-stone-850">我不确定具体地点 / 忘记在哪个园区了</span>
                              <p className="text-[9px] text-stone-400">勾选后将不强制填写下方地点字段，由审核志愿者核实</p>
                            </div>
                          </label>
                        </div>

                        {/* City */}
                        <div>
                          <label className="block text-[11px] font-bold text-stone-600 mb-1">
                            城市 <span className="text-red-500">{recommendForm.uncertainLocation ? "" : "*"}</span>
                          </label>
                          <input
                            type="text"
                            placeholder="如：广州市、深圳市、上海市"
                            disabled={recommendForm.uncertainLocation}
                            value={recommendForm.uncertainLocation ? "不确定" : recommendForm.city}
                            onChange={(e) => setRecommendForm({ ...recommendForm, city: e.target.value })}
                            className={`w-full bg-stone-50 border rounded-xl px-3 py-2 text-xs focus:outline-none transition-all ${
                              recommendForm.uncertainLocation 
                                ? "text-stone-400 border-stone-200 bg-stone-100 cursor-not-allowed" 
                                : "text-stone-800 border-stone-200 focus:border-[#2F5233] focus:ring-1 focus:ring-[#2F5233]"
                            }`}
                          />
                        </div>

                        {/* Zoo or Institution */}
                        <div>
                          <label className="block text-[11px] font-bold text-stone-600 mb-1">
                            动物园或机构名称 <span className="text-red-500">{recommendForm.uncertainLocation ? "" : "*"}</span>
                          </label>
                          <input
                            type="text"
                            placeholder="如：广州动物园、深圳野生动物园、越秀公园"
                            disabled={recommendForm.uncertainLocation}
                            value={recommendForm.uncertainLocation ? "地点不详" : recommendForm.zoo}
                            onChange={(e) => setRecommendForm({ ...recommendForm, zoo: e.target.value })}
                            className={`w-full bg-stone-50 border rounded-xl px-3 py-2 text-xs focus:outline-none transition-all ${
                              recommendForm.uncertainLocation 
                                ? "text-stone-400 border-stone-200 bg-stone-100 cursor-not-allowed" 
                                : "text-stone-800 border-stone-200 focus:border-[#2F5233] focus:ring-1 focus:ring-[#2F5233]"
                            }`}
                          />
                        </div>

                        {/* Area */}
                        <div>
                          <label className="block text-[11px] font-bold text-stone-600 mb-1">
                            具体生活展区 / 馆舍名 <span className="text-red-500">{recommendForm.uncertainLocation ? "" : "*"}</span>
                          </label>
                          <input
                            type="text"
                            placeholder="如：熊区、狮虎山、大熊猫馆、东门水禽湖"
                            disabled={recommendForm.uncertainLocation}
                            value={recommendForm.uncertainLocation ? "不详" : recommendForm.area}
                            onChange={(e) => setRecommendForm({ ...recommendForm, area: e.target.value })}
                            className={`w-full bg-stone-50 border rounded-xl px-3 py-2 text-xs focus:outline-none transition-all ${
                              recommendForm.uncertainLocation 
                                ? "text-stone-400 border-stone-200 bg-stone-100 cursor-not-allowed" 
                                : "text-stone-800 border-stone-200 focus:border-[#2F5233] focus:ring-1 focus:ring-[#2F5233]"
                            }`}
                          />
                        </div>
                      </div>

                      {/* Nav Buttons */}
                      <div className="flex space-x-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setViewState({ type: "main", tab: "record" })}
                          className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold py-3 rounded-xl transition-all text-center"
                        >
                          取消
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (!recommendForm.uncertainLocation) {
                              if (!recommendForm.city.trim() || recommendForm.city === "不确定") {
                                triggerToast("请填写见到该动物的城市！");
                                return;
                              }
                              if (!recommendForm.zoo.trim() || recommendForm.zoo === "地点不详") {
                                triggerToast("请填写动物园或机构名称！");
                                return;
                              }
                              if (!recommendForm.area.trim() || recommendForm.area === "不详") {
                                triggerToast("请填写具体展区馆舍（如：熊区、大熊猫馆）！");
                                return;
                              }
                            }
                            setViewState({ type: "recommend_animal", step: 2 });
                          }}
                          className="flex-1 bg-[#2F5233] hover:bg-[#203a24] text-white text-xs font-semibold py-3 rounded-xl transition-all shadow-sm"
                        >
                          下一步
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Do you know who it is */}
                  {viewState.step === 2 && (
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <h3 className="text-xs font-serif font-bold text-stone-900 flex items-center space-x-1">
                          <HelpCircle className="w-3.5 h-3.5 text-[#2F5233]" />
                          <span>第二步：你知道它是谁吗</span>
                        </h3>
                        <p className="text-[10px] text-stone-500">如果知道它的名字、物种等信息请尽量提供，如完全不了解，也可以一键标记为不知道。</p>
                      </div>

                      <div className="space-y-3.5 bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
                        {/* Allow "Don't know" checkbox */}
                        <div className="pb-3 border-b border-stone-100">
                          <label className="flex items-center space-x-2.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={recommendForm.dontKnowName}
                              onChange={(e) => {
                                setRecommendForm({
                                  ...recommendForm,
                                  dontKnowName: e.target.checked
                                });
                                if (e.target.checked) {
                                  triggerToast("已开启「不知道」模式，将不强制要求物种与名字 🌾");
                                }
                              }}
                              className="rounded text-[#2F5233] focus:ring-[#2F5233] w-4 h-4"
                            />
                            <div className="space-y-0.5">
                              <span className="text-[11px] font-bold text-stone-850">我不知道它是哪种动物，也没有任何名字线索</span>
                              <p className="text-[9px] text-stone-400">勾选后下方信息非必填，我们将交由专家和社区观察员帮您核实鉴定</p>
                            </div>
                          </label>
                        </div>

                        {/* Name */}
                        <div>
                          <label className="block text-[11px] font-bold text-stone-600 mb-1">它的名字 / 称呼</label>
                          <input
                            type="text"
                            placeholder="如：迪迪、老大、大耳朵 (若无固定称呼可不填)"
                            disabled={recommendForm.dontKnowName}
                            value={recommendForm.dontKnowName ? "待核实名称" : recommendForm.name}
                            onChange={(e) => setRecommendForm({ ...recommendForm, name: e.target.value })}
                            className={`w-full bg-stone-50 border rounded-xl px-3 py-2 text-xs focus:outline-none transition-all ${
                              recommendForm.dontKnowName 
                                ? "text-stone-400 border-stone-200 bg-stone-100 cursor-not-allowed" 
                                : "text-stone-800 border-stone-200 focus:border-[#2F5233]"
                            }`}
                          />
                        </div>

                        {/* Nickname */}
                        <div>
                          <label className="block text-[11px] font-bold text-stone-600 mb-1">它的昵称 / 别名</label>
                          <input
                            type="text"
                            placeholder="如：齐刘海熊、偏分帅哥、广州一哥"
                            disabled={recommendForm.dontKnowName}
                            value={recommendForm.dontKnowName ? "待核实昵称" : recommendForm.nickname}
                            onChange={(e) => setRecommendForm({ ...recommendForm, nickname: e.target.value })}
                            className={`w-full bg-stone-50 border rounded-xl px-3 py-2 text-xs focus:outline-none transition-all ${
                              recommendForm.dontKnowName 
                                ? "text-stone-400 border-stone-200 bg-stone-100 cursor-not-allowed" 
                                : "text-stone-800 border-stone-200 focus:border-[#2F5233]"
                            }`}
                          />
                        </div>

                        {/* Species */}
                        <div>
                          <label className="block text-[11px] font-bold text-stone-600 mb-1">
                            物种名称 <span className="text-red-500">{recommendForm.dontKnowName ? "" : "*"}</span>
                          </label>
                          <input
                            type="text"
                            placeholder="如：亚洲黑熊、金丝猴、华南虎、非洲狮"
                            disabled={recommendForm.dontKnowName}
                            value={recommendForm.dontKnowName ? "未知物种，待鉴定" : recommendForm.species}
                            onChange={(e) => setRecommendForm({ ...recommendForm, species: e.target.value })}
                            className={`w-full bg-stone-50 border rounded-xl px-3 py-2 text-xs focus:outline-none transition-all ${
                              recommendForm.dontKnowName 
                                ? "text-stone-400 border-stone-200 bg-stone-100 cursor-not-allowed" 
                                : "text-stone-800 border-stone-200 focus:border-[#2F5233] focus:ring-1 focus:ring-[#2F5233]"
                            }`}
                          />
                        </div>

                        {/* Gender */}
                        <div>
                          <label className="block text-[11px] font-bold text-stone-600 mb-1.5">性别</label>
                          <div className="flex space-x-4">
                            {["雄性", "雌性", "未知"].map(sex => (
                              <label key={sex} className="flex items-center space-x-1.5 text-xs text-stone-750 cursor-pointer">
                                <input
                                  type="radio"
                                  name="gender"
                                  value={sex}
                                  disabled={recommendForm.dontKnowName}
                                  checked={recommendForm.dontKnowName ? sex === "未知" : recommendForm.gender === sex}
                                  onChange={() => setRecommendForm({ ...recommendForm, gender: sex as any })}
                                  className="text-[#2F5233] focus:ring-[#2F5233] w-3.5 h-3.5"
                                />
                                <span>{sex}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* Simulated Suggestion Box */}
                        <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-2xl space-y-2">
                          <div className="flex items-start space-x-2">
                            <AlertCircle className="w-4.5 h-4.5 text-amber-600 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                              <h4 className="text-[11px] font-bold text-stone-900">
                                这可能是已有动物档案，是否查看？
                              </h4>
                              <p className="text-[10px] text-stone-500 leading-relaxed">
                                系统检索到您推荐的地区「{recommendForm.zoo || "广州动物园"}」可能已有符合您描述的动物。推荐建档前建议您先核实，避免数据重复。
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between bg-white/80 border border-amber-150 p-2.5 rounded-xl text-xs">
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 rounded-full overflow-hidden shrink-0">
                                <AnimalImage
                                  species="Red Panda"
                                  image={didiMain}
                                  className="w-full h-full object-cover border border-amber-200"
                                />
                              </div>
                              <div>
                                <span className="font-bold text-stone-900 text-[10px] block leading-tight">小熊猫“迪迪”</span>
                                <span className="text-[8px] text-stone-400 block leading-tight">广州动物园 · 小熊猫馆</span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setViewState({ type: "animal_detail", animalId: "paopao", activeSubTab: "all" });
                                triggerToast("正在为您载入现有小熊猫「迪迪」的档案，以便您核实 🐾");
                              }}
                              className="bg-[#2F5233] hover:bg-[#1b3320] text-white text-[9px] font-bold px-2.5 py-1 rounded-lg transition-colors shrink-0"
                            >
                              查看档案
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Nav Buttons */}
                      <div className="flex space-x-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setViewState({ type: "recommend_animal", step: 1 })}
                          className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold py-3 rounded-xl transition-all text-center"
                        >
                          上一步
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (!recommendForm.dontKnowName) {
                              if (!recommendForm.species.trim() || recommendForm.species.includes("未知")) {
                                triggerToast("请填写物种名称（如：大熊猫、金丝猴等）！");
                                return;
                              }
                            }
                            setViewState({ type: "recommend_animal", step: 3 });
                          }}
                          className="flex-1 bg-[#2F5233] hover:bg-[#203a24] text-white text-xs font-semibold py-3 rounded-xl transition-all shadow-sm"
                        >
                          下一步
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Why do you want people to know it */}
                  {viewState.step === 3 && (
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <h3 className="text-xs font-serif font-bold text-stone-900 flex items-center space-x-1">
                          <Heart className="w-3.5 h-3.5 text-amber-600" />
                          <span>第三步：为什么希望大家认识它</span>
                        </h3>
                        <p className="text-[10px] text-stone-500">选择希望为它建档的特殊缘由，并写下你们的故事或它的独特个性。</p>
                      </div>

                      <div className="space-y-4 bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
                        {/* Reason Checkboxes */}
                        <div>
                          <label className="block text-[11px] font-bold text-stone-600 mb-2">它有什么特别之处？(可多选)</label>
                          <div className="grid grid-cols-1 gap-2 text-xs">
                            {[
                              { label: "外貌特别", desc: "外观极其独特 (如偏分发型、不对称斑纹等)" },
                              { label: "行为特别", desc: "有特殊行为习惯或标志性绝活" },
                              { label: "有特别经历", desc: "有家喻户晓的繁育故事或救助经历" },
                              { label: "陪伴城市很多年", desc: "见证了几代游客的成长，拥有深厚街坊情结" },
                              { label: "正在退休或养老", desc: "高龄退休动物，属于需要安静重点呵护对象" },
                              { label: "很少有人关注", desc: "在偏僻展区，平日缺乏游客来访与关注" },
                              { label: "其他", desc: "具有独特的建档研究科普价值" }
                            ].map(item => (
                              <label key={item.label} className="flex items-start space-x-2.5 p-2 bg-stone-50 hover:bg-stone-100/50 border border-stone-150 rounded-xl cursor-pointer transition-colors">
                                <input
                                  type="checkbox"
                                  checked={recommendForm.reasons.includes(item.label)}
                                  onChange={(e) => {
                                    const current = [...recommendForm.reasons];
                                    if (e.target.checked) {
                                      current.push(item.label);
                                    } else {
                                      const idx = current.indexOf(item.label);
                                      if (idx > -1) current.splice(idx, 1);
                                    }
                                    setRecommendForm({ ...recommendForm, reasons: current });
                                  }}
                                  className="rounded text-[#2F5233] focus:ring-[#2F5233] mt-0.5 w-3.5 h-3.5"
                                />
                                <div className="space-y-0.5">
                                  <span className="text-[10px] font-bold text-stone-800 leading-none">{item.label}</span>
                                  <span className="text-[8px] text-stone-400 block leading-tight">{item.desc}</span>
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* Story Text Area */}
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="block text-[11px] font-bold text-stone-600">写写你和它的故事 / 习性见闻 (必填)</label>
                            <span className={`text-[9px] font-mono ${recommendForm.story.length > 500 ? "text-red-500 font-bold" : "text-stone-400"}`}>
                              {recommendForm.story.length} / 500 字
                            </span>
                          </div>
                          <textarea
                            rows={5}
                            maxLength={550}
                            placeholder="如：它下午三点喜欢在木架上打哈欠；左耳朵有一个小小的豁口，是和其他熊抢苹果留下的；它陪伴了我们很久，希望大家去熊区的时候能认出它，不要对它大喊大叫..."
                            value={recommendForm.story}
                            onChange={(e) => {
                              const val = e.target.value;
                              setRecommendForm({ ...recommendForm, story: val });
                            }}
                            className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#2F5233] focus:ring-1 focus:ring-[#2F5233] leading-relaxed"
                          ></textarea>
                          {recommendForm.story.length > 500 && (
                            <p className="text-[9px] text-red-500 mt-0.5">文字描述不能超过500字哦，请适当删减。</p>
                          )}
                        </div>
                      </div>

                      {/* Nav Buttons */}
                      <div className="flex space-x-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setViewState({ type: "recommend_animal", step: 2 })}
                          className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold py-3 rounded-xl transition-all text-center"
                        >
                          上一步
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (recommendForm.reasons.length === 0) {
                              triggerToast("请至少勾选一项推荐它的特别之处哦！");
                              return;
                            }
                            if (!recommendForm.story.trim() || recommendForm.story.trim().length < 5) {
                              triggerToast("为了便于后台建档初审，请至少填写5个字的故事描述！");
                              return;
                            }
                            if (recommendForm.story.length > 500) {
                              triggerToast("故事字数超过了500字上限，请做精简！");
                              return;
                            }
                            setViewState({ type: "recommend_animal", step: 4 });
                          }}
                          className="flex-1 bg-[#2F5233] hover:bg-[#203a24] text-white text-xs font-semibold py-3 rounded-xl transition-all shadow-sm"
                        >
                          下一步
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 4: Upload Photo and Materials */}
                  {viewState.step === 4 && (
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <h3 className="text-xs font-serif font-bold text-stone-900 flex items-center space-x-1">
                          <Camera className="w-3.5 h-3.5 text-[#2F5233]" />
                          <span>第四步：上传照片与资料</span>
                        </h3>
                        <p className="text-[10px] text-stone-500">上传第一张建立该档案的基础实拍佐证照，并附带公开新闻、版权等保障声明。</p>
                      </div>

                      <div className="space-y-4 bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
                        {/* Photo Box with preview */}
                        <div>
                          <label className="block text-[11px] font-bold text-stone-600 mb-1.5">动物实拍图 (必选 · 支持点击模拟上传)</label>
                          <div
                            onClick={() => {
                              // Offer animal photo mock
                              const mockPhotos = [
                                "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><rect width='100' height='100' fill='%23FAF8F5'/><circle cx='50' cy='50' r='30' fill='%23D9C3B0'/><text x='50' y='55' font-size='20' text-anchor='middle'>📸</text></svg>",
                                "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><rect width='100' height='100' fill='%23F4F1EA'/><circle cx='50' cy='50' r='30' fill='%23C5BAA9'/><text x='50' y='55' font-size='20' text-anchor='middle'>🦁</text></svg>",
                                "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><rect width='100' height='100' fill='%23FAF8F5'/><circle cx='50' cy='50' r='30' fill='%23B2A898'/><text x='50' y='55' font-size='20' text-anchor='middle'>🐘</text></svg>"
                              ];
                              // Cycle through or pick one randomly
                              const selected = mockPhotos[Math.floor(Math.random() * mockPhotos.length)];
                              setRecommendForm({
                                ...recommendForm,
                                photo: selected
                              });
                              triggerToast("模拟导入照片成功！📸");
                            }}
                            className="h-32 border-2 border-dashed border-stone-300 hover:border-[#2F5233] rounded-xl flex flex-col items-center justify-center bg-stone-50 cursor-pointer overflow-hidden relative transition-all"
                          >
                            {recommendForm.photo ? (
                              <>
                                <img src={recommendForm.photo} alt="Preview" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-stone-900/40 flex flex-col items-center justify-center text-white p-2">
                                  <span className="text-[11px] font-bold bg-white/20 px-3 py-1.5 rounded-full  border border-white/10">
                                    📷 已成功载入现场照片 (点击重新选择)
                                  </span>
                                </div>
                              </>
                            ) : (
                              <>
                                <Camera className="w-8 h-8 text-stone-400 mb-1" />
                                <span className="text-[10px] text-stone-600 font-bold">拍摄或选择该动物的实拍图</span>
                                <span className="text-[8px] text-stone-400 mt-0.5">支持拖拽、相册选择或点击一键模拟载入</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Public Link */}
                        <div>
                          <label className="block text-[11px] font-bold text-stone-600 mb-1">
                            新闻报道或园方公开资料链接 (选填)
                          </label>
                          <input
                            type="url"
                            placeholder="如：微信公众号推文链接、官方微博报导、新闻网址"
                            value={recommendForm.sourceLink}
                            onChange={(e) => setRecommendForm({ ...recommendForm, sourceLink: e.target.value })}
                            className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#2F5233] focus:ring-1 focus:ring-[#2F5233]"
                          />
                          <span className="text-[8px] text-stone-400 mt-0.5 block leading-tight">
                            提供官方新闻报道有助于大区管理员加速资料实证并核发绿标 ✅
                          </span>
                        </div>

                        {/* Copyright radios */}
                        <div>
                          <label className="block text-[11px] font-bold text-stone-600 mb-1.5">照片版权与公开说明 (必选)</label>
                          <div className="space-y-2">
                            {[
                              { id: "self", title: "本人现场原创拍摄", desc: "该照片为我亲自去动物园拍摄，拥有完整独立版权，同意科普公开。" },
                              { id: "authorized", title: "已获得原作者授权同意", desc: "该照片由他人拍摄，我已通过口头、网络征得拍摄人授权同意公开。" },
                              { id: "cue_only", title: "仅提供审核线索，不同意公开展示", desc: "该图仅供平台后台特征比对核对使用，请不要在前端页面展示照片。" }
                            ].map((item) => (
                              <label key={item.id} className="flex items-start space-x-2.5 bg-stone-50 border border-stone-200 rounded-xl p-2.5 hover:bg-stone-100/50 cursor-pointer transition-colors">
                                <input
                                  type="radio"
                                  name="copyright"
                                  value={item.id}
                                  checked={recommendForm.copyright === item.id}
                                  onChange={() => setRecommendForm({ ...recommendForm, copyright: item.id as any })}
                                  className="text-[#2F5233] focus:ring-[#2F5233] mt-0.5"
                                />
                                <div className="space-y-0.5">
                                  <span className="text-[10px] font-bold text-stone-850 block leading-none">{item.title}</span>
                                  <span className="text-[8px] text-stone-400 block leading-tight">{item.desc}</span>
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* Open Auth Checklist */}
                        <div className="pt-2.5 border-t border-stone-100">
                          <label className="flex items-start space-x-2.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={recommendForm.authorized}
                              onChange={(e) => setRecommendForm({ ...recommendForm, authorized: e.target.checked })}
                              className="rounded text-[#2F5233] focus:ring-[#2F5233] mt-0.5 w-4 h-4"
                            />
                            <div className="space-y-0.5">
                              <span className="text-[10px] font-bold text-stone-800 leading-normal">
                                同意在园老友科普建档协议 (必填)
                              </span>
                              <p className="text-[9px] text-stone-400 leading-relaxed">
                                我承诺以上推荐资料、目击记录符合客观事实，授权「阿杭计划」使用本人提交的无版权争议内容用于非营利动物保护与科普展陈，并在展示时注明我是线索发起人。
                              </p>
                            </div>
                          </label>
                        </div>
                      </div>

                      {/* ==================== COMPLETE SUMMARY CHECKLIST (提交前显示完整摘要) ==================== */}
                      <div className="bg-stone-100 border border-stone-200 rounded-2xl p-4 space-y-3 shadow-inner">
                        <div className="flex items-center space-x-1.5 border-b border-stone-200 pb-1.5">
                          <CheckCircle2 className="w-4 h-4 text-[#2F5233]" />
                          <h4 className="text-xs font-serif font-bold text-stone-900">请核对建档完整摘要 (提交前预览)</h4>
                        </div>
                        
                        <div className="space-y-2.5 text-[10px] text-stone-700 leading-normal">
                          <div className="grid grid-cols-2 gap-3 bg-white p-2.5 rounded-xl border border-stone-150">
                            <div>
                              <span className="font-bold text-stone-400 block uppercase">1. 地点位置</span>
                              <span className="text-stone-800">
                                {recommendForm.uncertainLocation ? "地点不确定 (待核实)" : `${recommendForm.city} · ${recommendForm.zoo} (${recommendForm.area})`}
                              </span>
                            </div>
                            <div>
                              <span className="font-bold text-stone-400 block uppercase">2. 拟定名称</span>
                              <span className="text-stone-800">
                                {recommendForm.dontKnowName ? "待核实" : `${recommendForm.name || "未命名"} (${recommendForm.nickname || "无昵称"})`}
                              </span>
                            </div>
                            <div className="mt-1">
                              <span className="font-bold text-stone-400 block uppercase">3. 物种及性别</span>
                              <span className="text-stone-800">
                                {recommendForm.dontKnowName ? "待鉴定" : `${recommendForm.species} · ${recommendForm.gender}`}
                              </span>
                            </div>
                            <div className="mt-1">
                              <span className="font-bold text-stone-400 block uppercase">4. 建档标签</span>
                              <span className="text-stone-800 leading-tight block">
                                {recommendForm.reasons.length > 0 ? recommendForm.reasons.join("、") : "未勾选"}
                              </span>
                            </div>
                          </div>

                          <div className="bg-white p-2.5 rounded-xl border border-stone-150 space-y-1">
                            <span className="font-bold text-stone-400 block uppercase">5. 故事/见闻详细描述 ({recommendForm.story.length}字)</span>
                            <p className="text-stone-800 line-clamp-3 italic text-[9.5px]">
                              “{recommendForm.story || "暂未填写故事描述..."}”
                            </p>
                          </div>

                          <div className="grid grid-cols-2 gap-3 bg-white p-2.5 rounded-xl border border-stone-150">
                            <div>
                              <span className="font-bold text-stone-400 block uppercase">6. 佐证照片</span>
                              <span className="text-stone-800 flex items-center space-x-1">
                                {recommendForm.photo ? (
                                  <>
                                    <span className="text-green-600 font-bold">● 已上传 (预览可用)</span>
                                  </>
                                ) : (
                                  <span className="text-red-500 font-bold">● 未上传</span>
                                )}
                              </span>
                            </div>
                            <div>
                              <span className="font-bold text-stone-400 block uppercase">7. 版权归属 & 协议</span>
                              <span className="text-stone-800">
                                {recommendForm.copyright === "self" ? "本人原创自拍" : recommendForm.copyright === "authorized" ? "已获作者授权" : "仅后台线索"}
                                {recommendForm.authorized ? " (协议已同意)" : " (未同意协议)"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Nav Buttons */}
                      <div className="flex space-x-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setViewState({ type: "recommend_animal", step: 3 })}
                          className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold py-3 rounded-xl transition-all text-center"
                        >
                          上一步
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (!recommendForm.photo) {
                              triggerToast("必填提示：请先上传该个体的佐证照片哦！📸");
                              return;
                            }
                            if (!recommendForm.authorized) {
                              triggerToast("必填提示：您必须同意非营利科普授权协议才能提交哦！");
                              return;
                            }
                            handleRecommendSubmit();
                          }}
                          className="flex-1 bg-[#B83B26] hover:bg-[#a13320] text-white text-xs font-semibold py-3 rounded-xl transition-all shadow-md text-center cursor-pointer"
                        >
                          确认无误，提交初审 🚀
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}


          {/* ==================== 5. NESTED VIEW: MY SUBMISSIONS (我的投稿) ==================== */}
          {viewState.type === "my_submissions" && (
            <div className="px-4 py-4 space-y-4 pb-20">
              <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setViewState({ type: "main", tab: "my" })}
                    className="p-1.5 bg-stone-100 rounded-full text-stone-600 hover:bg-stone-200 transition-colors"
                    title="返回"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <h2 className="text-base font-serif font-bold text-stone-900">我的投稿</h2>
                </div>
                <span className="text-[10px] bg-[#2F5233]/10 text-[#2F5233] px-2 py-0.5 rounded-full font-bold">
                  共 {myDetailedContributions.length} 笔投稿
                </span>
              </div>

              {/* Status categories horizontally scrollable bar */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block px-1">状态分类</span>
                <div className="flex space-x-1.5 overflow-x-auto pb-1.5 no-scrollbar">
                  {[
                    { id: "all", label: "全部" },
                    { id: "submitted", label: "已提交" },
                    { id: "pending", label: "等待人工审核" },
                    { id: "need_supplement", label: "需要补充" },
                    { id: "candidate", label: "已收入候选档案" },
                    { id: "official", label: "已成为正式记录" },
                    { id: "rejected", label: "未采用" }
                  ].map(cat => {
                    // Count how many matching items in this status
                    const count = cat.id === "all" 
                      ? myDetailedContributions.length 
                      : myDetailedContributions.filter(item => item.status === cat.id).length;

                    // Only select state
                    const isSelected = (viewState.statusFilter || "all") === cat.id;

                    return (
                      <button
                        key={cat.id}
                        onClick={() => setViewState({ ...viewState, statusFilter: cat.id })}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border flex-shrink-0 transition-all cursor-pointer flex items-center space-x-1 ${
                          isSelected
                            ? "bg-[#2F5233] text-white border-[#2F5233] shadow-sm scale-102"
                            : "bg-white text-stone-600 border-stone-200 hover:border-stone-300"
                        }`}
                      >
                        <span>{cat.label}</span>
                        <span className={`text-[8px] px-1 rounded-full ${isSelected ? "bg-white/20 text-white" : "bg-stone-100 text-stone-500"}`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Submissions List */}
              <div className="space-y-3">
                {(() => {
                  const filter = viewState.statusFilter || "all";
                  const filtered = filter === "all" 
                    ? myDetailedContributions 
                    : myDetailedContributions.filter(item => item.status === filter);

                  if (filtered.length === 0) {
                    return (
                      <div className="bg-white border border-stone-200 rounded-2xl py-12 text-center text-stone-400 space-y-2">
                        <span className="text-2xl">🌱</span>
                        <p className="text-[11px] font-medium">该分类下暂无您的投稿历史</p>
                      </div>
                    );
                  }

                  return filtered.map(item => (
                    <div
                      key={item.id}
                      onClick={() => {
                        setSelectedSub(item);
                        setShowSubDetailsModal(true);
                      }}
                      className="bg-white border border-stone-200 rounded-2xl p-4 space-y-3 shadow-sm hover:shadow-md cursor-pointer transition-all hover:border-[#2F5233]/20 active:scale-99"
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-[9px] text-stone-400 font-mono">单号: {item.id} · {item.submittedAt}</span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${
                            item.status === "official"
                              ? "bg-green-50 text-green-700 border-green-100"
                              : item.status === "candidate"
                              ? "bg-blue-50 text-blue-700 border-blue-100"
                              : item.status === "need_supplement"
                              ? "bg-red-50 text-red-700 border-red-100 animate-pulse"
                              : item.status === "pending"
                              ? "bg-amber-50 text-amber-700 border-amber-100"
                              : item.status === "submitted"
                              ? "bg-stone-100 text-stone-600 border-stone-200"
                              : "bg-stone-50 text-stone-400 border-stone-100"
                          }`}
                        >
                          {item.statusLabel}
                        </span>
                      </div>

                      <div className="flex space-x-3">
                        {item.photo && (
                          <div className="w-16 h-16 rounded-xl overflow-hidden bg-stone-100 flex-shrink-0 border border-stone-150">
                            <img src={item.photo} alt="contrib" className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="space-y-1 min-w-0 flex-1">
                          <h4 className="text-xs font-bold text-stone-900 truncate">{item.title}</h4>
                          <p className="text-[10px] text-stone-500 line-clamp-2 leading-relaxed">{item.details}</p>
                          <div className="flex items-center space-x-1.5 pt-1 text-[8.5px]">
                            <span className="text-stone-400 font-bold">对应动物:</span>
                            <span className="text-stone-700 font-medium">{item.animalName}</span>
                          </div>
                        </div>
                      </div>

                      {item.adminComment && (
                        <div className="bg-stone-50 rounded-xl p-2.5 border border-stone-100/80 text-[9px] text-stone-600 leading-relaxed">
                          <span className="font-bold text-[#2F5233] block mb-0.5">管理员反馈:</span>
                          {item.adminComment}
                        </div>
                      )}

                      <div className="flex justify-between items-center text-[8.5px] text-stone-400 pt-2 border-t border-stone-100/50">
                        <span>版权: {item.copyright}</span>
                        <span className="text-[#2F5233] font-bold flex items-center space-x-0.5">
                          <span>点击查看详情</span>
                          <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>
          )}


          {/* ==================== 5.5 NESTED VIEW: ADMIN PANEL (管理后台 Demo) ==================== */}
          {viewState.type === "admin_panel" && (
            <div className="px-4 py-4 space-y-4 pb-20">
              {/* Header block */}
              <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setViewState({ type: "main", tab: "my" })}
                    className="p-1.5 bg-stone-100 rounded-full text-stone-600 hover:bg-stone-200 transition-colors"
                    title="返回"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div>
                    <h2 className="text-sm font-serif font-bold text-stone-900 flex items-center space-x-1">
                      <Shield className="w-4 h-4 text-[#B83B26]" />
                      <span>阿杭计划 · 管理后台</span>
                    </h2>
                    <p className="text-[9px] text-stone-400">仅用于交互演示 · 免鉴权 Demo 模式</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 bg-red-100 text-[#B83B26] text-[8px] rounded-full font-bold">
                  审核演示端
                </span>
              </div>

              {/* Admin Horizontal Tabs Grid */}
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: "pending", label: "待审核投稿" },
                  { id: "candidates", label: "候选动物" },
                  { id: "copyright", label: "版权异常" },
                  { id: "reports", label: "纠错举报" },
                  { id: "volunteers", label: "志愿审核员" },
                  { id: "logs", label: "审核日志" }
                ].map(tab => {
                  let badge: string | number = "";
                  if (tab.id === "pending") badge = adminPendingContribs.length;
                  if (tab.id === "copyright") badge = adminCopyrightAnomalies.length;
                  if (tab.id === "reports") badge = adminCorrectionReports.length;

                  return (
                    <button
                      key={tab.id}
                      onClick={() => setAdminTab(tab.id as any)}
                      className={`py-2 px-1 rounded-xl text-[9px] font-bold border transition-all cursor-pointer ${
                        adminTab === tab.id
                          ? "bg-stone-800 text-white border-stone-800 shadow-sm"
                          : "bg-white text-stone-600 border-stone-200 hover:bg-stone-50"
                      }`}
                    >
                      <div className="flex items-center justify-center space-x-1">
                        <span>{tab.label}</span>
                        {typeof badge === "number" && badge > 0 && (
                          <span className="px-1 py-0.2 bg-red-500 text-white rounded-full text-[7.5px]">
                            {badge}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* TAB CONTENT: 1. 待审核投稿 */}
              {adminTab === "pending" && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider">待人工核准投稿列表</span>
                    <span className="text-[8.5px] text-stone-500">双名录AI预排重已完成</span>
                  </div>

                  {adminPendingContribs.length === 0 ? (
                    <div className="bg-white border border-stone-200 rounded-2xl p-8 text-center text-stone-400 space-y-1">
                      <p className="text-xl">🎉</p>
                      <p className="text-[10px] font-bold">审核队列已完全清空！</p>
                      <p className="text-[8px] text-stone-400">目前暂无待审核的公众线索</p>
                    </div>
                  ) : (
                    adminPendingContribs.map(item => (
                      <div key={item.id} className="bg-white border border-stone-200 rounded-2xl p-4 space-y-3.5 shadow-sm">
                        {/* Header metadata */}
                        <div className="flex justify-between items-center text-[9px]">
                          <span className="font-mono text-stone-400">单号: {item.id}</span>
                          <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full font-bold border border-amber-150">
                            {item.type}
                          </span>
                        </div>

                        {/* Photo Specimen if available */}
                        {item.photo && (
                          <div className="h-32 rounded-xl bg-stone-900 relative overflow-hidden border border-stone-200 shadow-inner flex-shrink-0">
                            <img src={item.photo} alt="admin-pending" className="w-full h-full object-cover" />
                            <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 rounded text-[8px] text-stone-300 font-mono">
                              对应动物：{item.animal}
                            </div>
                          </div>
                        )}

                        {/* Content description list */}
                        <div className="space-y-1.5 text-[9.5px] leading-relaxed">
                          <div>
                            <span className="font-bold text-stone-400">AI 摘要与判定: </span>
                            <span className="text-stone-700 bg-stone-50/80 px-1 py-0.5 rounded border border-stone-100">{item.aiSummary}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 pt-1">
                            <div>
                              <span className="font-bold text-stone-400 block uppercase">资料来源</span>
                              <span className="text-stone-700 truncate block">{item.source}</span>
                            </div>
                            <div>
                              <span className="font-bold text-stone-400 block uppercase">版权声明状态</span>
                              <span className="text-stone-700 truncate block">{item.copyrightStatus}</span>
                            </div>
                          </div>
                          <div className="pt-1.5 border-t border-stone-100">
                            <span className="font-bold text-stone-400 block uppercase">可能重复对象</span>
                            <span className="text-amber-700 font-semibold">{item.duplicates}</span>
                          </div>
                        </div>

                        {/* Administrative action buttons */}
                        <div className="pt-2 border-t border-stone-100 grid grid-cols-3 gap-1.5">
                          <button
                            onClick={() => handleAdminAction(item.id, "通过")}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-bold py-1.5 px-2 rounded-lg transition-colors cursor-pointer"
                          >
                            通过
                          </button>
                          <button
                            onClick={() => handleAdminAction(item.id, "待核实")}
                            className="bg-stone-500 hover:bg-stone-600 text-white text-[9px] font-bold py-1.5 px-2 rounded-lg transition-colors cursor-pointer"
                          >
                            待核实
                          </button>
                          <button
                            onClick={() => handleAdminAction(item.id, "要求补充")}
                            className="bg-[#5A6B7C] hover:bg-[#485664] text-white text-[9px] font-bold py-1.5 px-2 rounded-lg transition-colors cursor-pointer"
                          >
                            要求补充
                          </button>
                          <button
                            onClick={() => handleAdminAction(item.id, "合并")}
                            className="bg-amber-600 hover:bg-amber-700 text-white text-[9px] font-bold py-1.5 px-2 rounded-lg transition-colors cursor-pointer"
                          >
                            合并
                          </button>
                          <button
                            onClick={() => handleAdminAction(item.id, "退回")}
                            className="bg-[#B83B26] hover:bg-[#973121] text-white text-[9px] font-bold py-1.5 px-2 rounded-lg transition-colors cursor-pointer"
                          >
                            退回
                          </button>
                          <button
                            onClick={() => handleAdminAction(item.id, "隐藏")}
                            className="bg-stone-700 hover:bg-stone-800 text-white text-[9px] font-bold py-1.5 px-2 rounded-lg transition-colors cursor-pointer"
                          >
                            隐藏
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB CONTENT: 2. 候选动物 */}
              {adminTab === "candidates" && (
                <div className="space-y-3">
                  <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider block px-1">候选建档库 (差佐证自动生成卡片)</span>
                  <div className="space-y-2">
                    {adminCandidateAnimals.map(item => (
                      <div key={item.id} className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-xs font-bold text-stone-900">{item.name}</h4>
                            <p className="text-[9px] text-stone-400">{item.zoo}</p>
                          </div>
                          <span className="text-[9px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full font-bold border border-amber-100">
                            {item.progress}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {item.tags.map(tag => (
                            <span key={tag} className="text-[8px] bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                        <div className="pt-2 border-t border-stone-100 flex justify-end space-x-2">
                          <button
                            onClick={() => triggerToast(`已向观察员发送协作邀请，呼吁补充“${item.name}”的线索`)}
                            className="text-[9px] text-stone-600 font-bold bg-stone-100 hover:bg-stone-200 px-2.5 py-1 rounded-lg"
                          >
                            发布协作任务线索
                          </button>
                          <button
                            onClick={() => triggerToast(`已成功为“${item.name}”强制生成正式档案，进入编辑模式 📝`)}
                            className="text-[9px] text-white bg-[#2F5233] hover:bg-[#203a24] px-2.5 py-1 rounded-lg font-bold"
                          >
                            强制建档发布
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB CONTENT: 3. 版权异常 */}
              {adminTab === "copyright" && (
                <div className="space-y-3">
                  <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider block px-1">图片与内容版权风险预警</span>
                  <div className="space-y-2">
                    {adminCopyrightAnomalies.map(item => (
                      <div key={item.id} className="bg-white border border-rose-100 rounded-2xl p-4 shadow-sm space-y-2.5 border-l-3 border-l-red-500">
                        <div className="flex justify-between items-center">
                          <span className="text-[9.5px] font-bold text-stone-800">{item.target}</span>
                          <span className="text-[8px] bg-rose-50 text-red-600 px-1.5 py-0.5 rounded font-bold">
                            {item.status}
                          </span>
                        </div>
                        <p className="text-[9px] text-stone-600 leading-relaxed bg-rose-50/30 p-2 rounded-lg border border-rose-50">
                          {item.reason}
                        </p>
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => {
                              triggerToast("申诉已驳回，照片已下架。");
                              setAdminCopyrightAnomalies(prev => prev.filter(c => c.id !== item.id));
                            }}
                            className="text-[9px] text-white bg-red-600 hover:bg-red-700 px-2.5 py-1 rounded-lg font-bold"
                          >
                            下架并通知用户
                          </button>
                          <button
                            onClick={() => {
                              triggerToast("授权检查通过，标记为正常状态。");
                              setAdminCopyrightAnomalies(prev => prev.filter(c => c.id !== item.id));
                            }}
                            className="text-[9px] text-stone-600 bg-stone-100 hover:bg-stone-200 px-2.5 py-1 rounded-lg font-bold"
                          >
                            无版权风险，通过
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB CONTENT: 4. 纠错举报 */}
              {adminTab === "reports" && (
                <div className="space-y-3">
                  <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider block px-1">公众纠错与实证举报</span>
                  <div className="space-y-2">
                    {adminCorrectionReports.map(item => (
                      <div key={item.id} className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[8px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold">
                              {item.type}
                            </span>
                            <h4 className="text-xs font-bold text-stone-900 mt-1">对应页面：{item.page}</h4>
                          </div>
                          <span className="text-[8.5px] text-stone-400">反馈人：{item.reporter}</span>
                        </div>
                        <p className="text-[9px] text-stone-600 leading-normal bg-stone-50 p-2.5 rounded-xl border border-stone-150">
                          “ {item.content} ”
                        </p>
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => {
                              triggerToast("纠错已采纳，对应数据已修正。");
                              setAdminCorrectionReports(prev => prev.filter(c => c.id !== item.id));
                            }}
                            className="text-[9px] text-white bg-emerald-600 hover:bg-emerald-700 px-2.5 py-1 rounded-lg font-bold"
                          >
                            采纳并修改数据
                          </button>
                          <button
                            onClick={() => {
                              triggerToast("已忽略该条反馈。");
                              setAdminCorrectionReports(prev => prev.filter(c => c.id !== item.id));
                            }}
                            className="text-[9px] text-stone-400 hover:bg-stone-100 px-2.5 py-1 rounded-lg font-bold"
                          >
                            忽略
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB CONTENT: 5. 志愿审核员 / 档案守护人 */}
              {adminTab === "volunteers" && (
                <div className="space-y-4 animate-fade-in" id="admin-tab-volunteers-container">
                  {/* Top Header & Intro Card */}
                  <div className="bg-[#2F5233]/5 border border-[#2F5233]/20 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 bg-[#2F5233]/10 text-[#2F5233] rounded-lg">
                        <Users className="w-4 h-4" />
                      </div>
                      <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wide">
                        「档案守护人」协作者管理
                      </h3>
                    </div>
                    <p className="text-[10px] text-stone-500 leading-relaxed">
                      本处为白狮阿杭计划公众共建审核系统。所有获得资格的志愿者统一授予<b>「档案守护人」</b>专属徽章，根据其历史服务时长、专业鉴定方向与综合质量指标，精细化划定等级与在岗状态。
                    </p>
                  </div>

                  {/* Assessment Mechanism Panels (Bento Layout) */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {/* Panel 1: Admission Criteria */}
                    <div className="bg-white border border-stone-200 rounded-2xl p-3.5 space-y-2.5 shadow-sm">
                      <div className="flex items-center space-x-1.5 border-b border-stone-100 pb-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <h4 className="text-[11px] font-bold text-stone-900">新守护人 · 准入考核条件</h4>
                      </div>
                      <div className="space-y-1.5 text-[9.5px]">
                        {[
                          { label: "完成守护人基础业务培训", required: "100% 课时", status: "已完成" },
                          { label: "通过平台数据规则考试", required: ">= 85分", status: "已通过" },
                          { label: "在线签署志愿者服务协议", required: "实名签署", status: "已签署" },
                          { label: "完成系统前置模拟审核", required: ">= 20条", status: "已完成 (24/20)" },
                          { label: "模拟审核准确率判定", required: ">= 90%", status: "达 94.2%" }
                        ].map((cond, idx) => (
                          <div key={idx} className="flex justify-between items-center bg-stone-50 p-1.5 rounded-lg border border-stone-100/50">
                            <span className="text-stone-600 font-medium">{cond.label}</span>
                            <span className="text-[8.5px] bg-emerald-50 text-emerald-700 px-1.5 py-0.2 rounded font-bold border border-emerald-100">
                              {cond.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Panel 2: Quarterly Assessment */}
                    <div className="bg-white border border-stone-200 rounded-2xl p-3.5 space-y-2.5 shadow-sm">
                      <div className="flex items-center space-x-1.5 border-b border-stone-100 pb-1.5">
                        <Activity className="w-4 h-4 text-amber-600" />
                        <h4 className="text-[11px] font-bold text-stone-900">在岗守护人 · 季度常态考核</h4>
                      </div>
                      <div className="space-y-1.5 text-[9.5px]">
                        {[
                          { label: "每季度日常审核准确率", threshold: "不低于 90%", desc: "高精度抽审校核" },
                          { label: "公众争议/撤销比例", threshold: "不高于 5%", desc: "因误判被二审撤回率" },
                          { label: "合规底线守则", threshold: "0 严重事故", desc: "无敏感隐私/版权纠纷" },
                          { label: "进阶业务规则复训", threshold: "1 次/季度", desc: "结合最新政策线上复读" }
                        ].map((cond, idx) => (
                          <div key={idx} className="flex justify-between items-start bg-stone-50 p-1.5 rounded-lg border border-stone-100/50">
                            <div>
                              <p className="text-stone-700 font-bold">{cond.label}</p>
                              <p className="text-[8px] text-stone-400 mt-0.5">{cond.desc}</p>
                            </div>
                            <span className="text-[8.5px] bg-[#2F5233]/10 text-[#2F5233] px-1.5 py-0.2 rounded font-bold border border-[#2F5233]/20 flex-shrink-0">
                              {cond.threshold}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Guardians List */}
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center px-1">
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                        守护人成员档案 ({adminVolunteerReviewers.length}人)
                      </span>
                      <span className="text-[8.5px] text-stone-400 font-medium">点击卡片查看守护人详细履历、培训与升降级记录</span>
                    </div>

                    <div className="grid grid-cols-1 gap-2.5">
                      {adminVolunteerReviewers.map((item) => {
                        // Badge colors for level
                        let levelColor = "bg-stone-100 text-stone-600 border-stone-200";
                        if (item.level === "专家审核员") levelColor = "bg-purple-50 text-purple-700 border-purple-100";
                        if (item.level === "城市守护人") levelColor = "bg-blue-50 text-blue-700 border-blue-100";
                        if (item.level === "档案协作者") levelColor = "bg-amber-50 text-amber-700 border-amber-100";

                        // Badge colors for status
                        let statusColor = "bg-stone-100 text-stone-600 border-stone-200";
                        if (item.status === "正常") statusColor = "bg-green-50 text-green-700 border-green-200";
                        if (item.status === "试用") statusColor = "bg-blue-50 text-blue-700 border-blue-200";
                        if (item.status === "暂停") statusColor = "bg-red-50 text-red-700 border-red-200";
                        if (item.status === "复训中") statusColor = "bg-amber-50 text-amber-700 border-amber-200";
                        if (item.status === "取消资格") statusColor = "bg-stone-100 text-stone-800 border-stone-200";

                        return (
                          <div
                            key={item.id}
                            onClick={() => {
                              setSelectedGuardian(item);
                              setShowGuardianDetailsModal(true);
                              triggerToast(`已载入 档案守护人【${item.name}】的履历明细 🛡️`);
                            }}
                            className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm hover:shadow-md cursor-pointer transition-all hover:border-[#2F5233]/30 flex flex-col justify-between space-y-3"
                          >
                            {/* Card Top Block */}
                            <div className="flex justify-between items-start">
                              <div className="space-y-1">
                                <div className="flex items-center space-x-2">
                                  <h4 className="text-xs font-serif font-bold text-stone-900">{item.name}</h4>
                                  <span className="text-[8.5px] bg-stone-100 text-stone-500 px-1.5 py-0.2 rounded font-mono">
                                    {item.city}
                                  </span>
                                </div>
                                <div className="flex flex-wrap gap-1 pt-0.5">
                                  {item.tags.map(tag => (
                                    <span key={tag} className="text-[8px] bg-stone-50 text-stone-400 px-1 rounded border border-stone-100">
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              </div>

                              <div className="flex flex-col items-end space-y-1">
                                <span className={`px-2 py-0.5 text-[8.5px] rounded-full border font-bold ${levelColor}`}>
                                  {item.level}
                                </span>
                                <span className={`px-1.5 py-0.2 text-[8px] rounded border font-semibold ${statusColor}`}>
                                  {item.status}
                                </span>
                              </div>
                            </div>

                            {/* Card Stats Grid */}
                            <div className="grid grid-cols-4 gap-1 text-center bg-stone-50/60 rounded-xl p-2 border border-stone-100/50">
                              <div>
                                <p className="text-[8px] text-stone-400 font-bold uppercase tracking-wide">有效审核</p>
                                <p className="text-[10px] font-bold text-stone-800 mt-0.5">{item.validReviews} 笔</p>
                              </div>
                              <div>
                                <p className="text-[8px] text-stone-400 font-bold uppercase tracking-wide">准确率</p>
                                <p className={`text-[10px] font-bold mt-0.5 ${parseFloat(item.accuracy) >= 90 ? 'text-emerald-700' : 'text-red-600'}`}>{item.accuracy}</p>
                              </div>
                              <div>
                                <p className="text-[8px] text-stone-400 font-bold uppercase tracking-wide">争议率</p>
                                <p className={`text-[10px] font-bold mt-0.5 ${parseFloat(item.disputeRate) <= 5 ? 'text-emerald-700' : 'text-red-600'}`}>{item.disputeRate}</p>
                              </div>
                              <div>
                                <p className="text-[8px] text-stone-400 font-bold uppercase tracking-wide">处理时效</p>
                                <p className="text-[10px] font-bold text-stone-800 mt-0.5">{item.avgProcessingTime}</p>
                              </div>
                            </div>

                            {/* Card Footer Block */}
                            <div className="flex justify-between items-center text-[8.5px] text-stone-400 pt-1 border-t border-stone-50">
                              <span className="flex items-center space-x-1">
                                <Clock className="w-2.5 h-2.5" />
                                <span>培训：{item.lastTrainingTime}</span>
                              </span>
                              <span className="text-[#2F5233] font-bold flex items-center space-x-0.5">
                                <span>调阅档案与考核干预</span>
                                <ChevronRight className="w-3 h-3" />
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB CONTENT: 6. 审核日志 */}
              {adminTab === "logs" && (
                <div className="space-y-3">
                  <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider block px-1">平台审核活动操作日志</span>
                  <div className="bg-white border border-stone-200 rounded-2xl divide-y divide-stone-100 overflow-hidden shadow-sm">
                    {adminReviewLogs.map(item => (
                      <div key={item.id} className="p-3 text-[9.5px] leading-relaxed space-y-0.5">
                        <div className="flex justify-between text-[8px] text-stone-400">
                          <span className="font-mono">{item.time}</span>
                          <span>操作员: {item.operator}</span>
                        </div>
                        <p className="text-stone-700 font-medium">{item.action}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}


          {/* ==================== 6. NESTED VIEW: ABOUT PROJECT (关于项目) ==================== */}
          {viewState.type === "about_project" && (
            <AboutProjectView
              onBack={() => setViewState({ type: "main", tab: "my" })}
            />
          )}


          {/* ==================== 7. NESTED VIEW: TASK CENTER (任务线索中心) ==================== */}
          {viewState.type === "task_center" && (
            <div className="px-5 py-4 space-y-4">
              <div className="flex items-center space-x-2 pb-2 border-b border-stone-100">
                <button
                  onClick={() => setViewState({ type: "main", tab: "my" })}
                  className="p-1.5 bg-stone-100 rounded-full text-stone-600 hover:bg-stone-200"
                  title="返回"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h2 className="text-base font-serif font-bold text-stone-900">待补充线索任务中心</h2>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-[#B83B26] font-bold">一起找答案 🔍</p>
                <p className="text-[10px] text-stone-500">大家的力量是无穷的，以下是个体档案中的待验证事件，等待您的核准。</p>
              </div>

              <div className="space-y-3">
                {TASK_CHALLENGES.map(task => (
                  <div key={task.id} className="bg-white border border-stone-200 rounded-2xl p-4 space-y-3.5 shadow-sm">
                    <div>
                      <span className="text-[9px] bg-red-50 text-[#B83B26] px-2 py-0.5 rounded font-bold">悬赏寻物</span>
                      <h4 className="text-xs font-bold text-stone-900 mt-1.5">{task.title}</h4>
                      <p className="text-[10px] text-stone-500 mt-1 leading-relaxed">
                        目前平台由于缺乏史料支持，处于猜测阶段。一经采纳，您的名字将作为校对主创永久记入该动物的生命史记中。
                      </p>
                    </div>

                    <div className="flex justify-between items-center bg-stone-50 p-2.5 rounded-xl text-[10px]">
                      <div>
                        <p className="text-stone-400">奖励</p>
                        <p className="font-bold text-stone-800">{task.rewardLabel}</p>
                      </div>
                      <div>
                        <p className="text-stone-400">进度</p>
                        <p className="font-bold text-stone-800">{task.progressText}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        // Prefill some supplement details
                        setRecommendForm({
                          ...recommendForm,
                          story: `关于【${task.title}】的佐证线索补充：`
                        });
                        setViewState({ type: "recommend_animal", step: 3 });
                        triggerToast("已为您加载本任务的专属投稿草稿，请在步骤 3 / 4 写入您掌握的线索！");
                      }}
                      className="w-full bg-[#2F5233] hover:bg-[#203a24] text-white text-xs font-semibold py-2.5 rounded-xl shadow-sm transition-colors"
                    >
                      {task.actionText}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ==================== 10. NESTED VIEW: FORM OBSERVATION (上传一次观察表单页) ==================== */}
          {viewState.type === "form_observation" && (() => {
            const availableAnimals = animals.filter(a => ["ahang", "mutou", "paopao", "abao"].includes(a.id));

            return (
              <div className="px-5 py-4 space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        if (obsUploadStep > 1 && obsUploadStep <= 5) {
                          setObsUploadStep(prev => prev - 1);
                        } else {
                          handleCloseAdvancedObs();
                        }
                      }}
                      className="p-1.5 bg-stone-100 rounded-full text-stone-600 hover:bg-stone-200 transition-colors"
                      title={obsUploadStep > 1 && obsUploadStep <= 5 ? "上一步" : "返回"}
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div>
                      <h2 className="text-base font-serif font-bold text-stone-900">上传一次观察</h2>
                      <p className="text-[10px] text-stone-400">记录大自然老朋友们每日的生活印记</p>
                    </div>
                  </div>
                  {/* Step indicator */}
                  {obsUploadStep <= 5 && (
                    <span className="text-xs bg-[#2F5233]/10 text-[#2F5233] px-2.5 py-1 rounded-full font-bold">
                      步骤 {obsUploadStep} / 5
                    </span>
                  )}
                </div>

                {/* Progress dots */}
                {obsUploadStep <= 5 && (
                  <div className="flex justify-between items-center px-4 py-2 bg-stone-50 rounded-xl border border-stone-200/40">
                    {[
                      { step: 1, label: "选择动物" },
                      { step: 2, label: "观察信息" },
                      { step: 3, label: "丰容互动" },
                      { step: 4, label: "描述与实拍" },
                      { step: 5, label: "版权提交" }
                    ].map((s) => (
                      <div key={s.step} className="flex flex-col items-center space-y-1">
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                            obsUploadStep === s.step
                              ? "bg-[#2F5233] text-white ring-4 ring-[#2F5233]/15 scale-110"
                              : obsUploadStep > s.step
                              ? "bg-green-600 text-white font-bold"
                              : "bg-stone-200 text-stone-500"
                          }`}
                        >
                          {obsUploadStep > s.step ? "✓" : s.step}
                        </div>
                        <span className={`text-[9px] font-bold ${obsUploadStep === s.step ? "text-[#2F5233]" : "text-stone-400"}`}>
                          {s.label}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* STEP 1: SELECT ANIMAL */}
                {obsUploadStep === 1 && (
                  <div className="space-y-4 animate-fade-in">
                    {/* Recently viewed section */}
                    <div className="space-y-2">
                      <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider">最近查看的动物</h3>
                      <div className="flex space-x-3.5 overflow-x-auto pb-1">
                        {obsRecentlyViewed.map(id => {
                          const match = availableAnimals.find(a => a.id === id);
                          if (!match) return null;
                          const isSelected = obsSelectedAnimalId === id;
                          return (
                            <div
                              key={id}
                              onClick={() => {
                                setObsSelectedAnimalId(id);
                                // prefill location
                                if (id === "ahang") setObsLocation("广州动物园 狮虎山");
                                else if (id === "mutou") setObsLocation("广州动物园 熊区");
                                else if (id === "paopao") setObsLocation("广州动物园 小熊猫馆");
                                else if (id === "abao") setObsLocation("广州动物园 大象馆");
                                triggerToast(`已选择：${match.name} 🦁`);
                              }}
                              className="flex flex-col items-center space-y-1 cursor-pointer group flex-shrink-0"
                            >
                              <div className={`w-12 h-12 rounded-full overflow-hidden relative border-2 transition-all ${
                                isSelected ? "border-[#2F5233] ring-2 ring-[#2F5233]/20 scale-105" : "border-stone-200 group-hover:border-stone-400"
                              }`}>
                                <AnimalImage species={match.species} image={match.coverUrl} className="w-full h-full object-cover" alt={match.name} />
                                {isSelected && (
                                  <div className="absolute inset-0 bg-[#2F5233]/20 flex items-center justify-center">
                                    <Check className="w-4 h-4 text-white font-bold stroke-[3]" />
                                  </div>
                                )}
                              </div>
                              <span className={`text-[10px] font-bold ${isSelected ? "text-[#2F5233]" : "text-stone-600"}`}>
                                {match.name}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Search individual */}
                    <div className="space-y-2">
                      <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider">搜索或选择在园动物</h3>
                      <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
                        <input
                          type="text"
                          placeholder="输入动物名称或物种进行快速检索..."
                          value={obsSearchQuery}
                          onChange={(e) => setObsSearchQuery(e.target.value)}
                          className="w-full bg-white border border-stone-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-[#2F5233] transition-colors"
                        />
                      </div>
                    </div>

                    {/* List grid */}
                    <div className="grid grid-cols-2 gap-2.5">
                      {availableAnimals
                        .filter(a =>
                          a.name.toLowerCase().includes(obsSearchQuery.toLowerCase()) ||
                          a.species.toLowerCase().includes(obsSearchQuery.toLowerCase())
                        )
                        .map((a) => {
                          const isSelected = obsSelectedAnimalId === a.id;
                          return (
                            <div
                              key={a.id}
                              onClick={() => {
                                setObsSelectedAnimalId(a.id);
                                // prefill location
                                if (a.id === "ahang") setObsLocation("广州动物园 狮虎山");
                                else if (a.id === "mutou") setObsLocation("广州动物园 熊区");
                                else if (a.id === "paopao") setObsLocation("广州动物园 小熊猫馆");
                                else if (a.id === "abao") setObsLocation("广州动物园 大象馆");
                                triggerToast(`已选择：${a.name}`);
                              }}
                              className={`p-3 border rounded-2xl cursor-pointer transition-all flex flex-col space-y-2 relative bg-white group ${
                                isSelected
                                  ? "border-[#2F5233] bg-[#2F5233]/5 shadow-sm"
                                  : "border-stone-200 hover:border-stone-300"
                              }`}
                            >
                              <div className="h-20 w-full rounded-lg overflow-hidden bg-stone-50 relative">
                                <AnimalImage species={a.species} image={a.coverUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={a.name} />
                                {isSelected && (
                                  <div className="absolute top-1.5 right-1.5 bg-[#2F5233] text-white p-0.5 rounded-full shadow">
                                    <Check className="w-3 h-3 stroke-[3]" />
                                  </div>
                                )}
                              </div>
                              <div className="space-y-0.5 min-w-0">
                                <h4 className="text-xs font-bold text-stone-900 flex items-center justify-between truncate">
                                  <span className="truncate">{a.name}</span>
                                  {a.isTestData && (
                                    <span className="text-[8px] bg-stone-100 text-stone-500 border border-stone-200 px-1 py-0.2 rounded-full font-medium shrink-0 ml-1">
                                      测试
                                    </span>
                                  )}
                                </h4>
                                <p className="text-[10px] text-stone-400 truncate">{a.species} · {a.zoo}</p>
                              </div>
                            </div>
                          );
                        })}
                    </div>

                    {/* Actions footer */}
                    <div className="pt-2">
                      <button
                        onClick={() => setObsUploadStep(2)}
                        disabled={!obsSelectedAnimalId}
                        className="w-full bg-[#2F5233] disabled:opacity-50 hover:bg-[#203a24] text-white text-xs font-semibold py-3 rounded-xl transition-all shadow-sm flex items-center justify-center space-x-1 cursor-pointer"
                      >
                        <span>下一步：填写观察信息</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 2: FILL OUT OBSERVATION INFORMATION */}
                {obsUploadStep === 2 && (
                  <div className="space-y-4 animate-fade-in">
                    {/* Animal Selected Preview */}
                    <div className="bg-stone-50 border border-stone-200/60 p-3 rounded-xl flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden border border-stone-200">
                        <AnimalImage species={availableAnimals.find(a => a.id === obsSelectedAnimalId)?.species || ""} image={availableAnimals.find(a => a.id === obsSelectedAnimalId)?.coverUrl} className="w-full h-full object-cover" alt="selected" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-stone-800 font-serif">当前选择：{availableAnimals.find(a => a.id === obsSelectedAnimalId)?.name}</p>
                        <p className="text-[10px] text-stone-400">已匹配常驻地点，正在进行第二步</p>
                      </div>
                    </div>

                    {/* Date & Time Picker */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-stone-500 mb-1">观察日期</label>
                        <div className="relative">
                          <Calendar className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-stone-400" />
                          <input
                            type="date"
                            value={obsDate}
                            onChange={(e) => setObsDate(e.target.value)}
                            className="w-full bg-white border border-stone-200 rounded-xl pl-8 pr-2 py-2 text-xs focus:outline-none focus:border-[#2F5233]"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-stone-500 mb-1">大约时间</label>
                        <div className="relative">
                          <Clock className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-stone-400" />
                          <input
                            type="time"
                            value={obsTime}
                            onChange={(e) => setObsTime(e.target.value)}
                            className="w-full bg-white border border-stone-200 rounded-xl pl-8 pr-2 py-2 text-xs focus:outline-none focus:border-[#2F5233]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Quick select time chips */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-stone-400">快捷选择时间段</span>
                      <div className="flex space-x-2">
                        {[
                          { time: "10:00", label: "上午游园" },
                          { time: "12:30", label: "中午开饭" },
                          { time: "15:00", label: "下午活跃" },
                          { time: "18:00", label: "傍晚闭馆" }
                        ].map(t => (
                          <button
                            key={t.time}
                            type="button"
                            onClick={() => {
                              setObsTime(t.time);
                              triggerToast(`时间已设置为 ${t.time}`);
                            }}
                            className={`px-2.5 py-1 text-[9px] font-bold rounded-lg border transition-all cursor-pointer ${
                              obsTime === t.time
                                ? "bg-[#2F5233]/10 text-[#2F5233] border-[#2F5233]/30"
                                : "bg-white text-stone-500 border-stone-200 hover:border-stone-300"
                            }`}
                          >
                            {t.label} ({t.time})
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Location Input */}
                    <div>
                      <label className="block text-[10px] font-bold text-stone-500 mb-1">观察地点</label>
                      <div className="relative">
                        <MapPin className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-stone-400" />
                        <input
                          type="text"
                          value={obsLocation}
                          onChange={(e) => setObsLocation(e.target.value)}
                          placeholder="例如：广州动物园 狮虎山斜坡下"
                          className="w-full bg-white border border-stone-200 rounded-xl pl-8 pr-3 py-2.5 text-xs focus:outline-none focus:border-[#2F5233]"
                        />
                      </div>
                      <span className="text-[8px] text-stone-400 mt-1 block">系统已根据选定个体自动匹配推荐场馆</span>
                    </div>

                    {/* Behavior Tags (Multi-select) */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-stone-500">行为标签 (可多选)</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: "睡觉", label: "💤 睡觉" },
                          { id: "进食", label: "🥩 进食" },
                          { id: "行走", label: "🐾 行走" },
                          { id: "玩耍", label: "⚽ 玩耍" },
                          { id: "梳理", label: "✨ 梳理" },
                          { id: "鸣叫", label: "📢 鸣叫" },
                          { id: "与同伴互动", label: "👥 同伴互动" },
                          { id: "与保育员互动", label: "👨‍🌾 保育员互动" },
                          { id: "其他", label: "❓ 其他" }
                        ].map(tag => {
                          const isChecked = obsSelectedBehaviors.includes(tag.id);
                          return (
                            <button
                              key={tag.id}
                              type="button"
                              onClick={() => {
                                if (isChecked) {
                                  setObsSelectedBehaviors(obsSelectedBehaviors.filter(b => b !== tag.id));
                                } else {
                                  setObsSelectedBehaviors([...obsSelectedBehaviors, tag.id]);
                                }
                              }}
                              className={`py-2 text-[10px] font-bold rounded-xl border transition-all flex items-center justify-center space-x-1 cursor-pointer ${
                                isChecked
                                  ? "bg-[#2F5233] text-white border-[#2F5233] shadow-sm scale-[1.02]"
                                  : "bg-white text-stone-600 border-stone-200 hover:border-stone-300"
                              }`}
                            >
                              <span>{tag.label}</span>
                              {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Actions footer */}
                    <div className="flex space-x-3 pt-2">
                      <button
                        onClick={() => setObsUploadStep(1)}
                        className="w-1/3 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold py-3 rounded-xl transition-all cursor-pointer"
                      >
                        上一步
                      </button>
                      <button
                        onClick={() => setObsUploadStep(3)}
                        disabled={obsSelectedBehaviors.length === 0}
                        className="w-2/3 bg-[#2F5233] disabled:opacity-50 hover:bg-[#203a24] text-white text-xs font-semibold py-3 rounded-xl transition-all shadow-sm flex items-center justify-center space-x-1 cursor-pointer"
                      >
                        <span>下一步：丰容与互动</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3: ENRICHMENT & INTERACTION */}
                {obsUploadStep === 3 && (
                  <div className="space-y-5 animate-fade-in">
                    {/* Enrichment Facilities */}
                    <div className="space-y-2.5">
                      <div className="space-y-0.5">
                        <h3 className="text-xs font-bold text-stone-800 flex items-center space-x-1.5">
                          <Sparkles className="w-4 h-4 text-amber-500" />
                          <span>1. 是否看到丰容设施？</span>
                        </h3>
                        <p className="text-[10px] text-stone-400">丰容包括：木头、枯树枝、栖架、水池、玩具、冰块等物理或食物丰容设施。</p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { id: "yes", label: "是 (看到了)", desc: "场馆中有玩具或专门架设的玩乐设施" },
                          { id: "no", label: "否 (没有看到)", desc: "场馆比较空旷，未见明显的丰容玩具" }
                        ].map(opt => (
                          <div
                            key={opt.id}
                            onClick={() => setObsSawEnrichment(opt.id as any)}
                            className={`p-3.5 border rounded-2xl cursor-pointer transition-all flex flex-col space-y-1 bg-white ${
                              obsSawEnrichment === opt.id
                                ? "border-[#2F5233] bg-[#2F5233]/5 ring-1 ring-[#2F5233]"
                                : "border-stone-200 hover:border-stone-300"
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-bold text-stone-800">{opt.label}</span>
                              <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                obsSawEnrichment === opt.id ? "bg-[#2F5233] border-[#2F5233]" : "border-stone-300"
                              }`}>
                                {obsSawEnrichment === opt.id && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                              </div>
                            </div>
                            <p className="text-[9px] text-stone-400 leading-relaxed">{opt.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Peer interaction */}
                    <div className="space-y-2.5">
                      <div className="space-y-0.5">
                        <h3 className="text-xs font-bold text-stone-800 flex items-center space-x-1.5">
                          <User className="w-4 h-4 text-blue-500" />
                          <span>2. 是否与其他动物互动？</span>
                        </h3>
                        <p className="text-[10px] text-stone-400">包括与其他同伴个体的打闹、对视、追逐、依偎等亲密或警惕行为。</p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { id: "yes", label: "是 (有互动)", desc: "与同馆其他伙伴有交流或依偎对视等" },
                          { id: "no", label: "否 (各自活动)", desc: "独处静静休息或各自散步，无互动" }
                        ].map(opt => (
                          <div
                            key={opt.id}
                            onClick={() => setObsInteracted(opt.id as any)}
                            className={`p-3.5 border rounded-2xl cursor-pointer transition-all flex flex-col space-y-1 bg-white ${
                              obsInteracted === opt.id
                                ? "border-[#2F5233] bg-[#2F5233]/5 ring-1 ring-[#2F5233]"
                                : "border-stone-200 hover:border-stone-300"
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-bold text-stone-800">{opt.label}</span>
                              <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                obsInteracted === opt.id ? "bg-[#2F5233] border-[#2F5233]" : "border-stone-300"
                              }`}>
                                {obsInteracted === opt.id && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                              </div>
                            </div>
                            <p className="text-[9px] text-stone-400 leading-relaxed">{opt.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actions footer */}
                    <div className="flex space-x-3 pt-4">
                      <button
                        onClick={() => setObsUploadStep(2)}
                        className="w-1/3 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold py-3 rounded-xl transition-all cursor-pointer"
                      >
                        上一步
                      </button>
                      <button
                        onClick={() => setObsUploadStep(4)}
                        className="w-2/3 bg-[#2F5233] hover:bg-[#203a24] text-white text-xs font-semibold py-3 rounded-xl transition-all shadow-sm flex items-center justify-center space-x-1 cursor-pointer"
                      >
                        <span>下一步：一句话描述与照片</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 4: DESCRIPTION & PHOTO UPLOAD */}
                {obsUploadStep === 4 && (
                  <div className="space-y-4 animate-fade-in">
                    {/* Text description */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-baseline">
                        <label className="block text-xs font-bold text-stone-800">1. 一句话日常描述 (不超过300字)</label>
                        <span className={`text-[10px] font-mono ${obsDescription.length > 300 ? "text-red-500 font-bold" : "text-stone-400"}`}>
                          {obsDescription.length} / 300
                        </span>
                      </div>
                      <textarea
                        rows={4}
                        value={obsDescription}
                        onChange={(e) => setObsDescription(e.target.value)}
                        placeholder="用一两句话描述一下今天看到它时的神态、活动细节、或者有趣的小动作（不超过300字）..."
                        className="w-full bg-white border border-stone-200 rounded-xl p-3 text-xs focus:outline-none focus:border-[#2F5233] focus:ring-1 focus:ring-[#2F5233] leading-relaxed"
                      ></textarea>
                    </div>

                    {/* Photo Upload Container with deletion support */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-stone-800">2. 上传今天在现场拍的照片 (支持预览与删除)</label>
                      <div className="relative">
                        {obsUploadedPhoto ? (
                          <div className="border border-stone-200 rounded-2xl overflow-hidden shadow-sm relative bg-stone-50">
                            <img src={obsUploadedPhoto} alt="observation实拍图" className="w-full h-44 object-cover" />
                            <div className="absolute top-2.5 right-2.5 flex space-x-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setObsUploadedPhoto(null);
                                  triggerToast("已删除已上传的照片 🗑️");
                                }}
                                className="bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center space-x-1 shadow-md transition-colors cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>删除照片</span>
                              </button>
                            </div>
                            <div className="absolute bottom-0 inset-x-0 bg-stone-900/60  px-3 py-2 text-white text-[9px] flex justify-between">
                              <span>已载入现场高精度特征线索照片</span>
                              <span className="font-mono text-stone-300">JPG格式 · 1.2M</span>
                            </div>
                          </div>
                        ) : (
                          <div
                            onClick={() => {
                              // Smart simulated image fetch matching the selected individual!
                              const targetAnimal = animals.find(a => a.id === obsSelectedAnimalId);
                              let url = "";
                              if (targetAnimal) {
                                url = getSpeciesDefaultImage(targetAnimal.species);
                              }
                              setObsUploadedPhoto(url);
                              triggerToast("已模拟通过系统相册选择现场照片 📸");
                            }}
                            className="h-32 border-2 border-dashed border-stone-300 hover:border-[#2F5233] rounded-2xl flex flex-col items-center justify-center bg-stone-50 cursor-pointer overflow-hidden transition-all group p-4 text-center"
                          >
                            <Camera className="w-8 h-8 text-stone-400 group-hover:text-[#2F5233] mb-1.5 transition-colors" />
                            <span className="text-[11px] text-stone-600 font-bold group-hover:text-[#2F5233] transition-colors">点击上传现场照片或选择相册</span>
                            <span className="text-[9px] text-stone-400 mt-1">支持实时预览与一键删除</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions footer */}
                    <div className="flex space-x-3 pt-2">
                      <button
                        onClick={() => setObsUploadStep(3)}
                        className="w-1/3 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold py-3 rounded-xl transition-all cursor-pointer"
                      >
                        上一步
                      </button>
                      <button
                        onClick={() => setObsUploadStep(5)}
                        disabled={!obsDescription.trim() || obsDescription.length > 300}
                        className="w-2/3 bg-[#2F5233] disabled:opacity-50 hover:bg-[#203a24] text-white text-xs font-semibold py-3 rounded-xl transition-all shadow-sm flex items-center justify-center space-x-1 cursor-pointer"
                      >
                        <span>下一步：确认版权与提交</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 5: COPYRIGHT CONFIRMATION & SUBMIT */}
                {obsUploadStep === 5 && (
                  <div className="space-y-4 animate-fade-in">
                    {/* Final Abstract receipt summary */}
                    <div className="bg-[#2F5233]/5 border border-[#2F5233]/20 p-4 rounded-2xl space-y-3">
                      <div className="flex justify-between items-center border-b border-stone-200 pb-2">
                        <span className="text-xs font-serif font-bold text-stone-800">观察投稿摘要预览</span>
                        <span className="text-[10px] text-[#2F5233] bg-[#2F5233]/10 px-2 py-0.5 rounded-full font-bold">待确认提交</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] text-stone-600">
                        <div>
                          <p className="text-stone-400 font-bold">观察个体</p>
                          <p className="font-bold text-stone-800 font-serif">{availableAnimals.find(a => a.id === obsSelectedAnimalId)?.name}</p>
                        </div>
                        <div>
                          <p className="text-stone-400 font-bold">时间</p>
                          <p className="font-bold text-stone-800">{obsDate} {obsTime}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-stone-400 font-bold">观察地点</p>
                          <p className="font-bold text-stone-800">{obsLocation}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-stone-400 font-bold">行为标签</p>
                          <p className="font-bold text-stone-800">{obsSelectedBehaviors.join("、")}</p>
                        </div>
                        <div>
                          <p className="text-stone-400 font-bold">丰容设施</p>
                          <p className="font-bold text-stone-800">{obsSawEnrichment === "yes" ? "✓ 看到丰容设施" : "✗ 未看到"}</p>
                        </div>
                        <div>
                          <p className="text-stone-400 font-bold">同伴互动</p>
                          <p className="font-bold text-stone-800">{obsInteracted === "yes" ? "✓ 有与其他动物互动" : "✗ 独自活动"}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-stone-400 font-bold">一句话描述</p>
                          <p className="font-medium text-stone-700 italic">“ {obsDescription} ”</p>
                        </div>
                      </div>

                      {obsUploadedPhoto && (
                        <div className="h-16 w-full rounded-lg overflow-hidden border border-stone-200">
                          <img src={obsUploadedPhoto} alt="receipt" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>

                    {/* Copyright confirmation agreements */}
                    <div className="space-y-2">
                      <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider">3. 确认版权条款 (必选)</h3>

                      <div className="space-y-2">
                        {[
                          { id: "self", state: obsCopyrightSelf, setter: setObsCopyrightSelf, title: "确认本人拍摄", desc: "该照片及文字资料为我亲自在动物园实地采集，享有完整的合法版权权益。" },
                          { id: "archive", state: obsCopyrightArchiveOnly, setter: setObsCopyrightArchiveOnly, title: "仅用于档案展示授权", desc: "授权本平台将其收录并免费对外展示，不转授权他人，不用于任何直接商业用途。" },
                          { id: "public", state: obsCopyrightPublicWelfare, setter: setObsCopyrightPublicWelfare, title: "允许公益与科普宣传", desc: "授权阿杭计划和有关保护组织免费将此照片用于非营利性的动物保护与公益科普宣传。" }
                        ].map((item) => (
                          <div
                            key={item.id}
                            onClick={() => item.setter(!item.state)}
                            className={`p-3 border rounded-xl cursor-pointer transition-all flex items-start space-x-3 bg-white hover:border-stone-300 ${
                              item.state ? "border-[#2F5233] bg-[#2F5233]/5" : "border-stone-200"
                            }`}
                          >
                            <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                              item.state ? "bg-[#2F5233] border-[#2F5233] text-white" : "border-stone-300"
                            }`}>
                              {item.state && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <div className="space-y-0.5">
                              <h4 className="text-xs font-bold text-stone-800">{item.title}</h4>
                              <p className="text-[9px] text-stone-500 leading-normal">{item.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Submit buttons */}
                    <form onSubmit={handleAdvancedObsSubmit} className="flex space-x-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setObsUploadStep(4)}
                        className="w-1/3 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold py-3 rounded-xl transition-all cursor-pointer"
                      >
                        上一步
                      </button>
                      <button
                        type="submit"
                        disabled={!obsCopyrightSelf || !obsCopyrightArchiveOnly || !obsCopyrightPublicWelfare}
                        className="w-2/3 bg-[#2F5233] disabled:opacity-50 hover:bg-[#203a24] text-white text-xs font-bold py-3 rounded-xl transition-all shadow flex items-center justify-center space-x-1 cursor-pointer"
                      >
                        <span>确认版权并提交观察记录</span>
                        <Check className="w-4 h-4 stroke-[3]" />
                      </button>
                    </form>
                  </div>
                )}

                {/* SUCCESS PAGE: SUCCESS SCREEN (STEP 6) */}
                {obsUploadStep === 6 && (
                  <div className="py-8 px-4 flex flex-col items-center justify-center text-center space-y-5 animate-fade-in bg-white rounded-3xl border border-stone-200/60 shadow-sm">
                    <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center border border-green-200/55 shadow-md">
                      <CheckCircle2 className="w-10 h-10 stroke-[1.5]" />
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-base font-serif font-bold text-stone-900 leading-relaxed px-4">
                        已收到，它会先进入候选档案，等待更多资料。
                      </h3>
                      <p className="text-xs text-stone-500 max-w-sm leading-relaxed px-2">
                        非常感谢您！您上传的日常观察记录已同步收录，我们已帮您在 <b>“我的投稿记录”</b> 中自动新增了一条模拟投稿。
                      </p>
                    </div>

                    {/* Highlight receipt detail */}
                    <div className="bg-stone-50 border border-stone-200/60 p-3.5 rounded-xl text-left w-full max-w-xs space-y-1 text-[11px] text-stone-600 font-mono">
                      <p><b>投稿编号：</b>OBS-{Date.now().toString().slice(-6)}</p>
                      <p><b>关联个体：</b>{availableAnimals.find(a => a.id === obsSelectedAnimalId)?.name}</p>
                      <p><b>行为标签：</b>{obsSelectedBehaviors.join("、")}</p>
                      <p><b>处理状态：</b><span className="text-[#2F5233] font-bold">已同步入档</span></p>
                    </div>

                    <div className="w-full max-w-xs flex flex-col space-y-2 pt-4">
                      <button
                        onClick={() => {
                          setViewState({ type: "my_submissions" });
                          handleCloseAdvancedObs();
                        }}
                        className="w-full bg-[#2F5233] hover:bg-[#203a24] text-white text-xs font-bold py-3 rounded-xl transition-colors shadow-sm cursor-pointer"
                      >
                        查看我的投稿记录
                      </button>
                      <button
                        onClick={handleCloseAdvancedObs}
                        className="w-full bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold py-2.5 rounded-xl transition-all cursor-pointer"
                      >
                        返回相遇广场
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* ==================== 11. NESTED VIEW: FORM MEMORY (分享一段回忆表单页) ==================== */}
          {viewState.type === "form_memory" && (
            <div className="px-5 py-4 space-y-4">
              <div className="flex items-center space-x-2 pb-2 border-b border-stone-100">
                <button
                  onClick={() => setViewState({ type: "main", tab: "record" })}
                  className="p-1.5 bg-stone-100 rounded-full text-stone-600 hover:bg-stone-200"
                  title="返回"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div>
                  <h2 className="text-base font-serif font-bold text-stone-900">分享一段回忆</h2>
                  <p className="text-[10px] text-stone-400">上传过去的照片或故事</p>
                </div>
              </div>

              <form onSubmit={handleMemorySubmit} className="space-y-4">
                {/* Choice of Animal */}
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 mb-1">1. 追忆的个体对象</label>
                  <select
                    value={memoryForm.animalId}
                    onChange={(e) => setMemoryForm({ ...memoryForm, animalId: e.target.value })}
                    className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-[#2F5233]"
                  >
                    <option value="custom">-- 档案中没有它，输入新名字 --</option>
                    {animals.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.species} · {a.zoo})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Custom Name if not in list */}
                {memoryForm.animalId === "custom" && (
                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 mb-1">自定义对象名字</label>
                    <input
                      type="text"
                      placeholder="如：白狮“阿杭”、小熊猫“迪迪”"
                      value={memoryForm.customAnimalName}
                      onChange={(e) => setMemoryForm({ ...memoryForm, customAnimalName: e.target.value })}
                      className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#2F5233]"
                    />
                  </div>
                )}

                {/* Memory Date */}
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 mb-1">2. 回忆发生的大致时间</label>
                  <input
                    type="month"
                    value={memoryForm.date}
                    onChange={(e) => setMemoryForm({ ...memoryForm, date: e.target.value })}
                    className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#2F5233]"
                  />
                </div>

                {/* Title */}
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 mb-1">3. 故事标题</label>
                  <input
                    type="text"
                    placeholder="如：九十年代去广州动物园，那只难忘的大熊猫"
                    value={memoryForm.title}
                    onChange={(e) => setMemoryForm({ ...memoryForm, title: e.target.value })}
                    className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#2F5233]"
                  />
                </div>

                {/* Memory Story */}
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 mb-1">4. 温情故事 / 游园旧事</label>
                  <textarea
                    rows={4}
                    placeholder="写下它给您留下的深刻印象、旧时趣事或它离去对您的感触。那些压在箱底的故事，都是生命温存的证言..."
                    value={memoryForm.text}
                    onChange={(e) => setMemoryForm({ ...memoryForm, text: e.target.value })}
                    className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#2F5233]"
                  ></textarea>
                </div>

                {/* Upload old photo */}
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 mb-1.5">5. 珍贵旧照/老门票 (点击模拟选择)</label>
                  <div
                    onClick={() => {
                      setMemoryForm({
                        ...memoryForm,
                        image: getSpeciesDefaultImage("African Lion")
                      });
                      triggerToast("已成功载入一张历史老照片 📸");
                    }}
                    className="h-28 border-2 border-dashed border-stone-300 hover:border-amber-600 rounded-xl flex flex-col items-center justify-center bg-stone-50 cursor-pointer overflow-hidden relative"
                  >
                    {memoryForm.image ? (
                      <>
                        <img src={memoryForm.image} alt="old-photo-upload" className="w-full h-full object-cover" />
                        <span className="absolute inset-0 bg-stone-900/40 flex items-center justify-center text-white text-[9px] font-bold">
                          点击重新选择
                        </span>
                      </>
                    ) : (
                      <>
                        <Heart className="w-7 h-7 text-stone-300 mb-1" />
                        <span className="text-[10px] text-stone-500 font-bold">选择历史照片 / 纸质照片翻拍</span>
                        <span className="text-[8px] text-stone-400 mt-0.5">泛黄的游园回忆同样珍贵</span>
                      </>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold py-3 rounded-xl transition-all shadow-sm"
                >
                  发布回忆，让爱留存 🕯️
                </button>
              </form>
            </div>
          )}

          {/* ==================== 12. NESTED VIEW: FORM CORRECTION (资料纠错表单页) ==================== */}
          {viewState.type === "form_correction" && (
            <div className="px-5 py-4 space-y-4">
              <div className="flex items-center space-x-2 pb-2 border-b border-stone-100">
                <button
                  onClick={() => setViewState({ type: "main", tab: "record" })}
                  className="p-1.5 bg-stone-100 rounded-full text-stone-600 hover:bg-stone-200"
                  title="返回"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div>
                  <h2 className="text-base font-serif font-bold text-stone-900">补充或纠正资料</h2>
                  <p className="text-[10px] text-stone-400">让已有档案更加准确</p>
                </div>
              </div>

              <form onSubmit={handleCorrectionSubmit} className="space-y-4">
                {/* Animal Select */}
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 mb-1">1. 指向的已有档案个体</label>
                  <select
                    value={correctionForm.animalId}
                    onChange={(e) => setCorrectionForm({ ...correctionForm, animalId: e.target.value })}
                    className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-[#2F5233]"
                  >
                    {animals.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.species} · {a.zoo})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Correction Field */}
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 mb-1">2. 纠错/补充的版块分类</label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {[
                      { id: "gender", label: "性别有误" },
                      { id: "age", label: "寿命/生卒年份" },
                      { id: "timeline", label: "时间线大事件" },
                      { id: "other", label: "名称或常驻习性" }
                    ].map(field => (
                      <label
                        key={field.id}
                        onClick={() => setCorrectionForm({ ...correctionForm, field: field.id as any })}
                        className={`p-2 border rounded-xl flex items-center justify-center font-bold cursor-pointer transition-all ${
                          correctionForm.field === field.id
                            ? "bg-blue-50 text-blue-700 border-blue-300"
                            : "bg-white text-stone-600 border-stone-200 hover:border-stone-300"
                        }`}
                      >
                        <input
                          type="radio"
                          name="correctionField"
                          checked={correctionForm.field === field.id}
                          onChange={() => {}}
                          className="sr-only"
                        />
                        <span>{field.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Correction Text */}
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 mb-1">3. 请指出具体谬误并提供正确表述</label>
                  <textarea
                    rows={3}
                    placeholder="例如：时间线上写的2026年3月阿杭转院是错的，应为2026年1月，并且它是退休而不是转院。"
                    value={correctionForm.text}
                    onChange={(e) => setCorrectionForm({ ...correctionForm, text: e.target.value })}
                    className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#2F5233]"
                  ></textarea>
                </div>

                {/* Evidence */}
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 mb-1">4. 佐证依据 / 核实说明 (必填)</label>
                  <textarea
                    rows={2}
                    placeholder="例如：我这里有2026年1月原园方公众号发布的退休公告推文截图..."
                    value={correctionForm.evidence}
                    onChange={(e) => setCorrectionForm({ ...correctionForm, evidence: e.target.value })}
                    className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#2F5233]"
                  ></textarea>
                </div>

                {/* Citation */}
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 mb-1">5. 参考文献或推文链接 (选填)</label>
                  <input
                    type="text"
                    placeholder="如：http://mp.weixin.qq.com/..."
                    value={correctionForm.citation}
                    onChange={(e) => setCorrectionForm({ ...correctionForm, citation: e.target.value })}
                    className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#2F5233]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#2F5233] hover:bg-[#203a24] text-white text-xs font-semibold py-3 rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  提交纠错申请，开启众包复核
                </button>
              </form>
            </div>
          )}

          {/* ==================== 13. NESTED VIEW: AI HELPER (AI 辅助识别页面) ==================== */}
          {viewState.type === "ai_helper" && (
            <div className="px-5 py-4 space-y-4">
              <div className="flex items-center space-x-2 pb-2 border-b border-stone-100">
                <button
                  onClick={() => setViewState({ type: "main", tab: "record" })}
                  className="p-1.5 bg-stone-100 rounded-full text-stone-600 hover:bg-stone-200"
                  title="返回"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div>
                  <h2 className="text-base font-serif font-bold text-stone-900 flex items-center space-x-1.5">
                    <Sparkles className="w-4 h-4 text-[#D9C3B0] animate-pulse" />
                    <span>AI 辅助识别判断</span>
                  </h2>
                  <p className="text-[10px] text-stone-400">上传一张照片，让系统自动识别</p>
                </div>
              </div>

              {/* Status 1: Idle */}
              {aiScannerState.status === "idle" && (
                <div className="space-y-4">
                  <div className="bg-stone-50 border border-stone-200 p-4 rounded-2xl text-[11px] text-stone-600 leading-relaxed">
                    <p className="font-bold text-stone-800 mb-1">💡 体验指南：</p>
                    我们收集了各大动物园明星个体的局部特写数据。您可以点击下方示例照片，或拖入您拍的照片，我们将通过局部条纹、脸部特征和耳朵缺口帮您智能比对。
                  </div>

                  <p className="text-[11px] font-bold text-stone-500">点击下方实拍照片体验 AI 识别：</p>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div
                      onClick={() => {
                        setAiScannerState({
                          status: "scanning",
                          scannedImage: getSpeciesDefaultImage("Asian Black Bear")
                        });
                        setTimeout(() => {
                          setAiScannerState({
                            status: "success",
                            scannedImage: getSpeciesDefaultImage("Asian Black Bear")
                          });
                          triggerToast("AI 识别比对完成！");
                        }, 2000);
                      }}
                      className="border border-stone-200 rounded-2xl overflow-hidden cursor-pointer hover:border-[#D9C3B0] group relative"
                    >
                      <img
                        src={getSpeciesDefaultImage("Asian Black Bear")}
                        alt="Bear Specimen"
                        className="w-full h-24 object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="p-2 bg-white text-center text-[10px] font-bold text-stone-700 truncate">
                        黑熊现场照 (示例)
                      </div>
                    </div>

                    <div
                      onClick={() => {
                        setAiScannerState({
                          status: "scanning",
                          scannedImage: getSpeciesDefaultImage("African Lion")
                        });
                        setTimeout(() => {
                          setAiScannerState({
                            status: "success",
                            scannedImage: getSpeciesDefaultImage("African Lion")
                          });
                          triggerToast("AI 识别比对完成！");
                        }, 2000);
                      }}
                      className="border border-stone-200 rounded-2xl overflow-hidden cursor-pointer hover:border-[#D9C3B0] group relative"
                    >
                      <img
                        src={getSpeciesDefaultImage("African Lion")}
                        alt="Lion Specimen"
                        className="w-full h-24 object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="p-2 bg-white text-center text-[10px] font-bold text-stone-700 truncate">
                        白狮现场照 (示例)
                      </div>
                    </div>
                  </div>

                  <div
                    onClick={() => {
                      setAiScannerState({
                        status: "scanning",
                        scannedImage: getSpeciesDefaultImage("Asian Black Bear")
                      });
                      setTimeout(() => {
                        setAiScannerState({
                          status: "success",
                          scannedImage: getSpeciesDefaultImage("Asian Black Bear")
                        });
                        triggerToast("AI 识别比对完成！");
                      }, 2000);
                    }}
                    className="border-2 border-dashed border-stone-300 bg-stone-50 hover:bg-stone-100 rounded-2xl p-6 text-center flex flex-col items-center justify-center space-y-2 cursor-pointer"
                  >
                    <Camera className="w-8 h-8 text-stone-400" />
                    <span className="text-xs text-stone-600 font-bold">拍摄、拖入或上传包含动物特征照片</span>
                    <span className="text-[9px] text-stone-400">我们将帮您比对数据库，自动匹配推荐个体。</span>
                  </div>
                </div>
              )}

              {/* Status 2: Scanning animation */}
              {aiScannerState.status === "scanning" && (
                <div className="flex flex-col items-center justify-center space-y-5 py-8">
                  <div className="w-64 h-64 border border-stone-300 rounded-2xl overflow-hidden relative shadow-lg">
                    {aiScannerState.scannedImage && (
                      <img
                        src={aiScannerState.scannedImage}
                        alt="Scanning specimen"
                        className="w-full h-full object-cover blur-[0.5px]"
                      />
                    )}
                    {/* Glowing scanning laser line */}
                    <div className="absolute inset-x-0 h-1 bg-[#D9C3B0] shadow-[0_0_8px_rgba(217,195,176,0.6)] animate-pulse" style={{ top: "40%" }}></div>
                  </div>

                  <div className="text-center space-y-1.5">
                    <p className="text-xs font-bold text-stone-800 animate-pulse">🚀 正在对特征进行智能提取与比对...</p>
                    <p className="text-[10px] text-stone-400">正在检索广东省在园小熊猫/熊科/猫科动物 234 例样本...</p>
                  </div>
                </div>
              )}

              {/* Status 3: Success match */}
              {aiScannerState.status === "success" && (
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <div className="w-44 h-44 rounded-2xl overflow-hidden border-2 border-green-500 shadow-md">
                      {aiScannerState.scannedImage && (
                        <img
                          src={aiScannerState.scannedImage}
                          alt="Scanned match"
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                  </div>

                  {/* Recognition report */}
                  <div className="bg-white border-2 border-green-100 p-4 rounded-2xl space-y-3 shadow-sm">
                    <div className="flex justify-between items-center pb-2 border-b border-stone-100">
                      <span className="text-[11px] bg-green-50 text-green-700 px-2 py-0.5 rounded-md font-bold">智能比对报告</span>
                      <span className="text-[10px] text-stone-400 font-mono">置信度: 98.4%</span>
                    </div>

                    <div className="space-y-1.5 text-xs text-stone-700">
                      <p><b>匹配个体：</b>
                        <span className="text-[#B83B26] font-bold">
                          {aiScannerState.scannedImage?.includes("530595467537") ? "小熊猫“迪迪”" : "白狮“阿杭” (时光印记)"}
                        </span>
                      </p>
                      <p><b>常驻馆舍：</b>{aiScannerState.scannedImage?.includes("530595467537") ? "广州动物园 · 小熊猫馆" : "广州动物园 · 狮虎山"}</p>
                      <p><b>核心特征识别：</b></p>
                      <p className="text-[10px] text-stone-500 leading-relaxed bg-stone-50 p-2 rounded-lg border border-stone-150">
                        {aiScannerState.scannedImage?.includes("530595467537") 
                          ? "“红褐色毛色、粗大环纹蓬松尾巴与面部特征”完全吻合；树栖攀爬体态相符，核定度极高。" 
                          : "独特的“齐刘海/偏分发型”轮廓与原比对库12套模板中的‘微偏分状态’完全对齐。"
                        }
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <button
                      onClick={() => {
                        // Pre-fill "paopao" or "ahang" as target
                        const isDidi = aiScannerState.scannedImage?.includes("530595467537");
                        const targetId = isDidi ? "paopao" : "ahang";
                        setObsSelectedAnimalId(targetId);
                        setObsLocation(isDidi ? "广州动物园 小熊猫馆" : "广州动物园 狮虎山");
                        setObsUploadStep(1);
                        setObsIsSubmitted(false);
                        // Redirect to form observation
                        setViewState({ type: "form_observation" });
                        triggerToast("已为您加载识别信息，请填写具体的日常观察细节！");
                      }}
                      className="w-full bg-[#2F5233] hover:bg-[#203a24] text-white text-xs font-semibold py-3 rounded-xl transition-all shadow-sm flex items-center justify-center space-x-1"
                    >
                      <span>直接前往上传观察记录</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => setAiScannerState({ status: "idle", scannedImage: null })}
                      className="w-full bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold py-2.5 rounded-xl transition-all"
                    >
                      重新上传 / 分析其他照片
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>


        {/* ==================== 8. MOCK OBSERVATION MODAL (日常观察快捷记录弹窗) ==================== */}
        {showObsModal && (
          <div className="absolute inset-0 bg-stone-900/60  flex items-end z-50 animate-fade-in" id="observation-modal-overlay">
            <div className="bg-[#FAF8F5] rounded-t-[32px] w-full p-6 space-y-4 max-h-[80%] overflow-y-auto shadow-2xl animate-slide-up border-t border-stone-200">
              
              <div className="flex justify-between items-center pb-2 border-b border-stone-100">
                <h3 className="text-sm font-bold text-stone-900">上传一次日常观察记录</h3>
                <button
                  onClick={() => setShowObsModal(false)}
                  className="p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full"
                  title="关闭"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddObservationSubmit} className="space-y-4">
                {/* Animal Select */}
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 mb-1">选择观察的个体</label>
                  <select
                    value={obsModalAnimalId}
                    onChange={(e) => setObsModalAnimalId(e.target.value)}
                    className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-[#2F5233]"
                    id="obs-form-animal-select"
                  >
                    {animals.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.species} · {a.zoo})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Category Select */}
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 mb-1.5">它正在干什么？(行为标记)</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { id: "resting", label: "💤 休息" },
                      { id: "feeding", label: "🥩 进食" },
                      { id: "playing", label: "⚽ 嬉戏" },
                      { id: "moving", label: "🐾 散步" }
                    ].map(cat => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setObsForm({ ...obsForm, category: cat.id as any })}
                        className={`py-2 text-[10px] font-bold rounded-lg border transition-all ${
                          obsForm.category === cat.id
                            ? "bg-[#2F5233] text-white border-[#2F5233]"
                            : "bg-white text-stone-600 border-stone-200 hover:border-stone-300"
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Text Description */}
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 mb-1">日常见闻 / 行为描述</label>
                  <textarea
                    rows={3}
                    placeholder="今天它精神如何？有没有独特的姿态？或者有什么有趣的细节..."
                    value={obsForm.text}
                    onChange={(e) => setObsForm({ ...obsForm, text: e.target.value })}
                    className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#2F5233]"
                    id="obs-form-text-input"
                  ></textarea>
                </div>

                {/* Upload Image box mock */}
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 mb-1.5">观察实拍图 (点击模拟选择)</label>
                  <div
                    onClick={() => {
                      const target = animals.find(a => a.id === obsModalAnimalId);
                      setObsForm({
                        ...obsForm,
                        image: getSpeciesDefaultImage(target ? target.species : "African Lion")
                      });
                      triggerToast("已模拟选择现场实拍照片 📸");
                    }}
                    className="h-24 border-2 border-dashed border-stone-300 hover:border-[#2F5233] rounded-xl flex flex-col items-center justify-center bg-stone-50 cursor-pointer overflow-hidden relative"
                  >
                    {obsForm.image ? (
                      <>
                        <img src={obsForm.image} alt="obs-upload" className="w-full h-full object-cover" />
                        <span className="absolute inset-0 bg-stone-900/40 flex items-center justify-center text-white text-[9px] font-bold">
                          点击重新选择
                        </span>
                      </>
                    ) : (
                      <>
                        <Camera className="w-6 h-6 text-stone-400 mb-0.5" />
                        <span className="text-[10px] text-stone-500 font-bold">选择现场照片</span>
                      </>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#2F5233] hover:bg-[#203a24] text-white text-xs font-semibold py-3 rounded-xl transition-all shadow-sm"
                  id="obs-form-submit-btn"
                >
                  发布记录
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ==================== MOCK UPLOAD MEMORY MODAL (上传互联网记忆弹窗) ==================== */}
        {showUploadMemoryModal && (
          <div className="absolute inset-0 bg-stone-900/60  flex items-end z-50 animate-fade-in" id="upload-memory-modal-overlay">
            <div className="bg-[#FAF8F5] rounded-t-[32px] w-full p-6 space-y-4 max-h-[85%] overflow-y-auto shadow-2xl animate-slide-up border-t border-stone-200">
              
              <div className="flex justify-between items-center pb-2 border-b border-stone-100">
                <div>
                  <h3 className="text-sm font-serif font-bold text-stone-900 flex items-center space-x-1.5">
                    <Plus className="w-4 h-4 text-[#B83B26]" />
                    <span>上传一段互联网记忆</span>
                  </h3>
                  <p className="text-[10px] text-stone-400">将它曾经存在并被记住的互联网痕迹归档于此</p>
                </div>
                <button
                  onClick={() => setShowUploadMemoryModal(false)}
                  className="p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full"
                  title="关闭"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUploadMemorySubmit} className="space-y-3.5 text-xs">
                {/* Content Type */}
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 mb-1">内容分类</label>
                  <select
                    value={uploadMemoryForm.contentType}
                    onChange={(e) => setUploadMemoryForm({ ...uploadMemoryForm, contentType: e.target.value as any })}
                    className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#B83B26]"
                  >
                    <option value="screenshot">互联网截图</option>
                    <option value="media">媒体报道</option>
                    <option value="creation">公众创作</option>
                    <option value="old_photo">旧照片</option>
                    <option value="message">纪念留言</option>
                  </select>
                </div>

                {/* Belonging Animal */}
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 mb-1">所属纪念动物</label>
                  <select
                    value={uploadMemoryForm.belongingAnimal}
                    onChange={(e) => setUploadMemoryForm({ ...uploadMemoryForm, belongingAnimal: e.target.value as any })}
                    className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#B83B26]"
                  >
                    <option value="ahang">阿杭 (白狮)</option>
                    <option value="others">更多动物 (大熊猫波波/华南虎珊珊等)</option>
                  </select>
                </div>

                {/* Platform */}
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 mb-1">发布平台</label>
                  <input
                    type="text"
                    required
                    placeholder="例如：微信朋友圈、新浪微博、抖音、小红书等"
                    value={uploadMemoryForm.platform}
                    onChange={(e) => setUploadMemoryForm({ ...uploadMemoryForm, platform: e.target.value })}
                    className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#B83B26]"
                  />
                </div>

                {/* Publish Time */}
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 mb-1">发布时间 (大约日期)</label>
                  <input
                    type="text"
                    placeholder="例如：2022年10月 或 2026年7月15日"
                    value={uploadMemoryForm.publishTime}
                    onChange={(e) => setUploadMemoryForm({ ...uploadMemoryForm, publishTime: e.target.value })}
                    className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#B83B26]"
                  />
                </div>

                {/* Original Link */}
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 mb-1">原始链接 (可选)</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={uploadMemoryForm.originalLink}
                    onChange={(e) => setUploadMemoryForm({ ...uploadMemoryForm, originalLink: e.target.value })}
                    className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#B83B26]"
                  />
                </div>

                {/* Screenshot Description */}
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 mb-1">截图说明 / 归档文字描述</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="请描述截图的内容，或者写下相关的纪念细节、当时的影响..."
                    value={uploadMemoryForm.description}
                    onChange={(e) => setUploadMemoryForm({ ...uploadMemoryForm, description: e.target.value })}
                    className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#B83B26]"
                  ></textarea>
                </div>

                {/* Upload Screenshot MOCK */}
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 mb-1.5">上传截图/照片 (点击载入默认示例图片)</label>
                  <div
                    onClick={() => {
                      setUploadMemoryForm({
                        ...uploadMemoryForm,
                        screenshot: getSpeciesDefaultImage("African Lion")
                      });
                      triggerToast("成功模拟加载了一张纪念截图 📸");
                    }}
                    className="h-20 border-2 border-dashed border-stone-300 hover:border-[#B83B26] rounded-xl flex flex-col items-center justify-center bg-stone-50 cursor-pointer overflow-hidden relative"
                  >
                    {uploadMemoryForm.screenshot ? (
                      <>
                        <img src={uploadMemoryForm.screenshot} alt="preset-screenshot" className="w-full h-full object-cover" />
                        <span className="absolute inset-0 bg-stone-900/40 flex items-center justify-center text-white text-[9px] font-bold">
                          点击更换示例图
                        </span>
                      </>
                    ) : (
                      <>
                        <Camera className="w-5 h-5 text-stone-400 mb-0.5" />
                        <span className="text-[10px] text-stone-500 font-bold">选择文件 / 拖拽上传</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Is Self Authored */}
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 mb-1">是否为本人发布的内容/截图？</label>
                  <select
                    value={uploadMemoryForm.isSelfAuthored}
                    onChange={(e) => setUploadMemoryForm({ ...uploadMemoryForm, isSelfAuthored: e.target.value as any })}
                    className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#B83B26]"
                  >
                    <option value="yes">是，属于本人内容</option>
                    <option value="no">否，仅作为公开网络线索收录</option>
                  </select>
                </div>

                {/* Authorization Status */}
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 mb-1">授权与版权状态声明</label>
                  <select
                    value={uploadMemoryForm.authorizationStatus}
                    onChange={(e) => setUploadMemoryForm({ ...uploadMemoryForm, authorizationStatus: e.target.value as any })}
                    className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#B83B26]"
                  >
                    <option value="本人截图且内容本人发布">本人截图且内容本人发布</option>
                    <option value="仅作为研究线索">仅作为研究线索</option>
                    <option value="已获授权公开">已获授权公开</option>
                    <option value="来源待核实">来源待核实</option>
                  </select>
                </div>

                <div className="pt-2 text-[10px] text-stone-400 italic leading-relaxed">
                  * 提交即同意：您上传的内容将同步用于建立“动物互联网记忆归档”，并依照声明的授权状态进行公开展示。
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#B83B26] hover:bg-[#973121] text-white text-xs font-semibold py-3 rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  确认归档此互联网记忆
                </button>
              </form>
            </div>
          </div>
        )}


        {/* ==================== 8.5 SETTINGS & HELP MODAL (设置与帮助弹窗) ==================== */}
        {showSettingsHelpModal && (
          <div className="absolute inset-0 bg-stone-900/60  flex items-end z-50 animate-fade-in" id="settings-help-modal-overlay">
            <div className="bg-[#FAF8F5] rounded-t-[32px] w-full p-6 space-y-4 max-h-[80%] overflow-y-auto shadow-2xl animate-slide-up border-t border-stone-200">
              <div className="flex justify-between items-center pb-2 border-b border-stone-100">
                <h3 className="text-sm font-bold text-stone-900">设置与帮助</h3>
                <button
                  onClick={() => setShowSettingsHelpModal(false)}
                  className="p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full"
                  title="关闭"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs text-stone-700">
                {/* Info block */}
                <div className="bg-stone-100/60 rounded-xl p-3 space-y-1">
                  <p className="font-bold text-[#2F5233] text-[11px]">PROJECT AHANG · 动物互联网记忆归档</p>
                  <p className="text-[10px] text-stone-500 leading-relaxed">
                    本系统旨在通过公众协作，建立一个针对在园与已离世明星动物的数字纪念空间，留存生命记忆。
                  </p>
                </div>

                {/* Simulated Settings Rows */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-2 border-b border-stone-100">
                    <span className="font-medium">清除浏览器缓存 (还原初始状态)</span>
                    <button 
                      onClick={() => {
                        triggerToast("已重置所有模拟交互状态，数据已还原 ⚙️");
                        setShowSettingsHelpModal(false);
                      }} 
                      className="text-[10px] bg-stone-200 hover:bg-stone-300 px-2.5 py-1 rounded-lg font-bold"
                    >
                      立即重置
                    </button>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b border-stone-100">
                    <span className="font-medium">当前版本</span>
                    <span className="text-stone-500 font-mono">v1.2.0-stable</span>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b border-stone-100">
                    <span className="font-medium">协作网关节点</span>
                    <span className="text-emerald-600 font-bold">连接正常</span>
                  </div>
                </div>

                {/* HIDDEN ADMIN DEMO PORTAL ENTRY (管理员演示入口) */}
                <div className="bg-red-50/60 border border-red-100 rounded-2xl p-4 space-y-2 text-center">
                  <div className="flex items-center justify-center space-x-1.5 text-[#B83B26] font-bold">
                    <Shield className="w-4.5 h-4.5" />
                    <span className="text-xs">管理员演示入口</span>
                  </div>
                  <p className="text-[10px] text-stone-500 leading-normal">
                    点击下方进入已内置排重与名录自动提取功能的后台管理系统 Demo，模拟对观察员投稿的核准流程。
                  </p>
                  <button
                    onClick={() => {
                      setShowSettingsHelpModal(false);
                      setViewState({ type: "admin_panel" });
                      triggerToast("已切换至管理员审核视图 🛡️");
                    }}
                    className="w-full bg-[#B83B26] hover:bg-[#973121] text-white text-[10px] font-bold py-2 rounded-xl transition-all shadow-sm cursor-pointer"
                  >
                    切换至管理员视图
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}


        {/* ==================== 8.6 MY SUBMISSION DETAILS MODAL (我的投稿详情弹窗) ==================== */}
        {showSubDetailsModal && selectedSub && (
          <div className="absolute inset-0 bg-stone-900/60  flex items-end z-50 animate-fade-in" id="sub-details-modal-overlay">
            <div className="bg-[#FAF8F5] rounded-t-[32px] w-full p-6 space-y-4 max-h-[85%] overflow-y-auto shadow-2xl border-t border-stone-200">
              <div className="flex justify-between items-center pb-2 border-b border-stone-100">
                <div>
                  <h3 className="text-sm font-bold text-stone-900">投稿详情</h3>
                  <p className="text-[9px] text-stone-400 font-mono">单号: {selectedSub.id} · 提交于 {selectedSub.submittedAt}</p>
                </div>
                <button
                  onClick={() => {
                    setShowSubDetailsModal(false);
                    setSelectedSub(null);
                  }}
                  className="p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full"
                  title="关闭"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                {/* Photo specimen if present */}
                {selectedSub.photo && (
                  <div className="h-40 rounded-2xl bg-stone-100 overflow-hidden border border-stone-200 shadow-inner">
                    <img src={selectedSub.photo} alt="specimen" className="w-full h-full object-cover" />
                  </div>
                )}

                {/* Header Information */}
                <div className="space-y-1">
                  <span className="text-[10px] bg-[#2F5233]/10 text-[#2F5233] px-2 py-0.5 rounded-full font-bold">
                    关联动物: {selectedSub.animalName}
                  </span>
                  <h4 className="text-sm font-serif font-bold text-stone-900 pt-1">{selectedSub.title}</h4>
                </div>

                {/* Status bar description */}
                <div className="bg-stone-50 border border-stone-150 p-3 rounded-xl space-y-1.5">
                  <div className="flex justify-between items-center text-[10px] font-bold text-stone-700">
                    <span>处理状态</span>
                    <span
                      className={`px-2 py-0.5 rounded-full border text-[9px] font-bold ${
                        selectedSub.status === "official"
                          ? "bg-green-50 text-green-700 border-green-100"
                          : selectedSub.status === "candidate"
                          ? "bg-blue-50 text-blue-700 border-blue-100"
                          : selectedSub.status === "need_supplement"
                          ? "bg-red-50 text-red-700 border-red-100 animate-pulse"
                          : selectedSub.status === "pending"
                          ? "bg-amber-50 text-amber-700 border-amber-100"
                          : selectedSub.status === "submitted"
                          ? "bg-stone-100 text-stone-600 border-stone-200"
                          : "bg-stone-50 text-stone-400 border-stone-100"
                      }`}
                    >
                      {selectedSub.statusLabel}
                    </span>
                  </div>
                  
                  {/* Status explanation */}
                  <p className="text-[10px] text-stone-500 leading-relaxed pt-0.5">
                    {selectedSub.status === "submitted" && "该投稿已安全录入，AI名录预识别系统正在提取文字中的时空标记、照片特征，随后将分发至对应动物展区的协作者队列。"}
                    {selectedSub.status === "pending" && "系统正在等待人工审核。高级审核员将根据‘双重排重数据库’与园方志书，核验图片出处、水印与版权状态。"}
                    {selectedSub.status === "need_supplement" && "资料审核遇到卡点：由于该生命事件的时间戳/常驻馆舍与园方出入较大，急需您补充如票根翻拍、游客自拍或报纸电子版佐证。"}
                    {selectedSub.status === "candidate" && "该条线索已经成功审核并计入‘候选纪念大类’。由于该动物个体暂无官方档案，一旦公众共建线索达到5条，将自动激活其数字纪念卡。"}
                    {selectedSub.status === "official" && "恭喜！您上传的历史细节、见闻或图片，已顺利成为阿杭计划的官方正式守护档案时间轴，永远留存在动物互联网记忆中。"}
                    {selectedSub.status === "rejected" && "该条投稿由于不符合收录标准（如包含敏感环境照、明显的版权风险、广告信息或非该动物园个体）未予以采用，详情请参见下方反馈。"}
                  </p>
                </div>

                {/* Details Story Text */}
                <div className="space-y-1">
                  <span className="font-bold text-stone-400 text-[10px] uppercase tracking-wider">投稿内容详情</span>
                  <p className="bg-white border border-stone-200 p-3.5 rounded-xl leading-relaxed text-stone-700 whitespace-pre-wrap">
                    {selectedSub.details}
                  </p>
                </div>

                {/* Admin detailed Feedback block */}
                {selectedSub.adminComment && (
                  <div className="bg-amber-50/40 border border-amber-100 p-3.5 rounded-xl space-y-1">
                    <span className="font-bold text-[#B83B26] text-[10px] block">管理员审核评语与要求：</span>
                    <p className="text-stone-600 leading-relaxed text-[10px]">
                      {selectedSub.adminComment}
                    </p>
                  </div>
                )}

                {/* Metadata details list */}
                <div className="grid grid-cols-2 gap-3 pt-1 text-[10px] bg-stone-50/50 p-3 rounded-xl border border-stone-150">
                  <div>
                    <span className="font-bold text-stone-400 block uppercase text-[8px]">资料出处与载体</span>
                    <span className="text-stone-700 block mt-0.5 font-medium">{selectedSub.source}</span>
                  </div>
                  <div>
                    <span className="font-bold text-stone-400 block uppercase text-[8px]">授权与版权范围</span>
                    <span className="text-stone-700 block mt-0.5 font-medium">{selectedSub.copyright}</span>
                  </div>
                </div>

                {/* Close Button */}
                <button
                  onClick={() => {
                    setShowSubDetailsModal(false);
                    setSelectedSub(null);
                  }}
                  className="w-full bg-[#2F5233] hover:bg-[#203a24] text-white text-xs font-semibold py-3 rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  返回列表
                </button>
              </div>
            </div>
          </div>
        )}


        {/* ==================== 8.7 GUARDIAN DETAILS MODAL (档案守护人详情弹窗) ==================== */}
        {showGuardianDetailsModal && selectedGuardian && (
          <div className="absolute inset-0 bg-stone-900/60  flex items-end z-50 animate-fade-in" id="guardian-details-modal-overlay">
            <div className="bg-[#FAF8F5] rounded-t-[32px] w-full p-6 space-y-4 max-h-[90%] overflow-y-auto shadow-2xl border-t border-stone-200">
              <div className="flex justify-between items-center pb-2 border-b border-stone-100">
                <div>
                  <h3 className="text-sm font-bold text-[#2F5233] flex items-center space-x-1.5">
                    <Shield className="w-4 h-4" />
                    <span>档案守护人 · 履历详情</span>
                  </h3>
                  <p className="text-[9px] text-stone-400 font-mono">档案编号: {selectedGuardian.id} · 本地节点: {selectedGuardian.city}</p>
                </div>
                <button
                  onClick={() => {
                    setShowGuardianDetailsModal(false);
                    setSelectedGuardian(null);
                  }}
                  className="p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full"
                  title="关闭"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Profile Card Header */}
              <div className="bg-white border border-stone-200 rounded-2xl p-4 flex justify-between items-center">
                <div className="space-y-1">
                  <h4 className="text-sm font-serif font-bold text-stone-900">{selectedGuardian.name}</h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedGuardian.tags.map((tag: string) => (
                      <span key={tag} className="text-[8px] bg-stone-100 text-stone-500 px-1.5 py-0.2 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <span className="inline-block px-2 py-0.5 text-[9px] font-bold bg-[#2F5233]/10 text-[#2F5233] border border-[#2F5233]/20 rounded-full">
                    {selectedGuardian.level}
                  </span>
                  <p className="text-[9px] text-stone-400">当前状态：<span className="text-emerald-700 font-bold">{selectedGuardian.status}</span></p>
                </div>
              </div>

              <div className="space-y-4 text-xs">
                {/* 1. 权限范围 */}
                <div className="space-y-1.5">
                  <span className="font-bold text-stone-400 text-[10px] uppercase tracking-wider block px-1">权限范围</span>
                  <div className="bg-white border border-stone-200 p-3 rounded-xl">
                    <p className="text-stone-700 leading-normal font-medium">{selectedGuardian.permissionScope}</p>
                  </div>
                </div>

                {/* 2. 审核历史 */}
                <div className="space-y-1.5">
                  <span className="font-bold text-stone-400 text-[10px] uppercase tracking-wider block px-1">审核历史 (最近记录)</span>
                  <div className="bg-white border border-stone-200 rounded-xl divide-y divide-stone-100 overflow-hidden shadow-inner max-h-[140px] overflow-y-auto">
                    {selectedGuardian.reviewHistory.length === 0 ? (
                      <p className="p-3 text-stone-400 text-center italic text-[10px]">暂无审核历史记录</p>
                    ) : (
                      selectedGuardian.reviewHistory.map((h: any, idx: number) => (
                        <div key={idx} className="p-2.5 flex justify-between items-start text-[9.5px]">
                          <div className="space-y-0.5 pr-2">
                            <p className="text-stone-700 font-medium leading-relaxed">{h.action}</p>
                            <p className="text-[8px] text-stone-400 font-mono mt-0.5">{h.date}</p>
                          </div>
                          <span className="text-[8.5px] bg-emerald-50 text-emerald-700 px-1.5 py-0.2 rounded font-bold border border-emerald-100 flex-shrink-0">
                            {h.status}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* 3. 错误案例 */}
                <div className="space-y-1.5">
                  <span className="font-bold text-stone-400 text-[10px] uppercase tracking-wider block px-1">争议与错误案例</span>
                  <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-inner">
                    {selectedGuardian.errorCases.length === 0 ? (
                      <div className="p-3.5 text-center text-emerald-700 flex items-center justify-center space-x-1 text-[10px] bg-emerald-50/20">
                        <span>✓</span>
                        <span className="font-bold">该守护人表现优异，暂无争议或错误校核记录</span>
                      </div>
                    ) : (
                      selectedGuardian.errorCases.map((e: any, idx: number) => (
                        <div key={idx} className="p-3 space-y-1 bg-red-50/10 border-l-3 border-l-red-500">
                          <div className="flex justify-between text-[9px] font-bold text-[#B83B26]">
                            <span>【争议】{e.title}</span>
                            <span className="font-mono">{e.date}</span>
                          </div>
                          <p className="text-stone-600 leading-relaxed text-[9px]">
                            {e.reason}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* 4. 培训记录 */}
                <div className="space-y-1.5">
                  <span className="font-bold text-stone-400 text-[10px] uppercase tracking-wider block px-1">培训记录与考核成绩</span>
                  <div className="bg-white border border-stone-200 rounded-xl divide-y divide-stone-100 overflow-hidden shadow-inner">
                    {selectedGuardian.trainingRecords.map((t: any, idx: number) => (
                      <div key={idx} className="p-2.5 flex justify-between items-center text-[9.5px]">
                        <div className="space-y-0.5">
                          <p className="text-stone-700 font-semibold">{t.course}</p>
                          <p className="text-[8px] text-stone-400 font-mono mt-0.5">完成时间：{t.date}</p>
                        </div>
                        <span className="text-[9px] text-[#2F5233] font-bold bg-[#2F5233]/10 px-2 py-0.5 rounded flex-shrink-0">
                          {t.score}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 5. 升降级记录 */}
                <div className="space-y-1.5">
                  <span className="font-bold text-stone-400 text-[10px] uppercase tracking-wider block px-1">等级及状态变更历史</span>
                  <div className="bg-white border border-stone-200 rounded-xl divide-y divide-stone-100 overflow-hidden shadow-inner">
                    {selectedGuardian.promotionDemotionHistory.map((p: any, idx: number) => (
                      <div key={idx} className="p-2.5 space-y-1 text-[9.5px]">
                        <div className="flex justify-between items-center font-bold text-stone-800">
                          <span className="flex items-center space-x-1 text-[#2F5233]">
                            <Sparkles className="w-3 h-3 text-amber-500" />
                            <span>{p.change}</span>
                          </span>
                          <span className="font-mono text-[8px] text-stone-400">{p.date}</span>
                        </div>
                        <p className="text-stone-500 text-[9px] leading-relaxed">
                          原因：{p.reason}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* DEMO INTERACTIVE MANIPULATION BOX (考核机制现场操作演练) */}
                <div className="bg-stone-100 border border-stone-200 rounded-2xl p-4 space-y-2.5">
                  <span className="font-bold text-stone-800 text-[10px] uppercase tracking-wider block">守护人状态模拟管理机制 (Demo 操作)</span>
                  <p className="text-[9px] text-stone-500 leading-relaxed">
                    您可以点击下方操作，模拟系统在检测到准确率波动、培训到期或严重版权争议时，自动/人工触发的升降级或状态冻结：
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        const updated = {
                          ...selectedGuardian,
                          status: "复训中",
                          promotionDemotionHistory: [
                            { date: "2026-07-18", change: "强制要求进入【复训中】状态", reason: "连续审核合规性评估波动，系统触发常态考核红线，要求其在2天内重新研读新规。" },
                            ...selectedGuardian.promotionDemotionHistory
                          ]
                        };
                        setSelectedGuardian(updated);
                        setAdminVolunteerReviewers(prev => prev.map(g => g.id === selectedGuardian.id ? updated : g));
                        triggerToast(`【考核介入】已成功将“${selectedGuardian.name}”状态调整为复训中，并记入变更历史 ⚙️`);
                      }}
                      className="bg-amber-600 hover:bg-amber-700 text-white text-[9.5px] font-bold py-1.5 px-2 rounded-xl transition-colors cursor-pointer"
                    >
                      强制要求复训
                    </button>
                    <button
                      onClick={() => {
                        const updated = {
                          ...selectedGuardian,
                          status: "暂停",
                          permissionScope: "暂无 (权限已被冻结)",
                          promotionDemotionHistory: [
                            { date: "2026-07-18", change: "状态变更为【暂停】", reason: "由于争议撤销率指标偏高或待审核版权抽样合格率低于红线，管理员手动干预并挂起权限。" },
                            ...selectedGuardian.promotionDemotionHistory
                          ]
                        };
                        setSelectedGuardian(updated);
                        setAdminVolunteerReviewers(prev => prev.map(g => g.id === selectedGuardian.id ? updated : g));
                        triggerToast(`【考评挂起】已暂停“${selectedGuardian.name}”的守护人权限并锁定 🔐`);
                      }}
                      className="bg-red-600 hover:bg-red-700 text-white text-[9.5px] font-bold py-1.5 px-2 rounded-xl transition-colors cursor-pointer"
                    >
                      暂停其权限
                    </button>
                    <button
                      onClick={() => {
                        const updated = {
                          ...selectedGuardian,
                          status: "正常",
                          permissionScope: "全展区动物生命史校核、候选档案强制发布权、版权合规申诉仲裁",
                          promotionDemotionHistory: [
                            { date: "2026-07-18", change: "重新恢复【正常】在岗等级状态", reason: "本季度考核准确率、撤销率等指标完美符合要求，通过专项考核恢复活跃档案资格。" },
                            ...selectedGuardian.promotionDemotionHistory
                          ]
                        };
                        setSelectedGuardian(updated);
                        setAdminVolunteerReviewers(prev => prev.map(g => g.id === selectedGuardian.id ? updated : g));
                        triggerToast(`【考评通过】“${selectedGuardian.name}”已被重新恢复正常状态 ✅`);
                      }}
                      className="bg-[#2F5233] hover:bg-[#203a24] text-white text-[9.5px] font-bold py-1.5 px-2 rounded-xl transition-colors col-span-2 cursor-pointer"
                    >
                      通过季度考核并恢复正常
                    </button>
                  </div>
                </div>

                {/* Back Button */}
                <button
                  onClick={() => {
                    setShowGuardianDetailsModal(false);
                    setSelectedGuardian(null);
                  }}
                  className="w-full bg-stone-800 hover:bg-stone-900 text-white text-xs font-semibold py-3 rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  返回列表
                </button>
              </div>
            </div>
          </div>
        )}


        {/* ==================== 9. BOTTOM NAVIGATION BAR (底部导航栏) ==================== */}
        {viewState.type !== "onboarding" && (
          <div className="absolute bottom-0 inset-x-0 bg-[#FAF8F5] border-t border-stone-200 py-1.5 px-3 flex justify-around items-center select-none z-40" id="app-bottom-navbar">
            
            {/* Tab: Home */}
            <button
              onClick={() => setViewState({ type: "main", tab: "home" })}
              className={`flex flex-col items-center justify-center py-1 px-3.5 rounded-2xl transition-all ${
                viewState.type === "main" && viewState.tab === "home"
                  ? "text-[#2F5233]"
                  : "text-stone-400 hover:text-stone-600"
              }`}
              id="nav-tab-home"
            >
              <Home className="w-5 h-5" />
              <span className="text-[9px] font-bold mt-1">首页</span>
            </button>

            {/* Tab: Archives */}
            <button
              onClick={() => setViewState({ type: "main", tab: "archives" })}
              className={`flex flex-col items-center justify-center py-1 px-3.5 rounded-2xl transition-all ${
                viewState.type === "main" && viewState.tab === "archives"
                  ? "text-[#2F5233]"
                  : "text-stone-400 hover:text-stone-600"
              }`}
              id="nav-tab-archives"
            >
              <BookOpen className="w-5 h-5" />
              <span className="text-[9px] font-bold mt-1">动物档案</span>
            </button>

            {/* Floating Highlight Tab: Record/Plus */}
            <button
              onClick={() => setViewState({ type: "main", tab: "record" })}
              className={`w-11 h-11 rounded-full flex items-center justify-center text-white shadow-lg transform active:scale-95 transition-all -translate-y-2 ${
                viewState.type === "main" && viewState.tab === "record"
                  ? "bg-[#B83B26] ring-4 ring-[#B83B26]/35 scale-105"
                  : "bg-[#B83B26]/80 hover:bg-[#B83B26]"
              }`}
              id="nav-tab-record"
            >
              <Plus className="w-5 h-5" />
            </button>

            {/* Tab: Memorial */}
            <button
              onClick={() => setViewState({ type: "main", tab: "memorial" })}
              className={`flex flex-col items-center justify-center py-1 px-3.5 rounded-2xl transition-all ${
                viewState.type === "main" && viewState.tab === "memorial"
                  ? "text-[#2F5233]"
                  : "text-stone-400 hover:text-stone-600"
              }`}
              id="nav-tab-memorial"
            >
              <Heart className="w-5 h-5" />
              <span className="text-[9px] font-bold mt-1">纪念广场</span>
            </button>

            {/* Tab: My Profile */}
            <button
              onClick={() => setViewState({ type: "main", tab: "my" })}
              className={`flex flex-col items-center justify-center py-1 px-3.5 rounded-2xl transition-all ${
                viewState.type === "main" && viewState.tab === "my"
                  ? "text-[#2F5233]"
                  : "text-stone-400 hover:text-stone-600"
              }`}
              id="nav-tab-my"
            >
              <User className="w-5 h-5" />
              <span className="text-[9px] font-bold mt-1">我的</span>
            </button>

          </div>
        )}

      </div>

      {/* Decorative desktop backdrop support panel */}
      <div className="mt-4 text-xs text-stone-500 text-center max-w-sm hidden md:block">
        <p>💡 <b>桌面预览提示：</b>已为您开启手机端 Web 模拟器框架。</p>
        <p className="mt-1">
          你可以自由点击五个底部标签切换独立页面。在“首页”或“记录”中点击上传可上传假数据，所有状态立即生效。
        </p>
      </div>

    </div>
  );
}
