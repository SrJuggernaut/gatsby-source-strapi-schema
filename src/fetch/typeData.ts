import { AxiosInstance } from 'axios'
import { ObjectCollectionType, TypeEntry, StrapiPluginContext } from '../types'

export default async (
  client: AxiosInstance,
  collectionType: ObjectCollectionType,
  ctx: StrapiPluginContext
) => {
  const { reporter } = ctx
  const { endpoint, api, name } = collectionType
  const params = { ...client.defaults.params, ...api }
  reporter.verbose(
    `Starting to fetch data from Strapi - ${
      client.defaults.baseURL
    }/${endpoint} with params ${JSON.stringify(params)}`
  )
  try {
    const { data } = await client.get(`/${endpoint}`, { params })
    const entries = Array.isArray(data) ? data : [data]
    const cleanEntries = entries.map((entry) => {
      entry.strapiId = entry.id
      return cleanEntry(entry)
    })
    return cleanEntries
  } catch (error) {
    reporter.panic(`Failed to fetch data from Strapi: ${name}`, error)
  }
}

const cleanEntry = (entry: TypeEntry) => {
  const keys = Object.keys(entry)
  keys.forEach((key) => {
    const value = entry[key]
    if (key === '__v') {
      // Remove mongo's __v
      delete entry[key]
    } else if (key === '_id') {
      // Rename mongo's "_id" key to "id".
      delete entry[key]
      entry.id = value as string
    } else if (key.startsWith('__')) {
      // Gatsby reserves double-underscore prefixes – replace prefix with "strapi"
      delete entry[key]
      entry[`strapi_${key.slice(2)}`] = value
    } else if (value && typeof value === 'object') {
      entry[key] = cleanEntry(value)
    }
  })
  return entry
}
