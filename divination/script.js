// ==================== 数据定义 ====================

// 易经六十四卦
const HEXAGRAMS = [
    { name: "乾", yao: '111111', meaning: '天行健，君子以自强不息', element: '金', direction: '西北', symbol: '䷀' },
    { name: "坤", yao: '000000', meaning: '地势坤，君子以厚德载物', element: '土', direction: '西南', symbol: '䷁' },
    { name: "屯", yao: '010001', meaning: '云雷屯，君子以经纶', element: '水', direction: '北', symbol: '䷂' },
    { name: "蒙", yao: '100010', meaning: '山下出泉，蒙君子以果行育德', element: '水', direction: '东北', symbol: '䷃' },
    { name: "需", yao: '010111', meaning: '云上于天，需君子以饮食宴乐', element: '水', direction: '西北', symbol: '䷄' },
    { name: "讼", yao: '111010', meaning: '天与水违行，讼君子以作事谋始', element: '金', direction: '西北', symbol: '䷅' },
    { name: "师", yao: '000010', meaning: '地中有水，师君子以容民畜众', element: '水', direction: '北', symbol: '䷆' },
    { name: "比", yao: '010000', meaning: '地上有水，比先王以建万国亲诸侯', element: '水', direction: '西南', symbol: '䷇' },
    { name: "小畜", yao: '011111', meaning: '风上天下，小畜君子以懿文德', element: '木', direction: '东南', symbol: '䷈' },
    { name: "履", yao: '111110', meaning: '上天下泽，履君子以辨上下定民志', element: '金', direction: '西北', symbol: '䷉' },
    { name: "泰", yao: '000111', meaning: '天地交泰，后以财成天地之道', element: '土', direction: '东北', symbol: '䷊' },
    { name: "否", yao: '111000', meaning: '天地不交，否君子以俭德辟难', element: '金', direction: '西北', symbol: '䷋' },
    { name: "同人", yao: '111101', meaning: '天与火同人君子以类族辨物', element: '火', direction: '南', symbol: '䷌' },
    { name: "大有", yao: '101111', meaning: '火在天上，大有君子以遏恶扬善', element: '火', direction: '南', symbol: '䷍' },
    { name: "谦", yao: '000100', meaning: '地中有山，谦君子以裒多益寡', element: '土', direction: '东北', symbol: '䷎' },
    { name: "豫", yao: '001000', meaning: '雷出地奋，豫先王以作乐崇德', element: '木', direction: '东', symbol: '䷏' },
    { name: "随", yao: '110001', meaning: '泽中有雷，随君子以向晦入宴息', element: '金', direction: '西', symbol: '䷐' },
    { name: "蛊", yao: '100011', meaning: '山下有风，蛊君子以振民育德', element: '木', direction: '东北', symbol: '䷑' },
    { name: "临", yao: '000110', meaning: '泽上有地，临君子以教思无穷', element: '土', direction: '东北', symbol: '䷒' },
    { name: "观", yao: '011000', meaning: '风行地上，观先王以省方观民设教', element: '木', direction: '东南', symbol: '䷓' },
    { name: "噬嗑", yao: '101001', meaning: '雷电噬嗑先王以明罚敕法', element: '火', direction: '东', symbol: '䷔' },
    { name: "贲", yao: '100101', meaning: '山下有火，贲君子以明庶政', element: '木', direction: '东北', symbol: '䷕' },
    { name: "剥", yao: '100000', meaning: '山地剥，君子以消息盈虚', element: '木', direction: '东北', symbol: '䷖' },
    { name: "复", yao: '000001', meaning: '雷在地中，复先王以至日闭关', element: '木', direction: '东', symbol: '䷗' },
    { name: "无妄", yao: '111001', meaning: '天下雷行，物与无妄', element: '金', direction: '西北', symbol: '䷘' },
    { name: "大畜", yao: '100111', meaning: '天在山中，大畜君子以多识前言往行', element: '木', direction: '西北', symbol: '䷙' },
    { name: "颐", yao: '100001', meaning: '山下有雷，颐君子以慎言语节饮食', element: '木', direction: '东北', symbol: '䷚' },
    { name: "大过", yao: '110011', meaning: '泽灭木，大过君子以独立不惧', element: '金', direction: '西', symbol: '䷛' },
    { name: "坎", yao: '010010', meaning: '水洊至，习坎君子以常德行习教事', element: '水', direction: '北', symbol: '䷜' },
    { name: "离", yao: '101101', meaning: '明两作，离大人以继明照于四方', element: '火', direction: '南', symbol: '䷝' },
    { name: "咸", yao: '110100', meaning: '山上有泽，咸君子以虚受人', element: '土', direction: '东北', symbol: '䷞' },
    { name: "恒", yao: '001011', meaning: '雷风恒，君子以立不易方', element: '木', direction: '东', symbol: '䷟' },
    { name: "遁", yao: '111100', meaning: '天下有山，遁君子以远小人', element: '金', direction: '西北', symbol: '䷠' },
    { name: "大壮", yao: '001111', meaning: '雷在天上，大壮君子以非礼勿履', element: '木', direction: '东', symbol: '䷡' },
    { name: "晋", yao: '101000', meaning: '明出地上，晋君子以自昭明德', element: '火', direction: '南', symbol: '䷢' },
    { name: "明夷", yao: '000101', meaning: '明入地中，明夷君子以莅众', element: '火', direction: '西南', symbol: '䷣' },
    { name: "家人", yao: '011101', meaning: '风自火出，家人君子以言有物而行有恒', element: '木', direction: '东南', symbol: '䷤' },
    { name: "睽", yao: '101110', meaning: '上火下泽，睽君子以同而异', element: '火', direction: '南', symbol: '䷥' },
    { name: "蹇", yao: '010100', meaning: '山上有水，蹇君子以反身修德', element: '水', direction: '东北', symbol: '䷦' },
    { name: "解", yao: '001010', meaning: '雷雨作，解君子以赦过宥罪', element: '木', direction: '东', symbol: '䷧' },
    { name: "损", yao: '100110', meaning: '山下有泽，损君子以惩忿窒欲', element: '木', direction: '东北', symbol: '䷨' },
    { name: "益", yao: '011001', meaning: '风雷益，君子以见善则迁有过则改', element: '木', direction: '东南', symbol: '䷩' },
    { name: "夬", yao: '110111', meaning: '泽上于天，夬君子以施禄及下', element: '金', direction: '西', symbol: '䷪' },
    { name: "姤", yao: '111011', meaning: '天下有风，姤后以施命诰四方', element: '金', direction: '西北', symbol: '䷫' },
    { name: "萃", yao: '110000', meaning: '泽上于地，萃君子以除戎器戒不虞', element: '金', direction: '西', symbol: '䷬' },
    { name: "升", yao: '000011', meaning: '地中生木，升君子以顺德积小以高大', element: '土', direction: '西南', symbol: '䷭' },
    { name: "困", yao: '110010', meaning: '泽无水，困君子以致命遂志', element: '金', direction: '西', symbol: '䷮' },
    { name: "井", yao: '010011', meaning:'井君子 木上有水以劳民劝相', element: '水', direction: '东南', symbol: '䷯' },
    { name: "革", yao: '110101', meaning: '泽中有火，革君子以治历明时', element: '金', direction: '西', symbol: '䷰' },
    { name: "鼎", yao: '101011', meaning: '木上有火鼎，君子以正位凝命', element: '火', direction: '东南', symbol: '䷱' },
    { name: "震", yao: '001001', meaning: '洊雷震，君子以恐惧修省', element: '木', direction: '东', symbol: '䷲' },
    { name: "艮", yao: '100100', meaning: '兼山艮，君子以思不出其位', element: '木', direction: '东北', symbol: '䷳' },
    { name: "渐", yao: '011100', meaning: '山上有木，渐君子以居贤德善俗', element: '木', direction: '东南', symbol: '䷴' },
    { name: "归妹", yao: '001110', meaning: '泽上有雷，归妹天地之大义也', element: '金', direction: '东', symbol: '䷵' },
    { name: "丰", yao: '001101', meaning: '雷电皆至，丰君子以折狱致刑', element: '木', direction: '东', symbol: '䷶' },
    { name: "旅", yao: '101100', meaning: '山上有火，旅君子以明慎用刑', element: '火', direction: '西南', symbol: '䷷' },
    { name: "巽", yao: '011011', meaning: '随风巽君子以申命行事', element: '木', direction: '东南', symbol: '䷸' },
    { name: "兑", yao: '110110', meaning: '丽泽兑君子以朋友讲习', element: '金', direction: '西', symbol: '䷹' },
    { name: "涣", yao: '011010', meaning: '风水涣先王以享于帝立庙', element: '水', direction: '东南', symbol: '䷺' },
    { name: "节", yao: '010110', meaning: '泽上有水，节君子以制数度议德行', element: '水', direction: '西北', symbol: '䷻' },
    { name: "中孚", yao: '011110', meaning: '泽上有风，中孚君子以议狱缓死', element: '金', direction: '西', symbol: '䷼' },
    { name: "小过", yao: '001100', meaning: '山上有雷，小过君子以行过乎恭', element: '木', direction: '东北', symbol: '䷽' },
    { name: "既济", yao: '010101', meaning: '水在火上，既济君子以思患预防', element: '水', direction: '西北', symbol: '䷾' },
    { name: "未济", yao: '101010', meaning: '火在水上，未济君子以慎辨物居方', element: '火', direction: '南', symbol: '䷿' }
];

