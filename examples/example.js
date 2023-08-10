'use strict'
const Docker = require('..').Docker

const promisifyStream = (stream) => new Promise((resolve, reject) => {
  stream.on('data', (d) => console.log(d.toString()))
  stream.on('end', resolve)
  stream.on('error', reject)
})

const docker = new Docker({ socketPath: '/var/run/docker.sock' })
let _container

docker.container.create({
  Image: 'ubuntu',
  Cmd: [ '/bin/bash', '-c', 'tail -f /var/log/bootstrap.log' ],
  name: 'test'
})
  .then((container) => {
    console.log('Created container successfully')
    return container.start()
  })
  .then((container) => {
    console.log('Start container successfully')
    console.log('Execute `echo test`')
    _container = container
    return container.exec.create({
      AttachStdout: true,
      AttachStderr: true,
      Cmd: [ 'echo', 'test' ]
    })
  })
  .then((exec) => {
    return exec.start({ Detach: false })
  })
  .then((stream) => promisifyStream(stream))
  .then(() => {
    console.log('Kill container successfully')
    _container.kill()
  }).then(() => {
    console.log('Deleting container...')
    setTimeout(() => {
      _container.delete()
      console.log('Remove container successfully')
    }, 3000)
  })
  .catch((error) => console.log(error))
