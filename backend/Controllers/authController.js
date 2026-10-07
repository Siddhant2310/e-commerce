const User = require("../models/userModel")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken");
const { generateRefreshToken, generateAccessToken } = require("../utils/tokenUtils");


exports.register = async(req,res) => {
    try{
        const {name, email, password} = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }  
        
        const existingUser = await User.findOne({email});

        if(existingUser){
            return res.status(409).json({
                success: false,
                message: "User with this email already exists"
            })
        }

        const user = await User.create({ name, email, password })

        res.status(201).json({
            success: true,
            message: "User registered successfully",
            user: {
                id : user._id,
                name: user.name,
                email: user.email
               
            }
        });
    }catch(error){
        if(error.name === "ValidationError"){
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                error: error.message
            })
        }

        console.error("Internal server error: ", error)

        res.status(500).json({
            success: false,
            message: "Internal server error"
        });

    }
}


exports.login = async(req,res) => {
    try{
        const {email, password} = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }  
        
        const existingUser = await User.findOne({email});

        if (!existingUser) { 
            return res.status(401).json({ 
                success: false, 
                message: "Invalid email or password" 
            });
        }

        const isPasswordCorrect = await bcrypt.compare(password, existingUser.password);

        if (!isPasswordCorrect) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const accessToken = generateAccessToken(existingUser);
        const refreshToken = generateRefreshToken(existingUser);

        res.status(200).json({
            success: true,
            message: "Login successful",
            accessToken,
            refreshToken,
            user: {
                id: existingUser._id,
                name: existingUser.name,
                email: existingUser.email,
                role: existingUser.role
            }
        });
    }catch(error){
        if(error.name === "ValidationError"){
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                error: error.message
            })
        }

        console.error("Internal server error: ", error)

        res.status(500).json({
            success: false,
            message: "Internal server error"
        });

    }
}


exports.refreshAccessToken = async(req,res)=>{
    try{
       const {refreshToken} = req.body;
       if(!refreshToken){
        return res.status(401).json({
            success:false,
            message: "Refresh Token is required"
        });
       }

       const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

       const user = await User.findById(decoded.userId);

       if (!user) {
        return res.status(401).json({ 
        success: false, 
        message: "User no longer exists" 
    });
    }
    const newAccessToken = generateAccessToken(user);

    res.status(200).json({
         success: true, 
         accessToken: newAccessToken 
        });


}catch(error) {
    res.status(401).json({ 
        success: false, 
        message: "Invalid or expired refresh token" 
    });

  }

};

exports.logout = async(req, res) =>{
try{

    const {refreshToken } = req.body; 
    // in a production implementation, 
    //find the refersh session and revoke it.

    res.status(200).json({
        success: true,
        message: "Logged out successfully"
    });


}catch(err){
    res.status(500).json({
        success: false,
        message: " Internal Server error"
    });

}
}