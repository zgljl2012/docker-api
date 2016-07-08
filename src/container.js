'use strict'

class ContainerFs {
  constructor (modem, container) {
    this.modem = modem
    this.container = container
  }

  /*
   * Get the info about the filesystem of the container
   * https://docs.docker.com/engine/reference/api/docker_remote_api_v1.24/#/retrieving-information-about-files-and-folders-in-a-container
   *
   * @param  {String}   id    ID of the container to inspect, if it's not set, use the id of the object (optional)
   * @return {Promise}        Promise returning the info about the filesystem
   */
  info (id) {
    [ _, id ] = this.__processArguments(id)

    const call = {
      path: `/containers/${id}/archive`,
      method: 'HEAD',
      options: opts,
      statusCodes: {
        200: true,
        404: 'bad request',
        500: 'server error'
      }
    }

    return new Promise((resolve, reject) => {
      this.modem.dial(call, (err, info) => {
        if (err) return reject(err)
        resolve(info)
      })
    })
  }

  /*
   * Get a tar archive of a resource in the filesystem of a container
   * https://docs.docker.com/engine/reference/api/docker_remote_api_v1.24/#/get-an-archive-of-a-filesystem-resource-in-a-container
   *
   * @param  {Object}   opts  Query params in the request (optional)
   * @param  {String}   id    ID of the container to inspect, if it's not set, use the id of the object (optional)
   * @return {Promise}        Promise returning the result as a stream to the tar file
   */
  get (opts, id) {
    [ opts, id ] = this.__processArguments(opts, id)

    const call = {
      path: `/containers/${id}/archive`,
      method: 'GET',
      options: opts,
      statusCodes: {
        200: true,
        400: 'bad request',
        404: 'no such container',
        500: 'server error'
      }
    }

    return new Promise((resolve, reject) => {
      this.modem.dial(call, (err, stream) => {
        if (err) return reject(err)
        resolve(stream)
      })
    })
  }

  /*
   * Put an extracted tar archive in the filesystem of a container
   * https://docs.docker.com/engine/reference/api/docker_remote_api_v1.24/#/extract-an-archive-of-files-or-folders-to-a-directory-in-a-container
   *
   * @param  {Object}   opts  Query params in the request (optional)
   * @param  {String}   id    ID of the container to inspect, if it's not set, use the id of the object (optional)
   * @return {Promise}        Promise returning the result as a stream to the tar file
   */
  put (opts, id) {
    [ opts, id ] = this.__processArguments(opts, id)

    const call = {
      path: `/containers/${id}/archive`,
      method: 'PUT',
      options: opts,
      statusCodes: {
        200: true,
        400: 'bad request',
        403: 'permission denied',
        404: 'no such container',
        500: 'server error'
      }
    }

    return new Promise((resolve, reject) => {
      this.modem.dial(call, (err, res) => {
        if (err) return reject(err)
        resolve(res)
      })
    })
  }

  __processArguments (opts, id) {
    if (typeof opts === "string" && !id) {
      id = opts
    }
    if (!opts && !id) {
      id = this.container.id
    }
    return { opts, id }
  }
}

export default class Container {
  constructor (modem, id) {
    this.modem = modem
    this.id = id
    this.fs = new ContainerFs(modem, this)
  }

  /*
   * Get the list of containers
   * https://docs.docker.com/engine/reference/api/docker_remote_api_v1.24/#/list-containers
   *
   * @param  {Object}   opts  Query params in the request (optional)
   * @return {Promise}        Promise returning the result as a list of containers
   */
  list (opts) {
    const call = {
      path: '/containers/json',
      method: 'GET',
      options: opts,
      statusCodes: {
        200: true,
        400: 'bad request',
        500: 'server error'
      }
    }

    return new Promise((resolve, reject) => {
      this.modem.dial(call, (err, containers) => {
        if (err) return reject(err)
        resolve(containers.map((conf) => {
          let container = new Container(this.modem, conf.Id)
          return Object.assign(container, conf)
        }))
      })
    })
  }

