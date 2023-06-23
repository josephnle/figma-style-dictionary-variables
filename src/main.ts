import { once, showUI, emit } from '@create-figma-plugin/utilities'
import chroma from 'chroma-js'

import { ImportTokensHandler, ReportErrorHandler, ReportSuccessHandler } from './types'

interface CollectionsStore {
  [key: string]: VariableCollection
}

interface ResolveTokenType {
  properties: any
  name: string[]
  collection: string
  category: string
  value: any
}

interface TokenProperties {
  [key: string]: {value: string; group: string} | TokenProperties
}

const traverseTokens = (properties: TokenProperties, prefix: string[], collections: CollectionsStore, category: string) => {
  const createdVariables: {name: string, variable: Variable}[] = []
  const aliases: ResolveTokenType[] = []

  for (const [key, value] of Object.entries(properties)) {
    const prefixedKey = [...prefix, key]
    if (value.value === undefined) {
      const recursiveResult = traverseTokens(value as TokenProperties, prefixedKey, collections, category)
      createdVariables.push(...recursiveResult.variables)
      aliases.push(...recursiveResult.aliases)
      continue
    }

    const collectionName = value.group ? category : value.group

    if (typeof value.value === 'string' && value.value.startsWith('{')) {
      aliases.push({
        properties: value,
        name: prefixedKey,
        collection: collectionName,
        category,
        value: value.value
      })
      continue
    }

    if (collections[collectionName] === undefined) {
      collections[collectionName] = figma.variables.createVariableCollection(collectionName)
    }

    switch(category) {
      case 'size': {
        const variable = figma.variables.createVariable(prefixedKey.join('/'), collections[collectionName].id, 'FLOAT')

        variable.setValueForMode(collections[collectionName].defaultModeId, parseInt(value.value as string))
        createdVariables.push({
          name: prefixedKey.join('/'),
          variable,
        })
        break
      }
      case 'color': {
        const variable = figma.variables.createVariable(prefixedKey.join('/'), collections[collectionName].id, 'COLOR')

        const rgbColor = chroma(value.value as string).rgba();

        variable.setValueForMode(collections[collectionName].defaultModeId, {
          r: rgbColor[0] / 255,
          g: rgbColor[1] / 255,
          b: rgbColor[2] / 255,
          a: rgbColor[3],
        })
        createdVariables.push({
          name: prefixedKey.join('/'),
          variable,
        })
        break
      }
      case 'content': {
        const variable = figma.variables.createVariable(prefixedKey.join('/'), collections[collectionName].id, 'STRING')

        variable.setValueForMode(collections[collectionName].defaultModeId, value.value as string)
        createdVariables.push({
          name: prefixedKey.join('/'),
          variable,
        })
        break
      }
    }
  }

  return {
    variables: createdVariables,
    aliases,
  }
}

const resolveVariableAliases = (variables: {name: string, variable: Variable}[], aliases: ResolveTokenType[], collections: CollectionsStore, category: string) => {
  const createdVariables: Variable[] = []

  const figmaType: {size: VariableResolvedDataType, color: VariableResolvedDataType, content: VariableResolvedDataType} = {
    size: 'FLOAT',
    color: 'COLOR',
    content: 'STRING',
  }

  for (const alias of aliases) {
    const normalizedAliasName = alias.value.replace('color.', '').replace('{', '').replace('}', '').replace(/\./g, '/')

    const findVariable = variables.find(
      v => v.name === normalizedAliasName
    )

    console.log(findVariable)
    if (!findVariable) {
      continue
    }

    const aliasedVariable = figma.variables.createVariable(
      alias.name.join('/'),
      collections[alias.collection].id,
      figmaType[category as 'size' | 'color' | 'content']
    )

    aliasedVariable.setValueForMode(
      collections[alias.collection].defaultModeId,
      figma.variables.createVariableAlias(findVariable.variable)
    )

    createdVariables.push(aliasedVariable)
  }

  return createdVariables
}

export default function () {
  once<ImportTokensHandler>('IMPORT_TOKENS', async (tokens: string) => {
    const file = JSON.parse(tokens)

    const [category, properties] = Object.entries(file)[0]
    const collections: CollectionsStore = {}

    const allowCategories = ['size', 'color', 'content']

    if (!allowCategories.includes(category)) {
      emit<ReportErrorHandler>('REPORT_ERROR', `We currently only support the following categories: ${allowCategories.join(', ')}`)
    }

    const totalTokens = traverseTokens(properties as TokenProperties, [], collections, category)

    const totalAliased = resolveVariableAliases(totalTokens.variables, totalTokens.aliases, collections, category)

    if (totalTokens.variables.length > 0) {
      emit<ReportSuccessHandler>('REPORT_SUCCESS', `Imported ${totalTokens.variables.length + totalAliased.length} tokens as variables.`)
    }
  })
  showUI({ height: 300, width: 320 })
}
