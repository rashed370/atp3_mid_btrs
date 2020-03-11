const database = require("./database");
exports.getByOwner = (mobile, callback) => {
    const sql = "SELECT * FROM `supportticket` WHERE `owner` = ? ORDER BY `id` DESC";
    database.getResult(sql, [mobile], result => {
        if(result && result.length>0) 
        callback(result);
        else 
        callback(null);
    });
};

exports.getById = (id, callback) => {
    const sql = "SELECT * FROM `supportticket` WHERE `id` = ? ";
    database.getResult(sql, [id], result => {
        if(result && result.length>0) 
        callback(result);
        else 
        callback(null);
    });
};

exports.getOwnerName = (mobile, callback) => {
    const sql = "SELECT * FROM `supportticket` WHERE `owner` = ? ORDER BY `id` DESC LIMIT 0, 1";
    database.getResult(sql, [mobile], result => {
        if(result && result.length>0 && result[0] && result[0].name) 
        callback(result[0].name);
        else 
        callback(null);
    });
};

exports.insert =  ( supportticket, callback) => {
    const sql = "INSERT INTO `supportticket` VALUES( ?, ?, ?, ?, ?, ?, ? )";
    database.execute(sql, [
        null,
        supportticket.owner,
        supportticket.name, 
        supportticket.subject, 
        supportticket.details,
        'just-created', 
        supportticket.registered
    ], status => {
        if(status)
        callback(true);
        else
        callback(false);  
    });
};