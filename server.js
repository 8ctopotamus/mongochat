const mongo = require('mongodb').MongoClient
const client = require('socket.io').listen(4000).sockets

// Connect to mongo
mongo.connect('mongodb://127.0.0.1/mongochat', function(err, db) {
  // catch any errors
  if (err) { throw err }

  console.log('MongoDB connected...')

  // connect to socket.io
  client.on('connection', function(socket) {
    let chat = db.collection('chats')

    // create function to send status
    sendStatus = function(s) {
      socket.emit('status', s)
    }

    // get chats from mongo collection
    chat.find().limit(100).sort({ id: 1 }).toArray(function(err, res) {
      if (err) { throw err }
      // emit the messages
      socket.emit('output', res)
    })

    // handle input events
    socket.on('input', function(data) {
      let name = data.name
      let message = data.message

      // check for name and message
      if ( name == '' || message == '') {
        sendStatus('Please enter a name and message')
      } else {
        // insert message
        chat.insert({name: name, message: message}, function() {
          client.emit('output', [data])
          sendStatus({
            message: 'Message sent',
            clear: true
          })
        })
      }
    })

    // handle clear messages
    socket.on('clear', function(data) {
      // remove all chats from collection
      chat.remove({}, function() {
        // emit cleared
        socket.emit('cleared')
      })
    })

  })
})
