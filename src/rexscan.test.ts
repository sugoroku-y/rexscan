import {scan, replace, split} from './index';

test('scan#1', () => {
  expect(
    [...scan(/\w+/g, 'abc def ghi')].map(
      ({index, startIndex, prevLastIndex, lastIndex, 0: matched}) => ({
        index,
        startIndex,
        prevLastIndex,
        lastIndex,
        matched,
      })
    )
  ).toEqual([
    {index: 0, startIndex: 0, prevLastIndex: 0, lastIndex: 3, matched: 'abc'},
    {index: 4, startIndex: 3, prevLastIndex: 3, lastIndex: 7, matched: 'def'},
    {index: 8, startIndex: 7, prevLastIndex: 7, lastIndex: 11, matched: 'ghi'},
  ]);
});
test('scan#2', () => {
  expect(
    [...scan(/\w+/, 'abc def ghi')].map(({index, 0: matched}) => ({
      index,
      matched,
    }))
  ).toEqual([{index: 0, matched: 'abc'}]);
});
test('scan#3', () => {
  expect(
    [...scan(/(?=(\w))/g, 'abc def ghi')].map(
      ({index, startIndex, prevLastIndex, lastIndex, 1: matched}) => ({
        index,
        startIndex,
        prevLastIndex,
        lastIndex,
        matched,
      })
    )
  ).toEqual([
    {index: 0, startIndex: 0, prevLastIndex: 0, lastIndex: 0, matched: 'a'},
    {index: 1, startIndex: 1, prevLastIndex: 0, lastIndex: 1, matched: 'b'},
    {index: 2, startIndex: 2, prevLastIndex: 1, lastIndex: 2, matched: 'c'},
    {index: 4, startIndex: 3, prevLastIndex: 2, lastIndex: 4, matched: 'd'},
    {index: 5, startIndex: 5, prevLastIndex: 4, lastIndex: 5, matched: 'e'},
    {index: 6, startIndex: 6, prevLastIndex: 5, lastIndex: 6, matched: 'f'},
    {index: 8, startIndex: 7, prevLastIndex: 6, lastIndex: 8, matched: 'g'},
    {index: 9, startIndex: 9, prevLastIndex: 8, lastIndex: 9, matched: 'h'},
    {index: 10, startIndex: 10, prevLastIndex: 9, lastIndex: 10, matched: 'i'},
  ]);
});
test('scan#4', () => {
  expect(
    [...scan(/xxx/, 'abc def ghi')].map(({index, 0: matched}) => ({
      index,
      matched,
    }))
  ).toEqual([]);
});
test('scan#5', () => {
  expect(
    [...scan(/xxx/g, 'abc def ghi')].map(({index, 0: matched}) => ({
      index,
      matched,
    }))
  ).toEqual([]);
});
test('scan#6', () => {
  const g = scan(/\w+/g, 'abc def ghi');
  const expected = [
    {index: 0, matched: 'abc'},
    {index: 4, matched: 'def'},
    {index: 8, matched: 'ghi'}
  ] as const;
  let i = 0;
  for (const {index, 0: matched} of g) {
    expect(index).toBe(expected[i].index);
    expect(matched).toBe(expected[i].matched);
    ++i;
  }
  expect(g.lastIndex).toBe(11);
  expect(g.index).toBeUndefined();
});
test('scan#7', () => {
  const g = scan(/\w+/g, 'abc def ghi');
  const expected = ['abc', 'def', 'ghi'] as const;
  for (const {index} of g) {
    if (index > 3) {
      break;
    }
  }
  expect(g.lastIndex).toBe(7);
  expect(g.index).toBe(4);
});
test('replace#1', () => {
  const target = 'abc def ghi';
  const re = /\w+/;
  const replaceValue = (match: string) => match.toUpperCase();
  expect(replace(target, re, ({0: match}) => replaceValue(match))).toBe(
    target.replace(re, match => replaceValue(match))
  );
});
test('replace#2', () => {
  const target = 'abc def ghi';
  const re = /\w+/g;
  const replaceValue = (match: string) => match.toUpperCase();
  expect(replace(target, re, ({0: match}) => replaceValue(match))).toBe(
    target.replace(re, match => replaceValue(match))
  );
});
test('replace#3', () => {
  const target = 'abc def ghi';
  const re = /^/g;
  const replaceValue = () => ':::';
  expect(replace(target, re, () => replaceValue())).toBe(
    target.replace(re, () => replaceValue())
  );
});
test('replace#4', () => {
  const target = 'abc def ghi';
  const re = /\b/g;
  const replaceValue = () => ':::';
  expect(replace(target, re, () => replaceValue())).toBe(
    target.replace(re, () => replaceValue())
  );
});
test('replace#5', () => {
  const target = 'abc def ghi';
  const re = /$/g;
  const replaceValue = () => ':::';
  expect(replace(target, re, () => replaceValue())).toBe(
    target.replace(re, () => replaceValue())
  );
});
test('replace#6', () => {
  const target = 'abc def ghi';
  const re = /^|\b|$/g;
  const replaceValue = () => ':::';
  expect(replace(target, re, () => replaceValue())).toBe(
    target.replace(re, () => replaceValue())
  );
});
test('replace#7', () => {
  const target = 'abc def ghi';
  const re = /(?=\w+)/g;
  let count = 1;
  const replaceValue = () => '' + count++;
  expect(replace(target, re, () => replaceValue())).toBe(
    (count = 1) && target.replace(re, () => replaceValue())
  );
});
test('replace#8', () => {
  const target = 'abc def ghi';
  const re = /xxx/g;
  const replaceValue = () => ':::';
  expect(replace(target, re, () => replaceValue())).toBe(
    target.replace(re, () => replaceValue())
  );
});
test('split#1', () => {
  const target = 'abc def ghi';
  const re = /\w+/;
  expect(split(target, re)).toEqual(target.split(re));
});
test('split#2', () => {
  const target = 'abc def ghi';
  const re = /\w+/g;
  expect(split(target, re)).toEqual(target.split(re));
});
test('split#3', () => {
  const target = 'abc def ghi';
  const re = /^/g;
  expect(split(target, re)).toEqual(target.split(re));
});
test('split#4', () => {
  const target = 'abc def ghi';
  const re = /\b/g;
  expect(split(target, re)).toEqual(target.split(re));
});
test('split#5', () => {
  const target = 'abc def ghi';
  const re = /$/g;
  expect(split(target, re)).toEqual(target.split(re));
});
test('split#6', () => {
  const target = 'abc def ghi';
  const re = /^|\b|$/g;
  expect(split(target, re)).toEqual(target.split(re));
});
test('split#7', () => {
  const target = 'abc def ghi';
  const re = /(?=(\w+))/g;
  expect(split(target, re)).toEqual(target.split(re));
});
test('split#8', () => {
  const target = 'abc def ghi';
  const re = /xxx/g;
  expect(split(target, re)).toEqual(target.split(re));
});
test('split#limit-1', () => {
  expect(split('abc def ghi', /\s+/g, 2)).toEqual(['abc', 'def ghi'])
});
test('split#limit-2', () => {
  expect(split('abcde', /(?=\w)/g, 3)).toEqual(['a','b','cde'])
})
test('split#limit-3', () => {
  expect(split('abcde', /(?=(\w))/g, 3)).toEqual(['a','b','b','c','cde'])
})
test('split#limit-4', () => {
  expect(split('abcde', /(?=(\w))/g, 1)).toEqual(['abcde'])
})