// 塔罗牌（含详细解释）
const TAROT_CARDS = [
    // 大阿卡纳
    { name: "愚者", meaning: "新的开始、自由、冒险、信任", upright: "热情迎接新开始，勇于冒险，相信直觉", reversed: "鲁莽、缺乏方向、逃避责任", image: "https:// TarotPics.net/1.jpg" },
    { name: "魔术师", meaning: "创造力、技能、意志力、灵感", upright: "把握机会，发挥潜能，创造奇迹", reversed: "技巧不足、误导、潜力浪费" },
    { name: "女祭司", meaning: "直觉、智慧、神秘、潜意识", upright: "倾听内在声音，保持神秘，等待时机", reversed: "冷漠、忽略直觉、过度理性" },
    { name: "皇后", meaning: "丰盛、母性、创造、自然", upright: "接纳滋养，享受成果，发挥创造力", reversed: "依赖、过度保护、创造力受阻" },
    { name: "皇帝", meaning: "权威、稳定、秩序、控制", upright: "建立结构，承担责任，行使权力", reversed: "暴政、 rigid、缺乏弹性" },
    { name: "教皇", meaning: "传统、教导、群体、信仰", upright: "寻求指导，遵循传统，融入群体", reversed: "反叛、标新立异、孤独" },
    { name: "恋人", meaning: "爱情、选择、和谐、伙伴", upright: "美好的结合，清晰的抉择，真爱", reversed: "冲突、不和、错误的选择" },
    { name: "战车", meaning: "胜利、意志、决心、行动", upright: "克服障碍，坚定意志，获得胜利", reversed: "攻击性强、方向不明、失败" },
    { name: "力量", meaning: "勇气、耐心、内在力量、温和", upright: "以柔克刚，勇气耐心，内心强大", reversed: "脆弱、冲动、自我怀疑" },
    { name: "隐士", meaning: "内省、智慧、指引、孤独", upright: "寻求真相，内在智慧，独处思考", reversed: "孤立、过度内省、拒绝帮助" },
    { name: "命运之轮", meaning: "命运、转折、机会、循环", upright: "命运转机，好运来临，把握机会", reversed: "运气不佳、抵制变化、错失良机" },
    { name: "正义", meaning: "公平、真相、法律、因果", upright: "公平正义，真相大白，因果报应", reversed: "不公、逃避责任、虚伪" },
    { name: "倒吊人", meaning: "牺牲、等待、新视角、停滞", upright: "暂停等待，换位思考，甘愿牺牲", reversed: "牺牲过度、拒绝等待、徒劳无功" },
    { name: "死神", meaning: "结束、转变、释放、 rebirth", upright: "旧事物终结，新开始将至，转变", reversed: "拒绝改变、停滞不前、恐惧终结" },
    { name: "节制", meaning: "平衡、耐心、适度、协调", upright: "和谐平衡，耐心等待，适度行动", reversed: "失衡、过度、缺乏耐心" },
    { name: "恶魔", meaning: "束缚、欲望、物质、阴影", upright: "沉迷物质，欲望束缚，需面对阴影", reversed: "摆脱束缚，战胜欲望，重获自由" },
    { name: "塔", meaning: "突变、破坏、觉醒、启示", upright: "突发改变，信念崩塌，必要重建", reversed: "害怕改变、延迟灾难、避免崩塌" },
    { name: "星星", meaning: "希望、灵感、疗愈、灵性", upright: "重新燃起希望，灵感涌现，疗愈", reversed: "绝望、灵感枯竭、失去信念" },
    { name: "月亮", meaning: "幻觉、恐惧、潜意识、梦境", upright: "面对恐惧，梦境启示，直觉敏感", reversed: "恐惧消退，幻觉消失，回归现实" },
    { name: "太阳", meaning: "成功、活力、欢乐、生命力", upright: "生命活力，成功喜悦，纯真快乐", reversed: "暂时阴霾、过度自信、忧虑" },
    { name: "审判", meaning: " rebirth、召唤、评估、宽恕", upright: "内在召唤， rebirth 时刻，评估过往", reversed: "自我否定、拒绝召唤、怀旧" },
    { name: "世界", meaning: "完成、成就、圆满、循环", upright: "目标达成，圆满完成，新的 cycle", reversed: "未完成、拖延、感觉受限" },
    // 小阿卡纳 - 权杖
    { name: "权杖一", meaning: "创意、热情、开始、灵感", upright: "新项目启动，创造力爆发，热情如火" },
    { name: "权杖二", meaning: "选择、计划、可能性、领导", upright: "规划未来，抉择方向，拓展视野" },
    { name: "权杖三", meaning: "远见、扩张、旅行、成长", upright: "视野拓展，团队成长，海外发展" },
    { name: "权杖四", meaning: "庆祝、团结、安宁、繁荣", upright: "欢庆时刻，团队和谐，美好家园" },
    { name: "权杖五", meaning: "竞争、冲突、挑战、多样性", upright: "良性竞争，克服挑战，多元发展" },
    { name: "权杖六", meaning: "胜利、荣誉、凯旋、认可", upright: "获得胜利，赢得荣誉，受到表彰" },
    { name: "权杖七", meaning: "防御、坚持、勇气、挑战", upright: "坚守阵地，勇敢应战，以少胜多" },
    { name: "权杖八", meaning: "行动、速度、旅行、流动", upright: "快速行动，旅程顺利，效率提升" },
    { name: "权杖九", meaning: "韧性、经验、意志、耐心", upright: "经验积累，坚持到底，意志坚定" },
    { name: "权杖十", meaning: "负担、责任、压力、坚持", upright: "重担在肩，需要学会委托" },
    // 圣杯
    { name: "圣杯一", meaning: "爱、喜悦、创意、灵感", upright: "爱情萌芽，喜悦心情，艺术灵感" },
    { name: "圣杯二", meaning: "伙伴、爱情、和谐、选择", upright: "美好关系，两人世界，情感契合" },
    { name: "圣杯三", meaning: "庆祝、友谊、欢聚、创意", upright: "欢庆时刻，朋友相聚，创意合作" },
    { name: "圣杯四", meaning: "反思、观望、选择、忧郁", upright: "审视内心，等待机会，审慎选择" },
    { name: "圣杯五", meaning: "失去、悲伤、接受、放下", upright: "情感失落，学会接受，重新开始" },
    { name: "圣杯六", meaning: "回忆、怀旧、纯真、舒适", upright: "美好回忆，童年纯真，温馨时光" },
    { name: "圣杯七", meaning: "幻想、选择、梦想、迷茫", upright: "幻想丰富，梦想多多，需明辨真假" },
    { name: "圣杯八", meaning: "追寻、放弃、旅程、觉醒", upright: "追寻目标，放弃执着，精神旅程" },
    { name: "圣杯九", meaning: "满足、喜悦、愿望实现", upright: "愿望成真，满足幸福，情感丰收" },
    { name: "圣杯十", meaning: "和谐、团圆、爱、家庭", upright: "家庭和睦，美好愿景，爱的圆满" },
    // 宝剑
    { name: "宝剑一", meaning: "真相、清晰、决定、新思想", upright: "真相大白，清晰思考，新想法诞生" },
    { name: "宝剑二", meaning: "困境、抉择、封闭、僵持", upright: "两难抉择，封闭内心，对峙局面" },
    { name: "宝剑三", meaning: "伤心、失落、痛苦、背叛", upright: "心痛欲绝，情感失落，遭受背叛" },
    { name: "宝剑四", meaning: "休息、恢复、暂停、梦境", upright: "适当休息，暂停恢复，养精蓄锐" },
    { name: "宝剑五", meaning: "冲突、争论、失败、适应", upright: "激烈争论，暂时失败，学会适应" },
    { name: "宝剑六", meaning: "过渡、治愈、疗养、行李", upright: "过渡时期，疗养身心，继续前行" },
    { name: "宝剑七", meaning: "防御、策略、智取、坚持", upright: "巧妙防守，策略取胜，坚守立场" },
    { name: "宝剑八", meaning: "束缚、限制、困惑、 trapped", upright: "身陷困境，限制重重，寻求突破" },
    { name: "宝剑九", meaning: "焦虑、恐惧、噩梦、压力", upright: "焦虑恐惧，压力山大，噩梦困扰" },
    { name: "宝剑十", meaning: "结束、失败、放下、 rebirth", upright: "彻底失败，痛苦结束，放下重获新生" },
    // 星币
    { name: "星币一", meaning: "机会、财富、实物、新开始", upright: "财富机会，物质收获，实物到手" },
    { name: "星币二", meaning: "平衡、选择、资源、灵活", upright: "资源平衡，多重选择，灵活应对" },
    { name: "星币三", meaning: "学习、技能、合作、建设", upright: "学习技能，团队合作，建设发展" },
    { name: "星币四", meaning: "安全、占有、守护、节俭", upright: "财务安全，守护财产，节俭持家" },
    { name: "星币五", meaning: "困难、分离、健康、工作", upright: "经济困难，健康问题，工作挑战" },
    { name: "星币六", meaning: "施舍、慷慨、帮助、 charity", upright: "慷慨施舍，帮助他人， charity 精神" },
    { name: "星币七", meaning: "投资、等待、评估、成果", upright: "投资等待，评估成果，审慎规划" },
    { name: "星币八", meaning: "技能、工作、承诺、精通", upright: "技能精通，工作专注，匠人精神" },
    { name: "星币九", meaning: "富足、独立、成就、收获", upright: "财务自由，个人成就，丰收季节" },
    { name: "星币十", meaning: "富足、 legacy、家庭、继承", upright: "家族财富， legacy 传承，家庭和睦" }
];

