export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

type OkResult<T> = { ok: true; value: T };
type ErrResult<E> = { ok: false; error: E };

export function ok<T>(value: T): Result<T, never> {
	return { ok: true, value };
}

export function err<E>(error: E): Result<never, E> {
	return { ok: false, error };
}

export function isOk<T, E>(result: Result<T, E>): result is OkResult<T> {
	return result.ok;
}

export function isErr<T, E>(result: Result<T, E>): result is ErrResult<E> {
	return !result.ok;
}

export function value<T, E>(result: Result<T, E>): T {
	if (result.ok) return result.value;
	throw result.error;
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
