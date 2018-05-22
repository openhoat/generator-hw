'use strict'

function say(greetings) {
  return `I say "${greetings}"`
}

module.exports = { say }

if (!module.parent) {
  console.log(say('hello'))
}
