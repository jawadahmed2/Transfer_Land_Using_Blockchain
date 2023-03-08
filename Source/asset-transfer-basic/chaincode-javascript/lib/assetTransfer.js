/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

// Deterministic JSON.stringify()
const stringify  = require('json-stringify-deterministic');
const sortKeysRecursive  = require('sort-keys-recursive');
const { Contract } = require('fabric-contract-api');
const ClientIdentity = require('fabric-shim').ClientIdentity;

class AssetTransfer extends Contract {

    async InitLedger(ctx) {
        const assets = [
            {
                LandID: 'land1',
                Address: 'Kohat',
                LandSize: 500 * 400,
                Owner: 'Jawad',
                Price: 800000,
            },
            {
                LandID: 'land2',
                Address: 'Harapa',
                LandSize: 800 * 500,
                Owner: 'Zubair',
                Price: 1000000,
            },
            {
                LandID: 'land3',
                Address: 'Multan',
                LandSize: 400 * 800,
                Owner: 'Sharjeel',
                Price: 700000,
            },
            {
                LandID: 'land4',
                Address: 'Hyderabad',
                LandSize: 900 * 700,
                Owner: 'Danish',
                Price: 1200000,
            },
            {
                LandID: 'land5',
                Address: 'Sahiwal',
                LandSize: 550 * 650,
                Owner: 'Hammad',
                Price: 1100000,
            },
            {
                LandID: 'land6',
                Address: 'Kohat',
                LandSize: 750 * 550,
                Owner: 'Anas',
                Price: 780000,
            },
        ];

        for (const asset of assets) {
            asset.docType = 'asset';  // column name is docType
            var today = new Date();
            var dd = String(today.getDate()).padStart(2, '0');
            var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
            var yyyy = today.getFullYear();
            today = mm + '/' + dd + '/' + yyyy;
            asset.addedOn = today;  // a date type column named "added"
            asset.filePath = 'xyz';
            // example of how to write to world state deterministically
            // use convetion of alphabetic order
            // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
            // when retrieving data, in any lang, the order of data will be the same and consequently also the corresonding hash
            await ctx.stub.putState(asset.LandID, Buffer.from(stringify(sortKeysRecursive(asset))));
            console.log(`Asset ${asset.LandID} initialized`);
        }
    }

    // CreateAsset issues a new asset to the world state with given details.
    async CreateAsset(ctx, id, Address, LandSize, owner, price, filepath) {
        const exists = await this.AssetExists(ctx, id);
        if (exists) {
            throw new Error(`The asset ${id} already exists`);
        }

        const asset = {
            LandID: id,
            Address: Address,
            LandSize: LandSize,
            Owner: owner,
            Price: price,
        };

        asset.docType = 'asset';
        var today = new Date();
        var dd = String(today.getDate()).padStart(2, '0');
        var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
        var yyyy = today.getFullYear();
        today = mm + '/' + dd + '/' + yyyy;
        asset.addedOn = today;
        asset.filePath = filepath;

        //we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
        await ctx.stub.putState(id, Buffer.from(stringify(sortKeysRecursive(asset))));
        return JSON.stringify(asset);
    }

    // ReadAsset returns the asset stored in the world state with given id.
    async ReadAsset(ctx, id) {
        const assetJSON = await ctx.stub.getState(id); // get the asset from chaincode state
        if (!assetJSON || assetJSON.length === 0) {
            throw new Error(`The asset ${id} does not exist`);
        }
        console.log("The value of assetJSON is:::::: " + assetJSON.toString());
        return assetJSON.toString();
    }

    // A common use of JSON is to exchange data to/from a web server. JSON parsing is the process of
    // converting a JSON object in text format to a Javascript object that can be used inside a program.
    // JSON object literals are surrounded by curly braces {}.
    // JSON object literals contains key/value pairs.
    // Keys and values are separated by a colon.
    // Each key/value pair is separated by a comma.
    // {"name":"John", "age":30, "car":null}
    async checkOwner(ctx, id) {
        const assetString = await this.ReadAsset(ctx, id);
        const asset = JSON.parse(assetString);
        const assetOwner = asset.Owner;
        return assetOwner;
    }

