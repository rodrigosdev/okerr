import { expect, test } from 'bun:test';
import { err, fn, isErr, isOk, match, ok, orElse, value } from './index.ts';

test('ok creates success result shape', () => {
	expect(ok(1)).toEqual({ ok: true, value: 1 });
});

test('err creates error result shape', () => {
	expect(err('x')).toEqual({ ok: false, error: 'x' });
});

test('ok and err allow undefined and null payloads', () => {
	expect(ok(undefined)).toEqual({ ok: true, value: undefined });
	expect(err(null)).toEqual({ ok: false, error: null });
});

test('isOk and isErr are mutually exclusive', () => {
	const good = ok(1);
	expect(isOk(good)).toBe(true);
	expect(isErr(good)).toBe(false);

	const bad = err('e');
	expect(isOk(bad)).toBe(false);
	expect(isErr(bad)).toBe(true);
});

test('isOk narrows to value branch at runtime', () => {
	const r = ok(7);
	if (isOk(r)) {
		expect(r.value).toBe(7);
	} else {
		expect.unreachable();
	}
});

test('isErr narrows to error branch at runtime', () => {
	const r = err('nope');
	if (isErr(r)) {
		expect(r.error).toBe('nope');
	} else {
		expect.unreachable();
	}
});

test('value returns success payload', () => {
	expect(value(ok(42))).toBe(42);
});

test('value throws error payload when result is err', () => {
	expect(() => value(err('e'))).toThrow('e');
});

test('orElse returns success value for sync ok', async () => {
	await expect(orElse(ok(1), 0)).resolves.toBe(1);
});

test('orElse returns default for sync err', async () => {
	await expect(orElse(err('x'), 0)).resolves.toBe(0);
});

test('orElse unwraps promise and returns success value', async () => {
	await expect(orElse(Promise.resolve(ok(2)), 0)).resolves.toBe(2);
});

test('orElse unwraps promise and returns default on err', async () => {
	await expect(orElse(Promise.resolve(err('x')), 0)).resolves.toBe(0);
});

test('fn wraps sync success', async () => {
	const wrapped = fn((n: number) => n + 1);
	await expect(wrapped(1)).resolves.toEqual({ ok: true, value: 2 });
});

test('fn wraps sync throw Error', async () => {
	const wrapped = fn(() => {
		throw new Error('boom');
	});
	const out = await wrapped();
	expect(out).toEqual({ ok: false, error: expect.any(Error) });
	if (!out.ok) expect(out.error.message).toBe('boom');
});

test('fn normalizes thrown string to Error', async () => {
	const wrapped = fn(() => {
		throw 'stringy';
	});
	const out = await wrapped();
	expect(out).toEqual({ ok: false, error: expect.any(Error) });
	if (!out.ok) expect(out.error.message).toBe(JSON.stringify('stringy'));
});

test('fn normalizes thrown object to Error', async () => {
	const wrapped = fn(() => {
		throw { code: 1 };
	});
	const out = await wrapped();
	expect(out).toEqual({ ok: false, error: expect.any(Error) });
	if (!out.ok) expect(out.error.message).toBe(JSON.stringify({ code: 1 }));
});

test('fn wraps async resolution', async () => {
	const wrapped = fn(async (x: number) => x * 2);
	await expect(wrapped(3)).resolves.toEqual({ ok: true, value: 6 });
});

test('fn wraps async rejection', async () => {
	const wrapped = fn(async () => {
		throw new Error('async boom');
	});
	const out = await wrapped();
	expect(out).toEqual({ ok: false, error: expect.any(Error) });
	if (!out.ok) expect(out.error.message).toBe('async boom');
});

test('match on fn result handles sync success', async () => {
	const divide = fn((a: number, b: number) => {
		if (b === 0) throw new Error('div0');
		return a / b;
	});
	const out = match(await divide(10, 2), {
		ok: (v) => v,
		err: () => -1,
	});
	expect(out).toBe(5);
});

test('match on fn result handles sync throw', async () => {
	const divide = fn((a: number, b: number) => {
		if (b === 0) throw new Error('div0');
		return a / b;
	});
	const out = match(await divide(10, 0), {
		ok: () => 'ok',
		err: (e) => e.message,
	});
	expect(out).toBe('div0');
});

test('match on fn async result maps value and error to same type', async () => {
	const double = fn(async (x: number) => x * 2);
	const okOut = match(await double(4), {
		ok: (v) => `n=${v}`,
		err: (e) => `err=${e.message}`,
	});
	expect(okOut).toBe('n=8');

	const fail = fn(async () => {
		throw new Error('nope');
	});
	const errOut = match(await fail(), {
		ok: (v) => `n=${v}`,
		err: (e) => `err=${e.message}`,
	});
	expect(errOut).toBe('err=nope');
});

test('chained fn calls composed with match', async () => {
	const parse = fn((s: string) => {
		const n = Number(s);
		if (Number.isNaN(n)) throw new Error('nan');
		return n;
	});
	const first = await parse('12');
	const doubled = match(first, {
		ok: (n) => n * 2,
		err: () => 0,
	});
	expect(doubled).toBe(24);

	const second = await parse('x');
	const fallback = match(second, {
		ok: (n) => n,
		err: (e) => e.message.length,
	});
	expect(fallback).toBe(3);
});

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
