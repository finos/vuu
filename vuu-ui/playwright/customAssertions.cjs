const { expect: baseExpect } = require('@playwright/test');
exports.expect = baseExpect.extend({
  async toHaveSelection(locator, start, end) {
    let pass; let errorName;
    try {
      await baseExpect.poll(async () => locator.evaluate(el => [el.selectionStart, el.selectionEnd]), { timeout: 1000 }).toEqual([start, end]);
      pass = true;
    } catch (error) { errorName = error.message.replace('toEqual', 'toHaveSelection'); pass = false; }
    return { message: () => errorName ?? 'toHaveSelection', pass, name: 'toHaveSelection', expected: [start, end] };
  },
});
