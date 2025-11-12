const errorHandler = (err , req, res,next)=>{
    console.log("Error :" , err.message);
    const statusCode = err.statusCode === 200 ? 500 : res.statusCode;

    res.status(statusCode).json({
        success : false , 
        msg : err.message || "internal Server Error"
    })

}

export default errorHandler;