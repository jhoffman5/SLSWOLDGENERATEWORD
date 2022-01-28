"use strict";
const { GetObjectCommand, PutObjectCommand, S3Client } = require('@aws-sdk/client-s3')
const client = new S3Client() // Pass in opts to S3 if necessary
const bucket = "w3.hoffmanjoshua.net";
//const dictFile = "wordl/dictionaryTree.json"

module.exports.generate = async (event) => {
  try{
    var length = parseInt(event.pathParameters.length);

    var dictFile = `wordl/guess${length}LetterWordsTree.json`

    const dictJSON = JSON.parse(await getObject(bucket, dictFile));

    var word = '';
    var isWordComplete = false;

    var possibleBranches = dictJSON;
    while(!isWordComplete)
    {
      var keys = Object.keys(possibleBranches);
      
      var nextLetter = keys[Math.floor(Math.random()*keys.length)];
      
      word += nextLetter;

      if(possibleBranches[nextLetter] == true)
      {
        isWordComplete = true;
      }
      else
      {
        var nextBranches = possibleBranches[nextLetter];
        possibleBranches = nextBranches;
      }
    }

    const response = await putObject(bucket, `wordl/${length}LetterWordOfTheDay.txt`, word);

    return {
      statusCode: 200,
      body: JSON.stringify(
        {
          message: "Word successfully generated!",
          input: event
        },
        null,
        2
      ),
    };
  } catch(e)
  {
    return {
      statusCode: 500,
      body: JSON.stringify(
        {
          message: "Internal Server Error: " + e.message,
          input: event
        },
        null,
        2
      )
    }
  }
};

function getObject (Bucket, Key) {
  return new Promise(async (resolve, reject) => {
    const getObjectCommand = new GetObjectCommand({ Bucket, Key });

    try {
      const response = await client.send(getObjectCommand);
  
      // Store all of data chunks returned from the response data stream 
      // into an array then use Array#join() to use the returned contents as a String
      let responseDataChunks = [];

      // Handle an error while streaming the response body
      response.Body.once('error', err => reject(err));
  
      // Attach a 'data' listener to add the chunks of data to our array
      // Each chunk is a Buffer instance
      response.Body.on('data', chunk => responseDataChunks.push(chunk));
  
      // Once the stream has no more data, join the chunks into a string and return the string
      response.Body.once('end', () => resolve(responseDataChunks.join('')));
    } catch (err) {
      // Handle the error or throw
      return reject(err)
    } 
  })
}

function putObject (Bucket, Key, Body) {
  return new Promise(async (resolve, reject) => {
    const putObjectCommand = new PutObjectCommand({ Bucket, Key, Body});

    try {
      const response = await client.send(putObjectCommand);
      return resolve();
    } catch (err) {
      // Handle the error or throw
      return reject(err);
    } 
  });
}
