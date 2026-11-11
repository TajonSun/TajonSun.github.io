/*
 * 喧闹的城堡资料站 - 页面渲染与计算交互
 * 依赖 data/content.js、data/events.js、assets/js/calc.js
 */
(function () {
  "use strict";

  var data = window.CASTLE_DATA;
  var events = window.CASTLE_EVENTS || { items: [], checkDate: "" };
  var Calc = window.CastleCalc;

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (key) {
        if (key === "text") node.textContent = attrs[key];
        else if (key === "className") node.className = attrs[key];
        else node.setAttribute(key, attrs[key]);
      });
    }
    (children || []).forEach(function (child) {
      if (child == null) return;
      node.appendChild(typeof child === "string" ? document.createTextNode(child) : child);
    });
    return node;
  }

  function fmtNumber(value) {
    if (!isFinite(value)) return "—";
    return Number(value).toLocaleString("zh-CN", { maximumFractionDigits: 2 });
  }

  function fmtTime(date) {
    if (!(date instanceof Date) || isNaN(date.getTime())) return "—";
    return date.toLocaleString("zh-CN", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });
  }

  function setText(id, text) {
    var node = document.getElementById(id);
    if (node) node.textContent = text;
  }

  function renderMeta() {
    setText("meta-check-date", data.meta.checkDate);
    setText("meta-version", data.meta.versionNote);
    setText("meta-disclaimer", data.meta.disclaimer);
    setText("footer-check-date", data.meta.checkDate);
    setText("events-lede", events.dataNote || "");
    setText("note-essence", data.notes.essence);
    setText("note-resource", data.notes.resource);
    setText("note-training", data.notes.training);

    var lede = document.getElementById("events-lede");
    if (lede && events.checkDate) {
      lede.textContent = (events.dataNote || "") + " 活动数据核对日：" + events.checkDate + "。";
    }
  }

  function renderExperience() {
    var grid = document.getElementById("experience-grid");
    if (!grid) return;
    grid.innerHTML = "";

    data.expCards.forEach(function (card) {
      var list = el("ul", null, card.points.map(function (point) {
        return el("li", { text: point });
      }));

      grid.appendChild(el("article", { className: "exp-card" }, [
        el("div", { className: "card-top" }, [
          el("span", { className: "tag", text: card.tag }),
          el("span", {
            className: card.kind === "玩家经验" ? "kind guest" : "kind",
            text: card.kind
          })
        ]),
        el("h3", { text: card.title }),
        list,
        el("p", { className: "card-evidence", text: "依据：" + card.evidence })
      ]));
    });
  }

  function renderPartOptions() {
    var select = document.getElementById("essence-part");
    if (!select) return;
    select.innerHTML = "";
    data.parts.forEach(function (part) {
      select.appendChild(el("option", {
        value: part.id,
        text: part.label + "（单次分解 " + part.essence + " 精粹）"
      }));
    });
  }

  function eventPeriodText(item) {
  if (item.period) return "当期时间：" + item.period;
  if (item.status === "常驻") return "开放状态：常驻开放，无固定档期";
  return "当期时间：未核实（以游戏内公告为准）";
}

