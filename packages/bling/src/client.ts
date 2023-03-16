import {
  mergeRequestInits,
  mergeFetchOpts,
  parseResponse,
  payloadRequestInit,
  resolveRequestHref,
  XBlingOrigin,
  XBlingResponseTypeHeader,
} from './utils/utils'

import type {
  AnyFetchFn,
  Serializer,
  FetcherFn,
  FetcherMethods,
  FetchFnReturn,
  FetchFnCtxOptions,
  FetchFnCtx,
  CreateSplitFn,
  CreateSecretFn,
  CreateImportFn,
  FetchFnCtxWithRequest,
} from './types'

export * from './utils/utils'

//

let serializers: Serializer[] = []

export function addSerializer({ apply, serialize }: Serializer) {
  serializers.push({ apply, serialize })
}

export type CreateClientFetcherFn = <T extends AnyFetchFn>(
  fn: T,
  opts?: FetchFnCtxWithRequest,
) => ClientFetcher<T>

export type CreateClientFetcherMethods = {
  createFetcher(
    route: string,
    defualtOpts: FetchFnCtxOptions,
  ): ClientFetcher<any>
}

export type ClientFetcher<T extends AnyFetchFn> = FetcherFn<T> &
  FetcherMethods<T>

export type ClientFetcherMethods<T extends AnyFetchFn> = FetcherMethods<T> & {
  fetch: (
    init: RequestInit,
    opts?: FetchFnCtxOptions,
  ) => Promise<Awaited<FetchFnReturn<T>>>
}

export type ClientFetchFn = CreateClientFetcherFn & CreateClientFetcherMethods

const fetchImpl = (() => {
  throw new Error('Should be compiled away')
}) as any

const fetchMethods: CreateClientFetcherMethods = {
  createFetcher: (pathname: string, defaultOpts?: FetchFnCtxOptions) => {
    const fetcherImpl = async (payload: any = {}, opts?: FetchFnCtxOptions) => {
      const method = opts?.method || defaultOpts?.method || 'POST'

      const baseInit: RequestInit = {
        method,
        headers: {
          [XBlingOrigin]: 'client',
        },
      }

      let payloadInit = payloadRequestInit(payload, serializers)

      const resolvedHref = resolveRequestHref(pathname, method, payloadInit)

      const requestInit = mergeRequestInits(
        baseInit,
        payloadInit,
        defaultOpts?.request,
        opts?.request,
      )
      const request = new Request(resolvedHref, requestInit)

      const response = await fetch(request)

      // // throws response, error, form error, json object, string
      if (response.headers.get(XBlingResponseTypeHeader) === 'throw') {
        throw await parseResponse(response)
      } else {
        return await parseResponse(response)
      }
    }

    const fetcherMethods: ClientFetcherMethods<any> = {
      url: pathname,
      fetch: (request: RequestInit, opts?: FetchFnCtxOptions) => {
        return fetcherImpl({}, mergeFetchOpts({ request }, opts) as any)
      },
    }

    return Object.assign(fetcherImpl, fetcherMethods) as ClientFetcher<any>
  },
}

export const fetch$: ClientFetchFn = Object.assign(fetchImpl, fetchMethods)
export const server$: ClientFetchFn = fetch$

const preloaded = JSON.parse(
  document.getElementById('preloaded')?.innerHTML ?? 'null',
)
export const preload$ = (key: string) => {
  return preloaded[key as any]
}
export const getPreloaded = () => null

export const split$: CreateSplitFn = (_fn) => {
  throw new Error('Should be compiled away')
}

export const import$: CreateImportFn = (_fn) => {
  throw new Error('Should be compiled away')
}

export const lazy$: CreateSplitFn = (_fn) => {
  throw new Error('Should be compiled away')
}

export const secret$: CreateSecretFn = (_value) => {
  throw new Error('Should be compiled away')
}
