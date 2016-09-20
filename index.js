var assign = require('object-assign')

var levels = [ 'debug', 'info', 'warn', 'error', 'none' ]

module.exports = function (defaults, options) {
  defaults = defaults || {}
  options = options || {}

  var LOG_LEVEL = levels.indexOf(options.level || process.env.LOG_LEVEL || 'debug')
  if (LOG_LEVEL < 0) LOG_LEVEL = 0

  var log = options.log || console.log

  var logger = {}
  levels.forEach((l, i) => {
    logger[l] = function (msg, meta) {
      if (i >= LOG_LEVEL) {
        log(`[%s] %s %j`, l, msg, assign({}, defaults, meta))
      }
    }
  })
  return logger
}
