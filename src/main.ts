import { loadFontsAsync, once, showUI, emit } from '@create-figma-plugin/utilities'

import { ImportTokensHandler, ReportErrorHandler } from './types'

export default function () {
  once<ImportTokensHandler>('IMPORT_TOKENS', async (tokens: string) => {
    const file = JSON.parse(tokens)

    const [category, properties] = Object.entries(file)[0]
    const collections = {}

    const allowCategories = ['size']

    if (!allowCategories.includes(category)) {
      emit<ReportErrorHandler>('REPORT_ERROR', `We currently only support the following categories: ${allowCategories.join(', ')}`)
    }

    if (category === 'size') {
      for (const [name, value] of Object.entries(properties)) {
        if (collections[value.group] === undefined) {
          collections[value.group] = figma.variables.createVariableCollection(value.group)
        }

        const variable = figma.variables.createVariable(name, collections[value.group].id, 'FLOAT')

        variable.setValueForMode(collections[value.group].defaultModeId, parseInt(value.value))
      }
    }
  })
  showUI({ height: 240, width: 320 })
}
