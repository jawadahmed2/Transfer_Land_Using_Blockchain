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


// Display Registered Assets into the blockchain
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


// Display ALL my Registered Assets into the blockchain
router.get('/display_mylands', function (req, res) {
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
				res.render('my_lands', {
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


// Register Assests Form
router.get('/insert_form', function (req, res) {
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
		console.log('Connection done insert form');
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

			res.render('insert_form', {
				username: org1UserId,
				errors: {},
				success: {}
			});
		});
	});

});

// Register Assets into the blockchain
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


// Register Assets api for flutter into the blockchain
router.post('/create_asset_api', function (req, res) {
	console.log('Flutter Request called for adding new record');
	let errors = [];
	if (!req.body.id) {
		errors.push('ID must be provided');
	}
	if (!req.body.size) {
		errors.push('Land Size must be provided');
	}
	if (!req.body.value) {
		errors.push('Price must be provided');
	}
	if (errors.length > 0) {
		res.status(400).json({ errors: errors });
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
		const mysql = require('mysql');

		const UserCnic = req.body.usercnic;
		const District = req.body.district;
		const Tehsil = req.body.tehsil;
		const Mauza = req.body.mauza;
		const Land_id = req.body.id;
		const Land_price = req.body.value;
		const Land_size = req.body.size;
		const Khatuni = req.body.khatuni;
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
				res.status(500).json({ error: 'Database connection error' });
			} else {
				console.log('Connection done');
				const post = {
					user_cnic: UserCnic,
					district: District,
					tehsil: Tehsil,
					mauza: Mauza,
					khatuni: Khatuni,
					land_id: Land_id,
					land_size: Land_size,
					land_price: Land_price
				};

				const checkQuery = "SELECT * FROM land_record WHERE khatuni = ?";
				const checkValues = [Khatuni];
				db.query(checkQuery, checkValues, (err, result) => {
					if (err) {
						console.log(err);
						res.status(500).json({ error: 'Database query error' });
					} else {
						if (result.length === 0) {
							const insertQuery = "INSERT INTO land_record SET ?";
							db.query(insertQuery, post, (err, result) => {
								if (err) {
									console.log(err);
									res.status(500).json({ error: 'Database insert error' });
								} else {
									console.log("Successfully added land record in the database");

									// Perform the blockchain transaction here
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
											// Call a function or perform actions that rely on the fetched data
											main(org1UserId)
												.then(() => {
													res.status(200).json({ success: 'Asset created successfully' });
												})
												.catch((error) => {
													console.error(`******** FAILED to run the application: ${error}`);
													res.status(500).json({ error: 'Blockchain transaction failed' });
												});
										});
									});



								}
							});
						} else {
							res.status(400).json({ error: 'Land record already exists' });
						}
					}
				});
			}
		});

		async function main(org1UserId) {
			try {
				if (org1UserId === undefined) {
					throw new Error('Please log in to add a new record.');
				}

				const ccp = buildCCPOrg1();
				const caClient = buildCAClient(FabricCAServices, ccp, 'ca.org1.example.com');
				const wallet = await buildWallet(Wallets, walletPath);
				await enrollAdmin(caClient, wallet, mspOrg1);
				await registerAndEnrollUser(caClient, wallet, mspOrg1, org1UserId, 'org1.department1');
				const gateway = new Gateway();

				await gateway.connect(ccp, {
					wallet,
					identity: org1UserId,
					discovery: { enabled: true, asLocalhost: true }
				});

				const network = await gateway.getNetwork(channelName);
				const contract = network.getContract(chaincodeName);

				console.log('\n--> Submit Transaction: CreateAsset, creates new asset with ID, address, owner, size, price, date, and type');
				await contract.submitTransaction('CreateAsset', req.body.id, Address, req.body.size, org1UserId, req.body.value);

				// Disconnect from the gateway when the application is closing
				// This will close all connections to the network
				gateway.disconnect();
			} catch (error) {
				throw new Error(`******** FAILED to run the application: ${error}`);
			}
		}
	}
});


