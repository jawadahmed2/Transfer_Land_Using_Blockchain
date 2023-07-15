/* eslint-disable linebreak-style */
// eslint-disable-next-line linebreak-style
/* eslint-disable no-use-before-define */
/* eslint-disable linebreak-style */
/* eslint-disable curly */
/* eslint-disable quotes */
/* eslint-disable linebreak-style */
/* eslint-disable indent */
/* eslint-disable linebreak-style */
/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
/* eslint-disable no-inner-declarations */
/* eslint-disable no-redeclare */
/* eslint-disable eqeqeq */
/* eslint-disable no-var */
/* eslint-disable strict */
//var path=require('path')S

const express = require('express');
const { NONE } = require('fabric-network/lib/impl/event/defaulteventhandlerstrategies.js');
const router = express.Router();
router.use(express.urlencoded({ extended: true }));

// The router object is used in web applications to handle requests.
// router.post() refers to POST requests and router.get() referes to GET request.
// The difference between the two is that a GET request, is requesting data from a specified source and a POST
// request submits data to a specified resource to be processed.
// For example when you load a sign up page, that is a GET request as you are requesting data from the server
// and when you submit that form it's a POST request as your inputted data will be processed and assorted into
// a database, etc.

router.get('/display', function (req, res) {
	// The purpose of "use strict" is to indicate that the code should be executed in "strict mode".
	// With strict mode, you cannot, for example, use undeclared variables.
	'use strict';

	// fabric-network package encapsulates the APIs to connect to a Fabric network, submit transactions and
	// perform queries against the ledger, and listen for or replay events.
	// fabric-ca-client, to interact with the fabric-ca to manage user certificates.
	const { Gateway, Wallets } = require('fabric-network');
	const FabricCAServices = require('fabric-ca-client');
	// Nodejs provides you with the path module that allows you to interact with file paths easily.
	// The path module has many useful properties and methods to access and manipulate paths in the file system.
	const path = require('path');
	// the second ../ represents asset-transfer-basic folder
	// the first ../ represents fabric-samples that contains test-application folder
	// buildCAClient: Create a new CA client for interacting with the CA.
	const { buildCAClient, registerAndEnrollUser, enrollAdmin } = require('../../test-application/javascript/CAUtil.js');
	const { buildCCPOrg1, buildWallet } = require('../../test-application/javascript/AppUtil.js');

	const channelName = 'mychannel';
	const chaincodeName = 'basic';
	const mspOrg1 = 'Org1MSP';
	const walletPath = path.join(__dirname, 'wallet');
	// const org1UserId = req.session.userid;

	const mysql = require('mysql');
	const UserCnic = req.session.userid;

	const db = mysql.createConnection({
		host: 'localhost',
		user: 'root',
		password: '',
		database: 'test',
	});
	// connect to database
	db.connect((err) => {
		if (err) {
			console.log(err);
		}
		console.log('Connection done 3');
	});
	db.connect(function (err) {
		let sql = `SELECT * FROM user WHERE user_cnic= ${UserCnic}`;
		let query = db.query(sql, async (err, result) => {
			if (err) {
				console.log("Data Not Found");
			}
			// console.log(result);
			const fetchedResult = result;

			const org1UserId = fetchedResult[0].username;

			// Call a function or perform actions that rely on the fetched data
			// eslint-disable-next-line no-use-before-define
			await main(org1UserId);
		});
	});

	console.log(req.session);

	function prettyJSONString(inputString) {
		return JSON.stringify(JSON.parse(inputString), null, 2);
	}

	async function main(org1UserId) {
		try {
			if (org1UserId === undefined) {
				res.render('login_form', {
					errors: 'Please log in to see list of assets.'
				});
				return;
			}

			// build an in memory object with the network configuration (also known as a connection profile)
			const ccp = buildCCPOrg1();

			// build an instance of the fabric ca services client based on
			// the information in the network configuration
			const caClient = buildCAClient(FabricCAServices, ccp, 'ca.org1.example.com');

			// setup the wallet to hold the credentials of the application user
			const wallet = await buildWallet(Wallets, walletPath);

			// in a real application this would be done on an administrative flow, and only once
			await enrollAdmin(caClient, wallet, mspOrg1);

			// in a real application this would be done only when a new user was required to be added
			// and would be part of an administrative flow
			await registerAndEnrollUser(caClient, wallet, mspOrg1, org1UserId, 'org1.department1');

			// Create a new gateway instance for interacting with the fabric network.
			// In a real application this would be done as the backend server session is setup for
			// a user that has been verified.
			const gateway = new Gateway();

			try {
				// setup the gateway instance
				// The user will now be able to create connections to the fabric network and be able to
				// submit transactions and query. All transactions submitted by this gateway will be
				// signed by this user using the credentials stored in the wallet.
				await gateway.connect(ccp, {
					wallet,
					identity: org1UserId,
					discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
				});

				// Build a network instance based on the channel where the smart contract is deployed
				const network = await gateway.getNetwork(channelName);

				// Get the contract from the network.
				const contract = network.getContract(chaincodeName);

				// Let's try a query type operation (function).
				// This will be sent to just one peer and the results will be shown.
				console.log('\n--> Evaluate Transaction: GetAllAssets, function returns all the current assets on the ledger');
				let result = await contract.evaluateTransaction('GetAllAssets');
				console.log(`*** Result: ${prettyJSONString(result.toString())}`);

				let data = result.toString();
				console.log(data);
				let data2 = [];
				let label = [];
				let values = [];
				// remove {} [] "" from the fetched dataset
				for (var i = 0; i < data.length; i++) {
					if (data[i] != '{' && data[i] != '}' && data[i] != '{' && data[i] != '"' && data[i] != '[' && data[i] != ']') {
						data2.push(data[i]);
						//console.log(data[i]); // removes {} [] ""
					}
				}

				// Get Labels (Appraised Value, address, id and so on)
				let string;
				let j;
				for (var i = 0; i < data2.length; i++) {
					string = '';
					if (i == 0 || data2[i] == ',') {
						// Eliminite the word 'Record' from the result
						if (data2[i + 1] == 'R' && data2[i + 2] == 'e' && data2[i + 3] == 'c' && data2[i + 4] == 'o' && data2[i + 5] == 'r' && data2[i + 6] == 'd') {
							i += 7;
						}
						if (i == 0) {
							j = i;
						}
						else {
							j = i + 1;
						}
						while (data2[j] != ':') {
							string += data2[j];
							j++;
						}
						label.push(string);
						i = --j;
						//console.log(string);
					}
				}
				// Get Values (300, blue, asset1 and so on)
				for (var i = 0; i < data2.length; i++) {
					string = '';
					if (data2[i] == ':') {
						// Remove text 'x509::CN='
						if (data2[i + 1] == 'x' && data2[i + 2] == '5' && data2[i + 3] == '0' && data2[i + 4] == '9' && data2[i + 5] == ':' && data2[i + 6] == ':' && data2[i + 7] == 'C' && data2[i + 8] == 'N' && data2[i + 9] == '=') {
							i += 9;
						}
						// Remove text ':CN=ca.org1.example.com'
						if (data2[i + 1] == ':' && data2[i + 2] == 'C' && data2[i + 3] == 'N' && data2[i + 4] == '=' && data2[i + 5] == 'c' && data2[i + 6] == 'a' && data2[i + 7] == '.' && data2[i + 8] == 'o' && data2[i + 9] == 'r' && data2[i + 10] == 'g' && data2[i + 11] == '1' && data2[i + 12] == '.' && data2[i + 13] == 'e' && data2[i + 14] == 'x' && data2[i + 15] == 'a' && data2[i + 16] == 'm' && data2[i + 17] == 'p' && data2[i + 18] == 'l' && data2[i + 19] == 'e' && data2[i + 20] == '.' && data2[i + 21] == 'c' && data2[i + 22] == 'o' && data2[i + 23] == 'm') {
							i += 24;
						}
						// Remove O=org1.example.com
						if (data2[i + 1] == 'O' && data2[i + 2] == '=' && data2[i + 3] == 'o' && data2[i + 4] == 'r' && data2[i + 5] == 'g' && data2[i + 6] == '1' && data2[i + 7] == '.' && data2[i + 8] == 'e' && data2[i + 9] == 'x' && data2[i + 10] == 'a' && data2[i + 11] == 'm' && data2[i + 12] == 'p' && data2[i + 13] == 'l' && data2[i + 14] == 'e' && data2[i + 15] == '.' && data2[i + 16] == 'c' && data2[i + 17] == 'o' && data2[i + 18] == 'm') {
							i += 18;
						}

						j = i + 1;
						while (data2[j] != ',') {
							if (j == data2.length - 1) {
								string += data2[j];
								break;
							}
							string += data2[j];
							j++;
						}
						if (string != '') {
							values.push(string);
						}
						i = --j;
						//console.log(string);
					}
				}
				// Call display.ejs file to show the list of assets
				// res.render('display', { layout: false });
				res.render('display', {
					// layout: false,
					label: label,
					values: values,
					username: org1UserId
				});

			} finally {
				// Disconnect from the gateway when the application is closing
				// This will close all connections to the network
				gateway.disconnect();
			}
		} catch (error) {
			console.error(`******** FAILED to run the application: ${error}`);
		}
	}
	// main();
});




router.get('/insert_form', function (req, res) {
	res.render('insert_form', {
		errors: {},
		success: {}
	});
});

