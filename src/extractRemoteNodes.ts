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
        // using field on the cache key for multiple image field
        const mediaDataCacheKey = `strapi-remote-${remote.id}`
        const cacheMedia = await cache.get(mediaDataCacheKey)
        // If we have cached media data and it wasn't modified, reuse
        // previously created file node to not try to redownload
        const lastUpdate = remote.updatedAt || remote.updated_at

        if (cacheMedia && lastUpdate === cacheMedia.updatedAt) {
          const currentNode = getNode(cacheMedia.fileNodeID)
          if (currentNode) {
            fileNodeID = cacheMedia.fileNodeID
          }
          touchNode(currentNode)
        }

        // If we don't have cached data, download the file
        if (!fileNodeID) {
          // full media url
          const sourceUrl = remote.url.startsWith('http')
            ? remote.url
            : `${apiURL}${remote.url}`
          try {
            const fileNode = await createRemoteFileNode({
              url: sourceUrl,
              store,
              cache,
              createNode,
              createNodeId,
              reporter
            })
            fileNodeID = fileNode.id
            await cache.set(mediaDataCacheKey, {
              fileNodeID,
              updatedAt: lastUpdate
            })
          } catch (error) {
            reporter.error('Error on remote node', error)
          }
        }
        remote.localFile = fileNodeID
      }
      await extractRemoteNodes(node[attr], ctx)
    }
  })
}

export default extractRemoteNodes
