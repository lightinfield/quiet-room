export type SectionKey =
  | 'confession'
  | 'sermons'
  | 'devotions'
  | 'theology'
  | 'counseling'
  | 'reading'
  | 'notes'
  | 'life';

export const SITE = {
  name: '静室',
  subtitle: '在主前安静，默想真道',
  description: '一处安静整理认信、讲道、灵修、神学学习、圣辅课程、阅读与生活实践的个人空间。',
  owner: 'lightinfield',
  repository: 'https://github.com/lightinfield/quiet-room',
};

export const SECTIONS: Record<SectionKey, {
  title: string;
  short: string;
  href: string;
  description: string;
  icon: string;
  groups: { title: string; slug: string; description: string }[];
}> = {
  confession: {
    title: '信仰告白', short: '认信', href: '/confession/', icon: '✦',
    description: '以圣经为最高权威，在历史教会的信经与威斯敏斯特标准中学习清楚地认信。',
    groups: [
      { title: '信经与古代教会', slug: 'historic-creeds', description: '使徒信经、尼西亚信经及早期教会共同信仰。' },
      { title: '威斯敏斯特信条', slug: 'westminster-confession', description: '按章节整理 WCF 的教义结构、经文依据与应用。' },
      { title: '大小要理问答', slug: 'catechisms', description: '大要理与小要理问答的主题式研读。' },
    ],
  },
  sermons: {
    title: '主日证道', short: '证道', href: '/sermons/', icon: '⌂',
    description: '按日期、经卷与系列整理主日圣道，保留大纲、经文与回应。',
    groups: [
      { title: '罗马书系列', slug: 'romans', description: '从福音、称义、成圣到教会生活的连续讲道。' },
      { title: '诗篇系列', slug: 'psalms', description: '在敬拜、患难与盼望中学习向神祷告。' },
      { title: '节期与专题', slug: 'special', description: '复活、圣诞、教会与家庭等专题信息。' },
    ],
  },
  devotions: {
    title: '灵修笔记', short: '灵修', href: '/devotions/', icon: '❧',
    description: '沿着圣经经卷与章节默想，让观察、解释、应用和祷告彼此连贯。',
    groups: [
      { title: '诗篇晨祷', slug: 'psalms-devotion', description: '以诗篇作为每日安静与祷告的入口。' },
      { title: '约翰福音', slug: 'john-devotion', description: '从基督的位格与工作默想福音。' },
      { title: '腓立比书', slug: 'philippians-devotion', description: '在喜乐、谦卑和盼望中学习跟随基督。' },
    ],
  },
  theology: {
    title: '神学课堂', short: '神学', href: '/theology/', icon: '◇',
    description: '按课程系统整理神学笔记，把概念、经文、历史和实践连成体系。',
    groups: [
      { title: '系统神学', slug: 'systematic-theology', description: '圣经论、神论、基督论、救恩论、教会论与末世论。' },
      { title: '圣约神学', slug: 'covenant-theology', description: '从创造、救赎与圣约结构理解整本圣经。' },
      { title: '教会历史', slug: 'church-history', description: '从古代教会、宗教改革到现代改革宗传统。' },
    ],
  },
  counseling: {
    title: '圣辅课程', short: '圣辅', href: '/counseling/', icon: '◦',
    description: '按课程大纲学习圣经辅导，从神学根基、生命更新到具体处境与教会实践。',
    groups: [
      { title: '圣经与辅导基础', slug: 'biblical-foundations', description: '从圣经人论、罪与恩典、成圣、苦难与盼望建立辅导根基。' },
      { title: '心灵与生命更新', slug: 'heart-and-sanctification', description: '整理动机、偶像、悔改、信心、习惯与渐进成圣。' },
      { title: '辅导主题与处境', slug: 'counseling-topics', description: '按婚姻家庭、焦虑惧怕、冲突、哀伤与成瘾等主题学习。' },
      { title: '教会中的辅导实践', slug: 'church-counseling-practice', description: '学习倾听、提问、陪伴、作业、界限、转介与群体牧养。' },
    ],
  },
  reading: {
    title: '读书笔记', short: '读书', href: '/reading/', icon: '▤',
    description: '按书籍类型、作者与主题整理阅读摘要、章节札记与个人回应。',
    groups: [
      { title: '系统神学与教义', slug: 'doctrine-books', description: '教义、信条与改革宗系统神学著作。' },
      { title: '属灵经典', slug: 'spiritual-classics', description: '敬虔、祷告、成圣与牧养传统中的经典著作。' },
      { title: '历史与文化', slug: 'history-culture', description: '教会史、思想史与信仰文化议题。' },
    ],
  },
  notes: {
    title: '要点思考', short: '思考', href: '/notes/', icon: '·',
    description: '从一个明确问题出发，记录经文依据、教义框架与可检验的结论。',
    groups: [
      { title: '救恩与确据', slug: 'salvation', description: '称义、成圣、确据与基督徒自由。' },
      { title: '教会与敬拜', slug: 'church-worship', description: '主日、圣礼、教会治理与公共敬拜。' },
      { title: '文化与伦理', slug: 'culture-ethics', description: '面对时代议题时保持圣经原则与审慎判断。' },
    ],
  },
  life: {
    title: '信仰与生活', short: '生活', href: '/life/', icon: '◎',
    description: '把认信落实到家庭、工作、关系、金钱、苦难与日常操练。',
    groups: [
      { title: '工作与呼召', slug: 'vocation', description: '忠心工作、休息、职业选择与偶像辨识。' },
      { title: '婚姻与家庭', slug: 'family', description: '婚恋预备、婚姻盟约、家庭敬拜与责任。' },
      { title: '教会与团契', slug: 'fellowship', description: '委身地方教会、团契、服事与彼此担当。' },
    ],
  },
};

export const NAV = [
  { title: '首页', href: '/study/' },
  { title: '信仰告白', href: '/confession/' },
  { title: '圣辅课程', href: '/counseling/' },
  { title: '主日证道', href: '/sermons/' },
  { title: '灵修笔记', href: '/devotions/' },
  { title: '神学课堂', href: '/theology/' },
  { title: '读书笔记', href: '/reading/' },
  { title: '要点思考', href: '/notes/' },
  { title: '信仰生活', href: '/life/' },
  { title: '关于', href: '/about/' },
];

export const DAILY_VERSES = [
  { text: '惟喜爱耶和华的律法，昼夜思想，这人便为有福。', ref: '诗篇 1:2' },
  { text: '你的话是我脚前的灯，是我路上的光。', ref: '诗篇 119:105' },
  { text: '你们得救是本乎恩，也因着信；这并不是出于自己，乃是神所赐的。', ref: '以弗所书 2:8' },
  { text: '你们要休息，要知道我是神。', ref: '诗篇 46:10' },
];
