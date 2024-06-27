/**
 * HTTP メソッド。
 */
export type HttpMethod =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'DELETE'
  | 'PATCH'
  | 'OPTIONS'
  | 'HEAD'
  | 'CONNECT'
  | 'TRACE';

/**
 * fetch の共通オプション。
 */
export interface FetchCoreOptions<ThrowError extends boolean>
  extends Omit<RequestInit, 'body'> {
  /**
   * レスポンスのパース方法。
   */
  parser?: 'json' | 'text';

  /**
   * エラーが発生した際、エラーをスローするかどうか。
   *
   * @default true
   */
  throwError?: ThrowError;

  /**
   * エラーが発生した際に実行されるコールバック関数。
   */
  onError?: (error: Response) => void;
}

/**
 * Query 専用の fetch オプション
 */
export interface QueryOptions<ThrowError extends boolean>
  extends FetchCoreOptions<ThrowError> {
  method?: Extract<HttpMethod, 'GET' | 'OPTIONS' | 'HEAD'>;
  query?: Record<string, string> | string;
}

/**
 * Mutate 専用の fetch オプション
 */
export interface MutateOptions<ThrowError extends boolean>
  extends FetchCoreOptions<ThrowError> {
  method: Exclude<HttpMethod, FetchCoreOptions<boolean>['method']>;
  query?: Record<string, string> | string;
  body?: Record<string, any> | string;
}

/**
 * fetch オプション
 */
export type FetchOptions<
  Method extends HttpMethod,
  ThrowError extends boolean
> = Method extends MutateOptions<boolean>['method']
  ? MutateOptions<ThrowError>
  : QueryOptions<ThrowError>;

/**
 * fetch を簡単に扱いやすくする関数。
 *
 * @example
 * ```ts
 *  try {
 *    const data = await $fetch('https://example.com/api/data');
 *  }
 * ```
 *
 * @example
 * ```ts
 *  try {
 *    const data = await $fetch('https://example.com/api/data', {
 *      query: { limit: '8', offset: '0' },
 *    });
 *  }
 * ```
 *
 * @example
 * ```ts
 *  try {
 *    const data = await $fetch('https://example.com/api/data', {
 *      method: 'POST',
 *      body: { key: 'value' },
 *    });
 *  }
 * ```
 *
 * @example
 * ```ts
 *  const data = await $fetch('https://example.com/api/data', {
 *    method: 'POST',
 *    body: { key: 'value' },
 *    throwError: false,
 *  });
 *
 *  if (!data) {
 *    // Error handling
 *  }
 * ```
 */
export async function $fetch<
  ThrowError extends boolean = true,
  Method extends HttpMethod = HttpMethod
>(url: string, options: FetchOptions<Method, ThrowError> = {} as any) {
  // URL にクエリを追加
  const fetchUrl = options.query
    ? typeof options.query === 'string'
      ? `${url}?${options.query}`
      : `${url}?${new URLSearchParams(options.query)}`
    : url;

  // オプションをシャローコピー
  const fetchOptions = { ...options } as RequestInit;

  // String 以外の body がある場合は string に変換
  if (fetchOptions.body && typeof fetchOptions.body !== 'string') {
    fetchOptions.body = JSON.stringify(fetchOptions.body);
  }

  // Request を送信
  const response = await fetch(fetchUrl, fetchOptions);

  // レスポンスがエラーの場合はエラー処理へ移行する
  if (!response.ok) {
    if (options.onError) options.onError(response);
    if (options.throwError !== false) throw response;
    else return void 0;
  }

  // レスポンスをパースして値を返却する
  return options.parser === 'text' ? response.text() : response.json();
}