// Server-side validations
router.post('/create_asset', function (req, res) {
	let errors = [];
	if (!req.body.id) {
		//console.log('Land ID is: '+req.body.id);
		errors.push('ID must be provided');
	}
	// if (!req.body.address) {
	// 	errors.push('Address must be provided');
	// }
	if (!req.body.size) {
		errors.push('Land Size must be provided');
	}
	if (!req.body.value) {
		errors.push('Price must be provided');
	}
	// if(!req.body.file){
	// 	errors.push('Select an image file to upload');
	// }
	if (errors.length > 0) {
		res.render('insert_form', {
			errors: errors,
			success: {}
		});
	}
	else {
		'use strict';

		const { Gateway, Wallets } = require('fabric-network');
		const FabricCAServices = require('fabric-ca-client');
		const path = require('path');
		const { buildCAClient, registerAndEnrollUser, enrollAdmin } = require('../../test-application/javascript/CAUtil.js');
		const { buildCCPOrg1, buildWallet } = require('../../test-application/javascript/AppUtil.js');

		const channelName = 'mychannel';
		const chaincodeName = 'basic';
		const mspOrg1 = 'Org1MSP';
		const walletPath = path.join(__dirname, 'wallet');
		const mysql = require('mysql');

		const UserCnic = req.session.userid;
		const District = req.body.district;
		const Tehsil = req.body.tehsil;
		const Mauza = req.body.mauza;
		const Land_id = req.body.id;
		const Land_price = req.body.value;
		const Land_size = req.body.size;
		const Khatuni = req.body.khatuni;
		// const image_data = req.body.file;
		const Address = District.concat(" ", Tehsil, ' ', ' ', Mauza, ' ', Khatuni, ' ', 'Punjab', ' ', 'Pakistan');

		const db = mysql.createConnection({
			host: 'localhost',
			user: 'root',
			password: '',
			database: 'test',
		});
		// connect to database
		db.connect((err) => {
			if (err) {
				console.log(err);
			}
			console.log('Connection done');
		});
		db.connect(function (err) {
			let post = {
				user_cnic: UserCnic, district: District, tehsil: Tehsil, mauza: Mauza, khatuni: Khatuni,
				land_id: Land_id, land_size: Land_size, land_price: Land_price
			};
			let checkQuery = "SELECT * FROM land_record WHERE khatuni = ?";
			let checkValues = [Khatuni];
			let query = db.query(checkQuery, checkValues, (err, result) => {
				if (err) {
					console.log(err);
				}
				if (result.length === 0) {
					let insertQuery = "INSERT INTO land_record SET ?";
					let insertValues = post;
					db.query(insertQuery, insertValues, (err, result) => {
						if (err) {
							console.log(err);
						}
						console.log("Successfully added land record in the database");
						// res.send("Post 1 added");
					});
				} else {
					console.log(" ");
				}
			});
		});

		db.connect(function (err) {
			let sql = `SELECT * FROM user WHERE user_cnic= ${UserCnic}`;
			let query = db.query(sql, async (err, result) => {
				if (err) {
					console.log("Data Not Found");
				}
				// console.log(result);
				const fetchedResult = result;

				const org1UserId = fetchedResult[0].username;

				// Call a function or perform actions that rely on the fetched data
				// eslint-disable-next-line no-use-before-define
				await main(org1UserId);
			});
		});
		// const org1UserId = req.session.userid;

		async function main(org1UserId) {
			try {
				if (org1UserId === undefined) {
					res.render('login_form', {
						errors: 'Please log in to add a new record.',
						success: {}
					});
					return;
				}

				try {
					const ccp = buildCCPOrg1();
					const caClient = buildCAClient(FabricCAServices, ccp, 'ca.org1.example.com');
					const wallet = await buildWallet(Wallets, walletPath);
					await enrollAdmin(caClient, wallet, mspOrg1);
					await registerAndEnrollUser(caClient, wallet, mspOrg1, org1UserId, 'org1.department1');
					const gateway = new Gateway();

					await gateway.connect(ccp, {
						wallet,
						identity: org1UserId,
						discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
					});

					const network = await gateway.getNetwork(channelName);
					const contract = network.getContract(chaincodeName);

					const attrvalue = await contract.evaluateTransaction('getattributevalue');
					console.log('The value of role attribute is:::::::::::' + attrvalue);

					if (attrvalue != 'creator') {
						res.render('insert_form', {
							errors: 'You do not possess the creator role to add a new record.',
							success: {}
						});
						return;
					}

					try {
						// const fs = require('fs');
						// const create = require('ipfs-http-client');
						// // Details about project id and project secret are provided in the book
						// const projectId = '2JuAPHltL4jX6CKKvvzejOyO15K';
						// const projectSecret = '1b623e021ab46f73b445a94564557f12';
						// const projectIdAndSecret = `${projectId}:${projectSecret}`;
						// const ipfsClient = create({
						// 	host: 'ipfs.infura.io',
						// 	port: 5001,
						// 	protocol: 'https',
						// 	headers: {
						// 		authorization: `Basic ${Buffer.from(projectIdAndSecret).toString(
						// 			'base64'
						// 		)}`,
						// 	},
						// });
						// const file = fs.readFileSync(req.body.file);
						// const buffer = Buffer.from(file);
						// //console.log(buffer);
						// const cid = await ipfsClient.add(buffer);
						// // Note: (node:75967) ExperimentalWarning: The Fetch API is an experimental feature. This feature could change at any time
						// // (Use `node --trace-warnings ...` to show where the warning was created)
						// // Remedy: Downgrade Node: nvm install 10.23.0 and nvm use 10.23.0
						// // Now let's try to submit a transaction.
						// // This will be sent to both peers and if both peers endorse the transaction, the endorsed proposal will be sent
						// // to the orderer to be committed by each of the peer's to the channel ledger.
						// for (const item of cid) {
						// 	console.log(JSON.stringify(item));
						// 	const filePath = JSON.stringify(item).substring(9, 55);
						// 	console.log('Value of filePath is:', filePath);
						console.log('\n--> Submit Transaction: CreateAsset, creates new asset with ID, address, owner, size, price, date, and type');
						await contract.submitTransaction('CreateAsset', req.body.id, Address, req.body.size, org1UserId, req.body.value); // remove filePath
						// 	return;
						// 	}
					} finally {
						// Disconnect from the gateway when the application is closing
						// This will close all connections to the network
						gateway.disconnect();
						res.redirect('/display');
					}
				} catch (error) {
					console.error(`******** FAILED to run the application >>>>>: ${error}`);
				}
			} catch (error) {
				console.error(`******** FAILED to run the application: ${error}`);
			}
		}
		// main();
	}
});

router.get('/search_form', function (req, res) {
	res.render('search_form', {
		errors: {}
	});
});

router.post('/search_asset', function (req, res) {
	let errors = [];
	if (!req.body.id) {
		errors.push('Asset ID must be provided');
	}
	if (errors.length > 0) {
		res.render('search_form', {
			errors: errors
		});
	}
	else {
		'use strict';

		const { Gateway, Wallets } = require('fabric-network');
		const FabricCAServices = require('fabric-ca-client');
		const path = require('path');
		const { buildCCPOrg1, buildWallet } = require('../../test-application/javascript/AppUtil.js');

		const channelName = 'mychannel';
		const chaincodeName = 'basic';
		const walletPath = path.join(__dirname, 'wallet');
		// const org1UserId = req.session.userid;

		const mysql = require('mysql');
		const UserCnic = req.session.userid;
		console.log(UserCnic);

		const db = mysql.createConnection({
			host: 'localhost',
			user: 'root',
			password: '',
			database: 'test',
		});
		// connect to database
		db.connect((err) => {
			if (err) {
				console.log(err);
			}
			console.log('Connection done');
		});
		db.connect(function (err) {
			let sql = `SELECT * FROM user WHERE user_cnic= ${UserCnic}`;
			let query = db.query(sql, async (err, result) => {
				if (err) {
					console.log("Data Not Found");
				}
				// console.log(result);
				const fetchedResult = result;

				const org1UserId = fetchedResult[0].username;
				// Call a function or perform actions that rely on the fetched data
				// eslint-disable-next-line no-use-before-define
				await main(org1UserId);
			});
		});

		console.log(req.session);

		async function main(org1UserId) {
			try {
				if (org1UserId === undefined) {
					res.render('login_form', {
						errors: 'Please log in to search records.',
						success: {}
					});
					return;
				}
				try {
					const ccp = buildCCPOrg1();
					const wallet = await buildWallet(Wallets, walletPath);
					const gateway = new Gateway();

					try {
						await gateway.connect(ccp, {
							wallet,
							identity: org1UserId,
							discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
						});

						const network = await gateway.getNetwork(channelName);
						const contract = network.getContract(chaincodeName);

						result = await contract.evaluateTransaction('ReadAsset', req.body.id);

						let data = result.toString();
						let data2 = [];
						let label = [];
						let values = [];
						// remove {} [] ""
						for (var i = 0; i < data.length; i++) {
							if (data[i] != '{' && data[i] != '}' && data[i] != '{' && data[i] != '"' && data[i] != '[' && data[i] != ']') {
								data2.push(data[i]);
								//console.log(data[i]); // removes {} [] ""
							}
						}

						for (var i = 0; i < 8; i++) {
							if (i == 0) {
								label.push('Address');
							}
							if (i == 1) {
								label.push('LandID');
							}
							if (i == 2) {
								label.push('LandSize');
							}
							if (i == 3) {
								label.push('Owner');
							}
							if (i == 4) {
								label.push('LandPrice');
							}
							if (i == 5) {
								label.push('Date');
							}
							if (i == 6) {
								label.push('Type');
							}
							// if (i==7)
							// {
							// 	label.push('Image');
							// }
						}


						for (var i = 0; i < data2.length; i++) {
							string = '';
							if (data2[i] == ':') {
								if (data2[i + 1] == 'x' && data2[i + 2] == '5' && data2[i + 3] == '0' && data2[i + 4] == '9' && data2[i + 5] == ':' && data2[i + 6] == ':' && data2[i + 7] == 'C' && data2[i + 8] == 'N' && data2[i + 9] == '=') {
									i += 9;
								}
								// Remove text ':CN=ca.org1.example.com'
								if (data2[i + 1] == ':' && data2[i + 2] == 'C' && data2[i + 3] == 'N' && data2[i + 4] == '=' && data2[i + 5] == 'c' && data2[i + 6] == 'a' && data2[i + 7] == '.' && data2[i + 8] == 'o' && data2[i + 9] == 'r' && data2[i + 10] == 'g' && data2[i + 11] == '1' && data2[i + 12] == '.' && data2[i + 13] == 'e' && data2[i + 14] == 'x' && data2[i + 15] == 'a' && data2[i + 16] == 'm' && data2[i + 17] == 'p' && data2[i + 18] == 'l' && data2[i + 19] == 'e' && data2[i + 20] == '.' && data2[i + 21] == 'c' && data2[i + 22] == 'o' && data2[i + 23] == 'm') {
									i += 24;
								}
								// Remove O=org1.example.com
								if (data2[i + 1] == 'O' && data2[i + 2] == '=' && data2[i + 3] == 'o' && data2[i + 4] == 'r' && data2[i + 5] == 'g' && data2[i + 6] == '1' && data2[i + 7] == '.' && data2[i + 8] == 'e' && data2[i + 9] == 'x' && data2[i + 10] == 'a' && data2[i + 11] == 'm' && data2[i + 12] == 'p' && data2[i + 13] == 'l' && data2[i + 14] == 'e' && data2[i + 15] == '.' && data2[i + 16] == 'c' && data2[i + 17] == 'o' && data2[i + 18] == 'm') {
									i += 18;
								}

								j = i + 1;
								while (data2[j] != ',') {
									if (j == data2.length - 1) {
										string += data2[j];
										break;
									}
									string += data2[j];
									j++;
								}
								if (string != '') {
									values.push(string);
								}
								i = --j;
								//console.log(string);
							}
						}
						// console.log(label);
						// console.log(values);

						res.render('search_result', {
							label: label,
							values: values
						});
					} finally {
						// Disconnect from the gateway when the application is closing
						// This will close all connections to the network
						gateway.disconnect();
					}
				} catch (error) {
					console.error(`******** FAILED to run the application: ${error}`);
					res.render('search_form', {
						errors: 'Asset ' + req.body.id + ' does not exist'
					});
				}
			} catch (error) {
				console.error(`******** FAILED to run the application: ${error}`);
			}
		}
		// main();
	}
});

