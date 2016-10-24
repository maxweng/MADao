contract MDC {
    struct UserInfo{
        bytes32 name;
        bytes32 country;
        bytes32 id;
        uint birthdate;
        bytes32 phone;
        bytes32 email;
        uint timestamp;
        bytes32 noncestr;
    }
    
    struct ClaimInfo{
        address claimer;
        bytes32 reason;
        UserInfo userInfo;
        uint8 status; // 0: init, 2: investigating, 6: passed, 8: rejected
    }

    mapping (address => uint) public balances;
    mapping (address => bytes32) public infoHashes;
    
    mapping (uint => address) public userAddresses;
    uint public totalUserAddresses;
    
    mapping (uint => ClaimInfo) claims;
    uint public totalClaims;
    
    uint public operatingChargeBalance;

    uint public totalBalances;
    address public organizer;
    
    uint public maxOperatingCharge;
    
    uint8 public recommendationRewardRate;
    uint8 public operatingChargeRate;
    uint public claimFee;

    uint8 public status; // 0: no claim, 2: has claim

    modifier organizerRequired() { if (organizer != msg.sender) throw; _ }

	function MDC(uint _maxOperatingCharge) {
        organizer = msg.sender;
        if(_maxOperatingCharge == 0){
            maxOperatingCharge = 10 ether;
        }else{
            maxOperatingCharge = _maxOperatingCharge;
        }
	}
	
	function changeSettings(uint8 _recommendationRewardRate, uint8 _operatingChargeRate, uint _claimFee) organizerRequired{
    	if(_recommendationRewardRate > 100 || _operatingChargeRate > 100 || _recommendationRewardRate + _operatingChargeRate > 100) throw;
    	recommendationRewardRate = _recommendationRewardRate;
    	operatingChargeRate = _operatingChargeRate;
    	claimFee = _claimFee;
	}

	function transferOrganizer(address new_organizer) organizerRequired {
    	organizer = new_organizer;
	}

	function signUp(bytes32 _infoHash, address recommender) {
    	if(msg.value <= 0) throw;
    	uint recommender_fee = 0;
    	if(recommender != address(0)){
        	recommender_fee = msg.value * recommendationRewardRate / 100;
    	}
    	uint operating_charge_fee = msg.value * operatingChargeRate / 100;
    	uint user_fee = msg.value - recommender_fee - operating_charge_fee;
    	if(user_fee + operating_charge_fee + recommender_fee != msg.value) throw;
    	
    	if(infoHashes[msg.sender] == ""){
        	totalUserAddresses++;
        	userAddresses[totalUserAddresses] = msg.sender;
        	infoHashes[msg.sender] = _infoHash;
    	}else{
        	if(infoHashes[msg.sender] != _infoHash) throw;
    	}
    	
    	if(recommender != address(0) && recommender_fee > 0){
        	if(!recommender.send(recommender_fee)) throw;
        }
    	
    	balances[msg.sender] += user_fee;
    	balances[recommender] += recommender_fee;
    	operatingChargeBalance += operating_charge_fee;
    	totalBalances += user_fee + operating_charge_fee;
	}
	
	function claim(bytes32 _name, bytes32 _country, bytes32 _id, uint _birthdate, bytes32 _phone, bytes32 _email, uint _timestamp, bytes32 _noncestr, bytes32 _reason) {
    	if(operatingChargeBalance < maxOperatingCharge) throw;
    	if(balances[msg.sender] < claimFee) throw;
    	if(status != 0) throw;
    	
        totalClaims++;
        status = 2;
        claims[totalClaims] = ClaimInfo({
            claimer: msg.sender,
            reason: _reason,
            userInfo: UserInfo({
                name: _name,
                country: _country,
                id: _id,
                birthdate: _birthdate,
                phone: _phone,
                email: _email,
                timestamp: _timestamp,
                noncestr: _noncestr
            }),
            status: 0
        });
        
        balances[msg.sender] -= claimFee;
        operatingChargeBalance += claimFee;
	}
	
	function getClaim(uint claimID) returns(address claimer, bytes32 reason, uint8 claimStatus, bytes32 claimerName, bytes32 claimerCountry, bytes32 claimerId, uint claimerBirthdate, bytes32 claimerPhone, bytes32 claimerEmail, uint claimerTimestamp, bytes32 claimerNoncestr) {
    	ClaimInfo claim = claims[claimID];
    	claimer = claim.claimer;
    	reason = claim.reason;
    	claimStatus = claim.status;
    	claimerName = claim.userInfo.name;
    	claimerCountry = claim.userInfo.country;
    	claimerId = claim.userInfo.id;
    	claimerBirthdate = claim.userInfo.birthdate;
    	claimerPhone = claim.userInfo.phone;
    	claimerEmail = claim.userInfo.email;
    	claimerTimestamp = claim.userInfo.timestamp;
    	claimerNoncestr = claim.userInfo.noncestr;
	}
	
	function investigateClaim(uint claimID, uint _needMaxOperatingCharge) organizerRequired {
    	if(_needMaxOperatingCharge > maxOperatingCharge) throw;
    	ClaimInfo claim = claims[claimID];
    	if(claim.status != 0) throw;
    	
    	if(operatingChargeBalance < _needMaxOperatingCharge || totalBalances < _needMaxOperatingCharge) throw;
    	if(!organizer.send(_needMaxOperatingCharge)) throw;
    	operatingChargeBalance -= _needMaxOperatingCharge;
    	totalBalances -= _needMaxOperatingCharge;
    	
    	claim.status = 2;
	}
	
	function passClaim(uint claimID, uint8 compensationRate, uint8 max_compensation) organizerRequired {
    	ClaimInfo claim = claims[claimID];
    	if(claim.status != 2) throw;
        if(totalBalances * compensationRate / 100 > max_compensation) throw;

        uint compensation = 0;
        for(uint i=1; i<=totalUserAddresses; i++){
            uint userBalance = balances[userAddresses[totalUserAddresses]];
            if(userBalance >= claimFee){
                uint userCompensation = userBalance * compensationRate / 100;
                if(userCompensation > 0 && userCompensation <= userBalance){
                    balances[userAddresses[totalUserAddresses]] -= userCompensation;
                    compensation += userCompensation;
                }
            }
        }

        if(compensation > totalBalances) throw;
        if(!claim.claimer.send(compensation)) throw;
        totalBalances -= compensation;

        claim.status = 6;
        status = 0;
	}
	
	function rejectClaim(uint claimID) organizerRequired {
    	ClaimInfo claim = claims[claimID];
    	if(claim.status != 2) throw;
    	claim.status = 8;
    	status = 0;
	}

    function () {
        throw;
    }
}