// Land Search Form
router.get('/search_form', function (req, res) {
	res.render('search_form', {
		errors: {}
	});
});

// Asset Search by ID
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
							values: values,
							username: UserCnic
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

// Update Owner Form Get request
router.get('/update_owner_form', function (req, res) {
	res.render('update_owner_form', {
		errors: {},
		success: {}
	});
});


// Transfer ownership
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

		const LandId = req.body.id;

		const PDFDocument = require('pdfkit');
		const fs = require('fs');


		async function generateAndSavePDF(LandId, sellerName, newownerName, district, tehsil, mauza, khatuni, area, price) {
			const doc = new PDFDocument();

			// Create the PDF content
			doc.fontSize(18).text('Govt Of Pakistan', { align: 'center' })
				.text('Punjab Land Department', { align: 'center' });

			doc.moveDown(); // Move down one line to add spacing between sections

			doc.fontSize(14).text(`Certificate number: ${Math.floor(Math.random() * 10000) + 1}`);

			// Heading with 18 font size and centered alignment
			doc.font('Helvetica-Bold').fontSize(16).text('LAND MUTATION CERTIFICATE', { align: 'center' });

			doc.moveDown(); // Move down one line to add spacing between sections

			doc.fontSize(14)
				.text(`This is to certify that the land with Land ID: ${LandId} has undergone a successful mutation process as per Mutation Case No. ${Math.floor(Math.random() * 10000) + 1}. The request for this mutation was made by ${sellerName}, and it has been officially transferred to the ownership of ${newownerName}.`)
				.text(`As of the issuance of this certificate, the Land is now rightfully and peacefully possessed by its new owner, ${newownerName}. This mutation has been duly recorded and acknowledged in accordance with the regulations of the Punjab Land Department.`)
				.moveDown()
				.text('The Government of Pakistan Land Department is hereby authorized to execute and verify this land mutation process, ensuring its legality and adherence to the applicable laws and policies.')
				.text('This certificate serves as a valid and official document affirming the legal transfer of ownership, and it must be treated with utmost significance in any related transactions or property dealings.');

			doc.moveDown(); // Move down one line to add spacing between sections

			doc.text('Land Schedule')
				.text(`Land ID: ${LandId}`)
				.text(`Mouza: ${mauza}`) // Add other land details here
				.text(`Khatuni: ${khatuni}`)
				.text(`Tehsil: ${tehsil}`)
				.text(`District: ${district}`)
				.text('Province: Punjab')
				.text(`Area: ${area}`)
				.text(`Price: ${price}`);

			// Save the PDF to a file
			const pdfPath = `LandMutation/land_certificate_${LandId}.pdf`;
			doc.pipe(fs.createWriteStream(pdfPath));
			doc.end();

			console.log(`PDF generated and saved to ${pdfPath}`);
		}



		const db = mysql.createConnection({
			host: 'localhost',
			user: 'root',
			password: '',
			database: 'test',
		});
		// connect to database
		db.connect(async (err) => {
			if (err) {
				console.log(err);
			}
			console.log('Connection done 4');
			console.log(req.body.id, req.body.newowner, req.body.seller_name);
			const org1UserSeller = req.body.seller_name;
			await main(org1UserSeller);
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
						console.log('You do not own the asset');
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
									const BuyerCnic = fetchedResult[0].buyer_cnic;
									let updateQuery = "UPDATE buyer_requests SET status = ? WHERE land_id = ? AND seller_cnic = ?";
									let updateValues = [2, LandId, fetchedResult[0].seller_cnic]; // Update status value to 1 (or your desired value)

									db.query(updateQuery, updateValues, (err, result) => {
										if (err) {
											console.log(err);
										}
										console.log("Successfully updated the status in the seller_requests table");

										// Update status in land_inspector table
										let inspectorUpdateQuery = "UPDATE land_inspector SET status = ? WHERE land_id = ? AND seller_cnic = ?";
										let inspectorUpdateValues = [2, LandId, fetchedResult[0].seller_cnic];

										db.query(inspectorUpdateQuery, inspectorUpdateValues, (err, result) => {
											if (err) {
												console.log(err);
											}
											console.log("Successfully updated the status in the land_inspector table");
											// Send a success response
											res.status(200).json({ response: 'success' });
										});

										// Update user_cnic in land_record table
										let updateLandRecordQuery = "UPDATE land_record SET user_cnic = ? WHERE land_id = ?";
										let updateLandRecordValues = [BuyerCnic, LandId];
										db.query(updateLandRecordQuery, updateLandRecordValues, (err, result) => {
											if (err) {
												console.log(err);
											}
											console.log("Successfully updated the user_cnic in the land_record table");
										});

										// Update user_cnic in land_record table
										let get_land_details = `SELECT * FROM land_record WHERE land_id = '${LandId}'`;
										db.query(get_land_details, (err, result) => {
											if (err) {
												console.log(err);
											}
											console.log("Successfully get land details");
											generateAndSavePDF(LandId, org1UserId, req.body.newowner, result[0].district, result[0].tehsil, result[0].mauza, result[0].khatuni, result[0].land_size, result[0].land_price);
										});

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
		// main(org1UserSeller);
	}
});


// Fard Generation
router.post('/land_fard', function (req, res) {
	console.log('Fard Generation Requested');
	let errors = [];
	if (!req.body.id) {
		errors.push('Asset ID must be provided');
	}
	if (!req.body.owner_name) {
		errors.push('Owner name must be provided');
	}
	else {
		'use strict';

		const mysql = require('mysql');
		const LandId = req.body.id;
		const PDFDocument = require('pdfkit');
		const fs = require('fs');
		const nodemailer = require('nodemailer');


		// Function to generate and save the Fard PDF
		async function generateAndSavePDF(LandId, ownerName, district, tehsil, mauza, khatuni, area, price) {
			const doc = new PDFDocument();

			// Create the PDF content
			doc.fontSize(18).text('Govt Of Pakistan', { align: 'center' })
				.text('Punjab Land Department', { align: 'center' });

			doc.moveDown(); // Move down one line to add spacing between sections

			doc.fontSize(14).text(`Certificate number: ${Math.floor(Math.random() * 10000) + 1}`);

			// Heading with 18 font size and centered alignment
			doc.font('Helvetica-Bold').fontSize(16).text('LAND OWNERSHIP CERTIFICATE', { align: 'center' });

			doc.moveDown(); // Move down one line to add spacing between sections

			// Custom message for land mutation certification
			doc.fontSize(14)
				.text(`This certificate is to certify that ${ownerName} is the sole owner of the land located at ${mauza}, ${khatuni}, ${tehsil}, ${district}, Punjab, Pakistan. The land is ${area} acres in size and is free from any encumbrances.`)

				.moveDown()
				.text('The Government of Pakistan Land Department is hereby authorized to execute and verify this land certificate process, ensuring its legality and adherence to the applicable laws and policies.');

			doc.moveDown(); // Move down one line to add spacing between sections

			// Land details
			doc.text('Land Details')
				.text(`Land ID: ${LandId}`)
				.text(`Mouza: ${mauza}`) // Add other land details here
				.text(`Khatuni: ${khatuni}`)
				.text(`Tehsil: ${tehsil}`)
				.text(`District: ${district}`)
				.text('Province: Punjab')
				.text(`Area: ${area}`)
				.text(`Price: ${price}`);

			// Save the PDF to a file
			const pdfPath = `FardGenerated/fard_document_${LandId}.pdf`;
			doc.pipe(fs.createWriteStream(pdfPath));
			doc.end();

			console.log(`PDF generated and saved to ${pdfPath}`);
		}

		// Function to send email with the PDF attachment
		function sendEmailWithAttachment(emailAddress, landId) {
			// Create a nodemailer transporter
			const transporter = nodemailer.createTransport({
				host: 'smtp.googlemail.com',
				port: 587,
				secure: false,
				auth: {
					user: 'asadlahorikhan@gmail.com', // Replace with your email address
					pass: 'voncenftdyholctz', // Replace with your email password
				},
			});

			// Setup email data with attachments

			const mailOptions = {
				from: 'asadlahorikhan@gmail.com', // Replace with your email address
				to: emailAddress, // Email address of the recipient
				subject: 'Land Ownership Certificate', // Email subject
				text: 'Dear land owner, please find attached your land ownership certificate.', // Email body text
				attachments: [
					{
						filename: `fard_document_${landId}.pdf`, // Filename of the attached PDF
						path: `FardGenerated/fard_document_${landId}.pdf`, // Path of the generated PDF
					},
				],
			};

			// Send email with defined transport object
			transporter.sendMail(mailOptions, (error, info) => {
				if (error) {
					console.log('Error sending email: ', error);
				} else {
					console.log('Email sent successfully: ', info.response);
					// Send a success response back to the client
					res.status(200).json({ success: true });
				}
			});
		}

		const db = mysql.createConnection({
			host: 'localhost',
			user: 'root',
			password: '',
			database: 'test',
		});

		// Connect to the database
		db.connect(async (err) => {
			if (err) {
				console.log(err);
			}
			console.log('Connection done fard');

			const org1UserOwner = req.body.owner_name;
			await main(org1UserOwner);
		});

		async function main(org1UserId) {
			try {
				// Fetch land details from the database
				db.connect(function (err) {
					let get_land_details = `SELECT * FROM land_record WHERE land_id = '${LandId}'`;
					db.query(get_land_details, (err, result) => {
						if (err) {
							console.log(err);
						}

						// Check if the result is not null and contains the required data
						if (result && result.length > 0) {
							console.log("Successfully get land details");
							generateAndSavePDF(LandId, org1UserId, result[0].district, result[0].tehsil, result[0].mauza, result[0].khatuni, result[0].land_size, result[0].land_price);

							// Send a success response back to the client
							res.status(200).json({ success: true });
						} else {
							console.log("Land details not found");
							// Send an error response back to the client
							res.status(400).json({ success: false, error: 'Land details not found' });
						}
						let get_email = `SELECT email_address FROM user WHERE username = '${org1UserId}'`;
						db.query(get_email, (err, result) => {
							if (err) {
								console.log(err);
							}
							if (result && result.length > 0) {
								console.log("Successfully get user email address");
								const userEmail = result[0].email_address;
								console.log("User Email Address: ", userEmail);

								// Send email with the PDF attachment
								sendEmailWithAttachment(userEmail, LandId);

							} else {
								console.log("Email Address not found");
							}
						});
					});
				});
			} catch (error) {
				console.error(`******** FAILED to run the application: ${error}`);
				// Send an error response back to the client
				res.status(500).json({ success: false, error: 'Failed to run the application' });
			}
		}
	}
});



router.get('/register_user_form', function (req, res) {
	res.render('register_user_form', {
		errors: {},
		success: {}
	});
});

// Register The User
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
					UserCnic: req.body.cnic,
					UserEmail: req.body.email
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

// Make Register API for Flutter

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
	const userEmail = context.UserEmail;
	const nodemailer = require('nodemailer');
	console.log(org1UserId, userPassword, userCnic, userEmail);

	// Function to send email with login credentials
	function sendEmailWithCredentials(emailAddress, org1UserId, userCnic, privateKey) {
		// Create a nodemailer transporter
		const transporter = nodemailer.createTransport({
			host: 'smtp.googlemail.com',
			port: 587,
			secure: false,
			auth: {
				user: 'asadlahorikhan@gmail.com', // Replace with your email address
				pass: 'voncenftdyholctz', // Replace with your email password
			},
		});

		// Setup email data with credentials
		const mailOptions = {
			from: 'asadlahorikhan@gmail.com', // Replace with your email address
			to: emailAddress, // Email address of the recipient
			subject: 'LRMS Login Credentials', // Email subject
			text: `Dear User,

	  Below are your login credentials for the land record management system:

	  Username: ${org1UserId}
	  User CNIC: ${userCnic}
	  System Private Key: ${privateKey}

	  Please keep these credentials secure and do not share them with anyone.

	  Best regards,
	  Land Record Management System`, // Email body text
		};

		// Send email with defined transport object
		transporter.sendMail(mailOptions, (error, info) => {
			if (error) {
				console.log('Error sending email: ', error);
			} else {
				console.log('Email sent successfully: ', info.response);
				// Send a success response back to the client
				res.status(200).json({ success: true });
			}
		});
	}



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
					let post = { private_key: privateKey, username: org1UserId, user_cnic: userCnic, password: userPassword, email_address: userEmail };
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
								// Send email with the PDF attachment
								sendEmailWithCredentials(userEmail, org1UserId, userCnic, privateKey);
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


// Check out the asset History
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
						date: dates,
						username: UserCnic
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

// Make history api for flutter
router.post('/history_api', async function (req, res) {
	console.log('Request Received From Flutter');
	let errors = [];
	if (!req.body.id) {
		errors.push('Asset ID must be provided');
	}
	if (errors.length > 0) {
		res.status(400).json({ errors: errors });
	} else {
		try {
			const { Gateway, Wallets } = require('fabric-network');
			const FabricCAServices = require('fabric-ca-client');
			const path = require('path');
			const { buildCAClient, registerAndEnrollUser, enrollAdmin } = require('../../test-application/javascript/CAUtil.js');
			const { buildCCPOrg1, buildWallet } = require('../../test-application/javascript/AppUtil.js');

			const channelName = 'mychannel';
			const chaincodeName = 'basic';
			const mspOrg1 = 'Org1MSP';
			const walletPath = path.join(__dirname, 'wallet');
			const UserCnic = req.body.userid;
			const mysql = require('mysql');

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

			async function main(org1UserId) {
				try {
					if (org1UserId === undefined) {
						res.status(401).json({ error: 'Please log in to see the history of an asset' });
						return;
					}

					// Build an in-memory object with the network configuration (also known as a connection profile)
					const ccp = buildCCPOrg1();

					// Build an instance of the Fabric CA services client based on the information in the network configuration
					const caClient = buildCAClient(FabricCAServices, ccp, 'ca.org1.example.com');

					// Setup the wallet to hold the credentials of the application user
					const wallet = await buildWallet(Wallets, walletPath);

					// In a real application, this would be done on an administrative flow, and only once
					await enrollAdmin(caClient, wallet, mspOrg1);

					// In a real application, this would be done only when a new user was required to be added
					// and would be part of an administrative flow
					await registerAndEnrollUser(caClient, wallet, mspOrg1, org1UserId, 'org1.department1');

					// Create a new gateway instance for interacting with the fabric network
					const gateway = new Gateway();

					try {
						// Setup the gateway instance
						// The user will now be able to create connections to the fabric network and be able to
						// submit transactions and queries. All transactions submitted by this gateway will be
						// signed by this user using the credentials stored in the wallet.
						await gateway.connect(ccp, {
							wallet,
							identity: org1UserId,
							discovery: { enabled: true, asLocalhost: true }, // using asLocalhost as this gateway is using a fabric network deployed locally
						});

						// Build a network instance based on the channel where the smart contract is deployed
						const network = await gateway.getNetwork(channelName);

						// Get the contract from the network
						const contract = network.getContract(chaincodeName);

						// Evaluate the transaction to get asset history
						console.log('\n--> Evaluate Transaction: GetAssetHistory, function returns all the current assets on the ledger');
						const result = await contract.evaluateTransaction('GetAssetHistory', req.body.id);
						console.log(`*** Result: ${result.toString()}`);

						const data = JSON.parse(result.toString());
						const owners = data.map(item => item.Owner);
						const dates = data.map(item => item.addedOn);

						res.status(200).json({ owners: owners, dates: dates });
					} finally {
						// Disconnect from the gateway when the application is closing
						// This will close all connections to the network
						gateway.disconnect();
					}
				} catch (error) {
					console.error(`******** FAILED to run the application: ${error}`);
					res.status(500).json({ error: 'An error occurred' });
				}
			}
		} catch (error) {
			console.error(`******** FAILED to run the application: ${error}`);
			res.status(500).json({ error: 'An error occurred' });
		} finally {
			// Close the database connection
			console.log('');
		}
	}
});

// Login into the system
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


// Login API For Flutter

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
								username: org1UserId,
								cnic: UserCnic
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
						username: org1UserId,
						cnic: UserCnic
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



// Requested lands Data
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
							Status = 'Transfered Successfully';
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
									username: UserCnic,
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
						username: UserCnic,
					});
				}
			} catch (error) {
				console.log(error);
				res.render('requested_lands', {
					// layout: false,
					// data: all_requests
					values: [],
					username: UserCnic,
				});

			}
		}
	}
	main();
});