router.get('/update_owner_form', function (req, res) {
	res.render('update_owner_form', {
		errors: {},
		success: {}
	});
});
router.post('/update_owner', function (req, res) {
	let errors = [];
	if (!req.body.id) {
		errors.push('Asset ID must be provided');
	}
	if (!req.body.newowner) {
		errors.push('New owner name must be provided');
	}
	if (errors.length > 0) {
		res.render('update_owner_form', {
			errors: errors,
			success: {}
		});
		console.log(req.body.id, req.body.newowner);
	}
	else {
		'use strict';

		const { Gateway, Wallets } = require('fabric-network');
		const FabricCAServices = require('fabric-ca-client');
		const path = require('path');
		const { buildCAClient, registerAndEnrollUser, enrollAdmin } = require('../../test-application/javascript/CAUtil.js');
		const { buildCCPOrg1, buildWallet } = require('../../test-application/javascript/AppUtil.js');

		const channelName = 'mychannel';
		const chaincodeName = 'basic';
		const mspOrg1 = 'Org1MSP';
		const walletPath = path.join(__dirname, 'wallet');
		// const org1UserId = req.session.userid;
		const mysql = require('mysql');
		const UserCnic = req.session.userid;
		const LandId = req.body.id;

		const db = mysql.createConnection({
			host: 'localhost',
			user: 'root',
			password: '',
			database: 'test',
		});
		// connect to database
		db.connect((err) => {
			if (err) {
				console.log(err);
			}
			console.log('Connection done 4');
		});
		db.connect(function (err) {
			let sql = `SELECT * FROM user WHERE user_cnic= ${UserCnic}`;
			let query = db.query(sql, async (err, result) => {
				if (err) {
					console.log("Data Not Found");
				}
				// console.log(result);
				const fetchedResult = result;

				const org1UserId = fetchedResult[0].username;

				// Call a function or perform actions that rely on the fetched data
				// eslint-disable-next-line no-use-before-define
				await main(org1UserId);
			});
		});
		async function main(org1UserId) {
			try {
				if (org1UserId === undefined) {
					res.render('login_form', {
						errors: 'Please log in to update owner.',
						success: {}
					});
					return;
				}
				try {
					const ccp = buildCCPOrg1();
					const caClient = buildCAClient(FabricCAServices, ccp, 'ca.org1.example.com');
					const wallet = await buildWallet(Wallets, walletPath);
					const gateway = new Gateway();

					// check existence of new owner
					const userIdentity = await wallet.get(req.body.newowner);
					if (!userIdentity) {
						console.log(`An identity for the user ${req.body.newowner} does not exist in the wallet`);
						res.render('update_owner_form', {
							errors: 'An identity for the user ' + req.body.newowner + ' does not exist in the wallet',
							success: {}
						});
						return;
					}

					await gateway.connect(ccp, {
						wallet,
						identity: org1UserId,
						discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
					});

					const network = await gateway.getNetwork(channelName);
					const contract = network.getContract(chaincodeName);

					// Check asset owner
					const assetOwner = await contract.evaluateTransaction('checkOwner', req.body.id);
					if (assetOwner != org1UserId) {
						res.render('update_owner_form', {
							errors: 'You do not own the asset',
							success: {}
						});
						return;
					}

					try {
						await contract.submitTransaction('TransferAsset', req.body.id, req.body.newowner);
						console.log('*** Result: committed');

						db.connect(function (err) {
							let sql = `SELECT * FROM buyer_requests WHERE land_id = '${LandId}'`;
							let query = db.query(sql, async (err, result) => {
								if (err) {
									console.log("Data Not Found");
								}
								const fetchedResult = result;
								// eslint-disable-next-line no-use-before-define
								await requested_data(fetchedResult);
							});
						});


						async function requested_data(fetchedResult) {
							try {

								// console.log(fetchedResult);

								db.connect(function (err) {
									const LandId = fetchedResult[0].land_id; // Assuming you have the LandId value
									let updateQuery = "UPDATE buyer_requests SET status = ? WHERE land_id = ? AND seller_cnic = ?";
									let updateValues = [2, LandId, UserCnic]; // Update status value to 1 (or your desired value)

									db.query(updateQuery, updateValues, (err, result) => {
										if (err) {
											console.log(err);
										}
										console.log("Successfully updated the status in the seller_requests table");

										// Send a success response
										res.status(200).json({ response: 'success' });
									});
								});
							} catch (error) {
								console.error(`******** FAILED to run the application: ${error}`);
							}
						}


					} finally {
						// Disconnect from the gateway when the application is closing
						// This will close all connections to the network
						gateway.disconnect();
						// res.render('display', {
						// 	errors: {},
						// 	success: 'New owner updated successfully!'
						// });
					}
				} catch (error) {
					console.error(`******** FAILED to run the application: ${error}`);
					res.render('update_owner_form', {
						errors: 'Error occured while transferring asset',
						success: {}
					});
				}
			} catch (error) {
				console.error(`******** FAILED to run the application: ${error}`);
			}
		}
		// main();
	}
});

router.get('/register_user_form', function (req, res) {
	res.render('register_user_form', {
		errors: {},
		success: {}
	});
});


router.post('/register_user', function (req, res) {
	let errors = [];
	if (!req.body.userId) {
		errors.push('User id must be provided');
	}

	if (errors.length > 0) {
		res.render('register_user_form', {
			errors: errors,
			success: {}
		});
	}
	else {
		'use strict';

		const { Gateway, Wallets } = require('fabric-network');
		const FabricCAServices = require('fabric-ca-client');
		const path = require('path');
		const { buildCAClient, registerAndEnrollUser, enrollAdmin } = require('../../test-application/javascript/CAUtil.js');
		const { buildCCPOrg1, buildWallet } = require('../../test-application/javascript/AppUtil.js');

		const channelName = 'mychannel';
		const chaincodeName = 'basic';
		const mspOrg1 = 'Org1MSP';
		const walletPath = path.join(__dirname, 'wallet');
		const org1UserId = req.body.userId;

		function prettyJSONString(inputString) {
			return JSON.stringify(JSON.parse(inputString), null, 2);
		}

		async function main() {
			try {
				const ccp = buildCCPOrg1();
				const caClient = buildCAClient(FabricCAServices, ccp, 'ca.org1.example.com');
				const wallet = await buildWallet(Wallets, walletPath);
				const userIdentity = await wallet.get(org1UserId);
				if (userIdentity) {
					console.log(`An identity for the user ${org1UserId} already exists in the wallet`);
				}
				await registerAndEnrollUser(caClient, wallet, mspOrg1, org1UserId, 'org1.department1', req.body.role);
				console.log(req.body.role, req.body.username, req.body.password);


			} catch (error) {
				console.error(`******** FAILED to run the application: ${error}`);
			}


		}
		main();
		try {
			// do something before waiting
			setTimeout(function () {
				// create some context
				const context = {
					UserId: req.body.userId,
					UserPassword: req.body.password,
					UserCnic: req.body.cnic
				};
				res.redirect('/register_new_user_form?context=' + JSON.stringify(context));
			}, 800);
		} catch (error) {
			res.render('register_user_form', {
				errors: {},
				success: {}
			});
		}



	}
});

// Make API for Flutter

router.post('/register_user_api', function (req, res) {
	console.log('Request Received');
	let errors = [];
	console.log(req.body);
	if (!req.body.userId) {
		errors.push('User id must be provided');
	}

	if (errors.length > 0) {
		res.json({
			errors: errors,
			success: {}
		});
	} else {
		'use strict';

		const { Gateway, Wallets } = require('fabric-network');
		const FabricCAServices = require('fabric-ca-client');
		const path = require('path');
		const { buildCAClient, registerAndEnrollUser, enrollAdmin } = require('../../test-application/javascript/CAUtil.js');
		const { buildCCPOrg1, buildWallet } = require('../../test-application/javascript/AppUtil.js');

		const channelName = 'mychannel';
		const chaincodeName = 'basic';
		const mspOrg1 = 'Org1MSP';
		const walletPath = path.join(__dirname, 'wallet');
		const org1UserId = req.body.userId;

		function prettyJSONString(inputString) {
			return JSON.stringify(JSON.parse(inputString), null, 2);
		}

		async function main() {
			try {
				const ccp = buildCCPOrg1();
				const caClient = buildCAClient(FabricCAServices, ccp, 'ca.org1.example.com');
				const wallet = await buildWallet(Wallets, walletPath);
				const userIdentity = await wallet.get(org1UserId);
				if (userIdentity) {
					console.log(`An identity for the user ${org1UserId} already exists in the wallet`);
				}
				await registerAndEnrollUser(caClient, wallet, mspOrg1, org1UserId, 'org1.department1', 'Creator');
				console.log('Creator', req.body.userId, req.body.password);
			} catch (error) {
				console.error(`******** FAILED to run the application: ${error}`);
			}
		}

		main();
		try {
			// do something before waiting
			setTimeout(function () {
				// create some context
				const context = {
					UserId: req.body.userId,
					UserPassword: req.body.password,
					UserCnic: req.body.cnic
				};
				res.redirect('/register_new_user_form?context=' + JSON.stringify(context));
			}, 800);
		} catch (error) {
			res.json({
				errors: {},
				success: {}
			});
		}
	}
});

