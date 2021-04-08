const TronWeb = require('tronweb')
const bodyParser = require('body-parser');
const express = require('express');

const HttpProvider = TronWeb.providers.HttpProvider;
const fullNode = new HttpProvider("https://api.trongrid.io");
const solidityNode = new HttpProvider("https://api.trongrid.io");
const eventServer = new HttpProvider("https://api.trongrid.io");
const privateKey = "YOUR_PRIVATE_KEY_TRC20_TOKEN";
const tronWeb = new TronWeb(fullNode,solidityNode,eventServer,privateKey);

const app = express();

app.use(bodyParser.json({ limit: '50mb', extended: true }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(function (req, res, next) {
    /*var err = new Error('Not Found');
     err.status = 404;
     next(err);*/

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers,X-Access-Token,XKey,Authorization');

    // Pass to next layer of middleware
    next();
});

app.listen(7000, ()=>console.log('Express is running on port 7000'));

async function triggerSmartContract() {
    const trc20ContractAddress = "";//contract address
    let divider = 0;
    let name = '';
    let balance = 0;
    try {
        let contract = await tronWeb.contract().at(trc20ContractAddress);
        //Use call to execute a pure or view smart contract method.
        // These methods do not modify the blockchain, do not cost anything to execute and are also not broadcasted to the network.
        name = await contract.name().call();
        let decimals = await contract.decimals().call();
        divider = Math.pow(10,decimals);
    } catch(error) {
        console.error("trigger smart contract error",error);
    }

    app.get('/api/token/name', (req, res)=>{
        return res.send(name);
    });

    app.get('/api/token/balance/:address', (req, res)=>{
        let address = req.params.address;
        getBalance(address,res)
    });

    async function getBalance(address, res) {
        try {
            let contract = await tronWeb.contract().at(trc20ContractAddress);
            contract.balanceOf(address).call().then(balanceOf => {
                balance = tronWeb.toDecimal(balanceOf.balance._hex) / divider;
                return res.status(200).send(balance.toString());
            });
        } catch (e) {
            console.log(e);
        }
    }

    app.get('/api/token/send/:to/:value',(req, res) => {
        const to = req.params.to;
        const amount = req.params.value * divider;
	console.log('To : '+to+', Amount : '+amount);
        send(to, amount, privateKey, res);
    })

    async function send(to, amount, privateKey, res) {
        const send_tronWeb = new TronWeb(fullNode,solidityNode,eventServer,privateKey);
	try {
            let send_contract = await send_tronWeb.contract().at(trc20ContractAddress);
            send_contract.transfer(to, amount).send().then(txid => {
	    	return res.status(200).send(txid);
	    }).catch(error => {
		console.log(error)
	    });
        } catch (e) {
            console.log(e)
        }
    }
}

triggerSmartContract();
