"use client";

import { useEffect, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { 计算结果, 已放置设备, 箱体配置 } from "@/types/设备";
import { 获取实例数量 } from "@/lib/柜体计算";
import { SkeuoIcon } from "@/components/SkeuoIcon";

interface ResultPanelProps {
  计算结果: 计算结果;
  选中设备: 已放置设备 | null;
  箱体配置: 箱体配置;
  on箱体配置变化: Dispatch<SetStateAction<箱体配置>>;
  on删除设备: (实例编号: string) => void;
  on导出项目: () => void;
  on导出设备清单: () => void;
  on导出材料清单: () => void;
  on导出布局图片: () => void;
}

function 指标({ 名称, 数值, 单位 }: { 名称: string; 数值: string | number; 单位?: string }) {
  return (
    <div className="border-b border-slate-200 py-2">
      <dt className="text-xs text-slate-500">{名称}</dt>
      <dd className="mt-1 text-sm font-semibold text-slate-900">
        {数值}
        {单位 ? <span className="ml-1 text-xs font-normal text-slate-500">{单位}</span> : null}
      </dd>
    </div>
  );
}

function NumberInput({
  名称,
  数值,
  最小值,
  最大值,
  步长 = 10,
  on变化
}: {
  名称: string;
  数值: number;
  最小值: number;
  最大值: number;
  步长?: number;
  on变化: (数值: number) => void;
}) {
  const [输入文本, 设置输入文本] = useState(String(数值));

  useEffect(() => {
    设置输入文本(String(数值));
  }, [数值]);

  const 提交输入 = () => {
    const 下一个值 = Number(输入文本);
    const 安全值 = Number.isFinite(下一个值) ? Math.max(最小值, Math.min(最大值, 下一个值)) : 数值;
    设置输入文本(String(安全值));
    if (安全值 !== 数值) on变化(安全值);
  };

  return (
    <label className="text-xs text-slate-500">
      {名称}
      <input
        type="number"
        min={最小值}
        max={最大值}
        step={步长}
        value={输入文本}
        onChange={(event) => 设置输入文本(event.target.value)}
        onBlur={提交输入}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.currentTarget.blur();
          }
        }}
        className="mt-1 h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-sm font-medium text-slate-900"
      />
    </label>
  );
}

