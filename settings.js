var settings = {};

settings.secret = "fk3nqqa8ftiij5dgls16";

settings.rpc = {
    host: process.env.RPC_HOST || "localhost",
    port: process.env.RPC_PORT || 8545
}

settings.avgBlockTime = 15;

settings.wechatAuthFileName = "MP_verify_KnjeC1ANoqDsJ4kl.txt";
settings.wechatAuthFileValue = "KnjeC1ANoqDsJ4kl";

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