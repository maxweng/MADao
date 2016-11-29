var fs = require("fs");
var path = require("path");

var settings = {};

settings.secret = "fk3nqqa8ftiij5dgls16";

settings.DEBUG = true;

settings.MAIN_HOST = "devmadao.msan.cn";
settings.SITE_NAME_CN = "航空意外互助计划";

settings.BASE_DIR = __dirname;

settings.rpc = {
    host: process.env.RPC_HOST || "localhost",
    port: process.env.RPC_PORT || 8545
}

settings.avgBlockTime = 15;

settings.wechatAuthFileName = "MP_verify_KnjeC1ANoqDsJ4kl.txt";
settings.wechatAuthFileValue = "KnjeC1ANoqDsJ4kl";

settings.WECHAT_APP_ID = "wx31383e8595a69546";
settings.WECHAT_APP_SECRET = "7106526f34b3ae368333a939823d34e0";
settings.WECHAT_MCH_ID = "1218330301";
settings.WECHAT_API_KEY = "h65koq6484x6pdoqm3kjnjidsnsk2659";

try{
    settings.WECHAT_CERTS_CERT = fs.readFileSync(path.resolve(__dirname, 'wechatcerts/apiclient_cert.pem'));
    settings.WECHAT_CERTS_KEY = fs.readFileSync(path.resolve(__dirname, 'wechatcerts/apiclient_key.pem'));
    settings.WECHAT_CERTS_CA = fs.readFileSync(path.resolve(__dirname, 'wechatcerts/rootca.pem'));
}catch(e){
    settings.WECHAT_CERTS_CERT = "";
    settings.WECHAT_CERTS_KEY = "";
    settings.WECHAT_CERTS_CA = "";
}

settings.WECHAT_OPEN_APP_ID = "";
settings.WECHAT_OPEN_MCH_ID = "";
settings.WECHAT_OPEN_API_KEY = "";

settings.WXPAY_NOTIFY_URL = "http://" + settings.MAIN_HOST + "/wxpay/notify";

if(process.env.NETWORK == "testnet"){
    settings.dbURL = "mongodb://testnetmadaodbadmin:Moshi314@123.56.90.147:37017/testnetmadao";
    settings.sysAccountAddress = process.env.SYS_ACCOUNT_ADDRESS || "0x14cB23Cf2deacA1FCCd2F5400c4A8D32595e726f";
    settings.sysAccountPrivateKey = process.env.SYS_ACCOUNT_PRIVATE_KEY || "d74b6bbf373fe501b9483aa29fa65c8c9487ae73d736eea9ad19844f4026f405";
    settings.networkId = process.env.NETWORK_ID || 3;
}else{
    settings.dbURL = "mongodb://madaodbadmin:Moshi314@123.56.90.147:37017/madao";
    settings.sysAccountAddress = process.env.SYS_ACCOUNT_ADDRESS || "0xb57be5149842f218a95da90599ba2b7a70f888e7";
    settings.sysAccountPrivateKey = process.env.SYS_ACCOUNT_PRIVATE_KEY || "a8d9edff20ef6fd7000f43ec103904bdc173ea55e1008413dcb744d4bf016590";
    settings.networkId = process.env.NETWORK_ID || "default";
}

settings.networks = {
    "development": {
        network_id: "default"
    },
    "testnet": {
        network_id: 3,
        host: settings.rpc.host,
        port: settings.rpc.port,
        from: settings.sysAccountAddress
    }
}

module.exports = settings;