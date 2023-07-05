import { EventHandler } from '@create-figma-plugin/utilities'

export type VariableCollectionResult = Pick<VariableCollection, 'id' | 'name'>

export interface ImportTokensHandler extends EventHandler {
  name: 'IMPORT_TOKENS'
  handler: (code: string, importMode: 'new' | 'replace') => void
}

export interface ReportErrorHandler extends EventHandler {
  name: 'REPORT_ERROR'
  handler: (error: string) => void
}

export interface ReportSuccessHandler extends EventHandler {
  name: 'REPORT_SUCCESS'
  handler: (msg: string) => void
}

export interface GetVariableCollectionsHandler extends EventHandler {
  name: 'GET_COLLECTIONS'
  handler: () => void
}

export interface GetVariableCollectionsResultHandler extends EventHandler {
  name: 'GET_COLLECTIONS_RESULT'
  handler: (results: VariableCollectionResult[]) => void
}
