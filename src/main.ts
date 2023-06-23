import { once, showUI, emit } from '@create-figma-plugin/utilities'
import chroma from 'chroma-js'

import { ImportTokensHandler, ReportErrorHandler, ReportSuccessHandler } from './types'

interface CollectionsStore {
  [key: string]: VariableCollection
}

const traverseTokens = (properties: any, prefix: string[], collections: CollectionsStore, category: string) => {
  let totalTokens = 0

  for (const [key, value] of Object.entries(properties)) {
    const prefixedKey = [...prefix, key]
    if (value.value === undefined) {
      totalTokens += traverseTokens(value, prefixedKey, collections, category)
      continue
    }

    if (value.value.startsWith('{')) {
      emit<ReportErrorHandler>('REPORT_ERROR', 'Sorry, variable aliases are not yet supported. 😢')
      continue
    }

    const collectionName = value.group ? category : value.group

    if (collections[collectionName] === undefined) {
      collections[collectionName] = figma.variables.createVariableCollection(collectionName)
    }

    switch(category) {
      case 'size': {
        const variable = figma.variables.createVariable(prefixedKey.join('/'), collections[collectionName].id, 'FLOAT')

        variable.setValueForMode(collections[collectionName].defaultModeId, parseInt(value.value))
        break
      }
      case 'color': {
        const variable = figma.variables.createVariable(prefixedKey.join('/'), collections[collectionName].id, 'COLOR')

        const rgbColor = chroma(value.value).rgba();

        variable.setValueForMode(collections[collectionName].defaultModeId, {
          r: rgbColor[0] / 255,
          g: rgbColor[1] / 255,
          b: rgbColor[2] / 255,
          a: rgbColor[3],
        })
        break
      }
      case 'content': {
        const variable = figma.variables.createVariable(prefixedKey.join('/'), collections[collectionName].id, 'STRING')

        variable.setValueForMode(collections[collectionName].defaultModeId, value.value)
        break
      }
    }

    totalTokens += 1
  }

  return totalTokens
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

    const totalTokens = traverseTokens(properties, [], collections, category)

    console.log(totalTokens)

    if (totalTokens > 0) {
      emit<ReportSuccessHandler>('REPORT_SUCCESS', `Imported ${totalTokens} tokens as variables.`)
    }
  })
  showUI({ height: 300, width: 320 })
}
