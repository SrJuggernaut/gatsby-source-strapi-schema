import * as gatsby from 'gatsby'
import { SourceNodesArgs } from 'gatsby'

export interface LogInInfo {
  identifier?: string
  password?: string
}

export interface ObjectCollectionType {
  name: string
  endpoint: string
  api?: any
}

export interface PluginOptions extends gatsby.PluginOptions {
  apiURL: string
  loginData: LogInInfo
  queryLimit: number
  collectionTypes: Array<string | ObjectCollectionType>
  singleTypes: Array<string | ObjectCollectionType>
}

export interface TypeEntry {
  id: string
  [key: string]: string | TypeEntry | any
}

export interface StrapiPluginContext {
  apiURL: string
  reporter: SourceNodesArgs['reporter']
  schema: SourceNodesArgs['schema']
  store: SourceNodesArgs['store']
  cache: SourceNodesArgs['cache']
  createNodeId: SourceNodesArgs['createNodeId']
  getNode: SourceNodesArgs['getNode']
  actions: SourceNodesArgs['actions']
}
export interface StrapiContentType {
  uid: string
  isDisplayed: boolean
  apiID: string
  kind?: string
  category?: string
  info: {
    name: string
    description?: string
    icon?: string
    label: string
  }
  options: {
    increments?: boolean
    timestamps: Array<String> | false
    draftAndPublish?: boolean
  }
  pluginOptions?: any
  attributes: {
    [key: string]: {
      type: string
      required?: boolean
      multiple?: boolean
      allowedTypes?: Array<string>
      default?: any
      minLength?: number
      maxLength?: number
      configurable?: boolean
      model?: string
      plugin?: string
      targetModel?: string
      relationType?: string
      collection?: string
      via?: string
      attribute?: string
      column?: string
      isVirtual?: boolean
      unique?: boolean
      dominant?: boolean
      private?: boolean
      repeatable?: boolean
      component?: string
      components?: Array<string>
      [key: string]: any
    }
  }
}
