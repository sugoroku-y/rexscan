# rexscan

Scanning text for regular expressions.

テキストを正規表現でスキャンします。

```ts
import * as fs from 'fs';
import {scan} from 'rexscan';

(async () => {
  const text = awit fs.promises.readFile('test.txt', 'utf8');
  for (const match of scan(/\w+/g, text)) {
    console.log(match.index, match[0]);
  }
})()
```

いちいち調べるのも面倒なので、以下の情報も`match`からアクセスできるようにしています。

- `prevLastIndex` : 前回の`exec`後の`lastIndex`。1回目のときは0。
- `startIndex` : 今回の`exec`前の`lastIndex`。
- `lastIndex` : 今回`exec`後の`lastIndex`。

また、最後に成功した`exec`後の`lastIndex`(通常ループを抜けるときに失敗するので`lastIndex`はリセットされる)も取得できるようにしています。

```ts
  let replacing = '';
  const g = scan(re, target);
  for (const match of g) {
    replacing += target.slice(match.prevLastIndex, match.index);
    replacing += replaceValue(match)
  }
  // g.lastIndexは最後に成功した`exec`後の`lastIndex`
  replacing += target.slice(g.lastIndex);
```

## API

```ts
/**
 * 文字列に正規表現を順次適用させて、マッチしなくなるまで繰り返します。
 *
 * マッチした結果はジェネレーターで順次返していきます。
 *
 * ただし、空文字列にマッチした場合、同じ位置から`exec`すると無限ループになるので、1文字進ませます。
 *
 * 最後に成功した`exec`後の`lastIndex`については、この関数の返値が持つ`lastIndex`プロパティで取得できます。
 * @param re 文字列に適用する正規表現。
 * @param target 正規表現を適用する文字列。
 * @yields {RegExpExecArray & {prevLastIndex: number;startIndex: number;lastIndex: number;}} `exec`に成功したときの結果(RegExpExecArray)。
 *
 * それに追加して、以下のプロパティを持つ。
 * - `prevLastIndex`: 前回のexec後のlastIndex。1回目のときは0。
 * - `startIndex`: 今回のexec前のlastIndex。
 * - `lastIndex`: 今回exec後のlastIndex。
 */
export function scan(
  re: RegExp,
  target: string
): Generator<RegExpMatch, void> & {lastIndex: number} {
```

`scan`を使った例として、Stringのメソッド二種を再実装してみました。

いずれもちょっとだけ仕様をかえてあります。

```ts
/**
 * 文字列の置換を行う。
 *
 * ex)
 * ```ts
 * const replaced = replace(/\w+/g, ({0: match, index}) => `${index}: ${match}`);
 * ```
 * @param {string} target 置換対象の文字列。
 * @param {RegExp} re 検索する正規表現。
 * @param {(match: RegExpMatch) => string} replaceValue 置換後の文字列を返す関数。
 * 引数にRegExpExecArrayを受け取り、置換後の文字列をかえす。
 * @returns {string} 置換後の文字列
 */
export function replace(
  target: string,
  re: RegExp,
  replaceValue: (match: RegExpMatch) => string
): string {
```

```ts
/**
 * 文字列を正規表現でマッチするパターンで分割する。
 * @param target 分割対象の文字列。
 * @param re 分割するパターン。
 * @param [limit] 分割数の最大値。ただし、正規表現でキャプチャされた文字列についてはカウントしない。
 * @returns {string[]} 分割結果の配列。
 * 正規表現でキャプチャされた文字列があればそれも含まれる。
 * limitが指定されていれば最大でその個数
 * (ただし、正規表現でキャプチャされた文字列についてはカウントしない)
 * になるように分割する。
 */
export function split(target: string, re: RegExp, limit?: number): string[] {
```
