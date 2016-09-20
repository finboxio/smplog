require('chai').should()
var test = require('ava').test

var fmt = require('util').format

var Log = require('..')

test.beforeEach((t) => {
  t.context.stdout = ''
  t.context.log = function () { t.context.stdout += fmt.apply(null, arguments) }
})

test('the log should print debug-level messages', function (t) {
  var log = Log({}, { log: t.context.log })
  log.debug('test', { value: 'hi' })
  t.context.stdout.should.equal('[debug] test {"value":"hi"}')
})

test('the log should print info-level message', function (t) {
  var log = Log({}, { log: t.context.log })
  log.info('test', { value: 'hi' })
  t.context.stdout.should.equal('[info] test {"value":"hi"}')
})

test('the log should support warn-level messages', function (t) {
  var log = Log({}, { log: t.context.log })
  log.warn('test', { value: 'hi' })
  t.context.stdout.should.equal('[warn] test {"value":"hi"}')
})

test('the log should support error-level messages', function (t) {
  var log = Log({}, { log: t.context.log })
  log.error('test', { value: 'hi' })
  t.context.stdout.should.equal('[error] test {"value":"hi"}')
})

test('the log should suppress messages below a specified level', function (t) {
  var log = Log({}, { level: 'warn', log: t.context.log })
  log.info('test', { value: 'x' })
  log.warn('test', { value: 'hi' })
  t.context.stdout.should.equal('[warn] test {"value":"hi"}')
})

test('the log should take the default level from the environment', function (t) {
  process.env.LOG_LEVEL = 'error'
  var log = Log({}, { log: t.context.log })
  log.warn('test', { value: 'x' })
  log.error('test', { value: 'hi' })
  t.context.stdout.should.equal('[error] test {"value":"hi"}')
})

test('the log level should override the environment value', function (t) {
  process.env.LOG_LEVEL = 'error'
  var log = Log({}, { level: 'warn', log: t.context.log })
  log.warn('test', { value: 'x' })
  log.error('test', { value: 'hi' })
  t.context.stdout.should.equal('[warn] test {"value":"x"}[error] test {"value":"hi"}')
})

test('the log should include default properties with all messages', function (t) {
  var log = Log({ default: 'v' }, { log: t.context.log })
  log.error('test', { value: 'hi' })
  t.context.stdout.should.equal('[error] test {"default":"v","value":"hi"}')
})

test('the log should default unknown levels to debug', function (t) {
  var log = Log({}, { level: 'catastrophic', log: t.context.log })
  log.debug('test', { value: 'hi' })
  t.context.stdout.should.equal('[debug] test {"value":"hi"}')
})

test('the log should initialize with appropriate defaults', function (t) {
  process.env.LOG_LEVEL = 'error'
  var log = Log()
  log.debug('test', { pass: true })
})