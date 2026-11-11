/*
 * 计算内核断言测试：node tests/calc.test.js
 * 不依赖任何测试框架，失败即非零退出码。
 */
var assert = require("assert");
var Calc = require("../assets/js/calc.js");

var passed = 0;

function check(name, fn) {
  fn();
  passed += 1;
  console.log("PASS " + name);
}

check("各部位单次分解精粹", function () {
  assert.strictEqual(Calc.ESSENCE_PER_SALVAGE.weapon, 3);
  assert.strictEqual(Calc.ESSENCE_PER_SALVAGE.armor, 3);
  assert.strictEqual(Calc.ESSENCE_PER_SALVAGE.soul, 2);
  assert.strictEqual(Calc.ESSENCE_PER_SALVAGE.ring, 1);
  assert.strictEqual(Calc.ESSENCE_PER_SALVAGE.amulet, 1);
});

check("库存为 0 时按次数累加并折算分解件数", function () {
  var r = Calc.rerollEssence("weapon", 3, 0);
  assert.strictEqual(r.perRun, 3);
  assert.strictEqual(r.total, 9);
  assert.strictEqual(r.shortage, 9);
  assert.strictEqual(r.extraSalvage, 3);
  assert.strictEqual(r.endStock, 0);
});

check("库存充足时无缺口", function () {
  var r = Calc.rerollEssence("soul", 2, 10);
  assert.strictEqual(r.total, 4);
  assert.strictEqual(r.shortage, 0);
  assert.strictEqual(r.extraSalvage, 0);
  assert.strictEqual(r.endStock, 6);
});

check("部分库存时向上取整补足分解件数", function () {
  var r = Calc.rerollEssence("ring", 5, 2);
  assert.strictEqual(r.perRun, 1);
  assert.strictEqual(r.total, 5);
  assert.strictEqual(r.shortage, 3);
  assert.strictEqual(r.extraSalvage, 3);
  assert.strictEqual(r.endStock, 0);

  var r2 = Calc.rerollEssence("weapon", 2, 4);
  assert.strictEqual(r2.total, 6);
  assert.strictEqual(r2.shortage, 2);
  assert.strictEqual(r2.extraSalvage, 1);
  assert.strictEqual(r2.endStock, 1);
});

check("零次重做返回全零需求", function () {
  var r = Calc.rerollEssence("armor", 0, 5);
  assert.strictEqual(r.total, 0);
  assert.strictEqual(r.shortage, 0);
  assert.strictEqual(r.endStock, 5);
});

check("非法部位与非法次数被拒绝", function () {
  assert.throws(function () { Calc.rerollEssence("helmet", 1, 0); }, /未知的装备部位/);
  assert.throws(function () { Calc.rerollEssence("weapon", -1, 0); }, /整数/);
  assert.throws(function () { Calc.rerollEssence("weapon", 1.5, 0); }, /整数/);
  assert.throws(function () { Calc.rerollEssence("weapon", 1, -3); }, /整数/);
});

check("资源攒积时间计算", function () {
  var r = Calc.gathering(100000, 20000, 2500);
  assert.strictEqual(r.gap, 80000);
  assert.strictEqual(r.hours, 32);
  assert.strictEqual(r.days, 32 / 24);
});

check("资源参数校验", function () {
  assert.throws(function () { Calc.gathering(0, 0, 10); }, /目标数量必须大于 0/);
  assert.throws(function () { Calc.gathering(100, 100, 10); }, /目标数量需要大于当前数量/);
  assert.throws(function () { Calc.gathering(100, 0, 0); }, /每小时产出必须大于 0/);
  assert.throws(function () { Calc.gathering(100, -5, 10); }, /当前数量必须不小于 0/);
});

check("训练排程按批次计算", function () {
  var r = Calc.training(5, 2, 60);
  assert.strictEqual(r.batches, 3);
  assert.strictEqual(r.totalMinutes, 180);
  assert.strictEqual(r.totalHours, 3);
  assert.strictEqual(r.lastBatchCount, 1);
});

check("训练人数整除时最后一轮满员", function () {
  var r = Calc.training(6, 3, 45);
  assert.strictEqual(r.batches, 2);
  assert.strictEqual(r.totalMinutes, 90);
  assert.strictEqual(r.lastBatchCount, 3);
});

check("训练参数校验", function () {
  assert.throws(function () { Calc.training(0, 2, 60); }, /待训练人数必须大于 0/);
  assert.throws(function () { Calc.training(3, 0, 60); }, /训练位数量/);
  assert.throws(function () { Calc.training(3, 2, 0); }, /单人训练时长/);
});

check("时长格式化", function () {
  assert.strictEqual(Calc.formatDuration(32), "1 天 8 小时");
  assert.strictEqual(Calc.formatDuration(1.5), "1 小时 30 分");
  assert.strictEqual(Calc.formatDuration(0.5), "30 分");
  assert.strictEqual(Calc.formatMinutes(180), "3 小时");
});

check("完成时间按小时与分钟累加", function () {
  var base = new Date("2026-11-11T10:00:00");
  var afterHours = Calc.addHours(base, 32);
  assert.strictEqual(afterHours.toISOString(), new Date("2026-11-12T18:00:00").toISOString());
  var afterMinutes = Calc.addMinutes(base, 180);
  assert.strictEqual(afterMinutes.toISOString(), new Date("2026-11-11T13:00:00").toISOString());
});

console.log("\n" + passed + " 项测试全部通过");
