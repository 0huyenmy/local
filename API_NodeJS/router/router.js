module.exports=function(route){
    var studentController=require('../controllers/student_controller');
    
    route.get('/student/list',studentController.get_list);

}
// const route= express.Router();
//     var studentController=require('../controllers/student_controller');
    
//     route.get('/student/list',studentController.get_list);