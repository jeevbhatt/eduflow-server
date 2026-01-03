



/* 
chapters 
post -- /course-chapter/:courseId -- chapter add garna 
get -- /course-chapter/:courseId - fetch chapters of that chapter id 

*/

import { Request, Response } from "express";
import { IExtendedRequest } from "../../../../middleware/type";
import sequelize from "../../../../database/connection";
import { QueryTypes } from "sequelize";


const addChapterToCourse = async(req:IExtendedRequest,res:Response)=>{
    const {courseId} = req.params 
    const instituteNumber = req.user?.currentInstituteNumber; 
    const {chapterName,chapterDuration,chapterLevel} = req.body 
    if(!chapterName || !chapterDuration || !chapterLevel || !courseId){
        return res.status(400).json({
            message : "Please provide chapterName, chapterDuration, chapterLevel"
        })
    }
    // check if course exist or not 
   const [course] =  await sequelize.query(`SELECT * FROM course_${instituteNumber} WHERE id=?`,{
        replacements  : [courseId],
        type : QueryTypes.SELECT
    })

    if(!course){
        return res.status(404).json({
            message : "No course found with that id"
        })
    }

    const [courseChapter] =  await sequelize.query(`SELECT * FROM course_chapter_${instituteNumber} WHERE chapterName=? AND courseId=?`,{
        replacements : [chapterName,courseId], 
        type : QueryTypes.SELECT
    })
    if(courseChapter){
        return res.status(400).json({
            message : "ALready exist with that chapterName in that course"
        })
    }

    // add chapter data to chapter table 
    const data = await sequelize.query(`INSERT INTO course_chapter_${instituteNumber}(chapterName,chapterLevel,chapterDuration,courseId) VALUES(?,?,?,?)`,{
        replacements : [chapterName,chapterLevel, chapterDuration,courseId], 
        type : QueryTypes.INSERT
    })

    res.status(200).json({
        messsage : "Chapter added successfully"
    })


}

const fetchCourseChapters = async (req:IExtendedRequest,res:Response)=>{
      const {courseId} = req.params 
    const instituteNumber = req.user?.currentInstituteNumber; 
    if(!courseId) return res.status(400).json({message : "Please provide courseId"})
    const [data] = await sequelize.query(`SELECT * FROM course_chapter_${instituteNumber} WHERE courseId=?`)
    if(data){
        res.status(200).json({
            message : "CHapters fetched", data 
        })
    }else{
        res.status(404).json({
            message : "CHapters not found", data : []
        })
    }
}

export {addChapterToCourse, fetchCourseChapters}