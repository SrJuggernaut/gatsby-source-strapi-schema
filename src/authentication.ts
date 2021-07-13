import { AxiosInstance } from 'axios'

import { LogInInfo, StrapiPluginContext } from './types'

export default async (
  client: AxiosInstance,
  loginData: LogInInfo,
  ctx: StrapiPluginContext
): Promise<string | null> => {
  const { reporter } = ctx
  reporter.verbose('Strapi - Starting Authentication')
  try {
    const { data } = await client.post('/auth/local', loginData)
    return data.jwt
  } catch (error) {
    reporter.panic('Strapi - authentication error: ' + error)
    return null
  }
}
