var assign = require('object-assign')
var chalk = require('chalk')

var levels = [ 'debug', 'info', 'warn', 'error', 'none' ]
var colors = [ chalk.gray.bold, chalk.blue.bold, chalk.yellow.bold, chalk.red.bold, chalk.black.bold ]

module.exports = function (defaults, options) {
  defaults = defaults || {}
  options = options || {}

  var LOG_LEVEL = levels.indexOf(options.level || process.env.LOG_LEVEL || 'debug')
  if (LOG_LEVEL < 0) LOG_LEVEL = 0

  var log = options.log || console.log
  var color = options.color !== false && String(process.env.LOG_COLORS) !== 'false'

  var logger = {}
  levels.forEach((l, i) => {
    logger[l] = function (msg, meta) {
      if (i >= LOG_LEVEL) {
        if (color) {
          log(`%s %s %s`, colors[i](`[${l}]`), msg, chalk.gray(JSON.stringify(assign({}, defaults, meta))))
        } else {
          log(`%s %s %s`, `[${l}]`, msg, JSON.stringify(assign({}, defaults, meta)))
        }
      }
    }
  })
  return logger
}