    // Get value of the role attribute for the submitting user
    async getattributevalue(ctx) {
        let cid = new ClientIdentity(ctx.stub);
        return (cid.getAttributeValue("role"));
    }

    // UpdateAsset updates an existing asset in the world state with provided parameters.
    async UpdateAsset(ctx, id, Address, LandSize, owner, price, filepath) {
        const exists = await this.AssetExists(ctx, id);
        if (!exists) {
            throw new Error(`The asset ${id} does not exist`);
        }
        var today = new Date();
        var dd = String(today.getDate()).padStart(2, '0');
        var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
        var yyyy = today.getFullYear();
        today = mm + '/' + dd + '/' + yyyy;

        // overwriting original asset with new asset
        const updatedAsset = {
            LandID: id,
            Address: Address,
            LandSize: LandSize,
            Owner: owner,
            Price: price,
            docType: 'asset',
            addedOn: today,
            filePath: filepath,
        };
        // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
        // ctx.stub is used to access APIs that provide a broad range of transaction processing operations
        // from putState() and getState() to access the ledger, to getTxID() to retrieve the current
        // transaction ID.
        // The Buffer.from() method creates a new buffer filled with the specified string, array, or buffer.
        // var buf = Buffer.from('abc');
        // stringify() method converts a JavaScript object or value to a JSON string
        return ctx.stub.putState(id, Buffer.from(stringify(sortKeysRecursive(updatedAsset))));
    }

    // DeleteAsset deletes a given asset from the world state.
    // There is a state database that stores keys and their values. This is different from the sequence of
    // blocks that make up the blockchain. A key and its associated value can be removed from the state
    // database using the DelState function. However, this does not mean that there is an alteration of blocks
    // on the blockchain. The removal of a key and value would be stored as a transaction on the blockchain
    // just as the prior addition and any modifications were stored as transactions on the blockchain.
    // The history of a key can be retrieved after the key is deleted. There is a GetHistoryForKey() API that
    // retrieves the history and part of its response is an IsDeleted flag that indicates if the key was deleted.
    // It would be possible to create a key, delete the key, and then create the key again; the
    // GetHistoryForKey() API would track such a case.
    // The state database stores the current state, so the key and its value are deleted from the state database.
    // The GetHistoryForKey() API reviews the chain history and not the state database to find prior key values.
    async DeleteAsset(ctx, id) {
        const exists = await this.AssetExists(ctx, id);
        if (!exists) {
            throw new Error(`The asset ${id} does not exist`);
        }
        return ctx.stub.deleteState(id);
    }

    // AssetExists returns true when asset with given ID exists in world state.
    async AssetExists(ctx, id) {
        const assetJSON = await ctx.stub.getState(id);
        return assetJSON && assetJSON.length > 0;
    }

    // TransferAsset updates the owner field of an asset in the world state.
    async TransferAsset(ctx, id, newOwner) {
        const assetString = await this.ReadAsset(ctx, id);
        console.log("The value of assetString is: " + assetString);
        const asset = JSON.parse(assetString);
        const oldOwner = asset.Owner;
        asset.Owner = newOwner;
        // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
        await ctx.stub.putState(id, Buffer.from(stringify(sortKeysRecursive(asset))));
        return oldOwner;
    }

    // GetAllAssets returns all assets found in the world state.
    async GetAllAssets(ctx) {
        const allResults = [];
        // range query with empty string for startKey and endKey does an open-ended query of all assets in the chaincode namespace.
        const iterator = await ctx.stub.getStateByRange('', '');
        let result = await iterator.next();
        while (!result.done) {
            const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            allResults.push(record);
            result = await iterator.next();
        }
        return JSON.stringify(allResults);
    }

    // Get history of an asset from the blockchain.
    async GetAssetHistory(ctx, id) {
        const allResults = [];
        const iterator = await ctx.stub.getHistoryForKey(id);
        let result = await iterator.next();
        while (!result.done) {
            const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            allResults.push(record);
            result = await iterator.next();
        }
        return JSON.stringify(allResults);
    }

}

module.exports = AssetTransfer;
