var { beforeEach, serial: test } = require('ava')

var fmt = require('util').format
var strip = require('strip-ansi')
var intercept = require('intercept-stdout')

var Log = require('..')

class LogError extends Error {
  constructor () {
    super('this is a test error')
    this.name = 'LogError'
    this.info = 'test'
  }
}

let restore
beforeEach((t) => {
  restore && restore()
  t.context.stdout = ''
  restore = intercept((msg) => {
    t.context.stdout += msg.replace(/\n$/m, '')
    return ''
  })
})

test('the log should print debug-level messages', function (t) {
  var log = Log({}, { level: 'debug' })
  log.debug('test', { value: 'hi' })
  t.is(strip(t.context.stdout), '[debug] test smplog::{"value":"hi"}')
})

test('the log should print info-level message', function (t) {
  var log = Log({}, { log: t.context.log })
  log.info('test', { value: 'hi' })
  t.is(strip(t.context.stdout), '[info]  test smplog::{"value":"hi"}')
})

test('the log should support warn-level messages', function (t) {
  var log = Log({}, { log: t.context.log })
  log.warn('test', { value: 'hi' })
  t.is(strip(t.context.stdout), '[warn]  test smplog::{"value":"hi"}')
})

test('the log should support error-level messages', function (t) {
  var log = Log({}, { log: t.context.log })
  log.error('test', { value: 'hi' })
  t.is(strip(t.context.stdout),'[error] test smplog::{"value":"hi"}')
})

test('the log should support error objects in place of error message', function (t) {
  var log = Log({}, { log: t.context.log })
  log.error(new LogError())
  t.regex(strip(t.context.stdout), /\[error] LogError: this is a test error([^]*) smplog::\{"error":\{"name":"LogError","info":"test"}}/m)
})

test('the log should support error objects in place of warning message', function (t) {
  var log = Log({}, { log: t.context.log })
  log.warn(new LogError())
  t.regex(strip(t.context.stdout), /\[warn]  LogError: this is a test error([^]*) smplog::\{"warning":\{"name":"LogError","info":"test"}}/m)
})

test('the log should not throw on circular meta references', function (t) {
  var log = Log({}, { log: t.context.log })
  var circular = {}
  circular.ref = circular
  circular.list = [ circular, circular ]
  log.info('test', circular)
  t.is(strip(t.context.stdout), '[info]  test smplog::{"ref":{"ref":"[Circular ~.ref]","list":["[Circular ~.ref]","[Circular ~.ref]"]},"list":[{"ref":"[Circular ~.list.0]","list":"[Circular ~.list]"},{"ref":"[Circular ~.list.1]","list":"[Circular ~.list]"}]}')
})

test('the log should suppress messages below a specified level', function (t) {
  var log = Log({}, { level: 'warn', log: t.context.log })
  log.info('test', { value: 'x' })
  log.warn('test', { value: 'hi' })
  t.is(strip(t.context.stdout), '[warn]  test smplog::{"value":"hi"}')
})

test('the log should include default properties with all messages', function (t) {
  var log = Log({ default: 'v' }, { log: t.context.log })
  log.error('test', { value: 'hi' })
  t.is(strip(t.context.stdout), '[error] test smplog::{"default":"v","value":"hi"}')
})

test('the log should default unknown levels to info', function (t) {
  var log = Log({}, { level: 'catastrophic', log: t.context.log })
  log.debug('test', { value: 'hi' })
  log.info('test', { value: 'hi' })
  t.is(strip(t.context.stdout), '[info]  test smplog::{"value":"hi"}')
})

test('the log should support disabling colors', function (t) {
  var log = Log({}, { log: t.context.log, color: false })
  log.info('test', { value: 'hi' })
  t.is(t.context.stdout, '[info]  test smplog::{"value":"hi"}')
})

test('the log should support tags', function (t) {
  var log = Log({}, { log: t.context.log })
  log.tag({ tag: 'tag' })
  log.info('tagged')
  t.is(strip(t.context.stdout), '[info]  tagged smplog::{"tag":"tag"}')
  t.deepEqual(log.tags, { tag: 'tag' })
})

test('the log should support clones with additional tags', function (t) {
  var log1 = Log({}, { log: t.context.log })
  log1.tag({ tag: 'tag' })
  var log2 = log1.withTags({ other: 'other' })
  log1.info('tagged')
  log2.info('tagged')
  t.is(strip(t.context.stdout), '[info]  tagged smplog::{"tag":"tag"}[info]  tagged smplog::{"tag":"tag","other":"other"}')
  t.deepEqual(log1.tags, { tag: 'tag' })
  t.deepEqual(log2.tags, { tag: 'tag', other: 'other' })
})

test('the log should support custom log interceptors', function (t) {
  var log = Log({}, { log: (msg, write) => write(msg) })
  log.info('message')
  t.is(strip(t.context.stdout), '[info]  message')
})

test('the log should support global installation', function (t) {
  var log = Log({}, { log: (msg, write) => write(msg) })
  log.install()
  console.info('message')
  console.warn('message')
  t.is(strip(t.context.stdout), '[info]  message[warn]  message')
  log.uninstall()
  console.info('raw')
  t.is(strip(t.context.stdout), '[info]  message[warn]  messageraw')
})

test('the log should support disabling colors via the environment', function (t) {
  process.env.SMPLOG_COLORS = 'false'
  var log = Log({}, { log: t.context.log })
  log.info('test', { value: 'hi' })
  t.is(t.context.stdout, '[info]  test smplog::{"value":"hi"}')
})

test('the log should initialize with appropriate defaults', function (t) {
  process.env.SMPLOG_LEVEL = 'error'
  var log = Log()
  log.info('test', { pass: true })
  t.is(t.context.stdout, '')
})

test('the log level should override the environment value', function (t) {
  process.env.SMPLOG_LEVEL = 'error'
  var log = Log({}, { level: 'warn', log: t.context.log })
  log.warn('test', { value: 'x' })
  log.error('test', { value: 'hi' })
  t.is(strip(t.context.stdout), '[warn]  test smplog::{"value":"x"}[error] test smplog::{"value":"hi"}')
})

test('the log should take the default level from the environment', function (t) {
  process.env.SMPLOG_LEVEL = 'error'
  var log = Log({}, { log: t.context.log })
  log.warn('test', { value: 'x' })
  log.error('test', { value: 'hi' })
  t.is(strip(t.context.stdout), '[error] test smplog::{"value":"hi"}')
})

test('the log should support suppressing metadata', function (t) {
  process.env.SMPLOG_META = 'false'
  var log = Log({}, { log: t.context.log })
  log.error('test', { value: 'hi' })
  t.is(strip(t.context.stdout), '[error] test')
})

