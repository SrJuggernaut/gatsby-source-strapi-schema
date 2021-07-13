import { StrapiPluginContext } from './types'

export default (ctx: StrapiPluginContext) => {
  const { schema } = ctx
  return [
    schema.buildObjectType({
      name: 'StrapiMedia',
      fields: {
        id: { type: 'String!' },
        name: { type: 'String' },
        alternativeText: { type: 'String' },
        caption: { type: 'String' },
        hash: { type: 'String' },
        ext: { type: 'String' },
        mime: { type: 'String' },
        size: { type: 'Float' },
        width: { type: 'Int' },
        height: { type: 'Int' },
        provider: { type: 'String' },
        related: { type: ['String'] },
        createdAt: { type: 'String' },
        updatedAt: { type: 'String' },
        url: { type: 'String' },
        localFile: {
          type: 'File',
          resolve: (source, args, context, info) => {
            return context.nodeModel.getNodeById({
              id: source.localFile,
              type: 'File'
            })
          }
        }
      },
      extensions: {
        infer: true
      }
    })
  ]
}
