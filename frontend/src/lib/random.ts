const _buf = new Uint32Array(1);

export function rand(): number {
  crypto.getRandomValues(_buf);
  return _buf[0] / 0x100000000;
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
