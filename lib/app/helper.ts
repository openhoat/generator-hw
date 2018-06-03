import { get } from 'lodash'
import { join, relative } from 'path'
import { readdirSync, statSync } from 'fs'

function walkSync(dir: string = process.cwd(), filelist: string[] = []): string[] {
  return readdirSync(dir).reduce(
    (filelist: string[], file: string) => {
      const filePath = join(dir, file)
      return filelist.concat(
        statSync(filePath).isDirectory() ?
          walkSync(filePath) :
          filePath,
      )
    },
    filelist,
  )
}

function scanSync(from: string = process.cwd()): string[] {
  return walkSync(from).map(filePath => relative(from, filePath))
}

function getFilesInSync(dir: string,
                        options: {
                          onlyDirectories?: boolean,
                          onlyFiles?: boolean,
                        }): string[] {
  return readdirSync(dir).filter(name => {
    const onlyDirectories: boolean = get<any, string, boolean>(options, 'onlyDirectories', false)
    const onlyFiles: boolean = get<any, string, boolean>(options, 'onlyFiles', false)
    if (!onlyDirectories && !onlyFiles) {
      return true
    }
    const filePath = join(dir, name)
    const stats = statSync(filePath)
    if (onlyDirectories) {
      return stats.isDirectory()
    }
    if (onlyFiles) {
      return stats.isFile()
    }
  })
}

export { scanSync, getFilesInSync }