  /*
   * Create a container
   * https://docs.docker.com/engine/reference/api/docker_remote_api_v1.24/#/create-a-container
   *
   * @param  {Object}   opts  Query params in the request (optional)
   * @return {Promise}        Promise return the new container
   */
  create (opts) {
    const call = {
      path: '/containers/json',
      method: 'GET',
      options: opts,
      statusCodes: {
        200: true,
        400: 'bad request',
        404: 'no such container',
        406: 'impossible to attach',
        500: 'server error'
      }
    }

    return new Promise((resolve, reject) => {
      this.modem.dial(call, (err, conf) => {
        if (err) return reject(err)
        let container = new Container(this.modem, conf.Id)
        resolve(Object.assign(container, conf))
      })
    })
  }

  /*
   * Get low-level information on a container
   * https://docs.docker.com/engine/reference/api/docker_remote_api_v1.24/#/inspect-a-container
   *
   * @param  {Object}   opts  Query params in the request (optional)
   * @param  {String}   id    ID of the container to inspect, if it's not set, use the id of the object (optional)
   * @return {Promise}        Promise return the new container
   */
  inspect (opts, id) {
    [ opts, id ] = this.__processArguments(opts, id)

    const call = {
      path: `/containers/${id}/json`,
      method: 'GET',
      options: opts,
      statusCodes: {
        200: true,
        404: 'no such container',
        500: 'server error'
      }
    }

    return new Promise((resolve, reject) => {
      this.modem.dial(call, (err, conf) => {
        if (err) return reject(err)
        let container = new Container(this.modem, id)
        resolve(Object.assign(container, conf))
      })
    })
  }

  /*
   * Get list of processes (ps) inside a container. Not supported in Windows.
   * https://docs.docker.com/engine/reference/api/docker_remote_api_v1.24/#/list-processes-running-inside-a-container
   *
   * @param  {Object}   opts  Query params in the request (optional)
   * @param  {String}   id    ID of the container to inspect, if it's not set, use the id of the object (optional)
   * @return {Promise}        Promise return the list of processes
   */
  top (opts, id) {
    [ opts, id ] = this.__processArguments(opts, id)

    const call = {
      path: `/containers/${id}/top`,
      method: 'GET',
      options: opts,
      statusCodes: {
        200: true,
        404: 'no such container',
        500: 'server error'
      }
    }

    return new Promise((resolve, reject) => {
      this.modem.dial(call, (err, processes) => {
        if (err) return reject(err)
        resolve(processes)
      })
    })
  }

  /*
   * Get stdout and stderr logs from a container
   * https://docs.docker.com/engine/reference/api/docker_remote_api_v1.24/#/get-container-logs
   *
   * @param  {Object}   opts  Query params in the request (optional)
   * @param  {String}   id    ID of the container to inspect, if it's not set, use the id of the object (optional)
   * @return {Promise}        Promise returning the concatenated logs
   */
  logs (opts, id) {
    [ opts, id ] = this.__processArguments(opts, id)

    const call = {
      path: `/containers/${id}/logs`,
      method: 'GET',
      options: opts,
      statusCodes: {
        101: true,
        200: true,
        404: 'no such container',
        500: 'server error'
      }
    }

    return new Promise((resolve, reject) => {
      this.modem.dial(call, (err, logs) => {
        if (err) return reject(err)
        resolve(logs)
      })
    })
  }

  /*
   * Get changes on a container's filesystem
   * https://docs.docker.com/engine/reference/api/docker_remote_api_v1.24/#/inspect-changes-on-a-container-s-filesystem
   *
   * @param  {String}   id    ID of the container to inspect, if it's not set, use the id of the object (optional)
   * @return {Promise}        Promise returning the changes
   */
  changes (id) {
    [ _, id ] = this.__processArguments(id)

    const call = {
      path: `/containers/${id}/changes`,
      method: 'GET',
      options: opts,
      statusCodes: {
        200: true,
        404: 'no such container',
        500: 'server error'
      }
    }

    return new Promise((resolve, reject) => {
      this.modem.dial(call, (err, changes) => {
        if (err) return reject(err)
        resolve(changes)
      })
    })
  }

