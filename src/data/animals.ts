import { Animal, Contribution, TaskChallenge } from "../types";
import ahangLogo from "../assets/images/ahang_logo_1784366845833.jpg";
import ahangMain from "../assets/animals/ahang/ahang-main.jpg";
import ahangBebei from "../assets/animals/ahang/ahang-bebei.jpg";
import bebeiMain from "../assets/animals/bebei/bebei-main.jpg";
import didiMain from "../assets/images/didi_main_1784708713394.jpg";
import didiBaby from "../assets/images/didi_baby_1784708723141.jpg";
import didiBirthday from "../assets/images/didi_birthday_1784708733257.jpg";

export const MOCK_ANIMALS: Animal[] = [
  {
    id: "ahang",
    name: "阿杭",
    nickname: "齐刘海",
    species: "African Lion",
    scientificName: "Panthera leo",
    speciesCode: "african-lion",
    image: ahangMain,
    imageType: "official_photo",
    status: "deceased",
    institution: "广州动物园",
    city: "广州",
    gender: "雄性",
    lifeSpan: "2009—2026",
    statusLabel: "离世",
    zoo: "广州动物园",
    coverUrl: ahangMain,
    speciesId: "african-lion",
    commonName: "非洲狮",
    englishName: "African Lion",
    tags: ["齐刘海", "温顺", "喜欢晒太阳", "老年动物", "城市记忆"],
    description: "白狮阿杭出生于杭州，2015年来到广州动物园。2022年，因一头会随天气变化的齐刘海，阿杭红遍大江南北，被全国网友亲切地记住。他性格温顺、喜欢晒太阳，是无数街坊与游客的城市记忆。晚年因关节退行性疾病移至后场精心照料，于2026年7月14日安详离世。",
    verified: true,
    verifiedCount: 126,
    memorialEnabled: true,
    summary: "因为一头会随天气变化的齐刘海，被全国网友记住的白狮。",
    infoStatus: "主要资料已核实",
    recordCount: 15,
    gallery: [ahangMain, ahangBebei],
    timeline: [
      {
        year: "2009",
        title: "出生于杭州",
        description: "诞生于杭州野生动物世界，取名“阿杭”以表示它的源头。"
      },
      {
        year: "2015",
        title: "来到广州动物园",
        description: "为了繁育项目合作，长途跋涉来到广州动物园，成为深受欢迎的一员。"
      },
      {
        year: "2022",
        title: "因齐刘海受到全国关注",
        description: "由于岭南潮湿温热天气以及他独特的舔毛习惯，鬃毛自动梳理成了标志性的“齐刘海”，红遍网络。"
      },
      {
        year: "2025",
        title: "因关节退行性疾病迁至后场静养",
        description: "步入老年阶段，由于严重的骨关节炎等退行性疾病转入后场进行安宁疗护，由专家团队精心照料。"
      },
      {
        year: "2026.07.14",
        title: "安详离世",
        description: "在兽医及饲养员的守护中因机能衰竭安详仙逝，带走了无数人的不舍与想念。"
      }
    ],
    observations: [
      {
        id: "obs-1",
        username: "Yy Chan",
        avatar: "",
        date: "2024-06-18 15:20",
        location: "广州动物园 狮虎山",
        text: "阿杭在斜坡下大树荫里休息，今天的鬃毛向右侧分开，看起来像个偏分，依旧是非常温柔安详的样子。给他带了风扇的微风，他舒服地眯着眼睛。",
        image: "",
        likes: 23,
        commentsCount: 2,
        hasLiked: true,
        category: "resting"
      },
      {
        id: "obs-2",
        username: "小雨",
        avatar: "",
        date: "2024-05-02 10:08",
        location: "广州动物园 狮虎山",
        text: "今天下着蒙蒙细雨，阿杭居然没有回内舍，而是在雨中慢悠悠散步。雨水把他的刘海打湿黏在额头上，真像个没带伞的小朋友，呆萌极了。希望阿杭的关节在雨天不要太疼。",
        image: "",
        likes: 18,
        commentsCount: 3,
        category: "moving"
      },
      {
        id: "obs-3",
        username: "星星",
        avatar: "",
        date: "2024-02-11 13:30",
        location: "广州动物园 狮虎山",
        text: "午饭时间，饲养员把牛肉挂在了栖架高处，阿杭看了好几秒，深吸了一口气，然后用力一跃，稳稳地咬住了食物！那一刻，百兽之王的霸气显露无疑！大家都自发鼓起掌来！",
        image: "",
        likes: 31,
        commentsCount: 5,
        category: "feeding"
      }
    ]
  },
  {
    id: "paopao",
    name: "迪迪",
    nickname: "迪迪",
    species: "Red Panda",
    scientificName: "Ailurus fulgens",
    speciesCode: "red-panda",
    image: didiMain,
    imageType: "official_photo",
    status: "in_zoo",
    institution: "广州动物园",
    city: "广州",
    gender: "雄性",
    birthDate: "2022年6月30日",
    lifeSpan: "2022.06.30出生",
    statusLabel: "在园",
    zoo: "广州动物园",
    coverUrl: didiMain,
    speciesId: "red-panda",
    commonName: "小熊猫",
    englishName: "Red Panda",
    tags: ["活泼好动", "喜欢攀爬", "爱观察环境"],
    description: "2022年6月30日出生于广州动物园的小熊猫，活泼好动，喜欢攀爬，是许多游客看着长大的明星动物。",
    verified: true,
    verifiedCount: 98,
    summary: "活泼好动、喜欢攀爬的小熊猫。",
    infoStatus: "主要资料已核实",
    recordCount: 12,
    gallery: [didiMain, didiBaby, didiBirthday],
    timeline: [
      {
        year: "2022.06.30",
        title: "出生",
        description: "在广州动物园出生，由园方与保育团队悉心照料。"
      },
      {
        year: "2023.06.30",
        title: "一周岁生日",
        description: "迪迪迎来一周岁生日，园方和游客共同送上祝福。"
      },
      {
        year: "持续成长",
        title: "持续成长",
        description: "迪迪逐渐长大，保持活泼好动、喜欢攀爬的特点。"
      }
    ],
    observations: [
      {
        id: "obs-paopao-1",
        username: "绿野仙踪",
        avatar: "",
        date: "2025-07-10 11:15",
        location: "广州动物园 小熊猫馆",
        text: "迪迪今天在栖架和树枝间熟练地穿梭攀爬，停在高高的树杈上昂首环顾四周，长长的环纹尾巴在空中保持平衡，特别可爱！",
        image: didiMain,
        likes: 18,
        commentsCount: 2,
        category: "playing"
      },
      {
        id: "obs-paopao-2",
        username: "竹林微风",
        avatar: "",
        date: "2025-06-18 14:30",
        location: "广州动物园 小熊猫馆",
        text: "午后饲养员送来了新鲜的竹叶和水果块，迪迪用敏捷的前爪抓取苹果咬得津津有味，呆萌的样子吸引了许多游客驻足拍照。",
        image: didiBirthday,
        likes: 24,
        commentsCount: 3,
        category: "feeding"
      },
      {
        id: "obs-paopao-3",
        username: "小雨",
        avatar: "",
        date: "2025-05-20 10:00",
        location: "广州动物园 小熊猫馆",
        text: "天气晴朗，迪迪蜷缩在大树杈上闭目养神晒太阳，大大的蓬松尾巴盖在身上，双手抱头睡得沉沉的，真是太治愈了。",
        image: didiBaby,
        likes: 31,
        commentsCount: 1,
        category: "resting"
      }
    ]
  },
  {
    id: "mutou",
    name: "亚洲黑熊“小木头”",
    nickname: "小木头",
    species: "Asian Black Bear",
    scientificName: "Ursus thibetanus",
    speciesCode: "asiatic-black-bear",
    image: "",
    imageType: "official_photo",
    status: "need_info",
    isTestData: true,
    institution: "广州动物园",
    city: "广州",
    gender: "雄性",
    lifeSpan: "2012—至今",
    statusLabel: "候选档案",
    zoo: "广州动物园",
    coverUrl: "",
    speciesId: "asiatic-black-bear",
    commonName: "亚洲黑熊",
    englishName: "Asian Black Bear",
    tags: ["抱着木头", "胸前白V字"],
    description: "广州熊区的一只雄性亚洲黑熊，因其平时常常趴在假山上抱着一截丰容枯木入睡，被常来的游客戏称为“小木头”。他胸前的白色“V”字形斑纹非常对称且细长，喜欢爬到最高处的栖木上眺望远方。该个体的确切引进年份和年龄档案仍有缺失，诚邀公众提供可靠线索。",
    verified: false,
    verifiedCount: 23,
    summary: "经常抱着木头睡觉",
    infoStatus: "名字待确认",
    recordCount: 3,
    timeline: [
      {
        year: "2012左右",
        title: "猜测出生年份",
        description: "根据早期游客照片比对和体型推测，其大致在2012年前后出生。"
      }
    ],
    observations: [
      {
        id: "obs-mutou-1",
        username: "生态守护者",
        avatar: "",
        date: "2025-06-25 14:00",
        location: "广州动物园 熊区",
        text: "小木头今天抱着他的大树枝在水池里快乐地打滚，真是一刻也离不开他的“玩具”。期待有更多了解他的老游客来提供他当年的具体命名情况！",
        image: "",
        likes: 14,
        commentsCount: 0,
        category: "playing"
      }
    ]
  },
  {
    id: "abao",
    name: "亚洲象“阿宝”",
    nickname: "阿宝",
    species: "Asian Elephant",
    scientificName: "Elephas maximus",
    speciesCode: "asian-elephant",
    image: "",
    imageType: "official_photo",
    status: "on_trip",
    isTestData: true,
    institution: "广州动物园",
    city: "广州",
    gender: "雄性",
    lifeSpan: "1980—至今",
    statusLabel: "出差",
    zoo: "广州动物园",
    coverUrl: "",
    speciesId: "asian-elephant",
    commonName: "亚洲象",
    englishName: "Asian Elephant",
    tags: ["会画画", "大象功臣"],
    description: "曾落户于广州动物园的明星亚洲象阿宝，拥有极高智商，曾在行为丰容训练中学会用象鼻握笔进行“创意绘画”。他身躯庞大，但性格非常温顺温和，深得饲养员与大批粉丝的喜爱。",
    verified: true,
    verifiedCount: 61,
    summary: "会画画的明星大象",
    infoStatus: "主要资料已核实",
    recordCount: 12,
    timeline: [
      {
        year: "1980",
        title: "出生于云南西双版纳",
        description: "野外救助个体，幼年时进入专业繁育基地及园区生活。"
      }
    ],
    observations: []
  },
  {
    id: "diandian",
    name: "长颈鹿“点点”",
    nickname: "点点",
    species: "Giraffe",
    scientificName: "Giraffa camelopardalis",
    speciesCode: "giraffe",
    image: "",
    imageType: "official_photo",
    status: "retired",
    isTestData: true,
    institution: "广州动物园",
    city: "广州",
    gender: "雌性",
    lifeSpan: "2005—至今",
    statusLabel: "退休",
    zoo: "广州动物园",
    coverUrl: "",
    speciesId: "giraffe",
    commonName: "长颈鹿",
    englishName: "Giraffe",
    tags: ["高挑优雅", "安详"],
    description: "广州动物园长颈鹿区的退休长辈，身形挺拔、斑纹深红。由于步入老龄期，目前主要在内舍及后花园静养调理，很少在前台展区露面，但每一位来看她的老粉丝都对她满怀思念。",
    verified: true,
    verifiedCount: 42,
    summary: "温和高挑的优雅女士",
    infoStatus: "主要资料已核实",
    recordCount: 9,
    timeline: [
      {
        year: "2005",
        title: "出生于动物园",
        description: "顺利诞下，长腿灵动，因身上梅花斑点极对称而得名点点。"
      }
    ],
    observations: []
  },
  {
    id: "bebei",
    name: "贝贝",
    nickname: "阿杭的伴侣",
    species: "African Lion",
    scientificName: "Panthera leo",
    speciesCode: "african-lion",
    image: bebeiMain,
    imageType: "official_photo",
    status: "deceased",
    institution: "广州动物园",
    city: "广州",
    gender: "雌性",
    lifeSpan: "2025 年末离世",
    statusLabel: "离世",
    zoo: "广州动物园",
    coverUrl: bebeiMain,
    speciesId: "african-lion",
    commonName: "非洲狮",
    englishName: "African Lion",
    tags: ["母狮", "阿杭的伴侣", "喜欢撒娇", "大眼睛"],
    description: "陪伴阿杭多年的白狮贝贝，共同见证了广州动物园许多人的回忆，也是阿杭生命故事中最重要的家庭成员之一。",
    verified: true,
    verifiedCount: 45,
    summary: "陪伴阿杭多年的白狮贝贝，共同见证了广州动物园许多人的回忆，也是阿杭生命故事中最重要的家庭成员之一。",
    infoStatus: "主要资料已核实",
    recordCount: 4,
    timeline: [
      {
        year: "2015",
        title: "共同迁入广州动物园",
        description: "为了繁育与保护项目，同阿杭一起踏上广州的土地，成为了广州动物园狮虎山的主角。"
      },
      {
        year: "2025.12",
        title: "安详离世",
        description: "陪伴了无数广州市民与游客的白狮贝贝，于2025年末寿终正寝，安详离世。"
      }
    ],
    observations: [],
    gallery: [bebeiMain, ahangBebei]
  },
  {
    id: "sunsimiao",
    name: "孙思邈",
    nickname: "思邈",
    species: "Pallas's Cat",
    scientificName: "Otocolobus manul",
    speciesCode: "pallas-cat",
   image: "/animals/sunsimiao/cover.jpg",
coverUrl: "/animals/sunsimiao/cover.jpg",
    imageType: "real",
    status: "deceased",
    institution: "西宁野生动物园",
    city: "西宁",
    gender: "雄性",
    birthYear: "2015",
    deathDate: "2022-10-10",
    lifeSpan: "2015—2022",
    statusLabel: "离世",
    zoo: "西宁野生动物园",
    speciesId: "pallas-cat",
    commonName: "兔狲",
    englishName: "Pallas's Cat",
    isTestData: false,
    memorialEnabled: true,
    tags: ["网红兔狲", "网红顶流", "狲一代", "初代网红"],
    description: "国内较受公众关注的兔狲个体之一，让许多人第一次认识并了解兔狲。",
    summary: "让许多人第一次认识兔狲的明星个体。",
    verified: true,
    verifiedCount: 128,
    infoStatus: "主要资料已核实",
    recordCount: 18,
    timeline: [
      {
        year: "2015",
        title: "救护入院",
        description: "2015年于青海野外获救后，进入西宁野生动物园生活。"
      },
      {
        year: "2021",
        title: "参与人工繁育",
        description: "与孙尚香共同参与西宁野生动物园兔狲人工繁育项目。"
      },
      {
        year: "2022-10-10",
        title: "不幸离世",
        description: "因进食时鸡肉卡喉意外离世，引发广大网友与动物爱好者沉痛悼念。"
      }
    ],
    relationships: [
      {
        type: "breeding_partner",
        animalId: "sunshangxiang",
        label: "繁育伙伴",
        description: "共同参与西宁野生动物园兔狲人工繁育，并育有后代。"
      }
    ],
    relationship: {
      partnerId: "sunshangxiang",
      relationType: "繁育伙伴 (Breeding Partner)",
      description: "共同参与西宁野生动物园兔狲人工繁育，并育有后代。"
    },
    observations: []
  },
  {
    id: "sunshangxiang",
    name: "孙尚香",
    nickname: "香香",
    species: "Pallas's Cat",
    scientificName: "Otocolobus manul",
    speciesCode: "pallas-cat",
    image: "/animals/sunshangxiang/cover.jpg",
    imageType: "real",
    status: "deceased",
    institution: "西宁野生动物园",
    city: "西宁",
    gender: "雌性",
    birthDate: "不详",
    rescueYear: "2019",
    origin: "青海",
    deathMonth: "2025-03",
    deathReason: "肠穿孔",
    lifeSpan: "2025年3月离世",
    statusLabel: "离世",
    zoo: "西宁野生动物园",
    coverUrl: "/animals/sunshangxiang/cover.jpg",
    speciesId: "pallas-cat",
    commonName: "兔狲",
    englishName: "Pallas's Cat",
    isTestData: false,
    memorialEnabled: true,
    tags: ["香香", "大姐头", "擅长攀爬", "狲一代"],
    description: "2019年获救后生活在西宁野生动物园的雌性兔狲。孙尚香体型健壮，喜欢攀爬，也是园内兔狲人工繁育的重要个体之一。",
    summary: "喜欢攀爬、参与园内人工繁育的雌性兔狲。",
    verified: true,
    verifiedCount: 96,
    infoStatus: "主要资料已核实",
    recordCount: 15,
    timeline: [
      {
        year: "2019",
        title: "获救入园",
        description: "2019年在青海大通县获救后被送至西宁野生动物园照料，体型健壮，性格桀骜不驯。"
      },
      {
        year: "2021",
        title: "人工繁育重要个体",
        description: "与孙思邈共同参与西宁野生动物园兔狲人工繁育计划。"
      },
      {
        year: "2025.03",
        title: "不幸离世",
        description: "2025年3月因肠穿孔不幸离世，园方及公众表示沉痛哀悼。"
      }
    ],
    relationships: [
      {
        type: "breeding_partner",
        animalId: "sunsimiao",
        label: "繁育伙伴",
        description: "共同参与西宁野生动物园兔狲人工繁育，并育有后代。"
      }
    ],
    relationship: {
      partnerId: "sunsimiao",
      relationType: "繁育伙伴 (Breeding Partner)",
      description: "共同参与西宁野生动物园兔狲人工繁育，并育有后代。"
    },
    observations: []
  },
  ];

