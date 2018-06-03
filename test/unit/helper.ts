import { expect, use as chaiUse } from 'chai'
import { inspect } from 'util'
import { createSandbox, SinonSandbox, SinonStub, createStubInstance } from 'sinon'
import * as sinonChai from 'sinon-chai'
import { noCallThru } from 'proxyquire'

const proxyquire = noCallThru().load

const chaiAsPromised = require('chai-as-promised')
chaiUse(sinonChai)
chaiUse(chaiAsPromised)

function hasBeenCalled(fn: Function) {
  expect(fn).to.be.called
}

function asString(data: any) {
  return data === undefined ?
    'undefined' :
    (
      typeof data === 'object' ?
        inspect(data, { colors: process.stdin.isTTY, breakLength: Infinity }) :
        data
    )
}

function givenDesc(data: any) {
  return `given : ${asString(data)}`
}

export {
  expect,
  hasBeenCalled,
  SinonSandbox,
  SinonStub,
  createSandbox,
  createStubInstance,
  proxyquire,
  asString,
  givenDesc,
}
