CP = require 'child_process'

exports.task = (task) ->

  task.id = 'test'

  task.description = """
  Run tests.
  """

  task.usage = ''


  task.init = (api, args) ->
    args.testExec = api.path().append('node_modules/.bin/mocha')
    args.testDir  = api.path().append('test')

  task.q 'run_tests', (api, args) ->
    return new Promise (resolve) ->
      exec    = args.testExec.toString()
      dir     = args.testDir.toString()
      proc    = CP.spawn('node', [exec, '--colors', '--recursive', dir])
      proc.stdout.pipe(process.stdout)
      proc.stderr.pipe(process.stderr)
      proc.on('close', resolve)