export const MOCK_CONTRIBUTIONS: Contribution[] = [
  {
    id: "contrib-1",
    type: "recommend",
    title: "推荐动物：广州动物园的亚洲黑熊",
    submittedAt: "2026-07-01",
    status: "pending",
    statusLabel: "等待人工审核",
    details: "推荐为黑熊区的“小木头”建立单独的正式档案，提供多角度高清晰比对照片，并描述了其典型的丰容互动行为。"
  },
  {
    id: "contrib-2",
    type: "observation",
    title: "观察记录：阿杭在斜坡下大树荫里休息",
    submittedAt: "2026-07-05",
    status: "approved",
    statusLabel: "已通过",
    details: "公众发布的阿杭近期安详状态记录，经AI特征对比及管理员审核无误，已归入阿杭的时光相册。"
  },
  {
    id: "contrib-3",
    type: "supplement",
    title: "补充资料：补充阿杭2015年到穗的确切日期",
    submittedAt: "2026-06-20",
    status: "rejected",
    statusLabel: "需补充资料",
    details: "提交的引进日期（2015年4月12日）与园方早期简报有出入，请补充当时新闻报道的截图或纸质门票印戳等可靠佐证。"
  }
];

export const TASK_CHALLENGES: TaskChallenge[] = [
  {
    id: "task-1",
    title: "寻找阿杭2015年来广州的准确日期",
    rewardLabel: "“历史见证者”勋章",
    progressText: "已有2个线索，还需要进一步确认",
    actionText: "去看看"
  },
  {
    id: "task-2",
    title: "这只亚洲黑熊叫什么名字",
    rewardLabel: "贡献度 +30",
    progressText: "需要长期观察员协助",
    actionText: "去看看"
  },
  {
    id: "task-3",
    title: "寻找广州动物园1990年代旧导览图",
    rewardLabel: "“记忆发掘师”称号",
    progressText: "寻物历程免审核",
    actionText: "去上传"
  }
];
