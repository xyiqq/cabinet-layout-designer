export type 是或否 = "是" | "否";

export type 项目模式 = "配电箱 / 控制柜模式" | "网络机柜模式";

export type 箱体尺寸模式 = "自动推荐" | "自定义尺寸";

export type 安装方式 =
  | "DIN导轨"
  | "机柜U位"
  | "托盘放置"
  | "后侧安装"
  | "箱内DIN导轨"
  | "背板固定"
  | "端子排";

export interface 设备参数 {
  设备编号: string;
  设备名称: string;
  品牌: string;
  设备类别: string;
  设备类型: string;
  安装方式: 安装方式;
  宽度毫米: number;
  高度毫米: number;
  深度毫米: number;
  DIN模数: number;
  机柜U数: number;
  发热功率瓦: number;
  走线预留毫米: number;
  供电类型: string;
  通讯接口: string;
  端口数量: number;
  是否重设备: 是或否;
  是否强电设备: 是或否;
  是否弱电设备: 是或否;
  是否需要散热间距: 是或否;
  备注: string;
  是否支持数量调整?: 是或否;
  数量单位?: string;
  单个宽度毫米?: number;
  默认数量?: number;
}

export interface 已放置设备 {
  实例编号: string;
  设备: 设备参数;
  数量: number;
  行数?: number;
  列数?: number;
  位置X毫米: number;
  位置Y毫米: number;
  所在层: number;
  布局来源: "自动排布" | "手动拖拽";
}

export interface 布局规则 {
  左侧竖向线槽宽度: number;
  右侧竖向线槽宽度: number;
  顶部预留空间: number;
  底部预留空间: number;
  横向线槽高度: number;
  DIN导轨垂直间距: number;
  空开端子区高度: number;
  模块区高度: number;
  端子排区域高度: number;
  扩展余量比例: number;
}

export interface 箱体尺寸 {
  宽度毫米: number;
  高度毫米: number;
  深度毫米: number;
}

export interface 箱体配置 {
  尺寸模式: 箱体尺寸模式;
  自定义箱体尺寸: 箱体尺寸;
  布局规则: 布局规则;
  是否启用自动吸附: boolean;
  吸附间距毫米: number;
}

export interface 导轨层 {
  层号: number;
  层名称: string;
  分区类型: string;
  设备列表: 已放置设备[];
  占用宽度毫米: number;
  可用宽度毫米: number;
  空间高度毫米: number;
}

export interface 设备清单项 {
  设备编号: string;
  设备名称: string;
  品牌: string;
  设备类别: string;
  设备类型: string;
  安装方式: string;
  数量: number;
  单台宽度毫米: number;
  单台高度毫米: number;
  单台深度毫米: number;
  总发热功率瓦: number;
  备注: string;
}

export interface 材料清单项 {
  材料名称: string;
  规格: string;
  数量: number;
  单位: string;
  备注: string;
}

export interface 计算结果 {
  推荐箱体尺寸: 箱体尺寸;
  标准推荐箱体尺寸: 箱体尺寸;
  推荐箱体尺寸文本: string;
  标准推荐箱体尺寸文本: string;
  箱体尺寸来源: 箱体尺寸模式;
  DIN导轨数量: number;
  每条导轨可用宽度: number;
  横向线槽高度: number;
  纵向线槽宽度: number;
  顶部预留空间: number;
  底部预留空间: number;
  总设备数量: number;
  总发热功率: number;
  推荐散热等级: string;
  散热建议: string;
  空间利用率: number;
  扩展余量: string;
  每层设备分布: 导轨层[];
  线槽空间占用情况: string[];
  设备清单: 设备清单项[];
  材料清单: 材料清单项[];
  警告信息: string[];
}

export interface 项目数据 {
  项目名称: string;
  项目模式: 项目模式;
  更新时间: string;
  箱体配置: 箱体配置;
  设备列表: 已放置设备[];
  计算结果: 计算结果;
}

export interface 网络设备参数 {
  设备编号: string;
  设备名称: string;
  品牌: string;
  设备类别: string;
  设备类型: string;
  安装方式: 安装方式;
  宽度毫米: number;
  高度毫米: number;
  深度毫米: number;
  机柜U数: number;
  发热功率瓦: number;
  走线预留毫米: number;
  供电类型: string;
  网口数量: number;
  PoE口数量: number;
  是否重设备: 是或否;
  是否需要托盘: 是或否;
  是否需要理线架: 是或否;
  是否需要散热间距: 是或否;
  备注: string;
}

export interface 网络机柜规格 {
  规格编号: string;
  规格名称: string;
  机柜U数: number;
  宽度毫米: number;
  深度毫米: number;
  高度毫米: number;
  是否壁挂机柜: 是或否;
  是否落地机柜: 是或否;
  推荐最大承重千克: number;
  推荐用途: string;
  备注: string;
}

export interface 已放置网络设备 {
  实例编号: string;
  设备: 网络设备参数;
  起始U位: number;
  占用U数: number;
  所属配电箱实例编号?: string;
  布局来源: "自动排布" | "手动拖拽";
}

export interface U位占用项 {
  起始U位: number;
  结束U位: number;
  占用U数: number;
  名称: string;
  类型: string;
  设备编号?: string;
  实例编号?: string;
  是否自动生成: 是或否;
}

export interface 网络设备清单项 {
  设备编号: string;
  设备名称: string;
  品牌: string;
  设备类别: string;
  设备类型: string;
  安装方式: string;
  机柜U数: number;
  深度毫米: number;
  网口数量: number;
  PoE口数量: number;
  总发热功率瓦: number;
  备注: string;
}

export interface 网络材料清单项 {
  材料名称: string;
  规格: string;
  数量: number;
  单位: string;
  备注: string;
}

export interface 网络机柜计算结果 {
  设备总U数: number;
  理线架占用U数: number;
  托盘占用U数: number;
  盲板占用U数: number;
  推荐机柜U数: number;
  推荐机柜宽度: number;
  推荐机柜深度: number;
  推荐机柜类型: string;
  U位利用率: number;
  扩展余量: string;
  总发热功率: number;
  散热建议: string;
  推荐机柜规格: 网络机柜规格;
  设备清单: 网络设备清单项[];
  材料清单: 网络材料清单项[];
  U位占用表: U位占用项[];
  警告信息: string[];
}

export interface 网络机柜项目数据 {
  项目名称: string;
  项目模式: "网络机柜模式";
  更新时间: string;
  网络设备列表: 已放置网络设备[];
  计算结果: 网络机柜计算结果;
}
