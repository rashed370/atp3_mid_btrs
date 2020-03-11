const database = require("./database");

exports.insert =  (schedule, callback) => {
    const sql = "INSERT INTO `busschedules` VALUES( ?, ?, ?, ?, ?, ?, ? )";
    database.execute(sql, [
        null,
        schedule.bus,
        schedule.departure,
        schedule.arrival,
        schedule.route,
        schedule.fare,
        schedule.boarding
    ], status => {
        if(status)
        callback(true);
        else
        callback(false);  
    });
};

exports.update =  (schedule, callback) => {
    const sql = "UPDATE `busschedules` SET `busid` = ?, `departure` = ?, `arrival` = ?, `route` = ?, `fare` = ?, `boarding` = ? WHERE `id` = ?";
    database.execute(sql, [
        schedule.bus,
        schedule.departure,
        schedule.arrival,
        schedule.route,
        schedule.fare,
        schedule.boarding,
        schedule.id
    ], status => {
        if(status)
        callback(true);
        else
        callback(false);  
    });
};

exports.delete =  (id, callback) => {
    const sql = "DELETE FROM `busschedules` WHERE `id` = ?";
    database.execute(sql, [id], status => {
        if(status)
        callback(true);
        else
        callback(false);  
    });
};

exports.getAll = callback => {
    const sql = "SELECT bs.`id`, bs.`departure`, bs.`arrival`, bs.`route`, bs.`fare`, u.`company`, bc.`name` AS `boarding`, b.`name` AS `bus`, b.`registration` AS `bus_registration` FROM `busschedules` bs INNER JOIN `buses` b ON bs.`busid` = b.`id` INNER JOIN `users` u ON b.`operator` = u.`id` INNER JOIN `buscounters` bc ON bc.`id` = bs.`boarding` ORDER BY bs.`id` DESC ";
    database.getResult(sql, null, result => {
        if(result && result.length>0) 
        callback(result)
        else 
        callback(null);
    });
}

exports.getByOperator = (operator, callback) => {
    const sql = "SELECT bs.`id`, bs.`departure`, bs.`arrival`, bs.`route`, bs.`fare`, u.`company`, bc.`name` AS `boarding`, b.`name` AS `bus`, b.`registration` AS `bus_registration` FROM `busschedules` bs INNER JOIN `buses` b ON bs.`busid` = b.`id` INNER JOIN `users` u ON b.`operator` = u.`id` INNER JOIN `buscounters` bc ON bc.`id` = bs.`boarding` WHERE b.`operator` = ? ORDER BY bs.`id` DESC ";
    database.getResult(sql, [operator], result => {
        if(result && result.length>0) 
        callback(result)
        else 
        callback(null);
    });
};

// exports.getById = (id, callback) => {
//     const sql = "SELECT * FROM `busschedules` WHERE `id` = ? ORDER BY `id` DESC LIMIT 0, 1";
//     database.getResult(sql, [id], result => {
//         if(result && result.length>0) 
//         callback(result[0])
//         else 
//         callback(null);
//     });
// };