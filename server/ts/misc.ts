import * as http from 'http';
import * as fs from 'fs-extra';
import * as path from 'path';

import { shared } from './shared';

/** Holds a directory structure. If the value is null, then the key is a file, otherwise the key is a directory and the value is another directory structure. */
type DirectoryStructure = {[name: string]: null | DirectoryStructure};

/** Sends the current asset directory structure. */
export const getDirectoryStructure = async (res: http.ServerResponse) => {
	/** Scans the directory recursively. */
	const scanDirectory = async (directoryPath: string) => {
		let files = await fs.readdir(directoryPath);
		let temp: DirectoryStructure = {};
		let promises: Promise<void>[] = [];

		for (let file of files) {
			promises.push(new Promise(async resolve => {
				let newPath = path.join(directoryPath, file);
				let stats = await fs.stat(newPath);
				if (stats.isDirectory()) temp[file] = await scanDirectory(newPath); // Recurse if necessary
				else temp[file] = null;

				resolve();
			}));
		}

		await Promise.all(promises);

		// Sort the keys to guarantee a deterministic outcome despite asynchronous nature of the function
		let keys = Object.keys(temp).sort((a, b) => a.localeCompare(b));
		let result: DirectoryStructure = {};
		for (let key of keys) result[key] = temp[key];
		return result;
	};

	let structure = await scanDirectory(path.join(shared.directoryPath, 'assets', 'data'));

	res.writeHead(200, {
		'Content-Type': 'application/json'
	});
	res.end(JSON.stringify(structure));
};

/** Appends new user errors to a log file. */
export const logUserError = async (res: http.ServerResponse, body: string) => {
	let data: {
		userAgent: string,
		errors: {
			message: string,
			line: number,
			column: number,
			filename: string
		}[]
	} = JSON.parse(body);

	let str = "";

	// Add the date
	str += new Date().toISOString() + ' | ' + data.userAgent + '\n';
	for (let error of data.errors) {
		// Add all errors
		str += `${error.filename}:${error.line}:${error.column} ${error.message}\n`;
	}
	str += '\n';

	// Append at the end
	await fs.appendFile(path.join(__dirname, 'storage', 'logs', 'user_errors.log'), str);

	res.writeHead(200, {
		'Cache-Control': 'no-cache, no-store'
	});
	res.end();
};