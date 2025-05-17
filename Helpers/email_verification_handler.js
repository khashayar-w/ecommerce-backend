const nodemailer = require('nodemailer');
const { CustomError } = require('../Errors/class-errors');

const sendEmail = async( to , subject , text)=>{
    try {
        const transporter = nodemailer.createTransport({
            service:"gmail",
            auth:{
                user:process.env.EMAIL_USER,
                pass:process.env.EMAIL_PASS,
            }
        });
        const mailOptions={
            from:process.env.EMAIL_USER,
            to,
            subject,
            text,
        };
        await transporter.sendMail(mailOptions);
        console.log('Email sent')
    } catch (error) {
        console.error('sending email was failed' , error);
        throw new CustomError('Failed to send email',)
    }
}


module.exports = sendEmail ; 
