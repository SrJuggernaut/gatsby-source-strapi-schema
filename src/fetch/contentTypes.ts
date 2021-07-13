import { AxiosInstance } from 'axios'
import { StrapiContentType, StrapiPluginContext } from '../types'

export default async (
  client: AxiosInstance,
  ctx: StrapiPluginContext
): Promise<Array<StrapiContentType> | null> => {
  const { reporter } = ctx
  reporter.verbose('Strapi - fetching content types')
  try {
    const { data } = await client.get('/content-manager/content-types')
    return data.data
  } catch (error) {
    reporter.panic('Strapi - fetching Content Types error: ' + error)
    return null
  }
}
