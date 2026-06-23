"use client";

import { FormEvent, useMemo, useState } from "react";
import type { 设备参数 } from "@/types/设备";
import { SkeuoIcon, type SkeuoIconName } from "@/components/SkeuoIcon";

interface DeviceLibraryProps {
  设备库: 设备参数[];
  on添加设备: (设备: 设备参数, 数量?: number) => void;
  on添加自定义设备: (设备: 设备参数) => void;
  on删除自定义设备: (设备编号: string) => void;
}

interface 自定义设备表单 {
  设备名称: string;
  品牌: string;
  设备类别: string;
  设备类型: string;
  安装方式: 设备参数["安装方式"];
  宽度毫米: string;
  高度毫米: string;
  深度毫米: string;
  DIN模数: string;
  机柜U数: string;
  发热功率瓦: string;
  走线预留毫米: string;
  供电类型: string;
  通讯接口: string;
  端口数量: string;
  是否重设备: 设备参数["是否重设备"];
  是否强电设备: 设备参数["是否强电设备"];
  是否弱电设备: 设备参数["是否弱电设备"];
  是否需要散热间距: 设备参数["是否需要散热间距"];
  备注: string;
}

const 自定义设备前缀 = "自定义-";
const 是或否选项 = ["是", "否"] as const;
const 安装方式选项: 设备参数["安装方式"][] = ["DIN导轨", "背板固定", "端子排", "机柜U位"];
const 可调数量上限 = 96;

const 初始自定义设备表单: 自定义设备表单 = {
  设备名称: "",
  品牌: "自定义",
  设备类别: "自定义产品",
  设备类型: "自定义设备",
  安装方式: "DIN导轨",
  宽度毫米: "72",
  高度毫米: "90",
  深度毫米: "60",
  DIN模数: "4",
  机柜U数: "0",
  发热功率瓦: "0",
  走线预留毫米: "40",
  供电类型: "24V",
  通讯接口: "无",
  端口数量: "0",
  是否重设备: "否",
  是否强电设备: "否",
  是否弱电设备: "是",
  是否需要散热间距: "否",
  备注: ""
};

function 唯一值(设备库: 设备参数[], 字段: keyof 设备参数) {
  return Array.from(new Set(设备库.map((设备) => String(设备[字段])))).sort((甲, 乙) =>
    甲.localeCompare(乙, "zh-Hans-CN")
  );
}

function 读取数字(值: string, 默认值: number) {
  const 数值 = Number(值);
  return Number.isFinite(数值) ? Math.max(0, 数值) : 默认值;
}

function 获取设备图标(设备: 设备参数): SkeuoIconName {
  if (设备.安装方式 === "端子排" || 设备.设备类别.includes("端子")) return "terminal";
  if (设备.设备类型.includes("断路器") || 设备.设备类型.includes("空开") || 设备.设备名称.includes("空气开关")) return "breaker";
  if (设备.设备类别.includes("电源") || 设备.设备名称.includes("电源")) return "power";
  if (设备.安装方式 === "机柜U位") return "rack";
  if (设备.是否弱电设备 === "是" || 设备.通讯接口 !== "无" || 设备.端口数量 > 0) return "network";
  if (设备.安装方式 === "背板固定") return "device";
  return "module";
}

function 设备是否支持数量滑动(设备: 设备参数) {
  return 设备.是否支持数量调整 === "是";
}

function 生成自定义设备(表单: 自定义设备表单): 设备参数 {
  const 宽度毫米 = 读取数字(表单.宽度毫米, 72);
  const DIN模数 = 表单.安装方式 === "DIN导轨" ? Math.max(1, Math.round(读取数字(表单.DIN模数, Math.ceil(宽度毫米 / 18)))) : 0;
  const 机柜U数 = 表单.安装方式 === "机柜U位" ? Math.max(1, Math.round(读取数字(表单.机柜U数, 1))) : 0;

  return {
    设备编号: `${自定义设备前缀}${Date.now()}`,
    设备名称: 表单.设备名称.trim() || "自定义产品",
    品牌: 表单.品牌.trim() || "自定义",
    设备类别: 表单.设备类别.trim() || "自定义产品",
    设备类型: 表单.设备类型.trim() || "自定义设备",
    安装方式: 表单.安装方式,
    宽度毫米,
    高度毫米: 读取数字(表单.高度毫米, 90),
    深度毫米: 读取数字(表单.深度毫米, 60),
    DIN模数,
    机柜U数,
    发热功率瓦: 读取数字(表单.发热功率瓦, 0),
    走线预留毫米: 读取数字(表单.走线预留毫米, 40),
    供电类型: 表单.供电类型.trim() || "无",
    通讯接口: 表单.通讯接口.trim() || "无",
    端口数量: Math.round(读取数字(表单.端口数量, 0)),
    是否重设备: 表单.是否重设备,
    是否强电设备: 表单.是否强电设备,
    是否弱电设备: 表单.是否弱电设备,
    是否需要散热间距: 表单.是否需要散热间距,
    备注: 表单.备注.trim() || "自定义产品库条目"
  };
}

