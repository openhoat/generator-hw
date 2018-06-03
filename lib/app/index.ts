import * as Generator from 'yeoman-generator'
import { basename, join, dirname, extname, resolve, relative } from 'path'
import { get, kebabCase, without } from 'lodash'
import chalk from 'chalk'
import { existsSync, readFileSync, statSync } from 'fs'
import { userInfo } from 'os'
import { safeLoad } from 'js-yaml'
import { InstallSteps } from '../../types/install-steps'
import { scanSync, getFilesInSync } from './helper'

const username = userInfo().username
const currentDir = process.cwd()
const checkMark = '\u2714'
const warning = '\u26A0'

class CustomGenerator extends Generator {

  protected logInfo: (s: string) => void
  protected logError: (s: string) => void
  protected baseDir: string
  protected files: string[]
  protected projectName: string
  protected nodeVersion: string
  protected templatesBasedir: string
  protected templateNames: string[]
  protected templateName: string
  protected sourceBasedir: string
  protected mainScript: string
  protected templateConfig: any
  protected readonly questions: Generator.Question[] = []
  protected pkg: any
  protected installSteps: InstallSteps

  constructor(args: string | string[], options: any) {
    super(args, options)
    this.templatesBasedir = join(__dirname, '..', '..', 'templates')
    this.templateNames = getFilesInSync(this.templatesBasedir, { onlyDirectories: true })
    this.logInfo = (s: string) => this.log(chalk.bold.green(s))
    this.logError = (s: string) => this.env.error(new Error(chalk.bold.red(`${warning}  ${s}`)))
    this.argument('templateName', {
      type: String,
      description: `Template to apply (available templates : ${this.templateNames.join(',')})`,
      required: false,
    })
    this.argument('projectName', {
      type: String,
      description: 'Name of the project to create',
      required: false,
    })
    this.installSteps = {
      createGit: {
        title: 'Git creation',
        process() {
          const gitDir = join(this.sourceBasedir, '.git')
          if (!existsSync(gitDir) || !statSync(gitDir).isDirectory()) {
            this.logInfo('no git directory found : ignore')
            return 0
          }
          return this.spawnCommandSync('git', ['init']).status
        },
      },
      addGitRemote: {
        title: 'Add git remote',
        process() {
          const gitDir = join(this.sourceBasedir, '.git')
          if (!existsSync(gitDir) || !statSync(gitDir).isDirectory()) {
            this.logInfo('no git directory found : ignore')
            return 0
          }
          return this.spawnCommandSync('git', ['remote', 'add', 'origin', this.gitUrl]).status
        },
      },
      installDeps: {
        title: 'Dependencies installation',
        process() {
          return this.spawnCommandSync('nvmwrapper', ['exec', 'npm', 'install']).status
        },
      },
      buildProject: {
        title: 'Project build',
        process() {
          const hasBuildScript = !!get(this.pkg, 'scripts.build')
          if (!hasBuildScript) {
            this.logInfo('no build script found : ignore')
            return 0
          }
          return this.spawnCommandSync('nvmwrapper', ['exec', 'npm', 'run', 'build', '-s']).status
        },
      },
      validateProject: {
        title: 'Project validation',
        process() {
          const hasValidateScript = !!get(this.pkg, 'scripts.validate')
          if (!hasValidateScript) {
            this.logInfo('no validate script found : ignore')
            return 0
          }
          return this.spawnCommandSync(
            'nvmwrapper',
            ['exec', 'npm', 'run', 'validate', '-s'],
          ).status
        },
      },
    }
  }

  initializing() {
    this.templateName = get(this.options, 'templateName', '')
    this.projectName = get(this.options, 'projectName', '')
    if (this.templateName === '') {
      this.templateName = 'node'
      this.questions.push({
        name: 'templateName',
        type: 'list',
        message: 'Choose a template: ',
        default: this.templateName,
        choices: this.templateNames,
      })
    } else {
      this.logInfo(`Template name was specified by argument : ${this.templateName}`)
    }
    if (this.projectName === '') {
      this.projectName = this.appname
      this.questions.push({
        type: 'input',
        name: 'projectName',
        message: 'Enter a name for the new project: ',
        default: kebabCase(this.projectName),
      })
    } else {
      this.logInfo(`Project name was specified by argument : ${this.projectName}`)
    }
    const questions = [{
      type: 'input',
      name: 'authorFirstName',
      message: 'Enter your first name: ',
      store: true,
    }, {
      type: 'input',
      name: 'authorLastName',
      message: 'Enter your last name: ',
      store: true,
    }, {
      type: 'input',
      name: 'username',
      message: 'Enter your username: ',
      store: true,
      default: username,
    }, {
      type: 'input',
      name: 'authorEmail',
      message: 'Enter your email: ',
      store: true,
    }, {
      type: 'input',
      name: 'authorWebsite',
      message: 'Enter your website URL: ',
      store: true,
    }, {
      type: 'input',
      name: 'gitUrl',
      message: 'Enter git URL: ',
      default: `git@github.com:${username}/${this.projectName}.git`,
    }, {
      type: 'input',
      name: 'issueUrl',
      message: 'Enter issue URL: ',
      default: `https://github.com/${username}/${this.projectName}/issues`,
    }, {
      type: 'input',
      name: 'nodeVersion',
      message: 'Enter nodejs version: ',
      default: 'lts/*',
    }]
    this.questions.push(...questions)
  }

