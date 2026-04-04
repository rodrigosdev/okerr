import { expect, test } from 'bun:test';
import { err, match, ok } from './index.ts';

test('match calls ok arm', () => {
	const r = ok(42);
	expect(match(r, { ok: (v) => v * 2, err: () => 0 })).toBe(84);
});

test('match calls err arm', () => {
	const r = err('fail');
	expect(match(r, { ok: () => 'ok', err: (e) => e })).toBe('fail');
});

test('match unifies return type from both arms', () => {
	const okResult = ok(1);
	const s: string = match(okResult, {
		ok: (v) => String(v),
		err: (e) => String(e),
	});
	expect(s).toBe('1');

	const errResult = err(2);
	const t: string = match(errResult, {
		ok: (v) => String(v),
		err: (e) => String(e),
	});
	expect(t).toBe('2');
});
