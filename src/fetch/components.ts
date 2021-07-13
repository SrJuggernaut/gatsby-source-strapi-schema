import { AxiosInstance } from 'axios'
import { StrapiPluginContext } from '../types'

export default async (client: AxiosInstance, ctx: StrapiPluginContext) => {
  const { reporter } = ctx
  reporter.verbose('Strapi - fetching components')
  try {
    const {
      data: { data }
    } = await client.get('/content-manager/components')
    return data
  } catch (error) {
    reporter.panic('Strapi - fetching Components error: ' + error)
  }
}
