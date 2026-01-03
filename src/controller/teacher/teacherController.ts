


// teacher login implementation

import { Request, Response } from "express";
import sequelize from "../../database/connection";
import { QueryTypes } from "sequelize";
import bcrypt from 'bcrypt'
import generateJWTToken from "../../services/secureTokenService";


interface ITeacherData{
    teacherPassword : string,
    id : string
}

const teacherLogin = async(req:Request,res:Response)=>{
    const {teacherEmail,teacherPassword,teacherInstituteNumber} = req.body
    if(!teacherEmail || !teacherPassword || !teacherInstituteNumber){
        return res.status(400).json({
            message : "Please provide teacherEmail, teacherPassword, teacherInstituteNumber"
        })
    }
    // query teacher_* whole database vitra query garnu parxa
    const teacherData : ITeacherData[] = await sequelize.query(`SELECT * FROM teacher_${teacherInstituteNumber} WHERE teacherEmail = ? `,{
        type : QueryTypes.SELECT,
        replacements : [teacherEmail]
    })
    if(teacherData.length == 0){
        return res.status(404).json({
            message : "Invalid credentials"
        })
    }
    // check password now
  const isPasswordMatched =  bcrypt.compareSync(teacherPassword,teacherData[0].teacherPassword)
  if(!isPasswordMatched){
    res.status(400).json({
        message : "Invalid credentials!!!!"
    })
  }else{
    // token generation
   const token = await generateJWTToken({id : teacherData[0].id,instituteNumber: teacherInstituteNumber})
   res.status(201).json({
    message : "Teacher logged in",
    data : {
        teacherToken : token,
        teacherInstituteNumber,
         teacherEmail
    }
   })

  }

}


export {teacherLogin}
