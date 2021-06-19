import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';

/**
 * Called after combineLatest in order to combine the array that combineLatest returns into a key: value object.
 * Each observable given to combineLatest must return
 */
export function combine2() {
  // tslint:disable-next-line:only-arrow-functions
  return function(source: Observable<Array<Map<string, any>>>): Observable<any> {
    return new Observable(subscriber => {
      source.subscribe({
        next(datas) {
          const datasMap = {};

          datas.forEach((collection) => {
            for (const [key, value] of Object.entries(collection)) {
              datasMap[key] = value;
            }
          });
          subscriber.next(datasMap);
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

/* https://fireship.io/lessons/custom-rxjs-operators-by-example/ */
/**
 * Called after combineLatest in order to combine the array that combineLatest returns into a key: value object.
 * Each observable given to combineLatest must return
 */
export function combine() {
  return map((datas: Array<any>) => {
    const datasMap = {};

    datas.forEach((collection) => {

      for (const [key, value] of Object.entries(collection)) {
        datasMap[key] = value;
      }
    });
    return datasMap;
  });
}