function renderEvents() {
    var grid = document.getElementById("event-grid");
    if (!grid) return;
    grid.innerHTML = "";

    var statusClass = { "常驻": "live", "轮换": "rotate", "限时（排期未核实）": "limited" };

    (events.items || []).forEach(function (item) {
      var tips = el("ul", null, (item.tips || []).map(function (tip) {
        return el("li", { text: tip });
      }));

      grid.appendChild(el("article", { className: "event-card" }, [
        el("div", { className: "event-top" }, [
          el("div", null, [
            el("h3", { text: item.name }),
            el("p", { className: "event-cat", text: item.category })
          ]),
          el("span", {
            className: "status " + (statusClass[item.status] || "rotate"),
            text: item.status
          })
        ]),
        el("p", { className: "event-desc", text: item.desc }),
        tips,
        el("p", {
          className: "event-period",
          text: eventPeriodText(item)
        })
      ]));
    });
  }

  function renderSources() {
    var list = document.getElementById("source-list");
    if (list) {
      list.innerHTML = "";
      data.sources.forEach(function (source) {
        var link = el("a", {
          href: source.url,
          target: "_blank",
          rel: "noopener noreferrer",
          text: source.name
        });
        list.appendChild(el("li", null, [
          link,
          el("span", { className: "src-note", text: source.note })
        ]));
      });
    }

    var gaps = document.getElementById("gap-list");
    if (gaps) {
      gaps.innerHTML = "";
      data.gaps.forEach(function (gap) {
        gaps.appendChild(el("li", { text: gap }));
      });
    }
  }

  function resultRow(label, value, extraClass, note) {
    return el("div", { className: "result-item" }, [
      el("span", { className: "r-label", text: label }),
      el("span", { className: "r-value" + (extraClass ? " " + extraClass : ""), text: value }),
      note ? el("span", { className: "r-note", text: note }) : null
    ]);
  }

  function clearInvalid(form) {
    Array.prototype.forEach.call(form.querySelectorAll("input, select"), function (field) {
      field.removeAttribute("aria-invalid");
    });
  }

  function markInvalid(form, message) {
    // 由调用方决定具体字段；这里只保证错误可见与表单状态一致
    var error = form.parentNode.querySelector(".calc-error");
    if (error) error.textContent = message;
  }

  /* ---------- 计算器 1：精粹 ---------- */

  function updateEssence() {
    var form = document.getElementById("form-essence");
    var result = document.getElementById("result-essence");
    var error = document.getElementById("err-essence");
    if (!form || !result || !error) return;

    var part = form.querySelector("#essence-part").value;
    var rerolls = form.querySelector("#essence-rerolls").value;
    var stock = form.querySelector("#essence-stock").value;

    clearInvalid(form);
    result.innerHTML = "";

    try {
      var out = Calc.rerollEssence(part, rerolls, stock);
      error.textContent = "";

      result.appendChild(resultRow("单次重做需要", out.perRun + " 精粹"));
      result.appendChild(resultRow("本轮总需求", fmtNumber(out.total) + " 精粹", "accent"));
      result.appendChild(resultRow("现有精粹", fmtNumber(out.stock)));
      result.appendChild(resultRow("缺口", fmtNumber(out.shortage) + " 精粹", out.shortage > 0 ? "accent" : "ok"));
      result.appendChild(resultRow("需额外分解同部位装备", out.extraSalvage + " 件", null, "按每次分解 " + out.perRun + " 精粹计"));
      result.appendChild(resultRow("全部完成后剩余", fmtNumber(out.endStock) + " 精粹"));

      result.appendChild(el("p", {
        className: "result-hint",
        text: out.shortage > 0
          ? "库存不足，需要先额外分解 " + out.extraSalvage + " 件同部位红装，才能支撑 " + out.rerolls + " 次重做。"
          : "现有精粹已足够完成 " + out.rerolls + " 次重做，剩余 " + fmtNumber(out.endStock) + " 个。"
      }));
    } catch (err) {
      error.textContent = err.message;
      var target = form.querySelector("#essence-rerolls");
      if (target) target.setAttribute("aria-invalid", "true");
    }
  }

  /* ---------- 计算器 2：资源 ---------- */

  function updateResource() {
    var form = document.getElementById("form-resource");
    var result = document.getElementById("result-resource");
    var error = document.getElementById("err-resource");
    if (!form || !result || !error) return;

    var target = form.querySelector("#resource-target").value;
    var current = form.querySelector("#resource-current").value;
    var rate = form.querySelector("#resource-rate").value;

    clearInvalid(form);
    result.innerHTML = "";

    try {
      var out = Calc.gathering(target, current, rate);
      error.textContent = "";

      var finish = Calc.addHours(out.startDate, out.hours);

      result.appendChild(resultRow("还差", fmtNumber(out.gap)));
      result.appendChild(resultRow("预计耗时", Calc.formatDuration(out.hours), "accent"));
      result.appendChild(resultRow("折合天", fmtNumber(out.days) + " 天"));
      result.appendChild(resultRow("按整点计", out.hours > 0 ? Math.ceil(out.hours) + " 小时" : "0 小时"));
      result.appendChild(el("div", { className: "result-item result-wide" }, [
        el("span", { className: "r-label", text: "如果从现在开始，预计完成时间" }),
        el("span", { className: "r-value accent", text: fmtTime(finish) })
      ]));
      result.appendChild(el("p", {
        className: "result-hint",
        text: "该结果是线性估算：未计入加速道具、掠夺收益、产量加成与仓库上限，实际可能更早或更晚。"
      }));
    } catch (err2) {
      error.textContent = err2.message;
      var target2 = form.querySelector("#resource-target");
      if (target2) target2.setAttribute("aria-invalid", "true");
    }
  }

  /* ---------- 计算器 3：训练 ---------- */

  function updateTraining() {
    var form = document.getElementById("form-training");
    var result = document.getElementById("result-training");
    var error = document.getElementById("err-training");
    if (!form || !result || !error) return;

    var people = form.querySelector("#training-people").value;
    var slots = form.querySelector("#training-slots").value;
    var minutes = form.querySelector("#training-minutes").value;

    clearInvalid(form);
    result.innerHTML = "";

    try {
      var out = Calc.training(people, slots, minutes);
      error.textContent = "";

      var finish = Calc.addMinutes(new Date(), out.totalMinutes);

      result.appendChild(resultRow("需要批次", out.batches + " 批"));
      result.appendChild(resultRow("总时长", Calc.formatMinutes(out.totalMinutes), "accent"));
      result.appendChild(resultRow("总小时数", fmtNumber(out.totalHours) + " 小时"));
      result.appendChild(resultRow("最后一轮人数", out.lastBatchCount + " 人"));
      result.appendChild(el("div", { className: "result-item result-wide" }, [
        el("span", { className: "r-label", text: "如果现在开始，预计练完时间" }),
        el("span", { className: "r-value accent", text: fmtTime(finish) })
      ]));
      result.appendChild(el("p", {
        className: "result-hint",
        text: "按训练位同时开工、批次串行计算；未计入训练加速、队列插队与居民技能差异。"
      }));
    } catch (err3) {
      error.textContent = err3.message;
      var target3 = form.querySelector("#training-people");
      if (target3) target3.setAttribute("aria-invalid", "true");
    }
  }

  function bind(inputId, handler) {
    var node = document.getElementById(inputId);
    if (!node) return;
    node.addEventListener("input", handler);
    node.addEventListener("change", handler);
  }

  function bindCalculators() {
    bind("essence-part", updateEssence);
    bind("essence-rerolls", updateEssence);
    bind("essence-stock", updateEssence);

    bind("resource-target", updateResource);
    bind("resource-current", updateResource);
    bind("resource-rate", updateResource);

    bind("training-people", updateTraining);
    bind("training-slots", updateTraining);
    bind("training-minutes", updateTraining);
  }

  function init() {
    if (!data || !Calc) {
      var grid = document.getElementById("experience-grid");
      if (grid) grid.innerHTML = "<p class='empty'>数据脚本加载失败，请检查 data/content.js 与 assets/js/calc.js 是否存在。</p>";
      return;
    }
    renderMeta();
    renderExperience();
    renderPartOptions();
    renderEvents();
    renderSources();
    bindCalculators();
    updateEssence();
    updateResource();
    updateTraining();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
