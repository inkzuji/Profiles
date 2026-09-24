const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const test = require("node:test");

const script = fs.readFileSync(path.join(__dirname, "rename.js"), "utf8");
const notices = [
  "过滤掉14条线路",
  "建议：感到卡顿请切换到专线节点",
  "放丢失官网:https://love.p6m6.com",
  "放丢失官网2:https://love2.p6m6.com",
  "**&#x653E;丢失官网:[https://love.p6m6.com](https://love.p6m6.com)**",
  "剩余流量：100GB",
  "套餐到期：2026-10-01",
];
const validNames = [
  "🇯🇵日本高速01|CTCU|0.5x",
  "香港专线 IPLC 02",
  "自定义直连 03",
  "Home [123]",
  "NetEase Music",
];

function run(names, args = {}) {
  const context = vm.createContext({ $arguments: args });
  vm.runInContext(script, context);
  return Array.from(context.operator(names.map((name) => ({ name }))), (node) => node.name);
}

test("默认过滤提示节点，保留正常线路原名和顺序", () => {
  assert.deepEqual(run([...notices, ...validNames]), validNames);
});

test("启用重命名时也过滤提示节点，即使允许保留未知地区", () => {
  assert.deepEqual(run(notices, { rename: "on", nm: true }), []);
});

test("显式关闭 clear 时保留提示节点", () => {
  for (const clear of [false, "false", "off"]) {
    assert.deepEqual(run(notices, { clear }), notices);
  }
});

test("添加前缀和国旗不破坏正常线路的原始标签", () => {
  assert.deepEqual(run([notices[0], validNames[0]], {
    flag: true, name: "%5BLXY%5D", nf: true, blgd: true,
    blkey: "IPLC+专线+家宽+直连",
  }), ["[LXY] 🇯🇵 日本高速01|CTCU|0.5x"]);
});
