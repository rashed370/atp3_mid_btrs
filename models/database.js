const mysql = require("mysql");


const connection = callback => {
    const connection = mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'atp3_btrs_mid'
    });

    connection.connect(err => {
        if(err) callback(null);
    });

    callback(connection);
};

exports.getResult = (sql, params, callback) => {
    connection(connection => {
        if(connection!=null) {
            if(params!=null)   
            connection.query(sql, params, (error, results) => {
                if(!error){
                    callback(results);
                }else{
                    callback(null);
                }
            });
            else 
            connection.query(sql, (error, results) => {
                if(!error){
                    callback(results);
                }else{
                    callback(null);
                }
            });

            connection.end();	
        } 
    });
};

exports.execute = (sql, params, callback) => {
    connection(connection => {
        if(connection!=null) {
            if(params!=null)   
            connection.query(sql, params, (error, status) => {
                if(status){
                    callback(true);
                }else{
                    callback(false);
                }
                if(error!=null) {
                    console.log(error);
                }
            });
            else 
            connection.query(sql, (error, status) => {
                if(!status){
                    callback(true);
                }else{
                    callback(false);
                }
            }); 
            connection.end();	
        } 
    });
};