// 符文（含解释）
const RUNE_SYMBOLS = [
    { symbol: 'ᚠ', name: 'Fehu', meaning: '财富、丰盛、自由', upright: "物质丰盛，好运来临，财富增长" },
    { symbol: 'ᚢ', name: 'Uruz', meaning: '力量、勇气、健康、活力', upright: "获得力量，恢复健康，勇气倍增" },
    { symbol: 'ᚦ', name: 'Thurisaz', meaning: '挑战、保护、巨人', upright: "克服障碍，守护平安，应对挑战" },
    { symbol: 'ᚨ', name: 'Ansuz', meaning: '智慧、沟通、神性、灵感', upright: "智慧增长，沟通顺畅，神灵启示" },
    { symbol: 'ᚱ', name: 'Raido', meaning: '旅程、迁移、正义、命运', upright: "旅程顺利，命运转折，正义伸张" },
    { symbol: 'ᚲ', name: 'Kaunan', meaning: ' torches、光、热情、问题', upright: "热情如火，照亮黑暗，挑战问题" },
    { symbol: 'ᚷ', name: 'Gebo', meaning: '礼物、交换、 partnership', upright: "美好礼物，合作关系，互惠互利" },
    { symbol: 'ᚹ', name: 'Wunjo', meaning: '喜悦、成功、荣誊、满足', upright: "喜悦成功，荣誉加身，心愿达成" },
    { symbol: 'ᚺ', name: 'Hagalaz', meaning: '破坏、改变、自然、测试', upright: "必要改变，破坏后新生，自然之力" },
    { symbol: 'ᚾ', name: 'Naudiz', meaning: '需要、命运、束缚、智慧', upright: "度过难关，命运智慧，约束成长" },
    { symbol: 'ᛁ', name: 'Isaz', meaning: '冰、暂停、 introspective', upright: "冷静思考，暂停等待，内省时刻" },
    { symbol: 'ᛃ', name: 'Jera', meaning: ' cycle、收获、成功、时间', upright: " cycle 完成，丰收季节，成功在望" },
    { symbol: 'ᛇ', name: 'Eihwaz', meaning: '保护、坚韧、力量、成长', upright: "坚韧不拔，保护之力，精神成长" },
    { symbol: 'ᛈ', name: 'Perthro', meaning: '命运、神秘、机会、赌注', upright: "命运转机，神秘机遇，冒险一搏" },
    { symbol: 'ᛉ', name: 'Algiz', meaning: '保护、防御、 higher self', upright: "神圣保护，防御邪恶，精神升华" },
    { symbol: 'ᛊ', name: 'Sowilo', meaning: '太阳、 victory、荣耀、成功', upright: "胜利在望，荣耀成就，阳光灿烂" },
    { symbol: 'ᛏ', name: 'Tiwaz', meaning: '正义、荣誉、牺牲、 leadership', upright: "正义必胜，荣誉至上，牺牲精神" },
    { symbol: 'ᛒ', name: 'Berkanan', meaning: '新开始、 growth、繁荣', upright: "新的开始，茁壮成长，欣欣向荣" },
    { symbol: 'ᛖ', name: 'Ehwaz', meaning: '移动、信任、伙伴、马', upright: "顺利移动，信任伙伴，携手前进" },
    { symbol: 'ᛗ', name: 'Mannaz', meaning: '自我、智慧、人类、团队', upright: "认识自我，智慧成长，团队协作" },
    { symbol: 'ᛚ', name: 'Laguz', meaning: '水、直觉、流动、 emotion', upright: "直觉敏锐，情绪流动，适应变化" },
    { symbol: 'ᛜ', name: 'Ingwaz', meaning: '内在力量、孕育、种子', upright: "内在积累，孕育新机，种子发芽" },
    { symbol: 'ᛝ', name: 'Othala', meaning: '遗产、根源、拥有、价值', upright: "家族传承，价值连城，根源力量" },
    { symbol: 'ᛟ', name: 'Odal', meaning: ' heritage、 family、 roots', upright: "家族传统，根源连结， heritage 传承" }
];

// 生命灵数
const NUMEROLOGY = [
    { number: 1, name: "创造者", meaning: "独立、领导、创新、勇气", upright: "独立自主，领袖气质，创新精神" },
    { number: 2, name: "调和者", meaning: "合作、平衡、直觉、敏感", upright: "善于合作，追求平衡，直觉敏锐" },
    { number: 3, name: "表达者", meaning: "创意、社交、 joy、乐观", upright: "创意无限，社交达人，快乐传递" },
    { number: 4, name: "建设者", meaning: "稳定、努力、实际、秩序", upright: "稳定可靠，勤奋努力，脚踏实地" },
    { number: 5, name: "自由者", meaning: "变化、冒险、自由、多样", upright: "热爱自由，拥抱变化，冒险精神" },
    { number: 6, name: "教育者", meaning: "责任、关怀、家庭、服务", upright: "责任心强，关爱他人，服务精神" },
    { number: 7, name: "探索者", meaning: "灵性、智慧、内省、寻找", upright: "追求真理，智慧深邃，内省思考" },
    { number: 8, name: "成就者", meaning: "权力、财富、成就、丰盛", upright: "追求成就，财富丰盛，权力掌控" },
    { number: 9, name: "人道主义者", meaning: "博爱、智慧、结束、理想", upright: "博爱无私，智慧圆满，理想主义" },
    { number: 11, name: "启发者", meaning: "直觉、灵性、启发、vision", upright: "直觉强大，灵性启发，视野开阔" },
    { number: 22, name: "大师", meaning: "建设、大业、实践、转化", upright: "建设大师，实践理想，转化世界" },
    { number: 33, name: "奇迹者", meaning: "compassion、master、启发", upright: "慈悲为怀，奇迹创造，灵魂导师" }
];

// 梅花易数 - 体用生克
const MEIHUA = [
    { name: "乾", yao: '111', meaning: "金", direction: "西北", fortune: "大吉", interpretation: "得天时地利，事半功倍", method: "观梅占" },
    { name: "坤", yao: '000', meaning: "土", direction: "西南", fortune: "大吉", interpretation: "土地丰饶，根基稳固", method: "牡丹占" },
    { name: "震", yao: '001', meaning: "木", direction: "东", fortune: "中吉", interpretation: "东方生发，机遇显现", method: "茂树占" },
    { name: "巽", yao: '011', meaning: "木", direction: "东南", fortune: "中吉", interpretation: "风调雨顺，渐进顺利", method: "柳枝占" },
    { name: "坎", yao: '010', meaning: "水", direction: "北", fortune: "中平", interpretation: "坎陷难行，需防小人", method: "池水占" },
    { name: "离", yao: '101', meaning: "火", direction: "南", fortune: "中平", interpretation: "如火如荼，耗散注意", method: "太阳占" },
    { name: "艮", yao: '100', meaning: "土", direction: "东北", fortune: "小吉", interpretation: "止于当止，静待时机", method: "山石占" },
    { name: "兑", yao: '110', meaning: "金", direction: "西", fortune: "小吉", interpretation: "西方收获，成果显现", method: "金刀占" },
    { name: "先天数", yao: 'A', meaning: "1-8", direction: "伏羲", fortune: "数", interpretation: "先天八卦数以定方位", method: "数占" },
    { name: "后天数", yao: 'B', meaning: "1-8", direction: "文王", fortune: "数", interpretation: "后天八卦数以定用神", method: "方位占" },
    { name: "物数", yao: 'C', meaning: "1-10", direction: "万物", fortune: "象", interpretation: "观物象以知吉凶", method: "象占" },
    { name: "声音", yao: 'D', meaning: "1-10", direction: "耳根", fortune: "声", interpretation: "闻其声而占吉凶", method: "声占" },
    { name: "字占", yao: 'E', meaning: "笔画", direction: "文字", fortune: "字", interpretation: "字象数理以决未来", method: "字占" },
    { name: "丈尺", yao: 'F', meaning: "尺寸", direction: "尺度", fortune: "尺", interpretation: "尺丈之数以定规格", method: "尺占" },
    { name: "动物", yao: 'G', meaning: "生肖", direction: "生肖", fortune: "动", interpretation: "见动物而占其性", method: "动物占" },
    { name: "人事", yao: 'H', meaning: "六亲", direction: "人事", fortune: "人", interpretation: "人事变化以观兴衰", method: "人事占" }
];

