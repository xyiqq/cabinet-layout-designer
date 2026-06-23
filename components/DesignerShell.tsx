"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import 原始设备库 from "@/data/设备库.json";
import 原始网络设备库 from "@/data/网络设备库.json";
import { 网络机柜规格库 } from "@/data/网络机柜规格库";
import { DeviceLibrary } from "@/components/DeviceLibrary";
import { NetworkDeviceLibrary } from "@/components/NetworkDeviceLibrary";
import { NetworkRackResultPanel } from "@/components/NetworkRackResultPanel";
import { ResultPanel } from "@/components/ResultPanel";
import { SkeuoIcon } from "@/components/SkeuoIcon";
import { 查找设备加入空位, 创建设备实例, 默认箱体配置, 生成自动布局, 计算推荐方案 } from "@/lib/柜体计算";
import { 创建网络设备实例, 生成网络机柜自动布局, 计算网络机柜方案, 计算网络设备占用U数 } from "@/lib/网络机柜计算";
import {
  添加网络设备并保留现有U位,
  插入网络设备到U位,
  配电箱是否可容纳DIN组件,
  整理网络设备U位,
  调整箱内DIN组件顺序
} from "@/lib/网络机柜布局";
import {
  导出U位占用表,
  导出材料清单,
  导出网络材料清单,
  导出网络设备清单,
  导出设备清单,
  导出项目数据,
  生成网络项目数据,
  生成项目数据
} from "@/utils/导出";
import type { 已放置设备, 已放置网络设备, 网络设备参数, 设备参数, 箱体配置, 项目模式 } from "@/types/设备";

const CabinetCanvas = dynamic(() => import("@/components/CabinetCanvas").then((mod) => mod.CabinetCanvas), {
  ssr: false,
  loading: () => <div className="flex h-full items-center justify-center text-sm text-slate-500">正在加载画布...</div>
});

const NetworkRackCanvas = dynamic(() => import("@/components/NetworkRackCanvas").then((mod) => mod.NetworkRackCanvas), {
  ssr: false,
  loading: () => <div className="flex h-full items-center justify-center text-sm text-slate-500">正在加载 U 位图...</div>
});

const 设备库 = 原始设备库 as 设备参数[];
const 网络设备库 = 原始网络设备库 as 网络设备参数[];
const 机柜配电箱设备 = 网络设备库.find((设备) => 设备.设备编号 === "网络-022" || 是机柜配电箱设备(设备));
const 自定义设备库存储键 = "cabinet-design.custom-devices.v1";
const 自定义网络设备库存储键 = "cabinet-design.custom-network-devices.v1";

interface 网络设备状态 {
  当前列表: 已放置网络设备[];
  历史列表: 已放置网络设备[][];
}

interface 网络U位图导出尺寸 {
  宽度毫米: number;
  深度毫米: number;
}

function 是机柜配电箱设备(设备: 网络设备参数) {
  return 设备.设备类别.includes("机柜配电箱");
}

function 是箱内DIN组件设备(设备: 网络设备参数) {
  return 设备.安装方式 === "箱内DIN导轨" || 设备.设备类别.includes("配电箱内置组件");
}

function 读取本地产品库<T>(键名: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const 原始值 = window.localStorage.getItem(键名);
    const 解析值 = 原始值 ? JSON.parse(原始值) : [];
    return Array.isArray(解析值) ? 解析值 as T[] : [];
  } catch {
    return [];
  }
}

