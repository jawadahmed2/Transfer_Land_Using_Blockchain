# Transfer_Land_Using_Blockchain

Land Transfer and Fard generation system using Hyperledger Fabric, Node Express, JavaScript, HTML, CSS

## Commands To Run Application
=========================================
Install WSL on Latest Windows
wsl --install

Check Docker Desktop and Docker Compose Versions
docker -v
docker-compose -v

Check Ubuntu and Docker States
wsl -l -v 

Check Curl Version
curl --version

Install Node.js and NPM
curl o https://raw.githubusercontent.com/nvm... | bash
nvm install node

Install and Use NVM and Check Versions of Node and NPM
nvm install 10.23.0 or use the latest one
nvm use 10.23.0
node -v 
npm -v 

Install Front End Application Dependencies

npm install express express-layout path cookie-parser express-session 
npm install ipfs-http-client@42.0.0

Start Hyperledger Fabric Test Network
cd asset/fabric-samples/test-network
./network.sh down
./network.sh up createChannel -c mychannel -ca -s couchdb 
./network.sh deployCC -ccn basic -ccp ../asset-transfer-basic/chaincode-javascript/ -ccl javascript

Launch the Asset Transfer Front-End Application
cd asset/fabric-samples/asset-transfer-basic/application-javascript
nvm use 10.23.0
npm start
localhost:3001
