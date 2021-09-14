'use strict';

const HELPER_BASE = process.env.HELPER_BASE || '../../helpers/';
const Response = require(HELPER_BASE + 'response');
const BinResponse = require(HELPER_BASE + 'binresponse');
const TextResponse = require(HELPER_BASE + 'textresponse');

const APIKEY = "【お好きなAPIKey】";

const logfile_list = [
// 参照したいログファイル名の配列
];

const { exec } = require('child_process');
const streamBuffers = require('stream-buffers');
const archiver = require('archiver');
const path = require('path');

exports.handler = async (event, context, callback) => {
	if( event.path == '/tail-view-file'){
		if (!event.requestContext.apikeyAuth || event.requestContext.apikeyAuth.apikey != APIKEY )
			throw "wrong apikey";

		var body = JSON.parse(event.body);
		console.log(body);

		if( logfile_list.indexOf(body.fname) < 0 )
			throw 'not allowed';
		
		var num = Number(body.num);
		var start = Number(body.start);
		return new Promise((resolve, reject) =>{
			var exec_batch;
			if (body.order == 'head'){
				exec_batch = `cat -n ${body.fname} | head -n ${start - 1 + num} | tail -n ${num} | sed -r "s/\\x1B\\[([0-9]{1,2}(;[0-9]{1,2})*)?m//g" | col -bx`;
			} else if (body.order == 'tail'){
				exec_batch = `cat -n ${body.fname} | tail -n ${start - 1 + num} | head -n ${num} | sed -r "s/\\x1B\\[([0-9]{1,2}(;[0-9]{1,2})*)?m//g" | col -bx`;
			}else{
				reject('unknown order');
			}
			exec(exec_batch, (err, stdout, stderr) => {
				if (err) {
					reject(err);
					return;
				}
				resolve(new TextResponse("text/plain", stdout));
			});
		});
	}else
	if( event.path == '/tail-get-file'){
		if (!event.requestContext.apikeyAuth || event.requestContext.apikeyAuth.apikey != APIKEY )
			throw "wrong apikey";

		var body = JSON.parse(event.body);
		console.log(body);

		if( logfile_list.indexOf(body.fname) < 0 )
			throw 'not allowed';
		
		return new Promise((resolve, reject) =>{
			var dest_stream = new streamBuffers.WritableStreamBuffer();
			const archive = archiver('zip', {
				zlib: { level: 9 }
			});
			dest_stream.on('finish', () => {
				console.log('stream finish');
				var response = new BinResponse('application/zip', dest_stream.getContents());
				response.set_filename(path.basename(body.fname) + '.zip');
				resolve(response);
			});

			archive.pipe(dest_stream);
			archive.on('error', (err) => {
				reject(err);
			});

			archive.file(body.fname, { name: path.basename(body.fname) });
			archive.finalize();
		});
	}else
	if( event.path == '/tail-list' ){
		return new Response({ list: logfile_list });
	}
};