// Make API for flutter for requested land page
router.get('/requested_lands_api', function (req, res) {
	const mysql = require('mysql');
	const UserCnic = req.body.cnic;

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
			let sql = `SELECT * FROM buyer_requests WHERE buyer_cnic = ${UserCnic}`;
			let query = db.query(sql, async (err, result) => {
				if (err) {
					console.log("Data Not Found");
				}

				const all_requests = result;
				const seller_cnic = all_requests[0].seller_cnic;

				let sql2 = `SELECT * FROM land_record WHERE land_id = '${all_requests[0].land_id}'`;
				let sql3 = `SELECT * FROM user WHERE user_cnic = ${seller_cnic}`;

				let query2 = db.query(sql2, async (err, result2) => {
					if (err) {
						console.log("Data Not Found");
					}

					const fetchedResult = result2;
					const Address = fetchedResult[0].khatuni + ' ' + fetchedResult[0].mauza + ' ' + fetchedResult[0].tehsil + ' ' +
						fetchedResult[0].district + ' ' + 'Punjab' + ' ' + 'Pakistan';
					const Land_id = fetchedResult[0].land_id;
					let Status;
					if (all_requests[0].status == 0) {
						Status = 'Pending';
					} else if (all_requests[0].status == 1) {
						Status = 'Not Approved';
					} else {
						Status = 'Approved';
					}

					let data = [];
					let query3 = db.query(sql3, async (err, result3) => {
						if (err) {
							console.log("Data Not Found");
						}

						const seller_cnic = result3[0].username;
						data.push(seller_cnic);
						data.push(Land_id);
						data.push(Address);
						data.push(Status);

						if (data && data.length > 0) {
							// Data is not empty
							res.json(data);
						} else {
							// Data is empty
							res.json([]);
						}
					});
				});
			});
		});
	}

	main();
});


