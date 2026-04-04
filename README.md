# Okerr

A small, type-safe **Result** type for TypeScript: every outcome is either success (`ok`) or failure (`err`), so callers handle both paths explicitly instead of relying only on exceptions.

Highly inspired by [better-result](https://github.com/dmmulroy/better-result) and [Effect](https://effect.website/).

## Install

---

## The `Result` shape

A `Result<T, E>` is a discriminated union:

- Success: `{ ok: true, value: T }`
- Failure: `{ ok: false, error: E }`

Branch on `result.ok` (or use `isOk` / `isErr` / `match`) so TypeScript narrows `value` or `error` correctly.

## Quick start

```ts
import { err, fn, isOk, match, ok, orElse, value } from 'okerr';

function parsePositive(s: string): Result<number, string> {
	const n = Number(s);
	if (!Number.isFinite(n) || n <= 0) {
		return err('expected a positive number');
	}
	return ok(n);
}

const r = parsePositive('42');

if (isOk(r)) {
	console.log(r.value); // number
} else {
	console.error(r.error); // string
}

// Or collapse to one expression:
const doubled = match(r, {
	ok: (n) => n * 2,
	err: () => 0,
});
```

## API

### `ok(value)` / `err(error)`

Construct a success or error result. Payloads may be any type, including `undefined` or `null`.

```ts
ok(1); // Result<number, never>
err('nope'); // Result<never, string>
```

### `isOk(result)` / `isErr(result)`

Type guards for narrowing. Prefer these or `match` when you want exhaustive handling.

### `value(result)`

Returns the success value, or **throws** the stored error if the result is `err`. Use when failure should propagate as an exception.

### `orElse(resultOrPromise, defaultValue)`

Returns the success value, or `defaultValue` if the result is an error. Accepts either a `Result` or a `Promise<Result>` and always returns a `Promise` of the success type.

```ts
await orElse(ok(1), 0); // 1
await orElse(err('x'), 0); // 0
await orElse(Promise.resolve(ok(2)), 0); // 2
```

### `match(result, { ok, err })`

Runs exactly one arm and returns a single type `R`. Both callbacks are required, which keeps handling complete and helps inference.

```ts
const out = match(ok(42), {
	ok: (n) => n * 2,
	err: () => 0,
}); // 84
```

### `fn(inner)`

Wraps a synchronous or async function so it **never throws**: successes become `ok(...)`, and failures become `err(Error)`. Non-`Error` throws are normalized to `Error` (message from `JSON.stringify` when possible).

The returned function is **async** and has the type `ResultFn<Args, T, Error>` (see `ResultFn` in the package typings).

```ts
const divide = fn((a: number, b: number) => {
	if (b === 0) throw new Error('division by zero');
	return a / b;
});

const r = await divide(10, 2);
// { ok: true, value: 5 }

const bad = await divide(10, 0);
// { ok: false, error: Error }

const message = match(bad, {
	ok: () => 'ok',
	err: (e) => e.message,
});
```

### Types

- **`Result<T, E>`** — success or failure union.
- **`ResultFn<A, T, E>`** — function from arguments `A` to `Promise<Result<T, E>>`.

## Patterns

**Composable pipeline with `fn` + `match`:**

```ts
const parse = fn((s: string) => {
	const n = Number(s);
	if (Number.isNaN(n)) throw new Error('not a number');
	return n;
});

const first = await parse('12');
const doubled = match(first, {
	ok: (n) => n * 2,
	err: () => 0,
});
```

**Interop with code that throws:** wrap boundaries with `fn`, keep the rest of your code on `Result` + `match` / guards.

## License

[MIT](https://github.com/rodrigosdev/okerr?tab=MIT-1-ov-file)
