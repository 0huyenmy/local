const db=require("../config/db")
const Student=function(student){
    this.student_id=student.student_id;
    this.student_name=student.student_name;
    this.dob=student.dob;
    this.course_name=student.course_name;
}
Student.get_all = function(result){
    db.query("select * form test.student", function(err,student){
        if(err){
            result(null);
        }
        else result(student);
    })
}
module.exports=Student;