router.get('/register_new_user_form', function (req, res) {
	'use strict';

	const { Gateway, Wallets } = require('fabric-network');
	const FabricCAServices = require('fabric-ca-client');
	const path = require('path');
	const { buildCAClient, registerAndEnrollUser, enrollAdmin } = require('../../test-application/javascript/CAUtil.js');
	const { buildCCPOrg1, buildWallet } = require('../../test-application/javascript/AppUtil.js');

	const channelName = 'mychannel';
	const chaincodeName = 'basic';
	const mspOrg1 = 'Org1MSP';
	const walletPath = path.join(__dirname, 'wallet');

	const mysql = require('mysql');

	// get the context from the query parameter and parse it
	const context = JSON.parse(req.query.context);
	const org1UserId = context.UserId;
	const userPassword = context.UserPassword;
	const userCnic = context.UserCnic;
	console.log(org1UserId, userPassword, userCnic);



	function prettyJSONString(inputString) {
		try {
			const parsedJSON = JSON.parse(inputString);
			return JSON.stringify(parsedJSON, null, 2);
		} catch (error) {
			console.error('Failed to parse JSON:', error);
			return '';
		}
	}


	async function main() {
		try {
			// build an in memory object with the network configuration (also known as a connection profile)
			const ccp = buildCCPOrg1();

			// build an instance of the fabric ca services client based on
			// the information in the network configuration
			const caClient = buildCAClient(FabricCAServices, ccp, 'ca.org1.example.com');

			// setup the wallet to hold the credentials of the application user
			const wallet = await buildWallet(Wallets, walletPath);

			// in a real application this would be done on an administrative flow, and only once
			await enrollAdmin(caClient, wallet, mspOrg1);


			const userIdentity = await wallet.get(org1UserId);

			if (!userIdentity) {
				console.log(`An identity for the user ${org1UserId} does not exist in the wallet`);
			}
			// Take hash between -----PRIVATE KEY----- and ---END PRIVATE KEY---
			// Press ctrl+f and remove \r\n from the hash and use it as password
			if (userIdentity && userIdentity.type === 'X.509') {
				const pk1 = userIdentity.credentials.privateKey.substr(27, 66);
				const pk2 = userIdentity.credentials.privateKey.substr(95, 64);
				const pk3 = userIdentity.credentials.privateKey.substr(161, 56);
				const privateKey = pk1.trim() + pk2.trim() + pk3.trim();
				//Create Connections

				const db = mysql.createConnection({
					host: 'localhost',
					user: 'root',
					password: '',
					database: 'test',
				});
				// connect to database
				db.connect((err) => {
					if (err) {
						console.log(err);
					}
					console.log('Connection done');
				});
				db.connect(function (err) {
					let post = { private_key: privateKey, username: org1UserId, user_cnic: userCnic, password: userPassword };
					let checkQuery = "SELECT * FROM user WHERE private_key = ?";
					let checkValues = [privateKey];
					let query = db.query(checkQuery, checkValues, (err, result) => {
						if (err) {
							console.log(err);
						}
						if (result.length === 0) {
							let insertQuery = "INSERT INTO user SET ?";
							let insertValues = post;
							db.query(insertQuery, insertValues, (err, result) => {
								if (err) {
									console.log(err);
								}
								console.log("Successfully private key is added in the database");
								// res.send("Post 1 added");
							});
						} else {
							console.log(" ");
						}
					});
				});


			}

		} catch (error) {
			console.error(`******** FAILED to add the entry in the database application: ${error}`);
		}
	}
	main();

	res.render('register_new_user_form', {
		errors: {},
		success: 'New user added successfully!'
	});

});



router.get('/asset_history_form', function (req, res) {
	res.render('asset_history_form', {
		errors: {}
	});
});

router.post('/history', function (req, res) {
	let errors = [];
	if (!req.body.id) {
		errors.push('Asset ID must be provided');
	}
	if (errors.length > 0) {
		res.render('asset_history_form', {
			errors: errors
		});
	}
	else {
		'use strict';
		const { Gateway, Wallets } = require('fabric-network');
		const FabricCAServices = require('fabric-ca-client');
		const path = require('path');
		const { buildCAClient, registerAndEnrollUser, enrollAdmin } = require('../../test-application/javascript/CAUtil.js');
		const { buildCCPOrg1, buildWallet } = require('../../test-application/javascript/AppUtil.js');

		const channelName = 'mychannel';
		const chaincodeName = 'basic';
		const mspOrg1 = 'Org1MSP';
		const walletPath = path.join(__dirname, 'wallet');
		// const org1UserId = req.session.userid;
		const mysql = require('mysql');
		const UserCnic = req.session.userid;

		const db = mysql.createConnection({
			host: 'localhost',
			user: 'root',
			password: '',
			database: 'test',
		});
		// connect to database
		db.connect((err) => {
			if (err) {
				console.log(err);
			}
			console.log('Connection done 3');
		});
		db.connect(function (err) {
			let sql = `SELECT * FROM user WHERE user_cnic= ${UserCnic}`;
			let query = db.query(sql, async (err, result) => {
				if (err) {
					console.log("Data Not Found");
				}
				// console.log(result);
				const fetchedResult = result;

				const org1UserId = fetchedResult[0].username;

				// Call a function or perform actions that rely on the fetched data
				// eslint-disable-next-line no-use-before-define
				await main(org1UserId);
			});
		});

		console.log(req.session);

		function prettyJSONString(inputString) {
			return JSON.stringify(JSON.parse(inputString), null, 2);
		}

		async function main(org1UserId) {
			try {
				if (org1UserId === undefined) {
					res.render('login_form', {
						errors: 'Please log in to see history of an asset.'
					});
					return;
				}

				// build an in memory object with the network configuration (also known as a connection profile)
				const ccp = buildCCPOrg1();

				// build an instance of the fabric ca services client based on
				// the information in the network configuration
				const caClient = buildCAClient(FabricCAServices, ccp, 'ca.org1.example.com');

				// setup the wallet to hold the credentials of the application user
				const wallet = await buildWallet(Wallets, walletPath);

				// in a real application this would be done on an administrative flow, and only once
				await enrollAdmin(caClient, wallet, mspOrg1);

				// in a real application this would be done only when a new user was required to be added
				// and would be part of an administrative flow
				await registerAndEnrollUser(caClient, wallet, mspOrg1, org1UserId, 'org1.department1');

				// Create a new gateway instance for interacting with the fabric network.
				// In a real application this would be done as the backend server session is setup for
				// a user that has been verified.
				const gateway = new Gateway();

				try {
					// setup the gateway instance
					// The user will now be able to create connections to the fabric network and be able to
					// submit transactions and query. All transactions submitted by this gateway will be
					// signed by this user using the credentials stored in the wallet.
					await gateway.connect(ccp, {
						wallet,
						identity: org1UserId,
						discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
					});

					// Build a network instance based on the channel where the smart contract is deployed
					const network = await gateway.getNetwork(channelName);

					// Get the contract from the network.
					const contract = network.getContract(chaincodeName);

					// Let's try a query type operation (function).
					// This will be sent to just one peer and the results will be shown.
					console.log('\n--> Evaluate Transaction: GetAllAssets, function returns all the current assets on the ledger');
					let result = await contract.evaluateTransaction('GetAssetHistory', req.body.id);
					console.log(`*** Result: ${prettyJSONString(result.toString())}`);

					let data = result.toString();
					console.log(data);
					let data2 = [];
					let label = [];
					let values = [];
					// remove {} [] ""
					for (var i = 0; i < data.length; i++) {
						if (data[i] != '{' && data[i] != '}' && data[i] != '{' && data[i] != '"' && data[i] != '[' && data[i] != ']') {
							data2.push(data[i]);
							//console.log(data[i]); // removes {} [] ""
						}
					}

					// Get Labels
					let string;
					let j;
					for (var i = 0; i < data2.length; i++) {
						string = '';
						if (i == 0 || data2[i] == ',') {
							// Eliminite the word 'Record'
							if (data2[i + 1] == 'R' && data2[i + 2] == 'e' && data2[i + 3] == 'c' && data2[i + 4] == 'o' && data2[i + 5] == 'r' && data2[i + 6] == 'd') {
								i += 7;
							}
							if (i == 0) {
								j = i;
							}
							else {
								j = i + 1;
							}
							while (data2[j] != ':') {
								string += data2[j];
								j++;
							}
							label.push(string);
							i = --j;
							//console.log(string);
						}
					}
					// Get Values
					for (var i = 0; i < data2.length; i++) {
						string = '';
						if (data2[i] == ':') {
							j = i + 1;
							while (data2[j] != ',') {
								if (j == data2.length - 1) {
									string += data2[j];
									break;
								}
								string += data2[j];
								j++;
							}
							if (string != '') {
								values.push(string);
							}
							i = --j;
							//console.log(string);
						}
					}
					rawData = JSON.parse(data);
					const owners = rawData.map(item => item.Owner);
					const dates = rawData.map(item => item.addedOn);
					console.log(dates);
					res.render('history', {
						label: label,
						values: owners,
						date: dates
					});

				} finally {
					// Disconnect from the gateway when the application is closing
					// This will close all connections to the network
					gateway.disconnect();
				}
			} catch (error) {
				console.error(`******** FAILED to run the application: ${error}`);
			}
		}
		// main();
	}
});

router.get('/login_form', function (req, res) {
	session = req.session;
	res.render('login_form', {
		errors: {}
	});

});

