import {
  FileUploadButton,
  FileUploadDropzone,
  Container,
  Text,
  Bold,
  Muted,
  render,
  VerticalSpace,
  Banner,
  IconWarning32,
  Stack,
  IconCheckCircle32,
  SegmentedControl,
  IconInfo32,
  Code
} from '@create-figma-plugin/ui'
import { emit, on } from '@create-figma-plugin/utilities'
import { h } from 'preact'
import {useEffect, useState} from 'preact/hooks'

import styles from './styles.css'
import {
  ImportTokensHandler,
  ReportErrorHandler,
  ReportSuccessHandler,
  GetVariableCollectionsResultHandler,
  GetVariableCollectionsHandler,
  VariableCollectionResult,
} from './types'
import {TargetedEvent} from "preact/compat";

function Plugin() {
  const [errorMsg, setErrorMsg] = useState<string | null>()
  const [successMsg, setSuccessMsg] = useState<string | null>()
  const [importMode, setImportMode] = useState<'new' | 'replace'>('new');
  const [collections, setCollections] = useState<VariableCollectionResult[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);

  const handleSelectedFiles = (files: Array<File>) => {
    const reader = new FileReader()
    reader.readAsText(files[0])

    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        emit<ImportTokensHandler>('IMPORT_TOKENS', reader.result, importMode)
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

    on<GetVariableCollectionsResultHandler>('GET_COLLECTIONS_RESULT', (result) => {
      setCollections(result)
    })

    emit<GetVariableCollectionsHandler>('GET_COLLECTIONS')
  }, [])

  return (
    <Container space="medium">
      <VerticalSpace space="small" />
      <Stack space="small">
        {successMsg && <Banner icon={<IconCheckCircle32 />} variant="success">{successMsg}</Banner>}
        {errorMsg && <Banner icon={<IconWarning32 />} variant="warning">{errorMsg}</Banner>}
        {importMode === 'replace' && (
          <Banner icon={<IconInfo32 />}>
            Tokens will be replaced using their names. The collection will be determined by the <Code>group</Code> key on the token property.
          </Banner>
        )}
        <Stack space="extraSmall">
          <Text>
            <Bold>Import mode</Bold>
          </Text>
          <SegmentedControl
            options={[
              {
                value: 'new',
                children: 'Create new'
              },
              {
                value: 'replace',
                children: 'Update existing'
              }
            ]}
            value={importMode}
            onChange={(e: TargetedEvent<HTMLInputElement>) => {
              setImportMode(e.currentTarget.value as 'new' | 'replace');
            }}
          />
        </Stack>
        {/*{importMode === 'replace' && (*/}
        {/*  <Stack space="extraSmall">*/}
        {/*    <Text>*/}
        {/*      <Bold>Select collection to update</Bold>*/}
        {/*    </Text>*/}
        {/*    <Dropdown*/}
        {/*      options={collections.map((c, i) => ({*/}
        {/*        value: c.id,*/}
        {/*        text: c.name,*/}
        {/*      }))}*/}
        {/*      onChange={(e: TargetedEvent<HTMLInputElement>) => {*/}
        {/*        setSelectedCollection(e.currentTarget.value);*/}
        {/*      }}*/}
        {/*      value={selectedCollection}*/}
        {/*    />*/}
        {/*  </Stack>*/}
        {/*)}*/}
        <FileUploadDropzone acceptedFileTypes={['application/json']} onSelectedFiles={handleSelectedFiles}>
          <Text align="center">
            <Bold>Drop token file here to import</Bold>
          </Text>
          <VerticalSpace space="small" />
          <Text align="center">
            <Muted>or</Muted>
          </Text>
          <VerticalSpace space="small" />
          <FileUploadButton acceptedFileTypes={['application/json']} onSelectedFiles={handleSelectedFiles}>
            Select token file to import
          </FileUploadButton>
        </FileUploadDropzone>
      </Stack>
      <VerticalSpace space="small" />
    </Container>
  )
}

export default render(Plugin)
