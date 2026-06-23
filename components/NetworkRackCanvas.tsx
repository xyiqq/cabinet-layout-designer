"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Circle, Group, Layer, Line, Rect, Stage, Text } from "react-konva";
import type { 已放置网络设备, 网络机柜计算结果, 网络设备参数 } from "@/types/设备";
import { 计算网络设备占用U数 } from "@/lib/网络机柜计算";

interface NetworkRackCanvasProps {
  设备库: 网络设备参数[];
  已放置设备列表: 已放置网络设备[];
  计算结果: 网络机柜计算结果;
  导出机柜尺寸: {
    宽度毫米: number;
    深度毫米: number;
  };
  选中实例编号: string | null;
  on选择设备: (实例编号: string | null) => void;
  on添加设备: (设备: 网络设备参数, 起始U位: number) => void;
  on移动设备到U位: (实例编号: string, 起始U位: number) => void;
  on导出函数变化: (导出函数: (() => void) | null) => void;
}

interface 悬停提示 {
  x: number;
  y: number;
  标题: string;
  详情: string;
  强调色: string;
}

const 每U高度毫米 = 44.45;

function 夹取(值: number, 最小值: number, 最大值: number) {
  return Math.max(最小值, Math.min(最大值, 值));
}

function 设备颜色(设备: 网络设备参数) {
  if (设备.设备类别.includes("UPS")) return { 填充: "#7a6842", 描边: "#5f5135", 文字: "#ffffff" };
  if (设备.设备类别.includes("PoE")) return { 填充: "#a96d61", 描边: "#7d5149", 文字: "#ffffff" };
  if (设备.设备类别.includes("交换机")) return { 填充: "#6f8f9d", 描边: "#4f6873", 文字: "#ffffff" };
  if (设备.设备类别.includes("配线架") || 设备.设备类别.includes("理线架")) {
    return { 填充: "#8b96a3", 描边: "#5f6b77", 文字: "#ffffff" };
  }
  if (设备.设备类别.includes("NVR") || 设备.设备类别.includes("NAS")) {
    return { 填充: "#8583a7", 描边: "#62607f", 文字: "#ffffff" };
  }
  if (设备.设备类别.includes("机柜配电箱")) {
    return { 填充: "#384350", 描边: "#b49a5a", 文字: "#fef3c7" };
  }
  if (设备.设备类别.includes("盲板")) return { 填充: "#d7dee2", 描边: "#94a3b8", 文字: "#334155" };
  return { 填充: "#e7ebee", 描边: "#a9b3bc", 文字: "#17202a" };
}

function 网络设备拟物类型(设备: 网络设备参数) {
  if (设备.设备类别.includes("机柜配电箱")) return "cabinet";
  if (设备.设备类别.includes("UPS") || 设备.设备类别.includes("PDU") || 设备.设备名称.includes("电源")) return "power";
  if (
    设备.设备类别.includes("交换机") ||
    设备.设备类别.includes("配线架") ||
    设备.设备类别.includes("理线架") ||
    设备.设备类型.includes("路由") ||
    设备.设备名称.includes("网关") ||
    设备.设备名称.includes("光猫") ||
    设备.网口数量 > 0 ||
    设备.PoE口数量 > 0
  ) return "network";
  if (设备.设备类别.includes("托盘") || 设备.是否需要托盘 === "是") return "tray";
  if (设备.设备类别.includes("NVR") || 设备.设备类别.includes("NAS")) return "server";
  return "rack";
}