router.post('/login_form', function (req, res) {
	let errors = [];
	if (!req.body.cnic) {
		errors.push('User cnic must be provided');
	}
	if (!req.body.pw) {
		errors.push('Password must be provided');
	}
	if (errors.length > 0) {
		res.render('login_form', {
			errors: errors
		});
	}
	else {
		// a variable to save a session
		let session;
		session = req.session;
		session.userid = req.body.cnic;
		console.log(req.session);

		'use strict';

		const { Gateway, Wallets } = require('fabric-network');
		const FabricCAServices = require('fabric-ca-client');
		const path = require('path');
		const { buildCAClient, registerAndEnrollUser, enrollAdmin } = require('../../test-application/javascript/CAUtil.js');
		const { buildCCPOrg1, buildWallet } = require('../../test-application/javascript/AppUtil.js');

		const channelName = 'mychannel';
		const chaincodeName = 'basic';
		const mspOrg1 = 'Org1MSP';
		const walletPath = path.join(__dirname, 'wallet');
		const mysql = require('mysql');

		const UserCnic = req.body.cnic;
		const UserPassword = req.body.pw;



		function prettyJSONString(inputString) {
			return JSON.stringify(JSON.parse(inputString), null, 2);
		}

		async function main() {
			try {
				// build an in memory object with the network configuration (also known as a connection profile)
				const ccp = buildCCPOrg1();

				// build an instance of the fabric ca services client based on
				// the information in the network configuration
				const caClient = buildCAClient(FabricCAServices, ccp, 'ca.org1.example.com');

				// setup the wallet to hold the credentials of the application user
				const wallet = await buildWallet(Wallets, walletPath);

				// in a real application this would be done on an administrative flow, and only once
				await enrollAdmin(caClient, wallet, mspOrg1);

				// in a real application this would be done only when a new user was required to be added
				// and would be part of an administrative flow
				//await registerAndEnrollUser(caClient, wallet, mspOrg1, org1UserId, 'org1.department1');

				// Create a new gateway instance for interacting with the fabric network.
				// In a real application this would be done as the backend server session is setup for
				// a user that has been verified.
				const gateway = new Gateway();
				//Create Connections

				const db = mysql.createConnection({
					host: 'localhost',
					user: 'root',
					password: '',
					database: 'test',
				});
				// connect to database
				db.connect((err) => {
					if (err) {
						console.log(err);
					}
					console.log('Connection done');
				});
				db.connect(function (err) {
					let sql = `SELECT * FROM user WHERE user_cnic= ${UserCnic}`;
					let query = db.query(sql, async (err, result) => {
						if (err) {
							console.log("Data Not Found");
						}
						// console.log(result);
						const fetchedResult = result;

						const org1UserId = fetchedResult[0].username;
						const private_key = fetchedResult[0].private_key;

						if (fetchedResult[0].password == UserPassword) {
							// Call a function or perform actions that rely on the fetched data
							// eslint-disable-next-line no-use-before-define
							if (org1UserId == 'Patwari') {
								try {
									const userIdentity = await wallet.get(org1UserId);
									if (!userIdentity) {
										console.log(`An identity for the user ${org1UserId} does not exist in the wallet`);
										res.render('login_form', {
											errors: 'An identity for the user ' + org1UserId + ' does not exist in the wallet'
										});
										return;
									}
									// Take hash between -----PRIVATE KEY----- and ---END PRIVATE KEY---
									// Press ctrl+f and remove \r\n from the hash and use it as password
									if (userIdentity && userIdentity.type === 'X.509') {
										const pk1 = userIdentity.credentials.privateKey.substr(27, 66);
										const pk2 = userIdentity.credentials.privateKey.substr(95, 64);
										const pk3 = userIdentity.credentials.privateKey.substr(161, 56);
										const privateKey = pk1.trim() + pk2.trim() + pk3.trim();
										if (private_key != privateKey) {
											res.render('login_form', {
												errors: 'You have provided an invalid password'
											});
											return;
										}
									}
									// setup the gateway instance
									// The user will now be able to create connections to the fabric network and be able to
									// submit transactions and query. All transactions submitted by this gateway will be
									// signed by this user using the credentials stored in the wallet.
									await gateway.connect(ccp, {
										wallet,
										identity: org1UserId,
										discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
									});

									// Build a network instance based on the channel where the smart contract is deployed
									const network = await gateway.getNetwork(channelName);

									// Get the contract from the network.
									const contract = network.getContract(chaincodeName);

									// Initialize a set of asset data on the channel using the chaincode 'InitLedger' function.
									// This type of transaction would only be run once by an application the first time it was started after it
									// is deployed the first time. Any updates to the chaincode deployed later would likely not need to run
									// an "init" type function.
									// Comment out this line after first execution and restart server.
									let assetsExist = await contract.evaluateTransaction('AssetExists', 'asset1');
									// add initial assets only when they do not exist
									if (assetsExist == 'false') {
										await contract.submitTransaction('InitLedger');
										console.log('*** Result: committed');
									}
									// Let's try a query type operation (function).
									// This will be sent to just one peer and the results will be shown.
									console.log('\n--> Evaluate Transaction: GetAllAssets, function returns all the current assets on the ledger');
									let result = await contract.evaluateTransaction('GetAllAssets');
									console.log(`*** Result: ${prettyJSONString(result.toString())}`);

									let data = result.toString();
									let data2 = [];
									let label = [];
									let values = [];
									// remove {} [] ""
									for (var i = 0; i < data.length; i++) {
										if (data[i] != '{' && data[i] != '}' && data[i] != '{' && data[i] != '"' && data[i] != '[' && data[i] != ']') {
											data2.push(data[i]);
										}
									}
									// Get Labels (Key, make, model, colour, owner)
									let string;
									let j;
									for (var i = 0; i < data2.length; i++) {
										string = '';
										if (i == 0 || data2[i] == ',') {
											// Eliminite the word 'Record'
											if (data2[i + 1] == 'R' && data2[i + 2] == 'e' && data2[i + 3] == 'c' && data2[i + 4] == 'o' && data2[i + 5] == 'r' && data2[i + 6] == 'd') {
												i += 7;
											}
											if (i == 0) {
												j = i;
											}
											else {
												j = i + 1;
											}
											while (data2[j] != ':') {
												string += data2[j];
												j++;
											}
											label.push(string);
											i = --j;
										}
									}
									// Get Values (CAR0, Toyota, Prius, blue, Tomoko)
									for (var i = 0; i < data2.length; i++) {
										string = '';
										if (data2[i] == ':') {
											j = i + 1;
											while (data2[j] != ',') {
												if (j == data2.length - 1) {
													string += data2[j];
													break;
												}
												string += data2[j];
												j++;
											}
											if (string != '') {
												values.push(string);
											}
											i = --j;
										}
									}
									// Call display.ejs from the view folder to display all assets
									// res.render('display', { layout: false });

									res.render('patwari', {
										// layout: false,
										label: label,
										values: values,
										username: org1UserId
									});

								} finally {
									// Disconnect from the gateway when the application is closing
									// This will close all connections to the network
									gateway.disconnect();
								}


							} else {
								// eslint-disable-next-line no-use-before-define
								await validation(org1UserId, private_key);
							}

						} else {
							// eslint-disable-next-line no-use-before-define
							await errorDisplay();

						}

					});
				});
				async function errorDisplay() {
					res.render('login_form', {
						errors: 'You have provided an invalid password'
					});
					return;
				}

				async function validation(org1UserId, private_key) {
					try {
						const userIdentity = await wallet.get(org1UserId);
						if (!userIdentity) {
							console.log(`An identity for the user ${org1UserId} does not exist in the wallet`);
							res.render('login_form', {
								errors: 'An identity for the user ' + org1UserId + ' does not exist in the wallet'
							});
							return;
						}
						// Take hash between -----PRIVATE KEY----- and ---END PRIVATE KEY---
						// Press ctrl+f and remove \r\n from the hash and use it as password
						if (userIdentity && userIdentity.type === 'X.509') {
							const pk1 = userIdentity.credentials.privateKey.substr(27, 66);
							const pk2 = userIdentity.credentials.privateKey.substr(95, 64);
							const pk3 = userIdentity.credentials.privateKey.substr(161, 56);
							const privateKey = pk1.trim() + pk2.trim() + pk3.trim();
							if (private_key != privateKey) {
								res.render('login_form', {
									errors: 'You have provided an invalid password'
								});
								return;
							}
						}
						// setup the gateway instance
						// The user will now be able to create connections to the fabric network and be able to
						// submit transactions and query. All transactions submitted by this gateway will be
						// signed by this user using the credentials stored in the wallet.
						await gateway.connect(ccp, {
							wallet,
							identity: org1UserId,
							discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
						});

						// Build a network instance based on the channel where the smart contract is deployed
						const network = await gateway.getNetwork(channelName);

						// Get the contract from the network.
						const contract = network.getContract(chaincodeName);

						// Initialize a set of asset data on the channel using the chaincode 'InitLedger' function.
						// This type of transaction would only be run once by an application the first time it was started after it
						// is deployed the first time. Any updates to the chaincode deployed later would likely not need to run
						// an "init" type function.
						// Comment out this line after first execution and restart server.
						let assetsExist = await contract.evaluateTransaction('AssetExists', 'asset1');
						// add initial assets only when they do not exist
						if (assetsExist == 'false') {
							await contract.submitTransaction('InitLedger');
							console.log('*** Result: committed');
						}
						// Let's try a query type operation (function).
						// This will be sent to just one peer and the results will be shown.
						console.log('\n--> Evaluate Transaction: GetAllAssets, function returns all the current assets on the ledger');
						let result = await contract.evaluateTransaction('GetAllAssets');
						console.log(`*** Result: ${prettyJSONString(result.toString())}`);

						let data = result.toString();
						let data2 = [];
						let label = [];
						let values = [];
						// remove {} [] ""
						for (var i = 0; i < data.length; i++) {
							if (data[i] != '{' && data[i] != '}' && data[i] != '{' && data[i] != '"' && data[i] != '[' && data[i] != ']') {
								data2.push(data[i]);
							}
						}
						// Get Labels (Key, make, model, colour, owner)
						let string;
						let j;
						for (var i = 0; i < data2.length; i++) {
							string = '';
							if (i == 0 || data2[i] == ',') {
								// Eliminite the word 'Record'
								if (data2[i + 1] == 'R' && data2[i + 2] == 'e' && data2[i + 3] == 'c' && data2[i + 4] == 'o' && data2[i + 5] == 'r' && data2[i + 6] == 'd') {
									i += 7;
								}
								if (i == 0) {
									j = i;
								}
								else {
									j = i + 1;
								}
								while (data2[j] != ':') {
									string += data2[j];
									j++;
								}
								label.push(string);
								i = --j;
							}
						}
						// Get Values (CAR0, Toyota, Prius, blue, Tomoko)
						for (var i = 0; i < data2.length; i++) {
							string = '';
							if (data2[i] == ':') {
								j = i + 1;
								while (data2[j] != ',') {
									if (j == data2.length - 1) {
										string += data2[j];
										break;
									}
									string += data2[j];
									j++;
								}
								if (string != '') {
									values.push(string);
								}
								i = --j;
							}
						}
						// Call display.ejs from the view folder to display all assets
						// res.render('display', { layout: false });

						res.render('display', {
							// layout: false,
							label: label,
							values: values,
							username: org1UserId
						});

					} finally {
						// Disconnect from the gateway when the application is closing
						// This will close all connections to the network
						gateway.disconnect();
					}
				}
			} catch (error) {
				console.error(`******** FAILED to run the application: ${error}`);
			}
		}
		main();
	}
});




// Login Flutter API

// router.post('/login_api', function (req, res) {
// 	console.log('Flutter Login Request Received Successfully');
// 	let errors = [];
// 	if (!req.body.cnic) {
// 		errors.push('User cnic must be provided');
// 	}
// 	if (!req.body.pw) {
// 		errors.push('Password must be provided');
// 	}
// 	if (errors.length > 0) {
// 		res.status(400).json({ errors: errors });
// 	}
// 	else {
// 		// a variable to save a session
// 		let session;
// 		session = req.session;
// 		session.userid = req.body.cnic;
// 		console.log(req.session);

