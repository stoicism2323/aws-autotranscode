/*
 * Copyright (C) 2016 Sami Pippuri
 * HYBE Media Oy
 * See LICENSE for the copy of MIT license
*/

// BEGIN Lambda configuration
//

var pipelineId = '1471198221620-ny3nc6';

// AWS elastic transcoder presets
var video480 = '1351620000001-200020';
var audio = '1351620000001-200071';
var video = '1351620000001-200045';
var video1M = '1351620000001-200035';
var video1pM = '1351620000001-200025';
var video2M = '1351620000001-200015';

// configure your prefix or set as '' to put files to root of the bucket
var prefix = '';

// change these to match your S3 setup
// note: transcoder is picky about characters in the metadata
var targetBucket = 'erichpicresized';
var sourceBucket = 'erichpic';
var copyright = '';

// BEGIN Lambda code
console.log('Loading function');

var aws = require('aws-sdk');
var s3 = new aws.S3();

var eltr = new aws.ElasticTranscoder({
    region: 'us-west-2' // change to your region
});

exports.handler = function(event, context) {
  console.log('Received event:', JSON.stringify(event, null, 2));
  // Get the object from the event and show its content type
  var bucket = event.Records[0].s3.bucket.name;
  var key = event.Records[0].s3.object.key;

  console.log('got key: ' + key.toString());
      // Infer the image type.
  var typeMatch = key.match(/\.([^.]*)$/);
  if (!typeMatch) {
    callback("Could not determine the image type.");
    return;
  }
  var imageType = typeMatch[1];
  if (imageType != "mp4" && imageType != "png") {
    callback('Unsupported image type: ${imageType}');
    return;
  }

/*
  var index = key.indexOf('/');
  if(index < 1) {
      context.fail('this wasnt in a path with ID')
      return
  } 
  key = key.substr(0,index) + '/manifest.json'
  */
  console.log('Requesting video in', bucket, 'key', key)
    
   
  sendVideoToET(key, function(err) {
    if (err) {
      context.fail(err)
    } else {
      context.succeed();
    }
  }); 
};



function sendVideoToET(vidFile, callback){
  console.log('sendVideoToET()', vidFile)
  var key = vidFile;
  var params = {
    PipelineId: pipelineId,
   //OutputKeyPrefix: prefix + '/',
    Input: {
      Key: key,
      FrameRate: 'auto',
      Resolution: 'auto',
      AspectRatio: 'auto',
      Interlaced: 'auto',
      Container: 'auto'
    },
    Outputs: [
        {
          Key: vidFile + video480 + '_mp4',
          PresetId: video480,
          Rotate: 'auto'
        }
        
    ],
    UserMetadata: {
      copyright: copyright
    }
    
  };
  console.log('Sending ', params,' to ET', eltr);
  eltr.createJob(params, function (err, data) {
    if (err) {
      console.log('Failed to send new video ' + key + ' to ET');
      console.log(err);
      console.log(err.stack)
      callback("Error creating job: " + err);
    } else {
      console.log('job submitted!')
      console.log(data);
      //thumbnail(manifest, callback);
    }
  });
}
