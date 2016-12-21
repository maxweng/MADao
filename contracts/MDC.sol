import "./api/OracleItAPI.sol";
import "./api/Utils.sol";

contract MDC is usingOracleIt, usingUtils {
    struct ClaimInfo{
        address claimer;
        bytes32 claimerName;
        bytes32 claimerCountry;
        bytes32 claimerId;
        bytes32 claimerNoncestr;
        bytes32 flightNumber;
        uint departureTime;
        uint oracleItId;
        uint status; // 0: init, 2: investigating, 6: passed, 8: rejected
    }
    
    struct Flight{
        bytes32 flightNumber;
        uint departureTime;
        string queryNo;
        bool claimed;
    }
    
    struct UserInfo{
        bytes32 hash;
        bool available;
    }
    
    mapping (address => uint) public balances;
    
    mapping (address => UserInfo) public infoHashes;
    mapping (address => Flight[]) public flights;
    
    mapping (uint => address) public userAddresses;
    uint public totalUserAddresses;
    
    uint public totalAvailableUserAddresses;
    
    mapping (uint => ClaimInfo) public claims;
    uint public totalClaims;
    
    mapping (bytes32 => uint[]) public idClaimIds;
    
    mapping (uint => uint) public oracleItIdClaimId;
    
    uint constant recommendationRewardRate = 10;
    
    uint constant defaultGasLimit = 1000000;
    uint constant defaultGasPrice = 20000000000;
    
    uint constant minUserAvailableBalance = 0.5 ether;
    uint constant maxCompensation = minUserAvailableBalance * 20000;
    
    modifier userAvailable() { if(!infoHashes[msg.sender].available) throw; _ }
    
    function MDC() {
    }
    
    function signUp(address recommender, bytes32 _name, bytes32 _country, bytes32 _id, bytes32 _noncestr) {
        if(_name == "" || _id == "") throw;
        
        uint recommender_fee = 0;
        if(recommender != address(0)){
            recommender_fee = safeMul(msg.value, recommendationRewardRate) / 100;
        }
        uint user_fee = safeSub(msg.value, recommender_fee);
        if(user_fee + recommender_fee != msg.value) throw;
        
        if(user_fee < minUserAvailableBalance) throw;
        
        bytes32 _infoHash = sha3(_name, _country, _id, _noncestr);
        
        if(infoHashes[msg.sender].hash == ""){
            totalUserAddresses++;
            totalAvailableUserAddresses++;
            userAddresses[totalUserAddresses] = msg.sender;
            infoHashes[msg.sender] = UserInfo({
                hash: _infoHash,
                available: true
            });
        }else{
            if(infoHashes[msg.sender].hash != _infoHash) throw;
            if(!infoHashes[msg.sender].available){
                infoHashes[msg.sender].available = true;
                totalAvailableUserAddresses++;
            }
        }
        
        if(recommender != address(0) && recommender_fee > 0){
            if(!recommender.send(recommender_fee)) throw;
        }
        
        balances[msg.sender] = safeAdd(balances[msg.sender], user_fee);
    }
    
    function minusBalance(address userAddress, uint price) internal {
        balances[userAddress] = safeSub(balances[userAddress], price);
        if(balances[userAddress] < minUserAvailableBalance){
            infoHashes[userAddress].available = false;
            totalAvailableUserAddresses--;
        }
    }
    
    function addFlight(bytes32 _flightNumber, uint _departureTime) userAvailable {
        if(now > _departureTime) throw;

        uint length = flights[msg.sender].length;
        bool hasFlight = false;
        for(uint i=0; i<length; i++){
            var flight = flights[msg.sender][i];
            if(flight.flightNumber == _flightNumber && flight.departureTime >= _departureTime - 7200 && flight.departureTime <= _departureTime + 7200){
                throw;
            }
        }
        flights[msg.sender].push(Flight({
            flightNumber: _flightNumber,
            departureTime: _departureTime,
            queryNo: strConcat(bytes32ToString(_flightNumber), " ", bytes32ToString(uintToBytes(_departureTime))),
            claimed: false
        }));
    }
    
    function getFlightCount(address userAddress) returns (uint count) {
        count = flights[userAddress].length;
    }
    
    function getClaimFee() oracleItAPI internal returns (uint claimFee) {
        claimFee = oracleIt.getPrice("AirCrash") + safeMul(defaultGasLimit, defaultGasPrice);
    }
    
    function claimQuery(string queryNo, bytes32 _name, bytes32 _id ) internal returns (uint oracleItId) {
        oracleItId = oracleItQuery("AirCrash", strConcat(queryNo, " ", bytes32ToString(_name), " ", bytes32ToString(_id)), defaultGasLimit, defaultGasPrice);
    }
    
    function claim(bytes32 _flightNumber, uint _departureTime, bytes32 _name, bytes32 _country, bytes32 _id, bytes32 _noncestr) userAvailable {
        if(infoHashes[msg.sender].hash != sha3(_name, _country, _id, _noncestr)) throw;
        
        uint i;
        uint length;
        
        length = idClaimIds[_id].length;
        for(i=0; i<length; i++){
            var oldClaim = claims[idClaimIds[_id][i]];
            if(oldClaim.flightNumber == _flightNumber && oldClaim.departureTime == _departureTime && oldClaim.claimerName == _name && oldClaim.claimerId == _id) throw;
        }

        uint claimFee = getClaimFee();
        if(balances[msg.sender] < claimFee) throw;
        
        length = flights[msg.sender].length;
        bool hasFlight = false;
        string memory queryNo;
        for(i=0; i<length; i++){
            var flight = flights[msg.sender][i];
            if(flight.claimed) continue;
            if(flight.flightNumber == _flightNumber && flight.departureTime == _departureTime){
                flight.claimed = true;
                hasFlight = true;
                queryNo = flight.queryNo;
                break;
            }
        }
        if(!hasFlight) throw;
        
        uint oracleItId = claimQuery(queryNo, _name, _id);
        if(oracleItId == 0) throw;
        
        totalClaims++;
        claims[totalClaims] = ClaimInfo({
            claimer: msg.sender,

            claimerName: _name,
            claimerCountry: _country,
            claimerId: _id,
            claimerNoncestr: _noncestr,
            
            flightNumber: _flightNumber,
            departureTime: _departureTime,

            oracleItId: oracleItId,
            status: 2
        });
        
        idClaimIds[_id].push(totalClaims);
        oracleItIdClaimId[oracleItId] = totalClaims;
        
        minusBalance(msg.sender, claimFee);
    }

    function __callback(uint id, string result) {
        if (msg.sender != oracleItCallbackAddress()) throw;
        uint claimId = oracleItIdClaimId[id];
        if (claimId > 0){
            ClaimInfo claim = claims[claimId];
            if(claim.status == 2){
                if(parseInt(result) == 1){
                    uint compensation = balances[claim.claimer];
                    minusBalance(claim.claimer, balances[claim.claimer]);
                    
                    if(totalAvailableUserAddresses > 0){
                        uint userCompensation = maxCompensation / totalAvailableUserAddresses;
                        if(userCompensation > minUserAvailableBalance) userCompensation = minUserAvailableBalance;
                        for(uint i=1; i<=totalUserAddresses; i++){
                            address userAddress = userAddresses[i];
                            if(infoHashes[userAddress].available){
                                minusBalance(userAddress, userCompensation);
                                compensation += userCompensation;
                            }
                        }
                    }
                    
                    if(!claim.claimer.send(compensation)) throw;
                    claim.status = 6;
                }else{
                    claim.status = 8;
                }
            }
        }
    }
    
    function uintToBytes(uint v) constant internal returns (bytes32 ret) {
        if (v == 0) {
            ret = '0';
        }
        else {
            while (v > 0) {
                ret = bytes32(uint(ret) / (2 ** 8));
                ret |= bytes32(((v % 10) + 48) * 2 ** (8 * 31));
                v /= 10;
            }
        }
        return ret;
    }
    
    function bytes32ToString(bytes32 x) constant internal returns (string) {
        bytes memory bytesString = new bytes(32);
        uint charCount = 0;
        for (uint j = 0; j < 32; j++) {
            byte char = byte(bytes32(uint(x) * 2 ** (8 * j)));
            if (char != 0) {
                bytesString[charCount] = char;
                charCount++;
            }
        }
        bytes memory bytesStringTrimmed = new bytes(charCount);
        for (j = 0; j < charCount; j++) {
            bytesStringTrimmed[j] = bytesString[j];
        }
        return string(bytesStringTrimmed);
    }
    
    function () {
        throw;
    }
}