  async prompting(): Promise<any> {
    const answers = await this.prompt(this.questions)
    Object.assign(this, answers)
    this.baseDir = basename(currentDir) === this.projectName ?
      currentDir :
      resolve(currentDir, this.projectName)
    this.sourceBasedir = join(this.templatesBasedir, this.templateName)
    if (!existsSync(this.sourceBasedir)) {
      throw new Error(`Template ${this.templateName} not found`)
    }
    if (!statSync(this.sourceBasedir).isDirectory()) {
      throw new Error(`Template ${this.templateName} is not a directory`)
    }
  }

  configuring() {
    this.logInfo(`${checkMark} Installing node version : ${this.nodeVersion}`)
    this.spawnCommandSync('nvmwrapper', ['install', this.nodeVersion])
    {
      const result = this.spawnCommandSync(
        'nvmwrapper',
        ['version', this.nodeVersion],
        { stdio: 'pipe', encoding: 'utf8' },
      )
      const realNodeVersion = result.output[1].split('\n')[0]
      this.logInfo(
        `${checkMark} Resolving node version "${this.nodeVersion}" to : ${realNodeVersion}`,
      )
      this.nodeVersion = realNodeVersion
    }
    this.logInfo(`${checkMark} Setting destination to : ${this.baseDir}`)
    this.destinationRoot(this.baseDir)
    this.logInfo(`Scanning files from template "${this.templateName}"...`)
    this.sourceRoot(this.sourceBasedir)
    const templateConfigFile = join(this.sourceBasedir, 'yo.yml')
    this.templateConfig = safeLoad(readFileSync(templateConfigFile, 'utf8'))
    this.mainScript = get(this.templateConfig, 'mainScript', 'lib/index.js')
    this.files = without(scanSync(this.sourceBasedir), 'yo.yml', this.mainScript)
    this.logInfo(`${checkMark} ${this.files.length} files were detected`)
  }

  writing() {
    this.logInfo(`Creating project files into ${relative(currentDir, this.baseDir)}`)
    this.files.forEach(name => {
      this.fs.copyTpl(this.templatePath(name), this.destinationPath(name), this)
    })
    const mainScriptDir = dirname(this.mainScript)
    const mainScriptExt = extname(this.mainScript)
    this.fs.copyTpl(
      this.templatePath(this.mainScript),
      this.destinationPath(join(mainScriptDir, `${this.projectName}${mainScriptExt}`)),
      this,
    )
    this.logInfo(`${checkMark} Files successfully created.`)
    this.pkg = this.fs.readJSON(join(this.baseDir, 'package.json'))
  }

  install() {
    this.logInfo('Installing...')
    Object.keys(this.installSteps).forEach((name: string, index, list) => {
      const noSteps = list.length
      const { title, process } = this.installSteps[name]
      this.logInfo(`Installation step ${index + 1}/${noSteps} : ${title}...`)
      const exitCode = process.call(this)
      if (!exitCode) {
        this.logInfo(`${checkMark} ${index + 1}/${noSteps} done.`)
      } else {
        this.logError(`Error in ${title}! (failed with code ${exitCode})`)
      }
    })
    this.logInfo(`${checkMark} Installation ok.`)
  }

  end() {
    const projectPath = relative(currentDir, this.baseDir)
    const cdMessage = projectPath ? `cd ${projectPath}; ` : ''
    const hasStartScript = !!get(this.pkg, 'scripts.start')
    this.logInfo(`${checkMark} Project "${this.projectName}" is ready.`)
    this.log()
    this.log('to play, simply type :')
    this.log()
    this.log(chalk.bold.yellow(`$ ${cdMessage}npm ${hasStartScript ? 'start' : 'test'}`))
    this.log()
    this.log(chalk.bold.blue('Enjoy!'))
    this.log()
  }
}

export = CustomGenerator
