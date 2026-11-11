/*
 * 喧闹的城堡资料站 - 计算内核
 * 无依赖，浏览器挂载 window.CastleCalc，Node 环境可用 require 直接测试。
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.CastleCalc = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var ESSENCE_PER_SALVAGE = {
    weapon: 3,
    armor: 3,
    soul: 2,
    ring: 1,
    amulet: 1
  };

  var PART_LABELS = {
    weapon: "武器",
    armor: "护甲",
    soul: "魂",
    ring: "戒指",
    amulet: "项链"
  };

  function toNumber(value) {
    if (value === "" || value === null || value === undefined) return NaN;
    var n = Number(value);
    return isFinite(n) ? n : NaN;
  }

  function requireInt(n, label) {
    if (!isFinite(n) || Math.floor(n) !== n || n < 0) {
      throw new Error(label + "必须是不小于 0 的整数");
    }
  }

  /**
   * 红装重做精粹计算
   * @param {string} part 部位 id
   * @param {number} rerolls 计划重做次数
   * @param {number} stock 现有精粹数量
   */
  function rerollEssence(part, rerolls, stock) {
    if (!Object.prototype.hasOwnProperty.call(ESSENCE_PER_SALVAGE, part)) {
      throw new Error("未知的装备部位");
    }
    var n = toNumber(rerolls);
    var s = stock === "" || stock === null || stock === undefined ? 0 : toNumber(stock);
    requireInt(n, "重做次数");
    requireInt(s, "现有精粹");

    var perRun = ESSENCE_PER_SALVAGE[part];
    var total = perRun * n;
    var shortage = Math.max(0, total - s);
    var extraSalvage = perRun > 0 ? Math.ceil(shortage / perRun) : 0;

    return {
      part: part,
      partLabel: PART_LABELS[part],
      perRun: perRun,
      rerolls: n,
      total: total,
      stock: s,
      shortage: shortage,
      extraSalvage: extraSalvage,
      endStock: s + extraSalvage * perRun - total
    };
  }

  /**
   * 资源攒积时间计算
   */
  function gathering(target, current, perHour) {
    var t = toNumber(target);
    var c = toNumber(current);
    var p = toNumber(perHour);

    if (!isFinite(t) || t <= 0) throw new Error("目标数量必须大于 0");
    if (!isFinite(c) || c < 0) throw new Error("当前数量必须不小于 0");
    if (!isFinite(p) || p <= 0) throw new Error("每小时产出必须大于 0");
    if (t <= c) throw new Error("目标数量需要大于当前数量");

    var gap = t - c;
    var hours = gap / p;

    return {
      gap: gap,
      hours: hours,
      days: hours / 24,
      startDate: new Date()
    };
  }

  /**
   * 训练排程计算
   */
  function training(people, slots, minutesPerPerson) {
    var n = toNumber(people);
    var s = toNumber(slots);
    var m = toNumber(minutesPerPerson);

    requireInt(n, "待训练人数");
    if (n <= 0) throw new Error("待训练人数必须大于 0");
    if (!isFinite(s) || Math.floor(s) !== s || s <= 0) throw new Error("训练位数量必须是大于 0 的整数");
    if (!isFinite(m) || m <= 0) throw new Error("单人训练时长必须大于 0");

    var batches = Math.ceil(n / s);
    var totalMinutes = batches * m;

    return {
      people: n,
      slots: s,
      minutesPerPerson: m,
      batches: batches,
      totalMinutes: totalMinutes,
      totalHours: totalMinutes / 60,
      lastBatchCount: n - (batches - 1) * s
    };
  }

  function addHours(baseDate, hours) {
    var base = baseDate ? new Date(baseDate) : new Date();
    if (isNaN(base.getTime())) throw new Error("开始时间无效");
    return new Date(base.getTime() + hours * 3600 * 1000);
  }

  function addMinutes(baseDate, minutes) {
    var base = baseDate ? new Date(baseDate) : new Date();
    if (isNaN(base.getTime())) throw new Error("开始时间无效");
    return new Date(base.getTime() + minutes * 60 * 1000);
  }

  function formatDuration(hours) {
    if (!isFinite(hours) || hours < 0) throw new Error("时长无效");
    var totalMinutes = Math.round(hours * 60);
    var days = Math.floor(totalMinutes / 1440);
    var restMinutes = totalMinutes % 1440;
    var h = Math.floor(restMinutes / 60);
    var m = restMinutes % 60;
    var parts = [];
    if (days > 0) parts.push(days + " 天");
    if (h > 0) parts.push(h + " 小时");
    if (m > 0 || parts.length === 0) parts.push(m + " 分");
    return parts.join(" ");
  }

  function formatMinutes(minutes) {
    return formatDuration(minutes / 60);
  }

  return {
    ESSENCE_PER_SALVAGE: ESSENCE_PER_SALVAGE,
    PART_LABELS: PART_LABELS,
    rerollEssence: rerollEssence,
    gathering: gathering,
    training: training,
    addHours: addHours,
    addMinutes: addMinutes,
    formatDuration: formatDuration,
    formatMinutes: formatMinutes
  };
});