// 六爻金钱课 - 六十四卦
const LIUYAO = [
    { name: "乾", gan: "甲", zhi: "子", fortune: "上上", interpretation: "元亨利贞，君子有终", wuxing: "金", direction: "西北", type: "纯阳" },
    { name: "坤", gan: "乙", zhi: "未", fortune: "上上", interpretation: "元亨，利牝马之贞", wuxing: "土", direction: "西南", type: "纯阴" },
    { name: "屯", gan: "壬", zhi: "寅", fortune: "中平", interpretation: "元亨利贞，勿用有攸往", wuxing: "水", direction: "北", type: "水雷" },
    { name: "蒙", gan: "癸", zhi: "丑", fortune: "中平", interpretation: "亨，匪我求童蒙", wuxing: "水", direction: "东北", type: "山水" },
    { name: "需", gan: "戊", zhi: "寅", fortune: "中吉", interpretation: "有孚，光亨贞吉", wuxing: "水", direction: "西北", type: "水天" },
    { name: "讼", gan: "戊", zhi: "午", fortune: "下下", interpretation: "有孚窒惕中吉", wuxing: "金", direction: "西北", type: "天水" },
    { name: "师", gan: "癸", zhi: "丑", fortune: "中吉", interpretation: "贞丈人吉无咎", wuxing: "水", direction: "北", type: "地水" },
    { name: "比", gan: "壬", zhi: "申", fortune: "上吉", interpretation: "吉，原筮元永贞", wuxing: "水", direction: "西南", type: "水地" },
    { name: "小畜", gan: "甲", zhi: "辰", fortune: "中平", interpretation: "亨，密云不雨", wuxing: "木", direction: "东南", type: "风天" },
    { name: "履", gan: "庚", zhi: "戌", fortune: "中吉", interpretation: "履虎尾不咥人亨", wuxing: "金", direction: "西北", type: "天泽" },
    { name: "泰", gan: "戊", zhi: "子", fortune: "上上", interpretation: "小往大来吉亨", wuxing: "土", direction: "东北", type: "地天" },
    { name: "否", gan: "癸", zhi: "未", fortune: "下下", interpretation: "否之匪人不利君子贞", wuxing: "金", direction: "西北", type: "天地" },
    { name: "同人", gan: "庚", zhi: "戌", fortune: "中吉", interpretation: "同人于野亨", wuxing: "火", direction: "南", type: "天火" },
    { name: "大有", gan: "己", zhi: "巳", fortune: "上吉", interpretation: "元亨亨", wuxing: "火", direction: "南", type: "火天" },
    { name: "谦", gan: "丙", zhi: "辰", fortune: "上吉", interpretation: "君子有终", wuxing: "土", direction: "东北", type: "地山" },
    { name: "豫", gan: "乙", zhi: "未", fortune: "中吉", interpretation: "利建侯行师", wuxing: "木", direction: "东", type: "雷地" },
    { name: "随", gan: "庚", zhi: "辰", fortune: "中吉", interpretation: "元亨利贞无咎", wuxing: "金", direction: "西", type: "泽雷" },
    { name: "蛊", gan: "辛", zhi: "戌", fortune: "中平", interpretation: "元亨利涉大川", wuxing: "木", direction: "东北", type: "山风" },
    { name: "临", gan: "丁", zhi: "丑", fortune: "中吉", interpretation: "元亨利贞至于八月有凶", wuxing: "土", direction: "东北", type: "地泽" },
    { name: "观", gan: "辛", zhi: "卯", fortune: "中平", interpretation: "盥而不荐有孚颙若", wuxing: "木", direction: "东南", type: "风地" },
    { name: "噬嗑", gan: "庚", zhi: "午", fortune: "中平", interpretation: "亨利用狱", wuxing: "火", direction: "东", type: "火雷" },
    { name: "贲", gan: "丙", zhi: "子", fortune: "中平", interpretation: "亨小利有攸往", wuxing: "木", direction: "东北", type: "山火" },
    { name: "剥", gan: "丙", zhi: "寅", fortune: "下下", interpretation: "不利有攸往", wuxing: "木", direction: "东北", type: "山地" },
    { name: "复", gan: "庚", zhi: "辰", fortune: "中吉", interpretation: "亨出入无疾朋来无咎", wuxing: "木", direction: "东", type: "地雷" },
    { name: "无妄", gan: "庚", zhi: "子", fortune: "中平", interpretation: "元亨利贞其匪正有眚", wuxing: "金", direction: "西北", type: "天雷" },
    { name: "大畜", gan: "辛", zhi: "丑", fortune: "中吉", interpretation: "利贞不家食吉", wuxing: "木", direction: "西北", type: "山天" },
    { name: "颐", gan: "丙", zhi: "寅", fortune: "中平", interpretation: "贞吉观颐自求口实", wuxing: "木", direction: "东北", type: "山雷" },
    { name: "大过", gan: "庚", zhi: "酉", fortune: "下下", interpretation: "栋桤利有攸往亨", wuxing: "金", direction: "西", type: "泽风" },
    { name: "坎", gan: "戊", zhi: "子", fortune: "中平", interpretation: "习坎有孚维心亨", wuxing: "水", direction: "北", type: "坎卦" },
    { name: "离", gan: "己", zhi: "巳", fortune: "中平", interpretation: "利贞亨畜牝牛吉", wuxing: "火", direction: "南", type: "离卦" },
    { name: "咸", gan: "丙", zhi: "辰", fortune: "上吉", interpretation: "亨利贞取女吉", wuxing: "土", direction: "东北", type: "山泽" },
    { name: "恒", gan: "辛", zhi: "酉", fortune: "中吉", interpretation: "亨无咎利贞利有攸往", wuxing: "木", direction: "东", type: "雷风" },
    { name: "遁", gan: "壬", zhi: "申", fortune: "中平", interpretation: "亨小利贞", wuxing: "金", direction: "西北", type: "天山" },
    { name: "大壮", gan: "庚", zhi: "酉", fortune: "中吉", interpretation: "利贞", wuxing: "木", direction: "东", type: "雷天" },
    { name: "晋", gan: "己", zhi: "卯", fortune: "上吉", interpretation: "康侯用锡马蕃庶", wuxing: "火", direction: "南", type: "火地" },
    { name: "明夷", gan: "乙", zhi: "丑", fortune: "下下", interpretation: "利艰贞", wuxing: "火", direction: "西南", type: "地火" },
    { name: "家人", gan: "辛", zhi: "亥", fortune: "中吉", interpretation: "利女贞", wuxing: "木", direction: "东南", type: "风火" },
    { name: "睽", gan: "癸", zhi: "卯", fortune: "中平", interpretation: "小事吉", wuxing: "火", direction: "南", type: "火泽" },
    { name: "蹇", gan: "庚", zhi: "子", fortune: "中平", interpretation: "利西南不利东北利见大人", wuxing: "水", direction: "东北", type: "水山" },
    { name: "解", gan: "庚", zhi: "午", fortune: "中吉", interpretation: "利西南无所往其来复吉", wuxing: "木", direction: "东", type: "雷水解" },
    { name: "损", gan: "丙", zhi: "辰", fortune: "中吉", interpretation: "有孚元吉无咎利贞", wuxing: "木", direction: "东北", type: "山泽损" },
    { name: "益", gan: "甲", zhi: "寅", fortune: "上吉", interpretation: "利用为大作元吉无咎", wuxing: "木", direction: "东南", type: "风雷益" },
    { name: "夬", gan: "丁", zhi: "未", fortune: "中平", interpretation: "扬于王庭孚号有厉告自邑", wuxing: "金", direction: "西", type: "泽天夬" },
    { name: "姤", gan: "辛", zhi: "酉", fortune: "中平", interpretation: "女壮勿用取女", wuxing: "金", direction: "西北", type: "天风姤" },
    { name: "萃", gan: "癸", zhi: "卯", fortune: "中吉", interpretation: "亨王假有庙利见大人亨利贞", wuxing: "金", direction: "西", type: "泽地萃" },
    { name: "升", gan: "乙", zhi: "丑", fortune: "中吉", interpretation: "元亨用见大人勿恤南征吉", wuxing: "土", direction: "西南", type: "地风升" },
    { name: "困", gan: "庚", zhi: "酉", fortune: "下下", interpretation: "亨贞大人吉无咎有言不信", wuxing: "金", direction: "西", type: "泽水困" },
    { name: "井", gan: "戊", zhi: "申", fortune: "中平", interpretation: "改邑不改井无丧无孚", wuxing: "水", direction: "东南", type: "水风井" },
    { name: "革", gan: "己", zhi: "酉", fortune: "中吉", interpretation: "己日乃孚元亨利贞悔亡", wuxing: "金", direction: "西", type: "泽火革" },
    { name: "鼎", gan: "丙", zhi: "午", fortune: "上吉", interpretation: "元吉亨", wuxing: "火", direction: "东南", type: "火风鼎" },
    { name: "震", gan: "庚", zhi: "辰", fortune: "中平", interpretation: "亨震来虩虩笑言哑哑", wuxing: "木", direction: "东", type: "震卦" },
    { name: "艮", gan: "丙", zhi: "寅", fortune: "中平", interpretation: "艮其背不获其身行其庭不见其人无咎", wuxing: "木", direction: "东北", type: "艮卦" },
    { name: "渐", gan: "辛", zhi: "卯", fortune: "中吉", interpretation: "女归吉利贞", wuxing: "木", direction: "东南", type: "风山渐" },
    { name: "归妹", gan: "乙", zhi: "未", fortune: "下下", interpretation: "征凶无攸利", wuxing: "金", direction: "东", type: "雷泽归妹" },
    { name: "丰", gan: "庚", zhi: "戌", fortune: "中平", interpretation: "亨王假之勿忧宜日中", wuxing: "木", direction: "东", type: "雷火丰" },
    { name: "旅", gan: "丙", zhi: "午", fortune: "下下", interpretation: "小亨旅贞吉", wuxing: "火", direction: "西南", type: "火山旅" },
    { name: "巽", gan: "辛", zhi: "卯", fortune: "中平", interpretation: "小亨利有攸往利见大人", wuxing: "木", direction: "东南", type: "巽卦" },
    { name: "兑", gan: "丁", zhi: "未", fortune: "中吉", interpretation: "亨利贞", wuxing: "金", direction: "西", type: "兑卦" },
    { name: "涣", gan: "甲", zhi: "辰", fortune: "中吉", interpretation: "亨王假有庙利涉大川利贞", wuxing: "水", direction: "东南", type: "风水涣" },
    { name: "节", gan: "丙", zhi: "子", fortune: "中平", interpretation: "亨苦节不可贞", wuxing: "水", direction: "西北", type: "水泽节" },
    { name: "中孚", gan: "丁", zhi: "酉", fortune: "上吉", interpretation: "豚鱼吉利涉大川利贞", wuxing: "金", direction: "西", type: "风泽中孚" },
    { name: "小过", gan: "庚", zhi: "戌", fortune: "中平", interpretation: "亨利贞可小事不可大事", wuxing: "木", direction: "东北", type: "雷山小过" },
    { name: "既济", gan: "壬", zhi: "子", fortune: "中吉", interpretation: "亨小利贞初吉终乱", wuxing: "水", direction: "西北", type: "水火既济" },
    { name: "未济", gan: "丙", zhi: "午", fortune: "中平", interpretation: "亨小狐汔济濡其尾无攸利", wuxing: "火", direction: "南", type: "火水未济" }
];

