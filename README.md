# smplog

##### A simple logging module to stdout. Machine and human readable.

Smplog does nothing but provide a simple, standard api for generating human-readable log lines that can be enriched with machine-parseable json metadata. It's primarily intended for use-cases where you have an external log aggregator (e.g. docker + ELK/fluentd/etc) and want effortless log analytics, but also easy-to-understand live tails. Smplog makes the assumption that log routing is beyond the scope of your application's responsibility and thus does not support multi-transport routing, or destinations other than stdout.

Smplog messages are written in the following format:

`[${level}] ${message} ${metadata.json}`

Easy to read, easy to determine severity, easy to include relevant metadata.

Smplog supports 4 different log levels: `info`, `debug`, `warn`, and `error`. To suppress messages below a certain level, you can initialize your log with a particular level, or set `process.env.LOG_LEVEL` globally.

### Usage

```
var Log = require('smplog')
var log = Log()
log.info('this is a standard info message', { tag: 'info-message' })

=====

[info] this is a standard info message {"tag":"info-message"}
```

#### Defaults
You can initialize a log instance with default tags that will be included in the json portion of each message written by that log:

```
var log = Log({ request_id: 'bea91083fa003d' })
log.info(`request started at ${Date.now()}`)

=====

[info] request started at 1474397320662 {"request_id":"bea91083fa003d"}
```

#### Tags
Defaults can be added to a logger after initialization by tagging it:

```
var log = Log()
log.tag({ tag_name: 'tag' })
log.info('tagged message')

// log.tags === { tag_name: 'tag' }

=====

[info] tagged message {"tag_name":"tag"}

```

#### Options
You can also pass options into the log constructor to overwrite the default log level or log output function:

```
var log = Log({ tag: 'errors' }, { level: 'error', log: console.log })
```

> **Note**
>
> The `log` property is exposed primarily for testing. Smplog isn't intended to be used with alternative transports. If you want something more complex, there are lots of great fully-featured logging libraries on npm.


