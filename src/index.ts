function unreachable(reason: string): never {
  throw new Error(`unreachable: ${reason}`);
}

type RegExpMatch = RegExpExecArray & {
  prevLastIndex: number;
  startIndex: number;
  lastIndex: number;
};

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
): Generator<RegExpMatch, void> & {index: number | undefined, lastIndex: number} {
  let lastIndex = 0;
  let index: number | undefined;
  const g = function* () {
    if (!re.global) {
      // globalが付いていないときは1回だけで終わり
      const match = re.exec(target);
      if (!match) {
        return;
      }
      index = match.index;
      lastIndex = match.index + match[0].length;
      yield Object.assign(match, {prevLastIndex: 0, startIndex: 0, lastIndex});
      return;
    }
    re.lastIndex = 0;
    let offset;
    while (re.lastIndex <= target.length) {
      const prevLastIndex = re.lastIndex;
      if (offset) re.lastIndex += offset;
      const startIndex = re.lastIndex;
      const match = re.exec(target);
      if (!match) {
        index = undefined;
        return;
      }
      index = match.index;
      lastIndex = re.lastIndex;
      yield Object.assign(match, {
        prevLastIndex,
        startIndex,
        lastIndex: re.lastIndex,
      });
      // 空文字列とマッチする場合、そのままだと無限ループになるので、1文字進める
      offset = match.index === re.lastIndex ? 1 : undefined;
    }
    unreachable('re.lastIndexはtarget.lengthより大きくならない');
  };
  return Object.defineProperties(g(), {
    lastIndex: {
      get() {
        return lastIndex;
      },
      set(value: number) {
        lastIndex = value;
      },
    },
    index: {
      get() {
        return index;
      }
    }
  });
}

// `String.prototype.replace`ではエラーのあった位置がわからないのでreplaceValueで引数にRegExpExecArrayを受け取るものを用意

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
  let replacing = '';
  const g = scan(re, target);
  for (const match of g) {
    // 前回の終端から今回のマッチの先頭までを追加
    replacing += target.slice(match.prevLastIndex, match.index);
    // 置換結果を追加
    replacing += replaceValue(match);
  }
  if (!g.lastIndex && !replacing) {
    // 置換がなければそのまま返す
    return target;
  }
  // 最後のマッチの終端から最後までを追加
  if (g.lastIndex < target.length) {
    replacing += target.slice(g.lastIndex);
  }
  return replacing;
}

// limitまでで分割を止めるsplit

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
  // limitが1のときは分割しない
  if (limit === 1) {
    return [target];
  }
  if (!re.global) {
    // globalでなかったらgを付けて作り直し
    re = new RegExp(re.source, re.flags + 'g');
  }
  const splitting: string[] = [];
  let count = 0;
  const g = scan(re, target);
  for (const match of g) {
    // 空文字列とマッチ
    if (match.index === match.lastIndex) {
      // 先頭で空文字列とマッチした場合はスキップ
      if (!match.index) {
        continue;
      }
      // 末尾で空文字列とマッチした場合は終了
      if (match.index >= target.length) {
        // 一つ前のマッチで終了したことにする
        g.lastIndex = match.prevLastIndex;
        break;
      }
    }
    // 前回の終端から今回のマッチの先頭まで、とマッチしたキャプチャすべてを配列に追加
    splitting.push(
      target.slice(match.prevLastIndex, match.index),
      ...match.slice(1)
    );
    ++count;
    // あと一つ追加するとlimitに到達するようなら分割を止める
    if (limit && count + 1 >= limit) {
      break;
    }
  }
  // 最後のマッチの終端から最後までを配列に追加
  splitting.push(target.slice(g.lastIndex));
  return splitting;
}