// 		'use strict';

// 		const { Gateway, Wallets } = require('fabric-network');
// 		const FabricCAServices = require('fabric-ca-client');
// 		const path = require('path');
// 		const { buildCAClient, registerAndEnrollUser, enrollAdmin } = require('../../test-application/javascript/CAUtil.js');
// 		const { buildCCPOrg1, buildWallet } = require('../../test-application/javascript/AppUtil.js');

// 		const channelName = 'mychannel';
// 		const chaincodeName = 'basic';
// 		const mspOrg1 = 'Org1MSP';
// 		const walletPath = path.join(__dirname, 'wallet');
// 		const mysql = require('mysql');

// 		const UserCnic = req.body.cnic;
// 		const UserPassword = req.body.pw;



// 		function prettyJSONString(inputString) {
// 			return JSON.stringify(JSON.parse(inputString), null, 2);
// 		}

// 		async function main() {
// 			try {
// 				// build an in memory object with the network configuration (also known as a connection profile)
// 				const ccp = buildCCPOrg1();

// 				// build an instance of the fabric ca services client based on
// 				// the information in the network configuration
// 				const caClient = buildCAClient(FabricCAServices, ccp, 'ca.org1.example.com');

// 				// setup the wallet to hold the credentials of the application user
// 				const wallet = await buildWallet(Wallets, walletPath);

// 				// in a real application this would be done on an administrative flow, and only once
// 				await enrollAdmin(caClient, wallet, mspOrg1);

// 				// in a real application this would be done only when a new user was required to be added
// 				// and would be part of an administrative flow
// 				//await registerAndEnrollUser(caClient, wallet, mspOrg1, org1UserId, 'org1.department1');

// 				// Create a new gateway instance for interacting with the fabric network.
// 				// In a real application this would be done as the backend server session is setup for
// 				// a user that has been verified.
// 				const gateway = new Gateway();
// 				//Create Connections

// 				const db = mysql.createConnection({
// 					host: 'localhost',
// 					user: 'root',
// 					password: '',
// 					database: 'test',
// 				});
// 				// connect to database
// 				db.connect((err) => {
// 					if (err) {
// 						console.log(err);
// 					}
// 					console.log('Connection done');
// 				});
// 				db.connect(function (err) {
// 					let sql = `SELECT * FROM user WHERE user_cnic= ${UserCnic}`;
// 					let query = db.query(sql, async (err, result) => {
// 						if (err) {
// 							console.log("Data Not Found");
// 						}
// 						// console.log(result);
// 						const fetchedResult = result;

// 						const org1UserId = fetchedResult[0].username;
// 						const private_key = fetchedResult[0].private_key;

// 						if (fetchedResult[0].password == UserPassword) {
// 							// Call a function or perform actions that rely on the fetched data
// 							// eslint-disable-next-line no-use-before-define
// 							if (org1UserId == 'Patwari') {
// 								try {
// 									const userIdentity = await wallet.get(org1UserId);
// 									if (!userIdentity) {
// 										console.log(`An identity for the user ${org1UserId} does not exist in the wallet`);
// 										res.render('login_form', {
// 											errors: 'An identity for the user ' + org1UserId + ' does not exist in the wallet'
// 										});
// 										return;
// 									}
// 									// Take hash between -----PRIVATE KEY----- and ---END PRIVATE KEY---
// 									// Press ctrl+f and remove \r\n from the hash and use it as password
// 									if (userIdentity && userIdentity.type === 'X.509') {
// 										const pk1 = userIdentity.credentials.privateKey.substr(27, 66);
// 										const pk2 = userIdentity.credentials.privateKey.substr(95, 64);
// 										const pk3 = userIdentity.credentials.privateKey.substr(161, 56);
// 										const privateKey = pk1.trim() + pk2.trim() + pk3.trim();
// 										if (private_key != privateKey) {
// 											res.render('login_form', {
// 												errors: 'You have provided an invalid password'
// 											});
// 											return;
// 										}
// 									}
// 									// setup the gateway instance
// 									// The user will now be able to create connections to the fabric network and be able to
// 									// submit transactions and query. All transactions submitted by this gateway will be
// 									// signed by this user using the credentials stored in the wallet.
// 									await gateway.connect(ccp, {
// 										wallet,
// 										identity: org1UserId,
// 										discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
// 									});

// 									// Build a network instance based on the channel where the smart contract is deployed
// 									const network = await gateway.getNetwork(channelName);

// 									// Get the contract from the network.
// 									const contract = network.getContract(chaincodeName);

// 									// Initialize a set of asset data on the channel using the chaincode 'InitLedger' function.
// 									// This type of transaction would only be run once by an application the first time it was started after it
// 									// is deployed the first time. Any updates to the chaincode deployed later would likely not need to run
// 									// an "init" type function.
// 									// Comment out this line after first execution and restart server.
// 									let assetsExist = await contract.evaluateTransaction('AssetExists', 'asset1');
// 									// add initial assets only when they do not exist
// 									if (assetsExist == 'false') {
// 										await contract.submitTransaction('InitLedger');
// 										console.log('*** Result: committed');
// 									}
// 									// Let's try a query type operation (function).
// 									// This will be sent to just one peer and the results will be shown.
// 									console.log('\n--> Evaluate Transaction: GetAllAssets, function returns all the current assets on the ledger');
// 									let result = await contract.evaluateTransaction('GetAllAssets');
// 									console.log(`*** Result: ${prettyJSONString(result.toString())}`);

// 									let data = result.toString();
// 									let data2 = [];
// 									let label = [];
// 									let values = [];
// 									// remove {} [] ""
// 									for (var i = 0; i < data.length; i++) {
// 										if (data[i] != '{' && data[i] != '}' && data[i] != '{' && data[i] != '"' && data[i] != '[' && data[i] != ']') {
// 											data2.push(data[i]);
// 										}
// 									}
// 									// Get Labels (Key, make, model, colour, owner)
// 									let string;
// 									let j;
// 									for (var i = 0; i < data2.length; i++) {
// 										string = '';
// 										if (i == 0 || data2[i] == ',') {
// 											// Eliminite the word 'Record'
// 											if (data2[i + 1] == 'R' && data2[i + 2] == 'e' && data2[i + 3] == 'c' && data2[i + 4] == 'o' && data2[i + 5] == 'r' && data2[i + 6] == 'd') {
// 												i += 7;
// 											}
// 											if (i == 0) {
// 												j = i;
// 											}
// 											else {
// 												j = i + 1;
// 											}
// 											while (data2[j] != ':') {
// 												string += data2[j];
// 												j++;
// 											}
// 											label.push(string);
// 											i = --j;
// 										}
// 									}
// 									// Get Values (CAR0, Toyota, Prius, blue, Tomoko)
// 									for (var i = 0; i < data2.length; i++) {
// 										string = '';
// 										if (data2[i] == ':') {
// 											j = i + 1;
// 											while (data2[j] != ',') {
// 												if (j == data2.length - 1) {
// 													string += data2[j];
// 													break;
// 												}
// 												string += data2[j];
// 												j++;
// 											}
// 											if (string != '') {
// 												values.push(string);
// 											}
// 											i = --j;
// 										}
// 									}
// 									// Call display.ejs from the view folder to display all assets
// 									// res.render('display', { layout: false });

// 									const responseData = {
// 										label: label,
// 										values: values,
// 										username: org1UserId
// 									  };

// 									  res.status(200).json(responseData);

// 								} finally {
// 									// Disconnect from the gateway when the application is closing
// 									// This will close all connections to the network
// 									gateway.disconnect();
// 								}


// 							} else {
// 								// eslint-disable-next-line no-use-before-define
// 								await validation(org1UserId, private_key);
// 							}

// 						} else {
// 							// eslint-disable-next-line no-use-before-define
// 							res.status(400).json({ errors: errors });

// 						}

// 					});
// 				});

// 				async function validation(org1UserId, private_key) {
// 					try {
// 						const userIdentity = await wallet.get(org1UserId);
// 						if (!userIdentity) {
// 							console.log(`An identity for the user ${org1UserId} does not exist in the wallet`);
// 							res.render('login_form', {
// 								errors: 'An identity for the user ' + org1UserId + ' does not exist in the wallet'
// 							});
// 							return;
// 						}
// 						// Take hash between -----PRIVATE KEY----- and ---END PRIVATE KEY---
// 						// Press ctrl+f and remove \r\n from the hash and use it as password
// 						if (userIdentity && userIdentity.type === 'X.509') {
// 							const pk1 = userIdentity.credentials.privateKey.substr(27, 66);
// 							const pk2 = userIdentity.credentials.privateKey.substr(95, 64);
// 							const pk3 = userIdentity.credentials.privateKey.substr(161, 56);
// 							const privateKey = pk1.trim() + pk2.trim() + pk3.trim();
// 							if (private_key != privateKey) {
// 								res.render('login_form', {
// 									errors: 'You have provided an invalid password'
// 								});
// 								return;
// 							}
// 						}
// 						// setup the gateway instance
// 						// The user will now be able to create connections to the fabric network and be able to
// 						// submit transactions and query. All transactions submitted by this gateway will be
// 						// signed by this user using the credentials stored in the wallet.
// 						await gateway.connect(ccp, {
// 							wallet,
// 							identity: org1UserId,
// 							discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
// 						});

// 						// Build a network instance based on the channel where the smart contract is deployed
// 						const network = await gateway.getNetwork(channelName);

// 						// Get the contract from the network.
// 						const contract = network.getContract(chaincodeName);

// 						// Initialize a set of asset data on the channel using the chaincode 'InitLedger' function.
// 						// This type of transaction would only be run once by an application the first time it was started after it
// 						// is deployed the first time. Any updates to the chaincode deployed later would likely not need to run
// 						// an "init" type function.
// 						// Comment out this line after first execution and restart server.
// 						let assetsExist = await contract.evaluateTransaction('AssetExists', 'asset1');
// 						// add initial assets only when they do not exist
// 						if (assetsExist == 'false') {
// 							await contract.submitTransaction('InitLedger');
// 							console.log('*** Result: committed');
// 						}
// 						// Let's try a query type operation (function).
// 						// This will be sent to just one peer and the results will be shown.
// 						console.log('\n--> Evaluate Transaction: GetAllAssets, function returns all the current assets on the ledger');
// 						let result = await contract.evaluateTransaction('GetAllAssets');
// 						console.log(`*** Result: ${prettyJSONString(result.toString())}`);

