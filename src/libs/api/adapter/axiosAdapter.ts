import axios from "axios"
import {createAPIAdapter} from "../apiForge.ts"

export const axiosAdapter = createAPIAdapter((config, method, url, data) => {
  return axios({
    url,
    method,
    data
  })
})