// Seller and Patwari Will received the requested lands for approval of transfer ownership
router.get('/received_lands', function (req, res) {
	const UserCnic = req.session.userid;
	const mysql = require('mysql');

	// Create a MySQL connection pool
	const db = mysql.createPool({
		host: 'localhost',
		user: 'root',
		password: '',
		database: 'test',
	});

	async function main() {
		try {
			if (UserCnic === '4321098765432') {
				db.getConnection(function (err, connection) {
					if (err) {
						console.log('Database connection error:', err);
						return res.render('received_lands', { values: [] });
					}

					let sql = `SELECT * FROM land_inspector`;
					connection.query(sql, async (err, result) => {
						connection.release(); // Release the connection back to the pool

						if (err) {
							console.log("Data Not Found");
							return res.render('received_lands', { values: [] });
						}
						const all_requests = result;

						if (!Array.isArray(all_requests) || all_requests.length === 0) {
							console.log("Invalid or empty 'all_requests' parameter");
							return res.render('received_lands', { values: [] });
						}
						const buyer_cnic = all_requests[0].buyer_cnic;
						const seller_cnic = all_requests[0].seller_cnic;
						let sql2 = `SELECT u1.username AS buyer_username, u2.username AS seller_username FROM user AS u1, user AS u2 WHERE u1.user_cnic = ${buyer_cnic} AND u2.user_cnic = ${seller_cnic}`;

						connection.query(sql2, async (err, result2) => {
							if (err) {
								console.log("Data not found in user table");
								return res.render('received_lands', { values: [] });
							}

							const buyer_cnic = result2[0].buyer_username;
							const seller_cnic = result2[0].seller_username;

							const fetchedResult = await fetchLandRecord(all_requests[0].land_id);
							const Address = fetchedResult ? fetchedResult.khatuni + ' ' + fetchedResult.mauza + ' ' + fetchedResult.tehsil + ' ' + fetchedResult.district + ' ' + 'Punjab' + ' ' + 'Pakistan' : '';
							const Land_id = all_requests[0].land_id;

							if (all_requests[0].status == 3) {
								let data = [buyer_cnic, Land_id, Address, seller_cnic, all_requests[0].status];
								return requestedData(data);
							} else {
								return res.render('received_lands', { values: [], username: UserCnic });
							}
						});

					});
				});
			} else {
				db.getConnection(function (err, connection) {
					if (err) {
						console.log('Database connection error:', err);
						return res.render('received_lands', { values: [], username: UserCnic });
					}

					let sql = `SELECT * FROM buyer_requests WHERE seller_cnic = ${UserCnic}`;
					let query = connection.query(sql, async (err, result) => {
						connection.release(); // Release the connection back to the pool

						if (err) {
							console.log("Data Not Found");
							return res.render('received_lands', { values: [], username: UserCnic });
						}

						const all_requests = result;

						if (!Array.isArray(all_requests) || all_requests.length === 0) {
							console.log("Invalid or empty 'all_requests' parameter");
							return res.render('received_lands', { values: [], username: UserCnic });
						}

						const buyer_cnic = all_requests[0].buyer_cnic;

						let sql2 = `SELECT u1.username AS buyer_username, u2.username AS seller_username FROM user AS u1, user AS u2 WHERE u1.user_cnic = ${buyer_cnic} AND u2.user_cnic = ${UserCnic}`;

						connection.query(sql2, async (err, result2) => {
							if (err) {
								console.log("Data not found in user table");
								return res.render('received_lands', { values: [], username: UserCnic });
							}

							const buyer_cnic = result2[0].buyer_username;
							const seller_cnic = result2[0].seller_username;

							const fetchedResult = await fetchLandRecord(all_requests[0].land_id);
							const Address = fetchedResult ? fetchedResult.khatuni + ' ' + fetchedResult.mauza + ' ' + fetchedResult.tehsil + ' ' + fetchedResult.district + ' ' + 'Punjab' + ' ' + 'Pakistan' : '';
							const Land_id = all_requests[0].land_id;

							if (all_requests[0].status == 0) {
								let data = [buyer_cnic, Land_id, Address, seller_cnic, all_requests[0].status];
								return requestedData(data);
							} else {
								return res.render('received_lands', { values: [], username: UserCnic });
							}
						});
					});
				});
			}
		} catch (error) {
			console.log("Error occurred:", error.message);
			res.render('received_lands', { values: [], username: UserCnic });
		}
	}

	function fetchLandRecord(landId) {
		return new Promise((resolve, reject) => {
			let sql = `SELECT * FROM land_record WHERE land_id = '${landId}'`;
			db.query(sql, (err, result) => {
				if (err) {
					console.log("Data not found in land_record table");
					reject(err);
				} else {
					resolve(result[0]);
				}
			});
		});
	}

	function requestedData(data) {
		res.render('received_lands', { values: data, username: UserCnic });
	}

	main();
});



