module.exports = init

var Emitter = require('events').EventEmitter
  , Primus = require('primus')
  , PrimusEmitter = require('primus-emitter')
  , Socket = Primus.createSocket(
      { transformer: 'websockets'
      , parser: 'JSON'
      , plugin: { emitter: PrimusEmitter }
      , pathname: '/control'
      })

function init(callback) {
  callback(null, 'kinemoticam', Kinemoticam)
}

function Kinemoticam(automait, logger, config) {
  Emitter.call(this)
  this.automait = automait
  this.logger = logger
  this.config = config
  this.client = new Socket(config.connString)
  this.face = { lastSeen: null, emitted: false }
}

Kinemoticam.prototype = Object.create(Emitter.prototype)

Kinemoticam.prototype.init = function () {
  startListening.call(this)
}

function startListening() {
  this.client.on('motion', function () {
    this.emit('motion')
  }.bind(this))

  this.client.on('face', function () {
    var now = (new Date()).getTime()
      , faceConfirmed = this.face.lastSeen && now - this.face.lastSeen <= 3000
      , timeoutReached = !this.face.emitted || this.face.lastSeen && now - this.face.lastSeen >= 5000

    if (timeoutReached) {
      this.face.emitted = false
    }

    if (faceConfirmed && timeoutReached) {
      this.emit('face')
      this.face.emitted = true
    }

    this.face.lastSeen = now
  }.bind(this))
}
