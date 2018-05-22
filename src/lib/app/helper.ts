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
                        } = {
                          onlyDirectories: false,
                          onlyFiles: false,
                        }): string[] {
  return readdirSync(dir).filter(name => {
    if (!options.onlyDirectories && !options.onlyFiles) {
      return true
    }
    const filePath = join(dir, name)
    const stats = statSync(filePath)
    if (options.onlyDirectories) {
      return stats.isDirectory()
    }
    if (options.onlyFiles) {
      return stats.isFile()
    }
  })
}

export { scanSync, getFilesInSync }