// User will make request for land transfer
// User will make a request for land transfer
router.post('/land_request', function (req, res) {
	let errors = [];
	if (!req.body.id) {
		errors.push('Asset ID must be provided');
	}
	if (errors.length > 0) {
		res.render('display', {
			errors: errors
		});
	} else {
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
		// connect to the database
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
				// Check if fetchedResult contains any data and the user_cnic is not null
				if (!Array.isArray(fetchedResult) || fetchedResult.length === 0 || !fetchedResult[0].user_cnic) {
					console.log("Invalid fetchedResult data or user_cnic is null");
				}
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

			} catch (error) {
				console.error(`******** FAILED to run the application: ${error}`);
				res.status(500).json({ success: false, error: 'Error occurred during land request' });
			}
		}
	}
});



// Land Request API for flutter
router.post('/land_request_api', function (req, res) {
	console.log('Flutter Land Request Received Successfully');
	let errors = [];
	if (!req.body.id) {
		console.log('Land ID must be provided');
	} else {
		'use strict';

		console.log('Land ID received successfully', req.body.id);

		const mysql = require('mysql');
		const LandId = req.body.id;

		const UserCnic = req.body.cnic;

		const db = mysql.createConnection({
			host: 'localhost',
			user: 'root',
			password: '',
			database: 'test',
		});

		// Connect to the database
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
				await main(fetchedResult);
			});
		});

		async function main(fetchedResult) {
			try {
				let post = {
					land_id: LandId,
					seller_cnic: fetchedResult[0].user_cnic,
					buyer_cnic: UserCnic, // Update the buyer_cnic with the value from the session
					status: 0
				};

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
						});
					} else {
						console.log(" ");
					}
				});

				res.status(200).json({ success: true });
			} catch (error) {
				console.error(`******** FAILED to run the application: ${error}`);
			}
		}
	}
});