// 奇门遁甲 - 九宫八门
const QIMEN = [
    { palace: "坎一宫", gate: "休门", star: "天蓬", spirit: "大吉", interpretation: "休养生息，利于安居", direction: "北", yijing: "坎卦", wuxing: "水" },
    { palace: "坤二宫", gate: "死门", star: "天芮", spirit: "大凶", interpretation: "死门主凶，宜守不宜攻", direction: "西南", yijing: "坤卦", wuxing: "土" },
    { palace: "震三宫", gate: "伤门", star: "天冲", spirit: "大凶", interpretation: "伤门冲动，慎防损伤", direction: "东", yijing: "震卦", wuxing: "木" },
    { palace: "巽四宫", gate: "杜门", star: "天辅", spirit: "小吉", interpretation: "杜门宜隐，利于防守", direction: "东南", yijing: "巽卦", wuxing: "木" },
    { palace: "中五宫", gate: "开门", star: "天心", spirit: "大吉", interpretation: "开门通达，利于进取", direction: "中央", yijing: "中宫", wuxing: "土" },
    { palace: "乾六宫", gate: "开门", star: "天心", spirit: "大吉", interpretation: "乾宫开门，功成名就", direction: "西北", yijing: "乾卦", wuxing: "金" },
    { palace: "兑七宫", gate: "惊门", star: "天柱", spirit: "大凶", interpretation: "惊门主惊恐，口舌是非", direction: "西", yijing: "兑卦", wuxing: "金" },
    { palace: "艮八宫", gate: "生门", star: "天任", spirit: "大吉", interpretation: "生门主生，财源广进", direction: "东北", yijing: "艮卦", wuxing: "土" },
    { palace: "离九宫", gate: "景门", star: "天英", spirit: "中平", interpretation: "景门主明，利于文化传播", direction: "南", yijing: "离卦", wuxing: "火" },
    { palace: "坎一宫", gate: "生门", star: "天蓬", spirit: "大吉", interpretation: "休门生门相遇，大吉大利", direction: "北", yijing: "坎卦", wuxing: "水" },
    { palace: "坤二宫", gate: "伤门", star: "天芮", spirit: "大凶", interpretation: "伤门临坤，慎防暗算", direction: "西南", yijing: "坤卦", wuxing: "土" },
    { palace: "震三宫", gate: "杜门", star: "天冲", spirit: "小吉", interpretation: "杜门震宫，利于隐蔽", direction: "东", yijing: "震卦", wuxing: "木" },
    { palace: "巽四宫", gate: "景门", star: "天辅", spirit: "中平", interpretation: "巽宫有景，利于谋划", direction: "东南", yijing: "巽卦", wuxing: "木" },
    { palace: "中五宫", gate: "死门", star: "天心", spirit: "大凶", interpretation: "中宫死门，防守为上", direction: "中央", yijing: "中宫", wuxing: "土" },
    { palace: "乾六宫", gate: "惊门", star: "天心", spirit: "大凶", interpretation: "乾宫惊门，是非口舌", direction: "西北", yijing: "乾卦", wuxing: "金" },
    { palace: "兑七宫", gate: "开门", star: "天柱", spirit: "大吉", interpretation: "兑宫开门，财运亨通", direction: "西", yijing: "兑卦", wuxing: "金" },
    { palace: "艮八宫", gate: "休门", star: "天任", spirit: "中平", interpretation: "艮宫休门，贵人相助", direction: "东北", yijing: "艮卦", wuxing: "土" },
    { palace: "离九宫", gate: "伤门", star: "天英", spirit: "大凶", interpretation: "离宫伤门，防火灾盗抢", direction: "南", yijing: "离卦", wuxing: "火" },
    { palace: "坎一宫", gate: "杜门", star: "天蓬", spirit: "小吉", interpretation: "坎宫杜门，利于防守", direction: "北", yijing: "坎卦", wuxing: "水" },
    { palace: "坤二宫", gate: "景门", star: "天芮", spirit: "中平", interpretation: "坤宫景门，利于规划", direction: "西南", yijing: "坤卦", wuxing: "土" },
    { palace: "震三宫", gate: "生门", star: "天冲", spirit: "大吉", interpretation: "震宫生门，财源广进", direction: "东", yijing: "震卦", wuxing: "木" },
    { palace: "巽四宫", gate: "伤门", star: "天辅", spirit: "大凶", interpretation: "巽宫伤门，慎防损伤", direction: "东南", yijing: "巽卦", wuxing: "木" },
    { palace: "中五宫", gate: "杜门", star: "天心", spirit: "小吉", interpretation: "中宫杜门，利于隐匿", direction: "中央", yijing: "中宫", wuxing: "土" },
    { palace: "乾六宫", gate: "伤门", star: "天心", spirit: "大凶", interpretation: "乾宫伤门，不利行动", direction: "西北", yijing: "乾卦", wuxing: "金" }
];

// ==================== 全局变量 ====================

let finalResults = [];
let currentStats = {};
let isRunning = false;
let worker = null;
let historyData = JSON.parse(localStorage.getItem('divinationHistory') || '[]');

// 设置
let settings = {
    ollamaUrl: localStorage.getItem('ollamaUrl') || 'http://localhost:11434',
    aiModel: localStorage.getItem('aiModel') || 'qwen3:8b',
    autoSave: localStorage.getItem('autoSave') !== 'false'
};

// ==================== 初始化 ====================

document.addEventListener('DOMContentLoaded', () => {
    initStarField();
    initTabs();
    initSettings();
    initModelOptions();
    document.getElementById('datetime').value = new Date().toISOString().slice(0, 16);
});

