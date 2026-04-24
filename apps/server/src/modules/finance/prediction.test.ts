import dayjs from 'dayjs';

/**
 * 模拟预测算法逻辑
 */
function predict(spent: any, daysElapsed: any, totalDays: any) {
  const dailyRate = spent / daysElapsed;
  const predictedEnd = dailyRate * totalDays;
  return predictedEnd;
}

const tests = [
  { spent: 500, elapsed: 10, total: 30, expected: 1500, desc: '线性消费' },
  { spent: 1000, elapsed: 10, total: 30, expected: 3000, desc: '高频消费' },
  { spent: 100, elapsed: 10, total: 30, expected: 300, desc: '节约消费' },
];

console.log('--- 预测算法单元测试 ---');
tests.forEach((t) => {
  const result = predict(t.spent, t.elapsed, t.total);
  const pass = Math.abs(result - t.expected) < 0.01;
  console.log(
    `[${pass ? 'PASS' : 'FAIL'}] ${t.desc}: 支出 ${t.spent}, 已过 ${t.elapsed}/${t.total}天 -> 预测月底: ${result} (期望: ${t.expected})`,
  );
});
