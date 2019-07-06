require('chai').should()
var test = require('ava').test.serial

var fmt = require('util').format
var strip = require('chalk').stripColor

var Log = require('..')

class LogError extends Error {
  constructor () {
    super('this is a test error')
    this.name = 'LogError'
    this.info = 'test'
  }
}

test.beforeEach((t) => {
  t.context.stdout = ''
  t.context.log = function () { t.context.stdout += fmt.apply(null, arguments) }
})

test('the log should print debug-level messages', function (t) {
  var log = Log({}, { log: t.context.log })
  log.debug('test', { value: 'hi' })
  strip(t.context.stdout).should.equal('[debug] test {"value":"hi"}')
})

test('the log should print info-level message', function (t) {
  var log = Log({}, { log: t.context.log })
  log.info('test', { value: 'hi' })
  strip(t.context.stdout).should.equal('[info]  test {"value":"hi"}')
})

test('the log should support warn-level messages', function (t) {
  var log = Log({}, { log: t.context.log })
  log.warn('test', { value: 'hi' })
  strip(t.context.stdout).should.equal('[warn]  test {"value":"hi"}')
})

test('the log should support error-level messages', function (t) {
  var log = Log({}, { log: t.context.log })
  log.error('test', { value: 'hi' })
  strip(t.context.stdout).should.equal('[error] test {"value":"hi"}')
})

test('the log should support error objects in place of error message', function (t) {
  var log = Log({}, { log: t.context.log })
  log.error(new LogError())
  strip(t.context.stdout).should.equal('[error] LogError: this is a test error {"error":{"name":"LogError","info":"test"}}')
})

test('the log should support error objects in place of warning message', function (t) {
  var log = Log({}, { log: t.context.log })
  log.warn(new LogError())
  strip(t.context.stdout).should.equal('[warn]  LogError: this is a test error {"warning":{"name":"LogError","info":"test"}}')
})

test('the log should not throw on circular meta references', function (t) {
  var log = Log({}, { log: t.context.log })
  var circular = {}
  circular.ref = circular
  circular.list = [ circular, circular ]
  log.info('test', circular)
  strip(t.context.stdout.should.equal('[info]  test {"ref":{"ref":"[Circular ~.ref]","list":["[Circular ~.ref]","[Circular ~.ref]"]},"list":[{"ref":"[Circular ~.list.0]","list":"[Circular ~.list]"},{"ref":"[Circular ~.list.1]","list":"[Circular ~.list]"}]}'))
})

test('the log should suppress messages below a specified level', function (t) {
  var log = Log({}, { level: 'warn', log: t.context.log })
  log.info('test', { value: 'x' })
  log.warn('test', { value: 'hi' })
  strip(t.context.stdout).should.equal('[warn]  test {"value":"hi"}')
})

test('the log should include default properties with all messages', function (t) {
  var log = Log({ default: 'v' }, { log: t.context.log })
  log.error('test', { value: 'hi' })
  strip(t.context.stdout).should.equal('[error] test {"default":"v","value":"hi"}')
})

test('the log should default unknown levels to debug', function (t) {
  var log = Log({}, { level: 'catastrophic', log: t.context.log })
  log.debug('test', { value: 'hi' })
  strip(t.context.stdout).should.equal('[debug] test {"value":"hi"}')
})

test('the log should support disabling colors', function (t) {
  var log = Log({}, { log: t.context.log, color: false })
  log.debug('test', { value: 'hi' })
  t.context.stdout.should.equal('[debug] test {"value":"hi"}')
})

test('the log should support tags', function (t) {
  var log = Log({}, { log: t.context.log })
  log.tag({ tag: 'tag' })
  log.debug('tagged')
  strip(t.context.stdout).should.equal('[debug] tagged {"tag":"tag"}')
  log.tags.should.deep.equal({ tag: 'tag' })
})

test('the log should support clones with additional tags', function (t) {
  var log1 = Log({}, { log: t.context.log })
  log1.tag({ tag: 'tag' })
  var log2 = log1.withTags({ other: 'other' })
  log1.debug('tagged')
  log2.debug('tagged')
  strip(t.context.stdout).should.equal('[debug] tagged {"tag":"tag"}[debug] tagged {"tag":"tag","other":"other"}')
  log1.tags.should.deep.equal({ tag: 'tag' })
  log2.tags.should.deep.equal({ tag: 'tag', other: 'other' })
})

test('the log should support disabling colors via the environment', function (t) {
  process.env.SMPLOG_COLORS = 'false'
  var log = Log({}, { log: t.context.log })
  log.debug('test', { value: 'hi' })
  t.context.stdout.should.equal('[debug] test {"value":"hi"}')
})

test('the log should initialize with appropriate defaults', function (t) {
  process.env.SMPLOG_LEVEL = 'error'
  var log = Log()
  log.debug('test', { pass: true })
})

test('the log level should override the environment value', function (t) {
  process.env.SMPLOG_LEVEL = 'error'
  var log = Log({}, { level: 'warn', log: t.context.log })
  log.warn('test', { value: 'x' })
  log.error('test', { value: 'hi' })
  strip(t.context.stdout).should.equal('[warn]  test {"value":"x"}[error] test {"value":"hi"}')
})

test('the log should take the default level from the environment', function (t) {
  process.env.SMPLOG_LEVEL = 'error'
  var log = Log({}, { log: t.context.log })
  log.warn('test', { value: 'x' })
  log.error('test', { value: 'hi' })
  strip(t.context.stdout).should.equal('[error] test {"value":"hi"}')
})

test('the log should support suppressing metadata', function (t) {
  process.env.SMPLOG_META = 'false'
  var log = Log({}, { log: t.context.log })
  log.error('test', { value: 'hi' })
  strip(t.context.stdout).should.equal('[error] test')
})
