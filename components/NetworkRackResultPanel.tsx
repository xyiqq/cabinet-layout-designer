"use client";

import type { 已放置网络设备, 网络机柜计算结果, 网络设备参数 } from "@/types/设备";
import { 单台机柜配电箱DIN容量 } from "@/lib/网络机柜布局";
import { SkeuoIcon } from "@/components/SkeuoIcon";

interface NetworkRackResultPanelProps {
  计算结果: 网络机柜计算结果;
  导出机柜尺寸: {
    宽度毫米: number;
    深度毫米: number;
  };
  选中设备: 已放置网络设备 | null;
  非前侧设备列表: 已放置网络设备[];
  全部设备列表: 已放置网络设备[];
  箱内组件库: 网络设备参数[];
  可撤销: boolean;
  on删除设备: (实例编号: string) => void;
  on移动设备: (实例编号: string, 方向: "上移" | "下移") => void;
  on添加箱内组件: (设备: 网络设备参数, 配电箱实例编号: string) => void;
  on移动箱内组件顺序: (实例编号: string, 方向: "上移" | "下移" | "置顶" | "置底") => void;
  on整理设备: (方向: "上移" | "下移") => void;
  on恢复上一步: () => void;
  on导出项目: () => void;
  on导出设备清单: () => void;
  on导出材料清单: () => void;
  on导出U位占用表: () => void;
  on导出布局图片: () => void;
  on导出机柜尺寸变化: (尺寸: { 宽度毫米: number; 深度毫米: number }) => void;
}

const 导出宽度选项 = [600, 800];
const 导出深度选项 = [600, 800];

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

function 是机柜配电箱(项目: 已放置网络设备 | null) {
  return Boolean(项目?.设备.设备类别.includes("机柜配电箱"));
}

function 计算DIN模数(项目: 已放置网络设备 | 网络设备参数) {
  const 设备 = "设备" in 项目 ? 项目.设备 : 项目;
  return Math.max(1, Math.ceil(设备.宽度毫米 / 18));
}

