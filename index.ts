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
