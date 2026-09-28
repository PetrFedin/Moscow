import type { Place } from './places';

export const placeChinese: Record<string, Partial<Place>> = {
  'church-st-barbara': {
    title: '圣瓦尔瓦拉教堂',
    subtitle: '一座为瓦尔瓦尔卡街留下名字的教堂',
    district: '基泰戈罗德',
    shortStory: '这条路线的西侧起点展示了一个地点如何在18世纪末至19世纪初的古典主义城市中，继续保存16世纪莫斯科的记忆。',
    tags: ['建筑', '贸易', '瓦尔瓦尔卡街'],
    highlights: [
      '了解瓦尔瓦尔卡街名称的由来',
      '把1514年的石砌教堂与富裕的苏罗日商人群体联系起来',
      '观察罗季翁·卡扎科夫后来的教堂如何保留更早教堂的位置'
    ],
    periods: [
      {
        id: 'st-barbara-1514',
        label: '第一座石砌教堂',
        year: '1514',
        summary: '圣瓦尔瓦拉石砌教堂由阿列维兹·诺维为富裕的苏罗日商人建造。历史资料将这座教堂与“瓦尔瓦尔卡”这一街名的形成联系起来。',
        confidence: 'documented'
      },
      {
        id: 'st-barbara-1804',
        label: '古典主义教堂',
        year: '1796–1804',
        summary: '现存建筑按照罗季翁·卡扎科夫的设计，建在更早教堂所在的位置上，使两个建筑时代在同一地点相连。',
        confidence: 'documented'
      }
    ]
  },
  'romanov-chambers': {
    title: '罗曼诺夫贵族宅邸',
    subtitle: '一座与瓦尔瓦尔卡街共同变化的宅邸',
    district: '基泰戈罗德',
    shortStory: '这是试点中的核心空间点位：通过有文献依据的历史状态、档案图像和经过证据门槛控制的空间重建来理解这座建筑。',
    tags: ['建筑', '17世纪', '瓦尔瓦尔卡街'],
    highlights: [
      '比较19世纪修复前后的立面变化',
      '了解哪些建筑细节得到档案资料支持',
      '把这座宅邸的历史与瓦尔瓦尔卡街的变化联系起来'
    ],
    periods: [
      {
        id: 'romanov-1857',
        label: '修复前',
        year: '1857',
        summary: '档案图像为宅邸修复改造前的状态提供了文献依据。',
        confidence: 'documented'
      },
      {
        id: 'romanov-1883',
        label: '19世纪改造之后',
        year: '1883',
        summary: '19世纪末的照片让我们能够比较立面以及周边城市环境发生的变化。',
        confidence: 'documented'
      }
    ]
  },
  'old-english-court': {
    title: '老英国商馆',
    subtitle: '莫斯科贸易与国际往来',
    district: '扎里亚季耶',
    shortStory: '试点中的第二个空间场景，把16至17世纪的莫斯科贸易、早期俄英关系、后来的建筑改造以及恢复古迹面貌的修复工作联系在一起。',
    tags: ['贸易', '扎里亚季耶', '城市生活'],
    highlights: [
      '了解为什么英国商贸机构会出现在瓦尔瓦尔卡街',
      '区分有文献依据的建筑史与依据修复研究重建的早期外观',
      '追踪这里从贸易商馆到现代博物馆的转变'
    ],
    periods: [
      {
        id: 'english-court-1556',
        label: '英国商馆',
        year: '1556',
        summary: '莫斯科公司成立后，英国商人在瓦尔瓦尔卡街获得了一处商馆。这里成为早期俄英贸易与外交的重要地点。',
        confidence: 'documented'
      },
      {
        id: 'english-court-1960s',
        label: '古迹重新被发现',
        year: '1960年代',
        summary: '彼得·巴拉诺夫斯基在后期改造之下识别出古老宅邸并推动其保护。因此今天所见的早期面貌与学术修复密切相关，并被标记为重建。',
        confidence: 'reconstructed'
      },
      {
        id: 'english-court-1994',
        label: '博物馆开放',
        year: '1994',
        summary: '俄英关系博物馆在修复后的建筑中开放，英国女王伊丽莎白二世参加了开馆活动。',
        confidence: 'documented'
      }
    ]
  },
  'znamensky-cathedral': {
    title: '圣母显兆主教座堂',
    subtitle: '旧皇家庭院的主教座堂',
    district: '基泰戈罗德',
    shortStory: '这座主教座堂把瓦尔瓦尔卡街、显兆修道院、罗曼诺夫家族旧宅以及20世纪的大规模修复工作联系在一起。',
    tags: ['建筑', '罗曼诺夫家族', '修复'],
    highlights: [
      '观察显兆修道院建筑群的核心建筑',
      '理解修道院与罗曼诺夫家族宅邸及皇室支持之间的联系',
      '比较17世纪主教座堂与后来的改建，以及20世纪60至70年代的学术修复'
    ],
    periods: [
      {
        id: 'znamensky-1684',
        label: '17世纪主教座堂',
        year: '1679–1684',
        summary: '现存主教座堂建于1679至1684年，成为显兆修道院建筑群的构图中心。',
        confidence: 'documented'
      },
      {
        id: 'znamensky-1970s',
        label: '历史形态得到恢复',
        year: '1963–1972',
        summary: '一次大型学术修复工程在后期改建和使用之后，使主教座堂的建筑面貌重新接近17世纪末的形态。',
        confidence: 'documented'
      }
    ]
  },
  'varvarka-gates': {
    title: '瓦尔瓦尔卡城门',
    subtitle: '基泰戈罗德消失的城市边界',
    district: '基泰戈罗德',
    shortStory: '路线终点揭示了一条已经消失的城市边界：16世纪基泰戈罗德城墙的大部分地上结构已不复存在，而瓦尔瓦拉塔的基础仍作为受保护遗产保存下来。',
    tags: ['消失的地标', '城墙', '防御工事'],
    highlights: [
      '在今天广场的尺度上想象基泰戈罗德东部边界',
      '了解为什么大部分城墙在20世纪30年代被拆除',
      '发现建于1534至1538年的瓦尔瓦拉塔基础仍保存在基泰戈罗德地铁通道内'
    ],
    periods: [
      {
        id: 'varvarka-gates-1538',
        label: '基泰戈罗德石砌边界',
        year: '1534–1538',
        summary: '基泰戈罗德石砌防御工事于1535年在彼得罗克·马雷主持下开始建设；现存瓦尔瓦拉塔基础通常定年为1534至1538年。',
        confidence: 'documented'
      },
      {
        id: 'varvarka-gates-1934',
        label: '防御工事被拆除',
        year: '1933–1934',
        summary: '拆除瓦尔瓦拉塔的计划在1933年春提出但有所延后。1934年秋，基泰戈罗德城墙的大部分被拆除。',
        confidence: 'documented'
      }
    ]
  }
};
