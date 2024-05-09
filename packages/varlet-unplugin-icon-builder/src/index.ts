import type { UnpluginFactory } from 'unplugin'
import type { Options } from './types'
import { createUnplugin } from 'unplugin'
import { buildIcons } from '@varlet/icon-builder'
import { resolve } from 'path'
import fse from 'fs-extra'

export interface IconBuilderOptions {
  dir?: string
  moduleId?: string
  generatedFilename?: string
  name?: string
  namespace?: string
  fontFamilyClassName?: string
}

export const unpluginFactory: UnpluginFactory<IconBuilderOptions | undefined> = (options: IconBuilderOptions = {}) => {
  const {
    moduleId = 'virtual:icons',
    generatedFilename = 'virtual.icons.css',
    name = 'i-icons',
    dir = './svg-icons',
    fontFamilyClassName = 'i--set',
    namespace = 'i',
  } = options

  async function writeVirtualIconFile() {
    const { cssTemplate } = await buildIcons({
      name,
      namespace,
      fontFamilyClassName,
      entry: dir,
      emitFile: false,
    })

    fse.outputFileSync(resolve(process.cwd(), generatedFilename), cssTemplate)
  }

  return {
    name: 'varlet-unplugin-icon-builder',

    async buildStart() {
      await writeVirtualIconFile()
    },

    async load(id) {
      if (id !== moduleId) {
        return
      }

      this.addWatchFile(resolve(process.cwd(), generatedFilename))
      const cssTemplate = fse.readFileSync(resolve(process.cwd(), generatedFilename))

      return `\
const insertedStyle = document.createElement('style')
insertedStyle.appendChild(document.createTextNode(String.raw\`${cssTemplate}\`))
document.head.appendChild(insertedStyle)`
    },

    resolveId(id) {
      if (id === moduleId) {
        return id
      }

      return null
    },

    watchChange(id) {
      if (id.startsWith(resolve(process.cwd(), dir))) {
        writeVirtualIconFile()
      }
    },
  }
}

export const unplugin = /* #__PURE__ */ createUnplugin(unpluginFactory)

export default unplugin