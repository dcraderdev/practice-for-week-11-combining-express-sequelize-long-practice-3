// Instantiate router - DO NOT MODIFY
const express = require('express');
const router = express.Router();

// Import model(s)
const { Classroom, Supply, StudentClassroom, Student, sequelize } = require('../db/models');
const { Op } = require('sequelize');

// List of classrooms
router.get('/', async (req, res, next) => {
    let errorResult = { errors: [], count: 0, pageCount: 0 };

  // Phase 6B: Classroom Search Filters
  /*
        name filter:
        
            If the name query parameter exists, set the name query
                filter to find a similar match to the name query parameter.
            For example, if name query parameter is 'Ms.', then the
                query should match with classrooms whose name includes 'Ms.'

        studentLimit filter:
            If the studentLimit query parameter includes a comma
                And if the studentLimit query parameter is two numbers separated
                    by a comma, set the studentLimit query filter to be between
                    the first number (min) and the second number (max)
                But if the studentLimit query parameter is NOT two integers
                    separated by a comma, or if min is greater than max, add an
                    error message of 'Student Limit should be two integers:
                    min,max' to errorResult.errors
            If the studentLimit query parameter has no commas
                And if the studentLimit query parameter is a single integer, set
                    the studentLimit query parameter to equal the number
                But if the studentLimit query parameter is NOT an integer, add
                    an error message of 'Student Limit should be a integer' to
                    errorResult.errors 
    */
  const where = {};

  // Your code here
  if(req.query.name){
    where.name = { [Op.like] : `%${req.query.name}%` }
  }





  if(req.query.studentLimit){
    let [num1, num2] = req.query.studentLimit.split(',')
    if(!isNaN(num1) && !isNaN(num2) && num2 > num1) {
        where.studentLimit = { [Op.between]: [num1, num2]}
    }
    if(!isNaN(num1) && num2 === undefined){
        where.studentLimit = num1
    }
    if(isNaN(num1) && num2 === undefined){
        errorResult.errors.push(["Student Limit should be an integer"])
    }
    else{
        errorResult.errors.push(["Student Limit should be two numbers: min,max"])
    }
  }

  const classrooms = await Classroom.findAll({
    attributes: [
        'id',
        'name',
        'studentLimit',
        'createdAt',
        'updatedAt',
        [sequelize.fn("AVG", sequelize.col('grade')),'avgGrade'],
        [sequelize.fn("COUNT", sequelize.col('studentId')),'numStudents'],
    ],
    where,
    order: ['name'],
    include: {
        model: StudentClassroom,
        attributes: []
    },
    group: ['Classroom.id'],
  });



//   console.log(errorResult.errors.length);

  if(errorResult.errors.length){
    return res.status(400).json(errorResult)
  }
  console.log(classrooms);

  res.json(classrooms);
});

// Single classroom
router.get('/:id', async (req, res, next) => {
  let errorResult = { errors: [], count: 0, pageCount: 0 };

  let classroom = await Classroom.findByPk(req.params.id, {
    attributes: ['id', 'name', 'studentLimit'],
    // Phase 7:
    // Include classroom supplies and order supplies by category then
    // name (both in ascending order)
    // Include students of the classroom and order students by lastName
    // then firstName (both in ascending order)
    // (Optional): No need to include the StudentClassrooms
    // Your code here

    include:[
        {
            model: Supply,
            attributes: [`id`, `name`, `category`,`handed`],
            order: [['category'],['name']]
        },
        {
            model: Student,
            attributes: [`id`, `firstName`,`lastName`,`leftHanded`],
            order: [['lastName'],['firstName']],
            include:{
                model: StudentClassroom,
                attributes:[]
            }
        }
    ]

  });

  if (!classroom) {
    res.status(404);
    res.send({ message: 'Classroom Not Found' });
  }

  classroom = classroom.toJSON();

  classroom.supplyCount = await Supply.count({
    where: { classroomId: req.params.id },
  });

//   console.log(req.params.id == classroom.id );

  classroom.studentCount = await StudentClassroom.count({
    where: { classroomId: classroom.id },
  });
  classroom.overloaded =
    classroom.studentCount > classroom.studentLimit ? true : false;

  let totalGrade = await StudentClassroom.sum('grade', {
    where: { classroomId: classroom.id },
  });
  classroom.avgGrade = totalGrade / classroom.studentCount;

  // Phase 5: Supply and Student counts, Overloaded classroom
  // Phase 5A: Find the number of supplies the classroom has and set it as
  // a property of supplyCount on the response
  // Phase 5B: Find the number of students in the classroom and set it as
  // a property of studentCount on the response
  // Phase 5C: Calculate if the classroom is overloaded by comparing the
  // studentLimit of the classroom to the number of students in the
  // classroom
  // Optional Phase 5D: Calculate the average grade of the classroom

  // Your code here

  if(errorResult.errors.length){
    res.status(400).json(errorResult)
  }

  res.json(classroom);
});

// Export class - DO NOT MODIFY
module.exports = router;