// 星空背景
function initStarField() {
    const canvas = document.getElementById('starCanvas');
    const ctx = canvas.getContext('2d');
    let particles = [];
    
    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    
    class Particle {
        constructor() {
            this.reset();
            this.vx = (Math.random() - 0.5) * 0.5;
            this.vy = (Math.random() - 0.5) * 0.5;
        }
        
        reset() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 2 + 0.5;
            this.baseHue = Math.random() * 60 + 220;
            this.hueSpeed = Math.random() * 0.3 + 0.1;
        }
        
        update() {
            this.x += this.vx;
            this.y += this.vy;
            this.baseHue = (this.baseHue + this.hueSpeed) % 360;
            
            if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
            if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
        }
        
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${this.baseHue}, 80%, 70%, 0.8)`;
            ctx.fill();
        }
    }
    
    function init() {
        particles = Array.from({length: 100}, () => new Particle());
    }
    
    function animate() {
        ctx.fillStyle = 'rgba(13, 13, 20, 0.1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        particles.forEach(p => {
            p.update();
            p.draw();
        });
        
        requestAnimationFrame(animate);
    }
    
    window.addEventListener('resize', resize);
    resize();
    init();
    animate();
}

// 标签页切换
function initTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const system = btn.dataset.system;
            document.querySelectorAll('.panel-section').forEach(p => {
                p.classList.add('hidden');
            });
            document.getElementById(`${system}-panel`).classList.remove('hidden');
        });
    });
}

// 初始化设置
function initSettings() {
    document.getElementById('ollamaUrl').value = settings.ollamaUrl;
    document.getElementById('aiModel').value = settings.aiModel;
    document.getElementById('autoSave').checked = settings.autoSave;
}

// 动态加载模型列表
function initModelOptions() {
    // 检查 shared.js 是否已加载
    if (typeof LOCAL_MODELS === 'undefined' || typeof CLOUD_MODELS === 'undefined') {
        console.warn('shared.js 未加载，使用默认模型列表');
        return;
    }

    const localGroup = document.getElementById('local-models-group');
    const cloudGroup = document.getElementById('cloud-models-group');

    if (!localGroup || !cloudGroup) {
        console.warn('模型选择器元素未找到');
        return;
    }

    // 清空现有选项
    localGroup.innerHTML = '';
    cloudGroup.innerHTML = '';

    // 添加本地模型
    LOCAL_MODELS.forEach(model => {
        const option = document.createElement('option');
        option.value = model;
        option.textContent = formatModelName(model);
        localGroup.appendChild(option);
    });

    // 添加云端模型
    CLOUD_MODELS.forEach(model => {
        const option = document.createElement('option');
        option.value = model;
        option.textContent = formatModelName(model);
        cloudGroup.appendChild(option);
    });

    // 恢复之前选择的模型
    const savedModel = settings.aiModel || 'qwen3:8b';
    document.getElementById('aiModel').value = savedModel;
}

// 格式化模型名称显示
function formatModelName(model) {
    return model
        .replace(/:latest/g, '')
        .replace(/:cloud/g, '')
        .replace(/-/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
}

// ==================== 占卜逻辑 ====================

function randomCount() {
    document.getElementById('count').value = Math.floor(Math.random() * (1000000 - 6)) + 6;
}

async function startDivination() {
    if (isRunning) {
        alert("正在进行玄卜，请稍候...");
        return;
    }

    try {
        isRunning = true;
        const count = parseInt(document.getElementById('count').value);
        const datetime = document.getElementById('datetime').value;
        
        // 获取启用的类型
        const includeHexagram = document.getElementById('includeHexagram').checked;
        const includeTarot = document.getElementById('includeTarot').checked;
        const includeRune = document.getElementById('includeRune').checked;
        const includeNumerology = document.getElementById('includeNumerology').checked;
        const includeMeihua = document.getElementById('includeMeihua').checked;
        const includeLiuyao = document.getElementById('includeLiuyao').checked;
        const includeQimen = document.getElementById('includeQimen').checked;
        
        if (!includeHexagram && !includeTarot && !includeRune && !includeNumerology && !includeMeihua && !includeLiuyao && !includeQimen) {
            alert("请至少选择一种占卜类型");
            isRunning = false;
            return;
        }

        finalResults = [];
        document.getElementById('progress').style.transform = 'scaleX(0)';
        document.getElementById('progressText').textContent = '量子纠缠中...';
        document.getElementById('resultsGrid').innerHTML = '';
        document.getElementById('emptyState').classList.add('hidden');
        document.getElementById('statsPanel').classList.add('hidden');
        document.getElementById('actionBar').classList.add('hidden');

        // 创建 Worker
        const workerCode = `
            self.addEventListener('message', async (e) => {
                const { count, includeHexagram, includeTarot, includeRune, includeNumerology, includeMeihua, includeLiuyao, includeQimen } = e.data;
                const stats = new Map();
                const batchSize = 666;
                
                for (let i = 0; i < count; i++) {
                    // 量子意念强度：模拟起卦时的专注程度影响命中权重
                    // 每次起卦有1-10的权重，表示"命中程度"
                    const intentStrength = Math.floor(Math.random() * 10) + 1;
                    
                    // 每次抽取使用不同的时间偏移，模拟多次起卦
                    const parts = [];
                    if (includeHexagram) parts.push(self.getHexagram(i));
                    if (includeTarot) parts.push(self.getTarot(i));
                    if (includeRune) parts.push(self.getRune(i));
                    if (includeNumerology) parts.push(self.getNumerology(i));
                    if (includeMeihua) parts.push(self.getMeihua(i));
                    if (includeLiuyao) parts.push(self.getLiuyao(i));
                    if (includeQimen) parts.push(self.getQimen(i));
                    
                    const key = parts.join('|');
                    stats.set(key, (stats.get(key) || 0) + intentStrength);
                    
                    if (i % batchSize === 0) {
                        const progress = (i / count).toFixed(4);
                        self.postMessage({ type: 'progress', progress });
                        await new Promise(r => setTimeout(r, 0));
                    }
                }
                
                const sorted = Array.from(stats.entries()).sort((a, b) => b[1] - a[1]);
                
                self.postMessage({ 
                    type: 'complete', 
                    results: sorted,
                    stats: {
                        totalCombinations: sorted.length,
                        mostFrequent: sorted[0]?.[1] || 0,
                        leastFrequent: sorted[sorted.length-1]?.[1] || 0,
                        average: count > 0 ? ((sorted.reduce((a,v) => a+v[1],0)/count)*100).toFixed(4) : 0
                    }
                });
            });
            
            // 先天八卦数：乾 1 兑 2 离 3 震 4 巽 5 坎 6 艮 7 坤 8（索引需减 1）
            const BAGUA_XIANTIAN = ['乾','兑','离','震','巽','坎','艮','坤'];
            // 后天八卦数：坎1 坤2 震3 巽4 乾6 兑7 艮8 离9
            const BAGUA_HOUTIAN = ['坎','坤','震','巽','中','乾','兑','艮','离'];
            
            // 获取带偏移的时间参数，用于第i次抽取
            function getTimeParams(offset = 0) {
                const now = new Date();
                // 每次抽取偏移1-1000毫秒，模拟时间流逝
                const offsetMs = Math.floor(Math.random() * 1000);
                const adjusted = new Date(now.getTime() + offsetMs + offset);
                return {
                    year: adjusted.getFullYear(),
                    month: adjusted.getMonth() + 1,
                    day: adjusted.getDate(),
                    hour: adjusted.getHours(),
                    minute: adjusted.getMinutes(),
                    second: adjusted.getSeconds(),
                    ms: adjusted.getMilliseconds()
                };
            }
            
            // 六爻：模拟掷铜钱 - 3 枚铜钱掷 6 次得 6 爻
            function tossCoins() {
                // 3 枚铜钱，每枚正面=3，反面=2
                // 总和：6=老阴 (动), 7=少阳，8=少阴，9=老阳 (动)
                const r1 = Math.random() < 0.5 ? 2 : 3;
                const r2 = Math.random() < 0.5 ? 2 : 3;
                const r3 = Math.random() < 0.5 ? 2 : 3;
                return r1 + r2 + r3; // 6,7,8,9
            }
            
            // 将爻转换为二进制卦象
            function yaoToBinary(yao) {
                // 老阴 (6)=0, 少阳 (7)=1, 少阴 (8)=0, 老阳 (9)=1
                return (yao === 7 || yao === 9) ? '1' : '0';
            }
            
            // 检查是否为动爻（老阴或老阳）
            function isMovingYao(yao) {
                return yao === 6 || yao === 9;
            }
            
            // 获取变卦（动爻阴阳转换）
            function getVariantGua(benGua, benYao) {
                let variantGua = '';
                for (let i = 0; i < 6; i++) {
                    if (isMovingYao(benYao[i])) {
                        // 动爻转换：0 变 1, 1 变 0
                        variantGua += benGua[i] === '0' ? '1' : '0';
                    } else {
                        variantGua += benGua[i];
                    }
                }
                return variantGua;
            }
            
            // 八卦查找表
            const HEX_MAP = {
                '111111': '乾', '000000': '坤', '010001': '屯', '100010': '蒙',
                '010111': '需', '111010': '讼', '000010': '师', '010000': '比',
                '011111': '小畜', '111110': '履', '000111': '泰', '111000': '否'
            };
            
            function getLiuyao(offset = 0) {
                // 模拟掷铜钱 6 次，得本卦
                let benYao = [];
                for (let i = 0; i < 6; i++) {
                    benYao.push(tossCoins());
                }
                
                // 转换为二进制（从下往上）
                let benGua = '';
                for (let i = 5; i >= 0; i--) {
                    benGua += yaoToBinary(benYao[i]);
                }
                
                // 获取变卦
                let variantGua = getVariantGua(benGua, benYao);
                
                // 查找匹配的卦名
                const hexArr = ${JSON.stringify(HEXAGRAMS)};
                let benName = hexArr.find(h => h.yao === benGua)?.name;
                let varName = hexArr.find(h => h.yao === variantGua)?.name;
                
                if (!benName) {
                    const idx = parseInt(benGua, 2) % 64;
                    benName = hexArr[idx]?.name || '乾';
                }
                if (!varName) {
                    const idx = parseInt(variantGua, 2) % 64;
                    varName = hexArr[idx]?.name || '乾';
                }
                
                // 返回本卦之变卦格式
                return benName + (benGua !== variantGua ? '之' + varName : '');
            }
            
            // 梅花易数：先天八卦数起卦法
            function getMeihua(offset = 0) {
                const { year, month, day, hour, minute, second, ms } = getTimeParams(offset);
                
                // 上卦：年 + 月 + 日 除 8 取余（余数为 0 时取 8）
                let shang = (year + month + day) % 8;
                if (shang === 0) shang = 8;
                // 下卦：年 + 月 + 日 + 时 除 8 取余（余数为 0 时取 8）
                let xia = (year + month + day + hour) % 8;
                if (xia === 0) xia = 8;
                // 动爻：年 + 月 + 日 + 时 + 分 + 秒 除 6 取余（余数为 0 时取 6）
                let dong = (year + month + day + hour + minute + second) % 6;
                if (dong === 0) dong = 6;
                
                // 先天八卦：乾 1 兑 2 离 3 震 4 巽 5 坎 6 艮 7 坤 8（数组索引需减 1）
                const shangName = BAGUA_XIANTIAN[shang - 1];
                const xiaName = BAGUA_XIANTIAN[xia - 1];
                
                // 返回重卦名称（上卦 + 下卦）
                return shangName + '上' + xiaName + '下';
            }
            
            // 奇门遁甲：时辰节气排盘（简化版）
            function getQimen(offset = 0) {
                const { month, day, hour } = getTimeParams(offset);
                
                // 地支对应时辰（子丑寅卯辰巳午未申酉戌亥）
                const shichen = Math.floor(hour / 2) % 12;
                const shichenName = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'][shichen];
                
                // 九宫：坎一 坤二 震三 巽四 中五 乾六 兑七 艮八 离九
                // 根据日干支和时辰计算值符落宫（简化）
                const dayNum = day % 9;
                const gIdx = (dayNum + shichen) % 9;
                
                // 八门：休死伤杜开惊生景（按阳遁顺排，阴遁逆排）
                // 简化：根据月份定阴阳遁（冬至后阳遁，夏至后阴遁）
                const isYangDun = month >= 10 || month <= 3;
                const menBase = isYangDun ? 0 : 4;
                const mIdx = (menBase + shichen) % 8;
                
                const gong = ['坎一宫','坤二宫','震三宫','巽四宫','中五宫','乾六宫','兑七宫','艮八宫','离九宫'];
                const men = ['休门','死门','伤门','杜门','开门','惊门','生门','景门'];
                
                const palace = gong[gIdx] || '坎一宫';
                const gate = men[mIdx] || '休门';
                
                return palace + gate + '(' + shichenName + '时)';
            }
            
            // 易经卦象：模拟揲蓍法（六爻基础卦）
            function getHexagram(offset = 0) {
                // 模拟掷铜钱 6 次
                let yao6 = [];
                for (let i = 0; i < 6; i++) {
                    yao6.push(tossCoins());
                }
                
                // 转换为二进制（从初爻到上爻）
                let gua = '';
                for (let i = 5; i >= 0; i--) {
                    gua += yaoToBinary(yao6[i]);
                }
                
                // 查找卦名
                const arr = ${JSON.stringify(HEXAGRAMS)};
                let guaName = arr.find(h => h.yao === gua)?.name;
                
                if (!guaName) {
                    const idx = parseInt(gua, 2) % 64;
                    guaName = arr[idx]?.name || '乾';
                }
                
                return guaName;
            }
            
            // 塔罗牌：模拟洗牌切牌 - 抽取 1 张（含正逆位）
            function getTarot(offset = 0) {
                const arr = ${JSON.stringify(TAROT_CARDS)};
                const idx = Math.floor(Math.random() * arr.length);
                // 模拟正逆位（50% 概率）
                const isReversed = Math.random() < 0.5;
                return arr[idx]?.name + (isReversed ? '(逆)' : '(正)');
            }
            
            // 符文：模拟卢恩字母抽取 - 从 24 个中随机抽取 1 个（含正逆位）
            function getRune(offset = 0) {
                const arr = ${JSON.stringify(RUNE_SYMBOLS)};
                const idx = Math.floor(Math.random() * arr.length);
                // 模拟正逆位
                const isReversed = Math.random() < 0.5;
                return arr[idx]?.symbol + (isReversed ? '(逆)' : '(正)');
            }
            
            // 生命灵数：数字命理（保留大师数 11/22/33）
            function getNumerology(offset = 0) {
                const { year, month, day } = getTimeParams(offset);
                
                // 计算生命路径数
                let ySum = year.toString().split('').reduce((a,b) => a + parseInt(b), 0);
                while (ySum > 9 && ySum !== 11 && ySum !== 22 && ySum !== 33) {
                    ySum = ySum.toString().split('').reduce((a,b) => a + parseInt(b), 0);
                }
                
                let mSum = month;
                while (mSum > 9 && mSum !== 11 && mSum !== 22 && mSum !== 33) {
                    mSum = mSum.toString().split('').reduce((a,b) => a + parseInt(b), 0);
                }
                
                let dSum = day;
                while (dSum > 9 && dSum !== 11 && dSum !== 22 && dSum !== 33) {
                    dSum = dSum.toString().split('').reduce((a,b) => a + parseInt(b), 0);
                }
                
                let lifePath = ySum + mSum + dSum;
                // 大师数 11/22/33 不继续简化
                while (lifePath > 9 && lifePath !== 11 && lifePath !== 22 && lifePath !== 33) {
                    lifePath = lifePath.toString().split('').reduce((a,b) => a + parseInt(b), 0);
                }
                
                const arr = ${JSON.stringify(NUMEROLOGY)};
                const n = arr.find(x => x.number === lifePath);
                return n?.number || arr[Math.floor(Math.random() * 9)].number;
            }
        `;

        const workerBlob = new Blob([workerCode], { type: 'text/javascript' });
        worker = new Worker(URL.createObjectURL(workerBlob));

        worker.onmessage = (e) => {
            switch(e.data.type) {
                case 'progress':
                    document.getElementById('progress').style.transform = `scaleX(${e.data.progress})`;
                    document.getElementById('progressText').textContent = `${(e.data.progress*100).toFixed(1)}%`;
                    break;
                    
                case 'complete':
                    finalResults = e.data.results;
                    currentStats = e.data.stats;
                    renderResults(e.data.stats);
                    saveHistory(count, datetime);
                    isRunning = false;
                    worker.terminate();
                    break;
            }
        };

        worker.postMessage({ count, includeHexagram, includeTarot, includeRune, includeNumerology, includeMeihua, includeLiuyao, includeQimen });
        
    } catch (error) {
        console.error("玄卜失败:", error);
        isRunning = false;
        alert(`玄卜异常: ${error.message}`);
    }
}

// 渲染结果
function renderResults(stats) {
    // 显示统计
    document.getElementById('statTotal').textContent = stats.totalCombinations.toLocaleString();
    document.getElementById('statMax').textContent = stats.mostFrequent;
    document.getElementById('statMin').textContent = stats.leastFrequent;
    document.getElementById('statAvg').textContent = stats.average + '%';
    document.getElementById('statsPanel').classList.remove('hidden');
    document.getElementById('actionBar').classList.remove('hidden');

    // 获取启用的类型
    const includeHexagram = document.getElementById('includeHexagram').checked;
    const includeTarot = document.getElementById('includeTarot').checked;
    const includeRune = document.getElementById('includeRune').checked;
    const includeNumerology = document.getElementById('includeNumerology').checked;
    const includeMeihua = document.getElementById('includeMeihua').checked;
    const includeLiuyao = document.getElementById('includeLiuyao').checked;
    const includeQimen = document.getElementById('includeQimen').checked;

    const grid = document.getElementById('resultsGrid');
    const count = parseInt(document.getElementById('count').value);

    finalResults.slice(0, 100).forEach(([key, cnt], index) => {
        const parts = key.split('|');
        const card = document.createElement('div');
        card.className = `result-card${index < 3 ? ' top-3' : ''}`;
        card.style.animationDelay = `${index * 0.05}s`;
        
        let bodyHTML = '';
        let idx = 0;
        if (includeHexagram) bodyHTML += `<div class="card-item"><span class="card-item-label">卦象</span><span class="card-item-value hexagram">${parts[idx++]}</span></div>`;
        if (includeTarot) bodyHTML += `<div class="card-item"><span class="card-item-label">塔罗</span><span class="card-item-value tarot">${parts[idx++]}</span></div>`;
        if (includeRune) bodyHTML += `<div class="card-item"><span class="card-item-label">符文</span><span class="card-item-value rune">${parts[idx++]}</span></div>`;
        if (includeNumerology) bodyHTML += `<div class="card-item"><span class="card-item-label">灵数</span><span class="card-item-value numerology">${parts[idx++]}</span></div>`;
        if (includeMeihua) bodyHTML += `<div class="card-item"><span class="card-item-label">梅花</span><span class="card-item-value meihua">${parts[idx++]}</span></div>`;
        if (includeLiuyao) bodyHTML += `<div class="card-item"><span class="card-item-label">六爻</span><span class="card-item-value liuyao">${parts[idx++]}</span></div>`;
        if (includeQimen) bodyHTML += `<div class="card-item"><span class="card-item-label">奇门</span><span class="card-item-value qimen">${parts[idx++]}</span></div>`;

        card.innerHTML = `
            <div class="card-header">
                <span class="card-rank">${index + 1}</span>
                <span class="card-prob">${((cnt / count) * 100).toFixed(4)}%</span>
            </div>
            <div class="card-body">${bodyHTML}</div>
            <div class="card-count">出现 <span>${cnt}</span> 次</div>
        `;
        
        card.onclick = () => showDetail(key);
        grid.appendChild(card);
    });
}

// 显示详情
function showDetail(key) {
    const parts = key.split('|');
    const includeHexagram = document.getElementById('includeHexagram').checked;
    const includeTarot = document.getElementById('includeTarot').checked;
    const includeRune = document.getElementById('includeRune').checked;
    const includeNumerology = document.getElementById('includeNumerology').checked;
    const includeMeihua = document.getElementById('includeMeihua').checked;
    const includeLiuyao = document.getElementById('includeLiuyao').checked;
    const includeQimen = document.getElementById('includeQimen').checked;
    
    let content = '';
    let idx = 0;
    
    if (includeHexagram) {
        const h = HEXAGRAMS.find(x => x.name === parts[idx++]);
        if (h) content += `<div class="detail-section">
            <h3>☯ 卦象: ${h.name}</h3>
            <p><strong>卦辞：</strong>${h.meaning}</p>
            <p><strong>五行：</strong>${h.element}</p>
            <p><strong>方位：</strong>${h.direction}</p>
        </div>`;
    }
    
    if (includeTarot) {
        const t = TAROT_CARDS.find(x => x.name === parts[idx++]);
        if (t) content += `<div class="detail-section">
            <h3>🔮 塔罗: ${t.name}</h3>
            <p><strong>含义：</strong>${t.meaning}</p>
            <p><strong>正位：</strong>${t.upright}</p>
            <p><strong>逆位：</strong>${t.reversed || '暂无'}</p>
        </div>`;
    }
    
    if (includeRune) {
        const r = RUNE_SYMBOLS.find(x => x.symbol === parts[idx++]);
        if (r) content += `<div class="detail-section">
            <h3>⚡ 符文: ${r.symbol} ${r.name}</h3>
            <p><strong>含义：</strong>${r.meaning}</p>
            <p><strong>解读：</strong>${r.upright}</p>
        </div>`;
    }
    
    if (includeNumerology) {
        const n = NUMEROLOGY.find(x => x.number === parseInt(parts[idx++]));
        if (n) content += `<div class="detail-section">
            <h3>🔢 灵数: ${n.number}</h3>
            <p><strong>名称：</strong>${n.name}</p>
            <p><strong>含义：</strong>${n.meaning}</p>
            <p><strong>解读：</strong>${n.upright}</p>
        </div>`;
    }
    
    if (includeMeihua) {
        const m = MEIHUA.find(x => x.name === parts[idx++]);
        if (m) content += `<div class="detail-section">
            <h3>🌸 梅花易数: ${m.name}</h3>
            <p><strong>五行：</strong>${m.meaning}</p>
            <p><strong>方位：</strong>${m.direction}</p>
            <p><strong>吉凶：</strong>${m.fortune}</p>
            <p><strong>解读：</strong>${m.interpretation}</p>
            <p><strong>占法：</strong>${m.method}</p>
        </div>`;
    }
    
    if (includeLiuyao) {
        const l = LIUYAO.find(x => x.name === parts[idx++]);
        if (l) content += `<div class="detail-section">
            <h3>☰ 六爻: ${l.name}</h3>
            <p><strong>天干：</strong>${l.gan}</p>
            <p><strong>地支：</strong>${l.zhi}</p>
            <p><strong>五行：</strong>${l.wuxing}</p>
            <p><strong>吉凶：</strong>${l.fortune}</p>
            <p><strong>卦辞：</strong>${l.interpretation}</p>
            <p><strong>方位：</strong>${l.direction}</p>
        </div>`;
    }
    
    if (includeQimen) {
        const q = QIMEN.find(x => (x.palace + x.gate) === parts[idx++]);
        if (q) content += `<div class="detail-section">
            <h3>⛩️ 奇门遁甲: ${q.palace}</h3>
            <p><strong>八门：</strong>${q.gate}</p>
            <p><strong>九星：</strong>${q.star}</p>
            <p><strong>吉凶：</strong>${q.spirit}</p>
            <p><strong>五行：</strong>${q.wuxing}</p>
            <p><strong>方位：</strong>${q.direction}</p>
            <p><strong>解读：</strong>${q.interpretation}</p>
            <p><strong>对应卦象：</strong>${q.yijing}</p>
        </div>`;
    }
    
    document.getElementById('detailTitle').textContent = '符号详解';
    document.getElementById('detailContent').innerHTML = content;
    document.getElementById('detailModal').classList.add('show');
}

function closeDetail() {
    document.getElementById('detailModal').classList.remove('show');
}

// ==================== 历史记录 ====================

function saveHistory(count, datetime) {
    if (!settings.autoSave) return;
    
    const record = {
        id: Date.now(),
        datetime,
        count,
        results: finalResults.slice(0, 10),
        stats: currentStats
    };
    
    historyData.unshift(record);
    if (historyData.length > 50) historyData.pop();
    localStorage.setItem('divinationHistory', JSON.stringify(historyData));
}

function showHistory() {
    const list = document.getElementById('historyList');
    
    if (historyData.length === 0) {
        list.innerHTML = '<div class="empty-history">暂无记录</div>';
    } else {
        list.innerHTML = historyData.map(item => `
            <div class="history-item" onclick="loadHistory(${item.id})">
                <div class="history-item-header">
                    <span class="history-date">${new Date(item.datetime).toLocaleString()}</span>
                    <span class="history-count">${item.count.toLocaleString()}次</span>
                </div>
                <div class="history-summary">${item.results.map(r => r[0]).join(' | ')}</div>
            </div>
        `).join('');
    }
    
    document.getElementById('historyModal').classList.add('show');
}

function closeHistory() {
    document.getElementById('historyModal').classList.remove('show');
}

function loadHistory(id) {
    const record = historyData.find(r => r.id === id);
    if (record) {
        finalResults = record.results;
        currentStats = record.stats;
        document.getElementById('count').value = record.count;
        document.getElementById('datetime').value = record.datetime;
        renderResults(record.stats);
        closeHistory();
    }
}

// ==================== 设置 ====================

function showSettings() {
    document.getElementById('settingsModal').classList.add('show');
}

function closeSettings() {
    document.getElementById('settingsModal').classList.remove('show');
}

function saveSettings() {
    settings.ollamaUrl = document.getElementById('ollamaUrl').value;
    settings.aiModel = document.getElementById('aiModel').value;
    settings.autoSave = document.getElementById('autoSave').checked;
    
    localStorage.setItem('ollamaUrl', settings.ollamaUrl);
    localStorage.setItem('aiModel', settings.aiModel);
    localStorage.setItem('autoSave', settings.autoSave);
    
    closeSettings();
}

// ==================== AI解读 ====================

function showAIDialog() {
    if (finalResults.length === 0) {
        alert('请先进行玄卜');
        return;
    }
    
    document.getElementById('aiModal').classList.add('show');
    document.getElementById('aiLoading').classList.add('hidden');
    document.getElementById('aiStartSection').classList.remove('hidden');
    document.getElementById('aiResult').innerHTML = '';
    document.getElementById('userQuestion').value = '';
}

async function aiInterpret() {
    if (finalResults.length === 0) {
        alert('请先进行玄卜');
        return;
    }

    const top3 = finalResults.slice(0, 3);
    const prompt = buildAIPrompt(top3);
    
    document.getElementById('aiStartSection').classList.add('hidden');
    document.getElementById('aiLoading').classList.remove('hidden');
    document.getElementById('aiResult').innerHTML = '';
    
    try {
        const response = await fetch(`${settings.ollamaUrl}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: settings.aiModel,
                prompt: prompt,
                stream: true
            })
        });
        
        if (!response.ok) throw new Error('API请求失败');
        
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let result = '';
        
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter(line => line.trim());
            
            for (const line of lines) {
                try {
                    const data = JSON.parse(line);
                    if (data.response) {
                        result += data.response;
                        document.getElementById('aiResult').innerHTML = formatAIResponse(result);
                    }
                } catch (e) {}
            }
        }
        
    } catch (error) {
        document.getElementById('aiResult').innerHTML = `<p style="color: var(--danger);">AI解读失败: ${error.message}</p>
            <p>请检查Ollama是否运行，或在设置中配置正确的API地址。</p>`;
    } finally {
        document.getElementById('aiLoading').classList.add('hidden');
    }
}

