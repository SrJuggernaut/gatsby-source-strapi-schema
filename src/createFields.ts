import { GatsbyGraphQLType } from 'gatsby'
import { pascalCase } from 'pascal-case'

import { StrapiContentType, StrapiPluginContext } from './types'

export default (
  type: StrapiContentType,
  ctx: StrapiPluginContext,
  currentName: string
) => {
  const { schema } = ctx
  const { attributes } = type
  const attributesArray = Object.keys(type.attributes)
  const fields: any = {}
  const productTypes: Array<GatsbyGraphQLType> = []
  attributesArray.forEach((att) => {
    const attObj = attributes[att]
    const required = attObj.required ? '!' : ''
    switch (attObj.type) {
      case 'string':
      case 'text':
      case 'email':
      case 'richtext':
      case 'biginteger':
      case 'enumeration':
      case 'uid':
        fields[att] = { type: `String${required}` }
        break
      case 'password':
        fields[att] = { type: 'String' }
        break
      case 'integer':
        fields[att] = { type: 'Int' }
        break
      case 'decimal':
      case 'float':
        fields[att] = { type: 'Float' }
        break
      case 'date':
      case 'datetime':
      case 'time':
      case 'timestamp':
        fields[att] = { type: 'Date' }
        break
      case 'boolean':
        fields[att] = { type: 'Boolean' }
        break
      case 'json':
        fields[att] = { type: 'JSON' }
        break
      case 'component':
        if (attObj.repeatable) {
          fields[att] = {
            type: [
              `StrapiComponent${pascalCase(
                attObj.component as string
              )}${required}`
            ]
          }
          break
        }
        fields[att] = {
          type: `StrapiComponent${pascalCase(
            attObj.component as string
          )}${required}`
        }
        break
      case 'media':
        if (attObj.multiple) {
          fields[att] = { type: [`StrapiMedia${required}`] }
          break
        }
        fields[att] = { type: `StrapiMedia${required}` }
        break
      case 'dynamiczone':
        productTypes.push(
          schema.buildUnionType({
            name: `${currentName}${pascalCase(att)}`,
            types: attObj.components?.map(
              (compName) => `StrapiComponent${pascalCase(compName)}`
            ),
            resolveType: (x) =>
              `StrapiComponent${pascalCase(x.strapi_component)}`
          })
        )
        fields[att] = { type: [`${currentName}${pascalCase(att)}`] }
        break
      case 'relation':
        switch (attObj.relationType) {
          case 'oneToOne':
          case 'oneWay':
          case 'manyToOne':
            fields[att] = {
              type: `Strapi${pascalCase(attObj.model!)}`,
              resolve: (source: any, args: any, context: any, info: any) => {
                const nodeToFind =
                  source[info.fieldName].id || source[info.fieldName]
                return context.nodeModel
                  .getAllNodes({
                    type: `Strapi${pascalCase(attObj.model!)}`
                  })
                  .find((x: any) => {
                    return x.strapiId === nodeToFind
                  })
              }
            }
            break
          case 'oneToMany':
          case 'manyWay':
          case 'manyToMany':
            fields[att] = {
              type: [`Strapi${pascalCase(attObj.collection!)}`],
              resolve: (source: any, args: any, context: any, info: any) => {
                const nodesToGet = source[info.fieldName].map(
                  (currSource: any) => currSource.id || currSource
                )
                return nodesToGet.map((nodeToFind: any) => {
                  return context.nodeModel
                    .getAllNodes({
                      type: `Strapi${pascalCase(attObj.collection!)}`
                    })
                    .find((x: any) => {
                      return x.strapiId === nodeToFind
                    })
                })
              }
            }
            break
          default:
            console.log(
              `Unhandled relation type ${attObj.relationType}, Model:`,
              attObj
            )
            break
        }
        break
      default:
        console.log(`Unhandled type ${attObj.type}, Model:`, attObj)
        break
    }
  })
  return { fields, productTypes }
}
