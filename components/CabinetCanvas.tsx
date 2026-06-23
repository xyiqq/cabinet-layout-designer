"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Circle, Group, Layer, Line, Rect, Stage, Text } from "react-konva";
import type { 计算结果, 已放置设备, 设备参数, 箱体配置 } from "@/types/设备";
import { SkeuoIcon } from "@/components/SkeuoIcon";
import {
  计算实例占用宽度,
  计算实例显示高度,
  计算导轨安装顶部Y,
  计算导轨层顶部Y,
  计算导轨中心Y,
  计算最近导轨安装顶部Y,
  计算设备显示高度,
  计算设备占用宽度,
  获取实例列数,
  获取实例行数,
  获取实例数量,
  设备是否导轨安装,
  设备是否支持数量调整
} from "@/lib/柜体计算";

interface CabinetCanvasProps {
  设备库: 设备参数[];
  已放置设备列表: 已放置设备[];
  计算结果: 计算结果;
  选中实例编号: string | null;
  箱体配置: 箱体配置;
  on选择设备: (实例编号: string | null) => void;
  on移动设备: (实例编号: string, 位置X毫米: number, 位置Y毫米: number) => void;
  on预览移动设备?: (实例编号: string, 位置X毫米: number, 位置Y毫米: number) => void;
  on结束预览移动设备?: () => void;
  on更新设备数量: (实例编号: string, 数量: number, 行数?: number, 列数?: number) => void;
  on添加设备: (设备: 设备参数, 位置X毫米: number, 位置Y毫米: number, 数量?: number) => void;
  on导出函数变化: (导出函数: (() => void) | null) => void;
}

interface 吸附参考线 {
  方向: "横向" | "纵向";
  位置毫米: number;
}

