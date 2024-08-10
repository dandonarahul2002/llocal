import { OllamaEmbeddings } from '@langchain/community/embeddings/ollama'
import { Document } from '@langchain/core/documents'
import { dialog } from 'electron/main'
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'
import { FaissStore } from '@langchain/community/vectorstores/faiss'
import { readdirSync } from 'fs'
import path from 'path'
import { documentsDirectory } from '..'

interface getFile {
  canceled: boolean
  filePaths: string[]
}

export function getFileName(dir:string):string{
  const fileName = path.basename(dir);
  return fileName
}

// dialog function to get the file name(s)
export async function getSelectedFiles(): Promise<getFile> {
  return new Promise((resolve, reject) => {
    dialog
      .showOpenDialog({
        message: 'Choose files to add to the knowledge base',
        filters: [{ name: 'PDF, DOCX, PPTX, TXT', extensions: ['pdf', 'pptx', 'docx', 'txt'] }],
      })
      .then((filePath): void => {
        if(filePath.canceled) reject(`The operation has been aborted!`)
        resolve(filePath)
      })
  })
}

export function checkIfDuplicate(fileName: string):boolean{
  const exisiting =  getVectorDbList(); // this brings all the available documents
  for(let i = 0 ; i < exisiting.length; i++){
    if(exisiting[i] == fileName) return false // incase there's already an exisiting index folder we need to do something about it
  }
  return true; // otherwise, voila!
}

// save vector db
export async function saveVectorDb(docs: Document[], saveDirectory: string): Promise<boolean> {
  const embeddings = new OllamaEmbeddings({
    baseUrl: 'http://127.0.0.1:11434',
    model: 'all-minilm'
  })

  // defining the chunking strategy
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200
  })

  try {
    const splits = await textSplitter.splitDocuments(docs) // splitting the documents using the chosen chunking strategy
    /* the format for pdf : {pageContent:, meta:{pageNumber: , lines: {from, to}}} */
    const vectorstore = await FaissStore.fromDocuments(splits, embeddings)    
    // save the vectorestore in an index file
    vectorstore.save(saveDirectory) // directory name, specify a name specific to pdf's to maintain consistency
  } catch (error) {
    return false
  }
  return true
}

// this function gets the list of vector db's generated by faiss
export function getVectorDbList(): string[] {
  const dir = readdirSync(documentsDirectory, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name)
  return dir
}

export async function similaritySearch(
  path: string,
  fileType: string,
  prompt: string // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<ragReturn> {
  const embeddings = new OllamaEmbeddings({
    baseUrl: 'http://127.0.0.1:11434',
    model: 'all-minilm'
  })

  const vectorstore = await FaissStore.load(path, embeddings) // load index

  // performing similarity search for getting the context
  const similaritySearch = await vectorstore.similaritySearch(prompt)
  let sources = "";
  // for pdf
  if(fileType == "pdf"){
    similaritySearch.forEach((val)=>{
      sources += `Page number: ${val.metadata.pageNumber}, From Line ${val.metadata.from} to ${val.metadata.to}`
    })
  }
  return {prompt: `this is my question ${prompt},\n answer only from the following context: \n ${JSON.stringify(similaritySearch)}`, sources:sources}
}
