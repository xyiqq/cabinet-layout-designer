import type {
  计算结果,
  已放置设备,
  已放置网络设备,
  网络机柜计算结果,
  网络机柜项目数据,
  项目数据,
  箱体配置
} from "@/types/设备";

function 下载文本文件(文件名: string, 内容: string, 类型: string) {
  const blob = new Blob([内容], { type: 类型 });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = 文件名;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function 转义CSV值(值: unknown) {
  const 文本 = String(值 ?? "");
  if (/[",\n\r]/.test(文本)) {
    return `"${文本.replaceAll("\"", "\"\"")}"`;
  }
  return 文本;
}

export function 转为CSV<T extends Record<string, unknown>>(行列表: T[]) {
  if (行列表.length === 0) return "";
  const 表头 = Object.keys(行列表[0]);
  const 内容行 = 行列表.map((行) => 表头.map((字段) => 转义CSV值(行[字段])).join(","));
  return [表头.join(","), ...内容行].join("\n");
}

export function 导出项目数据(项目数据: 项目数据 | 网络机柜项目数据) {
  下载文本文件(
    `${项目数据.项目名称 || "柜体设计项目"}.json`,
    JSON.stringify(项目数据, null, 2),
    "application/json;charset=utf-8"
  );
}

export function 导出设备清单(计算结果: 计算结果) {
  下载文本文件("设备清单.csv", `\uFEFF${转为CSV(计算结果.设备清单 as unknown as Record<string, unknown>[])}`, "text/csv;charset=utf-8");
}

export function 导出材料清单(计算结果: 计算结果) {
  下载文本文件("材料清单.csv", `\uFEFF${转为CSV(计算结果.材料清单 as unknown as Record<string, unknown>[])}`, "text/csv;charset=utf-8");
}

export function 导出网络设备清单(计算结果: 网络机柜计算结果) {
  下载文本文件(
    "网络设备清单.csv",
    `\uFEFF${转为CSV(计算结果.设备清单 as unknown as Record<string, unknown>[])}`,
    "text/csv;charset=utf-8"
  );
}

export function 导出网络材料清单(计算结果: 网络机柜计算结果) {
  下载文本文件(
    "网络机柜材料清单.csv",
    `\uFEFF${转为CSV(计算结果.材料清单 as unknown as Record<string, unknown>[])}`,
    "text/csv;charset=utf-8"
  );
}

export function 导出U位占用表(计算结果: 网络机柜计算结果) {
  下载文本文件(
    "U位占用表.csv",
    `\uFEFF${转为CSV(计算结果.U位占用表 as unknown as Record<string, unknown>[])}`,
    "text/csv;charset=utf-8"
  );
}

export function 生成项目数据(
  项目名称: string,
  设备列表: 已放置设备[],
  计算结果: 计算结果,
  箱体配置: 箱体配置
): 项目数据 {
  return {
    项目名称,
    项目模式: "配电箱 / 控制柜模式",
    更新时间: new Date().toISOString(),
    箱体配置,
    设备列表,
    计算结果
  };
}

export function 生成网络项目数据(
  项目名称: string,
  网络设备列表: 已放置网络设备[],
  计算结果: 网络机柜计算结果
): 网络机柜项目数据 {
  return {
    项目名称,
    项目模式: "网络机柜模式",
    更新时间: new Date().toISOString(),
    网络设备列表,
    计算结果
  };
}