  /*
   * Export the content of a container
   * https://docs.docker.com/engine/reference/api/docker_remote_api_v1.24/#/export-a-container
   *
   * @param  {Object}   opts  Query params in the request (optional)
   * @param  {String}   id      ID of the container to inspect, if it's not set, use the id of the object (optional)
   * @return {Promise}          Promise returning the content of the tar file as a stream or as a string
   */
  export (opts, id) {
    [ opts, id ] = this.__processArguments(opts, id)

    const call = {
      path: `/containers/${id}/export`,
      method: 'GET',
      options: opts,
      statusCodes: {
        200: true,
        404: 'no such container',
        500: 'server error'
      }
    }

    return new Promise((resolve, reject) => {
      this.modem.dial(call, (err, tarStream) => {
        if (err) return reject(err)
        if (opts.stream) return resolve(tarStream)
        
        let res = []
        tarStream.on('data', (chunk) => {
          res.push(chunk.toString())
        })
        
        tarStream.on('end', () => {
          resolve(res.join(''))
        })
      })
    })
  }

  /*
   * Get the stats of a container, either by a live stream or the current state
   * https://docs.docker.com/engine/reference/api/docker_remote_api_v1.24/#/export-a-container
   *
   * @param  {Object}   opts  Query params in the request (optional)
   * @param  {String}   id      ID of the container to inspect, if it's not set, use the id of the object (optional)
   * @return {Promise}          Promise returning the stats, in a stream or string
   */
  stats (opts, id) {
    [ opts, id ] = this.__processArguments(opts, id)

    const call = {
      path: `/containers/${id}/export`,
      method: 'GET',
      options: opts,
      statusCodes: {
        200: true,
        404: 'no such container',
        500: 'server error'
      }
    }

    return new Promise((resolve, reject) => {
      this.modem.dial(call, (err, stats) => {
        if (err) return reject(err)
        resolve(stats)
      })
    })
  }

  /*
   * Resize the TTY for a container. You must restart the container to make the resize take effect.
   * https://docs.docker.com/engine/reference/api/docker_remote_api_v1.24/#/resize-a-container-tty
   *
   * @param  {Object}   opts  Query params in the request (optional)
   * @param  {String}   id      ID of the container to inspect, if it's not set, use the id of the object (optional)
   * @return {Promise}          Promise returning the response
   */
  resize (opts, id) {
    [ opts, id ] = this.__processArguments(opts, id)

    const call = {
      path: `/containers/${id}/resize`,
      method: 'GET',
      options: opts,
      statusCodes: {
        200: true,
        404: 'no such container',
        500: 'server error'
      }
    }

    return new Promise((resolve, reject) => {
      this.modem.dial(call, (err, res) => {
        if (err) return reject(err)
        resolve(res)
      })
    })
  }

  /*
   * Start a container
   * https://docs.docker.com/engine/reference/api/docker_remote_api_v1.24/#/start-a-container
   *
   * @param  {Object}   opts  Query params in the request (optional)
   * @param  {String}   id      ID of the container to inspect, if it's not set, use the id of the object (optional)
   * @return {Promise}          Promise returning the response
   */
  start (opts, id) {
    [ opts, id ] = this.__processArguments(opts, id)

    const call = {
      path: `/containers/${id}/start`,
      method: 'POST',
      options: opts,
      statusCodes: {
        204: true,
        304: true,
        404: 'no such container',
        500: 'server error'
      }
    }

    return new Promise((resolve, reject) => {
      this.modem.dial(call, (err) => {
        if (err) return reject(err)
        resolve()
      })
    })
  }

  /*
   * Stop a container
   * https://docs.docker.com/engine/reference/api/docker_remote_api_v1.24/#/stop-a-container
   *
   * @param  {Object}   opts  Query params in the request (optional)
   * @param  {String}   id      ID of the container to inspect, if it's not set, use the id of the object (optional)
   * @return {Promise}          Promise returning the response
   */
  stop (opts, id) {
    [ opts, id ] = this.__processArguments(opts, id)

    const call = {
      path: `/containers/${id}/stop`,
      method: 'POST',
      options: opts,
      statusCodes: {
        204: true,
        304: true,
        404: 'no such container',
        500: 'server error'
      }
    }

    return new Promise((resolve, reject) => {
      this.modem.dial(call, (err) => {
        if (err) return reject(err)
        resolve()
      })
    })
  }