// 						let data = result.toString();
// 						let data2 = [];
// 						let label = [];
// 						let values = [];
// 						// remove {} [] ""
// 						for (var i = 0; i < data.length; i++) {
// 							if (data[i] != '{' && data[i] != '}' && data[i] != '{' && data[i] != '"' && data[i] != '[' && data[i] != ']') {
// 								data2.push(data[i]);
// 							}
// 						}
// 						// Get Labels (Key, make, model, colour, owner)
// 						let string;
// 						let j;
// 						for (var i = 0; i < data2.length; i++) {
// 							string = '';
// 							if (i == 0 || data2[i] == ',') {
// 								// Eliminite the word 'Record'
// 								if (data2[i + 1] == 'R' && data2[i + 2] == 'e' && data2[i + 3] == 'c' && data2[i + 4] == 'o' && data2[i + 5] == 'r' && data2[i + 6] == 'd') {
// 									i += 7;
// 								}
// 								if (i == 0) {
// 									j = i;
// 								}
// 								else {
// 									j = i + 1;
// 								}
// 								while (data2[j] != ':') {
// 									string += data2[j];
// 									j++;
// 								}
// 								label.push(string);
// 								i = --j;
// 							}
// 						}
// 						// Get Values (CAR0, Toyota, Prius, blue, Tomoko)
// 						for (var i = 0; i < data2.length; i++) {
// 							string = '';
// 							if (data2[i] == ':') {
// 								j = i + 1;
// 								while (data2[j] != ',') {
// 									if (j == data2.length - 1) {
// 										string += data2[j];
// 										break;
// 									}
// 									string += data2[j];
// 									j++;
// 								}
// 								if (string != '') {
// 									values.push(string);
// 								}
// 								i = --j;
// 							}
// 						}
// 						// Call display.ejs from the view folder to display all assets
// 						// res.render('display', { layout: false });

// 						const responseData = {
// 							label: label,
// 							values: values,
// 							username: org1UserId
// 						  };

// 						  res.status(200).json(responseData);

// 					} finally {
// 						// Disconnect from the gateway when the application is closing
// 						// This will close all connections to the network
// 						gateway.disconnect();
// 					}
// 				}
// 			} catch (error) {
// 				console.error(`******** FAILED to run the application: ${error}`);
// 				res.status(400).json({ errors: errors });
// 			}
// 		}
// 		main();
// 	}
// });

router.post('/login_api', function (req, res) {
	console.log('Flutter Login Request Received Successfully');
	let errors = [];
	if (!req.body.cnic) {
	  errors.push('User CNIC must be provided');
	}
	if (!req.body.pw) {
	  errors.push('Password must be provided');
	}
	if (errors.length > 0) {
	  return res.status(400).json({ errors: errors });
	}

	let session;
	session = req.session;
	session.userid = req.body.cnic;
	console.log(req.session);

	const { Gateway, Wallets } = require('fabric-network');
	const FabricCAServices = require('fabric-ca-client');
	const path = require('path');
	const { buildCAClient, registerAndEnrollUser, enrollAdmin } = require('../../test-application/javascript/CAUtil.js');
	const { buildCCPOrg1, buildWallet } = require('../../test-application/javascript/AppUtil.js');

	const channelName = 'mychannel';
	const chaincodeName = 'basic';
	const mspOrg1 = 'Org1MSP';
	const walletPath = path.join(__dirname, 'wallet');
	const mysql = require('mysql');

	const UserCnic = req.body.cnic;
	const UserPassword = req.body.pw;

	function prettyJSONString(inputString) {
	  return JSON.stringify(JSON.parse(inputString), null, 2);
	}

	async function main() {
	  try {
		const ccp = buildCCPOrg1();
		const caClient = buildCAClient(FabricCAServices, ccp, 'ca.org1.example.com');
		const wallet = await buildWallet(Wallets, walletPath);
		await enrollAdmin(caClient, wallet, mspOrg1);

		const gateway = new Gateway();
		const db = mysql.createConnection({
		  host: 'localhost',
		  user: 'root',
		  password: '',
		  database: 'test',
		});
		db.connect((err) => {
		  if (err) {
			console.log(err);
			return res.status(500).json({ error: 'Failed to connect to the database' });
		  }
		  console.log('Connection done');
		});

		db.connect(async function (err) {
		  let sql = `SELECT * FROM user WHERE user_cnic=${UserCnic}`;
		  let query = db.query(sql, async (err, result) => {
			if (err) {
			  console.log('Data Not Found');
			  return res.status(400).json({ error: 'Data Not Found' });
			}
			const fetchedResult = result;
			const org1UserId = fetchedResult[0].username;
			const private_key = fetchedResult[0].private_key;

			if (fetchedResult[0].password != UserPassword) {
			  return res.status(400).json({ error: 'Invalid password' });
			}

			if (org1UserId === 'Patwari') {
			  try {
				const userIdentity = await wallet.get(org1UserId);
				if (!userIdentity) {
				  console.log(`An identity for the user ${org1UserId} does not exist in the wallet`);
				  return res.status(400).json({ error: `An identity for the user ${org1UserId} does not exist in the wallet` });
				}

				const pk1 = userIdentity.credentials.privateKey.substr(27, 66);
				const pk2 = userIdentity.credentials.privateKey.substr(95, 64);
				const pk3 = userIdentity.credentials.privateKey.substr(161, 56);
				const privateKey = pk1.trim() + pk2.trim() + pk3.trim();

				if (private_key !== privateKey) {
				  return res.status(400).json({ error: 'Invalid password' });
				}

				await gateway.connect(ccp, {
				  wallet,
				  identity: org1UserId,
				  discovery: { enabled: true, asLocalhost: true },
				});

				const network = await gateway.getNetwork(channelName);
				const contract = network.getContract(chaincodeName);

				let assetsExist = await contract.evaluateTransaction('AssetExists', 'asset1');
				if (assetsExist === 'false') {
				  await contract.submitTransaction('InitLedger');
				  console.log('*** Result: committed');
				}

				console.log('\n--> Evaluate Transaction: GetAllAssets, function returns all the current assets on the ledger');
				let result = await contract.evaluateTransaction('GetAllAssets');
				console.log(`*** Result: ${prettyJSONString(result.toString())}`);

				let data = result.toString();
				let data2 = [];
				let label = [];
				let values = [];

				for (var i = 0; i < data.length; i++) {
				  if (data[i] != '{' && data[i] != '}' && data[i] != '{' && data[i] != '"' && data[i] != '[' && data[i] != ']') {
					data2.push(data[i]);
				  }
				}

				let string;
				let j;

				for (var i = 0; i < data2.length; i++) {
				  string = '';
				  if (i == 0 || data2[i] == ',') {
					if (data2[i + 1] == 'R' && data2[i + 2] == 'e' && data2[i + 3] == 'c' && data2[i + 4] == 'o' && data2[i + 5] == 'r' && data2[i + 6] == 'd') {
					  i += 7;
					}
					if (i == 0) {
					  j = i;
					} else {
					  j = i + 1;
					}
					while (data2[j] != ':') {
					  string += data2[j];
					  j++;
					}
					label.push(string);
					i = --j;
				  }
				}

				for (var i = 0; i < data2.length; i++) {
				  string = '';
				  if (data2[i] == ':') {
					j = i + 1;
					while (data2[j] != ',') {
					  if (j == data2.length - 1) {
						string += data2[j];
						break;
					  }
					  string += data2[j];
					  j++;
					}
					if (string != '') {
					  values.push(string);
					}
					i = --j;
				  }
				}

				const responseData = {
				  label: label,
				  values: values,
				  username: org1UserId
				};

				return res.status(200).json(responseData);
			  } finally {
				gateway.disconnect();
			  }
			} else {
			  await validation(org1UserId, private_key);
			}
		  });
		});

		async function validation(org1UserId, private_key) {
		  try {
			const userIdentity = await wallet.get(org1UserId);
			if (!userIdentity) {
			  console.log(`An identity for the user ${org1UserId} does not exist in the wallet`);
			  return res.status(400).json({ error: `An identity for the user ${org1UserId} does not exist in the wallet` });
			}

			const pk1 = userIdentity.credentials.privateKey.substr(27, 66);
			const pk2 = userIdentity.credentials.privateKey.substr(95, 64);
			const pk3 = userIdentity.credentials.privateKey.substr(161, 56);
			const privateKey = pk1.trim() + pk2.trim() + pk3.trim();

			if (private_key !== privateKey) {
			  return res.status(400).json({ error: 'Invalid password' });
			}

			await gateway.connect(ccp, {
			  wallet,
			  identity: org1UserId,
			  discovery: { enabled: true, asLocalhost: true },
			});

			const network = await gateway.getNetwork(channelName);
			const contract = network.getContract(chaincodeName);

			let assetsExist = await contract.evaluateTransaction('AssetExists', 'asset1');
			if (assetsExist === 'false') {
			  await contract.submitTransaction('InitLedger');
			  console.log('*** Result: committed');
			}

			console.log('\n--> Evaluate Transaction: GetAllAssets, function returns all the current assets on the ledger');
			let result = await contract.evaluateTransaction('GetAllAssets');
			console.log(`*** Result: ${prettyJSONString(result.toString())}`);

			let data = result.toString();
			let data2 = [];
			let label = [];
			let values = [];

			for (var i = 0; i < data.length; i++) {
			  if (data[i] != '{' && data[i] != '}' && data[i] != '{' && data[i] != '"' && data[i] != '[' && data[i] != ']') {
				data2.push(data[i]);
			  }
			}

			let string;
			let j;

			for (var i = 0; i < data2.length; i++) {
			  string = '';
			  if (i == 0 || data2[i] == ',') {
				if (data2[i + 1] == 'R' && data2[i + 2] == 'e' && data2[i + 3] == 'c' && data2[i + 4] == 'o' && data2[i + 5] == 'r' && data2[i + 6] == 'd') {
				  i += 7;
				}
				if (i == 0) {
				  j = i;
				} else {
				  j = i + 1;
				}
				while (data2[j] != ':') {
				  string += data2[j];
				  j++;
				}
				label.push(string);
				i = --j;
			  }
			}

			for (var i = 0; i < data2.length; i++) {
			  string = '';
			  if (data2[i] == ':') {
				j = i + 1;
				while (data2[j] != ',') {
				  if (j == data2.length - 1) {
					string += data2[j];
					break;
				  }
				  string += data2[j];
				  j++;
				}
				if (string != '') {
				  values.push(string);
				}
				i = --j;
			  }
			}

			const responseData = {
			  label: label,
			  values: values,
			  username: org1UserId
			};

			return res.status(200).json(responseData);
		  } finally {
			gateway.disconnect();
		  }
		}
	  } catch (error) {
		console.error(`******** FAILED to run the application: ${error}`);
		return res.status(400).json({ error: 'Failed to run the application' });
	  }
	}

	main();
  });










