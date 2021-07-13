import { GatsbyGraphQLObjectType } from 'gatsby'
import { StrapiPluginContext } from './types'

export const createObject = (
  name: string,
  description: string | null,
  fields: any,
  isNode: boolean = false,
  ctx: StrapiPluginContext
): GatsbyGraphQLObjectType => {
  const { schema } = ctx
  return schema.buildObjectType({
    name,
    description,
    fields,
    interfaces: isNode ? ['Node'] : null
  })
}

// export const createEnumType = (
//   name: string,
//   description: string | null,
//   values: Array<string>,
//   ctx: StrapiPluginContext
// ) => {
//   const { schema } = ctx
//   schema.buildEnumType({
//     name,
//     description,
//     values
//   })
// }
