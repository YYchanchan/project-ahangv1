import { Species } from "../types";

export const MOCK_SPECIES: Species[] = [
  {
    id: "african-lion",
    biologicalProfile: {
      chineseName: "非洲狮",
      englishName: "African Lion",
      latinName: "Panthera leo",
      kingdom: "Animalia（动物界）",
      phylum: "Chordata（脊索动物门）",
      className: "Mammalia（哺乳纲）",
      order: "Carnivora（食肉目）",
      family: "Felidae（猫科）",
      genus: "Panthera（豹属）",
      species: "Panthera leo"
    },
    basicInfo: {
      captiveLifespan: "约15–20年",
      weight: "雄性 150-250 kg / 雌性 120-182 kg",
      sizeHeight: "肩高 1.0 - 1.2 m / 体长 1.7 - 2.5 m",
      diet: "肉食性（主要捕食斑马、角马、羚羊等）",
      socialStructure: "群居（由一头或数头成年雄性及多头雌性、幼狮组成的狮群）",
      activityTime: "晨昏及夜间活跃，日间多在树荫下休息避暑",
      reproduction: "胎生，每胎 1-4 仔，孕期约 110 天",
      distribution: "撒哈拉以南非洲的大部分地区（历史上曾分布于亚洲、欧洲和整个非洲）",
      habitat: "稀树草原、草地、灌木丛及干燥半沙漠地带",
      iucnStatus: "VU（易危）",
      citesStatus: "附录 II"
    },
    characteristics: [
      {
        title: "狮子的鬃毛与性别差异",
        description: "成年雄性非洲狮通常长有明显的鬃毛，而成年雌性非洲狮通常没有明显鬃毛，这是非洲狮最显著的性别差异之一。雄狮的鬃毛会在成年过程中逐渐发育，其颜色、长度和浓密程度受到年龄、遗传、激素水平、营养和环境等因素影响。较浓密的鬃毛有助于展示成熟状态，也能在争斗中为头颈部提供一定保护。极少数雌狮可能因激素或个体差异出现局部类似鬃毛的毛发，但并不是普遍特征。"
      },
      {
        title: "唯一的群居猫科",
        description: "与其他独来独往的猫科动物不同，非洲狮是高度社会化的动物。狮群通常以雌狮为核心，雌狮之间多为亲属关系，它们共同哺育幼仔、协作狩猎，能够捕食体型远超单只狮子承受极限的大型猎物。"
      }
    ],
    faqs: [
      {
        q: "白狮是不是独立物种？",
        a: "白狮并非独立的狮子亚种，而是非洲狮（克鲁格亚种）的一种极其罕见的隐性基因突变个体。它们的白色毛发是由罕见的隐性基因表达控制，导致体内色素沉积减少而呈现白色或淡乳黄色，眼睛多呈现正常的浅蓝色或金色，但在野外极难隐蔽。"
      },
      {
        q: "狮子的鬃毛为什么会随天气变化？",
        a: "雄狮的鬃毛颜色、密度和丰满度受到体内雄激素（睾酮）水平、年龄、当地气温、空气湿度以及营养状况的共同影响。南方气候高温、潮湿闷热，水分重使粗硬的鬃毛变软下垂；加之某些狮子特有的舔爪理毛习惯，经常像用梳子把发型梳理成平整的“齐刘海”或“偏分”。"
      },
      {
        q: "老年大型猫科动物如何科学养老？",
        a: "随着年龄增长，高龄猛兽（相当于人类80余岁）会出现骨关节炎、牙齿退化、器官衰竭等退行性病变。现代动物园会实行“安宁疗护”：如提供加热地暖与防潮软质铺草，使用去骨研磨绞碎的肉泥以利消化吸收，补充含软骨素的膳食制剂，并配合消炎止痛抗炎药缓解病痛，给予最大生命关怀。"
      },
      {
        q: "为什么动物园里的狮子寿命通常更长？",
        a: "在野外，非洲狮需要面对残酷的领地争夺、食物匮乏、偷猎以及寄生虫和疾病的威胁，平均寿命仅为10-14年。而在现代动物园，配有专业的营养师、全天候的兽医团队以及舒适安稳、没有天敌和竞争对手的环境，加之日常行为丰容和老年疾病管理，其平均寿命（动物园）通常可达约15–20年。"
      },
      {
        q: "白狮为什么主要分布在南非？",
        a: "白狮基因变异最初发现于南非的蒂姆巴瓦蒂（Timbavati）地区。这里的白砂河床和高草丛在特定季节能为白狮提供一定程度的保护色。由于极高的观赏价值，白狮后来多在南非的专业繁育机构和保护区内得到人工保护和繁育，因此南非成为了全球白狮个体最集中的地区。"
      }
    ],
    extendedReading: {
      congeneric: ["美洲虎 (Panthera onca)", "虎 (Panthera tigris)", "豹 (Panthera pardus)", "雪豹 (Panthera uncia)"],
      confamilial: ["猎豹属 (Acinonyx)", "猫属 (Felis)", "猞猁属 (Lynx)", "云豹属 (Neofelis)"],
      articles: ["《克鲁格国家公园的狮群社会学》", "《猫科动物隐性基因突变与白化表现研究》"],
      courses: ["《猫科猛兽行为丰容与饲养管理》", "《现代动物园老年猛兽的安宁医疗实践》"],
      videos: ["【纪录片】塞伦盖蒂的狮群帝国", "广州动物园科普：大猫阿杭的日常舔毛与微气候适应"],
      creativeProducts: ["「白狮阿杭」纪念铜章", "物种科普手账 · 猛兽篇"]
    },
    wildVsZoo: [
      {
        title: "食物来源 Diet & Feeding",
        wild: "主动捕食野牛、斑马等大型猎物。进食极不规律，常需忍受数日饥饿，且群内竞争激烈。",
        zoo: "科学配比的去骨牛肉、羊肉、家禽，定期补充维生素与微量元素。高龄狮会有专属的碎肉泥调理。"
      },
      {
        title: "行为习惯 Behavior & Range",
        wild: "领地范围广达 20 - 400 平方公里。每日大部分时间在巡视领地、高度戒备和夜间高强度捕食中度过。",
        zoo: "生活空间虽有限，但通过气味丰容、玩具丰容、行为训练以及高架栖木等，激发其探索天性和日常活动量。"
      },
      {
        title: "医疗与安全 Safety & Care",
        wild: "生病或受伤后无法获得治疗，常常因伤口感染、无法捕食而导致身体衰弱甚至死亡。",
        zoo: "每日有专职饲养员和兽医观察，定期体检。针对老年狮子提供地暖防潮软草及专属安宁疗护与抗炎止痛药物管理。"
      }
    ]
  },
  {
    id: "red-panda",
    biologicalProfile: {
      chineseName: "小熊猫",
      englishName: "Red Panda",
      latinName: "Ailurus fulgens",
      kingdom: "Animalia（动物界）",
      phylum: "Chordata（脊索动物门）",
      className: "Mammalia（哺乳纲）",
      order: "Carnivora（食肉目）",
      family: "Ailuridae（小熊猫科）",
      genus: "Ailurus（小熊猫属）",
      species: "Ailurus fulgens"
    },
    basicInfo: {
      captiveLifespan: "约12 — 15 年",
      weight: "约 3.0 — 6.2 kg",
      sizeHeight: "体长 50 - 64 cm / 尾长 28 - 48 cm",
      diet: "主食竹叶、竹笋、野果及高纤维特制饼干",
      socialStructure: "独居（除繁殖期外多单独活动）",
      activityTime: "晨昏性（主要在清晨与傍晚活动，白天树栖休息）",
      reproduction: "胎生，通常 1-2 仔，孕期 90-150 天",
      distribution: "喜马拉雅山脉东部至我国西南高山森林",
      habitat: "海拔 2200-4800 米带竹林密集的温带针阔混交林",
      iucnStatus: "EN（濒危）",
      citesStatus: "附录 I"
    },
    characteristics: [
      {
        title: "粗大的环纹尾巴",
        description: "小熊猫拥有一条红褐色与黄白色相间的粗大环纹尾巴，长达30-50厘米。这条尾巴不仅能在高空树枝间攀爬移动时保持身体平衡，还可以在寒冷的冬夜蜷缩睡眠时当作“毛毯”盖在身上保温。"
      },
      {
        title: "擅长攀爬与树栖",
        description: "小熊猫脚底长有密集的绒毛，能够防滑并增加附着力；前后脚掌具有极佳的灵活性，爪长而弯曲，使其能够非常敏捷地在树干、栖架上快速上下攀爬。"
      },
      {
        title: "“伪拇指”与敏捷抓握",
        description: "小熊猫的前爪腕骨上特化形成了一个类似于拇指的骨质突起（伪拇指），使其能够像人类一样用单爪精准地抓握竹枝、剥食竹叶和水果。"
      }
    ],
    wildVsZoo: [
      {
        title: "栖息与活动 Space & Habitat",
        wild: "栖息于高海拔密林竹海，领地广阔但面临生境破碎化与天敌威胁。",
        zoo: "拥有高空栖架、丰富树干与适宜内外舍，享受科学丰容设施。"
      },
      {
        title: "食物来源 Diet & Feeding",
        wild: "需花费大量时间搜寻高营养竹笋与野果，冬季食物较匮乏。",
        zoo: "定时提供新鲜竹叶、高纤维特制饼干、苹果等果蔬，膳食科学平衡。"
      },
      {
        title: "环境与保护 Safety & Care",
        wild: "受盗猎、气候变化及栖息地减少影响，野外种群较为脆弱。",
        zoo: "全天候兽医与保育团队监护，开展科学繁育与公众科普展示。"
      }
    ],
    faqs: [
      {
        q: "小熊猫和大熊猫是同一种动物吗？",
        a: "不是。虽然名称中都有“熊猫”且都以竹子为主食，但在生物分类学上它们属于不同的科。大熊猫属于熊科（Ursidae），而小熊猫属于独立的小熊猫科（Ailuridae）。"
      },
      {
        q: "小熊猫的尾巴有什么用？",
        a: "小熊猫长达30-50厘米的环纹蓬松尾巴在树栖攀爬时起着极为关键的平衡杆作用。此外，在寒冷气候下，小熊猫会把尾巴裹在身上或遮住头部保暖。"
      }
    ],
    extendedReading: {
      congeneric: ["中华小熊猫 (Ailurus styani)"],
      confamilial: ["小熊猫科（Ailuridae）仅存的现生代表"],
      articles: ["《小熊猫伪拇指结构演化与竹食适应机制》", "《高山竹林生境中小熊猫的树栖行为与活动节律》"],
      courses: ["《小熊猫丰容设施设计与树栖动物福利管理》"],
      videos: ["【纪录片】高山森林里的红褐色精灵", "保育员视角：小熊猫迪迪的一天"],
      creativeProducts: ["小熊猫迪迪高空攀爬主题帆布包", "小熊猫环纹尾巴软萌抱枕"]
    }
  },
  {
    id: "asiatic-black-bear",
    biologicalProfile: {
      chineseName: "亚洲黑熊",
      englishName: "Asiatic Black Bear",
      latinName: "Ursus thibetanus",
      kingdom: "Animalia（动物界）",
      phylum: "Chordata（脊索动物门）",
      className: "Mammalia（哺乳纲）",
      order: "Carnivora（食肉目）",
      family: "Ursidae（熊科）",
      genus: "Ursus（熊属）",
      species: "Ursus thibetanus"
    },
    basicInfo: {
      wildLifespan: "20 — 25 年",
      captiveLifespan: "30 — 35 年",
      weight: "雄性 100-200 kg / 雌性 50-125 kg",
      sizeHeight: "体长 1.2 - 1.8 m / 肩高 0.7 - 0.9 m",
      diet: "杂食性（80%以上为植物性食物，如嫩叶、果实、坚果、昆虫、蜂蜜及小动物）",
      socialStructure: "独居（除了繁殖期和哺育期，个体间独立活动，有强烈的领地意识）",
      activityTime: "昼行性或晨昏活跃（在靠近人类居住区的地方，可能转为夜间活动）",
      reproduction: "胎生，每胎 1-3 仔，有胚胎延迟着床现象，孕期约 200 天",
      distribution: "亚洲东部及南部的大部分温带和热带森林地带（从伊朗、阿富汗、喜马拉雅到中国、日本、俄罗斯远东）",
      habitat: "落叶阔叶林、针阔混交林、山地灌木丛",
      iucnStatus: "VU（易危）",
      citesStatus: "附录 I"
    },
    characteristics: [
      {
        title: "标志性的胸前月牙",
        description: "亚洲黑熊最为人熟知的特征是其胸部有一块呈“V”字形或半月形的白色或淡黄色斑纹，因此也被俗称为“月熊”（Moon Bear）。这块斑纹在黑色毛发的衬托下格外显眼，在林间具有视觉识别和警示作用。"
      },
      {
        title: "出色的爬树能手",
        description: "虽然体型笨重，但亚洲黑熊拥有非常锋利、弯曲的短爪，这使它们成为熊科动物中最擅长爬树的成员之一。它们常在树上筑巢休憩、躲避危险、或者采摘浆果、坚果和蜂蜜。"
      }
    ],
    faqs: [
      {
        q: "亚洲黑熊会冬眠吗？",
        a: "分布在北方寒冷地区（如俄罗斯远东、日本和中国东北）的亚洲黑熊会在每年的11月到次年3月进行冬眠，体温和代谢率会有所下降。而在南方和热带地区（如海南、东南亚）生活的黑熊，由于终年食物充足，则不会进行冬眠，而是全年保持活跃。"
      },
      {
        q: "“熊瞎子”这个外号是怎么来的？",
        a: "亚洲黑熊俗称“狗熊”或“熊瞎子”。因为它们的视网膜结构较差，视力相对微弱，无法看清远处的静止物体。但是，它们的听觉和嗅觉极其敏锐，尤其是嗅觉甚至比猎犬还要灵敏数倍，可以在数公里外精准定位腐肉、成熟果实或天敌的气味。"
      },
      {
        q: "黑熊胸前都有白色的“V”字吗？",
        a: "绝大多数亚洲黑熊都有这个白色的“月牙”，但形状和面积差异很大。有些个体的月牙极为细长、对称；有些则比较宽厚呈块状；在极少数情况下，也存在胸前完全没有白色斑纹、全黑的特殊个体。"
      }
    ],
    extendedReading: {
      congeneric: ["棕熊 (Ursus arctos)", "北极熊 (Ursus maritimus)", "美洲黑熊 (Ursus americanus)"],
      confamilial: ["大熊猫科 (Ailuropodidae - 熊科近亲)", "眼镜熊属 (Tremarctos)", "懒熊属 (Melursus)"],
      articles: ["《秦岭野生亚洲黑熊的巢穴生境选择与食性分析》", "《月熊自然行为丰容在现代化圈养环境中的应用》"],
      courses: ["《野生熊类野外防冲突与安全指南》", "《黑熊丰容设施设计：从枯木爬架到气味搜索》"],
      videos: ["【纪录片】四川野生黑熊的春季苏醒记录", "广州动物园：看小木头如何抱着枯木花式玩耍"],
      creativeProducts: ["「抱抱月熊」刺绣胸针", "「小木头的枯木」迷你木作摆件"]
    }
  },
  {
    id: "asian-elephant",
    biologicalProfile: {
      chineseName: "亚洲象",
      englishName: "Asian Elephant",
      latinName: "Elephas maximus",
      kingdom: "Animalia（动物界）",
      phylum: "Chordata（脊索动物门）",
      className: "Mammalia（哺乳纲）",
      order: "Proboscidea（长鼻目）",
      family: "Elephantidae（象科）",
      genus: "Elephas（亚洲象属）",
      species: "Elephas maximus"
    },
    basicInfo: {
      wildLifespan: "50 — 60 年",
      captiveLifespan: "60 — 70 年",
      weight: "3000 — 5000 kg",
      sizeHeight: "肩高 2.4 - 3.2 m / 体长 5.5 - 6.4 m",
      diet: "植食性（主要捕食草、树叶、嫩枝、树皮、果实、根茎等）",
      socialStructure: "群居（由最年长的雌象作为首领带领的家族群，雄象多单飞或组成临时单身汉群）",
      activityTime: "全天候（清晨、傍晚及夜间更活跃，白天气温高时在森林庇护所休息）",
      reproduction: "胎生，通常单胎，哺乳期可达2年，孕期长达 20-22 个月",
      distribution: "南亚和东南亚的 13 个国家（中国仅分布于云南西双版纳、普洱和临沧）",
      habitat: "热带雨林、季雨林、常绿阔叶林和灌木草丛",
      iucnStatus: "EN（濒危）",
      citesStatus: "附录 I"
    },
    characteristics: [
      {
        title: "万能的“象鼻”",
        description: "象鼻是由肌肉、血管和神经组成的极为复杂的无骨器官，拥有超过4万块肌肉纤维。它不仅是亚洲象的呼吸、嗅觉和饮水器官，还像人类的双手一样灵巧。它们能用象鼻捡起地上的细小硬币，甚至在行为训练中学会握着画笔进行极具艺术感的绘画。"
      },
      {
        title: "惊人的记忆与情感",
        description: "“大象永不忘记”并非传说。亚洲象拥有极其发达的大脑，其颞叶高度复杂。它们能记住数十年前的水源位置、辨别复杂的音调，甚至表现出强烈的同理心、悲伤与哀悼行为。在家族成员离世时，象群常会聚集在遗骨旁久久不肯离去。"
      }
    ],
    faqs: [
      {
        q: "亚洲象和非洲象有什么区别？",
        a: "最直观的区别在于：1. 耳朵：亚洲象耳朵较小、边缘向后，非洲象耳朵极大形似非洲地图。2. 头部：亚洲象头顶有两个隆起的“智慧瘤”，非洲象额头平滑。3. 象牙：亚洲象只有部分雄象长出外露的白象牙，非洲雄雌象均长牙。4. 象鼻端：亚洲象鼻端有一个“手指”（突起），非洲象有两个。"
      },
      {
        q: "大象为什么要往身上喷泥巴和沙子？",
        a: "大象皮肤虽厚达2.5厘米，但皮肤褶皱间十分敏感，且缺乏汗腺。往身上喷洒泥水或沙土，不仅能帮助它们在高温下蒸发降温，泥土变干后还能形成一道物理防线，有效阻挡蚊虫叮咬、寄生虫侵袭并防范强烈的紫外线辐射。"
      },
      {
        q: "大象是如何进行远距离沟通的？",
        a: "除了人们常听到的响亮象鸣，大象还会发出低频的“次声波”。这种声波频率低于20赫兹，人类耳朵无法察觉，但却能在地面和空气中传播数公里甚至十公里以上。大象通过脚底和象鼻的敏感感受器，能感知来自远方的震动，实现精细的信息传递。"
      }
    ],
    extendedReading: {
      congeneric: ["无其他现存同属物种 - 亚洲象属为单型属"],
      confamilial: ["非洲草原象 (Loxodonta africana)", "非洲森林象 (Loxodonta cyclotis)"],
      articles: ["《云南西双版纳野生亚洲象种群数量与迁移路线动态评估》", "《大象次声波测听与其高度社会化家族的远距离信息互通研究》"],
      courses: ["《亚洲象的野外足迹识别与栖息地修复技术》", "《人象冲突缓解（Mitigation）与社区共存科普》"],
      videos: ["【纪录片】2021云南亚洲象“北上”奇流记", "广州动物园历史回顾：老象阿宝的行为训练时光"],
      creativeProducts: ["「阿宝的画布」纯棉印花艺术方巾", "象鼻创意笔架陶瓷摆件"]
    }
  },
  {
    id: "giraffe",
    biologicalProfile: {
      chineseName: "长颈鹿",
      englishName: "Giraffe",
      latinName: "Giraffa camelopardalis",
      kingdom: "Animalia（动物界）",
      phylum: "Chordata（脊索动物门）",
      className: "Mammalia（哺乳纲）",
      order: "Artiodactyla（偶蹄目）",
      family: "Giraffidae（长颈鹿科）",
      genus: "Giraffa（长颈鹿属）",
      species: "Giraffa camelopardalis"
    },
    basicInfo: {
      wildLifespan: "15 — 20 年",
      captiveLifespan: "25 — 28 年",
      weight: "雄性 900-1400 kg / 雌性 700-1100 kg",
      sizeHeight: "肩高 2.5 - 3.5 m / 总高度达 4.5 - 5.8 m",
      diet: "植食性（主要以金合欢树叶、灌木嫩芽、花朵和果实为食）",
      socialStructure: "松散群居（由多头雌鹿与幼鹿组成的无等级松散群体，成年雄鹿多独来独往）",
      activityTime: "晨昏活跃，日间多反刍和站立休息，夜间睡眠时间极短",
      reproduction: "胎生，通常单胎，小鹿出生时需承受约2米高的“高空坠落”，孕期约 450 天",
      distribution: "非洲大草原、干旱稀树灌木丛地带",
      habitat: "稀树草原、落叶灌木林地和干旱平原",
      iucnStatus: "VU（易危）",
      citesStatus: "附录 II"
    },
    characteristics: [
      {
        title: "高海拔的“超级心脏”",
        description: "长颈鹿的脖子长达2米，为了将血液输送至高达6米的头部，它们拥有一颗重达11公斤、每分钟跳动达150次以上的“超级心脏”，血压是人类的近3倍。当它们低头喝水时，脑部的网状小动脉系统（奇网）能缓冲血压骤变，防止脑溢血。"
      },
      {
        title: "蓝紫色的抗紫外线“长舌”",
        description: "长颈鹿拥有一条长达45-50厘米的舌头。神奇的是，舌头的颜色是蓝黑色或紫色的。这种深色在它们全天暴露于烈日下采摘树叶时，能起到极强的防晒抗紫外线作用。舌头上覆盖着坚韧的黏液和角质，能轻松卷食带刺的金合欢树叶而不受伤。"
      }
    ],
    faqs: [
      {
        q: "长颈鹿的脖子那么长，它的颈椎骨比人多吗？",
        a: "不多。和绝大多数哺乳动物（包括人类、老鼠和小猫）一样，长颈鹿的脖子同样只有“7块”颈椎骨。只不过它们的每一块颈椎骨都高度特化，长度可达25-30厘米，通过强韧的项韧带和巨大的肌肉群相连，赋予了它们高空采食的绝对优势。"
      },
      {
        q: "长颈鹿是怎么睡觉的？它们会躺下吗？",
        a: "长颈鹿是陆地上睡眠最少的动物之一，每天深度睡眠仅20-30分钟，且通常被拆分为每次仅几分钟的零星打盹。在野外，它们多是站立睡觉以保持警惕。只有在感到绝对安全的极少数情况下，它们才会把四肢折叠、把脖子弯成圆弧枕在臀部进行短暂的趴卧睡眠。"
      },
      {
        q: "长颈鹿会发出声音吗？它们是哑巴吗？",
        a: "长颈鹿绝对不是哑巴。虽然由于气管太长、声带结构特殊，它们极少发出人类能听到的叫声。但在夜间或遇到危险时，长颈鹿会发出低沉的哼声、呼啸声和打喷嚏声。研究表明，它们还会在夜间群组中发出低频的“哼鸣声”（Humming），用于维持团队凝聚。"
      }
    ],
    extendedReading: {
      congeneric: ["网纹长颈鹿 (Giraffa reticulata)", "南方长颈鹿 (Giraffa giraffa)", "北方长颈鹿 (Giraffa camelopardalis)"],
      confamilial: ["霍加狓 (Okapia johnstoni) - 长颈鹿科仅存的另一成员"],
      articles: ["《长颈鹿心血管系统生理特化与重力对抗机制》", "《非洲撒哈拉以南金合欢树与长颈鹿的协同进化》"],
      courses: ["《草食性超大型哺乳动物的行为观察与丰容》", "《现代动物园高空料架设计与长颈鹿蹄病防治》"],
      videos: ["【纪录片】金合欢下的高个子旅行者", "科普讲解：长颈鹿点点优雅伸舌采食的物理奥秘"],
      creativeProducts: ["「点点的身高尺」木质壁挂尺", "长颈鹿斑纹天然手工冷制皂"]
    }
  },
  {
    id: "rhesus-macaque",
    biologicalProfile: {
      chineseName: "猕猴",
      englishName: "Rhesus Macaque",
      latinName: "Macaca mulatta",
      kingdom: "Animalia（动物界）",
      phylum: "Chordata（脊索动物门）",
      className: "Mammalia（哺乳纲）",
      order: "Primates（灵长目）",
      family: "Cercopithecidae（猴科）",
      genus: "Macaca（猕猴属）",
      species: "Macaca mulatta"
    },
    basicInfo: {
      wildLifespan: "15 — 20 年",
      captiveLifespan: "25 — 30 年",
      weight: "雄性 7.7 - 14.9 kg / 雌性 5.3 - 10.9 kg",
      sizeHeight: "体长 47 - 64 cm / 尾长 19 - 30 cm",
      diet: "杂食性（主要以果实、种子、嫩叶、花蕾为食，也捕食昆虫、鸟蛋和小脊椎动物）",
      socialStructure: "复杂的母系社会群居（多达 20-200 只，由多个雌性亲属系统和严苛的顺位等级统治）",
      activityTime: "昼行性（日间非常活跃，在树林和地面奔跑嬉戏，夜间多在树顶宿营）",
      reproduction: "胎生，每胎1仔，极少双胞胎，孕期约 165 天",
      distribution: "南亚、东南亚以及中国广大地区（包括海南、四川、广东、广西等）",
      habitat: "温带森林、亚热带常绿阔叶林、草灌丛地带，甚至能在城市边缘生存",
      iucnStatus: "LC（无危）",
      citesStatus: "附录 II"
    },
    characteristics: [
      {
        title: "精细的阶级社会",
        description: "猕猴群体是一个严苛且组织精密的顺位等级社会。猴王通常拥有绝对的交配权和食物优先享用权。其社会结构以母系为基础，女儿的社会地位往往直接继承自母亲。成员之间通过极为丰富的面部表情、叫声和互相理毛来沟通感情、结成同盟。"
      }
    ],
    faqs: [
      {
        q: "为什么猴子之间喜欢互相“抓虱子”？",
        a: "猴子互相梳理毛发（Grooming）不仅是为了清理皮肤碎屑、盐晶或寄生虫，更是一种极重要的“社交语言”。通过轻柔的理毛，猴子体内会释放内啡肽，起到舒缓压力、建立信任、巩固结盟的作用。低顺位猴子常通过给高顺位猴子理毛来寻求保护和化解冲突。"
      },
      {
        q: "什么是猴子的“颊囊”？有什么用？",
        a: "猕猴在演化中长出了名为“颊囊”的特殊器官。它位于双颊内侧，类似于两个皮质口袋。当发现大量食物而天敌或竞争对手在场时，猕猴会迅速将食物塞满颊囊，使脸颊看起来鼓鼓的。随后它们会逃到安全的树顶，再慢慢把食物挤回嘴里细嚼慢咽。"
      },
      {
        q: "猕猴的智商有多高？",
        a: "猕猴是智商极高的灵长类动物，具有出色的空间记忆力、逻辑推理能力和解决问题的技巧。它们可以使用简单的工具（如石头砸开坚果），能够理解数概念、识别同伴复杂的社会关系，并在医学和航天科学史上做出了卓越的贡献。"
      }
    ],
    extendedReading: {
      congeneric: ["蟹奴猕猴 (Macaca fascicularis)", "藏酋猴 (Macaca thibetana)", "豚尾猴 (Macaca nemestrina)"],
      confamilial: ["长尾猴属 (Cercopithecus)", "狒狒属 (Papio)", "金丝猴属 (Rhinopithecus)"],
      articles: ["《社会等级压力对猕猴免疫系统表达的相关机制探讨》", "《颊囊演化在旧大陆猴科动物采食竞争中的生态学意义》"],
      courses: ["《野生猕猴群落的行为解码与人类冲突调和》", "《现代动物园猴山环境丰富度提升与社会性管理》"],
      videos: ["【纪录片】猴群部落：阶级与谋略", "广州动物园科普：猕猴与它们的颊囊储存妙招"],
      creativeProducts: ["「猴山果实」毛毡挂件", "猕猴群落科普艺术插画海报"]
    }
  },
  {
    id: "pallas-cat",
    biologicalProfile: {
      chineseName: "兔狲",
      englishName: "Pallas's Cat",
      latinName: "Otocolobus manul",
      kingdom: "Animalia（动物界）",
      phylum: "Chordata（脊索动物门）",
      className: "Mammalia（哺乳纲）",
      order: "Carnivora（食肉目）",
      family: "Felidae（猫科）",
      genus: "Otocolobus（兔狲属）",
      species: "Otocolobus manul"
    },
    basicInfo: {
      wildLifespan: "约 6 — 9 年",
      captiveLifespan: "约 8 — 12 年",
      weight: "2.5 - 4.5 kg",
      sizeHeight: "体长 46 - 65 cm / 尾长 21 - 31 cm",
      diet: "肉食性（主要捕食鼠兔、野兔、小型啮齿类及鸟类）",
      socialStructure: "独居（除繁殖期外均单独活动，具有强烈领地意识）",
      activityTime: "晨昏及夜间活动为主，白天常在岩穴或石缝中休憩",
      reproduction: "胎生，每胎 2-6 仔，孕期约 66-75 天",
      distribution: "中亚高山及荒漠草原（包括中国青藏高原、新疆、内蒙古等地）",
      habitat: "高山草甸、荒漠草原、裸岩及灌丛地带",
      iucnStatus: "LC（无危）/ 国家二级保护野生动物",
      citesStatus: "附录 II"
    },
    characteristics: [
      {
        title: "01 圆耳与宽脸",
        description: "耳朵位置较低且呈圆弧形，头部宽扁，有助于在低矮岩石后伏卧隐蔽而不暴露自己。"
      },
      {
        title: "02 浓密长毛",
        description: "拥有猫科动物中最浓密的毛发，腹部和尾部毛发尤其贴密，能完美抵御高寒荒漠的严寒。"
      },
      {
        title: "03 适应寒冷高原",
        description: "适应海拔 3000 - 5000 米的缺氧高寒环境，身体矮胖结实，脂肪积累能力强。"
      },
      {
        title: "04 瞳孔为圆形",
        description: "与大多数小猫收缩成竖缝状瞳孔不同，兔狲的瞳孔在强烈光线下收缩时依然保持圆形。"
      },
      {
        title: "05 短腿与低伏体态",
        description: "四肢短粗，行走时贴近地面低伏潜行，极大提高了在裸岩草甸上的隐蔽捕猎成功率。"
      }
    ],
    faqs: [
      {
        q: "兔狲为什么看起来总是气鼓鼓的？",
        a: "兔狲拥有极浓密贴身的长毛与宽扁的头部，加上低置的圆耳朵，使其面部轮廓显得圆润宽阔，表情冷峻凝重，因此在视觉上给人一种‘愤怒小猫’的呆萌严肃感。"
      },
      {
        q: "为什么兔狲人工繁育难度极高？",
        a: "兔狲长期生活在高寒高海拔干燥地区，自身免疫系统对常见猫科病毒（如弓形虫、猫瘟等）抵抗力极弱，在低海拔湿热环境中幼崽极易发生感染。西宁野生动物园在兔狲救护与人工繁育方面做出了长期艰苦努力。"
      }
    ],
    extendedReading: {
      congeneric: ["兔狲 (Otocolobus manul)"],
      confamilial: ["猫属 (Felis)", "豹猫属 (Prionailurus)", "猞猁属 (Lynx)"],
      articles: ["《青藏高原兔狲栖息地选择与高寒适应机制研究》", "《西宁野生动物园兔狲人工繁育与疾病防控实践》"],
      courses: ["《小型高寒猫科动物的饲养管理与行为丰容》"],
      videos: ["【纪录片】高原上的神秘独行者：兔狲"],
      creativeProducts: ["兔狲立体科普挂件", "高原猫科动物插画海报"]
    }
  },
  {
    id: "giant-panda",
    biologicalProfile: {
      chineseName: "大熊猫",
      englishName: "Giant Panda",
      latinName: "Ailuropoda melanoleuca",
      kingdom: "Animalia（动物界）",
      phylum: "Chordata（脊索动物门）",
      className: "Mammalia（哺乳纲）",
      order: "Carnivora（食肉目）",
      family: "Ursidae（熊科）",
      genus: "Ailuropoda（大熊猫属）",
      species: "Ailuropoda melanoleuca"
    },
    basicInfo: {
      wildLifespan: "约 15 — 20 年",
      captiveLifespan: "约 20 — 30 年",
      weight: "约 80 - 120 kg",
      sizeHeight: "体长 1.2 - 1.9 m / 肩高 60 - 90 cm",
      diet: "肉食目但主要以竹类为主食（占食物 99%）",
      socialStructure: "独居（除发情期与育幼期外单独活动，具有领地意识）",
      activityTime: "晨昏与昼夜交替活动为主，大部分时间用于取食和休息",
      reproduction: "胎生，每胎 1-2 仔，孕期约 83-181 天",
      distribution: "中国四川、陕西、甘肃等地高山竹林",
      habitat: "海拔 1200 - 3500 米的高山针阔混交林及竹林地带",
      iucnStatus: "VU（易危）/ 国家一级保护野生动物",
      citesStatus: "附录 I"
    },
    characteristics: [
      {
        title: "01 黑白体色",
        description: "独特的黑白相间毛色在竹林与雪地背景中具有极佳的隐蔽伪装效果，同时有助于体温调节。"
      },
      {
        title: "02 “伪拇指”",
        description: "前掌特化的腕骨（桡侧籽骨）突出形成第六指，能与其余五指灵活对握，极其高效地抓握竹竿与剥离竹皮。"
      },
      {
        title: "03 以竹类为主食",
        description: "虽保留食肉目消化道特征，但适应了高度特化的竹类饮食，每日需花费 10-16 小时大量进食不同部位的竹子。"
      },
      {
        title: "04 独居习性",
        description: "成年大熊猫极具领地意识，除繁殖季节与母幼相伴期外，个体之间保持高度独居和空间距离。"
      },
      {
        title: "05 擅长攀爬",
        description: "强壮的四肢与锋利的爪子使其从小便拥有出色的爬树技能，常在树冠避敌、休养或嬉戏。"
      },
      {
        title: "06 气味与声音交流",
        description: "主要依赖肛门腺分泌物进行气味标记（如蹭树、倒立涂抹），并能通过十几种不同声音传递情绪与交流信号。"
      }
    ],
    faqs: [
      {
        q: "大熊猫为什么要吃竹子？",
        a: "大熊猫属于食肉目，经过长期演化适应，保留了食肉动物的消化系统，同时也演化出了高效切碎竹子的伪拇指和强大咬合力。由于竹子营养密度较低，大熊猫通过大量进食和减少不必要的能量消耗来维持生存。"
      },
      {
        q: "什么是大熊猫的“伪拇指”？",
        a: "大熊猫前掌有一块特化的腕骨（桡侧籽骨），从前掌侧面突出，如同人类的第六根手指（伪拇指）。这根伪拇指与其余五指配合，能够非常灵活地抓握、对折和剥皮各种粗细的竹竿与竹叶。"
      }
    ],
    extendedReading: {
      congeneric: ["大熊猫 (Ailuropoda melanoleuca)"],
      confamilial: ["棕熊 (Ursus arctos)", "黑熊 (Ursus thibetanus)", "马来熊 (Helarctos malayanus)"],
      articles: ["《大熊猫基因组解密与高山竹林适应演化历史》", "《大熊猫伪拇指解剖结构与采食行为学研究》"],
      courses: ["《大熊猫繁育保育与栖息地生态修复工程》"],
      videos: ["【纪录片】大熊猫的隐秘生活", "上海动物园大熊猫科普：风光兄弟的日常丰容"],
      creativeProducts: ["大熊猫竹林手办", "黑白大熊猫纪念手绘明信片"]
    }
  }
];