function 设备产品面板样式(设备: 网络设备参数, 拟物类型: string) {
  const 是PoE = 设备.设备类别.includes("PoE") || 设备.PoE口数量 > 0;

  if (拟物类型 === "cabinet") {
    return {
      填充: "#303a45",
      内层填充: "#3f4a56",
      描边: "#a88b45",
      强调: "#d5b66f",
      暗部: "#111827",
      端口描边: "#c7ced6"
    };
  }

  if (拟物类型 === "power") {
    return {
      填充: "#d4c8ad",
      内层填充: "#e6ddc8",
      描边: "#9a8a66",
      强调: "#b58a3b",
      暗部: "#2a261f",
      端口描边: "#d8caa7"
    };
  }

  if (拟物类型 === "server") {
    return {
      填充: "#dfe4eb",
      内层填充: "#edf1f5",
      描边: "#a4afbb",
      强调: "#7f86b2",
      暗部: "#141923",
      端口描边: "#c9d0d8"
    };
  }

  if (拟物类型 === "tray") {
    return {
      填充: "#e2e6ea",
      内层填充: "#f0f3f5",
      描边: "#a4adb6",
      强调: "#8f9aa5",
      暗部: "#4b5563",
      端口描边: "#c7ced6"
    };
  }

  if (拟物类型 === "network") {
    return {
      填充: "#e8ecef",
      内层填充: "#f4f6f7",
      描边: "#a8b2bb",
      强调: 是PoE ? "#c78a5f" : "#78aeb8",
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

function 生成设备标注文本(设备: 网络设备参数, 起始U位: number, 占用U数: number) {
  const 结束U位 = 起始U位 + 占用U数 - 1;
  return `${设备.设备名称} · ${起始U位}U-${结束U位}U · ${设备.深度毫米}mm`;
}

function 是机柜配电箱设备(设备: 网络设备参数) {
  return 设备.设备类别.includes("机柜配电箱");
}

function 生成箱内组件短名(设备: 网络设备参数) {
  return 设备.设备名称
    .replace(/^箱内DIN /, "")
    .replace("Crestron ", "")
    .replace("优诺 ", "")
    .replace("空气开关", "空开")
    .replace("漏电保护开关", "漏保")
    .replace("明纬 ", "")
    .replace("导轨电源", "电源")
    .replace("继电器模块", "继电器")
    .replace("输入输出模块", "IO")
    .replace("菲尼克斯 ", "")
    .replace("端子排 20位", "端子20");
}

function 生成箱内组件布局(组件列表: 已放置网络设备[], 可用宽度: number, 可用高度: number) {
  const 间距 = 3;
  const 原始宽度列表 = 组件列表.map((项目) => Math.max(18, Math.round(项目.设备.宽度毫米 * (可用宽度 / 420))));
  const 原始总宽度 = 原始宽度列表.reduce((合计, 宽度) => 合计 + 宽度, 0) + Math.max(0, 组件列表.length - 1) * 间距;
  const 压缩比例 = 原始总宽度 > 可用宽度 ? 可用宽度 / 原始总宽度 : 1;
  let 当前X = 0;

  return 组件列表.map((项目, 索引) => {
    const 宽度 = Math.max(12, Math.floor(原始宽度列表[索引] * 压缩比例));
    const 布局 = {
      项目,
      x: 当前X,
      y: 0,
      width: 宽度,
      height: Math.max(18, 可用高度)
    };
    当前X += 宽度 + 间距 * 压缩比例;
    return 布局;
  });
}

export function NetworkRackCanvas({
  设备库,
  已放置设备列表,
  计算结果,
  导出机柜尺寸,
  选中实例编号,
  on选择设备,
  on添加设备,
  on移动设备到U位,
  on导出函数变化
}: NetworkRackCanvasProps) {
  const 容器引用 = useRef<HTMLDivElement | null>(null);
  const 舞台引用 = useRef<any>(null);
  const [容器尺寸, 设置容器尺寸] = useState({ 宽度: 900, 高度: 720 });
  const [悬停提示, 设置悬停提示] = useState<悬停提示 | null>(null);

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

  const 导出规格 = useMemo(() => {
    const 宽度毫米 = 导出机柜尺寸.宽度毫米;
    const 深度毫米 = 导出机柜尺寸.深度毫米;
    const 高度毫米 = 计算结果.推荐机柜规格.高度毫米;
    const 规格文本 = `${计算结果.推荐机柜U数}U ${宽度毫米}×${深度毫米}×${高度毫米}mm 网络机柜`;
    return {
      宽度毫米,
      深度毫米,
      高度毫米,
      标题: `${规格文本} · ${计算结果.推荐机柜类型}`,
      文件名: `网络机柜U位图-${计算结果.推荐机柜U数}U-${宽度毫米}x${深度毫米}x${高度毫米}mm.png`
    };
  }, [
    导出机柜尺寸.宽度毫米,
    导出机柜尺寸.深度毫米,
    计算结果.推荐机柜U数,
    计算结果.推荐机柜规格.高度毫米,
    计算结果.推荐机柜类型
  ]);

  const 画布参数 = useMemo(() => {
    const 机柜宽度 = 导出规格.宽度毫米;
    const 机柜U数 = 计算结果.推荐机柜U数;
    const 机柜高度 = 机柜U数 * 每U高度毫米;
    const 留白X = 96;
    const 留白Y = 42;
    const 比例 = Math.min(
      (容器尺寸.宽度 - 留白X * 2) / 机柜宽度,
      (容器尺寸.高度 - 留白Y * 2) / 机柜高度
    );
    const 安全比例 = Number.isFinite(比例) ? Math.max(0.42, Math.min(2.2, 比例)) : 1;
    const 偏移X = Math.round((容器尺寸.宽度 - 机柜宽度 * 安全比例) / 2);
    const 偏移Y = Math.round((容器尺寸.高度 - 机柜高度 * 安全比例) / 2);
    return { 机柜宽度, 机柜U数, 机柜高度, 比例: 安全比例, 偏移X, 偏移Y };
  }, [容器尺寸, 导出规格.宽度毫米, 计算结果.推荐机柜U数]);

  useEffect(() => {
    on导出函数变化(() => {
      const stage = 舞台引用.current;
      if (!stage) return;
      const 数据地址 = stage.toDataURL({ pixelRatio: 2 });
      const link = document.createElement("a");
      link.href = 数据地址;
      link.download = 导出规格.文件名;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });

    return () => on导出函数变化(null);
  }, [导出规格.文件名, on导出函数变化]);

  const { 机柜宽度, 机柜U数, 机柜高度, 比例, 偏移X, 偏移Y } = 画布参数;
  const U高度像素 = 每U高度毫米 * 比例;
  const 设备左 = 偏移X + 82 * 比例;
  const 设备宽度 = Math.max(180, (机柜宽度 - 150) * 比例);
  const 标注宽度 = Math.max(96, Math.min(238, Math.floor((容器尺寸.宽度 - 设备宽度 - 92) / 2)));
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

  const 渲染侧边标注 = ({
    key,
    文本,
    中心Y,
    方向,
    线起点X,
    颜色,
    已选中 = false,
    onClick
  }: {
    key: string;
    文本: string;
    中心Y: number;
    方向: "左" | "右";
    线起点X: number;
    颜色: string;
    已选中?: boolean;
    onClick?: () => void;
  }) => {
    const 标签Y = 夹取(Math.round(中心Y - 标注高度 / 2), 8, Math.max(8, 容器尺寸.高度 - 标注高度 - 8));
    const 线Y = 标签Y + 标注高度 / 2;
    const 标签X =
      方向 === "右"
        ? 夹取(Math.round(设备左 + 设备宽度 + 34), 8, Math.max(8, 容器尺寸.宽度 - 标注宽度 - 8))
        : 夹取(Math.round(设备左 - 标注宽度 - 34), 8, Math.max(8, 容器尺寸.宽度 - 标注宽度 - 8));
    const 线终点X = 方向 === "右" ? 标签X - 8 : 标签X + 标注宽度 + 8;
    const 文本X = 方向 === "右" ? 标签X + 10 : 标签X + 8;

    return (
      <Group key={key} onClick={onClick} onTap={onClick}>
        <Line
          points={[线起点X, 中心Y, 线终点X, 线Y]}
          stroke={颜色}
          strokeWidth={1.5}
          opacity={已选中 ? 0.95 : 0.68}
          listening={false}
        />
        <Circle x={线起点X} y={中心Y} radius={3} fill="#f8fafc" stroke={颜色} strokeWidth={1.4} listening={false} />
        <Rect
          x={标签X}
          y={标签Y}
          width={标注宽度}
          height={标注高度}
          fill={已选中 ? "#fff7db" : "#ffffff"}
          stroke={已选中 ? "#f4c542" : 颜色}
          strokeWidth={已选中 ? 2 : 1.2}
          cornerRadius={5}
          shadowColor="#17202a"
          shadowOpacity={0.12}
          shadowBlur={4}
          shadowOffsetY={1}
        />
        <Text
          x={文本X}
          y={标签Y + 4}
          width={标注宽度 - 18}
          height={14}
          text={文本}
          fontSize={11}
          fontStyle="bold"
          fill="#17202a"
          ellipsis
          wrap="none"
          align={方向 === "右" ? "left" : "right"}
        />
      </Group>
    );
  };

  const 像素转U位 = (像素Y: number, 预留U数: number) =>
    夹取(Math.round((像素Y - 偏移Y) / U高度像素) + 1, 1, Math.max(1, 机柜U数 - 预留U数 + 1));

  const 查找最近可用U位 = (实例编号: string | null, 期望U位: number, 预留U数: number) => {
    const 最大起始U位 = Math.max(1, 机柜U数 - 预留U数 + 1);
    const 其他区间 = 计算结果.U位占用表
      .filter((项目) => {
        const 占用实例编号 = 项目.实例编号 ?? "";
        return 实例编号 === null || (占用实例编号 !== 实例编号 && !占用实例编号.startsWith(`${实例编号}-`));
      })
      .map((项目) => ({
        起始: Math.max(1, Math.round(项目.起始U位)),
        结束: Math.max(1, Math.round(项目.结束U位))
      }));
    const 是否可用 = (起始U位: number) => {
      const 结束U位 = 起始U位 + 预留U数 - 1;
      return !其他区间.some((区间) => 起始U位 <= 区间.结束 && 结束U位 >= 区间.起始);
    };

    const 起点 = 夹取(Math.round(期望U位), 1, 最大起始U位);
    if (是否可用(起点)) return 起点;
    for (let 偏移 = 1; 偏移 <= 机柜U数; 偏移 += 1) {
      const 向上 = 起点 - 偏移;
      const 向下 = 起点 + 偏移;
      if (向上 >= 1 && 是否可用(向上)) return 向上;
      if (向下 <= 最大起始U位 && 是否可用(向下)) return 向下;
    }
    return 起点;
  };

  const 处理拖放 = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const 设备编号 = event.dataTransfer.getData("网络设备编号");
    const 设备 = 设备库.find((项目) => 项目.设备编号 === 设备编号);
    if (!设备 || !容器引用.current) return;
    const 占用U数 = 计算网络设备占用U数(设备);
    const rect = 容器引用.current.getBoundingClientRect();
    const 期望U位 = 占用U数 <= 0 ? 0 : 像素转U位(event.clientY - rect.top, 占用U数);
    on添加设备(设备, 占用U数 <= 0 ? 0 : 查找最近可用U位(null, 期望U位, 占用U数));
  };

  type U位占用项类型 = (typeof 计算结果.U位占用表)[number];
  const U位占用映射 = new Map<number, U位占用项类型>();
  for (const 项目 of 计算结果.U位占用表) {
    for (let U位 = 项目.起始U位; U位 <= 项目.结束U位; U位 += 1) {
      U位占用映射.set(U位, 项目);
    }
  }

  return (
    <div
      ref={容器引用}
      onDragOver={(event) => event.preventDefault()}
      onDrop={处理拖放}
      className="h-full w-full bg-[#f8fafb]"
    >
      <Stage
        ref={舞台引用}
        width={容器尺寸.宽度}
        height={容器尺寸.高度}
        onMouseDown={(event) => {
          if (event.target === event.target.getStage()) on选择设备(null);
        }}
      >
        <Layer>
          <Rect width={容器尺寸.宽度} height={容器尺寸.高度} fill="#f8fafb" />

          <Group x={偏移X} y={偏移Y} scaleX={比例} scaleY={比例}>
            <Rect
              x={0}
              y={0}
              width={机柜宽度}
              height={机柜高度}
              fill="#17202a"
              stroke="#0f172a"
              strokeWidth={4 / 比例}
              cornerRadius={6}
            />
            <Rect x={42} y={16} width={机柜宽度 - 84} height={机柜高度 - 32} fill="#f3f4f6" stroke="#475569" strokeWidth={2 / 比例} />
            <Text
              x={58}
              y={-28}
              width={机柜宽度 - 116}
              text={导出规格.标题}
              fontSize={16}
              fill="#17202a"
              align="center"
            />

            {Array.from({ length: 机柜U数 }).map((_, 索引) => {
              const U位 = 索引 + 1;
              const y = 索引 * 每U高度毫米;
              const 占用项 = U位占用映射.get(U位);
              const 是空位 = !占用项;
              return (
                <Group key={`U-${U位}`}>
                  <Rect
                    x={42}
                    y={y}
                    width={机柜宽度 - 84}
                    height={每U高度毫米}
                    fill={是空位 ? (U位 % 2 === 0 ? "#ffffff" : "#f8fafc") : "#eef2f7"}
                    stroke="#d1d5db"
                    strokeWidth={0.8 / 比例}
                  />
                  <Text x={10} y={y + 12} width={24} text={`${U位}U`} fontSize={11} fill="#cbd5e1" align="right" />
                  <Text x={机柜宽度 - 34} y={y + 12} width={24} text={`${U位}`} fontSize={11} fill="#cbd5e1" />
                  {是空位 && U高度像素 > 18 ? (
                    <Text x={机柜宽度 - 106} y={y + 14} width={52} text="空余" fontSize={10} fill="#94a3b8" align="right" />
                  ) : null}
                </Group>
              );
            })}

            {计算结果.U位占用表
              .filter((项目) => 项目.是否自动生成 === "是")
              .map((项目) => (
                <Group
                  key={`${项目.实例编号}-${项目.起始U位}`}
                  x={82}
                  y={(项目.起始U位 - 1) * 每U高度毫米 + 3}
                >
                  <Rect
                    width={机柜宽度 - 150}
                    height={项目.占用U数 * 每U高度毫米 - 6}
                    fill={项目.类型.includes("理线架") ? "#d7dde3" : "#edf1f4"}
                    stroke={项目.类型.includes("理线架") ? "#9aa6b2" : "#b8c3cc"}
                    strokeWidth={1.4 / 比例}
                    cornerRadius={5}
                  />
                  <Rect
                    x={4}
                    y={4}
                    width={机柜宽度 - 158}
                    height={Math.max(8, (项目.占用U数 * 每U高度毫米 - 6) * 0.35)}
                    fill="#ffffff"
                    opacity={0.42}
                    cornerRadius={4}
                    listening={false}
                  />
                  <Rect
                    x={12}
                    y={Math.max(5, 项目.占用U数 * 每U高度毫米 - 14)}
                    width={机柜宽度 - 174}
                    height={2}
                    fill={项目.类型.includes("理线架") ? "#7f8b96" : "#aeb8c2"}
                    opacity={0.62}
                    cornerRadius={1}
                    listening={false}
                  />
                  <Circle x={机柜宽度 - 164} y={12} radius={2.2} fill="#87d985" listening={false} />
                  {项目.类型.includes("理线架") ? (
                    <Group x={18} y={Math.max(8, (项目.占用U数 * 每U高度毫米 - 6) / 2 - 3)} listening={false}>
                      {Array.from({ length: Math.min(14, Math.floor((机柜宽度 - 190) / 14)) }).map((_, 索引) => (
                        <Rect
                          key={`auto-cable-slot-${索引}`}
                          x={索引 * 13}
                          y={0}
                          width={8}
                          height={5}
                          fill="#111827"
                          stroke="#cbd5df"
                          strokeWidth={0.6}
                          cornerRadius={1}
                          opacity={0.88}
                        />
                      ))}
                    </Group>
                  ) : (
                    <Group x={18} y={Math.max(8, (项目.占用U数 * 每U高度毫米 - 6) / 2 - 2)} listening={false}>
                      {Array.from({ length: Math.min(10, Math.floor((机柜宽度 - 190) / 22)) }).map((_, 索引) => (
                        <Line
                          key={`auto-blank-vent-${索引}`}
                          points={[索引 * 20, 0, 索引 * 20 + 12, 0]}
                          stroke="#8b98a5"
                          strokeWidth={1.6}
                          lineCap="round"
                          opacity={0.7}
                        />
                      ))}
                    </Group>
                  )}
                </Group>
              ))}
          </Group>

          {已放置设备列表
            .filter((项目) => 计算网络设备占用U数(项目.设备) > 0)
            .map((项目) => {
              const 占用U数 = 计算网络设备占用U数(项目.设备);
              const 起始U位 = 夹取(Math.round(项目.起始U位 || 1), 1, Math.max(1, 机柜U数 - 占用U数 + 1));
              const 拟物类型 = 网络设备拟物类型(项目.设备);
              const 面板样式 = 设备产品面板样式(项目.设备, 拟物类型);
              const 箱内组件列表 = 是机柜配电箱设备(项目.设备)
                ? 已放置设备列表.filter((子项) => 子项.所属配电箱实例编号 === 项目.实例编号)
                : [];
              const 已选中 = 项目.实例编号 === 选中实例编号 || 箱内组件列表.some((子项) => 子项.实例编号 === 选中实例编号);
              const y = 偏移Y + (起始U位 - 1) * U高度像素 + 3;
              const height = Math.max(20, 占用U数 * U高度像素 - 6);
              const 是配电箱 = 是机柜配电箱设备(项目.设备);
              const 箱内区域X = 12;
              const 箱内区域Y = Math.min(34, Math.max(20, height * 0.25));
              const 箱内区域宽度 = Math.max(80, 设备宽度 - 24);
              const 箱内区域高度 = Math.max(20, height - 箱内区域Y - 10);
              const 箱内组件布局 = 生成箱内组件布局(箱内组件列表, 箱内区域宽度 - 18, 箱内区域高度 - 12);
              const 端口显示上限 = 项目.设备.网口数量 > 0 ? 项目.设备.网口数量 : 16;
              const 端口数量 = Math.max(4, Math.min(24, 端口显示上限, Math.floor((设备宽度 - 70) / 10)));
              const 端口行数 = height >= 28 ? 2 : 1;
              const 每行端口数 = Math.ceil(端口数量 / 端口行数);
              const 是否网关类 = 项目.设备.设备名称.includes("网关") || 项目.设备.设备名称.includes("RG-EG") || 项目.设备.设备类型.includes("路由");
              const 端口组X = 是否网关类 ? 55 : 26;
              const 端口组Y = height >= 28 ? Math.max(8, height / 2 - 7) : Math.max(7, height / 2 - 3);
              const 可画面板细节 = height >= 14;
              const 提示详情 = `尺寸 ${项目.设备.宽度毫米}×${项目.设备.高度毫米}×${项目.设备.深度毫米} mm · ${占用U数}U`;

              return (
                <Group
                  key={项目.实例编号}
                  x={设备左}
                  y={y}
                  draggable
                  dragBoundFunc={(位置) => ({
                    x: 设备左,
                    y: 夹取(
                      位置.y,
                      偏移Y + 3,
                      偏移Y + (机柜U数 - 占用U数) * U高度像素 + 3
                    )
                  })}
                  onMouseEnter={(event) => {
                    设置鼠标样式("pointer");
                    更新悬停提示(event, 项目.设备.设备名称, 提示详情, 面板样式.强调);
                  }}
                  onMouseMove={(event) => 更新悬停提示(event, 项目.设备.设备名称, 提示详情, 面板样式.强调)}
                  onMouseLeave={隐藏悬停提示}
                  onDragStart={() => {
                    隐藏悬停提示();
                    on选择设备(项目.实例编号);
                  }}
                  onDragEnd={(event) => {
                    const 期望U位 = 像素转U位(event.target.y() - 3, 占用U数);
                    event.target.position({
                      x: 设备左,
                      y: 偏移Y + (期望U位 - 1) * U高度像素 + 3
                    });
                    on移动设备到U位(项目.实例编号, 期望U位);
                    隐藏悬停提示();
                  }}
                  onClick={() => on选择设备(项目.实例编号)}
                  onTap={() => on选择设备(项目.实例编号)}
                >
                  <Rect
                    width={设备宽度}
                    height={height}
                    fill={面板样式.填充}
                    stroke={已选中 ? "#e9b949" : 面板样式.描边}
                    strokeWidth={已选中 ? 3 : 1.4}
                    cornerRadius={5}
                    shadowColor="#0f172a"
                    shadowOpacity={已选中 ? 0.18 : 0.08}
                    shadowBlur={已选中 ? 10 : 2}
                    shadowOffsetY={已选中 ? 4 : 1}
                  />
                  {可画面板细节 ? (
                    <>
                      <Rect
                        x={6}
                        y={5}
                        width={Math.max(0, 设备宽度 - 12)}
                        height={Math.max(10, height - 10)}
                        fill={面板样式.内层填充}
                        opacity={拟物类型 === "cabinet" ? 0.18 : 0.72}
                        cornerRadius={4}
                        listening={false}
                      />
                      <Rect x={2} y={4} width={8} height={Math.max(10, height - 8)} fill={拟物类型 === "cabinet" ? "#1d2430" : "#c7d0d8"} opacity={0.92} cornerRadius={3} listening={false} />
                      <Rect
                        x={设备宽度 - 10}
                        y={4}
                        width={8}
                        height={Math.max(10, height - 8)}
                        fill={拟物类型 === "cabinet" ? "#1d2430" : "#c7d0d8"}
                        opacity={0.92}
                        cornerRadius={3}
                        listening={false}
                      />
                      <Rect
                        x={4}
                        y={4}
                        width={Math.max(0, 设备宽度 - 8)}
                        height={Math.max(8, height * 0.32)}
                        fill="#ffffff"
                        opacity={拟物类型 === "cabinet" ? 0.08 : 0.42}
                        cornerRadius={4}
                        listening={false}
                      />
                      <Rect
                        x={3}
                        y={Math.max(0, height - 9)}
                        width={Math.max(0, 设备宽度 - 6)}
                        height={6}
                        fill={面板样式.暗部}
                        opacity={拟物类型 === "cabinet" ? 0.22 : 0.12}
                        cornerRadius={3}
                        listening={false}
                      />
                      <Rect
                        x={14}
                        y={Math.max(5, height - 7)}
                        width={Math.max(30, 设备宽度 - 28)}
                        height={2}
                        fill={面板样式.强调}
                        opacity={拟物类型 === "cabinet" ? 0.9 : 0.62}
                        cornerRadius={1}
                        listening={false}
                      />
                      <Circle x={9} y={Math.min(13, height / 2)} radius={2} fill="#f8fafc" stroke="#9aa6b2" strokeWidth={0.6} opacity={0.96} listening={false} />
                      <Circle x={设备宽度 - 9} y={Math.min(13, height / 2)} radius={2} fill="#f8fafc" stroke="#9aa6b2" strokeWidth={0.6} opacity={0.96} listening={false} />
                      {拟物类型 === "network" ? (
                        <Group listening={false}>
                          {是否网关类 ? (
                            <Group x={17} y={Math.max(6, height / 2 - 5)}>
                              <Rect
                                width={25}
                                height={10}
                                fill="#111827"
                                stroke="#cbd5df"
                                strokeWidth={0.8}
                                cornerRadius={2}
                              />
                              <Circle x={6} y={5} radius={1.8} fill="#60d1f2" opacity={0.9} />
                              <Line points={[12, 5, 20, 5]} stroke="#6b7280" strokeWidth={1.2} lineCap="round" />
                            </Group>
                          ) : null}
                          <Group x={端口组X} y={端口组Y}>
                          {Array.from({ length: 端口数量 }).map((_, 索引) => (
                            <Group key={`rack-port-${索引}`} x={(索引 % 每行端口数) * 9} y={Math.floor(索引 / 每行端口数) * 7}>
                              <Rect
                                width={6.4}
                                height={4.6}
                                fill="#111827"
                                stroke={面板样式.端口描边}
                                strokeWidth={0.6}
                                cornerRadius={0.8}
                              />
                              <Rect x={1.1} y={0.8} width={4.2} height={1} fill="#2c3642" opacity={0.9} cornerRadius={0.5} />
                              <Circle
                                x={5.8}
                                y={4.1}
                                radius={0.85}
                                fill={索引 < 项目.设备.PoE口数量 ? "#f3b562" : "#8bd989"}
                                opacity={索引 % 3 === 0 || 索引 < 项目.设备.PoE口数量 ? 0.95 : 0.35}
                              />
                            </Group>
                          ))}
                          </Group>
                          <Rect
                            x={Math.max(端口组X + 每行端口数 * 9 + 8, 设备宽度 - 40)}
                            y={Math.max(6, height / 2 - 5)}
                            width={12}
                            height={10}
                            fill="#111827"
                            stroke={面板样式.端口描边}
                            strokeWidth={0.7}
                            cornerRadius={1.5}
                          />
                          <Circle x={设备宽度 - 18} y={Math.max(7, height / 2 - 3)} radius={2} fill="#87d985" />
                        </Group>
                      ) : null}
                      {拟物类型 === "server" ? (
                        <Group x={17} y={Math.max(7, height / 2 - 6)} listening={false}>
                          <Rect
                            width={24}
                            height={11}
                            fill="#111827"
                            stroke="#cbd5df"
                            strokeWidth={0.8}
                            cornerRadius={2}
                          />
                          <Circle x={6} y={5.5} radius={1.7} fill="#69d3f5" opacity={0.9} />
                          {Array.from({ length: Math.min(4, Math.floor((设备宽度 - 70) / 38)) }).map((_, 索引) => (
                            <Rect
                              key={`drive-${索引}`}
                              x={37 + 索引 * 38}
                              y={1}
                              width={30}
                              height={9}
                              fill="#111827"
                              stroke="#c9d0d8"
                              strokeWidth={0.8}
                              cornerRadius={2}
                            />
                          ))}
                          <Circle x={Math.min(设备宽度 - 54, 202)} y={5.5} radius={2} fill="#87d985" />
                        </Group>
                      ) : null}
                      {拟物类型 === "power" ? (
                        <Group x={22} y={Math.max(8, height / 2 - 3)} listening={false}>
                          {Array.from({ length: Math.min(7, Math.floor((设备宽度 - 44) / 18)) }).map((_, 索引) => (
                            <Line
                              key={`power-vent-${索引}`}
                              points={[索引 * 16, 0, 索引 * 16 + 10, 0]}
                              stroke="#2f2b23"
                              strokeWidth={2}
                              lineCap="round"
                              opacity={0.5}
                            />
                          ))}
                          <Circle x={Math.min(设备宽度 - 62, 155)} y={0} radius={2.1} fill="#f0b95d" />
                        </Group>
                      ) : null}
                      {拟物类型 === "tray" ? (
                        <Group x={18} y={Math.max(5, height / 2 - 7)} listening={false}>
                          <Rect
                            x={0}
                            y={1}
                            width={Math.max(68, 设备宽度 - 70)}
                            height={13}
                            fill="#f3f6f8"
                            stroke="#aeb8c2"
                            strokeWidth={1}
                            cornerRadius={3}
                            opacity={0.86}
                          />
                          <Line
                            points={[6, 4, Math.max(54, 设备宽度 - 82), 4]}
                            stroke="#ffffff"
                            strokeWidth={2}
                            lineCap="round"
                            opacity={0.88}
                          />
                          <Line
                            points={[6, 12, Math.max(54, 设备宽度 - 82), 12]}
                            stroke="#7c8792"
                            strokeWidth={2}
                            lineCap="round"
                            opacity={0.48}
                          />
                          {Array.from({ length: Math.min(5, Math.floor((设备宽度 - 82) / 34)) }).map((_, 索引) => (
                            <Rect
                              key={`tray-foot-${索引}`}
                              x={10 + 索引 * 32}
                              y={7}
                              width={17}
                              height={3}
                              fill="#8d98a3"
                              opacity={0.46}
                              cornerRadius={1.5}
                            />
                          ))}
                          <Circle x={Math.max(60, 设备宽度 - 76)} y={7.5} radius={2.2} fill="#87d985" />
                          <Circle x={Math.max(70, 设备宽度 - 62)} y={7.5} radius={2.2} fill="#17202a" opacity={0.22} />
                        </Group>
                      ) : null}
                    </>
                  ) : null}
                  {是配电箱 ? (
                    <Group x={箱内区域X} y={箱内区域Y}>
                      <Rect
                        width={箱内区域宽度}
                        height={箱内区域高度}
                        fill="#111827"
                        stroke="#334155"
                        strokeWidth={1}
                        cornerRadius={4}
                        opacity={0.95}
                        listening={false}
                      />
                      <Rect
                        x={8}
                        y={Math.max(8, 箱内区域高度 * 0.48)}
                        width={箱内区域宽度 - 16}
                        height={4}
                        fill="#d8b86c"
                        cornerRadius={2}
                        listening={false}
                      />
                      {箱内组件列表.length === 0 ? (
                        <Text
                          x={10}
                          y={Math.max(6, 箱内区域高度 / 2 - 7)}
                          width={箱内区域宽度 - 20}
                          text="箱内DIN导轨空位"
                          fill="#94a3b8"
                          fontSize={10}
                          align="center"
                          listening={false}
                        />
                      ) : null}
                      {箱内组件布局.map(({ 项目: 子项, x, y: 子Y, width, height: 子高度 }) => {
                        const 子配色 = 设备颜色(子项.设备);
                        const 子项已选中 = 子项.实例编号 === 选中实例编号;
                        return (
                          <Group
                            key={子项.实例编号}
                            x={8 + x}
                            y={6 + 子Y}
                            onClick={(event) => {
                              event.cancelBubble = true;
                              on选择设备(子项.实例编号);
                            }}
                            onTap={(event) => {
                              event.cancelBubble = true;
                              on选择设备(子项.实例编号);
                            }}
                          >
                            <Rect
                              width={width}
                              height={子高度}
                              fill={子配色.填充}
                              stroke={子项已选中 ? "#f4c542" : 子配色.描边}
                              strokeWidth={子项已选中 ? 2.5 : 1}
                              cornerRadius={3}
                            />
                            <Rect
                              x={2}
                              y={2}
                              width={Math.max(0, width - 4)}
                              height={Math.max(5, 子高度 * 0.34)}
                              fill="#ffffff"
                              opacity={0.18}
                              cornerRadius={2}
                              listening={false}
                            />
                            {width > 26 && 子高度 > 18 ? (
                              <Circle x={width - 6} y={子高度 - 6} radius={1.8} fill="#9be071" listening={false} />
                            ) : null}
                            <Text
                              x={3}
                              y={3}
                              width={Math.max(0, width - 6)}
                              height={Math.max(0, 子高度 - 6)}
                              text={生成箱内组件短名(子项.设备)}
                              fill={子配色.文字}
                              fontSize={Math.max(7, Math.min(9, width / 4))}
                              fontStyle="bold"
                              lineHeight={1.05}
                              wrap="word"
                              ellipsis
                              listening={false}
                            />
                          </Group>
                        );
                      })}
                    </Group>
                  ) : null}
                </Group>
              );
            })}

          {计算结果.U位占用表
            .filter((项目) => 项目.是否自动生成 === "是")
            .map((项目) => {
              const 中心Y = 偏移Y + (项目.起始U位 - 1) * U高度像素 + (项目.占用U数 * U高度像素) / 2;
              const 方向 = 项目.起始U位 % 2 === 0 ? "左" : "右";
              const 颜色 = 项目.类型.includes("理线架") ? "#475569" : "#94a3b8";
              return 渲染侧边标注({
                key: `auto-label-${项目.名称}-${项目.起始U位}`,
                文本: `${项目.名称} · 自动 · ${项目.起始U位}U-${项目.结束U位}U`,
                中心Y,
                方向,
                线起点X: 方向 === "右" ? 设备左 + 设备宽度 : 设备左,
                颜色
              });
            })}

          {已放置设备列表
            .filter((项目) => 计算网络设备占用U数(项目.设备) > 0)
            .map((项目) => {
              const 占用U数 = 计算网络设备占用U数(项目.设备);
              const 起始U位 = 夹取(Math.round(项目.起始U位 || 1), 1, Math.max(1, 机柜U数 - 占用U数 + 1));
              const 配色 = 设备颜色(项目.设备);
              const 箱内组件列表 = 是机柜配电箱设备(项目.设备)
                ? 已放置设备列表.filter((子项) => 子项.所属配电箱实例编号 === 项目.实例编号)
                : [];
              const 已选中 = 项目.实例编号 === 选中实例编号 || 箱内组件列表.some((子项) => 子项.实例编号 === 选中实例编号);
              const 中心Y = 偏移Y + (起始U位 - 1) * U高度像素 + (占用U数 * U高度像素) / 2;
              const 方向 = 起始U位 % 2 === 0 ? "左" : "右";
              return 渲染侧边标注({
                key: `device-label-${项目.实例编号}`,
                文本: 生成设备标注文本(项目.设备, 起始U位, 占用U数),
                中心Y,
                方向,
                线起点X: 方向 === "右" ? 设备左 + 设备宽度 : 设备左,
                颜色: 配色.描边,
                已选中,
                onClick: () => on选择设备(项目.实例编号)
              });
            })}

          {渲染悬停提示()}
        </Layer>
      </Stage>
    </div>
  );
}
