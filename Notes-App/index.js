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

app.get('/api/notes/:id', (request, response) => {
  
  Note.findById(request.params.id).then(note => {
    response.json(note);
  })
});

app.delete('/api/notes/:id', (request, response) => {
  Note.findByIdAndDelete(request.params.id)
    .then(deletedNote => {
      if (deletedNote) {
        response.json({ message: 'Note successfully deleted' });
      } else {
        response.status(400).json({ error: 'Note has already been deleted from server'})
      }
    })
    .catch(error => {
      response.status(400).json({ error: "Can't delete the note right now. Please try again later" })
    })
  
});

app.post('/api/notes', (request, response) => {
  
  const body = request.body;

  if (!body.content) {
    return response.status(400).json({
      error: 'Content missing. Please enter your note'
      });
  };

  const note = new Note ({
    content: body.content,
    important: body.important || false,
  });

  note.save().then(savedNote => {
    response.json(savedNote);
  })

}); 

app.use(unknownEndpoint);

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
