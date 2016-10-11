var assign = require('object-assign')
var chalk = require('chalk')

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

  var logger = {}
  levels.forEach((l, i) => {
    logger[l] = function (msg, details) {
      if (i >= LOG_LEVEL) {
        if (color) {
          if (meta) log(`%s %s %s`, colors[i](`[${l}]`), msg, chalk.dim(JSON.stringify(assign({}, defaults, details))))
          else log(`%s %s`, colors[i](`[${l}]`), msg)
        } else {
          if (meta) log(`%s %s %s`, `[${l}]`, msg, JSON.stringify(assign({}, defaults, details)))
          else log(`%s %s`, `[${l}]`, msg)
        }
      }
    }
  })
  return logger
}
