require('dotenv').config();
const express = require('express');
const app = express();
const Note = require('./models/note');
const mongoose = require('mongoose');

app.use(express.static('dist'));

const requestLogger = (request, response, next) => {
  console.log('Method: ',  request.method);
  console.log('Path: ', request.path);
  console.log('Body: ', request.body);
  console.log('---');
  next() 
};

const cors = require('cors');
app.use(cors());

app.use(express.json());
app.use(requestLogger);

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint'});
};

app.get('/', (request, response) => {
  response.send('<h1>Hello World!</h1>');
});

app.get('/api/notes', (request, response) => {
  Note.find({}).then(notes => {
    response.json(notes);
  });
});

app.get('/api/notes/:id', (request, response, next) => {
  
  Note.findById(request.params.id)
  .then(note => {
    if (note) {
    response.json(note);
    } else {
      response.status(404).json({ error: 'Note has already been deleted from server' }).end();
    }
  })
  .catch(error => next(error))
});

//we don't have delete feature on frontend yet. But it's okay to test out via Postman
app.delete('/api/notes/:id', (request, response, next) => {
  Note.findByIdAndDelete(request.params.id)
    .then(deletedNote => {
     /* if (deletedNote) {
        response.json({ message: 'Note successfully deleted' });
      } else {
        response.status(404).json({ error: 'Note has already been deleted from server'})
      }
       
*/
    response.status(204).end()
    })
    .catch(error => next(error))
     
});

app.post('/api/notes', (request, response, next) => {
  
  const body = request.body;

  const note = new Note ({
    content: body.content,
    important: body.important || false,
  });

  note.save()
   .then(savedNote => {
    response.json(savedNote);
  })
    .catch(error => next(error))

}); 

app.put('/api/notes/:id', (request, response, next) => {
  const { content, important} = request.body;

  Note.findByIdAndUpdate(
    request.params.id,
    { content, important},
    { new: true,
      runValidators: true,
      context: 'query'
     })
    .then(updatedNote => {      
        response.json(updatedNote)
    })
    .catch(error => next(error));
});

app.use(unknownEndpoint);

const errorHandler = (error, request, response, next) => {
  console.error(error.name, error.message);

  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'invalid or malformatted id' });
  }  else if (error.name === 'ValidationError') {
    return response.status(400).send({ error: error.message });
  } else {
    console.log('error is ', error.name, error.message);
   // return response.status(400).send({ error: 'Notes need to have at least 5 characters' });
  }
  next(error);
};

app.use(errorHandler);

// closing mongoose when app is terminated / exited

const closeMongoDatabase = () => {
  console.log('Closing Mongoose connection...');
  mongoose.connection.close()
    .then(() => {
      console.log('Mongoose connection closed');
      process.exit(0);
    })
    .catch(error => {
      console.error('Failed to close Mongoose: ', error);
      process.exit(1);
    })
};

process.on('SIGINT', closeMongoDatabase);
process.on('SIGTERM', closeMongoDatabase);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
});
