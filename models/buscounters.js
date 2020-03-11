const database = require("./database");

exports.insert =  (buscounter, callback) => {
    const sql = "INSERT INTO `buscounters` VALUES( ?, ?, ?, ? )";
    database.execute(sql, [
        null,
        buscounter.operator,
        buscounter.name,
        buscounter.location
    ], status => {
        if(status)
        callback(true);
        else
        callback(false);  
    });
};

exports.update =  (buscounter, callback) => {
    const sql = "UPDATE `buscounters` SET `operator` = ?, `name` = ?, `location` = ? WHERE `id` = ?";
    database.execute(sql, [
        buscounter.operator,
        buscounter.name,
        buscounter.location,
        buscounter.id
    ], status => {
        if(status)
        callback(true);
        else
        callback(false);  
    });
};

exports.delete =  (id, callback) => {
    const sql = "DELETE FROM `buscounters` WHERE `id` = ?";
    database.execute(sql, [id], status => {
        if(status)
        callback(true);
        else
        callback(false);  
    });
};

exports.getAll = callback => {
    const sql = "SELECT bc.`id`, bc.`operator`, bc.`name`, bc.`location`, u.`company`, u.`name` AS `manager` FROM `buscounters` bc INNER JOIN `users` u ON bc.`operator` = u.`id` ORDER BY bc.`id` DESC ";
    database.getResult(sql, null, result => {
        if(result && result.length>0) 
        callback(result)
        else 
        callback(null);
    });
}

exports.getByOperator = (operator, callback) => {
    const sql = "SELECT bc.`id`, bc.`operator`, bc.`name`, bc.`location`, u.`company`, u.`name` AS `manager` FROM `buscounters` bc INNER JOIN `users` u ON bc.`operator` = u.`id` WHERE bc.`operator` = ? ORDER BY bc.`id` DESC ";
    database.getResult(sql, [operator], result => {
        if(result && result.length>0) 
        callback(result)
        else 
        callback(null);
    });
};

exports.getById = (id, callback) => {
    const sql = "SELECT * FROM `buscounters` WHERE `id` = ? ORDER BY `id` DESC LIMIT 0, 1";
    database.getResult(sql, [id], result => {
        if(result && result.length>0) 
        callback(result[0])
        else 
        callback(null);
    });
};