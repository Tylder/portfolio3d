import {Observable} from 'rxjs';
import {Nullable} from '@babylonjs/core';

/* https://netbasal.com/creating-custom-operators-in-rxjs-32f052d69457 */

/* Filter on undefined and null */
export function filterNil<T>() {
  // tslint:disable-next-line:only-arrow-functions
  return function(source: Observable<Nullable<T>>): Observable<T> {
    return new Observable(subscriber => {
      source.subscribe({
        next(value) {
          if (value !== undefined && value !== null) {
            subscriber.next(value);
          }
        },
        error(error) {
          subscriber.error(error);
        },
        complete() {
          subscriber.complete();
        }
      });
    });
  };
}

/* Filter on null */
export function filterNull<T>() {
  // tslint:disable-next-line:only-arrow-functions
  return function(source: Observable<Nullable<T>>): Observable<T> {
    return new Observable(subscriber => {
      source.subscribe({
        next(value) {
          if (value !== null) {
            subscriber.next(value);
          }
        },
        error(error) {
          subscriber.error(error);
        },
        complete() {
          subscriber.complete();
        }
      });
    });
  };
}

/* Filter on undefined */
export function filterUndefined<T>() {
  // tslint:disable-next-line:only-arrow-functions
  return function(source: Observable<T | undefined>): Observable<T> {
    return new Observable(subscriber => {
      source.subscribe({
        next(value) {
          if (value !== undefined) {
            subscriber.next(value);
          }
        },
        error(error) {
          subscriber.error(error);
        },
        complete() {
          subscriber.complete();
        }
      });
    });
  };
}


/* Filter on undefined and null */
export function filterNotNil<T>() {
  // tslint:disable-next-line:only-arrow-functions
  return function(source: Observable<T>): Observable<T> {
    return new Observable(subscriber => {
      source.subscribe({
        next(value) {
          if (value === undefined || value === null) {
            subscriber.next(value);
          }
        },
        error(error) {
          subscriber.error(error);
        },
        complete() {
          subscriber.complete();
        }
      });
    });
  };
}
