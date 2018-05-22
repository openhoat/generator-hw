'use strict'

const { expect } = require('chai')
const { say } = require('../../lib/<%= projectName %>')

describe('main', () => {
  it('should pass', () => {
    const greetings = 'hello'
    expect(say(greetings)).to.equal('I say "hello"')
  })
})