  /*
   * Restart a container
   * https://docs.docker.com/engine/reference/api/docker_remote_api_v1.24/#/restart-a-container
   *
   * @param  {Object}   opts  Query params in the request (optional)
   * @param  {String}   id      ID of the container to inspect, if it's not set, use the id of the object (optional)
   * @return {Promise}          Promise returning the response
   */
  restart (opts, id) {
    [ opts, id ] = this.__processArguments(opts, id)

    const call = {
      path: `/containers/${id}/restart`,
      method: 'POST',
      options: opts,
      statusCodes: {
        204: true,
        404: 'no such container',
        500: 'server error'
      }
    }

    return new Promise((resolve, reject) => {
      this.modem.dial(call, (err) => {
        if (err) return reject(err)
        resolve()
      })
    })
  }

  /*
   * Kill a container
   * https://docs.docker.com/engine/reference/api/docker_remote_api_v1.24/#/kill-a-container
   *
   * @param  {Object}   opts  Query params in the request (optional)
   * @param  {String}   id      ID of the container to inspect, if it's not set, use the id of the object (optional)
   * @return {Promise}          Promise returning the response
   */
  kill (opts, id) {
    [ opts, id ] = this.__processArguments(opts, id)

    const call = {
      path: `/containers/${id}/kill`,
      method: 'POST',
      options: opts,
      statusCodes: {
        204: true,
        404: 'no such container',
        500: 'server error'
      }
    }

    return new Promise((resolve, reject) => {
      this.modem.dial(call, (err) => {
        if (err) return reject(err)
        resolve()
      })
    })
  }

  /*
   * Update configuration a container.
   * Docs says you can do it for more than one, but doesn't exaplin how, so let's leave it in only one
   * https://docs.docker.com/engine/reference/api/docker_remote_api_v1.24/#/update-a-container
   *
   * @param  {Object}   opts  Query params in the request (optional)
   * @param  {String}   id      ID of the container to inspect, if it's not set, use the id of the object (optional)
   * @return {Promise}          Promise returning the response
   */
  update (opts, id) {
    [ opts, id ] = this.__processArguments(opts, id)

    const call = {
      path: `/containers/${id}/update`,
      method: 'POST',
      options: opts,
      statusCodes: {
        200: true,
        400: 'bad request',
        404: 'no such container',
        500: 'server error'
      }
    }

    return new Promise((resolve, reject) => {
      this.modem.dial(call, (err, warnings) => {
        if (err) return reject(err)
        resolve(warnings)
      })
    })
  }

  /*
   * Rename a container.
   * https://docs.docker.com/engine/reference/api/docker_remote_api_v1.24/#/rename-a-container
   *
   * @param  {Object}   opts  Query params in the request (optional)
   * @param  {String}   id      ID of the container to inspect, if it's not set, use the id of the object (optional)
   * @return {Promise}          Promise returning the response
   */
  rename (opts, id) {
    [ opts, id ] = this.__processArguments(opts, id)

    const call = {
      path: `/containers/${id}/rename`,
      method: 'POST',
      options: opts,
      statusCodes: {
        204: true,
        404: 'no such container',
        409: 'name already taken',
        500: 'server error'
      }
    }

    return new Promise((resolve, reject) => {
      this.modem.dial(call, (err) => {
        if (err) return reject(err)
        resolve()
      })
    })
  }

  /*
   * Pause a container.
   * https://docs.docker.com/engine/reference/api/docker_remote_api_v1.24/#/pause-a-container
   *
   * @param  {String}   id      ID of the container to inspect, if it's not set, use the id of the object (optional)
   * @return {Promise}          Promise returning the response
   */
  pause (id) {
    [ _, id ] = this.__processArguments(id)

    const call = {
      path: `/containers/${id}/pause`,
      method: 'POST',
      options: opts,
      statusCodes: {
        204: true,
        404: 'no such container',
        500: 'server error'
      }
    }

    return new Promise((resolve, reject) => {
      this.modem.dial(call, (err) => {
        if (err) return reject(err)
        resolve()
      })
    })
  }

