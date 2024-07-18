const assign = require('object-assign')
const chalk = require('chalk')
const stringify = require('json-stringify-safe')
const util = require('util')

const levels = {
  debug: chalk.gray.bold,
  info: chalk.blue.bold,
  warn: chalk.yellow.bold,
  error: chalk.red.bold
}

const installed = []
const installable = [ 'debug', 'info', 'warn', 'error', 'log' ]
const originals = installable.map((fn) => console[fn])

// TODO: patch npm://debug, util.debuglog

module.exports = function (defaults, options) {
  defaults = defaults || {}
  options = options || {}

  const llevel = options.level || process.env.SMPLOG_LEVEL || 'info'
  const llevels = Object.keys(levels)

  let LOG_LEVEL = llevel === 'none'
    ? llevels.length
    : llevels.indexOf(llevel)

  if (LOG_LEVEL < 0) LOG_LEVEL = 1

  const color = options.color !== false && String(process.env.SMPLOG_COLORS) !== 'false'
  const meta = options.meta !== false && String(process.env.SMPLOG_META) !== 'false'
  const timestamps = options.timestamps || process.env.SMPLOG_TIMESTAMPS
  const timekey = options.timekey

  const llength = Math.max(...llevels.map((l) => l.length))
  const colorize = (colorizer, str) => color ? colorizer(str) : str
  const write = function ({ timestamp, severity, message, payload = {} }) {
    // Ignore if below log level
    if (llevels.indexOf(severity) < LOG_LEVEL) return

    // Start with timestamp if enabled
    const line = timestamps ? [ `${colorize(chalk.gray, new Date(timestamp || Date.now()).toISOString())}` ] : []

    // Include severity
    line.push(colorize(levels[severity], `[${severity}]`.padEnd(llength + 2)))

    // Include message (indenting newlines if present)
    const str = typeof message === 'string' ? message : util.inspect(message)
    const split = str.split('\n')
    const [ head, ...multilines ] = split.map((s, i) => i ? `  ${s}` : s)
    line.push(head)

    // Log payload
    meta &&
      Object.keys(payload).length &&
      line.push(colorize(chalk.gray.dim, 'smplog::' + stringify(payload)))

    if (multilines.length) {
      line.push(`\n${multilines.join('\n')}`)
    }

    // Send all but info to stderr to keep stdout clean
    const stream = severity === 'info' ? process.stdout : process.stderr
    return stream.write(line.join(' ') + '\n')
  }

  const logger = {
    tags: defaults,
    tag: (meta) => assign(defaults, meta),
    withTags: (meta) => module.exports({ ...defaults, ...meta }, options),
    install: () => {
      installed.push(logger)
      installable.forEach((fn) => console[fn] = logger[fn])
      return logger
    },
    uninstall: () => {
      installed.pop()
      installed.length
        ? installed.pop().install()
        : installable.forEach((name, i) => console[name] = originals[i])
      return logger
    },
    none: () => {}
  }

  const log = ({ payload, ...msg }) => {
    const meta = assign({}, defaults, payload)
    return options.log
      ? options.log({ ...msg, payload: meta }, write)
      : write({ ...msg, payload: meta })
  }

  llevels.forEach((severity) => {
    logger[severity] = function (...args) {
      const formats = typeof args[0] === 'string'
        ? args[0].split(/[^%]%[sdifjoOc]/g)
        : []

      const consumed = formats.length

      const payload = (args.length > consumed
        && typeof args[args.length - 1] === 'object'
        && !(args[args.length - 1] instanceof Error))
        ? args.pop() : {}

      if (args.length === 1 && args[0] instanceof Error) {
        const key = severity === 'warn' ? 'warning' : 'error'
        payload[key] = payload[key] || args[0]
      }

      const message = util.format(...args)

      const timestamp = timekey && payload[timekey]

      return log({ timestamp, severity, message, payload })
    }
  })

  logger.log = logger.info

  return logger
}
