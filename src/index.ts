import * as gatsby from 'gatsby'
import { createNodeHelpers } from 'gatsby-node-helpers'
import axios from 'axios'
import { plural } from 'pluralize'
import { paramCase } from 'param-case'
import { pascalCase } from 'pascal-case'

import authentication from './authentication'
import fetchContentTypes from './fetch/contentTypes'
import fetchTypeData from './fetch/typeData'
import fetchComponents from './fetch/components'
import { PluginOptions, StrapiContentType, StrapiPluginContext } from './types'
import createFields from './createFields'
import extractRemoteNodes from './extractRemoteNodes'
import defaultSchemas from './defaultSchemas'

export const sourceNodes: gatsby.GatsbyNode['sourceNodes'] = async (
  {
    store,
    actions,
    cache,
    reporter,
    getNode,
    getNodes,
    createNodeId,
    createContentDigest,
    schema
  },
  {
    apiURL = 'http://localhost:1337',
    loginData = {},
    queryLimit = 100,
    collectionTypes = [],
    singleTypes = []
  }: PluginOptions
) => {
  const client = axios.create({
    baseURL: apiURL,
    timeout: 10000,
    params: {
      _limit: queryLimit
    }
  })

  const ctx: StrapiPluginContext = {
    reporter,
    schema,
    apiURL,
    store,
    cache,
    createNodeId,
    getNode,
    actions
  }

  const activities = {
    authentication: reporter.activityTimer('Strapi - Authentication API call'),
    fetchingRequired: reporter.activityTimer('Strapi - Required Api Calls'),
    fetchingData: reporter.activityTimer('Strapi - Data fetch'),
    schemaModification: reporter.activityTimer('Strapi - Schema modification'),
    nodesCreation: reporter.activityTimer('Strapi - Node creation')
  }

  activities.authentication.start()

  const token =
    loginData.identifier &&
    loginData.identifier.length !== 0 &&
    loginData.password &&
    loginData.password.length !== 0
      ? await authentication(client, loginData, ctx)
      : null

  if (token) {
    client.defaults.headers.Authorization = `Bearer ${token}`
  }

  activities.authentication.end()

  activities.fetchingRequired.start()

  const strapiTypes = await fetchContentTypes(client, ctx)
  if (strapiTypes === null) return
  const strapiComponents = await fetchComponents(client, ctx)

  activities.fetchingRequired.end()

  activities.fetchingData.start()

  const singles = singleTypes.map((single) => {
    if (typeof single === 'object') {
      return {
        name: single.name,
        endpoint: single.endpoint || paramCase(single.name),
        api: single.api
      }
    }
    return { name: single, endpoint: paramCase(single) }
  })

  const collections = collectionTypes.map((collection) => {
    if (typeof collection === 'object') {
      return {
        name: collection.name,
        endpoint: collection.endpoint || paramCase(plural(collection.name)),
        api: collection.api
      }
    }
    return { name: collection, endpoint: paramCase(plural(collection)) }
  })

  const types = [...singles, ...collections]

  const entities = await Promise.all(
    types.map((type) => fetchTypeData(client, type, ctx))
  )

  const newNodes: Array<any> = []
  const typesToCreate: Array<gatsby.GatsbyGraphQLType> = []

  const existingNodes = getNodes().filter(
    (node) => node.internal.owner === 'gatsby-source-strapi-schema'
  )
  existingNodes.forEach((node) => actions.touchNode(node))

  activities.fetchingData.end()

  activities.nodesCreation.start()

  const defaultTypes = defaultSchemas(ctx)

  typesToCreate.push(...defaultTypes)

  strapiComponents.forEach((component: StrapiContentType) => {
    const { fields, productTypes } = createFields(
      component,
      ctx,
      `StrapiComponent${pascalCase(component.uid)}`
    )
    typesToCreate.push(...productTypes)
    typesToCreate.push(
      schema.buildObjectType({
        name: `StrapiComponent${pascalCase(component.uid)}`,
        fields,
        description: component.info.description
          ? component.info.description
          : null
      })
    )
  })

  types.forEach(async ({ name }, i) => {
    const nodes = entities[i]

    const type: StrapiContentType = strapiTypes.find(
      (type) => type.apiID === paramCase(name)
    ) as StrapiContentType

    const { fields, productTypes } = createFields(
      type,
      ctx,
      `Strapi${pascalCase(name)}`
    )
    typesToCreate.push(...productTypes)

    typesToCreate.push(
      schema.buildObjectType({
        name: `Strapi${pascalCase(name)}`,
        description: type.info.description ? type.info.description : null,
        fields,
        interfaces: ['Node']
      })
    )
    const { createNodeFactory } = createNodeHelpers({
      typePrefix: 'Strapi',
      createNodeId,
      createContentDigest
    })
    const currentCreator = createNodeFactory(pascalCase(name))

    nodes!.forEach(async (nodeToCreate) => {
      await extractRemoteNodes(nodeToCreate, ctx)

      const nodeReady = currentCreator(nodeToCreate)

      newNodes.push(nodeReady)

      actions.createNode(nodeReady)
    })
  })

  actions.createTypes(typesToCreate)

  const diff = existingNodes.filter((existingNode) => {
    return !newNodes.some((newNode) => newNode.id === existingNode.id)
  })

  diff.forEach((node) => actions.deleteNode(getNode(node.id)))

  activities.nodesCreation.end()
}