export function NetworkRackResultPanel({
  计算结果,
  导出机柜尺寸,
  选中设备,
  非前侧设备列表,
  全部设备列表,
  箱内组件库,
  可撤销,
  on删除设备,
  on移动设备,
  on添加箱内组件,
  on移动箱内组件顺序,
  on整理设备,
  on恢复上一步,
  on导出项目,
  on导出设备清单,
  on导出材料清单,
  on导出U位占用表,
  on导出布局图片,
  on导出机柜尺寸变化
}: NetworkRackResultPanelProps) {
  const 可移动选中设备 = 选中设备 ? 选中设备.占用U数 > 0 : false;
  const 当前配电箱实例编号 = 是机柜配电箱(选中设备) ? 选中设备?.实例编号 : 选中设备?.所属配电箱实例编号;
  const 当前配电箱 = 当前配电箱实例编号 ? 全部设备列表.find((项目) => 项目.实例编号 === 当前配电箱实例编号) ?? null : null;
  const 当前箱内组件列表 = 当前配电箱实例编号
    ? 全部设备列表.filter((项目) => 项目.所属配电箱实例编号 === 当前配电箱实例编号)
    : [];
  const 当前箱内模数 = 当前箱内组件列表.reduce((合计, 项目) => 合计 + 计算DIN模数(项目), 0);
  const 当前配电箱已满 = 当前箱内模数 >= 单台机柜配电箱DIN容量;
  const 未归属非前侧设备列表 = 非前侧设备列表.filter((项目) => !项目.所属配电箱实例编号);

  return (
    <aside className="flex min-h-0 flex-col bg-white">
      <div className="border-b border-slate-300/80 px-4 py-4">
        <h2 className="inline-flex items-center gap-2 text-sm font-semibold">
          <SkeuoIcon name="rack" size={22} />
          网络机柜计算结果
        </h2>
        <p className="mt-1 text-xs text-slate-500">推荐机柜、U位占用、设备清单和警告信息</p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <section className="rounded-md border border-slate-300 bg-slate-50 p-4">
          <p className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
            <SkeuoIcon name="dimension" size={20} />
            推荐机柜规格
          </p>
          <p className="mt-2 text-2xl font-semibold text-ink">{计算结果.推荐机柜规格.规格名称}</p>
          <p className="mt-1 text-xs text-slate-500">
            {计算结果.推荐机柜类型} · 承重 {计算结果.推荐机柜规格.推荐最大承重千克} 千克 · {计算结果.推荐机柜规格.推荐用途}
          </p>
          <p className="mt-2 text-sm text-slate-600">{计算结果.散热建议}</p>
        </section>

        <dl className="mt-4 grid grid-cols-2 gap-x-4">
          <指标 名称="设备总 U 数" 数值={计算结果.设备总U数} 单位="U" />
          <指标 名称="理线架占用 U 数" 数值={计算结果.理线架占用U数} 单位="U" />
          <指标 名称="托盘占用 U 数" 数值={计算结果.托盘占用U数} 单位="U" />
          <指标 名称="盲板占用 U 数" 数值={计算结果.盲板占用U数} 单位="U" />
          <指标 名称="推荐机柜 U 数" 数值={计算结果.推荐机柜U数} 单位="U" />
          <指标 名称="推荐机柜宽度" 数值={计算结果.推荐机柜宽度} 单位="毫米" />
          <指标 名称="推荐机柜深度" 数值={计算结果.推荐机柜深度} 单位="毫米" />
          <指标 名称="推荐机柜高度" 数值={计算结果.推荐机柜规格.高度毫米} 单位="毫米" />
          <指标 名称="推荐机柜类型" 数值={计算结果.推荐机柜类型} />
          <指标 名称="U 位利用率" 数值={计算结果.U位利用率} 单位="%" />
          <指标 名称="扩展余量" 数值={计算结果.扩展余量} />
          <指标 名称="总发热功率" 数值={计算结果.总发热功率} 单位="瓦" />
        </dl>

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

        <section className="mt-5 rounded-md border border-slate-300 bg-white p-4">
          <h3 className="inline-flex items-center gap-2 text-sm font-semibold">
            <SkeuoIcon name="auto" size={22} />
            快速整理
          </h3>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => on整理设备("上移")}
              className="inline-flex items-center justify-center gap-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 hover:border-brass hover:bg-amber-50"
            >
              <SkeuoIcon name="moveUp" size={16} />
              一键上移
            </button>
            <button
              type="button"
              onClick={() => on整理设备("下移")}
              className="inline-flex items-center justify-center gap-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 hover:border-brass hover:bg-amber-50"
            >
              <SkeuoIcon name="moveDown" size={16} />
              一键下移
            </button>
            <button
              type="button"
              disabled={!可撤销}
              onClick={on恢复上一步}
              className="inline-flex items-center justify-center gap-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 hover:border-brass hover:bg-amber-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400 disabled:hover:bg-white"
            >
              <SkeuoIcon name="undo" size={16} />
              恢复上一步
            </button>
          </div>
        </section>

        {当前配电箱 ? (
          <section className="mt-5 rounded-md border border-brass bg-[#fffaf0] p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="inline-flex items-center gap-2 text-sm font-semibold">
                  <SkeuoIcon name="module" size={22} />
                  模块内DIN组件
                </h3>
                <p className="mt-1 truncate text-xs text-slate-600">{当前配电箱.设备.设备名称}</p>
                <p className="mt-1 text-xs text-slate-500">
                  已用约 {当前箱内模数} / {单台机柜配电箱DIN容量} 模数
                  {当前配电箱已满 ? " · 继续加入会自动新建 3U 配电箱" : ""}
                </p>
              </div>
            </div>

            <div className="mt-3 space-y-2">
              {当前箱内组件列表.length > 0 ? (
                当前箱内组件列表.map((项目, 索引) => (
                  <div key={项目.实例编号} className="rounded-md border border-amber-200 bg-white px-3 py-2 text-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-900">{项目.设备.设备名称}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {项目.设备.设备类型} · {计算DIN模数(项目)} 模数
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => on删除设备(项目.实例编号)}
                        className="inline-flex shrink-0 items-center gap-1 rounded-md border border-red-300 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
                      >
                        <SkeuoIcon name="delete" size={15} />
                        删除
                      </button>
                    </div>
                    <div className="mt-2 grid grid-cols-4 gap-1">
                      {[
                        { 标签: "置顶", 方向: "置顶" as const, 禁用: 索引 === 0 },
                        { 标签: "上移", 方向: "上移" as const, 禁用: 索引 === 0 },
                        { 标签: "下移", 方向: "下移" as const, 禁用: 索引 === 当前箱内组件列表.length - 1 },
                        { 标签: "置底", 方向: "置底" as const, 禁用: 索引 === 当前箱内组件列表.length - 1 }
                      ].map((动作) => (
                        <button
                          key={动作.方向}
                          type="button"
                          disabled={动作.禁用}
                          aria-label={`${项目.设备.设备名称}${动作.标签}`}
                          onClick={() => on移动箱内组件顺序(项目.实例编号, 动作.方向)}
                          className="inline-flex items-center justify-center gap-1 rounded border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-medium text-slate-700 hover:border-brass hover:bg-white disabled:cursor-not-allowed disabled:border-slate-100 disabled:bg-slate-50 disabled:text-slate-300"
                        >
                          <SkeuoIcon name={动作.方向 === "置顶" || 动作.方向 === "上移" ? "moveUp" : "moveDown"} size={13} />
                          {动作.标签}
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <p className="rounded-md border border-amber-200 bg-white px-3 py-2 text-xs text-slate-500">
                  选中这个 3U 配电箱后，可以从下面加入空开、电源、端子排等箱内组件。
                </p>
              )}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              {箱内组件库.map((设备) => (
                <button
                  key={设备.设备编号}
                  type="button"
                  onClick={() => on添加箱内组件(设备, 当前配电箱.实例编号)}
                  className="inline-flex items-start gap-1.5 rounded-md border border-amber-300 bg-white px-2 py-2 text-left text-xs font-medium text-slate-800 hover:bg-amber-50"
                >
                  <SkeuoIcon name="module" size={18} />
                  <span className="min-w-0">
                    <span className="block truncate">{设备.设备名称.replace(/^箱内DIN /, "")}</span>
                    <span className="mt-1 block text-[11px] font-normal text-slate-500">
                      {Math.max(1, Math.ceil(设备.宽度毫米 / 18))} 模数{当前配电箱已满 ? " · 新箱" : ""}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </section>
        ) : null}

        {未归属非前侧设备列表.length > 0 ? (
          <section className="mt-5 rounded-md border border-slate-300 bg-white p-4">
            <h3 className="text-sm font-semibold">后侧 / 未归属设备</h3>
            <div className="mt-3 space-y-2">
              {未归属非前侧设备列表.map((项目) => (
                <div key={项目.实例编号} className="rounded-md border border-slate-200 px-3 py-2 text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900">{项目.设备.设备名称}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {项目.设备.设备类别} · {项目.设备.安装方式} · 不占前侧U位
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => on删除设备(项目.实例编号)}
                      className="inline-flex shrink-0 items-center gap-1 rounded-md border border-red-300 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
                    >
                      <SkeuoIcon name="delete" size={15} />
                      删除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {选中设备 ? (
          <section className="mt-5 rounded-md border border-brass bg-[#fffaf0] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="inline-flex items-center gap-2 text-sm font-semibold">
                  <SkeuoIcon name="network" size={22} />
                  选中网络设备
                </h3>
                <p className="mt-1 text-sm text-slate-700">{选中设备.设备.设备名称}</p>
                <p className="mt-1 text-xs text-slate-500">
                  起始 {选中设备.起始U位}U · 占用 {选中设备.占用U数}U · {选中设备.设备.安装方式}
                </p>
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
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={!可移动选中设备 || 选中设备.起始U位 <= 1}
                onClick={() => on移动设备(选中设备.实例编号, "上移")}
                className="inline-flex items-center justify-center gap-1 rounded-md border border-amber-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 hover:bg-amber-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400 disabled:hover:bg-white"
              >
                <SkeuoIcon name="moveUp" size={16} />
                上移 1U
              </button>
              <button
                type="button"
                disabled={!可移动选中设备}
                onClick={() => on移动设备(选中设备.实例编号, "下移")}
                className="inline-flex items-center justify-center gap-1 rounded-md border border-amber-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 hover:bg-amber-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400 disabled:hover:bg-white"
              >
                <SkeuoIcon name="moveDown" size={16} />
                下移 1U
              </button>
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
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
          <h3 className="text-sm font-semibold">U 位占用表</h3>
          <div className="mt-2 overflow-x-auto rounded-md border border-slate-200">
            <table className="w-full min-w-[520px] text-left text-xs">
              <thead className="bg-slate-100 text-slate-500">
                <tr>
                  <th className="px-3 py-2">U位</th>
                  <th className="px-3 py-2">名称</th>
                  <th className="px-3 py-2">类型</th>
                  <th className="px-3 py-2">占用U数</th>
                </tr>
              </thead>
              <tbody>
                {计算结果.U位占用表.map((项目) => (
                  <tr key={`${项目.名称}-${项目.起始U位}-${项目.结束U位}`} className="border-t border-slate-200">
                    <td className="px-3 py-2">
                      {项目.起始U位}U-{项目.结束U位}U
                    </td>
                    <td className="px-3 py-2">{项目.名称}</td>
                    <td className="px-3 py-2">{项目.类型}</td>
                    <td className="px-3 py-2">{项目.占用U数}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-5">
          <h3 className="text-sm font-semibold">设备清单</h3>
          <div className="mt-2 overflow-x-auto rounded-md border border-slate-200">
            <table className="w-full min-w-[640px] text-left text-xs">
              <thead className="bg-slate-100 text-slate-500">
                <tr>
                  <th className="px-3 py-2">设备名称</th>
                  <th className="px-3 py-2">类别</th>
                  <th className="px-3 py-2">安装方式</th>
                  <th className="px-3 py-2">U数</th>
                  <th className="px-3 py-2">网口</th>
                  <th className="px-3 py-2">PoE口</th>
                  <th className="px-3 py-2">发热瓦</th>
                </tr>
              </thead>
              <tbody>
                {计算结果.设备清单.map((项目) => (
                  <tr key={项目.设备编号} className="border-t border-slate-200">
                    <td className="px-3 py-2">{项目.设备名称}</td>
                    <td className="px-3 py-2">{项目.设备类别}</td>
                    <td className="px-3 py-2">{项目.安装方式}</td>
                    <td className="px-3 py-2">{项目.机柜U数}</td>
                    <td className="px-3 py-2">{项目.网口数量}</td>
                    <td className="px-3 py-2">{项目.PoE口数量}</td>
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

      <div className="border-t border-slate-300/80 p-4">
        <section className="rounded-md border border-slate-200 bg-slate-50 p-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-xs font-semibold text-slate-700">U位图导出尺寸</h3>
            <div className="flex gap-1">
              {[
                { 标签: "600×600", 宽度毫米: 600, 深度毫米: 600 },
                { 标签: "800×600", 宽度毫米: 800, 深度毫米: 600 }
              ].map((预设) => {
                const 已选中 = 导出机柜尺寸.宽度毫米 === 预设.宽度毫米 && 导出机柜尺寸.深度毫米 === 预设.深度毫米;
                return (
                  <button
                    key={预设.标签}
                    type="button"
                    aria-pressed={已选中}
                    onClick={() => on导出机柜尺寸变化({ 宽度毫米: 预设.宽度毫米, 深度毫米: 预设.深度毫米 })}
                  className={`inline-flex items-center gap-1 rounded border px-2 py-1 text-[11px] font-medium ${
                      已选中 ? "border-brass bg-amber-50 text-ink" : "border-slate-300 bg-white text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <SkeuoIcon name="dimension" size={14} />
                    {预设.标签}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <label className="text-[11px] font-medium text-slate-500">
              宽度
              <select
                aria-label="U位图导出宽度"
                value={导出机柜尺寸.宽度毫米}
                onChange={(event) =>
                  on导出机柜尺寸变化({ ...导出机柜尺寸, 宽度毫米: Number(event.target.value) })
                }
                className="mt-1 h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-800"
              >
                {导出宽度选项.map((宽度) => (
                  <option key={宽度} value={宽度}>
                    {宽度} mm
                  </option>
                ))}
              </select>
            </label>
            <label className="text-[11px] font-medium text-slate-500">
              深度
              <select
                aria-label="U位图导出深度"
                value={导出机柜尺寸.深度毫米}
                onChange={(event) =>
                  on导出机柜尺寸变化({ ...导出机柜尺寸, 深度毫米: Number(event.target.value) })
                }
                className="mt-1 h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-800"
              >
                {导出深度选项.map((深度) => (
                  <option key={深度} value={深度}>
                    {深度} mm
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <button type="button" onClick={on导出项目} className="inline-flex items-center justify-center gap-1.5 rounded-md bg-ink px-3 py-2 text-sm font-medium text-white">
            <SkeuoIcon name="json" size={18} />
            导出项目 JSON
          </button>
          <button type="button" onClick={on导出布局图片} className="inline-flex items-center justify-center gap-1.5 rounded-md bg-brass px-3 py-2 text-sm font-medium text-white">
            <SkeuoIcon name="image" size={18} />
            导出 U 位图
          </button>
          <button
            type="button"
            onClick={on导出设备清单}
            className="inline-flex items-center justify-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700"
          >
            <SkeuoIcon name="csv" size={18} />
            网络设备 CSV
          </button>
          <button
            type="button"
            onClick={on导出U位占用表}
            className="inline-flex items-center justify-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700"
          >
            <SkeuoIcon name="csv" size={18} />
            U 位占用 CSV
          </button>
          <button
            type="button"
            onClick={on导出材料清单}
            className="col-span-2 inline-flex items-center justify-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700"
          >
            <SkeuoIcon name="csv" size={18} />
            材料清单 CSV
          </button>
        </div>
      </div>
    </aside>
  );
}
