import { TypeEntry, StrapiPluginContext } from './types'
import { createRemoteFileNode } from 'gatsby-source-filesystem'

const extractRemoteNodes = async (
  node: TypeEntry,
  ctx: StrapiPluginContext
) => {
  const { cache, actions, getNode, apiURL, store, createNodeId, reporter } = ctx
  const { touchNode, createNode } = actions
  const nodeAttributes = Object.keys(node)
  nodeAttributes.forEach(async (attr) => {
    if (node[attr] && typeof node[attr] === 'object' && node[attr] !== null) {
      if (Array.isArray(node[attr])) {
        node[attr].forEach(async (n: TypeEntry) => {
          await extractRemoteNodes(n, ctx)
        })
        return
      }
      if (node[attr].mime) {
        const remote = node[attr]

        let fileNodeID

        const mediaDataCacheKey = `strapi-media-${remote.id}`
        const cacheMedia = await cache.get(mediaDataCacheKey)
        const lastUpdate = remote.updatedAt || remote.updated_at
        if (cacheMedia && lastUpdate === cacheMedia.updatedAt) {
          fileNodeID = cacheMedia.fileNodeID
          touchNode(getNode(fileNodeID))
        }
        if (!fileNodeID) {
          const sourceUrl = `${remote.url.startsWith('http') ? '' : apiURL}${
            remote.url
          }`
          const fileNode = await createRemoteFileNode({
            url: sourceUrl,
            store,
            cache,
            createNode,
            createNodeId,
            reporter
          })
          if (fileNode) {
            fileNodeID = fileNode.id

            await cache.set(mediaDataCacheKey, {
              fileNodeID,
              updatedAt: lastUpdate
            })
          }
        }
        if (fileNodeID) {
          remote.localFile = fileNodeID
        }
      }
      await extractRemoteNodes(node[attr], ctx)
    }
  })
}

export default extractRemoteNodes