export function ResultPanel({
  计算结果,
  选中设备,
  箱体配置,
  on箱体配置变化,
  on删除设备,
  on导出项目,
  on导出设备清单,
  on导出材料清单,
  on导出布局图片
}: ResultPanelProps) {
  return (
    <aside className="flex min-h-0 flex-col bg-white">
      <div className="border-b border-slate-300/80 px-4 py-4">
        <h2 className="inline-flex items-center gap-2 text-sm font-semibold">
          <SkeuoIcon name="dimension" size={22} />
          计算结果
        </h2>
        <p className="mt-1 text-xs text-slate-500">推荐尺寸、清单、材料和警告信息</p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <section className="rounded-md border border-slate-300 bg-slate-50 p-4">
          <p className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
            <SkeuoIcon name="cabinet" size={20} />
            当前箱体尺寸
          </p>
          <p className="mt-2 text-2xl font-semibold text-ink">{计算结果.推荐箱体尺寸文本}</p>
          <p className="mt-1 text-xs text-slate-500">
            来源：{计算结果.箱体尺寸来源} · 标准推荐 {计算结果.标准推荐箱体尺寸文本}
          </p>
          <p className="mt-2 text-sm text-slate-600">{计算结果.散热建议}</p>
        </section>

        <section className="mt-4 rounded-md border border-slate-300 bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold">箱体设置</h3>
              <p className="mt-1 text-xs text-slate-500">尺寸、线槽、空开端子区、模块区和吸附参数</p>
            </div>
            <div className="flex rounded-md border border-slate-300 bg-slate-100 p-1 text-xs">
              {(["自动推荐", "自定义尺寸"] as const).map((模式) => (
                <button
                  key={模式}
                  type="button"
                  onClick={() => on箱体配置变化((当前) => ({ ...当前, 尺寸模式: 模式 }))}
                  className={`inline-flex items-center gap-1 rounded px-2 py-1.5 transition ${
                    箱体配置.尺寸模式 === 模式 ? "bg-white text-ink shadow-sm" : "text-slate-500 hover:text-ink"
                  }`}
                >
                  <SkeuoIcon name={模式 === "自定义尺寸" ? "settings" : "auto"} size={16} />
                  {模式}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2">
            <NumberInput
              名称="箱体宽度毫米"
              数值={箱体配置.自定义箱体尺寸.宽度毫米}
              最小值={300}
              最大值={2400}
              on变化={(数值) =>
                on箱体配置变化((当前) => ({
                  ...当前,
                  尺寸模式: "自定义尺寸",
                  自定义箱体尺寸: { ...当前.自定义箱体尺寸, 宽度毫米: 数值 }
                }))
              }
            />
            <NumberInput
              名称="箱体高度毫米"
              数值={箱体配置.自定义箱体尺寸.高度毫米}
              最小值={300}
              最大值={2600}
              on变化={(数值) =>
                on箱体配置变化((当前) => ({
                  ...当前,
                  尺寸模式: "自定义尺寸",
                  自定义箱体尺寸: { ...当前.自定义箱体尺寸, 高度毫米: 数值 }
                }))
              }
            />
            <NumberInput
              名称="箱体深度毫米"
              数值={箱体配置.自定义箱体尺寸.深度毫米}
              最小值={120}
              最大值={1000}
              on变化={(数值) =>
                on箱体配置变化((当前) => ({
                  ...当前,
                  尺寸模式: "自定义尺寸",
                  自定义箱体尺寸: { ...当前.自定义箱体尺寸, 深度毫米: 数值 }
                }))
              }
            />
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <NumberInput
              名称="左侧线槽宽度"
              数值={箱体配置.布局规则.左侧竖向线槽宽度}
              最小值={20}
              最大值={240}
              on变化={(数值) =>
                on箱体配置变化((当前) => ({
                  ...当前,
                  布局规则: { ...当前.布局规则, 左侧竖向线槽宽度: 数值 }
                }))
              }
            />
            <NumberInput
              名称="右侧线槽宽度"
              数值={箱体配置.布局规则.右侧竖向线槽宽度}
              最小值={20}
              最大值={240}
              on变化={(数值) =>
                on箱体配置变化((当前) => ({
                  ...当前,
                  布局规则: { ...当前.布局规则, 右侧竖向线槽宽度: 数值 }
                }))
              }
            />
            <NumberInput
              名称="横向线槽宽度"
              数值={箱体配置.布局规则.横向线槽高度}
              最小值={20}
              最大值={160}
              on变化={(数值) =>
                on箱体配置变化((当前) => ({
                  ...当前,
                  布局规则: { ...当前.布局规则, 横向线槽高度: 数值 }
                }))
              }
            />
            <NumberInput
              名称="空开/端子空间"
              数值={箱体配置.布局规则.空开端子区高度}
              最小值={80}
              最大值={220}
              on变化={(数值) =>
                on箱体配置变化((当前) => ({
                  ...当前,
                  布局规则: { ...当前.布局规则, 空开端子区高度: 数值, DIN导轨垂直间距: 数值 }
                }))
              }
            />
            <NumberInput
              名称="模块空间"
              数值={箱体配置.布局规则.模块区高度}
              最小值={120}
              最大值={360}
              on变化={(数值) =>
                on箱体配置变化((当前) => ({
                  ...当前,
                  布局规则: { ...当前.布局规则, 模块区高度: 数值 }
                }))
              }
            />
            <NumberInput
              名称="顶部预留毫米"
              数值={箱体配置.布局规则.顶部预留空间}
              最小值={20}
              最大值={240}
              on变化={(数值) =>
                on箱体配置变化((当前) => ({
                  ...当前,
                  布局规则: { ...当前.布局规则, 顶部预留空间: 数值 }
                }))
              }
            />
            <NumberInput
              名称="底部预留毫米"
              数值={箱体配置.布局规则.底部预留空间}
              最小值={20}
              最大值={260}
              on变化={(数值) =>
                on箱体配置变化((当前) => ({
                  ...当前,
                  布局规则: { ...当前.布局规则, 底部预留空间: 数值 }
                }))
              }
            />
            <NumberInput
              名称="独立端子端口"
              数值={箱体配置.布局规则.端子排区域高度}
              最小值={60}
              最大值={180}
              on变化={(数值) =>
                on箱体配置变化((当前) => ({
                  ...当前,
                  布局规则: { ...当前.布局规则, 端子排区域高度: 数值 }
                }))
              }
            />
            <NumberInput
              名称="吸附间距毫米"
              数值={箱体配置.吸附间距毫米}
              最小值={4}
              最大值={50}
              步长={1}
              on变化={(数值) =>
                on箱体配置变化((当前) => ({
                  ...当前,
                  吸附间距毫米: 数值
                }))
              }
            />
          </div>

          <label className="mt-3 flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={箱体配置.是否启用自动吸附}
              onChange={(event) =>
                on箱体配置变化((当前) => ({
                  ...当前,
                  是否启用自动吸附: event.target.checked
                }))
              }
              className="h-4 w-4 rounded border-slate-300"
            />
            启用模块自动吸附
          </label>
        </section>

        <dl className="mt-4 grid grid-cols-2 gap-x-4">
          <指标 名称="DIN 导轨数量" 数值={计算结果.DIN导轨数量} 单位="条" />
          <指标 名称="每条导轨可用宽度" 数值={计算结果.每条导轨可用宽度} 单位="毫米" />
          <指标 名称="横向线槽宽度" 数值={计算结果.横向线槽高度} 单位="毫米" />
          <指标 名称="纵向线槽宽度" 数值={计算结果.纵向线槽宽度} 单位="毫米" />
          <指标 名称="顶部预留空间" 数值={计算结果.顶部预留空间} 单位="毫米" />
          <指标 名称="底部预留空间" 数值={计算结果.底部预留空间} 单位="毫米" />
          <指标 名称="总设备数量" 数值={计算结果.总设备数量} 单位="个" />
          <指标 名称="总发热功率" 数值={计算结果.总发热功率} 单位="瓦" />
          <指标 名称="推荐散热等级" 数值={计算结果.推荐散热等级} />
          <指标 名称="空间利用率" 数值={计算结果.空间利用率} 单位="%" />
        </dl>

        <section className="mt-5">
          <h3 className="text-sm font-semibold">扩展余量</h3>
          <p className="mt-2 rounded-md bg-slate-100 px-3 py-2 text-sm text-slate-700">{计算结果.扩展余量}</p>
        </section>

        <section className="mt-5">
          <h3 className="text-sm font-semibold">线槽空间占用情况</h3>
          <ul className="mt-2 space-y-1 text-sm text-slate-600">
            {计算结果.线槽空间占用情况.map((信息) => (
              <li key={信息}>{信息}</li>
            ))}
          </ul>
        </section>

        <section className="mt-5">
          <h3 className="text-sm font-semibold">每层设备分布</h3>
          <div className="mt-2 space-y-2">
            {计算结果.每层设备分布.length === 0 ? (
              <p className="text-sm text-slate-500">尚未生成导轨层设备。</p>
            ) : (
              计算结果.每层设备分布.map((层) => (
                <div key={`${层.层号}-${层.分区类型}`} className="rounded-md border border-slate-200 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-slate-900">
                      {层.层名称} · {层.分区类型}
                    </p>
                    <p className="text-xs text-slate-500">
                      {层.占用宽度毫米} / {层.可用宽度毫米} 毫米 · 空间 {层.空间高度毫米} 毫米
                    </p>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-slate-600">
                    {层.设备列表.map((项目) => 项目.设备.设备名称).join("、")}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>

        {计算结果.警告信息.length > 0 ? (
          <section className="mt-5">
            <h3 className="inline-flex items-center gap-2 text-sm font-semibold text-power">
              <SkeuoIcon name="warning" size={22} />
              警告信息
            </h3>
            <ul className="mt-2 space-y-2">
              {计算结果.警告信息.map((信息) => (
                <li key={信息} className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {信息}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {选中设备 ? (
          <section className="mt-5 rounded-md border border-brass bg-[#fffaf0] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="inline-flex items-center gap-2 text-sm font-semibold">
                  <SkeuoIcon name="device" size={22} />
                  选中设备参数
                </h3>
                <p className="mt-1 text-sm text-slate-700">{选中设备.设备.设备名称}</p>
              </div>
              <button
                type="button"
                onClick={() => on删除设备(选中设备.实例编号)}
                className="inline-flex items-center gap-1 rounded-md border border-red-300 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
              >
                <SkeuoIcon name="delete" size={15} />
                删除
              </button>
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="border-t border-amber-200 pt-2">
                <dt className="text-slate-500">当前数量</dt>
                <dd className="mt-1 font-medium text-slate-900">
                  {获取实例数量(选中设备)} {选中设备.设备.数量单位 ?? "个"}
                </dd>
              </div>
              {Object.entries(选中设备.设备).map(([字段, 值]) => (
                <div key={字段} className="border-t border-amber-200 pt-2">
                  <dt className="text-slate-500">{字段}</dt>
                  <dd className="mt-1 font-medium text-slate-900">{String(值)}</dd>
                </div>
              ))}
            </dl>
          </section>
        ) : null}

        <section className="mt-5">
          <h3 className="text-sm font-semibold">设备清单</h3>
          <div className="mt-2 overflow-x-auto rounded-md border border-slate-200">
            <table className="w-full min-w-[560px] text-left text-xs">
              <thead className="bg-slate-100 text-slate-500">
                <tr>
                  <th className="px-3 py-2">设备名称</th>
                  <th className="px-3 py-2">品牌</th>
                  <th className="px-3 py-2">安装方式</th>
                  <th className="px-3 py-2">数量</th>
                  <th className="px-3 py-2">总发热功率瓦</th>
                </tr>
              </thead>
              <tbody>
                {计算结果.设备清单.map((项目) => (
                  <tr key={项目.设备编号} className="border-t border-slate-200">
                    <td className="px-3 py-2">{项目.设备名称}</td>
                    <td className="px-3 py-2">{项目.品牌}</td>
                    <td className="px-3 py-2">{项目.安装方式}</td>
                    <td className="px-3 py-2">{项目.数量}</td>
                    <td className="px-3 py-2">{项目.总发热功率瓦}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-5">
          <h3 className="text-sm font-semibold">材料清单</h3>
          <div className="mt-2 space-y-2">
            {计算结果.材料清单.map((项目) => (
              <div key={`${项目.材料名称}-${项目.规格}`} className="rounded-md border border-slate-200 p-3 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium text-slate-900">{项目.材料名称}</p>
                  <p className="shrink-0 text-slate-600">
                    {项目.数量} {项目.单位}
                  </p>
                </div>
                <p className="mt-1 text-xs text-slate-500">{项目.规格}</p>
                <p className="mt-1 text-xs text-slate-500">{项目.备注}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="grid grid-cols-2 gap-2 border-t border-slate-300/80 p-4">
        <button type="button" onClick={on导出项目} className="inline-flex items-center justify-center gap-1.5 rounded-md bg-ink px-3 py-2 text-sm font-medium text-white">
          <SkeuoIcon name="json" size={18} />
          导出项目 JSON
        </button>
        <button type="button" onClick={on导出布局图片} className="inline-flex items-center justify-center gap-1.5 rounded-md bg-brass px-3 py-2 text-sm font-medium text-white">
          <SkeuoIcon name="image" size={18} />
          导出布局 PNG
        </button>
        <button
          type="button"
          onClick={on导出设备清单}
          className="inline-flex items-center justify-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700"
        >
          <SkeuoIcon name="csv" size={18} />
          导出设备 CSV
        </button>
        <button
          type="button"
          onClick={on导出材料清单}
          className="inline-flex items-center justify-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700"
        >
          <SkeuoIcon name="csv" size={18} />
          导出材料 CSV
        </button>
      </div>
    </aside>
  );
}
