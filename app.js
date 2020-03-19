const express=require("express");
const ejs=require("ejs");
const bodyParser=require("body-parser");
const app=express();
const mongoose=require("mongoose");
const passport=require("passport");
const LocalStrategy=require("passport-local");
const passportLocalMongoose=require("passport-local-mongoose");
const User=require("./models/user");
const multer=require("multer");
const path=require("path");
var methodOverride=require("method-override");

mongoose.connect("mongodb://localhost:27017/yelp_camp");

var campgroundSchema=new mongoose.Schema({
	name:String,
	image:String,
	description:String
});

var Campground= mongoose.model("Campground",campgroundSchema);

 
app.set("view engine","ejs");
app.use(bodyParser.urlencoded({extended:true}));
// app.use(express.static('public'));
app.use(express.static(path.join(__dirname, './public/')));
app.use(methodOverride("_method"));


app.use(require("express-session")({
	secret:"heyy guy",
	resave:false,
	saveUninitialized:false
}));
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// multer------------------------------------------------------------------
var storage = multer.diskStorage({
  destination:'./public/uploads',
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '_' + Date.now()+path.extname(file.originalname));
  }
 
})
var upload = multer({ storage: storage }).single('file');

 //----------------------------------------------------------------- 

app.use(function(req,res,next){       
	res.locals.currentUser=req.user;
	next();
});

// app.get("/",function(req,res){
// 	res.render("show")
// });

app.get("/campgrounds",isLoggedIn,function(req,res){
	Campground.find({},function(err,campground){         
		if(err){                                        
			console.log(err);
		}else{
           res.render("campgrounds",{campgrounds:campground,currentUser:req.user});
		}
	}); 	
	  
});

app.post("/campgrounds",upload,isLoggedIn,function(req,res){
	//get back data from form and add to compounds array
	//redirect back to campground
	var imageFile=req.file.filename;

	var post=
	{ name:req.body.name,
      image:imageFile,
      description:req.body.desc
  };
    
     
     Campground.create(post,function(err,campground){
     	if(err){
     		console.log(err);
     	}else{
     		console.log("successsfully added");
     		console.log(campground);
     	}
     });
     res.redirect("/campgrounds");
});

app.get("/campgrounds/new",isLoggedIn,function(req,res){
	res.render("new");
});

app.get("/campgrounds/:id",isLoggedIn,function(req,res){
	var id=req.params.id;
	Campground.findById(id,function(err, campground){
		if(!err){
			 
				 res.render("details",{campground:campground,currentUser:req.user});
			}else{
					res.send("<h1>Not Found</h1>");
					console.log("err");
				}
			 
		 
	});
	 
});


              // delete route
app.delete("/campgrounds/:id",function(req,res){
  Campground.findByIdAndRemove(req.params.id,function(err){
    if(!err){
      res.redirect("/campgrounds")
    }
  });
});             


//============================Auth Routes==================================================================

app.get("/register",function(req,res){
	res.render("register");
});

app.post("/register",function(req,res){
	 req.body.username
	req.body.password
	 User.register(new User({username:req.body.username}),req.body.password,function(err,user){
	 	if(err){
	 		console.log(err);
	 		return res.render("register");
	 	}  
	 		passport.authenticate("local")(req,res,function(){
	 			res.redirect("/campgrounds");
	 		});
	 });
});

// this route only shows the login form
app.get("/login",function(req,res){
	res.render("login");
});

//this route submits the login form
//app.post("/login",middleware,callback)
 app.post("/login",passport.authenticate("local",{
 	successRedirect:"/campgrounds",
 	failureRedirect:"/login"
 }),function(req,res){}); 

 app.get("/logout",function(req,res){
 	req.logout();
 	res.redirect("/");
 });

  app.get("/logout",function(req,res){
 	req.logout();
 	res.redirect("/");
 });

 function isLoggedIn(req,res,next){
 	if(req.isAuthenticated()){
 		return next();
 	}
 	res.redirect("/login");
 }

app.listen(process.env.PORT ||3000,()=>{
	console.log("server started on port 3000");
});