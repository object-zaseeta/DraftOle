export function characterDiff(expected: string, actual: string): string {
  if (expected === actual) {
    return '文字列は一致しています';
  }

  const expectedChars = [...expected];
  const actualChars = [...actual];
  const maxLength = Math.max(expectedChars.length, actualChars.length);

  let firstDiffIndex = -1;
  for (let i = 0; i < maxLength; i++) {
    const expChar = i < expectedChars.length ? expectedChars[i] : undefined;
    const actChar = i < actualChars.length ? actualChars[i] : undefined;
    if (expChar !== actChar) {
      firstDiffIndex = i;
      break;
    }
  }

  const result: string[] = [];
  result.push('文字単位での差分:');

  if (expectedChars.length === actualChars.length) {
    result.push('文字列の長さは同じです');
  } else {
    result.push(
      `文字列の長さが違います (Expected: ${expectedChars.length}, Actual: ${actualChars.length})`,
    );
  }

  if (firstDiffIndex !== -1) {
    result.push(`最初の違いは位置 ${firstDiffIndex} で発生:`);

    const contextRange = 8;
    const startIndex = Math.max(0, firstDiffIndex - contextRange);
    const endIndex = Math.min(maxLength, firstDiffIndex + contextRange);

    let expectedContext = '';
    let expectedPointer = '';
    for (let i = startIndex; i < endIndex; i++) {
      expectedContext += i < expectedChars.length ? expectedChars[i] : '∅';
      expectedPointer += i === firstDiffIndex ? '^' : ' ';
    }

    let actualContext = '';
    let actualPointer = '';
    for (let i = startIndex; i < endIndex; i++) {
      actualContext += i < actualChars.length ? actualChars[i] : '∅';
      actualPointer += i === firstDiffIndex ? '^' : ' ';
    }

    result.push('');
    result.push(`Expected: ...|${expectedContext}|...`);
    result.push(`          ...|${expectedPointer}|...`);
    result.push(`Actual:   ...|${actualContext}|...`);
    result.push(`          ...|${actualPointer}|...`);

    const expChar = firstDiffIndex < expectedChars.length ? expectedChars[firstDiffIndex] : '∅';
    const actChar = firstDiffIndex < actualChars.length ? actualChars[firstDiffIndex] : '∅';
    result.push('');
    result.push(`位置 ${firstDiffIndex}: Expected='${expChar}' vs Actual='${actChar}'`);
  }

  return result.join('\n');
}
