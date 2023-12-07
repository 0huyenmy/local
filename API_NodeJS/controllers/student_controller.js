var Student=require('../models/student_model');

exports.get_all=function(req,res){
    Student.get_all(function(data){
        res.send({result:data});
    });
}