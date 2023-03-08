/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
*/

'use strict';
const sinon = require('sinon');
const chai = require('chai');
const sinonChai = require('sinon-chai');
const expect = chai.expect;

const { Context } = require('fabric-contract-api');
const { ChaincodeStub } = require('fabric-shim');

const AssetTransfer = require('../lib/assetTransfer.js');

let assert = sinon.assert;
chai.use(sinonChai);

describe('Asset Transfer Basic Tests', () => {
    let transactionContext, chaincodeStub, asset;
    beforeEach(() => {
        transactionContext = new Context();

        chaincodeStub = sinon.createStubInstance(ChaincodeStub);
        transactionContext.setChaincodeStub(chaincodeStub);

        chaincodeStub.putState.callsFake((key, value) => {
            if (!chaincodeStub.states) {
                chaincodeStub.states = {};
            }
            chaincodeStub.states[key] = value;
        });

        chaincodeStub.getState.callsFake(async (key) => {
            let ret;
            if (chaincodeStub.states) {
                ret = chaincodeStub.states[key];
            }
            return Promise.resolve(ret);
        });

        chaincodeStub.deleteState.callsFake(async (key) => {
            if (chaincodeStub.states) {
                delete chaincodeStub.states[key];
            }
            return Promise.resolve(key);
        });

        chaincodeStub.getStateByRange.callsFake(async () => {
            function* internalGetStateByRange() {
                if (chaincodeStub.states) {
                    // Shallow copy
                    const copied = Object.assign({}, chaincodeStub.states);

                    for (let key in copied) {
                        yield {value: copied[key]};
                    }
                }
            }

            return Promise.resolve(internalGetStateByRange());
        });

        asset = {
            LandID: 'land1',
            Address: 'Kohat',
            LandSize: 500 * 400,
            Owner: 'Jawad',
            Price: 800000,
        };
    });

    describe('Test InitLedger', () => {
        it('should return error on InitLedger', async () => {
            chaincodeStub.putState.rejects('failed inserting key');
            let assetTransfer = new AssetTransfer();
            try {
                await assetTransfer.InitLedger(transactionContext);
                assert.fail('InitLedger should have failed');
            } catch (err) {
                expect(err.name).to.equal('failed inserting key');
            }
        });

        it('should return success on InitLedger', async () => {
            let assetTransfer = new AssetTransfer();
            await assetTransfer.InitLedger(transactionContext);
            let ret = JSON.parse((await chaincodeStub.getState('land1')).toString());
            expect(ret).to.eql(Object.assign({docType: 'asset'}, asset));
        });
    });

    describe('Test CreateAsset', () => {
        it('should return error on CreateAsset', async () => {
            chaincodeStub.putState.rejects('failed inserting key');

            let assetTransfer = new AssetTransfer();
            try {
                await assetTransfer.CreateAsset(transactionContext, asset.LandID, asset.Address, asset.LandSize, asset.Owner, asset.Price);
                assert.fail('CreateAsset should have failed');
            } catch(err) {
                expect(err.name).to.equal('failed inserting key');
            }
        });

        it('should return success on CreateAsset', async () => {
            let assetTransfer = new AssetTransfer();

            await assetTransfer.CreateAsset(transactionContext, asset.LandID, asset.Address, asset.LandSize, asset.Owner, asset.Price);

            let ret = JSON.parse((await chaincodeStub.getState(asset.ID)).toString());
            expect(ret).to.eql(asset);
        });
    });

    describe('Test ReadAsset', () => {
        it('should return error on ReadAsset', async () => {
            let assetTransfer = new AssetTransfer();
            await assetTransfer.CreateAsset(transactionContext, asset.LandID, asset.Address, asset.LandSize, asset.Owner, asset.Price);

            try {
                await assetTransfer.ReadAsset(transactionContext, 'land2');
                assert.fail('ReadAsset should have failed');
            } catch (err) {
                expect(err.message).to.equal('The asset land2 does not exist');
            }
        });

        it('should return success on ReadAsset', async () => {
            let assetTransfer = new AssetTransfer();
            await assetTransfer.CreateAsset(transactionContext, asset.LandID, asset.Address, asset.LandSize, asset.Owner, asset.Price);

            let ret = JSON.parse(await chaincodeStub.getState(asset.ID));
            expect(ret).to.eql(asset);
        });
    });

    describe('Test UpdateAsset', () => {
        it('should return error on UpdateAsset', async () => {
            let assetTransfer = new AssetTransfer();
            await assetTransfer.CreateAsset(transactionContext, asset.LandID, asset.Address, asset.LandSize, asset.Owner, asset.Price);

            try {
                await assetTransfer.UpdateAsset(transactionContext, 'land2', 'Harapa', 800 * 500, 'Me', 1000000);
                assert.fail('UpdateAsset should have failed');
            } catch (err) {
                expect(err.message).to.equal('The asset land2 does not exist');
            }
        });

        it('should return success on UpdateAsset', async () => {
            let assetTransfer = new AssetTransfer();
            await assetTransfer.CreateAsset(transactionContext, asset.LandID, asset.Address, asset.LandSize, asset.Owner, asset.Price);

            await assetTransfer.UpdateAsset(transactionContext, 'land1', 'Kohat', 500 * 400, 'Me', 800000);
            let ret = JSON.parse(await chaincodeStub.getState(asset.LandID));
            let expected = {
                LandID: 'land1',
                Address: 'Kohat',
                LandSize: 500 * 400,
                Owner: 'Me',
                Price: 800000
            };
            expect(ret).to.eql(expected);
        });
    });

    describe('Test DeleteAsset', () => {
        it('should return error on DeleteAsset', async () => {
            let assetTransfer = new AssetTransfer();
            await assetTransfer.CreateAsset(transactionContext, asset.LandID, asset.Address, asset.LandSize, asset.Owner, asset.Price);

            try {
                await assetTransfer.DeleteAsset(transactionContext, 'land2');
                assert.fail('DeleteAsset should have failed');
            } catch (err) {
                expect(err.message).to.equal('The asset land2 does not exist');
            }
        });

        it('should return success on DeleteAsset', async () => {
            let assetTransfer = new AssetTransfer();
            await assetTransfer.CreateAsset(transactionContext, asset.LandID, asset.Address, asset.LandSize, asset.Owner, asset.Price);

            await assetTransfer.DeleteAsset(transactionContext, asset.LandID);
            let ret = await chaincodeStub.getState(asset.LandID);
            expect(ret).to.equal(undefined);
        });
    });

    describe('Test TransferAsset', () => {
        it('should return error on TransferAsset', async () => {
            let assetTransfer = new AssetTransfer();
            await assetTransfer.CreateAsset(transactionContext, asset.LandID, asset.Address, asset.LandSize, asset.Owner, asset.Price);

            try {
                await assetTransfer.TransferAsset(transactionContext, 'land2', 'Me');
                assert.fail('DeleteAsset should have failed');
            } catch (err) {
                expect(err.message).to.equal('The asset land2 does not exist');
            }
        });

        it('should return success on TransferAsset', async () => {
            let assetTransfer = new AssetTransfer();
            await assetTransfer.CreateAsset(transactionContext, asset.LandID, asset.Address, asset.LandSize, asset.Owner, asset.Price);

            await assetTransfer.TransferAsset(transactionContext, asset.LandID, 'Me');
            let ret = JSON.parse((await chaincodeStub.getState(asset.ID)).toString());
            expect(ret).to.eql(Object.assign({}, asset, {Owner: 'Me'}));
        });
    });

    describe('Test GetAllAssets', () => {
        it('should return success on GetAllAssets', async () => {
            let assetTransfer = new AssetTransfer();

            await assetTransfer.CreateAsset(transactionContext, 'land1', 'Kohat', 500 * 400, 'Jawad', 800000);
            await assetTransfer.CreateAsset(transactionContext, 'land2', 'Harapa', 800 * 500, 'Zubair', 1000000);
            await assetTransfer.CreateAsset(transactionContext, 'land3', 'Multan', 400 * 800, 'Sharjeel', 700000);
            await assetTransfer.CreateAsset(transactionContext, 'land4', 'Hyderabad', 900 * 700, 'Danish', 1200000);

            let ret = await assetTransfer.GetAllAssets(transactionContext);
            ret = JSON.parse(ret);
            expect(ret.length).to.equal(4);

            let expected = [
                {Record: {LandID: 'land1',
                Address: 'Kohat',
                LandSize: 500 * 400,
                Owner: 'Jawad',
                Price: 800000}},
                {Record: {LandID: 'land2',
                Address: 'Harapa',
                LandSize: 800 * 500,
                Owner: 'Zubair',
                Price: 1000000}},
                {Record: {LandID: 'land3',
                Address: 'Multan',
                LandSize: 400 * 800,
                Owner: 'Sharjeel',
                Price: 700000}},
                {Record: {LandID: 'land4',
                Address: 'Hyderabad',
                LandSize: 900 * 700,
                Owner: 'Danish',
                Price: 1200000}}
            ];

            expect(ret).to.eql(expected);
        });

        it('should return success on GetAllAssets for non JSON value', async () => {
            let assetTransfer = new AssetTransfer();

            chaincodeStub.putState.onFirstCall().callsFake((key, value) => {
                if (!chaincodeStub.states) {
                    chaincodeStub.states = {};
                }
                chaincodeStub.states[key] = 'non-json-value';
            });

            await assetTransfer.CreateAsset(transactionContext, 'land1', 'Kohat', 500 * 400, 'Jawad', 800000);
            await assetTransfer.CreateAsset(transactionContext, 'land2', 'Harapa', 800 * 500, 'Zubair', 1000000);
            await assetTransfer.CreateAsset(transactionContext, 'land3', 'Multan', 400 * 800, 'Sharjeel', 700000);
            await assetTransfer.CreateAsset(transactionContext, 'land4', 'Hyderabad', 900 * 700, 'Danish', 1200000);

            let ret = await assetTransfer.GetAllAssets(transactionContext);
            ret = JSON.parse(ret);
            expect(ret.length).to.equal(4);

            let expected = [
                {Record: 'non-json-value'},
                {Record: {LandID: 'land2',
                Address: 'Harapa',
                LandSize: 800 * 500,
                Owner: 'Zubair',
                Price: 1000000}},
                {Record: {LandID: 'land3',
                Address: 'Multan',
                LandSize: 400 * 800,
                Owner: 'Sharjeel',
                Price: 700000}},
                {Record: {LandID: 'land4',
                Address: 'Hyderabad',
                LandSize: 900 * 700,
                Owner: 'Danish',
                Price: 1200000}}
            ];

            expect(ret).to.eql(expected);
        });
    });
});
