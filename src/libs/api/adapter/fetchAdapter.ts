import {createAPIAdapter} from "../apiForge.ts"

export class HttpError extends Error {
  constructor(public status:number, public statusText:string, public body:unknown) {
    super(`HTTP Error ${status}: ${statusText} ${JSON.stringify(body)}`)
  }
}

export const fetchAdapter = () => createAPIAdapter(async (config, method, url, data) => {

  // bodyParser
  let body = null
  if (data) {
    if (config.headers["Content-Type"] === "multipart/form-data") {
      body = new FormData()
      for (const key in data) {
        body.append(key, data[key])
      }
    }
    else {
      body = JSON.stringify(data)
    }
  }

  // Timeout 처리
  const abortController = new AbortController()
  const timeoutId = config.timeout > 0 ? setTimeout(() => abortController.abort(), config.timeout) : null

  try {
    const request = {

      // @TODO: extra config!!

      // ...config.fetchOptions,
      method,
      headers: {...config.headers},
      signal: abortController.signal,
      body,
    }

    const response = await fetch(url, request)
    clearTimeout(timeoutId)

    // response 자동추론
    let responseData

    const contentType = response.headers.get("Content-Type")
    if (contentType && contentType.includes("application/json")) {
      responseData = await response.json()
    }
    else {
      responseData = await response.text()
    }

    if (!response.ok) {
      throw new HttpError(response.status, response.statusText, responseData)
    }

    // @FIXME: 로깅 추가
    console.log(`API Call: ${method} ${url} - Status: ${response.status}`)

    return {
      ...response,
      data: responseData,
      config: config,
      request: {url, ...request}
    }
  }
  catch (error) {
    clearTimeout(timeoutId)
    if (error.name === "AbortError") {
      throw new Error("Request timed out")
    }
    else {
      throw error
    }
  }
})