import {
  FileUploadButton,
  FileUploadDropzone,
  Container,
  Text,
  Bold,
  Muted,
  render,
  VerticalSpace, Banner, IconWarning32, Stack, IconCheckCircle32
} from '@create-figma-plugin/ui'
import { emit, on } from '@create-figma-plugin/utilities'
import { h } from 'preact'
import {useEffect, useState} from 'preact/hooks'

import styles from './styles.css'
import {ImportTokensHandler, ReportErrorHandler, ReportSuccessHandler} from './types'

function Plugin() {
  const [errorMsg, setErrorMsg] = useState<string | null>()
  const [successMsg, setSuccessMsg] = useState<string | null>()

  const handleSelectedFiles = (files: Array<File>) => {
    const reader = new FileReader()
    reader.readAsText(files[0])

    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        emit<ImportTokensHandler>('IMPORT_TOKENS', reader.result)
      }
    }
  }

  useEffect(() => {
    on<ReportErrorHandler>('REPORT_ERROR', (errorMsg) => {
      setErrorMsg(errorMsg)
    });

    on<ReportSuccessHandler>('REPORT_SUCCESS', (msg) => {
      setSuccessMsg(msg)
    });
  }, [])

  return (
    <Container space="medium">
      <VerticalSpace space="small" />
      <Stack space="small">
        {successMsg && <Banner icon={<IconCheckCircle32 />} variant="success">{successMsg}</Banner>}
        {errorMsg && <Banner icon={<IconWarning32 />} variant="warning">{errorMsg}</Banner>}
        <FileUploadDropzone acceptedFileTypes={['application/json']} onSelectedFiles={handleSelectedFiles}>
          <Text align="center">
            <Bold>Drop token file here</Bold>
          </Text>
          <VerticalSpace space="small" />
          <Text align="center">
            <Muted>or</Muted>
          </Text>
          <VerticalSpace space="small" />
          <FileUploadButton acceptedFileTypes={['application/json']} onSelectedFiles={handleSelectedFiles}>
            Select token file
          </FileUploadButton>
        </FileUploadDropzone>
      </Stack>
      <VerticalSpace space="small" />
    </Container>
  )
}

export default render(Plugin)
