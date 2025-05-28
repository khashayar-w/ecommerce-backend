const pool = require('../server')
const {DataBaseError , CustomError} = require('../Errors/class-errors');
const { object } = require('joi');


class UsersModel{

    static getUserByEmail = async(email)=>{
        try {
            const [user] = await pool.query('select * from e_commerce.users where email = ? ',[email]);
            return user.length > 0 ? user[0] : null;
        } catch (error) {
            throw new DataBaseError(error.message || 'Database error occurred.')
        }

    };

    static storeVerificationCode = async(email , code)=>{
        try {
            const [result] = await pool.query('insert into e_commerce.email_verification (email,code)  values(?,?) ',[email , code]);
            if(!result || result.affectedRows === 0 ){
                throw new DataBaseError('Failed to store  verification code.',500)
            }
        } catch (error) {
            throw new DataBaseError(error.message || 'Database error occurred.')
        }
    };

    static getEmailByCode = async(code)=>{
        try {
            const [email] = await pool.query('select email from e_commerce.email_verification where code=?',[code]);
            return email.length > 0 ? email[0] : null ; 
        
            
        } catch (error) {
            throw new DataBaseError(error.message || 'Database error occurred.')
        }
    };

    static register =async(username,email,password)=>{

        try {
            const [result] = await pool.query('insert into e_commerce.users (username,email,password) values(?,?,?)',[username,email,password])
            if(!result || result.affectedRows === 0){
                throw new DataBaseError(
                  "Failed to insert user data into the database.",500
                );
            }
            return result;
        } catch (error) {
            throw new DataBaseError( error.message || "Database  error occurred")
        }
    };
    
    static deleteVerificationCode = async(email)=>{
        try {
            const [result]  =await pool.query('delete code from e_commerce.email_verification where email=?',[email])
            if(!result || result.affectedRows === 0){
                throw new DataBaseError('Failed to delete code')
            }
        } catch (error) {
            throw new DataBaseError(error.message || 'Database error occurred.')
        }
    }

    static login = async(email)=>{
        try {
            const result = await this.getUserByEmail(email);
            return result
        } catch (error) {
            throw new DataBaseError(error.message || 'Database error occurred')
        }
    }

    static getUserInfo = async(userId)=>{
        try {
            const [user] = await pool.query('select * from e_commerce.users where user_id=?',[userId]);
            return user[0]
        } catch (error) {
            throw new DataBaseError(error.message || 'Database error occurred')
        }

    }
 

    static updateInfo = async(userId , updatedFields)=>{
        try { 
            const fields = Object.keys(updatedFields)
            .map((field) => `${field}=?`)
            .join(", ");
            const values = Object.values(updatedFields);
            values.push(userId)
            const [newUserInformation] = await pool.query(`update e_commerce.users set ${fields} where user_id=? `,values)
            if(!newUserInformation || newUserInformation.affectedRows === 0){
                throw new DataBaseError('User information was not updated',500)
            }
            
        } catch (error) {
            throw new DataBaseError(error.message || "Database error occurred")
        }
    }

}


module.exports = UsersModel