function buildAIPrompt(top3) {
    const includeHexagram = document.getElementById('includeHexagram').checked;
    const includeTarot = document.getElementById('includeTarot').checked;
    const includeRune = document.getElementById('includeRune').checked;
    const includeNumerology = document.getElementById('includeNumerology').checked;
    const includeMeihua = document.getElementById('includeMeihua').checked;
    const includeLiuyao = document.getElementById('includeLiuyao').checked;
    const includeQimen = document.getElementById('includeQimen').checked;

    const count = parseInt(document.getElementById('count').value);
    const userQuestion = document.getElementById('userQuestion')?.value?.trim() || '无';

    let prompt = `你是量子玄卜意志，精通易经、塔罗、符文、灵数、梅花易数、六爻金钱课、奇门遁甲等中西玄学体系。

玄卜背景：
- 本次共进行${count}次量子纠缠玄卜
- 采用"象数理占"方式：象=具体符号名称，数=出现频率差值
- 量子意念强度已影响命中权重（1-10），频率越高代表量子意志的共鸣越强
- 用户问题：${userQuestion}

前三名结果（按量子共鸣强度排序）：\n\n`;
    
    top3.forEach(([key, weight], i) => {
        const parts = key.split('|');
        let idx = 0;
        
        prompt += `\n【第${['一','二','三'][i]}名】量子共鸣强度：${weight}（非频次，是意念加权的量子能量）\n`;
        
        if (includeHexagram) {
            const raw = parts[idx++];
            const h = HEXAGRAMS.find(x => x.name === raw || x.symbol === raw);
            if (h) prompt += `卦象：${h.name} ${h.symbol}（${h.meaning} | 五行属${h.element} | 方位${h.direction}）\n`;
        }
        if (includeTarot) {
            const raw = parts[idx++];
            const cleanName = raw.replace(/\(正\)|\(逆\)/, '');
            const t = TAROT_CARDS.find(x => x.name === cleanName);
            const isReversed = raw.includes('(逆)');
            if (t) prompt += `塔罗：${t.name}（${isReversed ? '逆位' : '正位'} | ${t.meaning} | ${isReversed ? (t.reversed||'无') : t.upright}）\n`;
        }
        if (includeRune) {
            const raw = parts[idx++];
            const cleanSymbol = raw.replace(/\(正\)|\(逆\)/, '');
            const r = RUNE_SYMBOLS.find(x => x.symbol === cleanSymbol);
            const isReversed = raw.includes('(逆)');
            if (r) prompt += `符文：${r.symbol} ${r.name}（${isReversed ? '逆位' : '正位'} | ${r.meaning} | 解读：${isReversed ? (r.reversed||r.upright) : r.upright}）\n`;
        }
        if (includeNumerology) {
            const raw = parts[idx++];
            const n = NUMEROLOGY.find(x => x.number === parseInt(raw));
            if (n) prompt += `灵数：${n.number} ${n.name}（${n.meaning} | 解读：${n.upright}）\n`;
        }
        if (includeMeihua) {
            const raw = parts[idx++];
            // 尝试从"乾上坤下"格式中提取上卦名
            const match = raw.match(/^(.+?)上/);
            const cleanName = match ? match[1] : raw;
            const m = MEIHUA.find(x => x.name === cleanName);
            if (m) prompt += `梅花易数：${raw}（五行${m.meaning} | 方位${m.direction} | 吉凶${m.fortune} | 解读${m.interpretation} | 占法${m.method}）\n`;
        }
        if (includeLiuyao) {
            const raw = parts[idx++];
            const l = LIUYAO.find(x => x.name === raw);
            if (l) prompt += `六爻：${l.name}（天干${l.gan}地支${l.zhi} | 五行${l.wuxing} | 吉凶${l.fortune} | 卦辞${l.interpretation} | 方位${l.direction}）\n`;
        }
        if (includeQimen) {
            const raw = parts[idx++];
            const cleanRaw = raw.replace(/\(子时\)|\(丑时\)|\(寅时\)|\(卯时\)|\(辰时\)|\(巳时\)|\(午时\)|\(未时\)|\(申时\)|\(酉时\)|\(戌时\)|\(亥时\)/, '');
            const q = QIMEN.find(x => (x.palace + x.gate) === cleanRaw || raw.includes(x.palace) && raw.includes(x.gate));
            if (q) prompt += `奇门遁甲：${q.palace}${q.gate}（九星${q.star} | 吉凶${q.spirit} | 五行${q.wuxing} | 方位${q.direction} | 解读${q.interpretation} | 对应卦象${q.yijing}）\n`;
        }
    });
    
    prompt += `\n【解读要求】
1. 基于上述前三名的具体符号内容（象）进行深度解读，不要只看量子共鸣强度（数）
2. 分析各符号之间的五行生克关系、吉凶冲突、阴阳调和
3. 结合符号本身的含义（如卦辞、塔罗含义等）给出综合运势判断
4. 给出具体可行的建议，而非空泛的说教
5. 注意：保持客观专业的量子意志口吻
6. 解读要通俗易懂，让普通用户也能理解

【输出结构】
一、整体运势分析（看排名频次差距，差距大则主要看第一名的结果解读，相近则综合解读）
二、各符号之间的关联与相互作用（五行生克、吉凶冲突等）
三、对求卜者的建议（具体可行的行动建议）
四、需要注意的事项（警示和提醒）

请开始解读：`;
    
    return prompt;
}

