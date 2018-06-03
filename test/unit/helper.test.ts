import {
  expect,
  createSandbox,
  SinonSandbox,
  proxyquire,
  givenDesc,
} from './helper'

describe('helper', () => {
  let sandbox: SinonSandbox
  let stubs: any
  let helper: any
  before(() => {
    sandbox = createSandbox()
    stubs = {
      stats: {
        isDirectory: sandbox.stub(),
        isFile: sandbox.stub(),
      },
      readdirSync: sandbox.stub(),
      statSync: sandbox.stub(),
    }
    helper = proxyquire('../../lib/app/helper', {
      fs: {
        readdirSync: stubs.readdirSync,
        statSync: stubs.statSync,
      },
    })
  })
  beforeEach(() => {
    stubs.statSync.returns(stubs.stats)
  })
  afterEach(() => {
    sandbox.reset()
  })
  describe('scanSync', () => {
    {
      const from = 'mydir'
      const files = ['file1.txt', 'file2.txt', 'dir1']
      const childs = ['a.txt', 'b.txt']
      context(givenDesc({ files, childs }), () => {
        it('should scan dir', () => {
          // Given
          stubs.readdirSync.onFirstCall().returns(files)
          stubs.stats.isDirectory.onThirdCall().returns(true)
          stubs.readdirSync.onSecondCall().returns(childs)
          const expected = {
            result: [
              'file1.txt',
              'file2.txt',
              'dir1/a.txt',
              'dir1/b.txt',
            ],
          }
          // When
          const result = helper.scanSync(from)
          // Then
          expect(result).to.eql(expected.result)
          expect(stubs.readdirSync).to.be.calledTwice
          expect(stubs.statSync).to.be.called
          expect(stubs.stats.isDirectory).to.be.called
        })
      })
    }
  })
  describe('getFilesInSync', () => {
    {
      context(givenDesc({ dir:undefined }), () => {
        it('should get files from empty dir', () => {
          // Given
          const expected: { files: string[] } = { files: [] }
          stubs.readdirSync.withArgs().returns(expected.files)
          // When
          const result = helper.getFilesInSync()
          // Then
          expect(result).to.eql(expected.files)
          expect(stubs.readdirSync).to.be.calledOnce
          expect(stubs.statSync).to.not.be.called
          expect(stubs.stats.isDirectory).to.not.be.called
        })
      })
    }
    {
      const dir = 'mydir'
      context(givenDesc({ dir }), () => {
        it('should get files from empty dir', () => {
          // Given
          const expected: { files: string[] } = { files: [] }
          stubs.readdirSync.withArgs(dir).returns(expected.files)
          // When
          const result = helper.getFilesInSync(dir)
          // Then
          expect(result).to.eql(expected.files)
          expect(stubs.readdirSync).to.be.calledOnce
          expect(stubs.statSync).to.not.be.called
          expect(stubs.stats.isDirectory).to.not.be.called
        })
        {
          const dir = 'mydir'
          const options = {}
          const expected = {
            files: [
              'file1.txt',
              'file2.txt',
            ],
          }
          context(givenDesc({ dir, options }), () => {
            it('should get files from dir', () => {
              // Given
              stubs.readdirSync.withArgs(dir).returns(expected.files)
              // When
              const result = helper.getFilesInSync(dir, options)
              // Then
              expect(result).to.eql(expected.files)
              expect(stubs.readdirSync).to.be.calledOnce
              expect(stubs.statSync).to.not.be.called
              expect(stubs.stats.isDirectory).to.not.be.called
            })
          })
        }
        {
          const dir = 'mydir'
          const options = { onlyFiles: true }
          const expected = {
            files: [
              'file1.txt',
            ],
          }
          context(givenDesc({ dir, options }), () => {
            it('should get files from dir', () => {
              // Given
              stubs.readdirSync.withArgs(dir).returns(expected.files)
              stubs.stats.isFile.onFirstCall().returns(true)
              // When
              const result = helper.getFilesInSync(dir, options)
              // Then
              expect(result).to.eql(expected.files)
              expect(stubs.readdirSync).to.be.calledOnce
              expect(stubs.statSync).to.be.calledOnce
              expect(stubs.stats.isDirectory).to.not.be.called
              expect(stubs.stats.isFile).to.be.called
            })
          })
        }
        {
          const dir = 'mydir'
          const options = { onlyDirectories: true }
          const expected = {
            files: [
              'file1.txt',
            ],
          }
          context(givenDesc({ dir, options }), () => {
            it('should get files from dir', () => {
              // Given
              stubs.readdirSync.withArgs(dir).returns(expected.files)
              stubs.stats.isDirectory.onFirstCall().returns(true)
              // When
              const result = helper.getFilesInSync(dir, options)
              // Then
              expect(result).to.eql(expected.files)
              expect(stubs.readdirSync).to.be.calledOnce
              expect(stubs.statSync).to.be.calledOnce
              expect(stubs.stats.isDirectory).to.be.called
              expect(stubs.stats.isFile).to.not.be.called
            })
          })
        }
      })
    }
  })
})