// router.get('/patwari', function (req, res) {
// 	res.render('patwari', {
// 		errors: {}
// 	});
// });

// router.get('/requested_lands', function (req, res) {
// 	res.render('requested_lands', {
// 		errors: {}
// 	});
// });

router.get('/requested_lands', function (req, res) {
	const mysql = require('mysql');
	const UserCnic = req.session.userid;

	const db = mysql.createConnection({
		host: 'localhost',
		user: 'root',
		password: '',
		database: 'test',
	});
	// connect to database
	db.connect((err) => {
		if (err) {
			console.log(err);
		}
		console.log('Connection done 2');
	});

	async function main() {
		db.connect(function (err) {
			let sql = `SELECT * FROM buyer_requests WHERE buyer_cnic= ${UserCnic}`;
			let query = db.query(sql, async (err, result) => {
				if (err) {
					console.log("Data Not Found");
				}
				// console.log(result);
				const all_requests = result;
				// console.log(all_requests);
				// eslint-disable-next-line no-use-before-define
				await request(all_requests);

			});
		});
		// Call display.ejs file to show the list of assets
		// res.render('display', { layout: false });
		async function request(all_requests) {
			console.log(all_requests);
			try {
				const seller_cnic = all_requests[0].seller_cnic;
				db.connect(function (err) {
					let sql = `SELECT * FROM land_record WHERE land_id= '${all_requests[0].land_id}'`;
					let sql2 = `SELECT * FROM user WHERE user_cnic = ${seller_cnic}`;
					let query = db.query(sql, async (err, result) => {
						if (err) {
							console.log("Data Not Found");
						}
						console.log('Working');
						const fetchedResult = result;
						// console.log(fetchedResult);

						const Address = fetchedResult[0].khatuni + ' ' + fetchedResult[0].mauza + ' ' + fetchedResult[0].tehsil + ' ' +
							fetchedResult[0].district + ' ' + 'Punjab' + ' ' + 'Pakistan';
						const Land_id = fetchedResult[0].land_id;
						console.log(Address);
						let Status;
						if (all_requests[0].status == 0) {
							Status = 'Pending';

						} else if (all_requests[0].status == 1) {
							Status = 'Not Approved';
						}
						else {
							Status = 'Approved';
						}

						let data = [];
						db.query(sql2, async (err, result2) => {
							if (err) {
								console.log("Data Not Found");
							}
							const seller_cnic = result2[0].username;
							data.push(seller_cnic); // Add seller name to the data array
							data.push(Land_id);
							data.push(Address);
							data.push(Status);
							console.log(data);
							if (data && data.length > 0) {
								// Code to execute when data is not empty
								// eslint-disable-next-line no-use-before-define
								await requested_data(data);
							} else {
								// Code to execute when data is empty
								res.render('requested_lands', {
									// layout: false,
									// data: all_requests
									values: [],
								});
							}
						});
					});
				});

				async function requested_data(data) {
					res.render('requested_lands', {
						// layout: false,
						// data: all_requests
						values: data,
					});
				}
			} catch (error) {
				console.log(error);
				res.render('requested_lands', {
					// layout: false,
					// data: all_requests
					values: [],
				});

			}
		}
	}
	main();
});

router.get('/received_lands', function (req, res) {
	const mysql = require('mysql');
	const UserCnic = req.session.userid;

	const db = mysql.createConnection({
		host: 'localhost',
		user: 'root',
		password: '',
		database: 'test',
	});
	// connect to database
	db.connect((err) => {
		if (err) {
			console.log(err);
		}
		console.log('Connection done 2');
	});

	async function main() {
		db.connect(function (err) {
			let sql = `SELECT * FROM buyer_requests WHERE seller_cnic= ${UserCnic}`;
			let query = db.query(sql, async (err, result) => {
				if (err) {
					console.log("Data Not Found");
				}
				// console.log(result);
				const all_requests = result;
				// console.log(all_requests);
				// eslint-disable-next-line no-use-before-define
				await request(all_requests);

			});
		});
		// Call display.ejs file to show the list of assets
		// res.render('display', { layout: false });
		async function request(all_requests) {
			try {
				if (!Array.isArray(all_requests) || all_requests.length === 0) {
					console.log("Invalid or empty 'all_requests' parameter");
				}

				const buyer_cnic = all_requests[0].buyer_cnic;
				db.connect(function (err) {
					if (err) {
						console.log("Database connection error:", err);
					}

					let sql = `SELECT * FROM land_record WHERE land_id = '${all_requests[0].land_id}'`;
					let sql2 = `SELECT * FROM user WHERE user_cnic = ${buyer_cnic}`;

					let query = db.query(sql, async (err, result) => {
						if (err) {
							console.log("Data not found in land_record table");
							throw new Error("Failed to fetch data from the land_record table");
						}

						const fetchedResult = result;
						const Address = fetchedResult[0].khatuni + ' ' + fetchedResult[0].mauza + ' ' + fetchedResult[0].tehsil + ' ' +
							fetchedResult[0].district + ' ' + 'Punjab' + ' ' + 'Pakistan';
						const Land_id = fetchedResult[0].land_id;

						if (all_requests[0].status == 0) {
							let data = [];
							db.query(sql2, async (err, result2) => {
								if (err) {
									console.log("Data not found in user table");
									throw new Error("Failed to fetch data from the user table");
								}

								const buyer_cnic = result2[0].username;
								data.push(buyer_cnic); // Add seller name to the data array
								data.push(Land_id);
								data.push(Address);

								// eslint-disable-next-line no-use-before-define
								await requested_data(data);
							});
						} else {
							res.render('received_lands', {
								values: [],
							});
						}
					});
				});
			} catch (error) {
				console.log("Error occurred:", error.message);
				res.render('received_lands', {
					values: [],
				});
			}
		}

		async function requested_data(data) {
			res.render('received_lands', {
				values: data,
			});
		}

	}
	main();
});




router.post('/land_request', function (req, res) {
	let errors = [];
	if (!req.body.id) {
		errors.push('Asset ID must be provided');
	}
	if (errors.length > 0) {
		res.render('display', {
			errors: errors
		});
	}
	else {
		'use strict';

		const mysql = require('mysql');
		const LandId = req.body.id;


		console.log(LandId);
		const UserCnic = req.session.userid;

		const db = mysql.createConnection({
			host: 'localhost',
			user: 'root',
			password: '',
			database: 'test',
		});
		// connect to database
		db.connect((err) => {
			if (err) {
				console.log(err);
			}
			console.log('Connection done 1');
		});

		db.connect(function (err) {
			let sql = `SELECT * FROM land_record WHERE land_id = '${LandId}'`;
			let query = db.query(sql, async (err, result) => {
				if (err) {
					console.log("Data Not Found");
				}
				const fetchedResult = result;
				// eslint-disable-next-line no-use-before-define
				await main(fetchedResult);
			});
		});


		async function main(fetchedResult) {
			try {

				// console.log(fetchedResult);

				db.connect(function (err) {
					let post = { land_id: LandId, seller_cnic: fetchedResult[0].user_cnic, buyer_cnic: UserCnic, status: 0 };
					let checkQuery = "SELECT * FROM buyer_requests WHERE land_id = ?";
					let checkValues = [LandId];
					let query = db.query(checkQuery, checkValues, (err, result) => {
						if (err) {
							console.log(err);
						}
						if (result.length === 0) {
							let insertQuery = "INSERT INTO buyer_requests SET ?";
							let insertValues = post;
							db.query(insertQuery, insertValues, (err, result) => {
								if (err) {
									console.log(err);
								}
								console.log("Successfully buyer request is added in the database");
								// Send a success response
							});
						} else {
							console.log(" ");
						}
					});
				});
				res.status(200).json({ success: true });

				// res.render('requested_lands', {
				// 	errors: {}
				// });



			} catch (error) {
				console.error(`******** FAILED to run the application: ${error}`);
			}
		}
		// main();
	}
});


router.post('/cancel_request', function (req, res) {
	let errors = [];
	if (!req.body.id) {
		errors.push('Asset ID must be provided');
	}
	if (errors.length > 0) {
		res.render('display', {
			errors: errors
		});
	}
	else {
		'use strict';

		const mysql = require('mysql');
		const LandId = req.body.id;


		console.log(LandId);
		const UserCnic = req.session.userid;

		const db = mysql.createConnection({
			host: 'localhost',
			user: 'root',
			password: '',
			database: 'test',
		});
		// connect to database
		db.connect((err) => {
			if (err) {
				console.log(err);
			}
			console.log('Connection done 5');
		});

		db.connect(function (err) {
			let sql = `SELECT * FROM buyer_requests WHERE land_id = '${LandId}'`;
			let query = db.query(sql, async (err, result) => {
				if (err) {
					console.log("Data Not Found");
				}
				const fetchedResult = result;
				// eslint-disable-next-line no-use-before-define
				await main(fetchedResult);
			});
		});


		async function main(fetchedResult) {
			try {

				// console.log(fetchedResult);

				db.connect(function (err) {
					const LandId = fetchedResult[0].land_id; // Assuming you have the LandId value
					let updateQuery = "UPDATE buyer_requests SET status = ? WHERE land_id = ? AND buyer_cnic = ?";
					let updateValues = [1, LandId, UserCnic]; // Update status value to 1 (or your desired value)

					db.query(updateQuery, updateValues, (err, result) => {
						if (err) {
							console.log(err);
						}
						console.log("Successfully updated the status in the buyer_requests table");

						// Send a success response
						res.status(200).json({ success: true });
					});
				});
			} catch (error) {
				console.error(`******** FAILED to run the application: ${error}`);
			}
		}
		// main();
	}
});

router.get('/logout', function (req, res) {
	req.session.destroy();
	// Unset userid otherwise data can be view via URL like this: http://localhost:3001/display
	session.userid = undefined;
	res.redirect('/');
});

// to use this router we export these routers from this file and then import that into app.js
// using --- const routes=require('./routes');  -- see line 110 in app.js file
module.exports = router;