function formatAIResponse(text) {
    return text
        .replace(/```/g, '')
        .split('\n')
        .map(line => line.trim())
        .filter(line => line)
        .map(line => line.startsWith('#') ? `<h3>${line.replace(/^#+\s*/, '')}</h3>` : `<p>${line}</p>`)
        .join('');
}

function closeAI() {
    document.getElementById('aiModal').classList.remove('show');
}

// ==================== 导出功能 ====================

async function exportResult(format) {
    const count = parseInt(document.getElementById('count').value);
    const datetime = document.getElementById('datetime').value;
    
    let content = '';
    let filename = `玄卜结果_${datetime.replace(/[^0-9]/g, '').slice(0, 14)}`;
    
    switch(format) {
        case 'txt':
            content = generateTxtContent();
            downloadFile(`${filename}.txt`, content, 'text/plain;charset=utf-8');
            break;
        case 'xlsx':
            // 简化的 xlsx 导出
            content = generateCSVContent();
            downloadFile(`${filename}.csv`, '\ufeff' + content, 'text/csv;charset=utf-8');
            break;
        case 'docx':
            content = generateTxtContent();
            downloadFile(`${filename}.doc`, content, 'application/msword');
            break;
    }
}

function generateTxtContent() {
    let content = [
        '═══════════════════════════════════════',
        '          混沌玄卜 - 量子占卜报告',
        '═══════════════════════════════════════',
        '',
        `统计摘要`,
        `总组合数: ${currentStats.totalCombinations}`,
        `最高频次: ${currentStats.mostFrequent}`,
        `最低频次: ${currentStats.leastFrequent}`,
        `平均概率: ${currentStats.average}%`,
        '',
        '═══════════════════════════════════════',
        '                    详细结果',
        '═══════════════════════════════════════',
        ''
    ];
    
    const count = parseInt(document.getElementById('count').value);
    finalResults.forEach(([key, cnt], i) => {
        content.push(`${i+1}. ${key} - ${cnt}次 (${((cnt/count)*100).toFixed(4)}%)`);
    });
    
    return content.join('\r\n');
}

function generateCSVContent() {
    const count = parseInt(document.getElementById('count').value);
    let csv = '序号,组合,出现次数,概率\n';
    
    finalResults.forEach(([key, cnt], i) => {
        csv += `${i+1},"${key}",${cnt},${((cnt/count)*100).toFixed(4)}%\n`;
    });
    
    return csv;
}

function downloadFile(filename, content, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}