// Request to land inspector for approval of land transfer
router.post('/seller_request_patwari', function (req, res) {
	let errors = [];
	if (!req.body.id) {
		errors.push('Asset ID must be provided');
	}
	if (errors.length > 0) {
		res.render('display', {
			errors: errors
		});
	} else {
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
			console.log('Connection done 6');
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
				// Retrieve the buyer_cnic from the buyer_requests table
				db.connect(function (err) {
					let checkQuery = "SELECT buyer_cnic FROM buyer_requests WHERE land_id = ?";
					let checkValues = [LandId];
					let query = db.query(checkQuery, checkValues, (err, result) => {
						if (err) {
							console.log(err);
						}
						if (result.length > 0) {
							const buyer_cnic = result[0].buyer_cnic;

							// Proceed with your code
							let post = { land_id: LandId, seller_cnic: fetchedResult[0].user_cnic, buyer_cnic: buyer_cnic, status: 3 };
							let insertQuery = "INSERT INTO land_inspector SET ?";
							let insertValues = post;
							db.query(insertQuery, insertValues, (err, result) => {
								if (err) {
									console.log(err);
								}
								console.log("Successfully seller request is added in the land inspector database");
								// Send a success response
								res.status(200).json({ success: true });
							});
						} else {
							console.log(" ");
							// Send a failure response
							res.status(200).json({ success: false });
						}
					});
				});
			} catch (error) {
				console.error(`******** FAILED to run the application: ${error}`);
				// Send a failure response
				res.status(200).json({ success: false });
			}
		}
	}
});


