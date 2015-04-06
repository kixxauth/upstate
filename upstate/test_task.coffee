CP = require 'child_process'

exports.task = (task) ->

  task.id = 'test'

  task.description = """
  Run JSHint and Mocha tests.
  """

  task.usage = ''


  task.init = (api, args) ->
    args.jshintExec = api.path().append('node_modules/.bin/jshint')
    args.jshintDir  = api.path()
    args.testExec = api.path().append('node_modules/.bin/mocha')
    args.testDir  = api.path().append('test')

  task.q 'js_hint', (api, args) ->
    return new Promise (resolve, reject) ->
      exec    = args.jshintExec.toString()
      dir     = args.jshintDir.toString()
      proc    = CP.spawn('node', [exec, '--exclude', 'node_modules', dir])
      proc.stdout.pipe(process.stdout)
      proc.stderr.pipe(process.stderr)
      proc.on 'close', (code) ->
        if code then return reject(new Error("Failed jshint"))
        return resolve(args)

  task.q 'run_tests', (api, args) ->
    return new Promise (resolve, reject) ->
      exec    = args.testExec.toString()
      dir     = args.testDir.toString()
      proc    = CP.spawn('node', [exec, '--colors', '--recursive', dir])
      proc.stdout.pipe(process.stdout)
      proc.stderr.pipe(process.stderr)
      proc.on 'close', (code) ->
        if code then return reject(new Error("Failed tests"))
        return resolve(args)
