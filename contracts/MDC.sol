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
    
    uint public operating_charge_balance;

    uint public totalBalances;
    address public organizer;
    
    uint public max_operating_charge;
    
    uint8 public recommendation_reward_rate;
    uint8 public operating_charge_rate;
    uint public claim_fee;

    uint8 public status; // 0: no claim, 2: has claim

    modifier organizerRequired() { if (organizer != msg.sender) throw; _ }

	function MDC(uint _max_operating_charge) {
        organizer = msg.sender;
        if(_max_operating_charge == 0){
            max_operating_charge = 1000;
        }else{
            max_operating_charge = _max_operating_charge;
        }
	}
	
	function changeSettings(uint8 _recommendation_reward_rate, uint8 _operating_charge_rate, uint _claim_fee) organizerRequired{
    	if(_recommendation_reward_rate > 100 || _operating_charge_rate > 100 || _recommendation_reward_rate + _operating_charge_rate > 100) throw;
    	recommendation_reward_rate = _recommendation_reward_rate;
    	operating_charge_rate = _operating_charge_rate;
    	claim_fee = _claim_fee;
	}

	function transferOrganizer(address new_organizer) organizerRequired {
    	organizer = new_organizer;
	}

	function signUp(bytes32 _infoHash, address recommender) {
    	if(msg.value <= 0) throw;
    	uint recommender_fee = 0;
    	if(recommender != address(0)){
        	recommender_fee = msg.value * recommendation_reward_rate / 100;
    	}
    	uint operating_charge_fee = msg.value * operating_charge_rate / 100;
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
    	operating_charge_balance += operating_charge_fee;
    	totalBalances += user_fee + operating_charge_fee;
	}
	
	function claim(bytes32 _name, bytes32 _country, bytes32 _id, uint _birthdate, bytes32 _phone, bytes32 _email, uint _timestamp, bytes32 _noncestr, bytes32 _reason) {
    	if(operating_charge_balance < max_operating_charge) throw;
    	if(balances[msg.sender] < claim_fee) throw;
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
        
        balances[msg.sender] -= claim_fee;
        operating_charge_balance += claim_fee;
	}
	
	function investigateClaim(uint claimID, uint _need_max_operating_charge) organizerRequired {
    	if(_need_max_operating_charge > max_operating_charge) throw;
    	ClaimInfo claim = claims[claimID];
    	if(claim.status != 0) throw;
    	
    	if(operating_charge_balance < _need_max_operating_charge || totalBalances < _need_max_operating_charge) throw;
    	if(!organizer.send(_need_max_operating_charge)) throw;
    	operating_charge_balance -= _need_max_operating_charge;
    	totalBalances -= _need_max_operating_charge;
    	
    	claim.status = 2;
	}
	
	function passClaim(uint claimID, uint8 compensation_rate, uint8 max_compensation) organizerRequired {
    	ClaimInfo claim = claims[claimID];
    	if(claim.status != 2) throw;
        if(totalBalances * compensation_rate / 100 > max_compensation) throw;

        uint compensation = 0;
        for(uint i=1; i<=totalUserAddresses; i++){
            uint userBalance = balances[userAddresses[totalUserAddresses]];
            if(userBalance >= claim_fee){
                uint userCompensation = userBalance * compensation_rate / 100;
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
