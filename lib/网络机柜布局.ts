import type { U位占用项, 已放置网络设备, 网络设备参数 } from "../types/设备";
import { 计算网络设备占用U数 } from "./网络机柜计算";

export const 单台机柜配电箱DIN容量 = 24;

export interface 网络设备插入选项 {
  最大U数?: number;
}

export interface 网络设备插入结果 {
  设备列表: 已放置网络设备[];
  最大结束U位: number;
  是否超过最大U数: boolean;
  已移动: boolean;
}

export interface 网络设备新增选项 {
  占用表?: Array<Pick<U位占用项, "起始U位" | "结束U位" | "实例编号">>;
}

export type 网络设备整理方向 = "上移" | "下移";
export type 箱内DIN组件排序方向 = "上移" | "下移" | "置顶" | "置底";

export function 计算箱内DIN模数(设备: Pick<网络设备参数, "宽度毫米">) {
  return Math.max(1, Math.ceil(设备.宽度毫米 / 18));
}

export function 计算配电箱已用DIN模数(设备列表: 已放置网络设备[], 配电箱实例编号: string) {
  return 设备列表
    .filter((项目) => 项目.所属配电箱实例编号 === 配电箱实例编号)
    .reduce((合计, 项目) => 合计 + 计算箱内DIN模数(项目.设备), 0);
}

export function 配电箱是否可容纳DIN组件(
  设备列表: 已放置网络设备[],
  配电箱实例编号: string,
  组件设备: 网络设备参数
) {
  return 计算配电箱已用DIN模数(设备列表, 配电箱实例编号) + 计算箱内DIN模数(组件设备) <= 单台机柜配电箱DIN容量;
}

export function 调整箱内DIN组件顺序(
  设备列表: 已放置网络设备[],
  实例编号: string,
  方向: 箱内DIN组件排序方向
) {
  const 当前项目 = 设备列表.find((项目) => 项目.实例编号 === 实例编号);
  const 配电箱实例编号 = 当前项目?.所属配电箱实例编号;
  if (!当前项目 || !配电箱实例编号) return 设备列表;

  const 同箱组件列表 = 设备列表.filter((项目) => 项目.所属配电箱实例编号 === 配电箱实例编号);
  const 当前索引 = 同箱组件列表.findIndex((项目) => 项目.实例编号 === 实例编号);
  if (当前索引 < 0) return 设备列表;

  const 最大索引 = 同箱组件列表.length - 1;
  const 目标索引 =
    方向 === "置顶"
      ? 0
      : 方向 === "置底"
        ? 最大索引
        : Math.max(0, Math.min(最大索引, 当前索引 + (方向 === "上移" ? -1 : 1)));

  if (目标索引 === 当前索引) return 设备列表;

  const 下一同箱组件列表 = [...同箱组件列表];
  const [移动项] = 下一同箱组件列表.splice(当前索引, 1);
  下一同箱组件列表.splice(目标索引, 0, 移动项);

  let 同箱组件索引 = 0;
  return 设备列表.map((项目) =>
    项目.所属配电箱实例编号 === 配电箱实例编号 ? 下一同箱组件列表[同箱组件索引++] : 项目
  );
}

function 设备列表转占用表(设备列表: 已放置网络设备[]) {
  return 设备列表
    .map((项目) => {
      const 占用U数 = 计算网络设备占用U数(项目.设备);
      if (占用U数 <= 0) return null;
      const 起始U位 = Math.max(1, Math.round(项目.起始U位 || 1));
      return {
        起始U位,
        结束U位: 起始U位 + 占用U数 - 1,
        实例编号: 项目.实例编号
      };
    })
    .filter(Boolean) as Array<Pick<U位占用项, "起始U位" | "结束U位" | "实例编号">>;
}

export function 查找向下可用网络U位(
  占用表: Array<Pick<U位占用项, "起始U位" | "结束U位" | "实例编号">>,
  期望U位: number,
  预留U数: number,
  忽略实例编号?: string
) {
  let 起始U位 = Math.max(1, Math.round(期望U位));
  const 有效占用表 = 占用表.filter((项目) => !忽略实例编号 || 项目.实例编号 !== 忽略实例编号);

  while (true) {
    const 结束U位 = 起始U位 + 预留U数 - 1;
    const 冲突区间 = 有效占用表.find((项目) => 起始U位 <= 项目.结束U位 && 结束U位 >= 项目.起始U位);
    if (!冲突区间) return 起始U位;
    起始U位 = 冲突区间.结束U位 + 1;
  }
}

function 计算最大结束U位(设备列表: 已放置网络设备[]) {
  return 设备列表.reduce((最大值, 项目) => {
    const 占用U数 = 计算网络设备占用U数(项目.设备);
    if (占用U数 <= 0) return 最大值;
    const 起始U位 = Math.max(1, Math.round(项目.起始U位 || 1));
    return Math.max(最大值, 起始U位 + 占用U数 - 1);
  }, 0);
}