// Cancel the request by seller or the land inspector
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
					const BuyerCnic = fetchedResult[0].buyer_cnic;
					let updateQuery = "UPDATE buyer_requests SET status = ? WHERE land_id = ? AND buyer_cnic = ?";
					let updateValues = [1, LandId, BuyerCnic]; // 1 is to reject

					db.query(updateQuery, updateValues, (err, result) => {
						if (err) {
							console.log(err);
						}
						console.log("Successfully updated the status in the buyer_requests table");

						if (UserCnic === '4321098765432') {
							db.connect(function (err) {
								const LandId = fetchedResult[0].land_id;
								let updateQuery = "UPDATE land_inspector SET status = ? WHERE land_id = ?";
								let updateValues = [1, LandId]; // 1 is to reject

								db.query(updateQuery, updateValues, (err, result) => {
									if (err) {
										console.log(err);
									}
									console.log("Successfully updated the status in the land_inspector table");
								});
							});
						}

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

// Logout request
router.get('/logout', function (req, res) {
	req.session.destroy();
	// Unset userid otherwise data can be view via URL like this: http://localhost:3001/display
	session.userid = undefined;
	res.redirect('/');
});

// Logout API for flutter
router.get('/logout_api', function (req, res) {
	req.session.userid = undefined;
	console.log('Logout Successfully');
	res.status(200).send('Logout successful');
});


// to use this router we export these routers from this file and then import that into app.js
// using --- const routes=require('./routes');  -- see line 110 in app.js file
module.exports = router;