const database = require("./database");

exports.getById = (id, callback) => {
    const sql = "SELECT * FROM `users` WHERE `id` = ? ORDER BY `id` DESC LIMIT 0, 1";
    database.getResult(sql, [id], result => {
        if(result && result.length>0) 
        callback(result[0])
        else 
        callback(null);
    });
};

exports.getByEmail = (email, callback) => {
    const sql = "SELECT * FROM `users` WHERE `email` = ? ORDER BY `id` DESC LIMIT 0, 1";
    database.getResult(sql, [email], result => {
        if(result && result.length>0) 
        callback(result[0])
        else 
        callback(null);
    });
};

exports.insert =  (user, callback) => {
    const sql = "INSERT INTO `users` VALUES( ?, ?, ?, ?, ?, ?, ?, ?, ? )";
    database.execute(sql, [
        null,
        user.email, 
        user.password, 
        user.name, 
        user.company, 
        user.operator, 
        user.role, 
        user.validated, 
        user.registered
    ], status => {
        if(status)
        callback(true);
        else
        callback(false);  
    });
};

exports.update =  (user, callback) => {
    const sql = "UPDATE `users` SET `email` = ?, `password` = ?, `name` = ?, `company` = ?, `operator` = ? WHERE `id` = ?";
    database.execute(sql, [
        user.email, 
        user.password, 
        user.name, 
        user.company, 
        user.operator, 
        user.id
    ], status => {
        if(status)
        callback(true);
        else
        callback(false);  
    });
};

exports.delete =  (id, callback) => {
    const sql = "DELETE FROM `users` WHERE `id` = ?";
    database.execute(sql, [id], status => {
        if(status)
        callback(true);
        else
        callback(false);  
    });
};

exports.validate = (id, callback) => {
    const sql = "UPDATE `users` SET `validated` = ? WHERE `id` = ?";
    database.execute(sql, [1, id], status => {
        if(status)
        callback(true);
        else
        callback(false);  
    });
}

exports.getAwaitValidation = callback => {
    const sql = "SELECT COUNT(*) as `awaiting` FROM `users` WHERE `validated` = ?";
    database.getResult(sql, [0], result => {
        if(result && result.length>0) 
        callback(result[0])
        else 
        callback(null);
    });
}

exports.getUnvalidated = callback => {
    const sql = "SELECT * FROM `users` WHERE `validated` = ?";
    database.getResult(sql, [0], result => {
        if(result && result.length>0) 
        callback(result)
        else 
        callback(null);
    });
}