export function 插入网络设备到U位(
  设备列表: 已放置网络设备[],
  实例编号: string,
  目标U位: number,
  选项: 网络设备插入选项 = {}
): 网络设备插入结果 {
  const 当前设备 = 设备列表.find((项目) => 项目.实例编号 === 实例编号);
  const 原始最大结束U位 = 计算最大结束U位(设备列表);
  if (!当前设备) {
    return {
      设备列表,
      最大结束U位: 原始最大结束U位,
      是否超过最大U数: typeof 选项.最大U数 === "number" && 原始最大结束U位 > 选项.最大U数,
      已移动: false
    };
  }

  const 当前占用U数 = 计算网络设备占用U数(当前设备.设备);
  if (当前占用U数 <= 0) {
    return {
      设备列表,
      最大结束U位: 原始最大结束U位,
      是否超过最大U数: typeof 选项.最大U数 === "number" && 原始最大结束U位 > 选项.最大U数,
      已移动: false
    };
  }

  const 列表顺序 = new Map(设备列表.map((项目, 索引) => [项目.实例编号, 索引]));
  const 已占区间: Array<{ 起始: number; 结束: number }> = [];
  const 下一设备 = new Map<string, 已放置网络设备>();
  const 放置区间 = (起始U位: number, 占用U数: number) => {
    已占区间.push({ 起始: 起始U位, 结束: 起始U位 + 占用U数 - 1 });
    已占区间.sort((甲, 乙) => 甲.起始 - 乙.起始 || 甲.结束 - 乙.结束);
  };
  const 查找可放置U位 = (期望U位: number, 占用U数: number) => {
    let 起始U位 = Math.max(1, Math.round(期望U位));
    while (true) {
      const 结束U位 = 起始U位 + 占用U数 - 1;
      const 冲突区间 = 已占区间.find((区间) => 起始U位 <= 区间.结束 && 结束U位 >= 区间.起始);
      if (!冲突区间) return 起始U位;
      起始U位 = 冲突区间.结束 + 1;
    }
  };

  const 当前起始U位 = Math.max(1, Math.round(目标U位));
  下一设备.set(当前设备.实例编号, {
    ...当前设备,
    起始U位: 当前起始U位,
    占用U数: 当前占用U数,
    布局来源: "手动拖拽"
  });
  放置区间(当前起始U位, 当前占用U数);

  [...设备列表]
    .filter((项目) => 项目.实例编号 !== 实例编号 && 计算网络设备占用U数(项目.设备) > 0)
    .sort((甲, 乙) => {
      const 甲起始 = Math.max(1, Math.round(甲.起始U位 || 1));
      const 乙起始 = Math.max(1, Math.round(乙.起始U位 || 1));
      return 甲起始 - 乙起始 || (列表顺序.get(甲.实例编号) ?? 0) - (列表顺序.get(乙.实例编号) ?? 0);
    })
    .forEach((项目) => {
      const 占用U数 = 计算网络设备占用U数(项目.设备);
      const 原始起始U位 = Math.max(1, Math.round(项目.起始U位 || 1));
      const 下一起始U位 = 查找可放置U位(原始起始U位, 占用U数);
      下一设备.set(项目.实例编号, { ...项目, 起始U位: 下一起始U位, 占用U数 });
      放置区间(下一起始U位, 占用U数);
    });

  const 更新后设备列表 = 设备列表.map((项目) => 下一设备.get(项目.实例编号) ?? 项目);
  const 最大结束U位 = 计算最大结束U位(更新后设备列表);
  return {
    设备列表: 更新后设备列表,
    最大结束U位,
    是否超过最大U数: typeof 选项.最大U数 === "number" && 最大结束U位 > 选项.最大U数,
    已移动: true
  };
}

export function 添加网络设备并保留现有U位(
  设备列表: 已放置网络设备[],
  新设备: 已放置网络设备,
  期望U位: number,
  选项: 网络设备新增选项 = {}
) {
  const 占用U数 = 计算网络设备占用U数(新设备.设备);
  if (占用U数 <= 0) {
    return [...设备列表, { ...新设备, 起始U位: 0, 占用U数 }];
  }

  const 起始U位 = 查找向下可用网络U位(
    选项.占用表 ?? 设备列表转占用表(设备列表),
    期望U位,
    占用U数,
    新设备.实例编号
  );

  return [
    ...设备列表,
    {
      ...新设备,
      起始U位,
      占用U数,
      布局来源: "手动拖拽" as const
    }
  ];
}

export function 整理网络设备U位(
  设备列表: 已放置网络设备[],
  方向: 网络设备整理方向,
  最大U数: number
) {
  const 列表顺序 = new Map(设备列表.map((项目, 索引) => [项目.实例编号, 索引]));
  const 可整理设备 = [...设备列表]
    .filter((项目) => 计算网络设备占用U数(项目.设备) > 0)
    .sort((甲, 乙) => {
      const 甲起始 = Math.max(1, Math.round(甲.起始U位 || 1));
      const 乙起始 = Math.max(1, Math.round(乙.起始U位 || 1));
      return 甲起始 - 乙起始 || (列表顺序.get(甲.实例编号) ?? 0) - (列表顺序.get(乙.实例编号) ?? 0);
    });
  const 总占用U数 = 可整理设备.reduce((合计, 项目) => 合计 + 计算网络设备占用U数(项目.设备), 0);
  const 最大可用U数 = Math.max(1, Math.round(最大U数 || 总占用U数 || 1));
  let 当前U位 = 方向 === "上移" ? 1 : Math.max(1, 最大可用U数 - 总占用U数 + 1);
  const 更新映射 = new Map<string, 已放置网络设备>();

  for (const 项目 of 可整理设备) {
    const 占用U数 = 计算网络设备占用U数(项目.设备);
    更新映射.set(项目.实例编号, {
      ...项目,
      起始U位: 当前U位,
      占用U数,
      布局来源: "手动拖拽"
    });
    当前U位 += 占用U数;
  }

  return 设备列表.map((项目) => 更新映射.get(项目.实例编号) ?? 项目);
}