  /*
   * Unpause a container.
   * https://docs.docker.com/engine/reference/api/docker_remote_api_v1.24/#/unpause-a-container
   *
   * @param  {String}   id      ID of the container to inspect, if it's not set, use the id of the object (optional)
   * @return {Promise}          Promise returning the response
   */
  unpause (id) {
    [ _, id ] = this.__processArguments(id)

    const call = {
      path: `/containers/${id}/unpause`,
      method: 'POST',
      options: opts,
      statusCodes: {
        204: true,
        404: 'no such container',
        500: 'server error'
      }
    }

    return new Promise((resolve, reject) => {
      this.modem.dial(call, (err) => {
        if (err) return reject(err)
        resolve()
      })
    })
  }

  /*
   * Attach to a container.
   * https://docs.docker.com/engine/reference/api/docker_remote_api_v1.24/#/attach-to-a-container
   *
   * @param  {Object}   opts  Query params in the request (optional)
   * @param  {String}   id      ID of the container to inspect, if it's not set, use the id of the object (optional)
   * @return {Promise}          Promise returning the response
   */
  attach (opts, id) {
    [ opts, id ] = this.__processArguments(opts, id)

    const call = {
      path: `/containers/${id}/attach`,
      method: 'POST',
      options: opts,
      statusCodes: {
        101: true,
        200: true,
        400: 'bad request',
        404: 'no such container',
        500: 'server error'
      }
    }

    return new Promise((resolve, reject) => {
      this.modem.dial(call, (err, stream) => {
        if (err) return reject(err)
        resolve(stream)
      })
    })
  }

  /*
   * Attach to a container using websocket.
   * https://docs.docker.com/engine/reference/api/docker_remote_api_v1.24/#/attach-to-a-container-websocket
   *
   * @param  {Object}   opts  Query params in the request (optional)
   * @param  {String}   id      ID of the container to inspect, if it's not set, use the id of the object (optional)
   * @return {Promise}          Promise returning the response
   */
  wsattach (opts, id) {
    [ opts, id ] = this.__processArguments(opts, id)

    const call = {
      path: `/containers/${id}/attach/ws`,
      method: 'GET',
      options: opts,
      statusCodes: {
        200: true,
        400: 'bad request',
        404: 'no such container',
        500: 'server error'
      }
    }

    return new Promise((resolve, reject) => {
      this.modem.dial(call, (err, stream) => {
        if (err) return reject(err)
        resolve(stream)
      })
    })
  }

  /*
   * Block until a container stops, returning exit code
   * https://docs.docker.com/engine/reference/api/docker_remote_api_v1.24/#/wait-a-container
   *
   * @param  {String}   id      ID of the container to inspect, if it's not set, use the id of the object (optional)
   * @return {Promise}          Promise returning the response
   */
  wait (id) {
    [ _, id ] = this.__processArguments(id)

    const call = {
      path: `/containers/${id}/wait`,
      method: 'POST',
      options: opts,
      statusCodes: {
        200: true,
        404: 'no such container',
        500: 'server error'
      }
    }

    return new Promise((resolve, reject) => {
      this.modem.dial(call, (err, code) => {
        if (err) return reject(err)
        resolve(code)
      })
    })
  }

  /*
   * Remove a container.
   * https://docs.docker.com/engine/reference/api/docker_remote_api_v1.24/#/remove-a-container
   *
   * @param  {Object}   opts  Query params in the request (optional)
   * @param  {String}   id      ID of the container to inspect, if it's not set, use the id of the object (optional)
   * @return {Promise}          Promise returning the response
   */
  delete (opts, id) {
    [ opts, id ] = this.__processArguments(opts, id)

    const call = {
      path: `/containers/${id}`,
      method: 'DELETE',
      options: opts,
      statusCodes: {
        204: true,
        400: 'bad request',
        404: 'no such container',
        500: 'server error'
      }
    }

    return new Promise((resolve, reject) => {
      this.modem.dial(call, (err) => {
        if (err) return reject(err)
        resolve()
      })
    })
  }

  __processArguments (opts, id) {
    if (typeof opts === "string" && !id) {
      id = opts
    }
    if (!opts && !id) {
      id = this.id
    }
    return { opts, id }
  }
}