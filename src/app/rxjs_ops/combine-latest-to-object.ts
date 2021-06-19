import {combineLatest, noop, Observable} from 'rxjs';
import {debounceTime, map, shareReplay, startWith, tap} from 'rxjs/operators';

export interface OperatorDict<X> {
  [key: string]: Observable<X> | [Observable<X>, X];
}

/**
 * Extracts the type `T` of an `Observable<T>`
 */
export type ExtractObservableType<A> = A extends Observable<infer B> ? B : never;

export interface ICombineLatestOptions {
  /**
   * Debounce the emitted value from combineLatest (with
   * debounceTime(0))
   *
   * @default true
   */
  debounce?: boolean;

  /**
   * Initialize every observable with null. Does not override any
   * startWith value set in the original input object.
   *
   * @default false
   */
  startWithNull?: boolean;

  /**
   * Logs the state on every new emission
   *
   * @default false
   */
  logState?: boolean;

  /**
   * Share replays the whole thing.
   *
   * @default true
   */
  shareReplay?: boolean;
}

const nop = <T>() => tap<T>(noop);

/**
 * Takes a key/value object of observables or tuples:
 *
 * ```
 * {
 *  obs1: of(123),
 *  obs2: [of("value").pipe(delay(1000)), "startWith value"],
 * }
 * ```
 *
 * and every time one of the source observables emits, emits an object
 * with the latest value from all observables:
 *
 * ```
 * {
 *  obs1: 123,
 *  obs2: "startWith value",
 * }
 * ```
 * @param observables
 * @param debounce
 * @param startWithNull
 * @param logState
 * @param doShareReplay
 */
export const combineLatestToObject = <
  TIn extends OperatorDict<any>,
  TOut extends { [K in keyof TIn]: ExtractObservableType<TIn[K] extends Array<any> ? TIn[K][0] : TIn[K]> }
  >(
  observables: TIn,
  {
    debounce = true,
    startWithNull = false,
    logState = false,
    shareReplay: doShareReplay = true,
  } = {} as ICombineLatestOptions,
): Observable<TOut> => {
  const keys = Object.keys(observables);

  return combineLatest(
    keys.map(k => {
      const obs = observables[k];

      return Array.isArray(obs)
        ? obs[0].pipe(startWith(obs[1]))
        : obs.pipe(startWithNull ? startWith(null) : nop());
    }),
  ).pipe(
    debounce ? debounceTime(0) : nop(),
    map(b => b.reduce((acc, val, i) => ({ ...acc, [keys[i]]: val }), {})),
    logState ? tap(state => console.log({ state })) : nop(),

    // keep this at the end
    doShareReplay ? shareReplay({ refCount: true, bufferSize: 1 }) : nop(),
  );
};