export function DeviceLibrary({ 设备库, on添加设备, on添加自定义设备, on删除自定义设备 }: DeviceLibraryProps) {
  const [设备类别, 设置设备类别] = useState("全部");
  const [安装方式, 设置安装方式] = useState("全部");
  const [品牌, 设置品牌] = useState("全部");
  const [是否强电设备, 设置是否强电设备] = useState("全部");
  const [是否弱电设备, 设置是否弱电设备] = useState("全部");
  const [显示自定义表单, 设置显示自定义表单] = useState(false);
  const [自定义表单, 设置自定义表单] = useState<自定义设备表单>(初始自定义设备表单);
  const [待添加数量, 设置待添加数量] = useState<Record<string, number>>({});

  const 筛选项 = useMemo(
    () => ({
      设备类别: 唯一值(设备库, "设备类别"),
      安装方式: 唯一值(设备库, "安装方式"),
      品牌: 唯一值(设备库, "品牌")
    }),
    [设备库]
  );

  const 已筛选设备 = useMemo(
    () =>
      设备库.filter((设备) => {
        if (设备类别 !== "全部" && 设备.设备类别 !== 设备类别) return false;
        if (安装方式 !== "全部" && 设备.安装方式 !== 安装方式) return false;
        if (品牌 !== "全部" && 设备.品牌 !== 品牌) return false;
        if (是否强电设备 !== "全部" && 设备.是否强电设备 !== 是否强电设备) return false;
        if (是否弱电设备 !== "全部" && 设备.是否弱电设备 !== 是否弱电设备) return false;
        return true;
      }),
    [设备库, 设备类别, 安装方式, 品牌, 是否强电设备, 是否弱电设备]
  );

  const 更新自定义表单 = <字段 extends keyof 自定义设备表单>(字段名: 字段, 值: 自定义设备表单[字段]) => {
    设置自定义表单((当前) => ({ ...当前, [字段名]: 值 }));
  };

  const 提交自定义产品 = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    on添加自定义设备(生成自定义设备(自定义表单));
    设置自定义表单(初始自定义设备表单);
    设置显示自定义表单(false);
  };

  const 获取待添加数量 = (设备: 设备参数) =>
    Math.max(1, Math.min(可调数量上限, Math.round(待添加数量[设备.设备编号] ?? 设备.默认数量 ?? 1)));

  return (
    <aside className="flex min-h-0 flex-col bg-white">
      <div className="border-b border-slate-300/80 px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">设备库</h2>
            <p className="mt-1 text-xs text-slate-500">拖拽卡片到画布，或点击加入当前方案</p>
          </div>
          <button
            type="button"
            onClick={() => 设置显示自定义表单((当前) => !当前)}
            className="inline-flex shrink-0 items-center gap-1 rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:border-brass hover:text-ink"
          >
            <SkeuoIcon name={显示自定义表单 ? "cancel" : "add"} size={17} />
            自定义产品
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 border-b border-slate-300/80 p-3">
        <label className="text-xs text-slate-500">
          设备类别
          <select
            value={设备类别}
            onChange={(event) => 设置设备类别(event.target.value)}
            className="mt-1 h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-sm text-slate-800"
          >
            <option>全部</option>
            {筛选项.设备类别.map((值) => (
              <option key={值}>{值}</option>
            ))}
          </select>
        </label>

        <label className="text-xs text-slate-500">
          安装方式
          <select
            value={安装方式}
            onChange={(event) => 设置安装方式(event.target.value)}
            className="mt-1 h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-sm text-slate-800"
          >
            <option>全部</option>
            {筛选项.安装方式.map((值) => (
              <option key={值}>{值}</option>
            ))}
          </select>
        </label>

        <label className="text-xs text-slate-500">
          品牌
          <select
            value={品牌}
            onChange={(event) => 设置品牌(event.target.value)}
            className="mt-1 h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-sm text-slate-800"
          >
            <option>全部</option>
            {筛选项.品牌.map((值) => (
              <option key={值}>{值}</option>
            ))}
          </select>
        </label>

        <label className="text-xs text-slate-500">
          强电设备
          <select
            value={是否强电设备}
            onChange={(event) => 设置是否强电设备(event.target.value)}
            className="mt-1 h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-sm text-slate-800"
          >
            <option>全部</option>
            <option>是</option>
            <option>否</option>
          </select>
        </label>

        <label className="col-span-2 text-xs text-slate-500">
          弱电设备
          <select
            value={是否弱电设备}
            onChange={(event) => 设置是否弱电设备(event.target.value)}
            className="mt-1 h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-sm text-slate-800"
          >
            <option>全部</option>
            <option>是</option>
            <option>否</option>
          </select>
        </label>
      </div>

      {显示自定义表单 ? (
        <form onSubmit={提交自定义产品} className="border-b border-slate-300/80 bg-slate-50 p-3">
          <div className="grid grid-cols-2 gap-2">
            <label className="col-span-2 text-xs text-slate-500">
              产品名称
              <input
                required
                value={自定义表单.设备名称}
                onChange={(event) => 更新自定义表单("设备名称", event.target.value)}
                className="mt-1 h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-sm text-slate-800"
                placeholder="例如：自定义继电器模块"
              />
            </label>
            <label className="text-xs text-slate-500">
              品牌
              <input
                value={自定义表单.品牌}
                onChange={(event) => 更新自定义表单("品牌", event.target.value)}
                className="mt-1 h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-sm text-slate-800"
              />
            </label>
            <label className="text-xs text-slate-500">
              类别
              <input
                value={自定义表单.设备类别}
                onChange={(event) => 更新自定义表单("设备类别", event.target.value)}
                className="mt-1 h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-sm text-slate-800"
              />
            </label>
            <label className="text-xs text-slate-500">
              类型
              <input
                value={自定义表单.设备类型}
                onChange={(event) => 更新自定义表单("设备类型", event.target.value)}
                className="mt-1 h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-sm text-slate-800"
              />
            </label>
            <label className="text-xs text-slate-500">
              安装方式
              <select
                value={自定义表单.安装方式}
                onChange={(event) => 更新自定义表单("安装方式", event.target.value as 设备参数["安装方式"])}
                className="mt-1 h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-sm text-slate-800"
              >
                {安装方式选项.map((值) => (
                  <option key={值}>{值}</option>
                ))}
              </select>
            </label>
            {[
              ["宽度毫米", "宽"],
              ["高度毫米", "高"],
              ["深度毫米", "深"],
              ["DIN模数", "DIN"],
              ["机柜U数", "U数"],
              ["发热功率瓦", "发热W"],
              ["走线预留毫米", "走线"],
              ["端口数量", "端口"]
            ].map(([字段名, 标签]) => (
              <label key={字段名} className="text-xs text-slate-500">
                {标签}
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={自定义表单[字段名 as keyof 自定义设备表单]}
                  onChange={(event) => 更新自定义表单(字段名 as keyof 自定义设备表单, event.target.value)}
                  className="mt-1 h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-sm text-slate-800"
                />
              </label>
            ))}
            <label className="text-xs text-slate-500">
              供电
              <input
                value={自定义表单.供电类型}
                onChange={(event) => 更新自定义表单("供电类型", event.target.value)}
                className="mt-1 h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-sm text-slate-800"
              />
            </label>
            <label className="text-xs text-slate-500">
              通讯
              <input
                value={自定义表单.通讯接口}
                onChange={(event) => 更新自定义表单("通讯接口", event.target.value)}
                className="mt-1 h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-sm text-slate-800"
              />
            </label>
            {[
              ["是否强电设备", "强电"],
              ["是否弱电设备", "弱电"],
              ["是否重设备", "重设备"],
              ["是否需要散热间距", "散热间距"]
            ].map(([字段名, 标签]) => (
              <label key={字段名} className="text-xs text-slate-500">
                {标签}
                <select
                  value={自定义表单[字段名 as keyof 自定义设备表单]}
                  onChange={(event) => 更新自定义表单(字段名 as keyof 自定义设备表单, event.target.value as "是" | "否")}
                  className="mt-1 h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-sm text-slate-800"
                >
                  {是或否选项.map((值) => (
                    <option key={值}>{值}</option>
                  ))}
                </select>
              </label>
            ))}
            <label className="col-span-2 text-xs text-slate-500">
              备注
              <input
                value={自定义表单.备注}
                onChange={(event) => 更新自定义表单("备注", event.target.value)}
                className="mt-1 h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-sm text-slate-800"
              />
            </label>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button type="submit" className="inline-flex items-center justify-center gap-1.5 rounded-md bg-ink px-3 py-2 text-xs font-medium text-white">
              <SkeuoIcon name="save" size={17} />
              保存到产品库
            </button>
            <button
              type="button"
              onClick={() => 设置显示自定义表单(false)}
              className="inline-flex items-center justify-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700"
            >
              <SkeuoIcon name="cancel" size={17} />
              取消
            </button>
          </div>
        </form>
      ) : null}

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
          <span>共 {已筛选设备.length} 个设备</span>
          <span>JSON / 自定义字段</span>
        </div>

        <div className="space-y-2">
          {已筛选设备.map((设备) => {
            const 是自定义设备 = 设备.设备编号.startsWith(自定义设备前缀);
            const 支持数量滑动 = 设备是否支持数量滑动(设备);
            const 当前待添加数量 = 获取待添加数量(设备);
            return (
              <article
                key={设备.设备编号}
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.effectAllowed = "copy";
                  event.dataTransfer.setData("设备编号", 设备.设备编号);
                  if (支持数量滑动) event.dataTransfer.setData("设备数量", String(当前待添加数量));
                }}
                className="rounded-md border border-slate-200 bg-white p-3 shadow-sm transition hover:border-brass hover:shadow-soft"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-start gap-2">
                    <SkeuoIcon name={获取设备图标(设备)} size={30} className="mt-0.5" />
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-semibold text-slate-900">{设备.设备名称}</h3>
                      <p className="mt-1 text-xs text-slate-500">
                        {设备.品牌} · {设备.设备类别} · {设备.安装方式}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => on添加设备(设备, 支持数量滑动 ? 当前待添加数量 : undefined)}
                      className="inline-flex items-center justify-center gap-1 rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:border-brass hover:text-ink"
                    >
                      <SkeuoIcon name="add" size={15} />
                      加入
                    </button>
                    {是自定义设备 ? (
                      <button
                        type="button"
                        onClick={() => on删除自定义设备(设备.设备编号)}
                        className="inline-flex items-center justify-center gap-1 rounded-md border border-red-300 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
                      >
                        <SkeuoIcon name="delete" size={15} />
                        删除
                      </button>
                    ) : null}
                  </div>
                </div>

                {支持数量滑动 ? (
                  <label className="mt-3 block rounded-md border border-slate-200 bg-slate-50 px-2 py-2 text-xs text-slate-500">
                    <span className="flex items-center justify-between gap-2">
                      <span>加入数量</span>
                      <span className="font-semibold text-slate-900">
                        {当前待添加数量} {设备.数量单位 ?? "个"}
                      </span>
                    </span>
                    <input
                      type="range"
                      min={1}
                      max={可调数量上限}
                      step={1}
                      value={当前待添加数量}
                      onMouseDown={(event) => event.stopPropagation()}
                      onTouchStart={(event) => event.stopPropagation()}
                      onChange={(event) =>
                        设置待添加数量((当前) => ({
                          ...当前,
                          [设备.设备编号]: Math.max(1, Math.min(可调数量上限, Number(event.target.value)))
                        }))
                      }
                      className="mt-2 h-2 w-full accent-[#b49a5a]"
                    />
                  </label>
                ) : null}

                <dl className="mt-3 grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <dt className="text-slate-400">宽度毫米</dt>
                    <dd className="font-medium text-slate-800">{设备.宽度毫米}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400">高度毫米</dt>
                    <dd className="font-medium text-slate-800">{设备.高度毫米}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400">深度毫米</dt>
                    <dd className="font-medium text-slate-800">{设备.深度毫米}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400">DIN模数</dt>
                    <dd className="font-medium text-slate-800">{设备.DIN模数}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400">机柜U数</dt>
                    <dd className="font-medium text-slate-800">{设备.机柜U数}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400">发热功率瓦</dt>
                    <dd className="font-medium text-slate-800">{设备.发热功率瓦}</dd>
                  </div>
                </dl>
              </article>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
