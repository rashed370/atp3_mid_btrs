const database = require("./database");

exports.insert =  (bus, callback) => {
    const sql = "INSERT INTO `buses` VALUES( ?, ?, ?, ?, ?, ? )";
    database.execute(sql, [
        null,
        bus.operator,
        bus.name,
        bus.registration,
        bus.seats_column,
        bus.seats_row
    ], status => {
        if(status)
        callback(true);
        else
        callback(false);  
    });
};

exports.update =  (bus, callback) => {
    const sql = "UPDATE `buses` SET `operator` = ?, `name` = ?, `registration` = ?, `seats_column` = ?, `seats_row` = ? WHERE `id` = ?";
    database.execute(sql, [
        bus.operator,
        bus.name,
        bus.registration,
        bus.seats_column,
        bus.seats_row,
        bus.id
    ], status => {
        if(status)
        callback(true);
        else
        callback(false);  
    });
};

exports.delete =  (id, callback) => {
    const sql = "DELETE FROM `buses` WHERE `id` = ?";
    database.execute(sql, [id], status => {
        if(status)
        callback(true);
        else
        callback(false);  
    });
};

exports.getAll = callback => {
    const sql = "SELECT bs.`id`, bs.`operator`, bs.`name`, bs.`registration`, bs.`seats_column` AS `column`, bs.`seats_row` AS `row`, u.`company`, u.`name` AS `manager` FROM `buses` bs INNER JOIN `users` u ON bs.`operator` = u.`id` ORDER BY bs.`id` DESC ";
    database.getResult(sql, null, result => {
        if(result && result.length>0) 
        callback(result)
        else 
        callback(null);
    });
}

exports.getByOperator = (operator, callback) => {
    const sql = "SELECT bs.`id`, bs.`operator`, bs.`name`, bs.`registration`, bs.`seats_column` AS `column`, bs.`seats_row` AS `row`, u.`company`, u.`name` AS `manager` FROM `buses` bs INNER JOIN `users` u ON bs.`operator` = u.`id` WHERE bs.`operator` = ? ORDER BY bs.`id` DESC ";
    database.getResult(sql, [operator], result => {
        if(result && result.length>0) 
        callback(result)
        else 
        callback(null);
    });
};

exports.getById = (id, callback) => {
    const sql = "SELECT * FROM `buses` WHERE `id` = ? ORDER BY `id` DESC LIMIT 0, 1";
    database.getResult(sql, [id], result => {
        if(result && result.length>0) 
        callback(result[0])
        else 
        callback(null);
    });
};