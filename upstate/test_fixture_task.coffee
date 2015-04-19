
exports.task = (task) ->

  task.id = 'test_fixture'

  task.description = """
  A test fixture for testing upstate itself.
  """

  task.usage = 'a usage string'

  task.options =
    req:
      alias    : 'r'
      describe : 'A required argument'
      required : yes
    bool:
      alias    : 'b'
      describe : 'A boolean argument'


  task.init = (API, args) ->
    args.args = Object.create(null)
    args.API  = Object.create(null)
    args.init_called = yes


  task.q 'check_args_config', (API, args) ->
    args.args.environment =
      type : typeof args.environment
      val  : args.environment

    args.args.config =
      type : typeof args.config
      val  : args.config

    return args


  task.q 'check_options', (API, args) ->
    args.args.options =
      req:
        type : typeof args.req
        val  : args.req
      bool:
        type : typeof args.bool
        val  : args.bool
    return args


  task.q 'check_args_user_data', (API, args) ->
    args.args.user_data =
      type : typeof args.user_data
      val  : args.user_data


  task.q 'check_api_path', (API, args) ->
    args.API.path =
      type  : typeof API.path
      value : API.path()
      attributes:
        root:
          type : typeof API.path.root
          val  :  API.path.root()
        datename:
          type : typeof API.path.datename
          val  : API.path.datename()
        expand:
          type : typeof API.path.expand
          val  : API.path.expand('~/Documents')

    return args


  task.q 'check_args_directory', (API, args) ->
    args.args.directory =
      type : typeof args.directory
      val  : args.directory
    return args


  task.q 'check_git_configs', (API, args) ->
    args.args.git_config = args.git_config
    return args


  task.q 'check_api_template_path', (API, args) ->
    args.API.template_path =
      type: typeof API.template_path
    return args


  task.q 'check_api_shell', (API, args) ->
    args.API.shell =
      type: typeof API.shell
    return args


  task.q 'check_api_ssh', (API, args) ->
    args.API.ssh =
      type: typeof API.ssh
    return args


  task.q 'check_api_sftp', (API, args) ->
    args.API.sftp =
      type: typeof API.sftp
    return args


  task.q 'check_api_log', (API, args) ->
    args.API.log =
      type: typeof API.log
      attributes:
        stdout:
          type: typeof API.log.stdout
        stderr:
          type: typeof API.log.stderr


  task.q 'print_json', (API, args) ->
    console.log JSON.stringify(args, null, 2)
    return args
