/**
 * A type representing a `Result` that is either successful or an error.
 *
 * @typeParam T - The type of the value.
 * @typeParam E - The type of the error value.
 */
export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

/**
 * A type representing a function that returns a `Result`.
 *
 * @typeParam A - The type of the arguments.
 * @typeParam T - The type of the value.
 * @typeParam E - The type of the error value.
 */
export type ResultFn<A extends unknown[], T, E> = (
	...args: A
) => Promise<Result<T, E>>;

/**
 * A type representing a `Result` that is successful.
 *
 * @typeParam T - The type of the value.
 */
type OkResult<T> = { ok: true; value: T };

/**
 * A type representing a `Result` that is an error.
 *
 * @typeParam E - The type of the error value.
 */
type ErrResult<E> = { ok: false; error: E };

/**
 * Creates a {@link Result} that is successful.
 *
 * @param value - The value of the `Result`.
 * @returns A `Result` that is successful.
 */
export function ok<T>(value: T): Result<T, never> {
	return { ok: true, value };
}

/**
 * Creates a {@link Result} that is an error.
 *
 * @param error - The error value.
 * @returns A `Result` that is an error.
 */
export function err<E>(error: E): Result<never, E> {
	return { ok: false, error };
}

/**
 * Checks if a {@link Result} is successful.
 *
 * @param result - The `Result` to check.
 * @returns `true` if the `Result` is successful, `false` otherwise.
 */
export function isOk<T, E>(result: Result<T, E>): result is OkResult<T> {
	return result.ok;
}

/**
 * Checks if a {@link Result} is an error.
 *
 * @param result - The `Result` to check.
 * @returns `true` if the `Result` is an error, `false` otherwise.
 */
export function isErr<T, E>(result: Result<T, E>): result is ErrResult<E> {
	return !result.ok;
}

/**
 * Extracts the value from a {@link Result}.
 *
 * @param result - The `Result` to extract the value from.
 * @returns The value of the `Result`.
 * @throws The stored error value if the `Result` is not successful.
 */
export function value<T, E>(result: Result<T, E>): T {
	if (result.ok) return result.value;
	throw result.error;
}

/**
 * Extracts the success value from a {@link Result}, or returns a default when
 * the outcome is an error. If `p` is a promise, it is awaited first.
 *
 * @param p - A `Result` or a `Promise` that resolves to one.
 * @param d - The default value when the result is an error.
 * @returns A promise that resolves to the success value or to `d`.
 */
export async function orElse<V, E>(
	p: Promise<Result<V, E>> | Result<V, E>,
	d: V,
): Promise<V> {
	const result = await p;
	return result.ok ? result.value : d;
}

/**
 * Handles a {@link Result} by calling exactly one of two functions: `ok` when the
 * result is successful, or `err` when it is a failure. Both arms are required, so
 * every outcome is covered and TypeScript infers a single return type `R`.
 *
 * @param result - The `Result` to branch on.
 * @param arms - `ok` receives the success value; `err` receives the error value.
 * @returns The value returned by whichever arm runs.
 *
 * @example
 * ```ts
 * const out = match(ok(42), {
 *   ok: (n) => n * 2,
 *   err: () => 0,
 * });
 * // out === 84
 * ```
 */
export function match<T, E, R>(
	result: Result<T, E>,
	arms: { ok: (value: T) => R; err: (error: E) => R },
): R {
	return result.ok ? arms.ok(result.value) : arms.err(result.error);
}

/**
 * Converts any thrown value into an `Error` so wrapped functions always fail
 * with a consistent error type.
 *
 * @param err - The thrown value to normalize.
 * @returns An `Error` instance describing the failure.
 */
function normalizeError(err: unknown): Error {
	if (err instanceof Error) return err;
	try {
		return new Error(JSON.stringify(err) ?? String(err));
	} catch {
		return new Error(String(err));
	}
}

/**
 * Wraps a sync or async function so it resolves to a {@link Result} instead of
 * throwing. Successful returns become `ok(...)`, and thrown values become
 * `err(Error)`.
 *
 * @param inner - The function to wrap.
 * @returns An async function with the same arguments that never throws.
 */
export function fn<A extends unknown[], T>(
	inner: (...args: A) => T | Promise<T>,
): ResultFn<A, T, Error> {
	return async (...args: A) => {
		try {
			return { ok: true, value: await inner(...args) };
		} catch (e) {
			return { ok: false, error: normalizeError(e) };
		}
	};
}