interface 设备矩形 {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface 悬停提示 {
  x: number;
  y: number;
  标题: string;
  详情: string;
  强调色: string;
}

function 夹取(值: number, 最小值: number, 最大值: number) {
  return Math.max(最小值, Math.min(最大值, 值));
}

function 矩形是否相交(甲: 设备矩形, 乙: 设备矩形, 间距毫米: number) {
  return (
    甲.x < 乙.x + 乙.width + 间距毫米 &&
    甲.x + 甲.width + 间距毫米 > 乙.x &&
    甲.y < 乙.y + 乙.height + 间距毫米 &&
    甲.y + 甲.height + 间距毫米 > 乙.y
  );
}

function 设备颜色(设备: 设备参数) {
  if (设备.安装方式 === "端子排" || 设备.设备类别.includes("端子排")) {
    return { 填充: "#d7dde3", 描边: "#8b98a5", 文字: "#17202a" };
  }
  if (设备.设备类别.includes("电源") || 设备.是否重设备 === "是") {
    return { 填充: "#d4c8ad", 描边: "#9a8a66", 文字: "#17202a" };
  }
  if (设备.是否强电设备 === "是" && 设备.是否弱电设备 === "否") {
    return { 填充: "#e6e9ec", 描边: "#b68b78", 文字: "#17202a" };
  }
  if (设备.是否强电设备 === "是" && 设备.是否弱电设备 === "是") {
    return { 填充: "#e1e4ea", 描边: "#8a88ad", 文字: "#17202a" };
  }
  if (设备.是否弱电设备 === "是") return { 填充: "#e5eaee", 描边: "#77aab4", 文字: "#17202a" };
  return { 填充: "#edf1f4", 描边: "#a9b3bc", 文字: "#17202a" };
}

function 设备拟物类型(设备: 设备参数) {
  if (设备.安装方式 === "端子排" || 设备.设备类别.includes("端子排")) return "terminal";
  if (设备.设备类型.includes("断路器") || 设备.设备类型.includes("空开") || 设备.设备名称.includes("空气开关")) return "breaker";
  if (设备.设备类别.includes("电源") || 设备.设备名称.includes("电源")) return "power";
  if (设备.是否弱电设备 === "是" || 设备.端口数量 > 0) return "network";
  return "module";
}

function 设备产品面板样式(设备: 设备参数, 拟物类型: string) {
  if (拟物类型 === "terminal") {
    return {
      填充: "#d9dee4",
      内层填充: "#f1f4f6",
      描边: "#9aa6b2",
      强调: "#7f8b96",
      暗部: "#111827",
      端口描边: "#cbd5df"
    };
  }

  if (拟物类型 === "breaker") {
    return {
      填充: "#e8ecef",
      内层填充: "#f7f8f9",
      描边: "#b2bcc6",
      强调: 设备.是否弱电设备 === "是" ? "#8a88ad" : "#bf8d75",
      暗部: "#1f2937",
      端口描边: "#d1d8df"
    };
  }

  if (拟物类型 === "power") {
    return {
      填充: "#d4c8ad",
      内层填充: "#e8dfcc",
      描边: "#9a8a66",
      强调: "#b58a3b",
      暗部: "#2a261f",
      端口描边: "#d8caa7"
    };
  }

  if (拟物类型 === "network") {
    return {
      填充: "#e5eaee",
      内层填充: "#f4f6f7",
      描边: "#a8b2bb",
      强调: "#78aeb8",
      暗部: "#111827",
      端口描边: "#d5dbe1"
    };
  }

  return {
    填充: "#edf1f4",
    内层填充: "#f7f9fa",
    描边: "#adbac5",
    强调: "#9aa6b2",
    暗部: "#344050",
    端口描边: "#cbd5df"
  };
}

function 生成设备标注文本(设备: 设备参数, 数量: number, 行数 = 1, 列数 = 数量) {
  const 数量文本 = 设备是否支持数量调整(设备) && 数量 > 1 ? ` ×${数量}` : "";
  const 行列文本 = 设备是否支持数量调整(设备) && (行数 > 1 || 列数 > 1) ? ` · ${行数}×${列数}` : "";
  return `${设备.设备名称}${数量文本}${行列文本} · ${Math.round(计算布局尺寸(设备, 数量, 行数, 列数).width * 10) / 10}×${设备.深度毫米}mm`;
}

function 限制整数(值: number, 最小值: number, 最大值: number) {
  return Math.max(最小值, Math.min(最大值, Math.round(值)));
}

function 读取拖拽数量(值: string) {
  const 数值 = Number(值);
  return Number.isFinite(数值) ? 限制整数(数值, 1, 999) : undefined;
}

function 计算布局尺寸(设备: 设备参数, 数量 = 1, 行数 = 1, 列数 = 数量) {
  const 有效列数 = 设备是否支持数量调整(设备) ? 限制整数(列数, 1, 999) : 1;
  const 有效行数 = 设备是否支持数量调整(设备) ? 限制整数(行数, 1, 999) : 1;
  return {
    width: 计算设备占用宽度(设备, 有效列数),
    height: 计算设备显示高度(设备) * 有效行数
  };
}

export function CabinetCanvas({
  设备库,
  已放置设备列表,
  计算结果,
  选中实例编号,
  箱体配置,
  on选择设备,
  on移动设备,
  on预览移动设备,
  on结束预览移动设备,
  on更新设备数量,
  on添加设备,
  on导出函数变化
}: CabinetCanvasProps) {
  const 容器引用 = useRef<HTMLDivElement | null>(null);
  const 舞台引用 = useRef<any>(null);
  const [容器尺寸, 设置容器尺寸] = useState({ 宽度: 900, 高度: 720 });
  const [吸附参考线列表, 设置吸附参考线列表] = useState<吸附参考线[]>([]);
  const [悬停提示, 设置悬停提示] = useState<悬停提示 | null>(null);
  const [布局编辑, 设置布局编辑] = useState<{ 实例编号: string; 行数: number; 列数: number } | null>(null);

  useEffect(() => {
    if (!容器引用.current) return;
    const observer = new ResizeObserver(([entry]) => {
      const rect = entry.contentRect;
      设置容器尺寸({
        宽度: Math.max(520, Math.round(rect.width)),
        高度: Math.max(520, Math.round(rect.height))
      });
    });
    observer.observe(容器引用.current);
    return () => observer.disconnect();
  }, []);

  const 画布参数 = useMemo(() => {
    const 箱体 = 计算结果.推荐箱体尺寸;
    const 横向留白 = 126;
    const 纵向留白 = 42;
    const 比例 = Math.min(
      (容器尺寸.宽度 - 横向留白 * 2) / 箱体.宽度毫米,
      (容器尺寸.高度 - 纵向留白 * 2) / 箱体.高度毫米
    );
    const 安全比例 = Number.isFinite(比例) ? Math.max(0.18, Math.min(1.35, 比例)) : 0.6;
    const 偏移X = Math.round((容器尺寸.宽度 - 箱体.宽度毫米 * 安全比例) / 2);
    const 偏移Y = Math.round((容器尺寸.高度 - 箱体.高度毫米 * 安全比例) / 2);
    return { 箱体, 比例: 安全比例, 偏移X, 偏移Y };
  }, [容器尺寸, 计算结果.推荐箱体尺寸]);

  useEffect(() => {
    on导出函数变化(() => {
      const stage = 舞台引用.current;
      if (!stage) return;
      const 数据地址 = stage.toDataURL({ pixelRatio: 2 });
      const link = document.createElement("a");
      link.href = 数据地址;
      link.download = "柜体布局图.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });

    return () => on导出函数变化(null);
  }, [on导出函数变化]);

  const 转毫米坐标 = (像素X: number, 像素Y: number) => ({
    位置X毫米: Math.round((像素X - 画布参数.偏移X) / 画布参数.比例),
    位置Y毫米: Math.round((像素Y - 画布参数.偏移Y) / 画布参数.比例)
  });

  const { 箱体, 比例, 偏移X, 偏移Y } = 画布参数;
  const 布局规则 = 箱体配置.布局规则;
  const 左槽宽 = 布局规则.左侧竖向线槽宽度;
  const 右槽宽 = 布局规则.右侧竖向线槽宽度;
  const 顶部 = 布局规则.顶部预留空间;
  const 底部 = 布局规则.底部预留空间;
  const 分区类型列表 = useMemo(() => 计算结果.每层设备分布.map((层) => 层.分区类型), [计算结果.每层设备分布]);
  const 导轨左 = 左槽宽 + 20;
  const 导轨右 = 箱体.宽度毫米 - 右槽宽 - 20;
  const 设备避让间距毫米 = 0;
  const 标注宽度 = 180;
  const 标注高度 = 22;
  const 提示宽度 = 238;
  const 提示高度 = 70;

  const 设置鼠标样式 = (样式: string) => {
    const stage = 舞台引用.current;
    if (stage?.container) stage.container().style.cursor = 样式;
  };

  const 更新悬停提示 = (event: any, 标题: string, 详情: string, 强调色: string) => {
    const 指针 = event.target.getStage()?.getPointerPosition();
    if (!指针) return;
    设置悬停提示({
      x: 夹取(指针.x + 16, 8, Math.max(8, 容器尺寸.宽度 - 提示宽度 - 8)),
      y: 夹取(指针.y + 16, 8, Math.max(8, 容器尺寸.高度 - 提示高度 - 8)),
      标题,
      详情,
      强调色
    });
  };

  const 隐藏悬停提示 = () => {
    设置鼠标样式("default");
    设置悬停提示(null);
  };

  const 渲染悬停提示 = () => {
    if (!悬停提示) return null;

    return (
      <Group x={悬停提示.x} y={悬停提示.y} listening={false}>
        <Rect
          width={提示宽度}
          height={提示高度}
          fill="#ffffff"
          stroke="#d8dee6"
          strokeWidth={1}
          cornerRadius={9}
          shadowColor="#0f172a"
          shadowOpacity={0.14}
          shadowBlur={18}
          shadowOffsetY={8}
        />
        <Rect x={0} y={0} width={4} height={提示高度} fill={悬停提示.强调色} cornerRadius={7} />
        <Text
          x={16}
          y={13}
          width={提示宽度 - 28}
          height={19}
          text={悬停提示.标题}
          fill="#111827"
          fontSize={13}
          fontStyle="bold"
          wrap="none"
          ellipsis
        />
        <Text
          x={16}
          y={40}
          width={提示宽度 - 28}
          height={18}
          text={悬停提示.详情}
          fill="#64748b"
          fontSize={11}
          wrap="none"
          ellipsis
        />
      </Group>
    );
  };

  const 渲染设备侧边标注 = ({
    key,
    文本,
    设备X,
    设备Y,
    设备宽度像素,
    设备高度像素,
    方向,
    标签中心Y,
    颜色,
    已选中,
    onClick,
    onDblClick
  }: {
    key: string;
    文本: string;
    设备X: number;
    设备Y: number;
    设备宽度像素: number;
    设备高度像素: number;
    方向?: "左" | "右";
    标签中心Y?: number;
    颜色: string;
    已选中: boolean;
    onClick: () => void;
    onDblClick?: () => void;
  }) => {
    const 箱体左X = 偏移X;
    const 箱体右X = 偏移X + 箱体.宽度毫米 * 比例;
    const 当前方向 = 方向 ?? (设备X + 设备宽度像素 / 2 < (箱体左X + 箱体右X) / 2 ? "左" : "右");
    const 中心Y = 设备Y + 设备高度像素 / 2;
    const 标签Y = 夹取((标签中心Y ?? 中心Y) - 标注高度 / 2, 8, Math.max(8, 容器尺寸.高度 - 标注高度 - 8));
    const 左侧标签X = 夹取(箱体左X - 标注宽度 - 12, 8, Math.max(8, 容器尺寸.宽度 - 标注宽度 - 8));
    const 右侧标签X = 夹取(箱体右X + 12, 8, Math.max(8, 容器尺寸.宽度 - 标注宽度 - 8));
    const 标签X = 当前方向 === "左" ? 左侧标签X : 右侧标签X;
    const 线起点X = 当前方向 === "左" ? 设备X : 设备X + 设备宽度像素;
    const 线终点X = 当前方向 === "左" ? 标签X + 标注宽度 : 标签X;
    const 线终点Y = 标签Y + 标注高度 / 2;

    return (
      <Group key={key} onClick={onClick} onTap={onClick} onDblClick={onDblClick} onDblTap={onDblClick}>
        <Line
          points={[线起点X, 中心Y, 线终点X, 线终点Y]}
          stroke={颜色}
          strokeWidth={1.4}
          opacity={已选中 ? 0.98 : 0.74}
          listening={false}
        />
        <Circle x={线起点X} y={中心Y} radius={3} fill="#f8fafc" stroke={颜色} strokeWidth={1.2} listening={false} />
        <Rect
          x={标签X}
          y={标签Y}
          width={标注宽度}
          height={标注高度}
          fill="#ffffff"
          stroke={已选中 ? "#e9b949" : 颜色}
          strokeWidth={已选中 ? 1.8 : 1}
          cornerRadius={5}
          shadowColor="#0f172a"
          shadowOpacity={0.08}
          shadowBlur={5}
          shadowOffsetY={1}
        />
        <Text
          x={标签X + 9}
          y={标签Y + 5}
          width={标注宽度 - 18}
          height={标注高度 - 7}
          text={文本}
          fill="#17202a"
          fontSize={11}
          fontStyle="bold"
          wrap="none"
          ellipsis
          listening={false}
        />
      </Group>
    );
  };

  const 生成设备矩形 = (
    设备: 设备参数,
    位置X毫米: number,
    位置Y毫米: number,
    数量 = 1,
    行数 = 1,
    列数 = 数量
  ): 设备矩形 => {
    const 尺寸 = 计算布局尺寸(设备, 数量, 行数, 列数);
    return {
      x: 位置X毫米,
      y: 位置Y毫米,
      width: 尺寸.width,
      height: 尺寸.height
    };
  };

  const 位置是否重叠 = (
    实例编号: string | null,
    设备: 设备参数,
    位置X毫米: number,
    位置Y毫米: number,
    数量 = 1,
    行数 = 1,
    列数 = 数量
  ) => {
    const 当前矩形 = 生成设备矩形(设备, 位置X毫米, 位置Y毫米, 数量, 行数, 列数);
    return 已放置设备列表.some((项目) => {
      if (项目.实例编号 === 实例编号) return false;
      const 其他矩形 = 生成设备矩形(
        项目.设备,
        项目.位置X毫米,
        项目.位置Y毫米,
        获取实例数量(项目),
        获取实例行数(项目),
        获取实例列数(项目)
      );
      return 矩形是否相交(当前矩形, 其他矩形, 设备避让间距毫米);
    });
  };

  const 查找最近无重叠位置 = (
    实例编号: string | null,
    设备: 设备参数,
    期望X毫米: number,
    期望Y毫米: number,
    数量 = 1,
    行数 = 1,
    列数 = 数量
  ) => {
    const { width: 设备宽度, height: 设备高度 } = 计算布局尺寸(设备, 数量, 行数, 列数);
    const 最大X = Math.max(0, 箱体.宽度毫米 - 设备宽度);
    const 最大Y = Math.max(0, 箱体.高度毫米 - 设备高度);
    const 导轨锁定数量 = Math.max(1, 计算结果.DIN导轨数量 + (实例编号 ? 0 : 1));
    const 起点X = 夹取(Math.round(期望X毫米), 0, 最大X);
    const 起点Y = 夹取(
      Math.round(
        设备是否导轨安装(设备)
          ? 计算最近导轨安装顶部Y(设备, 期望Y毫米, 导轨锁定数量, 布局规则, 分区类型列表)
          : 期望Y毫米
      ),
      0,
      最大Y
    );
    const 候选位置 = new Map<string, { x: number; y: number }>();

    const 加候选 = (x: number, y: number) => {
      const 锁定Y = 设备是否导轨安装(设备)
        ? 计算最近导轨安装顶部Y(设备, y, 导轨锁定数量, 布局规则, 分区类型列表)
        : y;
      const 候选X = 夹取(Math.round(x), 0, 最大X);
      const 候选Y = 夹取(Math.round(锁定Y), 0, 最大Y);
      候选位置.set(`${候选X},${候选Y}`, { x: 候选X, y: 候选Y });
    };

    加候选(起点X, 起点Y);
    加候选(导轨左, 起点Y);
    加候选(起点X, 顶部);
    加候选(导轨右 - 设备宽度, 起点Y);
    加候选(箱体.宽度毫米 - 右槽宽 - 设备宽度, 起点Y);

    for (let 索引 = 0; 索引 < 导轨锁定数量; 索引 += 1) {
      const 层顶 = 计算导轨安装顶部Y(设备, 布局规则, 索引, 分区类型列表);
      加候选(起点X, 层顶);
      加候选(导轨左, 层顶);
    }

    for (const 项目 of 已放置设备列表) {
      if (项目.实例编号 === 实例编号) continue;
      const 其他宽度 = 计算实例占用宽度(项目);
      const 其他高度 = 计算实例显示高度(项目);
      const 左 = 项目.位置X毫米;
      const 右 = 项目.位置X毫米 + 其他宽度;
      const 上 = 项目.位置Y毫米;
      const 下 = 项目.位置Y毫米 + 其他高度;
      const 间距 = 设备避让间距毫米;

      加候选(右 + 间距, 上);
      加候选(左 - 间距 - 设备宽度, 上);
      加候选(左, 下 + 间距);
      加候选(左, 上 - 间距 - 设备高度);
      加候选(右 + 间距, 起点Y);
      加候选(左 - 间距 - 设备宽度, 起点Y);
      加候选(起点X, 下 + 间距);
      加候选(起点X, 上 - 间距 - 设备高度);
    }

    const 扫描步长 = 10;
    const 最大半径 = Math.max(箱体.宽度毫米, 箱体.高度毫米);
    for (let 半径 = 扫描步长; 半径 <= 最大半径; 半径 += 扫描步长) {
      for (let dx = -半径; dx <= 半径; dx += 扫描步长) {
        加候选(起点X + dx, 起点Y - 半径);
        加候选(起点X + dx, 起点Y + 半径);
      }
      for (let dy = -半径 + 扫描步长; dy <= 半径 - 扫描步长; dy += 扫描步长) {
        加候选(起点X - 半径, 起点Y + dy);
        加候选(起点X + 半径, 起点Y + dy);
      }
    }

    const 当前设备原位置 = 实例编号 ? 已放置设备列表.find((项目) => 项目.实例编号 === 实例编号) : null;
    if (当前设备原位置) 加候选(当前设备原位置.位置X毫米, 当前设备原位置.位置Y毫米);

    const 排序后候选 = Array.from(候选位置.values()).sort((甲, 乙) => {
      const 甲距离 = Math.hypot(甲.x - 起点X, 甲.y - 起点Y);
      const 乙距离 = Math.hypot(乙.x - 起点X, 乙.y - 起点Y);
      return 甲距离 - 乙距离 || 甲.y - 乙.y || 甲.x - 乙.x;
    });

    return 排序后候选.find((候选) => !位置是否重叠(实例编号, 设备, 候选.x, 候选.y, 数量, 行数, 列数)) ?? null;
  };

  const 计算吸附位置 = (
    实例编号: string | null,
    设备: 设备参数,
    原始X毫米: number,
    原始Y毫米: number,
    数量 = 1,
    行数 = 1,
    列数 = 数量
  ) => {
    const { width: 设备宽度, height: 设备高度 } = 计算布局尺寸(设备, 数量, 行数, 列数);
    const 最大X = Math.max(0, 箱体.宽度毫米 - 设备宽度);
    const 最大Y = Math.max(0, 箱体.高度毫米 - 设备高度);
    const 导轨锁定数量 = Math.max(1, 计算结果.DIN导轨数量 + (实例编号 ? 0 : 1));
    let 位置X毫米 = 夹取(原始X毫米, 0, 最大X);
    let 位置Y毫米 = 夹取(
      设备是否导轨安装(设备)
        ? 计算最近导轨安装顶部Y(设备, 原始Y毫米, 导轨锁定数量, 布局规则, 分区类型列表)
        : 原始Y毫米,
      0,
      最大Y
    );
    const 参考线: 吸附参考线[] = [];

    if (!箱体配置.是否启用自动吸附) {
      const 无重叠位置 = 查找最近无重叠位置(实例编号, 设备, 位置X毫米, 位置Y毫米, 数量, 行数, 列数);
      if (!无重叠位置) return { 位置X毫米, 位置Y毫米, 参考线 };
      return { 位置X毫米: 无重叠位置.x, 位置Y毫米: 无重叠位置.y, 参考线 };
    }

    const 网格 = 10;
    位置X毫米 = Math.round(位置X毫米 / 网格) * 网格;
    if (!设备是否导轨安装(设备)) {
      位置Y毫米 = Math.round(位置Y毫米 / 网格) * 网格;
    }

    const X候选: Array<{ 目标: number; 参考线: number }> = [
      { 目标: 0, 参考线: 0 },
      { 目标: 左槽宽, 参考线: 左槽宽 },
      { 目标: 导轨左, 参考线: 导轨左 },
      { 目标: 导轨右 - 设备宽度, 参考线: 导轨右 },
      { 目标: 箱体.宽度毫米 - 右槽宽 - 设备宽度, 参考线: 箱体.宽度毫米 - 右槽宽 },
      { 目标: 最大X, 参考线: 箱体.宽度毫米 }
    ];
    const Y候选: Array<{ 目标: number; 参考线: number }> = [
      { 目标: 0, 参考线: 0 },
      { 目标: 顶部, 参考线: 顶部 },
      { 目标: 箱体.高度毫米 - 底部 - 设备高度, 参考线: 箱体.高度毫米 - 底部 },
      { 目标: 最大Y, 参考线: 箱体.高度毫米 }
    ];

    for (let 索引 = 0; 索引 < 导轨锁定数量; 索引 += 1) {
      const 导轨Y = 计算导轨中心Y(布局规则, 索引, 分区类型列表);
      const 层顶 = Math.max(0, 计算导轨安装顶部Y(设备, 布局规则, 索引, 分区类型列表));
      X候选.push({ 目标: 导轨左, 参考线: 导轨左 });
      Y候选.push({ 目标: 层顶, 参考线: 导轨Y });
      if (!设备是否导轨安装(设备)) {
        const 层内容顶 = 计算导轨层顶部Y(布局规则, 索引, 分区类型列表) + 20;
        Y候选.push({ 目标: 层内容顶, 参考线: 层内容顶 });
      }
    }

    const 端子区顶 = 箱体.高度毫米 - 底部 - 布局规则.端子排区域高度;
    Y候选.push({ 目标: 端子区顶, 参考线: 端子区顶 });

    for (const 项目 of 已放置设备列表) {
      if (项目.实例编号 === 实例编号) continue;
      const 其他宽度 = 计算实例占用宽度(项目);
      const 其他高度 = 计算实例显示高度(项目);
      const 其他左 = 项目.位置X毫米;
      const 其他右 = 项目.位置X毫米 + 其他宽度;
      const 其他上 = 项目.位置Y毫米;
      const 其他下 = 项目.位置Y毫米 + 其他高度;

      X候选.push(
        { 目标: 其他左, 参考线: 其他左 },
        { 目标: 其他右, 参考线: 其他右 },
        { 目标: 其他左 - 设备宽度, 参考线: 其他左 },
        { 目标: 其他右 - 设备宽度, 参考线: 其他右 }
      );
      if (!设备是否导轨安装(设备)) {
        Y候选.push(
          { 目标: 其他上, 参考线: 其他上 },
          { 目标: 其他下, 参考线: 其他下 },
          { 目标: 其他上 - 设备高度, 参考线: 其他上 },
          { 目标: 其他下 - 设备高度, 参考线: 其他下 }
        );
      }
    }

    const 吸附阈值 = 箱体配置.吸附间距毫米;
    const X吸附 = X候选
      .map((候选) => ({ ...候选, 距离: Math.abs(候选.目标 - 位置X毫米) }))
      .filter((候选) => 候选.距离 <= 吸附阈值)
      .sort((甲, 乙) => 甲.距离 - 乙.距离)[0];
    const Y吸附 = Y候选
      .map((候选) => ({ ...候选, 距离: Math.abs(候选.目标 - 位置Y毫米) }))
      .filter((候选) => 候选.距离 <= 吸附阈值)
      .sort((甲, 乙) => 甲.距离 - 乙.距离)[0];

    if (X吸附) {
      位置X毫米 = X吸附.目标;
      参考线.push({ 方向: "纵向", 位置毫米: X吸附.参考线 });
    }
    if (Y吸附 && !设备是否导轨安装(设备)) {
      位置Y毫米 = Y吸附.目标;
      参考线.push({ 方向: "横向", 位置毫米: Y吸附.参考线 });
    }
    if (设备是否导轨安装(设备)) {
      const 导轨顶 = 计算最近导轨安装顶部Y(设备, 位置Y毫米, 导轨锁定数量, 布局规则, 分区类型列表);
      const 导轨中心 = 导轨顶 + 设备高度 / 2;
      位置Y毫米 = 导轨顶;
      参考线.push({ 方向: "横向", 位置毫米: 导轨中心 });
    }

    const 无重叠位置 = 查找最近无重叠位置(实例编号, 设备, 位置X毫米, 位置Y毫米, 数量, 行数, 列数);
    if (无重叠位置) {
      if (Math.abs(无重叠位置.x - 位置X毫米) > 0) {
        参考线.push({ 方向: "纵向", 位置毫米: 无重叠位置.x });
      }
      if (Math.abs(无重叠位置.y - 位置Y毫米) > 0) {
        参考线.push({ 方向: "横向", 位置毫米: 无重叠位置.y });
      }
      位置X毫米 = 无重叠位置.x;
      位置Y毫米 = 无重叠位置.y;
    }

    return {
      位置X毫米: 夹取(Math.round(位置X毫米), 0, 最大X),
      位置Y毫米: 夹取(Math.round(位置Y毫米), 0, 最大Y),
      参考线
    };
  };

  const 打开布局编辑 = (项目: 已放置设备) => {
    if (!设备是否支持数量调整(项目.设备)) return;
    隐藏悬停提示();
    on选择设备(项目.实例编号);
    设置布局编辑({
      实例编号: 项目.实例编号,
      行数: 获取实例行数(项目),
      列数: 获取实例列数(项目)
    });
  };

  const 应用布局编辑 = () => {
    if (!布局编辑) return;
    const 项目 = 已放置设备列表.find((候选) => 候选.实例编号 === 布局编辑.实例编号);
    if (!项目 || !设备是否支持数量调整(项目.设备)) {
      设置布局编辑(null);
      return;
    }

    const 行数 = 限制整数(布局编辑.行数, 1, 99);
    const 列数 = 限制整数(布局编辑.列数, 1, 99);
    const 数量 = 行数 * 列数;
    const 调整后位置 = 查找最近无重叠位置(
      项目.实例编号,
      项目.设备,
      项目.位置X毫米,
      项目.位置Y毫米,
      数量,
      行数,
      列数
    );

    if (!调整后位置) {
      window.alert("当前箱体没有足够空间容纳这个行列布局，请先增大箱体或调整其他设备。");
      return;
    }

    on更新设备数量(项目.实例编号, 数量, 行数, 列数);
    on移动设备(项目.实例编号, 调整后位置.x, 调整后位置.y);
    设置布局编辑(null);
  };

  const 处理拖放 = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const 设备编号 = event.dataTransfer.getData("设备编号");
    const 设备 = 设备库.find((项目) => 项目.设备编号 === 设备编号);
    if (!设备 || !容器引用.current) return;
    const 数量 = 设备是否支持数量调整(设备) ? 读取拖拽数量(event.dataTransfer.getData("设备数量")) ?? 设备.默认数量 ?? 1 : 1;

    const rect = 容器引用.current.getBoundingClientRect();
    const 坐标 = 转毫米坐标(event.clientX - rect.left, event.clientY - rect.top);
    const { width: 设备宽度, height: 设备高度 } = 计算布局尺寸(设备, 数量, 1, 数量);
    const 吸附结果 = 计算吸附位置(
      null,
      设备,
      坐标.位置X毫米 - 设备宽度 / 2,
      坐标.位置Y毫米 - 设备高度 / 2,
      数量,
      1,
      数量
    );
    on添加设备(设备, 吸附结果.位置X毫米, 吸附结果.位置Y毫米, 数量);
  };

  return (
    <div
      ref={容器引用}
      onDragOver={(event) => event.preventDefault()}
      onDrop={处理拖放}
      className="relative h-full w-full bg-[#f8fafb]"
    >
      <Stage
        ref={舞台引用}
        width={容器尺寸.宽度}
        height={容器尺寸.高度}
        onMouseDown={(event) => {
          if (event.target === event.target.getStage()) on选择设备(null);
        }}
        onTouchStart={(event) => {
          if (event.target === event.target.getStage()) on选择设备(null);
        }}
      >
        <Layer>
          <Rect
            x={0}
            y={0}
            width={容器尺寸.宽度}
            height={容器尺寸.高度}
            fill="#f8fafb"
            onClick={() => on选择设备(null)}
            onTap={() => on选择设备(null)}
          />

          <Group x={偏移X} y={偏移Y} scaleX={比例} scaleY={比例}>
            <Rect
              x={0}
              y={0}
              width={箱体.宽度毫米}
              height={箱体.高度毫米}
              fill="#f6f3ea"
              stroke="#17202a"
              strokeWidth={3 / 比例}
              cornerRadius={8}
              onClick={() => on选择设备(null)}
              onTap={() => on选择设备(null)}
            />

            <Rect x={0} y={0} width={箱体.宽度毫米} height={顶部} fill="#e8edf0" />
            <Text x={18} y={20} text={`顶部预留 ${顶部} 毫米`} fontSize={15} fill="#64748b" />

            <Rect
              x={0}
              y={箱体.高度毫米 - 底部}
              width={箱体.宽度毫米}
              height={底部}
              fill="#e8edf0"
            />
            <Text x={18} y={箱体.高度毫米 - 底部 + 22} text={`底部预留 ${底部} 毫米`} fontSize={15} fill="#64748b" />

            <Rect x={0} y={顶部} width={左槽宽} height={箱体.高度毫米 - 顶部 - 底部} fill="#d7dee2" />
            <Rect
              x={箱体.宽度毫米 - 右槽宽}
              y={顶部}
              width={右槽宽}
              height={箱体.高度毫米 - 顶部 - 底部}
              fill="#d7dee2"
            />
            <Text x={10} y={顶部 + 22} text="左竖向线槽" fontSize={13} fill="#475569" rotation={90} />
            <Text x={箱体.宽度毫米 - 26} y={顶部 + 22} text="右竖向线槽" fontSize={13} fill="#475569" rotation={90} />

            {Array.from({ length: 计算结果.DIN导轨数量 }).map((_, 索引) => {
              const 导轨Y = 计算导轨中心Y(布局规则, 索引, 分区类型列表);
              const 当前层 = 计算结果.每层设备分布[索引];
              const 线槽Y = 计算导轨层顶部Y(布局规则, 索引, 分区类型列表) + (当前层?.空间高度毫米 ?? 布局规则.空开端子区高度);
              if (导轨Y > 箱体.高度毫米 - 底部 - 50) return null;
              return (
                <Group key={`导轨-${索引 + 1}`}>
                  <Line
                    points={[导轨左, 导轨Y, 导轨右, 导轨Y]}
                    stroke="#4f5660"
                    strokeWidth={8}
                    lineCap="round"
                  />
                  <Line
                    points={[导轨左, 导轨Y, 导轨右, 导轨Y]}
                    stroke="#cbd5e1"
                    strokeWidth={2}
                    dash={[8, 8]}
                  />
                  <Text
                    x={导轨左}
                    y={导轨Y - 34}
                    text={`DIN 导轨 ${索引 + 1}${当前层 ? ` · ${当前层.空间高度毫米}mm` : ""}`}
                    fontSize={14}
                    fill="#334155"
                  />
                  {索引 < 计算结果.DIN导轨数量 - 1 ? (
                    <Rect
                      x={左槽宽}
                      y={线槽Y}
                      width={箱体.宽度毫米 - 左槽宽 - 右槽宽}
                      height={布局规则.横向线槽高度}
                      fill="#d7dee2"
                      opacity={0.72}
                    />
                  ) : null}
                </Group>
              );
            })}

            <Rect
              x={左槽宽}
              y={箱体.高度毫米 - 底部 - 布局规则.端子排区域高度}
              width={箱体.宽度毫米 - 左槽宽 - 右槽宽}
              height={布局规则.端子排区域高度}
              fill="#e4e8eb"
              stroke="#cbd5e1"
              dash={[10, 8]}
              strokeWidth={2}
            />
            <Text
              x={左槽宽 + 18}
              y={箱体.高度毫米 - 底部 - 布局规则.端子排区域高度 + 18}
              text={`独立端子端口区 / ${布局规则.端子排区域高度}mm`}
              fontSize={15}
              fill="#64748b"
            />

            {吸附参考线列表.map((参考线, 索引) =>
              参考线.方向 === "纵向" ? (
                <Line
                  key={`吸附纵线-${索引}-${参考线.位置毫米}`}
                  points={[参考线.位置毫米, 0, 参考线.位置毫米, 箱体.高度毫米]}
                  stroke="#f4c542"
                  strokeWidth={2 / 比例}
                  dash={[8, 6]}
                />
              ) : (
                <Line
                  key={`吸附横线-${索引}-${参考线.位置毫米}`}
                  points={[0, 参考线.位置毫米, 箱体.宽度毫米, 参考线.位置毫米]}
                  stroke="#f4c542"
                  strokeWidth={2 / 比例}
                  dash={[8, 6]}
                />
              )
            )}
          </Group>

          {已放置设备列表.map((项目) => {
            const 设备 = 项目.设备;
            const 数量 = 获取实例数量(项目);
            const 行数 = 获取实例行数(项目);
            const 列数 = 获取实例列数(项目);
            const 设备宽度 = 计算实例占用宽度(项目);
            const 设备宽度像素 = 设备宽度 * 比例;
            const 设备高度 = 计算实例显示高度(项目);
            const 设备高度像素 = 设备高度 * 比例;
            const 单个宽度像素 = (设备.单个宽度毫米 ?? 设备.宽度毫米) * 比例;
            const 单个高度像素 = 计算设备显示高度(设备) * 比例;
            const 已选中 = 项目.实例编号 === 选中实例编号;
            const 拟物类型 = 设备拟物类型(设备);
            const 面板样式 = 设备产品面板样式(设备, 拟物类型);
            const 可画细节 = 设备宽度像素 >= 28 && 设备高度像素 >= 28;
            const 端口数量 = Math.max(2, Math.min(8, Math.floor((设备宽度像素 - 14) / 9)));
            const 通风线数量 = Math.max(2, Math.min(5, Math.floor((设备宽度像素 - 18) / 14)));
            const 提示标题 = 设备是否支持数量调整(设备) && 数量 > 1 ? `${设备.设备名称} ×${数量}` : 设备.设备名称;
            const 行列文本 = 设备是否支持数量调整(设备) ? ` · ${行数}行×${列数}列` : "";
            const 提示详情 = `尺寸 ${Math.round(设备宽度 * 10) / 10}×${设备高度}×${设备.深度毫米} mm${行列文本}`;

            return (
              <Group
                key={项目.实例编号}
                x={偏移X + 项目.位置X毫米 * 比例}
                y={偏移Y + 项目.位置Y毫米 * 比例}
                draggable
                onMouseEnter={(event) => {
                  设置鼠标样式("pointer");
                  更新悬停提示(event, 提示标题, 提示详情, 面板样式.强调);
                }}
                onMouseMove={(event) => 更新悬停提示(event, 提示标题, 提示详情, 面板样式.强调)}
                onMouseLeave={隐藏悬停提示}
                onClick={() => on选择设备(项目.实例编号)}
                onTap={() => on选择设备(项目.实例编号)}
                onDblClick={() => 打开布局编辑(项目)}
                onDblTap={() => 打开布局编辑(项目)}
                onDragStart={() => {
                  隐藏悬停提示();
                  on选择设备(项目.实例编号);
                }}
                onDragMove={(event) => {
                  const 坐标 = 转毫米坐标(event.target.x(), event.target.y());
                  const 吸附结果 = 计算吸附位置(项目.实例编号, 设备, 坐标.位置X毫米, 坐标.位置Y毫米, 数量, 行数, 列数);
                  event.target.position({
                    x: 偏移X + 吸附结果.位置X毫米 * 比例,
                    y: 偏移Y + 吸附结果.位置Y毫米 * 比例
                  });
                  on预览移动设备?.(项目.实例编号, 吸附结果.位置X毫米, 吸附结果.位置Y毫米);
                  设置吸附参考线列表(吸附结果.参考线);
                }}
                onDragEnd={(event) => {
                  const 坐标 = 转毫米坐标(event.target.x(), event.target.y());
                  const 吸附结果 = 计算吸附位置(项目.实例编号, 设备, 坐标.位置X毫米, 坐标.位置Y毫米, 数量, 行数, 列数);
                  on移动设备(
                    项目.实例编号,
                    吸附结果.位置X毫米,
                    吸附结果.位置Y毫米
                  );
                  on结束预览移动设备?.();
                  设置吸附参考线列表([]);
                }}
              >
                <Rect
                  width={设备宽度像素}
                  height={设备高度像素}
                  fill={面板样式.填充}
                  stroke={已选中 ? "#e9b949" : 面板样式.描边}
                  strokeWidth={已选中 ? 3 : 1.4}
                  cornerRadius={5}
                  shadowColor="#0f172a"
                  shadowOpacity={已选中 ? 0.16 : 0.07}
                  shadowBlur={已选中 ? 10 : 2}
                  shadowOffsetY={已选中 ? 4 : 1}
                  />
                {设备是否支持数量调整(设备) && (行数 > 1 || 列数 > 1) ? (
                  <Group listening={false}>
                    {Array.from({ length: Math.max(0, 列数 - 1) }).map((_, 索引) => (
                      <Line
                        key={`col-${索引}`}
                        points={[(索引 + 1) * 单个宽度像素, 0, (索引 + 1) * 单个宽度像素, 设备高度像素]}
                        stroke="#ffffff"
                        strokeWidth={1}
                        opacity={0.5}
                      />
                    ))}
                    {Array.from({ length: Math.max(0, 行数 - 1) }).map((_, 索引) => (
                      <Line
                        key={`row-${索引}`}
                        points={[0, (索引 + 1) * 单个高度像素, 设备宽度像素, (索引 + 1) * 单个高度像素]}
                        stroke="#ffffff"
                        strokeWidth={1}
                        opacity={0.5}
                      />
                    ))}
                  </Group>
                ) : null}
                {可画细节 ? (
                  <>
                    <Rect
                      x={3}
                      y={3}
                      width={Math.max(0, 设备宽度像素 - 6)}
                      height={Math.max(10, 设备高度像素 - 6)}
                      fill={面板样式.内层填充}
                      opacity={拟物类型 === "power" ? 0.58 : 0.72}
                      cornerRadius={4}
                      listening={false}
                    />
                    <Rect
                      x={3}
                      y={3}
                      width={Math.max(0, 设备宽度像素 - 6)}
                      height={Math.max(8, 设备高度像素 * 0.34)}
                      fill="#ffffff"
                      opacity={0.38}
                      cornerRadius={4}
                      listening={false}
                    />
                    <Rect
                      x={2}
                      y={Math.max(0, 设备高度像素 - 9)}
                      width={Math.max(0, 设备宽度像素 - 4)}
                      height={7}
                      fill={面板样式.暗部}
                      opacity={拟物类型 === "power" ? 0.2 : 0.1}
                      cornerRadius={3}
                      listening={false}
                    />
                    <Rect
                      x={5}
                      y={Math.max(5, 设备高度像素 - 8)}
                      width={Math.max(10, 设备宽度像素 - 10)}
                      height={2}
                      fill={面板样式.强调}
                      opacity={0.68}
                      cornerRadius={1}
                      listening={false}
                    />
                    {设备宽度像素 >= 58 ? (
                      <>
                        <Circle x={9} y={9} radius={2.1} fill="#f8fafc" stroke="#9aa6b2" strokeWidth={0.6} opacity={0.96} listening={false} />
                        <Circle x={设备宽度像素 - 9} y={9} radius={2.1} fill="#f8fafc" stroke="#9aa6b2" strokeWidth={0.6} opacity={0.96} listening={false} />
                      </>
                    ) : null}
                    {拟物类型 === "terminal" ? (
                      <Group x={7} y={Math.max(设备高度像素 - 18, 18)} listening={false}>
                        {Array.from({ length: 端口数量 }).map((_, 索引) => (
                          <Rect
                            key={`terminal-${索引}`}
                            x={索引 * 9}
                            y={0}
                            width={6}
                            height={10}
                            fill="#111827"
                            stroke={面板样式.端口描边}
                            strokeWidth={0.65}
                            cornerRadius={1}
                            opacity={0.88}
                          />
                        ))}
                      </Group>
                    ) : null}
                    {拟物类型 === "breaker" ? (
                      <Group x={Math.max(6, 设备宽度像素 * 0.5 - 9)} y={Math.max(15, 设备高度像素 * 0.42)} listening={false}>
                        <Rect width={18} height={Math.max(11, 设备高度像素 * 0.27)} fill="#f8fafc" stroke="#cbd5df" strokeWidth={0.8} cornerRadius={2} />
                        <Line
                          points={[5, Math.max(7, 设备高度像素 * 0.2), 13, 3]}
                          stroke="#111827"
                          strokeWidth={2.5}
                          lineCap="round"
                        />
                        <Circle x={15} y={Math.max(8, 设备高度像素 * 0.18)} radius={1.6} fill="#87d985" />
                      </Group>
                    ) : null}
                    {拟物类型 === "network" ? (
                      <Group x={7} y={Math.max(设备高度像素 - 18, 18)} listening={false}>
                        {Array.from({ length: 端口数量 }).map((_, 索引) => (
                          <Group key={`port-${索引}`} x={索引 * 9} y={0}>
                            <Rect width={6} height={6} fill="#111827" stroke={面板样式.端口描边} strokeWidth={0.65} cornerRadius={1} />
                            <Rect x={1} y={1} width={4} height={1} fill="#2c3642" opacity={0.9} cornerRadius={0.5} />
                          </Group>
                        ))}
                        <Circle x={Math.min(设备宽度像素 - 18, 端口数量 * 9 + 4)} y={3} radius={2.1} fill="#87d985" />
                      </Group>
                    ) : null}
                    {拟物类型 === "power" ? (
                      <Group x={8} y={Math.max(设备高度像素 - 19, 18)} listening={false}>
                        {Array.from({ length: 通风线数量 }).map((_, 索引) => (
                          <Line
                            key={`vent-${索引}`}
                            points={[索引 * 13, 0, 索引 * 13 + 8, 0]}
                            stroke="#2f2b23"
                            strokeWidth={1.8}
                            lineCap="round"
                            opacity={0.5}
                          />
                        ))}
                        <Circle x={Math.min(设备宽度像素 - 18, 通风线数量 * 13 + 3)} y={0} radius={2} fill="#f0b95d" />
                      </Group>
                    ) : null}
                  </>
                ) : null}
              </Group>
            );
          })}

          {(() => {
            const 下一标签Y: Record<"左" | "右", number> = { 左: 8, 右: 8 };
            const 箱体中心X = 偏移X + (箱体.宽度毫米 * 比例) / 2;

            return 已放置设备列表
              .map((项目) => {
                const 设备 = 项目.设备;
                const 数量 = 获取实例数量(项目);
                const 设备宽度像素 = 计算实例占用宽度(项目) * 比例;
                const 设备高度像素 = 计算实例显示高度(项目) * 比例;
                const 设备X = 偏移X + 项目.位置X毫米 * 比例;
                const 设备Y = 偏移Y + 项目.位置Y毫米 * 比例;
                return { 项目, 设备, 数量, 设备宽度像素, 设备高度像素, 设备X, 设备Y };
              })
              .sort((甲, 乙) => (甲.设备Y + 甲.设备高度像素 / 2) - (乙.设备Y + 乙.设备高度像素 / 2))
              .map(({ 项目, 设备, 数量, 设备宽度像素, 设备高度像素, 设备X, 设备Y }) => {
                const 配色 = 设备颜色(设备);
                const 已选中 = 项目.实例编号 === 选中实例编号;
                const 方向 = 设备X + 设备宽度像素 / 2 < 箱体中心X ? "左" : "右";
                const 期望Y = 设备Y + 设备高度像素 / 2 - 标注高度 / 2;
                const 标签Y = 夹取(
                  Math.max(期望Y, 下一标签Y[方向]),
                  8,
                  Math.max(8, 容器尺寸.高度 - 标注高度 - 8)
                );
                下一标签Y[方向] = 标签Y + 标注高度 + 5;

                return 渲染设备侧边标注({
                  key: `device-label-${项目.实例编号}`,
                  文本: 生成设备标注文本(设备, 数量, 获取实例行数(项目), 获取实例列数(项目)),
                  设备X,
                  设备Y,
                  设备宽度像素,
                  设备高度像素,
                  方向,
                  标签中心Y: 标签Y + 标注高度 / 2,
                  颜色: 配色.描边,
                  已选中,
                  onClick: () => on选择设备(项目.实例编号),
                  onDblClick: 设备是否支持数量调整(设备) ? () => 打开布局编辑(项目) : undefined
                });
              });
          })()}

          {渲染悬停提示()}
        </Layer>
      </Stage>

      {布局编辑 ? (() => {
        const 项目 = 已放置设备列表.find((候选) => 候选.实例编号 === 布局编辑.实例编号);
        if (!项目) return null;
        const 行数 = 限制整数(布局编辑.行数, 1, 99);
        const 列数 = 限制整数(布局编辑.列数, 1, 99);
        const 数量 = 行数 * 列数;
        const 单位 = 项目.设备.数量单位 ?? "个";

        return (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-900/20 px-4">
            <form
              onSubmit={(event) => {
                event.preventDefault();
                应用布局编辑();
              }}
              className="w-full max-w-[360px] rounded-md border border-slate-300 bg-white p-4 shadow-2xl"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold text-slate-900">设备行列设置</h3>
                  <p className="mt-1 truncate text-xs text-slate-500">{项目.设备.设备名称}</p>
                </div>
                <button
                  type="button"
                  onClick={() => 设置布局编辑(null)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 text-slate-500 hover:bg-slate-50"
                  aria-label="关闭行列设置"
                >
                  <SkeuoIcon name="cancel" size={16} />
                </button>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <label className="text-xs font-medium text-slate-500">
                  行数
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={行数}
                    onChange={(event) =>
                      设置布局编辑((当前) =>
                        当前 ? { ...当前, 行数: 限制整数(Number(event.target.value) || 1, 1, 99) } : 当前
                      )
                    }
                    className="mt-1 h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-sm font-semibold text-slate-900"
                  />
                </label>
                <label className="text-xs font-medium text-slate-500">
                  列数
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={列数}
                    onChange={(event) =>
                      设置布局编辑((当前) =>
                        当前 ? { ...当前, 列数: 限制整数(Number(event.target.value) || 1, 1, 99) } : 当前
                      )
                    }
                    className="mt-1 h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-sm font-semibold text-slate-900"
                  />
                </label>
              </div>

              <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-slate-800">
                合计 {数量} {单位} · {行数} 行 × {列数} 列
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => 设置布局编辑(null)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700"
                >
                  <SkeuoIcon name="cancel" size={15} />
                  取消
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-1.5 rounded-md bg-ink px-3 py-2 text-xs font-medium text-white"
                >
                  <SkeuoIcon name="save" size={15} />
                  保存
                </button>
              </div>
            </form>
          </div>
        );
      })() : null}
    </div>
  );
}
