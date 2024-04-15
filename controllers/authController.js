const User = require('../models/userModel');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const Email = require('../utils/emailHandler');
const color = require('../utils/colors');

const filterObj = (obj, ...allowedFields) => {
    const newObj = {};
    Object.keys(obj).forEach(el => {
        if(allowedFields.includes(el)) newObj[el] = obj[el];
    });
    return newObj;
}

exports.signUp = catchAsync(async (req, res, next) => {
    const data = filterObj(req.body, 'first_name', 'last_name', 'email', 'password', 'password_confirm', 'role', 'dob', 'gender');
    if(data.role === 'admin') {
        return next(new AppError('You cannot create an admin user', 401));
    }
    
    
    // hash the password automatically when create or save
    console.log(color.FgCyan, 'Creating user...', color.Reset);
    const user = await User.create(data);
    console.log(color.FgGreen, 'User created successfully.', color.Reset);
    
    if(data.role === 'vendor') {
        const newData = filterObj(req.body, 'national_id');
        newData.user_id = user.id;
        // create vendor
        // ,,,,,,,,,,,,
    }

    if(data.role === 'customer') {
        // create cart to get cart id
        // ,,,,,,,,,,,,,,,,,,,,,,,,,, 

        const newData = {user_id: user.id};
        // create the customer
        // ,,,,,,,,,,,,,,,,,,,
    }
    // Create Token
    // ,,,,,,,,,,,,

    // create a secret token 
    const secret_token = user.createSecretToken();
    await user.save();
    console.log(color.FgRed, `Secret token: ${secret_token}`, color.Reset);


    // send email to user with verification link
    await new Email(user, secret_token).verifyAccount();
    console.log(color.FgMagenta, 'Verification email sent successfully.', color.Reset);

    res.status(201).json({
        status: 'success',
        data: {
            user
        }
    })
});