function 写入本地产品库<T>(键名: string, 产品列表: T[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(键名, JSON.stringify(产品列表));
}

function 查找目标配电箱实例编号(
  设备列表: 已放置网络设备[],
  当前选中实例编号: string | null,
  组件设备: 网络设备参数,
  是否只使用首选 = false
) {
  const 当前选中设备 = 当前选中实例编号 ? 设备列表.find((项目) => 项目.实例编号 === 当前选中实例编号) : null;
  const 首选实例编号 = 当前选中设备?.设备 && 是机柜配电箱设备(当前选中设备.设备)
    ? 当前选中设备.实例编号
    : 当前选中设备?.所属配电箱实例编号;

  if (首选实例编号 && 配电箱是否可容纳DIN组件(设备列表, 首选实例编号, 组件设备)) return 首选实例编号;
  if (是否只使用首选) return undefined;

  return 设备列表.find(
    (项目) => 是机柜配电箱设备(项目.设备) && 配电箱是否可容纳DIN组件(设备列表, 项目.实例编号, 组件设备)
  )?.实例编号;
}

function 添加配电箱并保留U位(现有列表: 已放置网络设备[]) {
  if (!机柜配电箱设备) return { 设备列表: 现有列表, 配电箱实例编号: undefined as string | undefined };

  const 新配电箱实例 = 创建网络设备实例(机柜配电箱设备, 1);
  const 默认排布 = 生成网络机柜自动布局([...现有列表, 新配电箱实例], 网络机柜规格库).设备列表;
  const 默认新增设备 = 默认排布.find((项目) => 项目.实例编号 === 新配电箱实例.实例编号);
  const 当前占用表 = 计算网络机柜方案(现有列表, 网络机柜规格库).U位占用表;

  return {
    设备列表: 添加网络设备并保留现有U位(现有列表, 新配电箱实例, 默认新增设备?.起始U位 ?? 1, { 占用表: 当前占用表 }),
    配电箱实例编号: 新配电箱实例.实例编号
  };
}

function 添加箱内组件并确保配电箱(
  现有列表: 已放置网络设备[],
  设备: 网络设备参数,
  当前选中实例编号: string | null,
  是否只使用首选 = false
) {
  let 下一列表 = 现有列表;
  let 配电箱实例编号 = 查找目标配电箱实例编号(下一列表, 当前选中实例编号, 设备, 是否只使用首选);

  if (!配电箱实例编号) {
    const 新增结果 = 添加配电箱并保留U位(下一列表);
    下一列表 = 新增结果.设备列表;
    配电箱实例编号 = 新增结果.配电箱实例编号;
  }

  const 新实例 = 创建网络设备实例(设备, 0);
  return [
    ...下一列表,
    {
      ...新实例,
      起始U位: 0,
      占用U数: 0,
      所属配电箱实例编号: 配电箱实例编号,
      布局来源: "手动拖拽" as const
    }
  ];
}

function 复制默认箱体配置(): 箱体配置 {
  return {
    ...默认箱体配置,
    自定义箱体尺寸: { ...默认箱体配置.自定义箱体尺寸 },
    布局规则: { ...默认箱体配置.布局规则 }
  };
}

function 生成示例项目(箱体配置: 箱体配置 = 默认箱体配置) {
  const 示例设备 = ["设备-007", "设备-008", "设备-004", "设备-001", "设备-002", "设备-020", "设备-018"]
    .map((设备编号) => 设备库.find((设备) => 设备.设备编号 === 设备编号))
    .filter(Boolean) as 设备参数[];

  return 生成自动布局(
    示例设备.map((设备, 索引) => 创建设备实例(设备, 90 + 索引 * 16, 110 + 索引 * 10)),
    箱体配置
  ).设备列表;
}

function 生成网络示例项目() {
  const 示例设备 = [
    "网络-001",
    "网络-002",
    "网络-003",
    "网络-004",
    "网络-005",
    "网络-006",
    "网络-007",
    "网络-008",
    "网络-009",
    "网络-010",
    "网络-011",
    "网络-012",
    "网络-013",
    "网络-014",
    "网络-015",
    "网络-017",
    "网络-020",
    "网络-022",
    "网络-024",
    "网络-027",
    "网络-030"
  ]
    .map((设备编号) => 网络设备库.find((设备) => 设备.设备编号 === 设备编号))
    .filter(Boolean) as 网络设备参数[];

  const 自动布局列表 = 生成网络机柜自动布局(
    示例设备.map((设备, 索引) => 创建网络设备实例(设备, 索引 + 1)),
    网络机柜规格库
  ).设备列表;
  const 配电箱实例编号 = 自动布局列表.find((项目) => 是机柜配电箱设备(项目.设备))?.实例编号;
  return 自动布局列表.map((项目) =>
    是箱内DIN组件设备(项目.设备) && 配电箱实例编号
      ? { ...项目, 所属配电箱实例编号: 配电箱实例编号 }
      : 项目
  );
}

type U位移动方向 = "上移" | "下移";
type 箱内DIN组件排序方向 = "上移" | "下移" | "置顶" | "置底";

function 网络设备列表是否相同(甲: 已放置网络设备[], 乙: 已放置网络设备[]) {
  if (甲 === 乙) return true;
  if (甲.length !== 乙.length) return false;
  return 甲.every((甲项, 索引) => {
    const 乙项 = 乙[索引];
    return (
      乙项 &&
      甲项.实例编号 === 乙项.实例编号 &&
      甲项.起始U位 === 乙项.起始U位 &&
      甲项.占用U数 === 乙项.占用U数 &&
      甲项.所属配电箱实例编号 === 乙项.所属配电箱实例编号 &&
      甲项.布局来源 === 乙项.布局来源 &&
      甲项.设备.设备编号 === 乙项.设备.设备编号
    );
  });
}

function 事件目标是否可编辑(目标: EventTarget | null) {
  if (!(目标 instanceof HTMLElement)) return false;
  const 标签名 = 目标.tagName;
  return 标签名 === "INPUT" || 标签名 === "TEXTAREA" || 标签名 === "SELECT" || 目标.isContentEditable;
}

export function DesignerShell() {
  const [项目名称, 设置项目名称] = useState("别墅智能化控制柜方案");
  const [项目模式, 设置项目模式] = useState<项目模式>("配电箱 / 控制柜模式");
  const [箱体配置, 设置箱体配置] = useState<箱体配置>(() => 复制默认箱体配置());
  const [已放置设备列表, 设置已放置设备列表] = useState<已放置设备[]>(() => 生成示例项目(默认箱体配置));
  const [预览设备列表, 设置预览设备列表] = useState<已放置设备[] | null>(null);
  const [选中实例编号, 设置选中实例编号] = useState<string | null>(null);
  const [导出布局图片函数, 设置导出布局图片函数] = useState<(() => void) | null>(null);
  const [设备添加错误, 设置设备添加错误] = useState<string | null>(null);
  const [网络设备状态, 设置网络设备状态] = useState<网络设备状态>(() => ({
    当前列表: 生成网络示例项目(),
    历史列表: []
  }));
  const [选中网络实例编号, 设置选中网络实例编号] = useState<string | null>(null);
  const [导出网络布局图片函数, 设置导出网络布局图片函数] = useState<(() => void) | null>(null);
  const [网络U位图导出尺寸, 设置网络U位图导出尺寸] = useState<网络U位图导出尺寸>({
    宽度毫米: 600,
    深度毫米: 600
  });
  const [自定义设备库, 设置自定义设备库] = useState<设备参数[]>([]);
  const [自定义网络设备库, 设置自定义网络设备库] = useState<网络设备参数[]>([]);
  const [本地产品库已加载, 设置本地产品库已加载] = useState(false);
  const 网络设备列表 = 网络设备状态.当前列表;
  const 网络设备历史列表 = 网络设备状态.历史列表;

  useEffect(() => {
    设置自定义设备库(读取本地产品库<设备参数>(自定义设备库存储键));
    设置自定义网络设备库(读取本地产品库<网络设备参数>(自定义网络设备库存储键));
    设置本地产品库已加载(true);
  }, []);

  useEffect(() => {
    if (!本地产品库已加载) return;
    写入本地产品库(自定义设备库存储键, 自定义设备库);
  }, [本地产品库已加载, 自定义设备库]);

  useEffect(() => {
    if (!本地产品库已加载) return;
    写入本地产品库(自定义网络设备库存储键, 自定义网络设备库);
  }, [本地产品库已加载, 自定义网络设备库]);

  const 完整设备库 = useMemo(() => [...设备库, ...自定义设备库], [自定义设备库]);
  const 完整网络设备库 = useMemo(() => [...网络设备库, ...自定义网络设备库], [自定义网络设备库]);
  const 箱内DIN组件库 = useMemo(
    () => 完整网络设备库.filter((设备) => 设备.安装方式 === "箱内DIN导轨"),
    [完整网络设备库]
  );

  const 已提交计算结果 = useMemo(() => 计算推荐方案(已放置设备列表, 箱体配置), [已放置设备列表, 箱体配置]);
  const 计算结果 = useMemo(
    () => (预览设备列表 ? 计算推荐方案(预览设备列表, 箱体配置) : 已提交计算结果),
    [预览设备列表, 箱体配置, 已提交计算结果]
  );
  const 选中设备 = useMemo(
    () => (预览设备列表 ?? 已放置设备列表).find((项目) => 项目.实例编号 === 选中实例编号) ?? null,
    [已放置设备列表, 预览设备列表, 选中实例编号]
  );

  const 添加设备 = useCallback((设备: 设备参数, 位置X毫米?: number, 位置Y毫米?: number, 数量?: number) => {
    设置预览设备列表(null);
    const 新实例 = 创建设备实例(设备, 位置X毫米 ?? 120, 位置Y毫米 ?? 120, 数量);
    const 是否指定位置 = typeof 位置X毫米 === "number" && typeof 位置Y毫米 === "number";
    const 候选设备列表 = [...已放置设备列表, 新实例];
    const 候选计算结果 = 计算推荐方案(候选设备列表, 箱体配置);
    const 默认排布 = 是否指定位置 ? 候选设备列表 : 生成自动布局(候选设备列表, 箱体配置).设备列表;
    const 待加入设备 = 默认排布.find((项目) => 项目.实例编号 === 新实例.实例编号) ?? 新实例;
    const 空位 = 查找设备加入空位(已放置设备列表, 待加入设备, 候选计算结果, 箱体配置);

    if (!空位) {
      设置设备添加错误(
        箱体配置.尺寸模式 === "自定义尺寸"
          ? `自定义尺寸空间已满，无法继续添加「${设备.设备名称}」。请增大箱体尺寸、减少加入数量，或先删除/调整现有设备。`
          : `当前箱体没有足够空间添加「${设备.设备名称}」，请调整设备或选择更大箱体。`
      );
      return;
    }

    设置设备添加错误(null);
    设置已放置设备列表([...已放置设备列表, { ...新实例, 位置X毫米: 空位.x, 位置Y毫米: 空位.y }]);
  }, [已放置设备列表, 箱体配置]);

  const 添加自定义设备 = useCallback((设备: 设备参数) => {
    设置自定义设备库((现有列表) => [...现有列表.filter((项目) => 项目.设备编号 !== 设备.设备编号), 设备]);
  }, []);

  const 删除自定义设备 = useCallback((设备编号: string) => {
    设置自定义设备库((现有列表) => 现有列表.filter((项目) => 项目.设备编号 !== 设备编号));
  }, []);

  const 更新设备位置 = useCallback((实例编号: string, 位置X毫米: number, 位置Y毫米: number) => {
    设置预览设备列表(null);
    设置已放置设备列表((现有列表) =>
      现有列表.map((项目) =>
        项目.实例编号 === 实例编号
          ? { ...项目, 位置X毫米, 位置Y毫米, 布局来源: "手动拖拽" }
          : 项目
      )
    );
  }, []);

  const 预览设备位置 = useCallback(
    (实例编号: string, 位置X毫米: number, 位置Y毫米: number) => {
      设置预览设备列表(
        已放置设备列表.map((项目) =>
          项目.实例编号 === 实例编号
            ? { ...项目, 位置X毫米, 位置Y毫米, 布局来源: "手动拖拽" }
            : 项目
        )
      );
    },
    [已放置设备列表]
  );

  const 更新设备数量 = useCallback((实例编号: string, 数量: number, 行数?: number, 列数?: number) => {
    设置预览设备列表(null);
    设置已放置设备列表((现有列表) =>
      现有列表.map((项目) =>
        项目.实例编号 === 实例编号
          ? {
              ...项目,
              数量: Math.max(1, Math.min(999, Math.round(数量))),
              行数: typeof 行数 === "number" ? Math.max(1, Math.min(99, Math.round(行数))) : 项目.行数,
              列数: typeof 列数 === "number" ? Math.max(1, Math.min(99, Math.round(列数))) : 项目.列数
            }
          : 项目
      )
    );
  }, []);

  const 删除设备 = useCallback((实例编号: string) => {
    设置预览设备列表(null);
    设置已放置设备列表((现有列表) => 现有列表.filter((项目) => 项目.实例编号 !== 实例编号));
    设置选中实例编号(null);
  }, []);

  const 执行自动排布 = useCallback(() => {
    设置预览设备列表(null);
    设置已放置设备列表((现有列表) => 生成自动布局(现有列表, 箱体配置).设备列表);
  }, [箱体配置]);

  const 注册导出布局图片 = useCallback((导出函数: (() => void) | null) => {
    设置导出布局图片函数(() => 导出函数);
  }, []);

  const 当前项目数据 = useMemo(
    () => 生成项目数据(项目名称, 已放置设备列表, 已提交计算结果, 箱体配置),
    [项目名称, 已放置设备列表, 已提交计算结果, 箱体配置]
  );
  const 已提交网络计算结果 = useMemo(() => 计算网络机柜方案(网络设备列表, 网络机柜规格库), [网络设备列表]);
  const 网络计算结果 = 已提交网络计算结果;
  const 选中网络设备 = useMemo(
    () => 网络设备列表.find((项目) => 项目.实例编号 === 选中网络实例编号) ?? null,
    [网络设备列表, 选中网络实例编号]
  );
  const 当前网络项目数据 = useMemo(
    () => 生成网络项目数据(项目名称, 网络设备列表, 已提交网络计算结果),
    [项目名称, 网络设备列表, 已提交网络计算结果]
  );

  const 提交网络设备列表更新 = useCallback((更新器: (现有列表: 已放置网络设备[]) => 已放置网络设备[]) => {
    设置网络设备状态((现有状态) => {
      const 下一列表 = 更新器(现有状态.当前列表);
      if (网络设备列表是否相同(现有状态.当前列表, 下一列表)) return 现有状态;
      return {
        当前列表: 下一列表,
        历史列表: [...现有状态.历史列表.slice(-29), 现有状态.当前列表]
      };
    });
  }, []);

  const 恢复网络上一步 = useCallback(() => {
    设置网络设备状态((现有状态) => {
      const 上一步 = 现有状态.历史列表[现有状态.历史列表.length - 1];
      if (!上一步) return 现有状态;
      return {
        当前列表: 上一步,
        历史列表: 现有状态.历史列表.slice(0, -1)
      };
    });
  }, []);

  const 添加网络设备 = useCallback((设备: 网络设备参数, 起始U位?: number) => {
    提交网络设备列表更新((现有列表) => {
      const 占用U数 = 计算网络设备占用U数(设备);
      const 新实例 = 创建网络设备实例(设备, typeof 起始U位 === "number" ? 起始U位 : 1);
      if (是箱内DIN组件设备(设备)) {
        return 添加箱内组件并确保配电箱(现有列表, 设备, 选中网络实例编号);
      }
      const 新列表 = [...现有列表, { ...新实例, 起始U位: 占用U数 <= 0 ? 0 : 新实例.起始U位, 占用U数 }];
      if (typeof 起始U位 === "number") return 新列表;

      const 默认排布 = 生成网络机柜自动布局(新列表, 网络机柜规格库).设备列表;
      const 默认新增设备 = 默认排布.find((项目) => 项目.实例编号 === 新实例.实例编号);
      const 当前占用表 = 计算网络机柜方案(现有列表, 网络机柜规格库).U位占用表;
      return 添加网络设备并保留现有U位(现有列表, 新实例, 默认新增设备?.起始U位 ?? 1, { 占用表: 当前占用表 });
    });
  }, [提交网络设备列表更新, 选中网络实例编号]);

  const 添加自定义网络设备 = useCallback((设备: 网络设备参数) => {
    设置自定义网络设备库((现有列表) => [...现有列表.filter((项目) => 项目.设备编号 !== 设备.设备编号), 设备]);
  }, []);

  const 删除自定义网络设备 = useCallback((设备编号: string) => {
    设置自定义网络设备库((现有列表) => 现有列表.filter((项目) => 项目.设备编号 !== 设备编号));
  }, []);

  const 添加箱内DIN组件到配电箱 = useCallback((设备: 网络设备参数, 配电箱实例编号: string) => {
    提交网络设备列表更新((现有列表) => 添加箱内组件并确保配电箱(现有列表, 设备, 配电箱实例编号, true));
  }, [提交网络设备列表更新]);

  const 移动箱内DIN组件顺序 = useCallback((实例编号: string, 方向: 箱内DIN组件排序方向) => {
    提交网络设备列表更新((现有列表) => 调整箱内DIN组件顺序(现有列表, 实例编号, 方向));
  }, [提交网络设备列表更新]);

  const 移动网络设备U位 = useCallback((实例编号: string, 方向: U位移动方向) => {
    提交网络设备列表更新((现有列表) => {
      const 当前设备 = 现有列表.find((项目) => 项目.实例编号 === 实例编号);
      if (!当前设备 || 计算网络设备占用U数(当前设备.设备) <= 0) return 现有列表;

      const 当前起始U位 = Math.max(1, Math.round(当前设备.起始U位 || 1));
      const 目标U位 = Math.max(1, 当前起始U位 + (方向 === "上移" ? -1 : 1));
      return 插入网络设备到U位(现有列表, 实例编号, 目标U位).设备列表;
    });
  }, [提交网络设备列表更新]);

  const 移动网络设备到U位 = useCallback((实例编号: string, 起始U位: number) => {
    提交网络设备列表更新((现有列表) => 插入网络设备到U位(现有列表, 实例编号, 起始U位).设备列表);
  }, [提交网络设备列表更新]);

  const 删除网络设备 = useCallback((实例编号: string) => {
    提交网络设备列表更新((现有列表) => 现有列表.filter((项目) => 项目.实例编号 !== 实例编号 && 项目.所属配电箱实例编号 !== 实例编号));
    设置选中网络实例编号(null);
  }, [提交网络设备列表更新]);

  useEffect(() => {
    const 处理键盘删除 = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if (event.key !== "Delete" && event.key !== "Del") return;
      if (事件目标是否可编辑(event.target)) return;

      if (项目模式 === "网络机柜模式") {
        if (!选中网络实例编号) return;
        event.preventDefault();
        删除网络设备(选中网络实例编号);
        return;
      }

      if (!选中实例编号) return;
      event.preventDefault();
      删除设备(选中实例编号);
    };

    window.addEventListener("keydown", 处理键盘删除);
    return () => window.removeEventListener("keydown", 处理键盘删除);
  }, [删除设备, 删除网络设备, 选中实例编号, 选中网络实例编号, 项目模式]);

  const 执行网络自动排布 = useCallback(() => {
    提交网络设备列表更新((现有列表) => 生成网络机柜自动布局(现有列表, 网络机柜规格库).设备列表);
  }, [提交网络设备列表更新]);

  const 整理网络设备 = useCallback((方向: U位移动方向) => {
    提交网络设备列表更新((现有列表) => 整理网络设备U位(现有列表, 方向, 已提交网络计算结果.推荐机柜U数));
  }, [已提交网络计算结果.推荐机柜U数, 提交网络设备列表更新]);

  const 注册导出网络布局图片 = useCallback((导出函数: (() => void) | null) => {
    设置导出网络布局图片函数(() => 导出函数);
  }, []);

  return (
    <main className="flex h-screen min-h-[720px] flex-col overflow-hidden bg-[#eef1f2] text-ink">
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-300/80 bg-white px-5">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-md bg-[#f5efe2] shadow-inner ring-1 ring-slate-300/80">
            <SkeuoIcon name={项目模式 === "网络机柜模式" ? "rack" : "cabinet"} size={38} />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold">配电箱 / 控制柜 / 网络机柜尺寸自动设计系统</h1>
            <p className="text-xs text-slate-500">本地 JSON 设备库 · 中文字段清单 · 2D 拖拽布局</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input
            aria-label="项目名称"
            value={项目名称}
            onChange={(event) => 设置项目名称(event.target.value)}
            className="h-9 w-64 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-800"
          />
          <div className="flex rounded-md border border-slate-300 bg-slate-100 p-1 text-sm">
            {(["配电箱 / 控制柜模式", "网络机柜模式"] as 项目模式[]).map((模式) => (
              <button
                key={模式}
                type="button"
                onClick={() => {
                  设置项目模式(模式);
                  设置选中实例编号(null);
                  设置选中网络实例编号(null);
                  设置设备添加错误(null);
                }}
                className={`inline-flex items-center gap-1.5 rounded px-3 py-1.5 transition ${
                  项目模式 === 模式 ? "bg-white text-ink shadow-sm" : "text-slate-500 hover:text-ink"
                }`}
              >
                <SkeuoIcon name={模式 === "网络机柜模式" ? "rack" : "cabinet"} size={18} />
                {模式}
              </button>
            ))}
          </div>
        </div>
      </header>

      {项目模式 === "网络机柜模式" ? (
        <section className="grid min-h-0 flex-1 grid-cols-[320px_minmax(520px,1fr)_400px] gap-0">
          <NetworkDeviceLibrary
            设备库={完整网络设备库}
            on添加设备={添加网络设备}
            on添加自定义设备={添加自定义网络设备}
            on删除自定义设备={删除自定义网络设备}
          />

          <section className="flex min-w-0 flex-col border-x border-slate-300/80 bg-[#f8fafb]">
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-slate-300/80 bg-white px-4">
              <div>
                <h2 className="text-sm font-semibold">网络机柜 U 位图</h2>
                <p className="text-xs text-slate-500">拖动设备可按 U 位吸附，右侧也可微调顺序</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={执行网络自动排布}
                  className="inline-flex items-center gap-1.5 rounded-md bg-ink px-3 py-2 text-sm font-medium text-white"
                >
                  <SkeuoIcon name="auto" size={18} />
                  自动排布
                </button>
                <button
                  type="button"
                  onClick={() => {
                    提交网络设备列表更新(() => 生成网络示例项目());
                  }}
                  className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
                >
                  <SkeuoIcon name="sample" size={18} />
                  示例项目
                </button>
                <button
                  type="button"
                  onClick={() => {
                    提交网络设备列表更新(() => []);
                    设置选中网络实例编号(null);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
                >
                  <SkeuoIcon name="clear" size={18} />
                  清空
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1">
              <NetworkRackCanvas
                设备库={完整网络设备库}
                已放置设备列表={网络设备列表}
                计算结果={已提交网络计算结果}
                导出机柜尺寸={网络U位图导出尺寸}
                选中实例编号={选中网络实例编号}
                on选择设备={设置选中网络实例编号}
                on添加设备={添加网络设备}
                on移动设备到U位={移动网络设备到U位}
                on导出函数变化={注册导出网络布局图片}
              />
            </div>
          </section>

          <NetworkRackResultPanel
            计算结果={网络计算结果}
            导出机柜尺寸={网络U位图导出尺寸}
            选中设备={选中网络设备}
            非前侧设备列表={网络设备列表.filter((项目) => 计算网络设备占用U数(项目.设备) <= 0)}
            全部设备列表={网络设备列表}
            箱内组件库={箱内DIN组件库}
            可撤销={网络设备历史列表.length > 0}
            on删除设备={删除网络设备}
            on移动设备={移动网络设备U位}
            on添加箱内组件={添加箱内DIN组件到配电箱}
            on移动箱内组件顺序={移动箱内DIN组件顺序}
            on整理设备={整理网络设备}
            on恢复上一步={恢复网络上一步}
            on导出项目={() => 导出项目数据(当前网络项目数据)}
            on导出设备清单={() => 导出网络设备清单(网络计算结果)}
            on导出材料清单={() => 导出网络材料清单(网络计算结果)}
            on导出U位占用表={() => 导出U位占用表(网络计算结果)}
            on导出布局图片={() => 导出网络布局图片函数?.()}
            on导出机柜尺寸变化={设置网络U位图导出尺寸}
          />
        </section>
      ) : (
        <section className="grid min-h-0 flex-1 grid-cols-[320px_minmax(520px,1fr)_380px] gap-0">
          <DeviceLibrary
            设备库={完整设备库}
            on添加设备={(设备, 数量) => 添加设备(设备, undefined, undefined, 数量)}
            on添加自定义设备={添加自定义设备}
            on删除自定义设备={删除自定义设备}
          />

          <section className="flex min-w-0 flex-col border-x border-slate-300/80 bg-[#f8fafb]">
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-slate-300/80 bg-white px-4">
              <div>
                <h2 className="text-sm font-semibold">柜体画布</h2>
                <p className="text-xs text-slate-500">拖入设备后可移动，自动排布会按分区和候选箱体重新计算</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={执行自动排布}
                  className="inline-flex items-center gap-1.5 rounded-md bg-ink px-3 py-2 text-sm font-medium text-white"
                >
                  <SkeuoIcon name="auto" size={18} />
                  自动排布
                </button>
                <button
                  type="button"
                  onClick={() => {
                    设置预览设备列表(null);
                    设置设备添加错误(null);
                    设置已放置设备列表(生成示例项目(箱体配置));
                  }}
                  className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
                >
                  <SkeuoIcon name="sample" size={18} />
                  示例项目
                </button>
                <button
                  type="button"
                  onClick={() => {
                    设置预览设备列表(null);
                    设置设备添加错误(null);
                    设置已放置设备列表([]);
                    设置选中实例编号(null);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
                >
                  <SkeuoIcon name="clear" size={18} />
                  清空
                </button>
              </div>
            </div>

            {设备添加错误 ? (
              <div role="alert" className="border-b border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700">
                {设备添加错误}
              </div>
            ) : null}

            <div className="min-h-0 flex-1">
              <CabinetCanvas
                设备库={完整设备库}
                已放置设备列表={已放置设备列表}
                计算结果={已提交计算结果}
                选中实例编号={选中实例编号}
                箱体配置={箱体配置}
                on选择设备={设置选中实例编号}
                on移动设备={更新设备位置}
                on预览移动设备={预览设备位置}
                on结束预览移动设备={() => 设置预览设备列表(null)}
                on更新设备数量={更新设备数量}
                on添加设备={添加设备}
                on导出函数变化={注册导出布局图片}
              />
            </div>
          </section>

          <ResultPanel
            计算结果={计算结果}
            选中设备={选中设备}
            箱体配置={箱体配置}
            on箱体配置变化={(下一步) => {
              设置预览设备列表(null);
              设置设备添加错误(null);
              设置箱体配置(下一步);
            }}
            on删除设备={删除设备}
            on导出项目={() => 导出项目数据(当前项目数据)}
            on导出设备清单={() => 导出设备清单(计算结果)}
            on导出材料清单={() => 导出材料清单(计算结果)}
            on导出布局图片={() => 导出布局图片函数?.()}
          />
        </section>
      )}
    </main>
  );
}
