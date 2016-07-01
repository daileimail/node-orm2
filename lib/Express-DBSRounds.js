
var orm = require("./ORM");
var _db      = null;
var _pending = 0;
var _queue   = [];
var callNum = 0;
var length = 0;
//uris(数据库的地址集合)
module.exports = function (uris, opts) {
    opts = opts || {};
    length = uris.length;
    _pending += 1;
    for (var i = 0 ;i<length;i++) {
        orm.connect(uris[i], function (err, db) {
            if (err) {
                if (typeof opts.error === "function") {
                    opts.error(err);
                } else {
                    throw err;
                }
                return checkRequestQueue();
            }
            if (Array.isArray(_db)) {
                _db.push(db);
            }else {
                _db = [db];
            }
            return checkRequestQueue();
        });
    }
    return function ORM_ExpressMiddleware(req, res, next) {
        var _models  = {};
        callNum++;
        var mydb = callNum= callNum%length;
        if (req.hasOwnProperty("models")) {
            if (typeof opts.define === "function") {
                opts.define(_db[mydb], _models);
            }
            for(var i in _models){
                req.models[i] = _models[i];
            }
            req.rodb = _db[mydb];
        }else{
            if (typeof opts.define === "function") {
                opts.define(_db[mydb], _models);
            }
            req.models = _models;
            req.rodb     = _db[mydb];
        }
        if (next === undefined && typeof res === 'function')
        {
            next = res;
        }
        if (_pending > 0) {
            _queue.push(next);
            return;
        }
        return next();
    };
};

function checkRequestQueue() {
    _pending -= 1;

    if (_pending > 0) return;
    if (_queue.length === 0) return;

    for (var i = 0; i < _queue.length; i++) {
        _queue[i]();
    }

    _queue.length = 0;
}