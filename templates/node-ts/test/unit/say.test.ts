import { expect } from 'chai'
import { Greetings } from '../../types'
import { say } from '../../lib/<%= projectName %>'

describe('main', () => {
  it('should pass', () => {
    const greetings: Greetings = 'hello'
    expect(say(greetings)).to.equal('I say "hello"')
  })
})
