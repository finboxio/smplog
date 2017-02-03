var assign = require('object-assign')
var chalk = require('chalk')
var stringify = require('json-stringify-safe')

var levels = [ 'debug', 'info', 'warn', 'error', 'none' ]
var colors = [ chalk.gray.bold, chalk.blue.bold, chalk.yellow.bold, chalk.red.bold, chalk.black.bold ]

module.exports = function (defaults, options) {
  defaults = defaults || {}
  options = options || {}

  var LOG_LEVEL = levels.indexOf(options.level || process.env.SMPLOG_LEVEL || 'debug')
  if (LOG_LEVEL < 0) LOG_LEVEL = 0

  var log = options.log || console.log
  var color = options.color !== false && String(process.env.SMPLOG_COLORS) !== 'false'
  var meta = options.meta !== false && String(process.env.SMPLOG_META) !== 'false'

  var logger = {
    tags: defaults,
    tag: (meta) => assign(defaults, meta)
  }

  var llength = Math.max(...levels.map((l) => l.length))
  levels.forEach((l, i) => {
    var lformat = [ '%s', ...(new Array(llength - l.length).map((k) => '')) ].join(' ')
    logger[l] = function (msg, details) {
      const err = {}
      if (msg instanceof Error) { err[l === 'warn' ? 'warning' : 'error'] = msg }
      if (i >= LOG_LEVEL) {
        if (color) {
          if (meta) log(`${lformat} %s %s`, colors[i](`[${l}]`), msg, chalk.gray.dim(stringify(assign({}, err, defaults, details))))
          else log(`${lformat} %s`, colors[i](`[${l}]`), msg)
        } else {
          if (meta) log(`${lformat} %s %s`, `[${l}]`, msg, stringify(assign({}, err, defaults, details)))
          else log(`${lformat} %s`, `[${l}]`, msg)
        }
      }
    }
  })
  return logger
}
