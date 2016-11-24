;(function(window, undefined){
    var csrftoken;
    var OAUTH_LOGIN_URL = "https://open.weixin.qq.com/connect/oauth2/authorize";

    var HOST = window.location.host || "";
    if(HOST){
        HOST = "http://" + HOST;
    };
    
    var GET_ACCESS_TOKEN_URL = HOST + "/api/wechat/mpapi/access_token";
    var REFRESH_TOKEN_URL = HOST + "/api/wechat/mpapi/refresh_token";
    var GET_USER_INFO_URL = HOST + "/api/wechat/mpapi/userinfo";
    var noop = function(){};
    
    var USER_AGENT = window.navigator.userAgent;

    var strip = function(context){
        return context.replace(/^\s+|\s+$/g, '');
    };
    var jsonToQuery = function(JSON, isEncode) {
        var _fdata = function(data, isEncode) {
            data = data == null ? "": data;
            data = strip(data.toString());
            if (isEncode) {
                return encodeURIComponent(data)
            } else {
                return data
            }
        };
        var _Qstring = [];
        if (typeof JSON == "object") {
            for (var k in JSON) {
                if (k === "$nullName") {
                    _Qstring = _Qstring.concat(JSON[k]);
                    continue
                }
                if (JSON[k] instanceof Array) {
                    for (var i = 0, len = JSON[k].length; i < len; i++) {
                        _Qstring.push(k + "=" + _fdata(JSON[k][i], isEncode))
                    }
                } else {
                    if (typeof JSON[k] != "function") {
                        _Qstring.push(k + "=" + _fdata(JSON[k], isEncode))
                    }
                }
            }
        }
        if (_Qstring.length) {
            return _Qstring.join("&")
        } else {
            return ""
        }
    };

    var noop = function(){};
    var getAjaxResponse = function(method, url, data, async, successcallback, errorcallback){
        var noop = function(){};
        if(typeof(data) === "undefined"){
            data = null;
        }
        if(typeof(successcallback) === "undefined"){
            successcallback = noop;
        }
        if(typeof(errorcallback) === "undefined"){
            errorcallback = noop;
        }
        if(typeof(async) === "undefined"){
            async = true;
        }
        method = method.toUpperCase();
        var XMLHttpReq;
        function createXMLHttpRequest() {
            try {
                XMLHttpReq = new ActiveXObject("Msxml2.XMLHTTP");//IE高版本创建XMLHTTP
            }
            catch(E) {
                try {
                    XMLHttpReq = new ActiveXObject("Microsoft.XMLHTTP");//IE低版本创建XMLHTTP
                }
                catch(E) {
                    XMLHttpReq = new XMLHttpRequest();//兼容非IE浏览器，直接创建XMLHTTP对象
                }
            }
        
        }
        function sendAjaxRequest() {
            createXMLHttpRequest();                                //创建XMLHttpRequest对象
            origin_method = method;
            if(method !== "GET" && method !== "POST"){
                method = "POST";
            }
            XMLHttpReq.open(method, url, async);
            if(origin_method !== "GET" && origin_method !== "POST"){
                XMLHttpReq.setRequestHeader("X-HTTP-Method-Override",origin_method);
            }
            if(method === "POST"){
                XMLHttpReq.setRequestHeader("Content-type","application/x-www-form-urlencoded");
                XMLHttpReq.setRequestHeader("X-CSRFToken",csrftoken);
            }
            XMLHttpReq.onreadystatechange = processResponse; //指定响应函数
            var send_data = null;
            if(typeof data == "object"){
                send_data = jsonToQuery(data, true);
            }else{
                send_data = data;
            }
            XMLHttpReq.send(send_data);
        }
        //回调函数
        function processResponse() {
            if (XMLHttpReq.readyState == 4) {
                if (Math.floor(XMLHttpReq.status/100) == 2) {
                    var text = XMLHttpReq.responseText;
                    successcallback(text);
                }else{
                    errorcallback(XMLHttpReq);
                }
            }
        }
        sendAjaxRequest();
    };

    var getResponse = function(url, successcallback, errorcallback, async){
        getAjaxResponse("GET", url, undefined, async, successcallback, errorcallback);
    };

    var isEmpty = function(o, isprototype) {
        var ret = true;
        for (var k in o) {
            if (isprototype) {
                ret = false;
                break
            } else {
                if (o.hasOwnProperty(k)) {
                    ret = false;
                    break
                }
            }
        }
        return ret
    };
    var queryToJson = function(QS, isDecode) {
        var _Qlist = strip(QS).split("&");
        var _json = {};
        var _fData = function(data) {
            if (isDecode) {
                return decodeURIComponent(data)
            } else {
                return data
            }
        };
        for (var i = 0, len = _Qlist.length; i < len; i++) {
            if (_Qlist[i]) {
                var _hsh = _Qlist[i].split("=");
                var _key = _hsh[0];
                var _value = _hsh[1];
                if (_hsh.length < 2) {
                    _value = _key;
                    _key = "$nullName"
                }
                if (!_json[_key]) {
                    _json[_key] = _fData(_value)
                } else {
                    if ($.core.arr.isArray(_json[_key]) != true) {
                        _json[_key] = [_json[_key]]
                    }
                    _json[_key].push(_fData(_value))
                }
            }
        }
        return _json
    };
    var parseParam = function(oSource, oParams, isown) {
        var key, obj = {};
        oParams = oParams || {};
        for (key in oSource) {
            obj[key] = oSource[key];
            if (oParams[key] != null) {
                if (isown) {
                    if (oSource.hasOwnProperty[key]) {
                        obj[key] = oParams[key]
                    }
                } else {
                    obj[key] = oParams[key]
                }
            }
        }
        return obj
    };
    var parseURL = function(url) {
        var parse_url = /^(?:([A-Za-z]+):(\/{0,3}))?([0-9.\-A-Za-z]+\.[0-9A-Za-z]+)?(?::(\d+))?(?:\/([^?#]*))?(?:\?([^#]*))?(?:#(.*))?$/;
        var names = ["url", "scheme", "slash", "host", "port", "path", "query", "hash"];
        var results = parse_url.exec(url);
        var that = {};
        for (var i = 0, len = names.length; i < len; i += 1) {
            that[names[i]] = results[i] || ""
        }
        return that
    };
    var URL = function(sURL, args) {
        var opts = parseParam({
            isEncodeQuery: false,
            isEncodeHash: false
        },
        args || {});
        var that = {};
        var url_json = parseURL(sURL);
        var query_json = queryToJson(url_json.query);
        var hash_json = queryToJson(url_json.hash);
        that.setParam = function(sKey, sValue) {
            query_json[sKey] = sValue;
            return this
        };
        that.getParam = function(sKey) {
            return query_json[sKey]
        };
        that.setParams = function(oJson) {
            for (var key in oJson) {
                that.setParam(key, oJson[key])
            }
            return this
        };
        that.setHash = function(sKey, sValue) {
            hash_json[sKey] = sValue;
            return this
        };
        that.getHash = function(sKey) {
            return hash_json[sKey]
        };
        that.valueOf = that.toString = function() {
            var url = [];
            var query = jsonToQuery(query_json, opts.isEncodeQuery);
            var hash = jsonToQuery(hash_json, opts.isEncodeQuery);
            if (url_json.scheme != "") {
                url.push(url_json.scheme + ":");
                url.push(url_json.slash)
            }
            if (url_json.host != "") {
                url.push(url_json.host);
                if (url_json.port != "") {
                    url.push(":");
                    url.push(url_json.port)
                }
            }
            url.push("/");
            url.push(url_json.path);
            if (query != "") {
                url.push("?" + query)
            }
            if (hash != "") {
                url.push("#" + hash)
            }
            return url.join("")
        };
        return that
    };
    var CookieUtil = {
        set: function(sKey, sValue, oOpts) {
            var arr = [];
            var d, t;
            var cfg = parseParam({
                expire: null,
                path: "/",
                domain: null,
                secure: null,
                encode: true
            },
            oOpts);
            if (cfg.encode == true) {
                sValue = escape(sValue)
            }
            arr.push(sKey + "=" + sValue);
            if (cfg.path != null) {
                arr.push("path=" + cfg.path)
            }
            if (cfg.domain != null) {
                arr.push("domain=" + cfg.domain)
            }
            if (cfg.secure != null) {
                arr.push(cfg.secure)
            }
            if (cfg.expire != null) {
                d = new Date();
                t = d.getTime() + cfg.expire * 3600000;
                d.setTime(t);
                arr.push("expires=" + d.toGMTString())
            }
            document.cookie = arr.join(";")
        },
        get: function(sKey) {
            sKey = sKey.replace(/([\.\[\]\$])/g, "\\$1");
            var rep = new RegExp(sKey + "=([^;]*)?;", "i");
            var co = document.cookie + ";";
            var res = co.match(rep);
            if (res) {
                return res[1] || ""
            } else {
                return ""
            }
        },
        remove: function(sKey, oOpts) {
            oOpts = oOpts || {};
            oOpts.expire = -10;
            CookieUtil.set(sKey, "", oOpts)
        }
    };
    var clientInfo = function() {
        var scripts = document.getElementsByTagName("script");
        var len = scripts.length,
        index = 0,
        wechatJs, url, appkey, secret, version, source;
        if (len > 0) {
            wechatJs = scripts[index++];
            while (wechatJs) {
                if (wechatJs.src.indexOf("/wechat_oauth_sdk.js") != -1) {
                    url = wechatJs.src.split("?").pop();
                    break
                }
                wechatJs = scripts[index++]
            }
        }
        url = url.toLowerCase();
        var oPara = queryToJson(url);
        appkey = oPara.appkey || "";
        secret = oPara.secret || "";
        debug = oPara.debug || false;
        version = oPara.version || 1;
        scope = oPara.scope || "snsapi_userinfo";
        source = oPara.source || "";
        return {
            appkey: appkey,
            secret: secret,
            debug: debug,
            version: version,
            scope: scope,
            source: source
        }
    }
    var info = clientInfo();
    csrftoken = CookieUtil.get("csrftoken");
    var WXOauth = window.WXOauth = {};
    WXOauth.oauthData = {};
    
    WXOauth.isLogin = function(){
        return (!!WXOauth.oauthData.expires_in) && (!!WXOauth.oauthData.access_token) && (Math.floor((new Date()).getTime()/1000) < WXOauth.oauthData.expires_in)
    }
    WXOauth._config = info;
    var Cookie = {
        load: function() {
            if (!isEmpty(WXOauth.oauthData)) {
                return WXOauth.oauthData
            } else {
                var _cookie = CookieUtil.get("wxoauth_js_" + WXOauth._config.appkey);
                _cookie = unescape(_cookie);
                var oCookie = queryToJson(_cookie);
                return oCookie
            }
        },
        save: function(oCookie) {
            if (oCookie.expires_in < 1000000000){
                oCookie.expires_in = ((oCookie.expires_in || 0) + Math.floor((new Date()).getTime()/1000)) - 60*10;
            }
            WXOauth.oauthData = oCookie;
            var _cookie = "access_token=" + (oCookie.access_token || "") + "&refresh_token=" + (oCookie.refresh_token || "") + "&expires_in=" + (oCookie.expires_in || 0) + "&openid=" + (oCookie.openid || "") + "&scope=" + (oCookie.scope || "");
            CookieUtil.set("wxoauth_js_" + WXOauth._config.appkey, _cookie, {
                path: "/",
                domain: document.domain
            })
        },
        del: function() {
            WXOauth.oauthData = {};
            CookieUtil.remove("wxoauth_js_" + WXOauth._config.appkey, {
                path: "/",
                domain: document.domain
            })
        }
    };
    WXOauth.Cookie = Cookie;
    var getLoginStatus = function() {
/*         WXOauth.oauthData = Cookie.load(); */
        WXOauth.oauthData = {};
    }
    getLoginStatus();
    var removeUrlParam = function(url, param){
        var arrUrl = url.split("?");
        if(arrUrl.length == 1){
            return url;
        }
        var params = arrUrl[1].split("&");
        var new_params = []
        for(var i=0; i<params.length; i++){
            if(params[i].split("=")[0] !== param){
                new_params.push(params[i]);
            }
        }
        return arrUrl[0] + "?" + new_params.join("&");
    }
    var showLogin = function(redirect_uri, state, wechat_redirect) {
        if(typeof(redirect_uri) === "undefined"){
            redirect_uri = window.location.href;
        }
        if(typeof(wechat_redirect) === "undefined"){
            wechat_redirect = false;
        }
        redirect_uri = removeUrlParam(redirect_uri, "code");
        redirect_uri = removeUrlParam(redirect_uri, "state");
        if(typeof(state) === "undefined"){
            state = "STATE";
        }
        var url = URL(OAUTH_LOGIN_URL);
        url.setParam("appid", WXOauth._config.appkey);
        url.setParam("redirect_uri", encodeURIComponent(redirect_uri));
        url.setParam("response_type", "code");
        url.setParam("scope", WXOauth._config.scope);
        url.setParam("state", state);
        if(wechat_redirect){
            return url.toString() + "#wechat_redirect"; 
        }else{
            return url.toString();
        }
    }
    WXOauth.showLogin = showLogin;
    WXOauth.login = function(redirect_uri, state, wechat_redirect){
        var url = showLogin(redirect_uri, state, wechat_redirect)
        window.location.href = url;
    }
    WXOauth.logout = function(){
        Cookie.del();
    }
    var currURL = URL(location.href);
    var currState = WXOauth.currState = currURL.getParam("state");
    WXOauth.getAccessToken = function(code, successcallback, errorcallback, async){
        if(typeof(code) === "undefined"){
            return false;
        }
        if(typeof(successcallback) === "undefined"){
            successcallback = noop;
        }
        if(typeof(errorcallback) === "undefined"){
            errorcallback = noop;
        }
        var url = URL(GET_ACCESS_TOKEN_URL);
        url.setParam("source", WXOauth._config.source);
        url.setParam("code", code);
        getResponse(url.toString(), function(data){
            data = JSON.parse(data);
            if(data.access_token){
                Cookie.save(data);
                successcallback(data);
            }else{
                errorcallback(data);
            }
        }, errorcallback, async);
    }

    WXOauth.getAccessToken(currURL.getParam("code"), undefined, undefined, false);

    WXOauth.refreshToken = function(successcallback, errorcallback){
        if(typeof(successcallback) === "undefined"){
            successcallback = noop;
        }
        if(typeof(errorcallback) === "undefined"){
            errorcallback = noop;
        }
        var url = URL(REFRESH_TOKEN_URL);
        url.setParam("source", WXOauth._config.source);
        url.setParam("refresh_token", WXOauth.oauthData.refresh_token);
        getResponse(url.toString(), function(data){
            data = JSON.parse(data);
            if(data.access_token){
                Cookie.save(data);
                successcallback(data);
            }else{
                errorcallback(data);
            }
        }, errorcallback);
    }
    var _getUserInfo = function(successcallback, errorcallback){
        if(typeof(successcallback) === "undefined"){
            successcallback = noop;
        }
        if(typeof(errorcallback) === "undefined"){
            errorcallback = noop;
        }
        var url = URL(GET_USER_INFO_URL);
        url.setParam("source", WXOauth._config.source);
        url.setParam("access_token", WXOauth.oauthData.access_token);
        url.setParam("openid", WXOauth.oauthData.openid);
        getResponse(url.toString(), function(data){
            data = JSON.parse(data);
            if(data.openid){
                successcallback(data);
            }else{
                WXOauth.refreshToken(function(data){
                    var url = URL(GET_USER_INFO_URL);
                    url.setParam("source", WXOauth._config.source);
                    url.setParam("access_token", WXOauth.oauthData.access_token);
                    url.setParam("openid", WXOauth.oauthData.openid);
                    getResponse(url.toString(), function(data){
                        data = JSON.parse(data);
                        if(data.openid){
                            successcallback(data);
                        }else{
                            errorcallback(data);
                        }
                    }, errorcallback);
                }, errorcallback);
            }
        }, errorcallback);
    }
    WXOauth.getUserInfo = function(successcallback, errorcallback){
        if(typeof(successcallback) === "undefined"){
            successcallback = noop;
        }
        if(typeof(errorcallback) === "undefined"){
            errorcallback = noop;
        }
        if(WXOauth.oauthData.access_token && WXOauth.oauthData.openid){
            _getUserInfo(successcallback, errorcallback);
        }else{
            errorcallback("Need Login");
        }
    }
})(window);